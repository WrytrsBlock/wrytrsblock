"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Search } from "lucide-react";
import { Avatar, Badge, Button, Card } from "@/components/ui/primitives";
import { StartBlockButton } from "@/components/block/start-block-button";
import { BlockScore } from "@/components/creator/block-score";
import { cn } from "@/lib/cn";
import {
  CREATOR_ROLES,
  type CreatorProfile,
  type Person,
} from "@/lib/mock";

type Creator = { person: Person; profile: CreatorProfile };

export function CreatorMarketplace({ creators }: { creators: Creator[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creators.filter(({ person, profile }) => {
      const roleMatch = role === "All" || profile.roles.includes(role);
      if (!roleMatch) return false;
      if (!q) return true;
      const hay = [
        person.name,
        person.handle,
        profile.location,
        profile.tagline,
        ...profile.roles,
        ...profile.skills,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [creators, query, role]);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative max-w-2xl">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find creators…"
          className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-2 border border-line text-ink text-[14px] placeholder:text-muted/70 focus:outline-none focus:border-accent/50 focus:bg-surface transition-colors"
        />
      </div>

      {/* Role filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1">
        {["All", ...CREATOR_ROLES].map((r) => {
          const active = role === r;
          return (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={cn(
                "shrink-0 h-8 px-3.5 rounded-full text-[12.5px] border transition-all duration-200",
                active
                  ? "bg-ink text-bg border-ink font-medium"
                  : "bg-surface border-line text-muted hover:text-ink hover:border-line-strong"
              )}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Count */}
      <p className="text-[12px] text-muted">
        {filtered.length} creator{filtered.length === 1 ? "" : "s"}
        {role !== "All" ? ` · ${role}` : ""}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px] text-ink font-medium">No creators found</p>
          <p className="text-[12.5px] text-muted mt-1">
            Try a different role or search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(({ person, profile }) => (
            <Card key={person.id} hover className="p-6 flex flex-col">
              {/* Identity */}
              <div className="flex items-start gap-3.5">
                <Avatar
                  src={person.avatar}
                  name={person.name}
                  size={56}
                  online={person.online}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${person.handle}`}
                    className="text-[16px] font-semibold text-ink tracking-tight hover:text-accent transition-colors"
                  >
                    {person.name}
                  </Link>
                  <p className="text-[11.5px] text-muted mt-0.5 truncate">
                    {profile.roles.slice(0, 3).join(" · ")}
                  </p>
                  <div className="mt-2">
                    <BlockScore score={profile.blockScore} size="sm" />
                  </div>
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-muted truncate">
                    <MapPin size={11} /> {profile.location}
                  </p>
                </div>
              </div>

              {/* Quick bio */}
              <p className="mt-4 text-[12.5px] text-muted leading-relaxed line-clamp-2 flex-1">
                {profile.tagline}
              </p>

              {/* Primary skills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.skills.slice(0, 3).map((s) => (
                  <Badge key={s} tone="soft">
                    {s}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-5 pt-4 border-t border-line flex items-center gap-2">
                <Link href={`/profile/${person.handle}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    View Profile <ArrowUpRight size={12} />
                  </Button>
                </Link>
                <StartBlockButton className="flex-1" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
