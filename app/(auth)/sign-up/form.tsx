"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/env";
import { notifySignupAction } from "@/app/actions/signup-notify";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    // Validate the passwords match before we ever call Supabase.
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);

    // New creators go straight into the guided onboarding to build their
    // profile (the name carries over to step 1).
    const onboardingPath = `/onboarding?name=${encodeURIComponent(name)}`;

    if (!supabaseConfigured) {
      router.push(onboardingPath);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          onboardingPath
        )}`,
      },
    });

    if (error) {
      const alreadyExists =
        /already.*regist|already.*exist|registered/i.test(error.message);
      setError(
        alreadyExists
          ? "Account already exists. Please sign in to continue your creator setup."
          : error.message
      );
      setLoading(false);
      return;
    }

    // Welcome + admin-alert emails fire right here, at the moment the account
    // actually exists — best-effort and awaited (matches this codebase's
    // notify-then-await convention) so it isn't cut off by the redirect below.
    if (data.user) {
      await notifySignupAction(data.user.id).catch((e) => {
        console.error("notifySignupAction failed:", e);
      });
    }

    // Account created — go straight to creator onboarding either way. If email
    // confirmation is pending (no session yet), pass ?confirm=1 so onboarding
    // shows a non-blocking "check your email" banner. Confirmation continues in
    // the background and never blocks setup.
    if (data.session) {
      router.push(onboardingPath);
    } else {
      router.push(`${onboardingPath}&confirm=1`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Aria Kade"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@studio.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {confirmPassword.length > 0 && password !== confirmPassword && (
          <p className="mt-1.5 text-[11px] text-warning">
            Passwords don&apos;t match.
          </p>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-warning bg-warning/10 border border-warning/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      {notice && (
        <p className="text-[12px] text-success bg-success/10 border border-success/30 rounded-md px-3 py-2">
          {notice}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        type="submit"
        className="w-full justify-between"
        disabled={loading}
      >
        {loading ? "Creating account…" : "Create account"}
        <ArrowRight size={14} />
      </Button>

      <p className="text-[11px] text-muted text-center leading-relaxed">
        By creating an account, you agree to our{" "}
        <a
          href="/terms"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}
