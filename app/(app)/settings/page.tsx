import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/topbar";
import { SectionLabel } from "@/components/ui/primitives";
import { ProfileForm } from "./profile-form";
import { getCurrentProfile } from "@/lib/data";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in");

  return (
    <>
      <TopBar crumbs={[{ label: "Inkwell Studio" }, { label: "Settings" }]} />
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-8 max-w-[860px] w-full animate-fade-up">
          <div className="mb-7">
            <SectionLabel>Account</SectionLabel>
            <h1 className="mt-2 font-display text-4xl text-ink tracking-tighter">
              Settings
            </h1>
            <p className="text-[13px] text-muted mt-1.5">
              Your profile, appearance, and how the studio sees you.
            </p>
          </div>

          <ProfileForm
            initial={{
              name: profile.name,
              handle: profile.handle,
              role: profile.role,
              bio: "",
              avatar: profile.avatar,
            }}
          />
        </div>
      </div>
    </>
  );
}
