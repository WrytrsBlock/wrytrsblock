-- 0010_block_requests.sql
-- Strict Block Request workflow. A creator sends a Block Request to another
-- creator. NOTHING is created on send — no Block, no chat, no membership. The
-- recipient Accepts (which creates the Block + adds both members) or Declines
-- (which creates nothing). This is how communication begins on WrytrsBlock:
-- you Start a Block, you don't send a message.

do $$ begin
  create type block_request_status as enum ('pending', 'accepted', 'declined');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.block_requests (
  id               uuid primary key default gen_random_uuid(),
  requester_id     uuid not null references auth.users(id) on delete cascade,
  recipient_id     uuid not null references auth.users(id) on delete cascade,
  -- Denormalized snapshot of the requester (for the recipient's inbox display).
  requester_name   text,
  requester_handle text,
  block_title      text not null,
  block_type       block_type not null default 'collaboration',
  intro_message    text not null,
  expected_outcome text,
  status           block_request_status not null default 'pending',
  -- Set when accepted — links the request to the Block that was created.
  block_id         uuid references public.blocks(id) on delete set null,
  created_at       timestamptz not null default now(),
  responded_at     timestamptz,
  constraint block_requests_no_self check (requester_id <> recipient_id)
);

create index if not exists block_requests_recipient_idx
  on public.block_requests (recipient_id, status, created_at desc);
create index if not exists block_requests_requester_idx
  on public.block_requests (requester_id, status, created_at desc);

alter table public.block_requests enable row level security;

-- The requester creates their own request.
drop policy if exists "block_requests insert own" on public.block_requests;
create policy "block_requests insert own"
  on public.block_requests for insert
  to authenticated
  with check (requester_id = auth.uid());

-- Both parties can read requests they're part of.
drop policy if exists "block_requests select own" on public.block_requests;
create policy "block_requests select own"
  on public.block_requests for select
  to authenticated
  using (requester_id = auth.uid() or recipient_id = auth.uid());

-- The recipient responds (accept / decline). The requester may cancel.
drop policy if exists "block_requests update party" on public.block_requests;
create policy "block_requests update party"
  on public.block_requests for update
  to authenticated
  using (recipient_id = auth.uid() or requester_id = auth.uid())
  with check (recipient_id = auth.uid() or requester_id = auth.uid());

-- Block chat access for collaborators. A creator added to a Block via an
-- accepted Block Request is a Block member but NOT a member of the Block
-- owner's workspace — so they couldn't see the Block channels. Extend
-- is_channel_member() so accepted Block members can access their Block's
-- channels (additive OR clause; existing access is unchanged).
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
    )
    or exists (
      select 1
      from public.channels c
      join public.block_members bm on bm.block_id = c.block_id
      where c.id = c_id
        and bm.user_id = auth.uid()
        and bm.status = 'accepted'
    );
$$;
