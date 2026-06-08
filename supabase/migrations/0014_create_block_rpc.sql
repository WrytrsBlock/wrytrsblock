-- ───────────────────────────────────────────────────────────────────────────
-- 0014_create_block_rpc.sql
-- Production-safe Block creation via a SECURITY DEFINER RPC. The function runs
-- with elevated privileges (so it can't be blocked by table RLS), but it:
--   • rejects anonymous callers (auth.uid() must be non-null),
--   • forces created_by = auth.uid() internally (no client-supplied owner),
--   • creates the workspace (+ owner membership), the block (+ lead membership),
--     and an optional invited collaborator, atomically,
--   • returns the new block id + slug.
-- Normal RLS stays enabled for all reads/updates — only this trusted creation
-- path is elevated.
-- ───────────────────────────────────────────────────────────────────────────

create or replace function public.create_user_block(
  p_title         text,
  p_tagline       text    default null,
  p_block_type    text    default 'collaboration',
  p_kind          text    default 'Other',
  p_category      text    default null,
  p_price         integer default null,
  p_visibility    text    default 'Public',
  p_party         jsonb   default null,
  p_invite_handle text    default null
)
returns table (block_id uuid, block_slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_ws      uuid;
  v_slug    text;
  v_id      uuid;
  v_name    text;
  v_invitee uuid;
begin
  -- 5) reject anonymous users
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- find the caller's workspace, or create a personal one (owned by them)
  select w.id into v_ws
  from public.workspaces w
  join public.workspace_members wm on wm.workspace_id = w.id
  where wm.user_id = v_uid
  order by w.created_at
  limit 1;

  if v_ws is null then
    select coalesce(nullif(pr.display_name, ''), nullif(pr.handle, ''), 'studio')
      into v_name
    from public.profiles pr
    where pr.id = v_uid;
    v_name := coalesce(v_name, 'studio');

    insert into public.workspaces (name, slug, description, created_by)
    values (
      v_name || '''s Studio',
      lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(v_uid::text, 6),
      'Personal workspace',
      v_uid
    )
    returning id into v_ws;

    insert into public.workspace_members (workspace_id, user_id, role)
    values (v_ws, v_uid, 'owner')
    on conflict do nothing;
  end if;

  -- unique slug within the workspace
  v_slug := coalesce(
    nullif(trim(both '-' from lower(regexp_replace(coalesce(p_title, 'block'), '[^a-zA-Z0-9]+', '-', 'g'))), ''),
    'block'
  );
  if exists (select 1 from public.blocks where workspace_id = v_ws and slug = v_slug) then
    v_slug := v_slug || '-' || left(md5(random()::text), 4);
  end if;

  -- create the block (created_by forced to the caller)
  insert into public.blocks (
    workspace_id, slug, title, tagline, block_type, kind,
    category, price, visibility, party, created_by, lead_id
  )
  values (
    v_ws, v_slug, p_title, p_tagline,
    p_block_type::block_type, p_kind::block_kind,
    p_category::block_category, p_price, p_visibility::block_visibility, p_party,
    v_uid, v_uid
  )
  returning id into v_id;

  -- creator is the lead member (the on_block_created trigger may also do this)
  insert into public.block_members (block_id, user_id, role)
  values (v_id, v_uid, 'lead')
  on conflict do nothing;

  -- optional invited collaborator (never fails block creation)
  if p_invite_handle is not null and length(trim(p_invite_handle)) > 0 then
    begin
      select cp.id into v_invitee
      from public.creator_profiles cp
      where lower(cp.handle) = lower(replace(p_invite_handle, '@', ''))
      limit 1;
      if v_invitee is not null and v_invitee <> v_uid then
        insert into public.block_members (block_id, user_id, role)
        values (v_id, v_invitee, 'collaborator')
        on conflict do nothing;
      end if;
    exception when others then
      null;
    end;
  end if;

  return query select v_id, v_slug;
end;
$$;

-- 5/6) only authenticated users may call it; anon is denied
revoke all on function public.create_user_block(text,text,text,text,text,integer,text,jsonb,text) from public;
revoke all on function public.create_user_block(text,text,text,text,text,integer,text,jsonb,text) from anon;
grant execute on function public.create_user_block(text,text,text,text,text,integer,text,jsonb,text) to authenticated;

notify pgrst, 'reload schema';
