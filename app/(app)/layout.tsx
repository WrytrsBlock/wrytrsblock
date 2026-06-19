import { Sidebar } from "@/components/shell/sidebar";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { CommandPalette } from "@/components/shell/command-palette";
import { Ambient } from "@/components/shell/ambient";
import { NewBlockDialog } from "@/components/block/new-block-dialog";
import { InviteDialog } from "@/components/block/invite-dialog";
import { ProfileProvider } from "@/components/shell/profile-context";
import {
  getBlocks,
  getCurrentProfile,
  getUnreadMessageCount,
  hasCompletedOnboarding,
} from "@/lib/data";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  // Never let a signed-in user get stuck without a profile: if onboarding isn't
  // complete (no creator_profiles row), always route them to Creator Setup.
  // /onboarding lives outside this (app) group, so there's no redirect loop.
  if (!(await hasCompletedOnboarding())) redirect("/onboarding");

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
      {/* Hybrid shell: the always-dark liquid-glass canvas with per-route
          ambient washes, a translucent left sidebar as the primary desktop
          navigation, and a single centered glass search pill (rendered by each
          page via <TopBar/>). Mobile keeps the floating dock. */}
      <div className="dark relative flex h-screen lg-canvas text-ink overflow-hidden">
        <Ambient />
        <Sidebar
          profile={profile}
          blocks={blocks}
          unreadMessages={unreadMessages}
        />
        <main className="relative flex-1 min-w-0 flex flex-col">
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
