-- 0007_block_membership.sql
-- Real Block membership + invitations. Extends block_members with an invitation
-- lifecycle so a creator can invite others, those people can accept/decline, and
-- everyone can see the roster with status.

do $$ begin
  create type block_member_status as enum ('invited', 'accepted', 'declined');
exception
  when duplicate_object then null;
end $$;

alter table public.block_members
  add column if not exists status block_member_status not null default 'accepted',
  add column if not exists invited_by uuid references auth.users(id) on delete set null,
  add column if not exists invited_at timestamptz;

-- "My invitations / memberships" lookups.
create index if not exists block_members_status_idx
  on public.block_members (user_id, status);

-- An invitee can update their OWN membership row (accept / decline). Existing
-- select + insert policies already cover viewing the roster and inviting.
drop policy if exists "block_members update own" on public.block_members;
create policy "block_members update own"
  on public.block_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
