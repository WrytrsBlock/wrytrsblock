-- ───────────────────────────────────────────────────────────────────────────
-- 0020_cover_position.sql
-- Hero cover repositioning. Stores the vertical focal point of a creator's
-- cover photo as a percentage (0 = top of the image aligned to the frame top,
-- 100 = bottom, 50 = centered). Applied as CSS object-position whenever the
-- hero renders, so important content is no longer cropped out of frame.
-- Safe + idempotent; defaults to 50 (centered) for every existing profile.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.creator_profiles
  add column if not exists cover_position smallint not null default 50;

-- Keep it a valid percentage.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'creator_profiles_cover_position_range'
  ) then
    alter table public.creator_profiles
      add constraint creator_profiles_cover_position_range
      check (cover_position between 0 and 100);
  end if;
end $$;

notify pgrst, 'reload schema';
