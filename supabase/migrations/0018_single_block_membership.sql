-- 0018_single_block_membership.sql
-- CANONICAL BLOCK REQUEST MODEL — one Block, one shared workspace, membership-based.
--
-- There is exactly ONE way collaboration begins: a creator sends a Block Request
-- (0016: send_block_request), the recipient Accepts (accept_block_request), and
-- that single action creates ONE shared Block with the requester as Owner and the
-- recipient as Collaborator. block_members is the single source of truth for who
-- is in a Block; every member (owner + collaborators) sees the SAME Block row.
--
-- This migration:
--   1) makes Blocks visible to all their members (not just the owner's workspace),
--   2) hardens accept_block_request so it creates the Block + both memberships
--      EXACTLY ONCE, with the correct owner/collaborator roles and no double-owner,
--   3) provides block-management RPCs (leave / remove / archive).
--
-- Role/status mapping the app presents over these values:
--   role   'lead' == Owner/Admin   |  'collaborator' == Collaborator
--   status 'accepted' == Active     |  (no 'invited' state in the canonical flow:
--                                       accept adds members directly as accepted).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) SHARED VISIBILITY — the core fix.
-- Blocks were only visible via workspace membership, so the requester (who is a
-- block_members 'lead' but NOT in the recipient's workspace, since the Block is
-- created in the recipient's workspace on accept) could not SELECT the Block —
-- it never appeared in their My Blocks. A membership-based SELECT policy makes
-- every member see the one shared Block.
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
-- 2) CANONICAL accept_block_request — supersedes the 0016 definition.
--
-- Fixes vs. 0016:
--   • created_by is set to the REQUESTER, so the on_block_created trigger makes
--     the requester the 'lead' (Owner). 0016 set created_by to the accepter,
--     which made the trigger insert the ACCEPTER as a second 'lead' — leaving the
--     Block with two owners and no collaborator.
--   • the recipient is inserted exactly once as 'collaborator' / 'accepted'.
--   • the original pending block_request notification is cleared, so it no longer
--     lingers in the recipient's notification list after they accept.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.accept_block_request(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  r       public.block_requests%rowtype;
  v_ws    uuid;
  v_slug  text;
  v_block uuid;
  v_name  text;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into r from public.block_requests where id = p_request_id;
  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  if r.recipient_id <> v_uid then
    raise exception 'This request is not addressed to you' using errcode = '42501';
  end if;
  if r.status <> 'pending' then
    raise exception 'Request already %', r.status using errcode = '22023';
  end if;

  -- recipient's workspace (or create one) — the Block lives here, but visibility
  -- is membership-based so the requester sees it too.
  select w.id into v_ws
  from public.workspaces w
  join public.workspace_members wm on wm.workspace_id = w.id
  where wm.user_id = v_uid
  order by w.created_at
  limit 1;

  if v_ws is null then
    select coalesce(nullif(display_name, ''), nullif(handle, ''), 'studio')
      into v_name from public.profiles where id = v_uid;
    v_name := coalesce(v_name, 'studio');
    insert into public.workspaces (name, slug, description, created_by)
    values (
      v_name || '''s Studio',
      lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(v_uid::text, 6),
      'Personal workspace', v_uid
    )
    returning id into v_ws;
    insert into public.workspace_members (workspace_id, user_id, role)
    values (v_ws, v_uid, 'owner') on conflict do nothing;
  end if;

  v_slug := coalesce(
    nullif(trim(both '-' from lower(regexp_replace(r.block_title, '[^a-zA-Z0-9]+', '-', 'g'))), ''),
    'block'
  );
  if exists (select 1 from public.blocks where workspace_id = v_ws and slug = v_slug) then
    v_slug := v_slug || '-' || left(md5(random()::text), 4);
  end if;

  -- ONE Block. created_by = requester → the on_block_created trigger inserts the
  -- requester as 'lead' (Owner) exactly once. lead_id mirrors that.
  insert into public.blocks
    (workspace_id, slug, title, tagline, block_type, created_by, lead_id)
  values
    (v_ws, v_slug, r.block_title, r.intro_message, r.block_type, r.requester_id, r.requester_id)
  returning id into v_block;

  -- The recipient (accepter) joins as a Collaborator, exactly once.
  insert into public.block_members (block_id, user_id, role, status)
  values (v_block, v_uid, 'collaborator', 'accepted')
  on conflict (block_id, user_id) do update
    set role = 'collaborator', status = 'accepted';

  -- Safety net: the requester's trigger-created row is 'lead'/'accepted'. Ensure
  -- the status is 'accepted' without ever changing their 'lead' role.
  update public.block_members
    set status = 'accepted'
    where block_id = v_block and user_id = r.requester_id;

  -- A General channel for the Block (best-effort).
  begin
    insert into public.channels (workspace_id, block_id, name, kind, created_by)
    values (v_ws, v_block, 'General', 'public', v_uid);
  exception when others then null;
  end;

  -- Link + close the request so it leaves the recipient's pending inbox.
  update public.block_requests
  set status = 'accepted', block_id = v_block, responded_at = now()
  where id = r.id;

  -- Clear the original "wants to start a Block" notification for the recipient,
  -- so the pending invitation notification is removed after acceptance.
  delete from public.notifications
  where recipient_id = v_uid
    and actor_id = r.requester_id
    and kind = 'block_request';

  -- Exactly one acceptance notification to the requester.
  insert into public.notifications (recipient_id, actor_id, kind, title, body, link)
  values (
    r.requester_id, v_uid, 'block_accepted',
    'Your Block Request was accepted',
    'Your collaboration on "' || r.block_title || '" is now active.',
    '/blocks/' || v_slug
  );

  return v_slug;
end;
$$;

-- decline also clears the recipient's pending request notification (supersedes
-- the 0016 body only to add the notification cleanup).
create or replace function public.decline_block_request(p_request_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r     public.block_requests%rowtype;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  select * into r from public.block_requests where id = p_request_id;
  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  if r.recipient_id <> v_uid then
    raise exception 'This request is not addressed to you' using errcode = '42501';
  end if;

  update public.block_requests
  set status = 'declined', responded_at = now()
  where id = r.id;

  delete from public.notifications
  where recipient_id = v_uid
    and actor_id = r.requester_id
    and kind = 'block_request';

  insert into public.notifications (recipient_id, actor_id, kind, title, link)
  values (r.requester_id, v_uid, 'block_declined',
          'Your Block Request was declined', '/marketplace');

  return true;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) BLOCK-MANAGEMENT RPCs (SECURITY DEFINER, authenticated-only). These manage
-- the roster AFTER a Block exists; they do not start collaborations (that is the
-- Block Request flow's job). No invite RPC exists — inviting is sending a Request.
-- ─────────────────────────────────────────────────────────────────────────────

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

revoke all on function public.leave_block(uuid) from public, anon;
revoke all on function public.remove_block_member(uuid, uuid) from public, anon;
revoke all on function public.archive_block(uuid) from public, anon;
grant execute on function public.leave_block(uuid) to authenticated;
grant execute on function public.remove_block_member(uuid, uuid) to authenticated;
grant execute on function public.archive_block(uuid) to authenticated;

notify pgrst, 'reload schema';
