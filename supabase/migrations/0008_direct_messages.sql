-- 0008_direct_messages.sql
-- Real 1:1 direct messaging between any two creators (separate from the
-- block-scoped channels). A conversation has members; direct_messages holds the
-- thread. get_or_create_dm() finds or starts the 1:1 atomically so the
-- marketplace "Message" button always lands in the right thread.

create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  is_group    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
create index if not exists conversation_members_user_idx
  on public.conversation_members(user_id);

create table if not exists public.direct_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references auth.users(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index if not exists direct_messages_conv_idx
  on public.direct_messages(conversation_id, created_at);

-- Membership helper (security definer to avoid recursive RLS).
create or replace function public.is_conversation_member(c_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = c_id and user_id = auth.uid()
  );
$$;

-- Find-or-create the 1:1 conversation between the caller and other_id.
create or replace function public.get_or_create_dm(other_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  conv uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if other_id = me then raise exception 'cannot DM yourself'; end if;

  select c.id into conv
  from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = me
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = other_id
  where c.is_group = false
  limit 1;

  if conv is not null then return conv; end if;

  insert into public.conversations (is_group) values (false) returning id into conv;
  insert into public.conversation_members (conversation_id, user_id)
    values (conv, me), (conv, other_id);
  return conv;
end; $$;

alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.direct_messages      enable row level security;

drop policy if exists "conversations member read" on public.conversations;
create policy "conversations member read" on public.conversations
  for select to authenticated using (public.is_conversation_member(id));

drop policy if exists "conversation_members read" on public.conversation_members;
create policy "conversation_members read" on public.conversation_members
  for select to authenticated using (public.is_conversation_member(conversation_id));

drop policy if exists "conversation_members update own" on public.conversation_members;
create policy "conversation_members update own" on public.conversation_members
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "direct_messages read" on public.direct_messages;
create policy "direct_messages read" on public.direct_messages
  for select to authenticated using (public.is_conversation_member(conversation_id));

drop policy if exists "direct_messages send" on public.direct_messages;
create policy "direct_messages send" on public.direct_messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_conversation_member(conversation_id));

-- Live updates for the open thread.
do $$ begin
  alter publication supabase_realtime add table public.direct_messages;
exception when duplicate_object then null;
end $$;
