-- 0017_backfill_creator_profiles.sql
-- Backfill marketplace profiles for users who COMPLETED onboarding
-- (profiles.onboarding is set) but have no creator_profiles row — victims of the
-- previously-swallowed upsert error in completeOnboardingAction (a username
-- collision on the unique lower(handle) index would silently drop the row).
--
-- Idempotent: only inserts rows that are missing, so it is safe to re-run.
-- Users who never finished onboarding (no profiles.onboarding) are intentionally
-- left out — they should only appear in the marketplace once onboarding is done.

with candidates as (
  select
    p.id,
    p.onboarding                  as ob,
    p.display_name,
    p.avatar_url,
    nullif(p.onboarding ->> 'username', '') as uname
  from public.profiles p
  left join public.creator_profiles c on c.id = p.id
  where c.id is null
    and p.onboarding is not null
    and p.onboarding <> 'null'::jsonb
),
numbered as (
  -- Disambiguate duplicate usernames *within* the backfill batch.
  select *,
    row_number() over (partition by lower(uname) order by id) as rn
  from candidates
)
insert into public.creator_profiles (
  id, handle, display_name, tagline, bio, avatar_url,
  country, city, creator_types, genres, looking_for, availability,
  experience, gender, age_group, is_published
)
select
  n.id,
  -- Keep the chosen username when it's free + unique in this batch; otherwise
  -- suffix with a short slice of the user id so the unique index is satisfied.
  case
    when n.uname is null then null
    when n.rn > 1
      or exists (
        select 1 from public.creator_profiles c2
        where lower(c2.handle) = lower(n.uname)
      )
    then n.uname || '-' || left(n.id::text, 4)
    else n.uname
  end,
  coalesce(n.ob ->> 'name', n.display_name),
  left(coalesce(n.ob ->> 'bio', ''), 140),
  n.ob ->> 'bio',
  n.avatar_url,
  n.ob ->> 'country',
  n.ob ->> 'city',
  coalesce((select array_agg(x) from jsonb_array_elements_text(n.ob -> 'creatorTypes') x), '{}'),
  coalesce((select array_agg(x) from jsonb_array_elements_text(n.ob -> 'interests') x), '{}'),
  coalesce((select array_agg(x) from jsonb_array_elements_text(n.ob -> 'lookingFor') x), '{}'),
  coalesce((select array_agg(x) from jsonb_array_elements_text(n.ob -> 'availability') x), '{}'),
  n.ob ->> 'experience',
  n.ob ->> 'gender',
  n.ob ->> 'ageGroup',
  true
from numbered n;
