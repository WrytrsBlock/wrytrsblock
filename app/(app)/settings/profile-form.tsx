"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  Input,
  Label,
  SectionLabel,
} from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useTheme } from "@/components/theme-provider";
import { updateProfileAction } from "@/app/actions/profile";
import { CREATOR_ROLES } from "@/lib/mock";

type Socials = {
  instagram: string;
  youtube: string;
  spotify: string;
  linkedin: string;
  website: string;
};

type Props = {
  initial: {
    name: string;
    handle: string;
    email: string;
    roles: string[];
    bio: string;
    location: string;
    website: string;
    skills: string[];
    avatar: string;
    banner: string;
    socials: Partial<Socials>;
  };
};

const textarea =
  "w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-line text-ink text-[13px] placeholder:text-muted/70 transition-colors focus:outline-none focus:border-accent/50 focus:bg-surface resize-none";

export function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(initial.name);
  const [handle, setHandle] = useState(initial.handle);
  const [roles, setRoles] = useState<string[]>(initial.roles);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  const [website, setWebsite] = useState(initial.website);
  const [skills, setSkills] = useState(initial.skills.join(", "));
  const [avatar, setAvatar] = useState(initial.avatar);
  const [banner, setBanner] = useState(initial.banner);
  const [socials, setSocials] = useState<Socials>({
    instagram: initial.socials.instagram ?? "",
    youtube: initial.socials.youtube ?? "",
    spotify: initial.socials.spotify ?? "",
    linkedin: initial.socials.linkedin ?? "",
    website: initial.socials.website ?? "",
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleRole(r: string) {
    setRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfileAction({
        display_name: name,
        handle,
        role: roles[0] ?? "",
        roles,
        bio,
        location,
        website,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        avatar_url: avatar,
        banner_url: banner,
        socials,
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
      {/* Personal Information */}
      <Card className="p-6">
        <SectionLabel>Personal information</SectionLabel>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
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
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={initial.email} disabled className="opacity-70" />
          </div>
        </div>
      </Card>

      {/* Creator Information */}
      <Card className="p-6">
        <SectionLabel>Creator information</SectionLabel>

        <div className="mt-4">
          <Label>Roles</Label>
          <p className="-mt-1 mb-2 text-[11px] text-muted">
            Pick all that apply — you're more than one thing.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CREATOR_ROLES.map((r) => {
              const active = roles.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRole(r)}
                  className={cn(
                    "inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] border transition-all duration-200",
                    active
                      ? "border-accent/50 bg-accent/10 text-ink"
                      : "border-line text-muted hover:text-ink hover:border-line-strong"
                  )}
                >
                  {active && <Check size={11} className="text-accent" />}
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="bio">Bio</Label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A few lines about your craft, your style, what you're great at."
            className={textarea}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="yoursite.com"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="skills">Skills</Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Mixing, Mastering, Sound Design"
            />
            <p className="mt-1 text-[10.5px] text-muted">Comma-separated.</p>
          </div>
        </div>
      </Card>

      {/* Profile Media */}
      <Card className="p-6">
        <SectionLabel>Profile media</SectionLabel>
        <div className="mt-4 flex items-start gap-5">
          <div className="flex flex-col items-center gap-2 shrink-0">
            <Avatar src={avatar} name={name || "You"} size={72} />
            <span className="text-[10.5px] text-muted">Profile picture</span>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <Label htmlFor="avatar">Profile picture URL</Label>
              <Input
                id="avatar"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div>
              <Label htmlFor="banner">Banner image URL</Label>
              <Input
                id="banner"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="https://…"
              />
              {banner && (
                <div className="mt-2 h-24 rounded-lg overflow-hidden border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banner} alt="" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Social Links */}
      <Card className="p-6">
        <SectionLabel>Social links</SectionLabel>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(
            [
              ["instagram", "Instagram", "@handle"],
              ["youtube", "YouTube", "@channel"],
              ["spotify", "Spotify", "Artist name"],
              ["website", "Website", "yoursite.com"],
              ["linkedin", "LinkedIn", "profile-id"],
            ] as const
          ).map(([key, label, ph]) => (
            <div key={key}>
              <Label htmlFor={`s-${key}`}>{label}</Label>
              <Input
                id={`s-${key}`}
                value={socials[key]}
                onChange={(e) =>
                  setSocials((s) => ({ ...s, [key]: e.target.value }))
                }
                placeholder={ph}
              />
            </div>
          ))}
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
            const active = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (opt.id === "light" || opt.id === "dark") setTheme(opt.id);
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

      <div className="sticky bottom-0 flex items-center justify-end gap-3 py-3 -mx-1 px-1 bg-gradient-to-t from-bg via-bg/90 to-transparent">
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
