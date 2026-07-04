-- ───────────────────────────────────────────────────────────────────────────
-- 0027_block_viewers.sql
-- Lightweight, server-queryable mirror of the client-side presence channel
-- (hooks/use-presence.ts joins "presence:block:<id>" over Supabase Realtime,
-- which is ephemeral and only visible to other subscribers). Server Actions
-- can't read a Realtime presence channel directly, so members heartbeat their
-- "currently viewing this Block" state into this table too. Notification
-- fan-out reads it to skip the email for someone already looking at the
-- activity in-app, per the product spec: "Do NOT send an email if the user is
-- actively viewing that Block." A row older than ~45s is treated as stale.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.block_viewers (
  block_id      uuid not null references public.blocks(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  last_seen_at  timestamptz not null default now(),
  primary key (block_id, user_id)
);

create index if not exists block_viewers_block_idx
  on public.block_viewers (block_id, last_seen_at desc);

alter table public.block_viewers enable row level security;

-- Any member of the Block can see who else is currently viewing it.
drop policy if exists "block_viewers_select_members" on public.block_viewers;
create policy "block_viewers_select_members" on public.block_viewers
  for select using (public.is_block_member(block_id));

-- A member can only ever heartbeat their OWN row.
drop policy if exists "block_viewers_upsert_own" on public.block_viewers;
create policy "block_viewers_upsert_own" on public.block_viewers
  for insert with check (auth.uid() = user_id and public.is_block_member(block_id));

drop policy if exists "block_viewers_update_own" on public.block_viewers;
create policy "block_viewers_update_own" on public.block_viewers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "block_viewers_delete_own" on public.block_viewers;
create policy "block_viewers_delete_own" on public.block_viewers
  for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';
