-- ───────────────────────────────────────────────────────────────────────────
-- 0036_signup_and_block_request_emails.sql
-- Two additions for the email notification system:
--
-- 1. profiles.signup_email_sent_at — lets notifySignupAction (called right
--    after supabase.auth.signUp() succeeds, from a Client Component) claim
--    the send atomically via `UPDATE ... WHERE signup_email_sent_at IS NULL`,
--    mirroring the follow_up_sent_at pattern from 0034. Without this, a
--    retried/duplicated client call would re-send the welcome + admin emails.
--
-- 2. notification_settings.email_block_requests — the incoming "someone sent
--    you a Block Request" email is a new activity kind (distinct from
--    email_block_members, which covers the "X joined your Block" email sent
--    once a request is accepted), so it gets its own opt-out column,
--    consistent with 0026's one-column-per-activity-type design.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists signup_email_sent_at timestamptz;

alter table public.notification_settings
  add column if not exists email_block_requests boolean not null default true;

notify pgrst, 'reload schema';
