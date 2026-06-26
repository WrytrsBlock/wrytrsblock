-- 0023_channels_visible_to_block_members.sql
-- Shared Block chat fix. messages SELECT/INSERT already allow accepted block
-- members (is_channel_member covers them), but the channels table was only
-- SELECTable by workspace members — so a collaborator (a block_members row, NOT
-- in the owner's workspace) could not even resolve their Block's General channel
-- id, and therefore could not load or post messages. Add a membership-based
-- SELECT policy so every block member can see their Block's channel.
--
-- Additive: coexists with the existing workspace policy (policies OR together).

drop policy if exists "channels visible to block members" on public.channels;
create policy "channels visible to block members"
  on public.channels for select
  to authenticated
  using (block_id is not null and public.is_block_member(block_id));

-- Live updates: ensure the messages table is broadcast by Realtime so members
-- see new messages without a refresh. Idempotent — ignore if already added.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when others then null;
end $$;

notify pgrst, 'reload schema';
