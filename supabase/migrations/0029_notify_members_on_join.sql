-- ───────────────────────────────────────────────────────────────────────────
-- 0029_notify_members_on_join.sql
-- "Block Join" notifications: when someone accepts a Block Request, every
-- EXISTING member (not just the requester) should hear about it — today that's
-- only the requester since accept_block_request only ever produces 2-member
-- Blocks, but this is written generically so it keeps working once a Block can
-- grow past 2 members. This is additive to the existing 'block_accepted'
-- notification (unchanged — that's the requester's "your request was
-- accepted" receipt); the new 'block_member_joined' kind is what the join
-- email in the notification system keys off. Body copied from 0024 verbatim
-- aside from step 6.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function public.accept_block_request(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  r       public.block_requests%rowtype;
  v_block uuid;
  v_slug  text;
  v_ws    uuid;
  v_name  text;
  v_chan  uuid;
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

  -- 1) Resolve the shared Block: reuse the send-time one, else create it now.
  v_block := r.block_id;
  if v_block is not null
     and not exists (select 1 from public.blocks where id = v_block) then
    v_block := null; -- linked Block was deleted; recreate below
  end if;

  if v_block is null then
    select w.id into v_ws
    from public.workspaces w
    join public.workspace_members wm on wm.workspace_id = w.id
    where wm.user_id = r.requester_id
    order by w.created_at
    limit 1;

    if v_ws is null then
      select coalesce(nullif(display_name, ''), nullif(handle, ''), 'studio')
        into v_name from public.profiles where id = r.requester_id;
      v_name := coalesce(v_name, 'studio');
      insert into public.workspaces (name, slug, description, created_by)
      values (
        v_name || '''s Studio',
        lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(r.requester_id::text, 6),
        'Personal workspace', r.requester_id
      )
      returning id into v_ws;
      insert into public.workspace_members (workspace_id, user_id, role)
      values (v_ws, r.requester_id, 'owner') on conflict do nothing;
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
      (v_ws, v_slug, r.block_title, r.intro_message, r.block_type, r.requester_id, r.requester_id)
    returning id into v_block;
  else
    select slug into v_slug from public.blocks where id = v_block;
  end if;

  -- 2) Both creators are members exactly once (idempotent).
  insert into public.block_members (block_id, user_id, role, status)
  values (v_block, r.requester_id, 'lead', 'accepted')
  on conflict (block_id, user_id) do update set status = 'accepted';

  insert into public.block_members (block_id, user_id, role, status)
  values (v_block, v_uid, 'collaborator', 'accepted')
  on conflict (block_id, user_id) do update
    set role = 'collaborator', status = 'accepted';

  -- 3) Ensure the General chat channel exists.
  select id into v_chan
  from public.channels
  where block_id = v_block
  order by created_at
  limit 1;
  if v_chan is null then
    insert into public.channels (workspace_id, block_id, name, kind, created_by)
    values (
      (select workspace_id from public.blocks where id = v_block),
      v_block, 'General', 'public', r.requester_id
    )
    returning id into v_chan;
  end if;

  -- 4) Seed a welcome system message so the chat opens with content (once).
  if not exists (select 1 from public.messages where channel_id = v_chan) then
    insert into public.messages (channel_id, author_id, body)
    values (
      v_chan, r.requester_id,
      '👋 Welcome to "' || r.block_title || '" — this is your shared Block chat.'
    );
  end if;

  -- 5) Link + close the request (valid block_id from here on).
  update public.block_requests
  set status = 'accepted', block_id = v_block, responded_at = now()
  where id = r.id;

  -- 6) Clear the recipient's pending notification + notify the requester that
  --    their specific request was accepted (unchanged from 0024).
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

  -- 7) NEW: notify every OTHER existing accepted member (today: just the
  --    requester, again — but this keeps working once Blocks can hold more
  --    than 2 people) that the new member joined. Distinct kind/copy from the
  --    "your request was accepted" receipt above, and this is the kind the
  --    Block Join email keys off.
  insert into public.notifications (recipient_id, actor_id, kind, title, body, link)
  select
    bm.user_id,
    v_uid,
    'block_member_joined',
    coalesce(nullif((select display_name from public.profiles where id = v_uid), ''), 'A collaborator')
      || ' joined your Block',
    coalesce(nullif((select display_name from public.profiles where id = v_uid), ''), 'A collaborator')
      || ' joined "' || r.block_title || '".',
    '/blocks/' || v_slug
  from public.block_members bm
  where bm.block_id = v_block
    and bm.status = 'accepted'
    and bm.user_id <> v_uid;

  return v_slug;
end;
$$;

notify pgrst, 'reload schema';
