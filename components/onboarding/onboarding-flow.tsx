"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  CircleCheck,
  Layers,
  Mail,
  MapPin,
  Sparkles,
  Star,
  Home,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/marketing/wordmark";
import { Avatar, Button, Input, Progress } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  Chip,
  Field,
  PhotoPicker,
  ProgressHeader,
  StepHeading,
} from "@/components/onboarding/primitives";
import { completeOnboardingAction } from "@/app/actions/onboarding";
import {
  AVAILABILITY,
  BIO_MAX,
  BIO_MIN,
  CITY_SUGGESTIONS,
  COUNTRIES,
  CREATOR_TYPES,
  EXPERIENCE_LEVELS,
  INTERESTS,
  LOOKING_FOR,
  TOTAL_STEPS,
  blockMatchScore,
  creatorTypeLabel,
  emptyOnboarding,
  interestLabel,
  isStepComplete,
  locationLabel,
  toUsername,
  type OnboardingProfile,
} from "@/lib/onboarding";

const DRAFT_KEY = "wb:onboarding";
const DISPLAY_TOTAL = TOTAL_STEPS + 1; // 4 screens incl. the review screen
const STEP_LABELS = ["Profile", "Identity", "Creative Profile", "Launch"];

export function OnboardingFlow({
  initialName = "",
  emailNotice = false,
}: {
  initialName?: string;
  // Show a non-blocking "check your email" banner (set after signup when email
  // confirmation is still pending). Never gates the flow.
  emailNotice?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showEmailNotice, setShowEmailNotice] = useState(emailNotice);
  const [step, setStep] = useState(0);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [data, setData] = useState<OnboardingProfile>(() =>
    emptyOnboarding(initialName)
  );
  // Setup is only "complete" once the server confirms the save+publish. We then
  // show a dedicated confirmation screen instead of silently navigating away.
  const [completed, setCompleted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Hydrate a saved draft so a refresh doesn't lose progress (object-URL photos
  // don't survive reload — the avatar falls back to initials).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<OnboardingProfile>;
        setData((d) => ({ ...d, ...saved, photo: null }));
        if (saved.username) setUsernameTouched(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const { photo: _photo, ...rest } = data;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
    } catch {
      /* ignore */
    }
  }, [data]);

  function patch(p: Partial<OnboardingProfile>) {
    setData((d) => ({ ...d, ...p }));
  }

  function setName(value: string) {
    setData((d) => ({
      ...d,
      name: value,
      username: usernameTouched ? d.username : toUsername(value),
    }));
  }

  function toggle<T>(key: keyof OnboardingProfile, value: T) {
    setData((d) => {
      const arr = d[key] as unknown as T[];
      const has = arr.includes(value);
      return {
        ...d,
        [key]: has ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  const isFinal = step === TOTAL_STEPS;
  const percent = Math.round(((step + 1) / DISPLAY_TOTAL) * 100);
  const canContinue = isStepComplete(step, data);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Complete Profile Setup — saves every field, marks onboarding complete, and
  // publishes the creator profile (is_published=true) so it's live in the Block
  // Market. Navigation is NOT the trigger: we only advance to the confirmation
  // screen once the server confirms success, and surface errors otherwise so the
  // user can retry instead of being told "you're in" when nothing saved.
  function completeSetup() {
    const { photo: _photo, ...rest } = data;
    setSaveError(null);
    startTransition(async () => {
      try {
        // data.photo is the uploaded Storage URL (set by PhotoPicker).
        const res = await completeOnboardingAction(rest, data.photo ?? null);
        if (!res.ok) {
          console.error("Onboarding completion failed:", res.error);
          setSaveError(
            res.error || "Couldn't complete setup. Please try again."
          );
          return;
        }
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(rest));
          localStorage.setItem("wb:onboarded", "1");
        } catch {
          /* ignore */
        }
        console.log("[onboarding] completed + published (client)");
        // Refresh server state so the gate + dashboard immediately see the
        // now-published profile, then show the confirmation screen.
        router.refresh();
        setCompleted(true);
      } catch (e) {
        console.error("Onboarding completion threw:", e);
        setSaveError("Something went wrong saving your profile. Please try again.");
      }
    });
  }

  if (completed) {
    return (
      <SetupComplete
        data={data}
        onDashboard={() => {
          router.replace("/home");
          router.refresh();
        }}
        onProfile={() => {
          router.push("/profile");
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-bg text-ink">
      <div className="absolute inset-0 bg-grad-mesh opacity-20 pointer-events-none" />

      {/* Non-blocking email-confirmation banner (post-signup) */}
      {showEmailNotice && (
        <div className="relative z-20 flex items-center gap-2 border-b border-accent/30 bg-accent/10 px-5 md:px-8 py-2.5">
          <Mail size={14} className="text-accent shrink-0" />
          <p className="flex-1 text-[12.5px] text-ink">
            Check your email to confirm your account. You can keep setting up your
            profile in the meantime.
          </p>
          <button
            type="button"
            onClick={() => setShowEmailNotice(false)}
            aria-label="Dismiss"
            className="shrink-0 text-muted hover:text-ink transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <header className="relative z-10 border-b border-line/60">
        <div className="mx-auto w-full max-w-[660px] px-5 md:px-8 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <Wordmark variant="lockup" width={104} />
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <Sparkles size={12} className="text-accent" />
              {isFinal ? "Review & launch" : "Creator profile"}
            </span>
          </div>
          <div className="mt-4">
            <ProgressHeader
              step={step + 1}
              total={DISPLAY_TOTAL}
              percent={percent}
              label={STEP_LABELS[step]}
            />
            {/* 1. Profile → 2. Identity → 3. Creative Profile → 4. Launch */}
            <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-0.5 -mb-0.5">
              {STEP_LABELS.map((label, i) => {
                const active = i === step;
                const done = i < step;
                return (
                  <div
                    key={label}
                    className="flex items-center gap-1 shrink-0"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5 rounded-full pl-1 pr-2.5 py-1 transition-colors",
                        active && "bg-accent/10"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold tabular-nums transition-colors",
                          active
                            ? "border-accent bg-accent text-white"
                            : done
                              ? "border-accent/40 bg-accent/15 text-accent"
                              : "border-line bg-surface-2 text-muted/70"
                        )}
                      >
                        {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                      </span>
                      <span
                        className={cn(
                          "text-[12.5px] font-semibold whitespace-nowrap transition-colors",
                          active
                            ? "text-accent"
                            : done
                              ? "text-ink/75"
                              : "text-muted/60"
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <ArrowRight
                        size={13}
                        className="shrink-0 text-muted/40"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <div
          key={step}
          className="mx-auto w-full max-w-[660px] px-5 md:px-8 py-7 md:py-9 animate-fade-up"
        >
          {renderStep()}
        </div>
      </main>

      {!isFinal && (
        <footer className="relative z-10 border-t border-line/60 bg-bg/80 backdrop-blur">
          <div className="mx-auto w-full max-w-[660px] px-5 md:px-8 py-4 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="lg"
              onClick={back}
              className={cn(step === 0 && "invisible")}
            >
              <ArrowLeft size={14} /> Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={next}
              disabled={!canContinue}
              className="min-w-[140px] justify-between"
            >
              {step === TOTAL_STEPS - 1 ? "Review profile" : "Continue"}
              <ArrowRight size={14} />
            </Button>
          </div>
        </footer>
      )}
    </div>
  );

  function renderStep() {
    switch (step) {
      // ---------- 1 · Profile ----------
      case 0:
        return (
          <div className="space-y-6">
            <StepHeading
              kicker="Welcome to WrytrsBlock"
              title="Let's set up your profile."
              subtitle="This is how creators will find and recognize you."
            />
            <PhotoPicker
              value={data.photo}
              name={data.name}
              onChange={(url) => patch({ photo: url })}
              required
            />
            <div className="space-y-3.5 max-w-[460px] mx-auto w-full">
              <Field label="Display name">
                <Input
                  autoFocus
                  placeholder="Aria Kade"
                  value={data.name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Username">
                <div className="relative">
                  <AtSign
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                  <Input
                    className="pl-9"
                    placeholder="ariakade"
                    value={data.username}
                    onChange={(e) => {
                      setUsernameTouched(true);
                      patch({ username: toUsername(e.target.value) });
                    }}
                  />
                </div>
                {data.username && (
                  <p className="mt-1.5 text-[11px] text-muted font-mono">
                    wrytrsblock.com/@{data.username}
                  </p>
                )}
              </Field>
              <Field
                label="Bio"
                hint={
                  <span
                    className={cn(
                      data.bio.length > 0 &&
                        data.bio.length < BIO_MIN &&
                        "text-warning"
                    )}
                  >
                    {data.bio.length}/{BIO_MAX}
                  </span>
                }
              >
                <textarea
                  rows={3}
                  maxLength={BIO_MAX}
                  placeholder="Producer & engineer crafting warm, cinematic records. Open to vocalists and writers."
                  value={data.bio}
                  onChange={(e) => patch({ bio: e.target.value })}
                  className="w-full rounded-lg bg-surface-2 border border-line text-ink text-[13px] leading-relaxed px-3 py-2.5 placeholder:text-muted/70 focus:outline-none focus:border-accent/50 focus:bg-surface transition-colors resize-none"
                />
              </Field>
            </div>
          </div>
        );

      // ---------- 2 · Creator Identity ----------
      case 1:
        return (
          <div className="space-y-6">
            <StepHeading
              kicker="Creator identity"
              title="What type of creator are you?"
              subtitle="Pick all that apply, then tell us where you're based."
            />
            <div className="flex flex-wrap gap-2">
              {CREATOR_TYPES.map((o) => (
                <Chip
                  key={o.id}
                  label={o.label}
                  selected={data.creatorTypes.includes(o.id)}
                  onClick={() => toggle("creatorTypes", o.id)}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Country">
                <select
                  value={data.country}
                  onChange={(e) => patch({ country: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-surface-2 border border-line text-ink text-[13px] focus:outline-none focus:border-accent/50 focus:bg-surface transition-colors"
                >
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="City">
                <div className="relative">
                  <MapPin
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                  />
                  <Input
                    className="pl-9"
                    list="wb-cities"
                    placeholder="Search your city"
                    value={data.city}
                    onChange={(e) => patch({ city: e.target.value })}
                  />
                  <datalist id="wb-cities">
                    {CITY_SUGGESTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </Field>
            </div>
          </div>
        );

      // ---------- 3 · Creative Profile ----------
      case 2:
        return (
          <div className="space-y-10">
            <StepHeading
              kicker="Creative profile"
              title="Your sound & collaborations."
              subtitle="Genres you work in, what you offer, and who you want to build with."
            />
            <Field size="lg" label="Genres / creative fields">
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <Chip
                    key={i.id}
                    label={i.label}
                    selected={data.interests.includes(i.id)}
                    onClick={() => toggle("interests", i.id)}
                  />
                ))}
              </div>
            </Field>
            <Field size="lg" label="What I offer">
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    selected={data.availability.includes(o.id)}
                    onClick={() => toggle("availability", o.id)}
                  />
                ))}
              </div>
            </Field>
            <Field size="lg" label="What I'm looking for">
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR.map((l) => (
                  <Chip
                    key={l.id}
                    label={l.label}
                    selected={data.lookingFor.includes(l.id)}
                    onClick={() => toggle("lookingFor", l.id)}
                  />
                ))}
              </div>
            </Field>
            <Field size="lg" label="Experience level">
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((o) => (
                  <Chip
                    key={o.id}
                    label={o.label}
                    selected={data.experience === o.id}
                    onClick={() => patch({ experience: o.id })}
                  />
                ))}
              </div>
            </Field>
          </div>
        );

      // ---------- 4 · Review & Launch ----------
      default:
        return (
          <ProfileComplete
            data={data}
            pending={pending}
            saveError={saveError}
            onComplete={completeSetup}
          />
        );
    }
  }
}

function ProfileComplete({
  data,
  pending,
  saveError,
  onComplete,
}: {
  data: OnboardingProfile;
  pending: boolean;
  saveError: string | null;
  onComplete: () => void;
}) {
  const match = blockMatchScore(data);
  const loc = locationLabel(data);
  const firstName = (data.name || "").trim().split(/\s+/)[0] || "";

  // Social-proof placeholders — real values populate as the creator works.
  const stats = [
    { icon: Layers, value: "0", label: "Blocks" },
    { icon: Star, value: "New", label: "Rating" },
    { icon: Users, value: "0", label: "Collaborators" },
  ];

  return (
    <div className="space-y-6">
      {/* Community welcome */}
      <div className="text-center">
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-accent font-semibold">
          Last step
        </p>
        <h1 className="mt-2 font-display text-[26px] md:text-[32px] text-ink tracking-tight leading-tight">
          {firstName ? `Looking good, ${firstName}.` : "Looking good."}
        </h1>
        <p className="mt-2 text-[13.5px] text-muted max-w-md mx-auto leading-relaxed">
          Here&apos;s how the community will see you. Complete your Creator Setup
          to publish your profile and appear in the Block Market.
        </p>
      </div>

      {/* Creator showcase */}
      <div className="glass-card glass-glow rounded-3xl overflow-hidden">
        {/* Banner — creator-uploaded image (falls back to the brand mosaic) */}
        <div className="relative h-44 md:h-52">
          {data.photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.photo}
                alt=""
                className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-60"
              />
              <div className="absolute inset-0 bg-grad-accent opacity-30 mix-blend-overlay" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-grad-accent" />
              <div className="absolute inset-0 bg-grad-mesh opacity-70" />
              <div
                className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.85) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.85) 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/25 to-transparent" />
        </div>

        {/* Identity */}
        <div className="px-5 md:px-7 pb-7 -mt-16">
          <Avatar
            src={data.photo ?? undefined}
            name={data.name || "You"}
            size={128}
            className="border-4 border-surface shadow-glow"
          />

          {/* Name + roles = primary focus */}
          <div className="mt-4">
            <h2 className="font-display text-[30px] md:text-[38px] text-ink tracking-tight leading-[1.05]">
              {data.name || "Your name"}
            </h2>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[13px] text-muted">
              {data.username && <span>@{data.username}</span>}
              {data.username && loc && <span className="text-muted/40">·</span>}
              {loc && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={13} /> {loc}
                </span>
              )}
            </div>
          </div>

          {data.creatorTypes.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-2">
              {data.creatorTypes.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center h-9 px-4 rounded-full bg-accent/15 border border-accent/40 text-accent text-[13.5px] font-semibold"
                >
                  {creatorTypeLabel(t)}
                </span>
              ))}
            </div>
          )}

          {/* Social proof — placeholders until the creator gets to work */}
          <div className="mt-5 grid grid-cols-3 rounded-2xl border border-line bg-surface-2/40 divide-x divide-line overflow-hidden">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center py-3.5 px-2 text-center"
              >
                <Icon size={15} className="text-accent" />
                <span className="mt-1.5 text-[16px] font-bold text-ink tabular-nums leading-none">
                  {value}
                </span>
                <span className="mt-1 text-[11px] text-muted">{label}</span>
              </div>
            ))}
          </div>

          {/* Bio */}
          {data.bio.trim() && (
            <p className="mt-5 text-[14.5px] text-ink/90 leading-relaxed">
              {data.bio}
            </p>
          )}

          {/* Genres */}
          {data.interests.length > 0 && (
            <div className="mt-5">
              <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted/80 font-semibold">
                Genres
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {data.interests.map((i) => (
                  <span
                    key={i}
                    className="inline-flex items-center h-7 px-3 rounded-full bg-surface-2 border border-line text-ink/80 text-[12.5px] font-medium"
                  >
                    {interestLabel(i)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Block Match — lower in the hierarchy, supporting detail */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink">
            <Sparkles size={13} className="text-accent" /> Block Match
          </span>
          <span className="text-[13px] font-bold text-accent tabular-nums">
            {match.score}
          </span>
        </div>
        <ul className="mt-3 space-y-2">
          {match.factors.map((f) => (
            <li key={f.key} className="flex items-center gap-3">
              <span className="text-[11.5px] text-muted flex-1 min-w-0 truncate">
                {f.label}
              </span>
              <span className="w-24 shrink-0">
                <Progress value={f.pct * 100} size="thin" />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Single, unambiguous completion action — this saves + publishes. */}
      <div className="space-y-2.5">
        <Button
          variant="primary"
          size="lg"
          onClick={onComplete}
          disabled={pending}
          className="w-full h-12 text-[14px] justify-center tracking-wide"
        >
          {pending ? "Publishing your profile…" : "Complete Profile Setup"}
          {!pending && <ArrowRight size={15} />}
        </Button>
        {saveError && (
          <p className="text-center text-[12.5px] text-danger">{saveError}</p>
        )}
      </div>
    </div>
  );
}

// Shown only after the server confirms the profile was saved + published. Makes
// the outcome unambiguous and offers the two next steps, decoupled from the
// publish action itself.
function SetupComplete({
  data,
  onDashboard,
  onProfile,
}: {
  data: OnboardingProfile;
  onDashboard: () => void;
  onProfile: () => void;
}) {
  const firstName = (data.name || "").trim().split(/\s+/)[0] || "";

  // The dashboard must appear right after setup — auto-route there shortly after
  // the confirmation, regardless of the browser (Safari/Chrome/in-app/PWA). The
  // buttons are for users who tap before the timer fires.
  useEffect(() => {
    const t = setTimeout(onDashboard, 1400);
    return () => clearTimeout(t);
  }, [onDashboard]);

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center bg-bg text-ink px-5 py-12">
      <div className="absolute inset-0 bg-grad-mesh opacity-20 pointer-events-none" />
      <div className="relative z-10 w-full max-w-md text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success ring-1 ring-success/30">
          <CircleCheck size={32} strokeWidth={2} />
        </span>

        <p className="mt-6 text-[10.5px] uppercase tracking-[0.2em] text-success font-semibold">
          Profile Setup Complete
        </p>
        <h1 className="mt-2 font-display text-[28px] md:text-[34px] text-ink tracking-tight leading-tight">
          {firstName ? `You're live, ${firstName}.` : "You're live."}
        </h1>
        <p className="mt-3 text-[14px] text-muted leading-relaxed">
          Your profile is published and you&apos;re discoverable in the Block
          Market. Taking you to your dashboard…
        </p>

        <div className="mt-8 flex flex-col gap-2.5">
          <Button
            variant="primary"
            size="lg"
            onClick={onDashboard}
            className="w-full h-12 text-[14px] justify-center tracking-wide"
          >
            <Home size={16} /> Go to Dashboard
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onProfile}
            className="w-full h-12 text-[14px] justify-center"
          >
            <UserIcon size={16} /> View My Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
