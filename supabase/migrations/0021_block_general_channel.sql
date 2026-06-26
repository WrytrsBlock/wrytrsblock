-- 0021_block_general_channel.sql
-- Every Block gets a General chat channel automatically — the Block workspace is
-- now the only place creator-to-creator communication happens (direct messages
-- were removed). This makes channel creation a property of the Block itself,
-- driven by the on_block_created trigger, so it is guaranteed for EVERY Block
-- regardless of how it was created (create_user_block, accept_block_request, or
-- any direct insert).
--
-- Additive + idempotent. No data is dropped or modified destructively.

-- 1) on_block_created now ALSO seeds a 'General' public channel (guarded so it
--    never creates a duplicate). Keeps the existing lead-membership + activity.
create or replace function public.handle_new_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.block_members (block_id, user_id, role)
    values (new.id, new.created_by, 'lead')
    on conflict do nothing;
  end if;

  insert into public.activity_events (block_id, workspace_id, actor_id, kind, text)
  values (new.id, new.workspace_id, new.created_by, 'create', 'created the Block');

  -- Auto-create the Block's General channel (only if it has none yet).
  if not exists (
    select 1 from public.channels where block_id = new.id
  ) then
    insert into public.channels (workspace_id, block_id, name, kind, created_by)
    values (new.workspace_id, new.id, 'General', 'public', new.created_by);
  end if;

  return new;
end;
$$;

-- 2) accept_block_request no longer creates its own channel — the trigger above
--    owns that now, so a request-accepted Block gets exactly one General channel
--    (the previous explicit insert here would have produced a duplicate).
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
  -- requester as 'lead' (Owner) AND seeds the General channel, exactly once.
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

  update public.block_members
    set status = 'accepted'
    where block_id = v_block and user_id = r.requester_id;

  update public.block_requests
  set status = 'accepted', block_id = v_block, responded_at = now()
  where id = r.id;

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

-- 3) Backfill: every existing Block that has no channel gets a General one.
insert into public.channels (workspace_id, block_id, name, kind, created_by)
select b.workspace_id, b.id, 'General', 'public', b.created_by
from public.blocks b
where not exists (
  select 1 from public.channels c where c.block_id = b.id
);

notify pgrst, 'reload schema';
