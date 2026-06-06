-- 0004_block_party.sql
-- Block Party — a third Block type for events: livestreams, listening sessions,
-- Q&As, networking, release parties, open rooms, workshops. Event specifics live
-- in a `party` jsonb payload; entry price reuses blocks.price (null = free) and
-- public/invite reuses blocks.visibility ('Public' / 'By Invite').

-- Extend the block_type enum with 'block_party' (idempotent).
do $$ begin
  alter type block_type add value if not exists 'block_party';
exception
  when duplicate_object then null;
end $$;

-- Event payload: { category, startsAt, status, access, capacity?, chatEnabled,
-- livestreamUrl?, interested }. Kept as jsonb so the shape can evolve without a
-- migration per field.
alter table public.blocks
  add column if not exists party jsonb;
