-- ───────────────────────────────────────────────────────────────────────────
-- 0028_fan_out_block_notification.sql
-- Generic Block-activity notification fan-out. Regular users have no INSERT
-- policy on notifications (see 0001) — every insert runs inside a SECURITY
-- DEFINER function, same pattern as send/accept/decline_block_request and
-- delete_user_block. Rather than one bespoke function per activity type, this
-- single RPC is the reusable choke point for ALL of them (chat message, file
-- upload, voice note, split sheet update, and any future activity type): it
-- verifies the caller is an accepted member of the Block, inserts a
-- notification row for every OTHER accepted member, and returns their ids so
-- the calling Server Action knows exactly who to consider for an email too.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function public.fan_out_block_notification(
  p_block_id uuid,
  p_kind     text,
  p_title    text,
  p_body     text,
  p_link     text default null
)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if not public.is_block_member(p_block_id) then
    raise exception 'Not a member of this Block' using errcode = '42501';
  end if;

  return query
  insert into public.notifications (recipient_id, actor_id, kind, title, body, link)
  select bm.user_id, v_uid, p_kind, p_title, p_body, p_link
  from public.block_members bm
  where bm.block_id = p_block_id
    and bm.status = 'accepted'
    and bm.user_id <> v_uid
  returning recipient_id;
end;
$$;

revoke all on function public.fan_out_block_notification(uuid, text, text, text, text) from public;
revoke all on function public.fan_out_block_notification(uuid, text, text, text, text) from anon;
grant execute on function public.fan_out_block_notification(uuid, text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
