import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/topbar";
import { SectionLabel } from "@/components/ui/primitives";
import { ProfileForm } from "./profile-form";
import { getCurrentProfile } from "@/lib/data";
import { getCreatorByHandle } from "@/lib/mock";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  // Pull the creator-profile fields so the form is pre-filled (demo).
  const creator = getCreatorByHandle(profile.handle)?.profile;

  return (
    <>
      <TopBar crumbs={[{ label: "Inkwell Studio" }, { label: "Settings" }]} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 md:px-8 py-8 max-w-[860px] w-full animate-fade-up">
          <div className="mb-7">
            <SectionLabel>Account</SectionLabel>
            <h1 className="mt-2 font-display text-4xl text-ink tracking-tighter">
              Settings
            </h1>
            <p className="text-[13px] text-muted mt-1.5">
              Your profile, creator info, and how the Marketplace sees you.
            </p>
          </div>

          <ProfileForm
            initial={{
              name: profile.name,
              handle: profile.handle,
              email: `${profile.handle}@inkwell.studio`,
              roles: creator?.roles ?? [profile.role],
              bio: creator?.bio ?? "",
              location: creator?.location ?? "",
              website: creator?.website ?? "",
              skills: creator?.skills ?? [],
              avatar: profile.avatar,
              banner: creator?.banner ?? "",
              socials: creator?.socials ?? {},
            }}
          />
        </div>
      </div>
    </>
  );
}
