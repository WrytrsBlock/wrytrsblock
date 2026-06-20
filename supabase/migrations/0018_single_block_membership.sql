-- 0018_single_block_membership.sql
-- CORE COLLABORATION REFACTOR — one Block, one shared workspace, membership-based.
--
-- This makes block_members the single source of truth for "who is in a Block",
-- removes the request-to-create system, and lets every member (including those
-- still "invited") see the SAME Block row — no per-user duplication.
--
-- Pragmatic mapping (kept to avoid a risky enum rewrite on the live core):
--   role   'lead'      == Owner      |  'collaborator' == Member   (mapped in app)
--   status 'accepted'  == Active     |  'invited'      == Pending
--   Decline / Leave / Remove DELETE the membership row ("removed from
--   block_members"), so there is no lingering per-user state.
-- The app presents Owner/Member and Pending/Active labels over these values.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) SHARED VISIBILITY — the core fix.
-- blocks were only visible via workspace membership, so an invited collaborator
-- (a block_members row but NOT in the owner's workspace) could not see the Block
-- at all. Add a membership-based SELECT policy so all members see the one Block.
-- (is_block_member is status-agnostic: an 'invited' row already counts.)
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "blocks visible to members" on public.blocks;
create policy "blocks visible to members"
  on public.blocks for select
  to authenticated
  using (public.is_block_member(id));

-- Archive flag (status active | archived) without touching the block_status enum.
alter table public.blocks
  add column if not exists archived_at timestamptz;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) MEMBERSHIP RPCs (SECURITY DEFINER, authenticated-only). All mutations to
-- membership go through these so the rules are enforced server-side regardless
-- of RLS drift.
-- ─────────────────────────────────────────────────────────────────────────────

-- Owner invites collaborators by @handle. Adds 'invited' rows (Pending).
create or replace function public.invite_to_block(p_block_id uuid, p_handles text[])
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_handle  text;
  v_invitee uuid;
  v_count   int := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.block_members
    where block_id = p_block_id and user_id = v_uid and role = 'lead'
  ) then
    raise exception 'Only the Block owner can invite collaborators'
      using errcode = '42501';
  end if;

  foreach v_handle in array coalesce(p_handles, '{}'::text[]) loop
    select cp.id into v_invitee
    from public.creator_profiles cp
    where lower(cp.handle) = lower(replace(trim(v_handle), '@', ''))
    limit 1;

    if v_invitee is not null and v_invitee <> v_uid then
      insert into public.block_members
        (block_id, user_id, role, status, invited_by, invited_at)
      values
        (p_block_id, v_invitee, 'collaborator', 'invited', v_uid, now())
      on conflict (block_id, user_id) do nothing;
      if found then v_count := v_count + 1; end if;
    end if;
  end loop;

  return v_count;
end; $$;

-- Invitee accepts (→ Active) or declines (→ row removed).
create or replace function public.respond_to_invitation(p_block_id uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_accept then
    update public.block_members
      set status = 'accepted', joined_at = now()
      where block_id = p_block_id and user_id = v_uid and status = 'invited';
  else
    delete from public.block_members
      where block_id = p_block_id and user_id = v_uid and status = 'invited';
  end if;
end; $$;

-- A member leaves (row removed). The owner cannot leave — they archive/delete.
create or replace function public.leave_block(p_block_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if exists (
    select 1 from public.block_members
    where block_id = p_block_id and user_id = v_uid and role = 'lead'
  ) then
    raise exception 'The owner cannot leave their own Block' using errcode = '42501';
  end if;
  delete from public.block_members
    where block_id = p_block_id and user_id = v_uid;
end; $$;

-- Owner removes a member (not themselves, not another owner row).
create or replace function public.remove_block_member(p_block_id uuid, p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.block_members
    where block_id = p_block_id and user_id = v_uid and role = 'lead'
  ) then
    raise exception 'Only the Block owner can remove members' using errcode = '42501';
  end if;
  delete from public.block_members
    where block_id = p_block_id and user_id = p_user_id and role <> 'lead';
end; $$;

-- Owner archives the Block (stays readable, marked archived for everyone).
create or replace function public.archive_block(p_block_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.block_members
    where block_id = p_block_id and user_id = v_uid and role = 'lead'
  ) then
    raise exception 'Only the Block owner can archive this Block'
      using errcode = '42501';
  end if;
  update public.blocks set archived_at = now() where id = p_block_id;
end; $$;

-- Lock down + expose the RPCs to authenticated callers only.
revoke all on function public.invite_to_block(uuid, text[]) from public, anon;
revoke all on function public.respond_to_invitation(uuid, boolean) from public, anon;
revoke all on function public.leave_block(uuid) from public, anon;
revoke all on function public.remove_block_member(uuid, uuid) from public, anon;
revoke all on function public.archive_block(uuid) from public, anon;
grant execute on function public.invite_to_block(uuid, text[]) to authenticated;
grant execute on function public.respond_to_invitation(uuid, boolean) to authenticated;
grant execute on function public.leave_block(uuid) to authenticated;
grant execute on function public.remove_block_member(uuid, uuid) to authenticated;
grant execute on function public.archive_block(uuid) to authenticated;

-- NOTE: this migration is intentionally ADDITIVE — it does not drop the legacy
-- request system, so it is safe to apply while the current app is still live.
-- The request tables/RPCs are removed in 0019, AFTER the new UI is deployed.

notify pgrst, 'reload schema';
