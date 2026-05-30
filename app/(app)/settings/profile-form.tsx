"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Avatar, Button, Card, Input, Label, SectionLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useTheme } from "@/components/theme-provider";
import { updateProfileAction } from "@/app/actions/profile";

type Props = {
  initial: {
    name: string;
    handle: string;
    role: string;
    bio: string;
    avatar: string;
  };
};

const roles = [
  "Director",
  "Writer",
  "Editor",
  "Producer",
  "Designer",
  "Composer",
  "Talent",
  "Manager",
];

export function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(initial.name);
  const [handle, setHandle] = useState(initial.handle);
  const [role, setRole] = useState(initial.role || "Director");
  const [bio, setBio] = useState(initial.bio);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfileAction({
        display_name: name,
        handle,
        role,
        bio,
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2400);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Identity */}
      <Card className="p-6">
        <SectionLabel>Profile</SectionLabel>
        <div className="mt-5 flex items-start gap-5">
          <div className="flex flex-col items-center gap-2">
            <Avatar src={initial.avatar} name={name || "You"} size={72} />
            <button className="text-[11px] text-accent hover:text-accent-2 transition-colors">
              Change
            </button>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="handle">Handle</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-[13px]">
                  @
                </span>
                <Input
                  id="handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="role">Primary role</Label>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "h-7 px-3 rounded-lg text-[11.5px] border transition-all duration-200",
                      role === r
                        ? "border-accent/50 bg-accent/10 text-ink"
                        : "border-line text-muted hover:text-ink hover:border-line-strong"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A line or two about your craft."
                className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-line text-ink text-[13px] placeholder:text-muted/70 transition-colors focus:outline-none focus:border-accent/50 focus:bg-surface resize-none"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <SectionLabel>Appearance</SectionLabel>
        <p className="mt-2 text-[12px] text-muted">
          WrytrsBlock is tuned for dark. Light mode is fully supported.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2.5 max-w-md">
          {[
            { id: "dark", label: "Dark", icon: Moon },
            { id: "light", label: "Light", icon: Sun },
            { id: "system", label: "System", icon: Monitor },
          ].map((opt) => {
            const Icon = opt.icon;
            // "system" maps to dark in this build (no system listener yet).
            const active =
              theme === opt.id || (opt.id === "system" && false);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (opt.id === "light" || opt.id === "dark")
                    setTheme(opt.id);
                }}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 rounded-xl border transition-all duration-200",
                  active
                    ? "border-accent/50 bg-accent/10 shadow-glow"
                    : "border-line bg-surface hover:border-line-strong"
                )}
              >
                <Icon
                  size={16}
                  className={active ? "text-accent" : "text-muted"}
                  strokeWidth={1.75}
                />
                <span
                  className={cn(
                    "text-[11.5px]",
                    active ? "text-ink font-medium" : "text-muted"
                  )}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {error && (
        <p className="text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-success">
            <Check size={13} /> Saved
          </span>
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={save}
          disabled={pending || !name.trim()}
        >
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
