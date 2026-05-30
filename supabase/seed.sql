-- Optional dev seed. Run after creating a user via Supabase Auth, then update
-- the placeholders below with that user's UUID and email.
--
-- usage: supabase db reset && supabase db execute --file supabase/seed.sql

-- ⚠ replace this with your auth.users.id before running.
\set me_id 'REPLACE-WITH-YOUR-AUTH-UUID'

insert into public.workspaces (name, slug, description, created_by)
values ('Inkwell Studio', 'inkwell', 'Independent creative studio.', :'me_id')
on conflict (slug) do nothing;

insert into public.blocks
  (workspace_id, slug, title, tagline, status, kind, progress, deadline,
   cover_url, tags, budget, lead_id, created_by)
select
  w.id,
  'midnight-press',
  'Midnight Press',
  'A six-part audio drama about an underground newsroom in 1973.',
  'Producing',
  'Audio Drama',
  64,
  '2026-06-28',
  'https://images.unsplash.com/photo-1490971588422-52f6262a237a',
  array['Audio Drama','Period','Serial'],
  '$84,500',
  :'me_id',
  :'me_id'
from public.workspaces w
where w.slug = 'inkwell'
on conflict do nothing;
