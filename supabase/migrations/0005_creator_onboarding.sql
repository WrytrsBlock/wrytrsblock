-- 0005_creator_onboarding.sql
-- Creator onboarding payload. The guided onboarding flow collects the data that
-- powers Creator Discovery, Block Market filters, and Block Match. The typed
-- profile (creator types, genres, looking-for, location, collab style,
-- experience, goals, gender, age group, socials) is stored as a single jsonb
-- blob so the shape can evolve without a migration per field. display_name and
-- bio continue to live in their own columns.

alter table public.profiles
  add column if not exists onboarding jsonb;
