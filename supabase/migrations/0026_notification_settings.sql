-- ───────────────────────────────────────────────────────────────────────────
-- 0026_notification_settings.sql
-- Per-user preferences for Block activity notifications (chat, uploads, voice
-- notes, joins, split sheet updates). One row per user, created automatically
-- on signup (mirrors the existing on_auth_user_created → profiles pattern) and
-- backfilled for everyone who already exists. Every flag defaults to true so
-- notifications work out of the box; users opt OUT, not in.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.notification_settings (
  user_id                     uuid primary key references auth.users(id) on delete cascade,
  email_notifications_enabled boolean not null default true,
  email_chat_messages         boolean not null default true,
  email_file_uploads          boolean not null default true,
  email_voice_notes           boolean not null default true,
  email_block_members         boolean not null default true,
  email_split_updates         boolean not null default true,
  updated_at                  timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "notification_settings_select_own" on public.notification_settings;
create policy "notification_settings_select_own" on public.notification_settings
  for select using (auth.uid() = user_id);

drop policy if exists "notification_settings_update_own" on public.notification_settings;
create policy "notification_settings_update_own" on public.notification_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notification_settings_insert_own" on public.notification_settings;
create policy "notification_settings_insert_own" on public.notification_settings
  for insert with check (auth.uid() = user_id);

create trigger touch_notification_settings before update on public.notification_settings
  for each row execute function public.touch_updated_at();

-- Seed a default row for every new signup, alongside the existing profile row.
create or replace function public.handle_new_user_notification_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_notification_settings on auth.users;
create trigger on_auth_user_created_notification_settings
  after insert on auth.users
  for each row execute function public.handle_new_user_notification_settings();

-- Backfill existing users so lookups never have to special-case a missing row.
insert into public.notification_settings (user_id)
select id from auth.users
on conflict (user_id) do nothing;

notify pgrst, 'reload schema';
