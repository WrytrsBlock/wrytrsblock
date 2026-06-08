-- ───────────────────────────────────────────────────────────────────────────
-- 0013_workspaces_policy_cleanup.sql
-- Final fix for: new row violates RLS policy for table "workspaces" on Block
-- creation, even though auth.uid() is the user and created_by = auth.uid().
--
-- Proven at runtime: the write reaches Postgres authenticated (auth.uid() works)
-- and created_by = auth.uid(), yet the INSERT is rejected. A single correct
-- permissive policy cannot do that — so a second/leftover policy (a RESTRICTIVE
-- one, or a FOR ALL policy that migration 0012's INSERT-only drop missed) is
-- being AND-ed in. This drops EVERY policy on public.workspaces and recreates
-- only the correct three, so nothing hidden can block the insert.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.workspaces enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'workspaces'
  loop
    execute format('drop policy if exists %I on public.workspaces', p.policyname);
  end loop;
end $$;

create policy "workspaces_select_member"
  on public.workspaces for select to authenticated
  using (public.is_workspace_member(id));

create policy "workspaces_insert_own"
  on public.workspaces for insert to authenticated
  with check (created_by = auth.uid());

create policy "workspaces_update_owner"
  on public.workspaces for update to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = workspaces.id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

notify pgrst, 'reload schema';
