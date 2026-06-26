-- 0022_pending_block_on_send.sql
-- SOURCE-OF-TRUTH CORRECTION: the shared Block is created the moment a Block
-- Request is SENT (owned by the requester, status pending), not at acceptance.
--
--   send    → creates the Block (requester = Owner/lead, + General channel via the
--             on_block_created trigger) AND a pending block_requests row linked to
--             it, AND notifies the recipient. The requester immediately sees the
--             Block as Pending in My Blocks.
--   accept  → REUSES that Block (no new Block): adds the recipient as Collaborator,
--             marks the request accepted, notifies the requester. Block goes active.
--   decline → DELETES the pending Block (cascades members/channel/activity) so it
--             leaves the requester's My Blocks, marks the request declined, notifies.
--
-- The recipient is NOT a block_members row until they accept, so they cannot see
-- the Block until acceptance — they act via the notification / request inbox.
-- Additive function redefinitions; no destructive table changes.

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
  v_ws     uuid;
  v_slug   text;
  v_block  uuid;
  v_title  text;
  v_intro  text;
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

  v_title := coalesce(nullif(trim(p_title), ''), 'Collaboration');
  v_intro := coalesce(nullif(trim(p_intro), ''), 'Let''s collaborate.');

  select coalesce(nullif(display_name, ''), nullif(handle, '')), handle
    into v_name, v_handle
  from public.creator_profiles where id = v_uid;

  -- requester's workspace (or create one) — the pending Block lives here.
  select w.id into v_ws
  from public.workspaces w
  join public.workspace_members wm on wm.workspace_id = w.id
  where wm.user_id = v_uid
  order by w.created_at
  limit 1;

  if v_ws is null then
    insert into public.workspaces (name, slug, description, created_by)
    values (
      coalesce(v_name, 'studio') || '''s Studio',
      lower(regexp_replace(coalesce(v_name, 'studio'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(v_uid::text, 6),
      'Personal workspace', v_uid
    )
    returning id into v_ws;
    insert into public.workspace_members (workspace_id, user_id, role)
    values (v_ws, v_uid, 'owner') on conflict do nothing;
  end if;

  v_slug := coalesce(
    nullif(trim(both '-' from lower(regexp_replace(v_title, '[^a-zA-Z0-9]+', '-', 'g'))), ''),
    'block'
  );
  if exists (select 1 from public.blocks where workspace_id = v_ws and slug = v_slug) then
    v_slug := v_slug || '-' || left(md5(random()::text), 4);
  end if;

  -- Create the pending Block NOW, owned by the requester. The on_block_created
  -- trigger adds the requester as 'lead' and seeds the General channel.
  insert into public.blocks
    (workspace_id, slug, title, tagline, block_type, created_by, lead_id)
  values
    (v_ws, v_slug, v_title, v_intro, p_type::block_type, v_uid, v_uid)
  returning id into v_block;

  insert into public.block_requests (
    requester_id, recipient_id, requester_name, requester_handle,
    block_title, block_type, intro_message, expected_outcome, status, block_id
  )
  values (
    v_uid, p_recipient, coalesce(v_name, 'A creator'), v_handle,
    v_title, p_type::block_type, v_intro,
    nullif(trim(p_outcome), ''), 'pending', v_block
  )
  returning id into v_id;

  insert into public.notifications (recipient_id, actor_id, kind, title, body, link)
  values (
    p_recipient, v_uid, 'block_request',
    coalesce(v_name, 'A creator') || ' wants to start a Block with you',
    v_intro, '/notifications'
  );

  return v_id;
end;
$$;

-- ── accept ───────────────────────────────────────────────────────────────────
-- Reuses the Block created at send time; never creates a second Block.
create or replace function public.accept_block_request(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  r      public.block_requests%rowtype;
  v_slug text;
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
  if r.block_id is null then
    raise exception 'This request has no Block' using errcode = 'P0002';
  end if;

  -- The recipient joins the EXISTING Block as a Collaborator, exactly once.
  insert into public.block_members (block_id, user_id, role, status)
  values (r.block_id, v_uid, 'collaborator', 'accepted')
  on conflict (block_id, user_id) do update
    set role = 'collaborator', status = 'accepted';

  update public.block_requests
  set status = 'accepted', responded_at = now()
  where id = r.id;

  select slug into v_slug from public.blocks where id = r.block_id;

  -- The pending notification has done its job — clear it for the recipient.
  delete from public.notifications
  where recipient_id = v_uid
    and actor_id = r.requester_id
    and kind = 'block_request';

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
-- Removes the pending Block entirely (no collaboration started) + notifies.
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

  -- Remove the pending Block — it never became an active collaboration. Cascades
  -- to its block_members, channel, and activity. (block_requests.block_id is
  -- 'on delete set null', so the declined request row survives for history.)
  if r.block_id is not null then
    delete from public.blocks where id = r.block_id;
  end if;

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

notify pgrst, 'reload schema';
