-- 0003_block_monetization.sql
-- First-class monetization on a Block: a one-time price (whole currency units)
-- and a visibility tier. Free/open Blocks leave both null/Public.

do $$ begin
  create type block_visibility as enum
    ('Public', 'Followers Only', 'Paid Subscribers', 'By Invite');
exception
  when duplicate_object then null;
end $$;

alter table public.blocks
  add column if not exists price integer
    check (price is null or price >= 0),
  add column if not exists visibility block_visibility not null default 'Public';
