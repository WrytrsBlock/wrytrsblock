"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/env";

// Landing page for the password-reset email link. The link lands here directly
// with a PKCE ?code=…; we exchange it in the browser to establish the recovery
// session, then the user sets a new password immediately — field focused.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // `null` = still checking; true/false = whether a recovery session exists.
  const [hasSession, setHasSession] = useState<boolean | null>(
    supabaseConfigured ? null : true
  );

  useEffect(() => {
    if (!supabaseConfigured) return;
    const sb = createSupabaseBrowserClient();
    (async () => {
      // The reset email lands here with ?code=… (PKCE). Exchange it in the
      // browser — this client holds the code verifier, so it succeeds where a
      // server exchange can't.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        // Best-effort: the client may already auto-exchange the code on load, in
        // which case this throws "already used" — harmless, since the session is
        // then established. We decide purely on getUser() below.
        try {
          await sb.auth.exchangeCodeForSession(code);
        } catch {
          /* ignore — fall through to the session check */
        }
        // Drop the code from the URL so a refresh doesn't re-exchange it.
        window.history.replaceState({}, "", "/reset-password");
      }
      const { data } = await sb.auth.getUser();
      setHasSession(!!data.user);
    })();
  }, []);

  // Focus the new-password field as soon as the form is shown.
  useEffect(() => {
    if (hasSession) {
      document.getElementById("new-password")?.focus();
    }
  }, [hasSession]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);

    if (!supabaseConfigured) {
      setDone(true);
      setBusy(false);
      return;
    }

    try {
      const sb = createSupabaseBrowserClient();
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push("/home");
        router.refresh();
      }, 1400);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't update your password."
      );
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 size={24} />
        </span>
        <div>
          <h1 className="font-display text-3xl tracking-tight text-ink">
            Password updated
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            You're all set — taking you to WrytrsBlock…
          </p>
        </div>
        <Link
          href="/home"
          className="lg-btn lg-btn-p inline-flex"
          style={{ color: "#FFFFFF" }}
        >
          Continue <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  if (hasSession === false) {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
            Reset password
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-ink">
            This link has expired
          </h1>
        </div>
        <p className="text-[13px] leading-relaxed text-muted">
          Your password reset link is invalid or has expired. Request a new one
          and we'll email you a fresh link.
        </p>
        <Link
          href={`/sign-in?autherror=${encodeURIComponent(
            "That link has expired. Request a new password reset email below."
          )}`}
          className="lg-btn lg-btn-p inline-flex"
          style={{ color: "#FFFFFF" }}
        >
          Request a new link <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  if (hasSession === null) {
    return (
      <p className="text-[13px] text-muted">Verifying your reset link…</p>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="mb-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
          Reset password
        </p>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-ink">
          Set a new password
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          Choose a new password for your WrytrsBlock account.
        </p>
      </div>

      <div>
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="At least 8 characters"
          required
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] text-warning">
          {error}
        </p>
      )}

      <Button
        variant="primary"
        size="lg"
        type="submit"
        className="w-full justify-between"
        disabled={busy}
      >
        {busy ? "Updating…" : "Update password"}
        <ArrowRight size={14} />
      </Button>
    </form>
  );
}
