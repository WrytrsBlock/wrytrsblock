-- ───────────────────────────────────────────────────────────────────────────
-- 0031_realtime_block_members.sql
-- block_members was never added to the supabase_realtime publication, so a
-- client subscribed to postgres_changes on it (see
-- components/block/block-membership-live-refresh.tsx) would never receive
-- anything — Realtime only broadcasts changes for published tables. Without
-- this, someone sitting on a Block's page has no way to find out a new member
-- joined except refreshing manually. Idempotent, mirroring 0023's pattern.
-- ───────────────────────────────────────────────────────────────────────────

do $$
begin
  alter publication supabase_realtime add table public.block_members;
exception
  when duplicate_object then null;
  when others then null;
end $$;

notify pgrst, 'reload schema';
