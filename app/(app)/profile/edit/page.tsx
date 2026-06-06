import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/topbar";
import { EditProfileForm } from "@/components/creator/edit-profile-form";
import { getMyCreatorProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

// Edit the signed-in creator's profile (writes to creator_profiles). If they
// haven't created a profile yet, send them to onboarding.
export default async function EditProfilePage() {
  const profile = await getMyCreatorProfile();
  if (!profile) redirect("/onboarding");

  return (
    <>
      <TopBar
        crumbs={[
          { label: "The CR8TV Collectv" },
          { label: "Profile", href: "/profile" },
          { label: "Edit" },
        ]}
      />
      <EditProfileForm initial={profile} />
    </>
  );
}
