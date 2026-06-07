"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { SignInForm } from "@/app/(auth)/sign-in/form";

// Inline sign-in for the marketing landing page. A lightweight window event lets
// any trigger (header, CTA) open the single modal without prop drilling through
// the server-rendered page. The modal reuses the exact same <SignInForm /> as the
// /sign-in route, so behavior (password, magic link, onboarding redirect) stays
// identical — and the /sign-in page remains available as a fallback.

const OPEN_EVENT = "wb:landing-signin";

export function openLandingSignIn() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

/**
 * A button that opens the inline sign-in modal. Style it per placement via
 * `className`; the click wiring stays in one place.
 */
export function LandingSignInButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={openLandingSignIn} className={className}>
      {children}
    </button>
  );
}

/**
 * The single sign-in modal instance. Render once near the end of the landing
 * page; it listens for the open event from any trigger.
 */
export function LandingSignInDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Welcome back"
      description="Sign in to continue to the Collectv."
      size="sm"
    >
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>

      <p className="mt-6 text-center text-[12.5px] text-muted">
        New to WrytrsBlock?{" "}
        <Link
          href="/sign-up"
          className="text-ink hover:text-accent transition-colors font-medium"
          onClick={() => setOpen(false)}
        >
          Create an account
        </Link>
      </p>
    </Dialog>
  );
}
