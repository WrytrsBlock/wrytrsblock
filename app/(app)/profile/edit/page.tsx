import { redirect } from "next/navigation";
import { TopBar } from "@/components/shell/topbar";
import { EditProfileForm } from "@/components/creator/edit-profile-form";
import {
  getCurrentProfile,
  getMyCreatorProfile,
  type EditableCreatorProfile,
} from "@/lib/data";

export const dynamic = "force-dynamic";

// Edit the signed-in creator's profile + Featured Content (writes to
// creator_profiles). This page MANAGES an existing creator — a signed-in user
// should always reach the editor here, never get bounced back into onboarding.
// We only route to /onboarding when there is no account at all; the (app)
// layout already sends unauthenticated visitors to /sign-in.
export default async function EditProfilePage() {
  let initial = await getMyCreatorProfile();

  if (!initial) {
    const me = await getCurrentProfile();
    if (!me) redirect("/onboarding");

    // No creator_profiles row yet (or demo mode): seed the editor from the base
    // account so Featured Content can be managed without restarting setup.
    // Saving upserts the creator profile.
    const fallback: EditableCreatorProfile = {
      handle: me.handle,
      displayName: me.name ?? "",
      bio: "",
      avatarUrl: me.avatar,
      bannerUrl: null,
      country: "",
      city: "",
      creatorTypes: [],
      genres: [],
      lookingFor: [],
      availability: [],
      website: "",
      socials: {},
      portfolio: [],
      youtube: "",
      featuredContent: [],
    };
    initial = fallback;
  }

  return (
    <>
      <TopBar
        crumbs={[
          { label: "The CR8TV Collectv" },
          { label: "Profile", href: "/profile" },
          { label: "Edit" },
        ]}
      />
      <EditProfileForm initial={initial} />
    </>
  );
}
