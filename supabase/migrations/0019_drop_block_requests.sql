-- 0019_drop_block_requests.sql
-- Removes the legacy request-to-create system. Apply this ONLY AFTER the new
-- single-block membership UI is deployed, so nothing still calls these RPCs.
-- Until then, 0018 (additive) and the old request flow safely coexist.

drop function if exists public.send_block_request(uuid, text, text, text, text);
drop function if exists public.accept_block_request(uuid);
drop function if exists public.decline_block_request(uuid);
drop table if exists public.block_requests cascade;

notify pgrst, 'reload schema';
