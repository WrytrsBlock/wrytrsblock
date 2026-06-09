-- supabase/seed.sql
-- LOCAL / STAGING demo data — NOT for production. Delete before launch.
--
-- Run with:  supabase db reset      (applies migrations 0001–0006, then this)
-- or:        psql "$DATABASE_URL" -f supabase/seed.sql

-- =============================================================================
-- Part A · Demo CREATORS (self-contained) — powers the marketplace with real
-- rows instead of mock. Creates auth users so auth.users → profiles →
-- creator_profiles is satisfied. Idempotent. Scoped to @demo.wrytrsblock.dev.
-- Demo login password for all: "wrytrs-demo".
-- =============================================================================

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
   confirmation_token, email_change, email_change_token_new, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000001','authenticated','authenticated','maya@demo.wrytrsblock.dev', '$2a$10$wrytrsblockdemopasshash000000000000000000000000000000000', now(), '{"provider":"email","providers":["email"]}','{"display_name":"Maya Sol"}',  now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000002','authenticated','authenticated','dex@demo.wrytrsblock.dev',  '$2a$10$wrytrsblockdemopasshash000000000000000000000000000000000', now(), '{"provider":"email","providers":["email"]}','{"display_name":"Dex Mara"}',  now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000003','authenticated','authenticated','rho@demo.wrytrsblock.dev',  '$2a$10$wrytrsblockdemopasshash000000000000000000000000000000000', now(), '{"provider":"email","providers":["email"]}','{"display_name":"Rho Vance"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000004','authenticated','authenticated','juno@demo.wrytrsblock.dev', '$2a$10$wrytrsblockdemopasshash000000000000000000000000000000000', now(), '{"provider":"email","providers":["email"]}','{"display_name":"Juno Pace"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000005','authenticated','authenticated','kit@demo.wrytrsblock.dev',  '$2a$10$wrytrsblockdemopasshash000000000000000000000000000000000', now(), '{"provider":"email","providers":["email"]}','{"display_name":"Kit Oba"}',   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000','d0000000-0000-4000-8000-000000000006','authenticated','authenticated','sol@demo.wrytrsblock.dev',  '$2a$10$wrytrsblockdemopasshash000000000000000000000000000000000', now(), '{"provider":"email","providers":["email"]}','{"display_name":"Sol Reyes"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

-- profiles rows are auto-created by the handle_new_user() trigger above.
-- Structured marketplace profiles (Producer · Rapper · Singer · Songwriter ·
-- Engineer · Videographer · Influencer represented):
insert into public.creator_profiles
  (id, handle, display_name, tagline, bio, country, city,
   creator_types, genres, looking_for, availability, experience,
   block_score, block_match, rating, reviews, is_published)
values
  ('d0000000-0000-4000-8000-000000000001','mayasol','Maya Sol',
   'Singer & songwriter blending R&B and pop.',
   'Topline writer and vocalist. Warm, melodic, hook-first. Building with producers and engineers.',
   'Canada','Toronto',
   array['singer','songwriter'], array['rnb','pop'], array['producers','engineers'],
   array['collaborate','paid_work','remote_work'], 'professional', 905, 96, 4.9, 31, true),
  ('d0000000-0000-4000-8000-000000000002','dexmara','Dex Mara',
   'Producer & engineer — warm, cinematic, loud.',
   'Producing hip-hop and R&B with analog warmth. Open to artists and writers.',
   'United States','Los Angeles',
   array['producer','engineer'], array['hip_hop','rnb'], array['singers','rappers','songwriters'],
   array['collaborate','paid_work'], 'veteran', 945, 98, 5.0, 64, true),
  ('d0000000-0000-4000-8000-000000000003','rhovance','Rho Vance',
   'Rapper & performer with a sharp pen.',
   'Lyric-forward rapper, melodic when it counts. Looking for producers and engineers.',
   'United States','Atlanta',
   array['rapper','songwriter'], array['hip_hop'], array['producers','engineers','videographers'],
   array['collaborate','local_projects'], 'professional', 880, 92, 4.8, 22, true),
  ('d0000000-0000-4000-8000-000000000004','junopace','Juno Pace',
   'Mix & master engineer — radio-ready.',
   'Reference-matched mixes and masters, 5–7 day turnaround. Stems in, masters out.',
   'United Kingdom','London',
   array['engineer','producer'], array['pop','edm'], array['singers','producers'],
   array['paid_work','remote_work'], 'professional', 920, 90, 4.9, 40, true),
  ('d0000000-0000-4000-8000-000000000005','kitoba','Kit Oba',
   'Videographer & filmmaker for music + brands.',
   'Music videos, visualizers, and brand films. Cinematic, fast, reliable.',
   'Canada','Toronto',
   array['videographer','filmmaker'], array['film','content_creation'], array['singers','rappers','influencers'],
   array['collaborate','paid_work','local_projects'], 'professional', 840, 88, 4.7, 18, true),
  ('d0000000-0000-4000-8000-000000000006','solreyes','Sol Reyes',
   'Influencer & content creator — music culture.',
   'Building audiences around new music. Promo, premieres, and creator collabs.',
   'United States','Miami',
   array['influencer','content_creator'], array['hip_hop','content_creation'], array['rappers','singers','labels'],
   array['collaborate','paid_work','remote_work'], 'intermediate', 760, 85, 4.6, 12, true)
on conflict (id) do update set
  handle = excluded.handle, display_name = excluded.display_name,
  tagline = excluded.tagline, bio = excluded.bio,
  country = excluded.country, city = excluded.city,
  creator_types = excluded.creator_types, genres = excluded.genres,
  looking_for = excluded.looking_for, availability = excluded.availability,
  experience = excluded.experience, block_score = excluded.block_score,
  block_match = excluded.block_match, rating = excluded.rating,
  reviews = excluded.reviews, is_published = excluded.is_published;

-- To remove all demo creators later:
--   delete from auth.users where email like '%@demo.wrytrsblock.dev';
--   (cascades to profiles, creator_profiles, saved_creators)

-- =============================================================================
-- Part B · Optional Block seed for a REAL signed-in user. Replace the UUID with
-- your own auth.users.id, then run this section.
-- =============================================================================

-- \set me_id 'REPLACE-WITH-YOUR-AUTH-UUID'
--
-- insert into public.workspaces (name, slug, description, created_by)
-- values ('My Studio', 'my-studio', 'Independent creative studio.', :'me_id')
-- on conflict (slug) do nothing;
--
-- insert into public.blocks
--   (workspace_id, slug, title, tagline, status, kind, progress, deadline,
--    cover_url, tags, budget, lead_id, created_by)
-- select w.id, 'midnight-press', 'Midnight Press',
--        'A six-part audio drama about an underground newsroom in 1973.',
--        'Producing', 'Audio Drama', 64, '2026-06-28',
--        'https://images.unsplash.com/photo-1490971588422-52f6262a237a',
--        array['Audio Drama','Period','Serial'], '$84,500', :'me_id', :'me_id'
-- from public.workspaces w where w.slug = 'my-studio'
-- on conflict do nothing;
