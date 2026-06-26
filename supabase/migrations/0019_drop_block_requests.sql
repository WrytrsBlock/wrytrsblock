-- 0019_drop_block_requests.sql
-- (Repurposed.) The Block Request system (block_requests + send/accept/decline)
-- is the CANONICAL collaboration flow and is intentionally KEPT.
--
-- This migration removes the competing, never-canonical membership-invite RPCs
-- that briefly coexisted (invite_to_block / respond_to_invitation). Inviting a
-- collaborator is now exactly "send a Block Request", so these are obsolete. The
-- drops are idempotent and safe whether or not the functions were ever created.

drop function if exists public.invite_to_block(uuid, text[]);
drop function if exists public.respond_to_invitation(uuid, boolean);

notify pgrst, 'reload schema';
