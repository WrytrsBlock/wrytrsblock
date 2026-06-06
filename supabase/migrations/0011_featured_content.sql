-- ───────────────────────────────────────────────────────────────────────────
-- 0011_featured_content.sql
-- Featured Content — a small, creator-curated set of showcase pieces shown high
-- on the profile ("why should I Start a Block with this creator?"). Stored as a
-- JSON array of items: { id, type, url, title?, featured? }. This is NOT a feed
-- (no followers/likes/comments) — just selected work, with one featured item.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.creator_profiles
  add column if not exists featured_content jsonb not null default '[]'::jsonb;

comment on column public.creator_profiles.featured_content is
  'Creator-selected showcase items: [{ id, type, url, title?, featured? }]. Curated, not a feed.';
