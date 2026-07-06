-- ───────────────────────────────────────────────────────────────────────────
-- 0033_songwriter.sql
-- "Songwriter" — a collaborative songwriting workspace inside a Block: song
-- metadata (title lives on the Block itself; status/BPM/key/genre + an
-- optional attached instrumental, reusing media_assets), an ordered list of
-- lyric sections (Intro/Verse/Pre-Chorus/Chorus-Hook/Bridge/Outro/Custom)
-- with inline line-anchored comments (Google-Docs-style: root comment +
-- flat replies + resolve), a Contributors roster that can later seed the
-- Split Sheet Generator, and saved A/B loop markers. Playback state
-- (play/pause/position/volume/loop on-off) is never stored here — it's
-- 100% local per collaborator. Only the doc, its sections, comments,
-- contributors, and loop markers sync live.
-- ───────────────────────────────────────────────────────────────────────────

do $$ begin
  create type songwriter_section_kind as enum (
    'intro', 'verse', 'pre_chorus', 'chorus_hook', 'bridge', 'outro', 'custom'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type songwriter_status as enum (
    'idea', 'writing', 'rewriting', 'demo', 'recording', 'finished'
  );
exception when duplicate_object then null; end $$;

-- One doc per Block (parent "sheet", mirroring split_sheets: unique
-- block_id, get-or-create on first visit).
create table if not exists public.songwriter_docs (
  id                uuid primary key default gen_random_uuid(),
  block_id          uuid not null references public.blocks(id) on delete cascade,
  status            songwriter_status not null default 'idea',
  bpm               integer,
  key               text,
  genre             text,
  instrumental_id   uuid references public.media_assets(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (block_id)
);

-- Ordered lyric sections. `position` is a float so reordering can slot a
-- dragged row between two neighbors by averaging, without renumbering the
-- whole list on every drop (see services layer).
create table if not exists public.songwriter_sections (
  id            uuid primary key default gen_random_uuid(),
  doc_id        uuid not null references public.songwriter_docs(id) on delete cascade,
  kind          songwriter_section_kind not null default 'verse',
  -- User-facing label. Null for the fixed kinds unless the user renames the
  -- section (e.g. a second Verse -> "Verse 2"); non-null and authoritative
  -- for kind='custom'.
  label         text,
  lyrics        text not null default '',
  position      double precision not null default 0,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Reordering slots a dragged row's position between two neighbors; the
  -- fractional scheme has effectively unlimited headroom, so this only ever
  -- rejects a genuine collision (two inserts computing the same next
  -- position concurrently — see add_songwriter_section below).
  unique (doc_id, position)
);

create index if not exists songwriter_sections_doc_idx
  on public.songwriter_sections(doc_id, position);

-- Computes the append position and inserts in one statement instead of the
-- app doing a separate "select max(position)" read followed by a separate
-- insert — two collaborators clicking "Add Section" within the same instant
-- would otherwise both read the same max and both insert at max+1, landing
-- on the unique(doc_id, position) constraint above. Collapsing read+write
-- into a single statement closes that race in the overwhelming majority of
-- cases; the unique constraint is the backstop for the rest (the action
-- layer surfaces a clear "someone just added a section — try again" error
-- instead of silently duplicating a position). `security invoker` (the
-- default) means this still runs as the calling user, so the normal RLS
-- `with check` on songwriter_sections is enforced exactly as if the insert
-- had been issued directly.
create or replace function public.add_songwriter_section(
  p_doc_id uuid,
  p_kind songwriter_section_kind,
  p_label text default null
)
returns public.songwriter_sections
language plpgsql
as $$
declare
  new_row public.songwriter_sections;
begin
  insert into public.songwriter_sections (doc_id, kind, label, position)
  select p_doc_id, p_kind, p_label, coalesce(max(position), 0) + 1
  from public.songwriter_sections
  where doc_id = p_doc_id
  returning * into new_row;
  return new_row;
end;
$$;

revoke all on function public.add_songwriter_section(uuid, songwriter_section_kind, text) from public;
grant execute on function public.add_songwriter_section(uuid, songwriter_section_kind, text) to authenticated;

-- Saved loop markers ("Verse 1", "Chorus", ...). Synced instantly to all
-- collaborators; clicking one jumps the local player's playhead only.
create table if not exists public.songwriter_loop_markers (
  id             uuid primary key default gen_random_uuid(),
  doc_id         uuid not null references public.songwriter_docs(id) on delete cascade,
  name           text not null,
  start_seconds  numeric(10,3) not null,
  end_seconds    numeric(10,3) not null,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  check (end_seconds > start_seconds)
);

create index if not exists songwriter_loop_markers_doc_idx
  on public.songwriter_loop_markers(doc_id, start_seconds);

-- Inline comments, anchored to a line index within a section (lyrics stay
-- plain textareas — no rich-text/contenteditable swap). `parent_comment_id`
-- null = thread root, set = a flat reply (two-level threads only, matching
-- Docs/Figma/Notion in practice). `quoted_text` snapshots the line's content
-- at comment time so a reader can still see what it referred to even if the
-- anchor later drifts from lines being inserted/removed above it.
create table if not exists public.songwriter_comments (
  id                 uuid primary key default gen_random_uuid(),
  doc_id             uuid not null references public.songwriter_docs(id) on delete cascade,
  section_id         uuid not null references public.songwriter_sections(id) on delete cascade,
  parent_comment_id  uuid references public.songwriter_comments(id) on delete cascade,
  line_index         integer not null,
  quoted_text        text,
  body               text not null,
  author_id          uuid references auth.users(id) on delete set null,
  resolved           boolean not null default false,
  resolved_by        uuid references auth.users(id) on delete set null,
  resolved_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists songwriter_comments_section_idx
  on public.songwriter_comments(section_id, line_index);
create index if not exists songwriter_comments_doc_idx
  on public.songwriter_comments(doc_id, resolved);
-- getSongwriterComments filters by doc_id and orders by created_at; neither
-- existing composite index above has created_at as a trailing column, so
-- Postgres can narrow by doc_id but still has to sort the result set — this
-- supports that query directly as comment volume grows on a long-running doc.
create index if not exists songwriter_comments_doc_created_idx
  on public.songwriter_comments(doc_id, created_at);

-- Contributors roster. Free-text `display_name` snapshot (same spirit as
-- split_sheet_entries not being tied to a live profile) so it survives a
-- rename or the member leaving the Block. `role` is plain text, not a DB
-- enum, so a row can flow directly into split_sheet_entries.role without
-- any conversion — see services/split-sheets.service.ts.
create table if not exists public.songwriter_contributors (
  id             uuid primary key default gen_random_uuid(),
  doc_id         uuid not null references public.songwriter_docs(id) on delete cascade,
  user_id        uuid references auth.users(id) on delete set null,
  display_name   text,
  role           text not null default 'Songwriter',
  created_at     timestamptz not null default now()
);

create index if not exists songwriter_contributors_doc_idx
  on public.songwriter_contributors(doc_id);

-- ---------------------------------------------------------------------------
-- Version history for section lyrics — simplest viable approach: a snapshot
-- row written by an AFTER UPDATE trigger whenever `lyrics` actually changes,
-- gated so a long writing session doesn't spam the table: only snapshot when
-- either (a) the previous revision for this section is older than 5
-- minutes, or (b) the length delta since the last snapshot exceeds 40
-- characters. This gives meaningful "checkpoints" (roughly one per burst of
-- writing) without a snapshot per debounce tick, and needs zero app-level
-- scheduling — it's a pure DB trigger, so it can't be bypassed by a rogue
-- client. No realtime on this table — history is pulled on demand only (no
-- viewer UI ships in this version; the data is captured for one later).
-- ---------------------------------------------------------------------------
create table if not exists public.songwriter_section_revisions (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid not null references public.songwriter_sections(id) on delete cascade,
  lyrics        text not null,
  edited_by     uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists songwriter_section_revisions_section_idx
  on public.songwriter_section_revisions(section_id, created_at desc);

create or replace function public.snapshot_songwriter_section_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  last_rev record;
begin
  if new.lyrics is distinct from old.lyrics then
    select * into last_rev
      from public.songwriter_section_revisions
      where section_id = new.id
      order by created_at desc
      limit 1;

    if last_rev is null
       or last_rev.created_at < now() - interval '5 minutes'
       or abs(length(new.lyrics) - length(last_rev.lyrics)) > 40
    then
      insert into public.songwriter_section_revisions (section_id, lyrics, edited_by)
      values (new.id, new.lyrics, auth.uid());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists snapshot_songwriter_section_revision on public.songwriter_sections;
create trigger snapshot_songwriter_section_revision
  after update on public.songwriter_sections
  for each row execute function public.snapshot_songwriter_section_revision();

-- ---------------------------------------------------------------------------
-- touch_updated_at on docs, sections, comments
-- ---------------------------------------------------------------------------
drop trigger if exists touch_songwriter_docs on public.songwriter_docs;
create trigger touch_songwriter_docs before update on public.songwriter_docs
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_songwriter_sections on public.songwriter_sections;
create trigger touch_songwriter_sections before update on public.songwriter_sections
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_songwriter_comments on public.songwriter_comments;
create trigger touch_songwriter_comments before update on public.songwriter_comments
  for each row execute function public.touch_updated_at();

-- Bump the parent doc's updated_at whenever a section, loop marker, comment,
-- or contributor changes — same pattern as touch_split_sheet_parent in 0032.
create or replace function public.touch_songwriter_doc_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.songwriter_docs
  set updated_at = now()
  where id = coalesce(new.doc_id, old.doc_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists touch_songwriter_doc_parent_on_sections on public.songwriter_sections;
create trigger touch_songwriter_doc_parent_on_sections
  after insert or update or delete on public.songwriter_sections
  for each row execute function public.touch_songwriter_doc_parent();

drop trigger if exists touch_songwriter_doc_parent_on_markers on public.songwriter_loop_markers;
create trigger touch_songwriter_doc_parent_on_markers
  after insert or update or delete on public.songwriter_loop_markers
  for each row execute function public.touch_songwriter_doc_parent();

drop trigger if exists touch_songwriter_doc_parent_on_comments on public.songwriter_comments;
create trigger touch_songwriter_doc_parent_on_comments
  after insert or update or delete on public.songwriter_comments
  for each row execute function public.touch_songwriter_doc_parent();

drop trigger if exists touch_songwriter_doc_parent_on_contributors on public.songwriter_contributors;
create trigger touch_songwriter_doc_parent_on_contributors
  after insert or update or delete on public.songwriter_contributors
  for each row execute function public.touch_songwriter_doc_parent();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.songwriter_docs enable row level security;
alter table public.songwriter_sections enable row level security;
alter table public.songwriter_loop_markers enable row level security;
alter table public.songwriter_comments enable row level security;
alter table public.songwriter_contributors enable row level security;
alter table public.songwriter_section_revisions enable row level security;

drop policy if exists "songwriter_docs by block members" on public.songwriter_docs;
create policy "songwriter_docs by block members"
  on public.songwriter_docs for all
  to authenticated
  using (public.is_block_member(block_id))
  with check (public.is_block_member(block_id));

drop policy if exists "songwriter_sections by block members" on public.songwriter_sections;
create policy "songwriter_sections by block members"
  on public.songwriter_sections for all
  to authenticated
  using (
    exists (
      select 1 from public.songwriter_docs d
      where d.id = doc_id and public.is_block_member(d.block_id)
    )
  )
  with check (
    exists (
      select 1 from public.songwriter_docs d
      where d.id = doc_id and public.is_block_member(d.block_id)
    )
  );

drop policy if exists "songwriter_loop_markers by block members" on public.songwriter_loop_markers;
create policy "songwriter_loop_markers by block members"
  on public.songwriter_loop_markers for all
  to authenticated
  using (
    exists (
      select 1 from public.songwriter_docs d
      where d.id = doc_id and public.is_block_member(d.block_id)
    )
  )
  with check (
    exists (
      select 1 from public.songwriter_docs d
      where d.id = doc_id and public.is_block_member(d.block_id)
    )
  );

drop policy if exists "songwriter_comments by block members" on public.songwriter_comments;
create policy "songwriter_comments by block members"
  on public.songwriter_comments for all
  to authenticated
  using (
    exists (
      select 1 from public.songwriter_docs d
      where d.id = doc_id and public.is_block_member(d.block_id)
    )
  )
  with check (
    exists (
      select 1 from public.songwriter_docs d
      where d.id = doc_id and public.is_block_member(d.block_id)
    )
  );

drop policy if exists "songwriter_contributors by block members" on public.songwriter_contributors;
create policy "songwriter_contributors by block members"
  on public.songwriter_contributors for all
  to authenticated
  using (
    exists (
      select 1 from public.songwriter_docs d
      where d.id = doc_id and public.is_block_member(d.block_id)
    )
  )
  with check (
    exists (
      select 1 from public.songwriter_docs d
      where d.id = doc_id and public.is_block_member(d.block_id)
    )
  );

-- Revisions: read-only from the client (a future history viewer) — only the
-- security-definer trigger inserts. No insert/update/delete policy is
-- granted, so direct client writes are rejected by RLS.
drop policy if exists "songwriter_section_revisions read by block members" on public.songwriter_section_revisions;
create policy "songwriter_section_revisions read by block members"
  on public.songwriter_section_revisions for select
  to authenticated
  using (
    exists (
      select 1 from public.songwriter_sections s
      join public.songwriter_docs d on d.id = s.doc_id
      where s.id = section_id and public.is_block_member(d.block_id)
    )
  );

-- ---------------------------------------------------------------------------
-- split_sheet_entries: guard against the new Songwriter-contributor seeding
-- path double-inserting. getSplitSheetAction seeds one entry per contributor
-- only when the sheet has zero entries; two collaborators opening a brand
-- new Block's Splits tab at the same moment could both observe "zero
-- entries" and both seed, duplicating every contributor. A partial unique
-- index (only meaningful for entries actually tied to a member) turns that
-- race into a harmless no-op via the upsert's ignoreDuplicates in
-- services/split-sheets.service.ts instead of silent duplicate rows.
-- ---------------------------------------------------------------------------
create unique index if not exists split_sheet_entries_sheet_user_key
  on public.split_sheet_entries(split_sheet_id, user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- Realtime — lyrics/sections, comments, contributors, and loop markers sync
-- live. Revisions do not (no one needs live snapshot deltas). Idempotent,
-- mirroring 0031's pattern (re-running this migration must not error on an
-- already-published table).
-- ---------------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.songwriter_docs;
exception
  when duplicate_object then null;
  when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.songwriter_sections;
exception
  when duplicate_object then null;
  when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.songwriter_loop_markers;
exception
  when duplicate_object then null;
  when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.songwriter_comments;
exception
  when duplicate_object then null;
  when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.songwriter_contributors;
exception
  when duplicate_object then null;
  when others then null;
end $$;

notify pgrst, 'reload schema';
