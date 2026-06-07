import { Sidebar } from "@/components/shell/sidebar";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { CommandPalette } from "@/components/shell/command-palette";
import { NewBlockDialog } from "@/components/block/new-block-dialog";
import { InviteDialog } from "@/components/block/invite-dialog";
import { ProfileProvider } from "@/components/shell/profile-context";
import {
  getBlocks,
  getCurrentProfile,
  getUnreadMessageCount,
} from "@/lib/data";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  const [blocks, unreadMessages] = await Promise.all([
    getBlocks(),
    getUnreadMessageCount(),
  ]);

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
        {/* Desktop: left rail. Mobile: bottom tab bar (rendered in <main>). */}
        <Sidebar
          profile={profile}
          blocks={blocks}
          unreadMessages={unreadMessages}
        />
        <main className="flex-1 min-w-0 flex flex-col">
          {children}
          <BottomTabBar profileHref="/profile" />
        </main>

        {/* Global overlays */}
        <CommandPalette blocks={blocks} />
        <NewBlockDialog />
        <InviteDialog />
      </div>
    </ProfileProvider>
  );
}
