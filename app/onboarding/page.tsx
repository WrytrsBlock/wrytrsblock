import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

// Full-screen, immersive creator onboarding. Lives outside the app shell so it
// reads like a guided setup, not a settings page. Pre-fills the creator name
// from sign-up when passed along (?name=).
export default function OnboardingPage({
  searchParams,
}: {
  searchParams: { name?: string; confirm?: string };
}) {
  return (
    <OnboardingFlow
      initialName={searchParams.name ?? ""}
      emailNotice={searchParams.confirm === "1"}
    />
  );
}
