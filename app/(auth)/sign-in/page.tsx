import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInForm } from "./form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to WrytrsBlock to manage your creator profile, Blocks, and collaborations.",
  alternates: { canonical: "/sign-in" },
};

export default function SignInPage() {
  return (
    <>
      <div>
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-muted">
          Sign in
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink tracking-tighter">
          Welcome back.
        </h1>
        <p className="mt-2 text-[13.5px] text-muted">
          Continue to the Collectv.
        </p>
      </div>

      <div className="mt-8">
        <Suspense fallback={null}>
          <SignInForm />
        </Suspense>
      </div>

      <p className="mt-8 text-[12.5px] text-muted">
        New here?{" "}
        <Link
          href="/sign-up"
          className="text-ink hover:text-accent transition-colors font-medium"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
