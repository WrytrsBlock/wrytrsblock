-- 0006_creator_profiles.sql
-- The marketplace's source of truth. A 1:1 extension of profiles holding the
-- structured, queryable creator data collected at onboarding (creator types,
-- genres/interests, who they're looking for, availability, experience,
-- location, socials, portfolio) plus the discovery scores. This is what powers
-- Creator Discovery, marketplace search/filtering, and Block Match — replacing
-- the mock dataset in production.

create table if not exists public.creator_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text,
  display_name  text,
  tagline       text,
  bio           text,
  avatar_url    text,
  banner_url    text,
  country       text,
  city          text,
  -- Discovery signals (stored as text[] of stable ids from lib/onboarding.ts).
  creator_types text[]  not null default '{}',
  genres        text[]  not null default '{}',
  looking_for   text[]  not null default '{}',
  availability  text[]  not null default '{}',
  experience    text,                       -- beginner | intermediate | professional | veteran
  gender        text,
  age_group     text,
  socials       jsonb   not null default '{}'::jsonb,
  portfolio     text[]  not null default '{}',
  website       text,
  -- Scores surfaced across the marketplace + profiles.
  block_score   integer not null default 0 check (block_score between 0 and 1000),
  block_match   integer not null default 0 check (block_match between 0 and 100),
  rating        numeric(2,1) not null default 0,
  reviews       integer not null default 0,
  -- Only published profiles appear in the marketplace.
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Fast discovery: array containment for type/genre filters, plus location +
-- score ordering and handle lookup.
create index if not exists creator_profiles_types_idx
  on public.creator_profiles using gin (creator_types);
create index if not exists creator_profiles_genres_idx
  on public.creator_profiles using gin (genres);
create index if not exists creator_profiles_country_idx
  on public.creator_profiles (country);
create index if not exists creator_profiles_block_score_idx
  on public.creator_profiles (block_score desc);
create unique index if not exists creator_profiles_handle_key
  on public.creator_profiles (lower(handle));

-- Keep updated_at fresh (reuses the shared trigger fn from 0001).
drop trigger if exists touch_creator_profiles on public.creator_profiles;
create trigger touch_creator_profiles before update on public.creator_profiles
  for each row execute function public.touch_updated_at();

alter table public.creator_profiles enable row level security;

-- Published profiles are readable by anyone (marketplace is the front door);
-- a creator manages only their own row.
drop policy if exists "creator_profiles read published" on public.creator_profiles;
create policy "creator_profiles read published"
  on public.creator_profiles for select
  using (is_published or auth.uid() = id);

drop policy if exists "creator_profiles insert own" on public.creator_profiles;
create policy "creator_profiles insert own"
  on public.creator_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "creator_profiles update own" on public.creator_profiles;
create policy "creator_profiles update own"
  on public.creator_profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- saved_creators — the "Save" action on creator cards (real bookmarks).
-- -----------------------------------------------------------------------------

create table if not exists public.saved_creators (
  user_id    uuid not null references auth.users(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, creator_id)
);

create index if not exists saved_creators_user_idx
  on public.saved_creators (user_id);

alter table public.saved_creators enable row level security;

drop policy if exists "saved_creators manage own" on public.saved_creators;
create policy "saved_creators manage own"
  on public.saved_creators for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
