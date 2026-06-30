-- ───────────────────────────────────────────────────────────────────────────
-- 0025_notify_on_block_delete.sql
-- When a Block is deleted, notify every OTHER member so both parties know the
-- Block is gone (previously the collaborator just silently lost the Block).
-- We insert the notifications inside the SECURITY DEFINER RPC, before the
-- cascade removes block_members — regular users have no INSERT policy on
-- notifications, so this must happen here. The actor (deleter) isn't notified;
-- they performed the action.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function public.delete_user_block(p_block_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_owner uuid;
  v_lead  uuid;
  v_title text;
  v_actor text;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select created_by, lead_id, title
    into v_owner, v_lead, v_title
  from public.blocks
  where id = p_block_id;

  if not found then
    raise exception 'Block not found' using errcode = 'P0002';
  end if;

  -- Only the owner (creator) or the lead may delete.
  if not (v_uid = v_owner or v_uid = v_lead) then
    raise exception 'Only the Block owner can delete this Block'
      using errcode = '42501';
  end if;

  -- The deleter's display name, for the notification body.
  select coalesce(nullif(display_name, ''), nullif(handle, ''), 'A collaborator')
    into v_actor
  from public.creator_profiles
  where id = v_uid;

  -- Notify every other member before the cascade clears block_members.
  insert into public.notifications (recipient_id, actor_id, kind, title, body)
  select
    bm.user_id,
    v_uid,
    'block_deleted',
    'Block deleted',
    coalesce(v_actor, 'A collaborator')
      || ' deleted "' || coalesce(nullif(v_title, ''), 'a Block') || '".'
  from public.block_members bm
  where bm.block_id = p_block_id
    and bm.user_id <> v_uid;

  delete from public.blocks where id = p_block_id; -- cascade clears related rows
  return true;
end;
$$;

revoke all on function public.delete_user_block(uuid) from public;
revoke all on function public.delete_user_block(uuid) from anon;
grant execute on function public.delete_user_block(uuid) to authenticated;

notify pgrst, 'reload schema';
