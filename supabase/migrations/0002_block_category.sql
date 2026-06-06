-- 0002_block_category.sql
-- Adds the Collaboration Block category (Song / Beat / Project / Open Block /
-- Community) introduced in the prototype merge. Service Blocks leave it null.

do $$ begin
  create type block_category as enum
    ('Song', 'Beat', 'Project', 'Open Block', 'Community');
exception
  when duplicate_object then null;
end $$;

alter table public.blocks
  add column if not exists category block_category;

-- Backfill existing collaboration Blocks to a sensible default so the field
-- always renders. Service Blocks stay null.
update public.blocks
  set category = 'Project'
  where category is null
    and block_type = 'collaboration';
