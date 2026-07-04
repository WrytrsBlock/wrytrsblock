-- ───────────────────────────────────────────────────────────────────────────
-- 0030_block_media_accessible_to_members.sql
-- Fixes a real bug: block-media storage RLS only ever checked workspace
-- membership (see 0001's comment: "we allow access if the user is a member of
-- the workspace in the path's first segment"). But accept_block_request only
-- ever adds the joining collaborator to block_members — NOT workspace_members
-- (the Block lives in the requester's personal workspace). So any collaborator
-- who isn't the original workspace owner could send chat text fine
-- (is_channel_member is Block-scoped, fixed for exactly this reason in 0023)
-- but every file/voice-note upload or download in that Block silently failed
-- storage RLS: uploads never persisted (vanishing on refresh), and files the
-- other party *did* manage to upload couldn't be opened.
--
-- Fix, mirroring 0023's approach for channels: make block-media access
-- additionally satisfiable by block membership (via the path's second
-- segment, <workspace_id>/<block_id|shared>/<filename>), instead of forcing
-- collaborators into the owner's workspace_members (which would over-grant
-- them visibility into the owner's OTHER Blocks/projects in that workspace).
-- ───────────────────────────────────────────────────────────────────────────

create or replace function public.is_block_media_accessible(p_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_ws  text := split_part(p_name, '/', 1);
  v_blk text := split_part(p_name, '/', 2);
begin
  if v_ws ~ '^[0-9a-fA-F-]{36}$' and public.is_workspace_member(v_ws::uuid) then
    return true;
  end if;
  -- The second segment is the literal "shared" for non-Block-scoped uploads,
  -- so only attempt the block-membership check when it looks like a uuid.
  if v_blk ~ '^[0-9a-fA-F-]{36}$' and public.is_block_member(v_blk::uuid) then
    return true;
  end if;
  return false;
end;
$$;

drop policy if exists "block-media read" on storage.objects;
create policy "block-media read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'block-media'
    and public.is_block_media_accessible(name)
  );

drop policy if exists "block-media insert" on storage.objects;
create policy "block-media insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'block-media'
    and public.is_block_media_accessible(name)
  );

drop policy if exists "block-media delete" on storage.objects;
create policy "block-media delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'block-media'
    and public.is_block_media_accessible(name)
  );

notify pgrst, 'reload schema';
