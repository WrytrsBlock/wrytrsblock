import { redirect } from "next/navigation";
import { getMyCreatorProfileHandle } from "@/lib/data";

export const dynamic = "force-dynamic";

// Profile entry point. Routes to the real creator profile only when a completed
// creator_profiles record exists; otherwise sends the user to finish onboarding.
export default async function ProfileIndexPage() {
  const handle = await getMyCreatorProfileHandle();
  if (handle) redirect(`/profile/${handle}`);
  redirect("/onboarding");
}
