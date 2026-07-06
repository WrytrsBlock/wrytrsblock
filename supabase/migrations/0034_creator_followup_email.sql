-- ───────────────────────────────────────────────────────────────────────────
-- 0034_creator_followup_email.sql
-- Tracks whether the 24h "Ready to start your first Block?" follow-up email
-- (app/api/cron/follow-up-emails, triggered hourly by Vercel Cron per
-- vercel.json) has been sent to a creator, so it never sends twice — the
-- cron job's claim query is `where is_published and follow_up_sent_at is
-- null and created_at <= now() - interval '24 hours'`, then atomically sets
-- follow_up_sent_at via an UPDATE ... WHERE follow_up_sent_at IS NULL, which
-- Postgres row-locking makes safe even if two cron runs briefly overlap.
--
-- No separate "onboarding completed at" column is added: creator_profiles
-- rows are created exactly once, at first publish (services/creator-
-- profiles.service.ts's upsertCreatorProfile, called only from
-- completeOnboardingAction), and later profile edits only touch updated_at
-- — so the existing created_at already is that timestamp.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.creator_profiles
  add column if not exists follow_up_sent_at timestamptz;

-- Matches the cron job's claim query exactly (published, not yet sent),
-- ordered implicitly by created_at via the predicate's own column.
create index if not exists creator_profiles_followup_due_idx
  on public.creator_profiles (created_at)
  where is_published and follow_up_sent_at is null;

notify pgrst, 'reload schema';
