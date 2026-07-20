import Link from "next/link";
import type { Metadata } from "next";
import { SignUpForm } from "./form";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create your WrytrsBlock creator profile — find collaborators, start a Block, and get paid for the work you make together.",
  alternates: { canonical: "/sign-up" },
};

export default function SignUpPage() {
  return (
    <>
      <div>
        <p className="text-[10.5px] uppercase tracking-[0.2em] text-muted">
          Get started
        </p>
        <h1 className="mt-2 font-display text-4xl text-ink tracking-tighter">
          Join WrytrsBlock
        </h1>
        <p className="mt-2 text-[13.5px] text-muted">
          Create your creator profile and start building Blocks.
        </p>
      </div>

      <div className="mt-8">
        <SignUpForm />
      </div>

      <p className="mt-8 text-[12.5px] text-muted">
        Have an account?{" "}
        <Link
          href="/sign-in"
          className="text-ink hover:text-accent transition-colors font-medium"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
