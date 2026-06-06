"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/env";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/marketplace";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magic, setMagic] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

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

      {!magic && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <button
              type="button"
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

      <Button
        variant="primary"
        size="lg"
        type="submit"
        className="w-full justify-between"
        disabled={loading}
      >
        {loading ? "Signing in…" : magic ? "Send magic link" : "Sign in"}
        <ArrowRight size={14} />
      </Button>

      <button
        type="button"
        onClick={() => setMagic(!magic)}
        className="w-full inline-flex items-center justify-center gap-2 text-[12px] text-muted hover:text-ink transition-colors py-2"
      >
        <Mail size={12} />
        {magic ? "Use password instead" : "Sign in with a magic link"}
      </button>
    </form>
  );
}
