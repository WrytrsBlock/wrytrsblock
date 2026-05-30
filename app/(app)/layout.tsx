import { Sidebar } from "@/components/shell/sidebar";
import { MobileNav } from "@/components/shell/mobile-nav";
import { CommandPalette } from "@/components/shell/command-palette";
import { NewBlockDialog } from "@/components/block/new-block-dialog";
import { InviteDialog } from "@/components/block/invite-dialog";
import { ProfileProvider } from "@/components/shell/profile-context";
import {
  getBlocks,
  getCurrentProfile,
  getWorkspacesForSwitcher,
} from "@/lib/data";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  const [workspaces, blocks] = await Promise.all([
    getWorkspacesForSwitcher(),
    getBlocks(),
  ]);
  const workspace = workspaces[0];

  return (
    <ProfileProvider
      value={{
        name: profile.name,
        handle: profile.handle,
        avatar: profile.avatar,
        role: profile.role,
      }}
    >
      <div className="flex h-screen bg-bg overflow-hidden">
        <Sidebar profile={profile} workspaces={workspaces} blocks={blocks} />
        <MobileNav profile={profile} workspace={workspace} blocks={blocks} />
        <main className="flex-1 min-w-0 flex flex-col">{children}</main>

        {/* Global overlays */}
        <CommandPalette blocks={blocks} />
        <NewBlockDialog />
        <InviteDialog />
      </div>
    </ProfileProvider>
  );
}
