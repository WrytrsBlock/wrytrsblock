-- ───────────────────────────────────────────────────────────────────────────
-- 0016_block_request_rpcs.sql
-- Reliable Start-Block workflow via SECURITY DEFINER RPCs (same pattern as
-- create_user_block / delete_user_block) so the multi-step writes are never
-- blocked by RLS. Each validates auth.uid() and the caller's role.
--   send_block_request   → records a pending request + notifies the recipient.
--   accept_block_request → creates the Block + adds BOTH members (accepted),
--                          seeds a General channel, links the request, notifies
--                          the requester, returns the new Block slug.
--   decline_block_request→ marks declined + notifies the requester.
-- ───────────────────────────────────────────────────────────────────────────

-- ── send ─────────────────────────────────────────────────────────────────────
create or replace function public.send_block_request(
  p_recipient uuid,
  p_title     text,
  p_type      text default 'collaboration',
  p_intro     text default '',
  p_outcome   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_name   text;
  v_handle text;
  v_id     uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_recipient is null then
    raise exception 'Missing recipient' using errcode = 'P0002';
  end if;
  if p_recipient = v_uid then
    raise exception 'You cannot start a Block with yourself' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.block_requests
    where requester_id = v_uid and recipient_id = p_recipient and status = 'pending'
  ) then
    raise exception 'You already have a pending request with this creator'
      using errcode = '23505';
  end if;

  select coalesce(nullif(display_name, ''), nullif(handle, '')), handle
    into v_name, v_handle
  from public.creator_profiles where id = v_uid;

  insert into public.block_requests (
    requester_id, recipient_id, requester_name, requester_handle,
    block_title, block_type, intro_message, expected_outcome, status
  )
  values (
    v_uid, p_recipient, coalesce(v_name, 'A creator'), v_handle,
    coalesce(nullif(trim(p_title), ''), 'Collaboration'),
    p_type::block_type,
    coalesce(nullif(trim(p_intro), ''), 'Let''s collaborate.'),
    nullif(trim(p_outcome), ''), 'pending'
  )
  returning id into v_id;

  insert into public.notifications (recipient_id, actor_id, kind, title, body, link)
  values (
    p_recipient, v_uid, 'block_request',
    coalesce(v_name, 'A creator') || ' wants to start a Block with you',
    nullif(trim(p_intro), ''), '/notifications'
  );

  return v_id;
end;
$$;

-- ── accept ───────────────────────────────────────────────────────────────────
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

  -- recipient's workspace (or create one)
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

  insert into public.blocks
    (workspace_id, slug, title, tagline, block_type, created_by, lead_id)
  values
    (v_ws, v_slug, r.block_title, r.intro_message, r.block_type, v_uid, r.requester_id)
  returning id into v_block;

  -- both creators are accepted members (so the Block workspace + chat unlock)
  insert into public.block_members (block_id, user_id, role, status)
  values (v_block, r.requester_id, 'lead', 'accepted') on conflict do nothing;
  insert into public.block_members (block_id, user_id, role, status)
  values (v_block, v_uid, 'collaborator', 'accepted') on conflict do nothing;
  update public.block_members set status = 'accepted'
  where block_id = v_block and user_id in (v_uid, r.requester_id);

  -- a General channel for the Block (best-effort)
  begin
    insert into public.channels (workspace_id, block_id, name, kind, created_by)
    values (v_ws, v_block, 'General', 'public', v_uid);
  exception when others then null;
  end;

  update public.block_requests
  set status = 'accepted', block_id = v_block, responded_at = now()
  where id = r.id;

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

-- ── decline ──────────────────────────────────────────────────────────────────
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

  insert into public.notifications (recipient_id, actor_id, kind, title, link)
  values (r.requester_id, v_uid, 'block_declined',
          'Your Block Request was declined', '/marketplace');

  return true;
end;
$$;

revoke all on function public.send_block_request(uuid, text, text, text, text) from public, anon;
revoke all on function public.accept_block_request(uuid) from public, anon;
revoke all on function public.decline_block_request(uuid) from public, anon;
grant execute on function public.send_block_request(uuid, text, text, text, text) to authenticated;
grant execute on function public.accept_block_request(uuid) to authenticated;
grant execute on function public.decline_block_request(uuid) to authenticated;

notify pgrst, 'reload schema';
