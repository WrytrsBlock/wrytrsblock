"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/env";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [magic, setMagic] = useState(false);
  const [reset, setReset] = useState(false);
  // Password reset uses a 6-digit emailed code (no fragile links): step 1 sends
  // the code, step 2 verifies it, then we go set the new password.
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");

  // Surface auth-callback errors (e.g. an expired reset link) and drop the user
  // straight into the reset flow so they can request a fresh email.
  useEffect(() => {
    const authError = params.get("autherror");
    if (authError) {
      setError(authError);
      setReset(true);
    }
    if (params.get("deleted")) {
      setNotice("Your account has been deleted. We're sorry to see you go.");
    }
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    // Forgot-password flow — 6-digit code (no links): step 1 emails the code,
    // step 2 verifies it (which establishes a recovery session), then we send
    // the user to /reset-password to choose a new password.
    if (reset) {
      if (!supabaseConfigured) {
        if (!codeSent) {
          setCodeSent(true);
          setNotice("Enter the 6-digit code we emailed you.");
        } else {
          router.push("/reset-password");
        }
        setLoading(false);
        return;
      }
      const supabase = createSupabaseBrowserClient();

      if (!codeSent) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) setError(error.message);
        else {
          setCodeSent(true);
          setNotice(`We emailed a 6-digit code to ${email}. Enter it below.`);
        }
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "recovery",
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Recovery session is now active — go set a new password.
      router.push("/reset-password");
      router.refresh();
      return;
    }

    if (!supabaseConfigured) {
      // Local-dev fallback: skip auth.
      router.push(next);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (magic) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            next
          )}`,
        },
      });
      if (error) setError(error.message);
      else setError("Check your inbox for a sign-in link.");
      setLoading(false);
      return;
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If onboarding isn't complete (no creator_profiles row yet), send them to
    // finish setup instead of the requested destination.
    let dest = next;
    try {
      const uid = authData.user?.id;
      if (uid) {
        const { data: cp } = await supabase
          .from("creator_profiles")
          .select("handle")
          .eq("id", uid)
          .maybeSingle();
        if (!cp?.handle) dest = "/onboarding";
      }
    } catch {
      /* ignore — fall back to next */
    }

    router.push(dest);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {reset && (
        <p className="text-[12px] leading-relaxed text-muted">
          {codeSent
            ? "Enter the 6-digit code we just emailed you to reset your password."
            : "Enter your account email and we'll email you a 6-digit reset code."}
        </p>
      )}

      {!(reset && codeSent) && (
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
      )}

      {reset && codeSent && (
        <div>
          <Label htmlFor="reset-code">6-digit code</Label>
          <Input
            id="reset-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            placeholder="123456"
            maxLength={6}
            required
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="text-center text-[18px] tracking-[0.4em]"
          />
          <p className="mt-1.5 text-[11px] text-muted">Sent to {email}</p>
        </div>
      )}

      {!magic && !reset && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <button
              type="button"
              onClick={() => {
                setReset(true);
                setMagic(false);
                setError(null);
                setNotice(null);
              }}
              className="text-[11px] text-muted hover:text-ink transition-colors"
            >
              Forgot?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required={!magic}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}

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
        {loading
          ? reset
            ? codeSent
              ? "Verifying…"
              : "Sending…"
            : "Signing in…"
          : reset
            ? codeSent
              ? "Verify & continue"
              : "Email me a code"
            : magic
              ? "Send magic link"
              : "Sign in"}
        <ArrowRight size={14} />
      </Button>

      {reset ? (
        <div className="flex flex-col items-center gap-1">
          {codeSent && (
            <button
              type="button"
              onClick={() => {
                setCode("");
                setCodeSent(false);
                setError(null);
                setNotice(null);
              }}
              className="text-[12px] text-muted transition-colors hover:text-ink py-1"
            >
              Didn&apos;t get it? Send another code
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setReset(false);
              setCodeSent(false);
              setCode("");
              setError(null);
              setNotice(null);
            }}
            className="w-full inline-flex items-center justify-center gap-2 text-[12px] text-muted hover:text-ink transition-colors py-1"
          >
            <ArrowLeft size={12} /> Back to sign in
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMagic(!magic)}
          className="w-full inline-flex items-center justify-center gap-2 text-[12px] text-muted hover:text-ink transition-colors py-2"
        >
          <Mail size={12} />
          {magic ? "Use password instead" : "Sign in with a magic link"}
        </button>
      )}
    </form>
  );
}
