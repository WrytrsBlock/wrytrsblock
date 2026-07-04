-- ───────────────────────────────────────────────────────────────────────────
-- 0032_split_sheet_generator.sql
-- Reshapes the Split Sheet from a bare writer/publishing % table into a full
-- contributor record suitable for generating a real, signable split sheet
-- document: legal name, artist name, contact info, PRO/publishing details,
-- a single ownership percentage (replacing the separate writing/publishing
-- split columns — the new UI tracks one split per contributor), and notes.
-- Also adds a project/song title on the sheet itself (distinct from the
-- Block's own title) and last-updated tracking for both the sheet and its
-- entries. RLS is unchanged (existing "block members, for all" policies on
-- both tables already cover every new column).
-- ───────────────────────────────────────────────────────────────────────────

alter table public.split_sheets
  add column if not exists project_title text,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists touch_split_sheets on public.split_sheets;
create trigger touch_split_sheets before update on public.split_sheets
  for each row execute function public.touch_updated_at();

-- One ownership percentage per contributor, replacing the two separate
-- writing/publishing splits. Safe to rename — nothing outside this feature
-- reads either column.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'split_sheet_entries'
      and column_name = 'writing_pct'
  ) then
    alter table public.split_sheet_entries rename column writing_pct to ownership_pct;
  end if;
end $$;

alter table public.split_sheet_entries
  drop column if exists publishing_pct;

alter table public.split_sheet_entries
  alter column role set default 'Songwriter',
  add column if not exists legal_name text,
  add column if not exists artist_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists publishing_company text,
  add column if not exists pro text,
  add column if not exists ipi_cae text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists touch_split_sheet_entries on public.split_sheet_entries;
create trigger touch_split_sheet_entries before update on public.split_sheet_entries
  for each row execute function public.touch_updated_at();

-- Bump the parent sheet's updated_at whenever any of its entries change, so
-- "last updated" reflects the whole sheet regardless of which contributor
-- card was edited.
create or replace function public.touch_split_sheet_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.split_sheets
  set updated_at = now()
  where id = coalesce(new.split_sheet_id, old.split_sheet_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists touch_split_sheet_parent_on_entries on public.split_sheet_entries;
create trigger touch_split_sheet_parent_on_entries
  after insert or update or delete on public.split_sheet_entries
  for each row execute function public.touch_split_sheet_parent();

notify pgrst, 'reload schema';
