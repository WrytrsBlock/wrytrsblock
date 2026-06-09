-- ───────────────────────────────────────────────────────────────────────────
-- 0015_delete_block_rpc.sql
-- Owner-only permanent Block deletion via a SECURITY DEFINER RPC. Validates that
-- the caller is authenticated AND is the Block's owner (created_by or lead_id),
-- then deletes the block row. Every block-scoped table references blocks(id)
-- ON DELETE CASCADE, so members, messages, tasks, files, comments, activity,
-- split sheets + entries, deliverables and service details are removed too.
-- Granted to authenticated only; anon is denied.
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
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select created_by, lead_id into v_owner, v_lead
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

  delete from public.blocks where id = p_block_id; -- cascade clears related rows
  return true;
end;
$$;

revoke all on function public.delete_user_block(uuid) from public;
revoke all on function public.delete_user_block(uuid) from anon;
grant execute on function public.delete_user_block(uuid) to authenticated;

notify pgrst, 'reload schema';
