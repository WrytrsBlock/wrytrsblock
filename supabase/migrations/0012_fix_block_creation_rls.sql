-- ───────────────────────────────────────────────────────────────────────────
-- 0012_fix_block_creation_rls.sql
-- Definitive fix for: new row violates row-level security policy for table
-- "workspaces" (and the matching blocks insert) when creating a Block.
--
-- Root cause: the live INSERT policy on public.workspaces had drifted from the
-- schema (migrations applied piecemeal). The app already writes
-- created_by = auth.uid(); this re-asserts the correct, secure INSERT policies
-- so an authenticated user can create their own workspace + block.
-- Idempotent: drops any existing INSERT policies first, then recreates.
-- ───────────────────────────────────────────────────────────────────────────

-- Make sure RLS is on (no-op if already enabled).
alter table public.workspaces enable row level security;
alter table public.blocks      enable row level security;

-- created_by should default to the caller, so inserts that omit it still pass.
alter table public.workspaces alter column created_by set default auth.uid();
alter table public.blocks      alter column created_by set default auth.uid();

-- ── workspaces: replace every INSERT policy with one correct policy ──────────
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'workspaces' and cmd = 'INSERT'
  loop
    execute format('drop policy if exists %I on public.workspaces', p.policyname);
  end loop;
end $$;

create policy "workspaces_insert_own"
  on public.workspaces
  for insert
  to authenticated
  with check (created_by = auth.uid());

-- ── blocks: same — owner-of-row + member-of-workspace ───────────────────────
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'blocks' and cmd = 'INSERT'
  loop
    execute format('drop policy if exists %I on public.blocks', p.policyname);
  end loop;
end $$;

create policy "blocks_insert_member_own"
  on public.blocks
  for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

-- Make sure the authenticated role can actually reach the tables (grants are
-- separate from RLS; missing grants also surface as policy failures).
grant insert, select, update on public.workspaces to authenticated;
grant insert, select, update on public.blocks      to authenticated;

-- Refresh PostgREST's schema cache so the new policies take effect immediately.
notify pgrst, 'reload schema';
