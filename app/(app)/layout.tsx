import { headers } from "next/headers";
import { Sidebar } from "@/components/shell/sidebar";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { CommandPalette } from "@/components/shell/command-palette";
import { Ambient } from "@/components/shell/ambient";
import { PublicTopBar } from "@/components/shell/public-top-bar";
import { NewBlockDialog } from "@/components/block/new-block-dialog";
import { ProfileProvider } from "@/components/shell/profile-context";
import { MusicPlayerProvider } from "@/components/player/music-player";
import { MusicPlayerBar } from "@/components/player/music-player-bar";
import {
  getBlocks,
  getCurrentProfile,
  getNotifications,
  hasCompletedOnboarding,
} from "@/lib/data";
import { isPublicBrowsePath } from "@/lib/public-routes";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    // Marketplace/Discovery and individual creator profiles are readable by a
    // signed-out visitor (see lib/public-routes.ts) — everything else in this
    // route group still requires a session, unchanged.
    const pathname = headers().get("x-pathname") ?? "";
    if (!isPublicBrowsePath(pathname)) redirect("/sign-in");

    // Deliberately NOT the authenticated shell below: Sidebar/BottomTabBar/
    // CommandPalette/NewBlockDialog all assume a signed-in profile (the
    // user's own Blocks, notifications, etc.), none of which exist for an
    // anonymous visitor. MusicPlayerProvider/MusicPlayerBar are the
    // exception — they carry no auth dependency of their own, and a
    // profile's Featured Tracks (components/creator/featured-tracks.tsx)
    // requires the provider to be present or it throws, so it's kept to
    // preserve that existing functionality for a signed-out visitor too.
    return (
      <MusicPlayerProvider>
        <div className="dark relative min-h-[100dvh] lg-canvas text-ink">
          <Ambient />
          <PublicTopBar />
          <main className="relative">{children}</main>
          <MusicPlayerBar />
        </div>
      </MusicPlayerProvider>
    );
  }

  // Never let a signed-in user get stuck without a profile: if onboarding isn't
  // complete (no creator_profiles row), always route them to Creator Setup.
  // /onboarding lives outside this (app) group, so there's no redirect loop.
  if (!(await hasCompletedOnboarding())) redirect("/onboarding");

  const [blocks, notifications] = await Promise.all([
    getBlocks(),
    getNotifications(),
  ]);
  const unreadNotifications = notifications.filter((n) => n.unread).length;

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
      <MusicPlayerProvider>
        <div className="dark relative flex h-[100dvh] lg-canvas text-ink overflow-hidden">
          <Ambient />
          <Sidebar
            profile={profile}
            blocks={blocks}
            unreadNotifications={unreadNotifications}
          />
          <main className="relative flex-1 min-w-0 flex flex-col">
            {children}
            {/* Persistent discovery player — stays mounted (and playing) across
                navigation; sits just above the mobile dock. */}
            <MusicPlayerBar />
            <BottomTabBar profileHref="/profile" />
          </main>

          {/* Global overlays */}
          <CommandPalette blocks={blocks} />
          <NewBlockDialog />
        </div>
      </MusicPlayerProvider>
    </ProfileProvider>
  );
}
