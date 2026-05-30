-- =============================================================================
-- WrytrsBlock — initial schema
-- =============================================================================
-- Tables:
--   profiles                — 1:1 with auth.users
--   workspaces              — top-level studio / org
--   workspace_members
--   blocks                  — top-level creative containers (films, albums, …)
--   block_members           — collaborator roster per Block
--   projects                — sub-units inside a Block (episodes, scenes, tracks)
--                             also doubles as the Kanban data source
--   channels                — messaging channels (workspace- or block-scoped)
--   channel_members
--   messages
--   media_assets            — file metadata; bytes live in Storage bucket
--   comments                — threaded comments on Blocks/assets
--   activity_events         — audit / activity feed
--   notifications
--   workspace_state         — persistent UI state per user / workspace
--
-- Conventions:
--   * Every public table has RLS enabled.
--   * Membership is checked via SECURITY DEFINER helper fns.
--   * `auth.uid()` is the canonical "current user" reference.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

do $$ begin
  create type workspace_role as enum ('owner', 'admin', 'member', 'guest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type block_role as enum ('lead', 'collaborator', 'reviewer', 'guest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type block_type as enum ('collaboration', 'service');
exception when duplicate_object then null; end $$;

do $$ begin
  create type completion_status as enum
    ('open', 'active', 'in_review', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type block_status as enum
    ('Drafting', 'In Review', 'Producing', 'Shipped', 'On Hold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type block_kind as enum
    ('Audio Drama', 'Film', 'Editorial', 'Album', 'Series', 'Music', 'Other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type split_sheet_status as enum ('draft', 'circulated', 'signed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type deliverable_status as enum ('pending', 'submitted', 'approved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum
    ('todo', 'in_progress', 'review', 'done', 'blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type channel_kind as enum ('public', 'private', 'dm');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_kind as enum ('image', 'video', 'audio', 'doc', 'pdf');
exception when duplicate_object then null; end $$;

do $$ begin
  create type activity_kind as enum
    ('comment', 'upload', 'status', 'join', 'edit', 'create');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  handle        text unique,
  role          text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- workspaces & members
-- -----------------------------------------------------------------------------

create table if not exists public.workspaces (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  cover_url     text,
  created_by    uuid references auth.users(id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          workspace_role not null default 'member',
  joined_at     timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx
  on public.workspace_members(user_id);

-- -----------------------------------------------------------------------------
-- blocks & members
-- -----------------------------------------------------------------------------

create table if not exists public.blocks (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  slug          text not null,
  title         text not null,
  tagline       text,
  block_type        block_type not null default 'collaboration',
  status        block_status not null default 'Drafting',
  completion_status completion_status not null default 'open',
  kind          block_kind not null default 'Other',
  progress      smallint not null default 0
                check (progress between 0 and 100),
  deadline      date,
  cover_url     text,
  tags          text[] not null default '{}',
  seeking       text[] not null default '{}',
  budget        text,
  lead_id       uuid references auth.users(id) on delete set null,
  created_by    uuid references auth.users(id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index if not exists blocks_workspace_idx
  on public.blocks(workspace_id);
create index if not exists blocks_status_idx
  on public.blocks(workspace_id, status);
create index if not exists blocks_updated_idx
  on public.blocks(updated_at desc);

create table if not exists public.block_members (
  block_id      uuid not null references public.blocks(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          block_role not null default 'collaborator',
  joined_at     timestamptz not null default now(),
  primary key (block_id, user_id)
);

create index if not exists block_members_user_idx
  on public.block_members(user_id);

-- -----------------------------------------------------------------------------
-- projects (sub-units inside a Block — episodes, scenes, tracks, tasks)
-- -----------------------------------------------------------------------------

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  block_id      uuid not null references public.blocks(id) on delete cascade,
  title         text not null,
  description   text,
  status        project_status not null default 'todo',
  position      int not null default 0,
  due_at        timestamptz,
  assignee_id   uuid references auth.users(id) on delete set null,
  tag           text,
  created_by    uuid references auth.users(id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_block_idx
  on public.projects(block_id, status, position);
create index if not exists projects_assignee_idx
  on public.projects(assignee_id);

-- -----------------------------------------------------------------------------
-- channels & messages
-- -----------------------------------------------------------------------------

create table if not exists public.channels (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  block_id      uuid references public.blocks(id) on delete cascade,
  name          text not null,
  kind          channel_kind not null default 'public',
  created_by    uuid references auth.users(id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now()
);

create index if not exists channels_workspace_idx
  on public.channels(workspace_id);
create index if not exists channels_block_idx
  on public.channels(block_id);

create table if not exists public.channel_members (
  channel_id    uuid not null references public.channels(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  joined_at     timestamptz not null default now(),
  primary key (channel_id, user_id)
);

create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  channel_id    uuid not null references public.channels(id) on delete cascade,
  author_id     uuid not null references auth.users(id) on delete cascade
                default auth.uid(),
  body          text not null,
  reply_to      uuid references public.messages(id) on delete set null,
  created_at    timestamptz not null default now(),
  edited_at     timestamptz
);

create index if not exists messages_channel_idx
  on public.messages(channel_id, created_at desc);

-- -----------------------------------------------------------------------------
-- media_assets (bytes live in Storage bucket "block-media")
-- -----------------------------------------------------------------------------

create table if not exists public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  block_id      uuid references public.blocks(id) on delete cascade,
  name          text not null,
  kind          media_kind not null,
  size_bytes    bigint,
  storage_path  text not null,
  cover_path    text,
  uploaded_by   uuid references auth.users(id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now()
);

create index if not exists media_block_idx
  on public.media_assets(block_id, created_at desc);
create index if not exists media_workspace_idx
  on public.media_assets(workspace_id, created_at desc);

-- -----------------------------------------------------------------------------
-- comments
-- -----------------------------------------------------------------------------

create table if not exists public.comments (
  id            uuid primary key default gen_random_uuid(),
  block_id      uuid not null references public.blocks(id) on delete cascade,
  asset_id      uuid references public.media_assets(id) on delete cascade,
  author_id     uuid references auth.users(id) on delete cascade default auth.uid(),
  body          text not null,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists comments_block_idx
  on public.comments(block_id, created_at desc);

-- -----------------------------------------------------------------------------
-- activity_events
-- -----------------------------------------------------------------------------

create table if not exists public.activity_events (
  id            uuid primary key default gen_random_uuid(),
  block_id      uuid references public.blocks(id) on delete cascade,
  workspace_id  uuid references public.workspaces(id) on delete cascade,
  actor_id      uuid references auth.users(id) on delete set null default auth.uid(),
  kind          activity_kind not null,
  text          text,
  target_id     uuid,
  target_kind   text,
  created_at    timestamptz not null default now()
);

create index if not exists activity_block_idx
  on public.activity_events(block_id, created_at desc);

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------

create table if not exists public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references auth.users(id) on delete cascade,
  actor_id      uuid references auth.users(id) on delete set null,
  kind          text not null,
  title         text not null,
  body          text,
  link          text,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications(recipient_id, read_at, created_at desc);

-- -----------------------------------------------------------------------------
-- workspace_state — persistent UI state per user per workspace
-- -----------------------------------------------------------------------------

create table if not exists public.workspace_state (
  user_id           uuid not null references auth.users(id) on delete cascade,
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  pinned_block_ids  uuid[] not null default '{}',
  last_block_id     uuid references public.blocks(id) on delete set null,
  sidebar_collapsed boolean not null default false,
  theme             text not null default 'dark',
  updated_at        timestamptz not null default now(),
  primary key (user_id, workspace_id)
);

-- -----------------------------------------------------------------------------
-- split_sheets + entries (Collaboration Blocks — music)
-- -----------------------------------------------------------------------------

create table if not exists public.split_sheets (
  id            uuid primary key default gen_random_uuid(),
  block_id      uuid not null references public.blocks(id) on delete cascade,
  status        split_sheet_status not null default 'draft',
  created_at    timestamptz not null default now(),
  unique (block_id)
);

create table if not exists public.split_sheet_entries (
  id              uuid primary key default gen_random_uuid(),
  split_sheet_id  uuid not null references public.split_sheets(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  role            text not null default 'Contributor',
  writing_pct     numeric(5,2) not null default 0 check (writing_pct between 0 and 100),
  publishing_pct  numeric(5,2) not null default 0 check (publishing_pct between 0 and 100),
  signed_at       timestamptz
);

create index if not exists split_entries_sheet_idx
  on public.split_sheet_entries(split_sheet_id);

-- -----------------------------------------------------------------------------
-- deliverables (both Block types)
-- -----------------------------------------------------------------------------

create table if not exists public.deliverables (
  id            uuid primary key default gen_random_uuid(),
  block_id      uuid not null references public.blocks(id) on delete cascade,
  title         text not null,
  status        deliverable_status not null default 'pending',
  owner_id      uuid references auth.users(id) on delete set null,
  due_at        timestamptz,
  position      int not null default 0,
  created_by    uuid references auth.users(id) on delete set null default auth.uid(),
  created_at    timestamptz not null default now()
);

create index if not exists deliverables_block_idx
  on public.deliverables(block_id, position);

-- -----------------------------------------------------------------------------
-- service_details (Service Blocks)
-- -----------------------------------------------------------------------------

create table if not exists public.service_details (
  block_id      uuid primary key references public.blocks(id) on delete cascade,
  title         text,
  category      text,
  summary       text,
  scope         text[] not null default '{}',
  price         text,
  turnaround    text,
  revisions     text,
  requirements  text,
  provider_id   uuid references auth.users(id) on delete set null default auth.uid()
);

-- =============================================================================
-- Helper functions (SECURITY DEFINER, used by RLS)
-- =============================================================================

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_block_member(b_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    exists (
      select 1 from public.block_members
      where block_id = b_id and user_id = auth.uid()
    )
    or exists (
      select 1
      from public.blocks b
      join public.workspace_members wm on wm.workspace_id = b.workspace_id
      where b.id = b_id and wm.user_id = auth.uid()
    );
$$;

create or replace function public.is_channel_member(c_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    exists (
      select 1 from public.channel_members
      where channel_id = c_id and user_id = auth.uid()
    )
    or exists (
      select 1
      from public.channels c
      where c.id = c_id
        and c.kind = 'public'
        and public.is_workspace_member(c.workspace_id)
    );
$$;

-- =============================================================================
-- Triggers
-- =============================================================================

-- 1) Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) updated_at touch on common tables.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles on public.profiles;
create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_workspaces on public.workspaces;
create trigger touch_workspaces before update on public.workspaces
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_blocks on public.blocks;
create trigger touch_blocks before update on public.blocks
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_projects on public.projects;
create trigger touch_projects before update on public.projects
  for each row execute function public.touch_updated_at();

-- 3) When a workspace is created, the creator becomes its owner.
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- 4) When a Block is created, the creator becomes its lead.
create or replace function public.handle_new_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.block_members (block_id, user_id, role)
    values (new.id, new.created_by, 'lead')
    on conflict do nothing;
  end if;
  insert into public.activity_events (block_id, workspace_id, actor_id, kind, text)
  values (new.id, new.workspace_id, new.created_by, 'create', 'created the Block');
  return new;
end;
$$;

drop trigger if exists on_block_created on public.blocks;
create trigger on_block_created
  after insert on public.blocks
  for each row execute function public.handle_new_block();

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles            enable row level security;
alter table public.workspaces          enable row level security;
alter table public.workspace_members   enable row level security;
alter table public.blocks              enable row level security;
alter table public.block_members       enable row level security;
alter table public.projects            enable row level security;
alter table public.channels            enable row level security;
alter table public.channel_members     enable row level security;
alter table public.messages            enable row level security;
alter table public.media_assets        enable row level security;
alter table public.comments            enable row level security;
alter table public.activity_events     enable row level security;
alter table public.notifications       enable row level security;
alter table public.workspace_state     enable row level security;
alter table public.split_sheets        enable row level security;
alter table public.split_sheet_entries enable row level security;
alter table public.deliverables        enable row level security;
alter table public.service_details     enable row level security;

-- profiles ---------------------------------------------------------
drop policy if exists "profiles readable by authed" on public.profiles;
create policy "profiles readable by authed"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- workspaces -------------------------------------------------------
drop policy if exists "workspaces visible to members" on public.workspaces;
create policy "workspaces visible to members"
  on public.workspaces for select
  to authenticated
  using (public.is_workspace_member(id));

drop policy if exists "workspaces insert authed" on public.workspaces;
create policy "workspaces insert authed"
  on public.workspaces for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "workspaces update by owner/admin" on public.workspaces;
create policy "workspaces update by owner/admin"
  on public.workspaces for update
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_id = workspaces.id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    )
  );

-- workspace_members -----------------------------------------------
drop policy if exists "members visible to peers" on public.workspace_members;
create policy "members visible to peers"
  on public.workspace_members for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "members self-join (bootstrap)" on public.workspace_members;
create policy "members self-join (bootstrap)"
  on public.workspace_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- blocks -----------------------------------------------------------
drop policy if exists "blocks visible to workspace" on public.blocks;
create policy "blocks visible to workspace"
  on public.blocks for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "blocks insert by workspace member" on public.blocks;
create policy "blocks insert by workspace member"
  on public.blocks for insert
  to authenticated
  with check (
    public.is_workspace_member(workspace_id) and created_by = auth.uid()
  );

drop policy if exists "blocks update by member" on public.blocks;
create policy "blocks update by member"
  on public.blocks for update
  to authenticated
  using (public.is_block_member(id));

-- block_members ---------------------------------------------------
drop policy if exists "block_members visible to peers" on public.block_members;
create policy "block_members visible to peers"
  on public.block_members for select
  to authenticated
  using (public.is_block_member(block_id));

drop policy if exists "block_members insert by member" on public.block_members;
create policy "block_members insert by member"
  on public.block_members for insert
  to authenticated
  with check (public.is_block_member(block_id) or user_id = auth.uid());

-- projects --------------------------------------------------------
drop policy if exists "projects visible to block members" on public.projects;
create policy "projects visible to block members"
  on public.projects for select
  to authenticated
  using (public.is_block_member(block_id));

drop policy if exists "projects write by block members" on public.projects;
create policy "projects write by block members"
  on public.projects for all
  to authenticated
  using (public.is_block_member(block_id))
  with check (public.is_block_member(block_id));

-- channels --------------------------------------------------------
drop policy if exists "channels visible to workspace" on public.channels;
create policy "channels visible to workspace"
  on public.channels for select
  to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists "channels insert by workspace member" on public.channels;
create policy "channels insert by workspace member"
  on public.channels for insert
  to authenticated
  with check (public.is_workspace_member(workspace_id));

-- channel_members ------------------------------------------------
drop policy if exists "channel_members visible self" on public.channel_members;
create policy "channel_members visible self"
  on public.channel_members for select
  to authenticated
  using (user_id = auth.uid() or public.is_channel_member(channel_id));

drop policy if exists "channel_members self-join" on public.channel_members;
create policy "channel_members self-join"
  on public.channel_members for insert
  to authenticated
  with check (user_id = auth.uid());

-- messages -------------------------------------------------------
drop policy if exists "messages readable by channel members" on public.messages;
create policy "messages readable by channel members"
  on public.messages for select
  to authenticated
  using (public.is_channel_member(channel_id));

drop policy if exists "messages insert by channel members" on public.messages;
create policy "messages insert by channel members"
  on public.messages for insert
  to authenticated
  with check (
    public.is_channel_member(channel_id) and author_id = auth.uid()
  );

drop policy if exists "messages update own" on public.messages;
create policy "messages update own"
  on public.messages for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "messages delete own" on public.messages;
create policy "messages delete own"
  on public.messages for delete
  to authenticated
  using (author_id = auth.uid());

-- media_assets ---------------------------------------------------
drop policy if exists "media readable by block members" on public.media_assets;
create policy "media readable by block members"
  on public.media_assets for select
  to authenticated
  using (
    (block_id is null and public.is_workspace_member(workspace_id))
    or public.is_block_member(block_id)
  );

drop policy if exists "media insert by block members" on public.media_assets;
create policy "media insert by block members"
  on public.media_assets for insert
  to authenticated
  with check (
    (block_id is null and public.is_workspace_member(workspace_id))
    or public.is_block_member(block_id)
  );

drop policy if exists "media delete by uploader or block member" on public.media_assets;
create policy "media delete by uploader or block member"
  on public.media_assets for delete
  to authenticated
  using (
    uploaded_by = auth.uid()
    or (block_id is not null and public.is_block_member(block_id))
  );

-- comments ------------------------------------------------------
drop policy if exists "comments readable by block members" on public.comments;
create policy "comments readable by block members"
  on public.comments for select
  to authenticated
  using (public.is_block_member(block_id));

drop policy if exists "comments insert by block members" on public.comments;
create policy "comments insert by block members"
  on public.comments for insert
  to authenticated
  with check (
    public.is_block_member(block_id) and author_id = auth.uid()
  );

drop policy if exists "comments update own" on public.comments;
create policy "comments update own"
  on public.comments for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- activity_events -----------------------------------------------
drop policy if exists "activity readable by block members" on public.activity_events;
create policy "activity readable by block members"
  on public.activity_events for select
  to authenticated
  using (
    (block_id is not null and public.is_block_member(block_id))
    or (block_id is null and workspace_id is not null
        and public.is_workspace_member(workspace_id))
  );

drop policy if exists "activity insert by member" on public.activity_events;
create policy "activity insert by member"
  on public.activity_events for insert
  to authenticated
  with check (
    (block_id is not null and public.is_block_member(block_id))
    or (block_id is null and workspace_id is not null
        and public.is_workspace_member(workspace_id))
  );

-- notifications -------------------------------------------------
drop policy if exists "notifications readable by recipient" on public.notifications;
create policy "notifications readable by recipient"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

drop policy if exists "notifications update by recipient" on public.notifications;
create policy "notifications update by recipient"
  on public.notifications for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- workspace_state ----------------------------------------------
drop policy if exists "ws_state self" on public.workspace_state;
create policy "ws_state self"
  on public.workspace_state for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- split_sheets + entries (block members) -----------------------
drop policy if exists "split_sheets by block members" on public.split_sheets;
create policy "split_sheets by block members"
  on public.split_sheets for all
  to authenticated
  using (public.is_block_member(block_id))
  with check (public.is_block_member(block_id));

drop policy if exists "split_entries by block members" on public.split_sheet_entries;
create policy "split_entries by block members"
  on public.split_sheet_entries for all
  to authenticated
  using (
    exists (
      select 1 from public.split_sheets s
      where s.id = split_sheet_id and public.is_block_member(s.block_id)
    )
  )
  with check (
    exists (
      select 1 from public.split_sheets s
      where s.id = split_sheet_id and public.is_block_member(s.block_id)
    )
  );

-- deliverables (block members) ---------------------------------
drop policy if exists "deliverables by block members" on public.deliverables;
create policy "deliverables by block members"
  on public.deliverables for all
  to authenticated
  using (public.is_block_member(block_id))
  with check (public.is_block_member(block_id));

-- service_details ----------------------------------------------
-- Readable by anyone in the workspace (so the Marketplace can surface
-- services); writable by block members.
drop policy if exists "service_details read" on public.service_details;
create policy "service_details read"
  on public.service_details for select
  to authenticated
  using (
    exists (
      select 1 from public.blocks b
      where b.id = block_id and public.is_workspace_member(b.workspace_id)
    )
  );

drop policy if exists "service_details write" on public.service_details;
create policy "service_details write"
  on public.service_details for all
  to authenticated
  using (public.is_block_member(block_id))
  with check (public.is_block_member(block_id));

-- =============================================================================
-- Realtime: publish tables that benefit from live updates
-- =============================================================================

alter publication supabase_realtime
  add table public.messages, public.activity_events, public.notifications,
            public.projects, public.media_assets, public.comments,
            public.deliverables, public.split_sheet_entries;

-- =============================================================================
-- Storage: block-media bucket + RLS
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('block-media', 'block-media', false)
on conflict (id) do nothing;

-- Object paths: <workspace_id>/<block_id|shared>/<filename>
-- We allow access if the user is a member of the workspace in the path's
-- first segment. (RLS on media_assets is the source of truth for app reads;
-- this gates raw object access via Storage.)

drop policy if exists "block-media read" on storage.objects;
create policy "block-media read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'block-media'
    and public.is_workspace_member((split_part(name, '/', 1))::uuid)
  );

drop policy if exists "block-media insert" on storage.objects;
create policy "block-media insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'block-media'
    and public.is_workspace_member((split_part(name, '/', 1))::uuid)
  );

drop policy if exists "block-media delete" on storage.objects;
create policy "block-media delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'block-media'
    and public.is_workspace_member((split_part(name, '/', 1))::uuid)
  );
