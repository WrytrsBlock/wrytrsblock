"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button, Input, Label } from "@/components/ui/primitives";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/env";

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    if (!supabaseConfigured) {
      router.push("/home");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/home`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/home");
      router.refresh();
    } else {
      setNotice("Almost there — check your inbox to confirm your email.");
      setLoading(false);
    }
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
        By creating an account, you agree to our Terms and Privacy Policy.
      </p>
    </form>
  );
}
