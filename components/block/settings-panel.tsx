"use client";

import { useState } from "react";
import { AlertTriangle, Check, Globe, Lock, Users } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  SectionLabel,
} from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { DeleteBlockButton } from "@/components/block/delete-block-button";
import { getPerson, type Block } from "@/lib/mock";

const visibilities = [
  { id: "private", label: "Private", desc: "Only invited collaborators", icon: Lock },
  { id: "workspace", label: "Workspace", desc: "Anyone in your workspace", icon: Users },
  { id: "public", label: "Public link", desc: "Anyone with the link can view", icon: Globe },
] as const;

const roleTones: Record<string, "accent" | "accent-2" | "soft"> = {
  lead: "accent",
  collaborator: "accent-2",
  reviewer: "soft",
};

export function SettingsPanel({
  block,
  isOwner = false,
}: {
  block: Block;
  isOwner?: boolean;
}) {
  const [visibility, setVisibility] = useState<string>("workspace");

  return (
    <div className="px-8 py-7 max-w-[860px] space-y-6 animate-fade-up">
      <div>
        <SectionLabel>Configuration</SectionLabel>
        <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
          Block settings
        </h2>
        <p className="text-[12.5px] text-muted mt-1">
          Identity, access, collaborators, and danger zone.
        </p>
      </div>

      {/* Identity */}
      <Card className="p-6">
        <SectionLabel>Identity</SectionLabel>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" defaultValue={block.title} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" defaultValue={block.tagline} />
          </div>
          <div>
            <Label htmlFor="kind">Type</Label>
            <Input id="kind" defaultValue={block.kind} />
          </div>
          <div>
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" defaultValue={block.deadline} />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="md">
            Discard
          </Button>
          <Button variant="primary" size="md">
            <Check size={12} /> Save changes
          </Button>
        </div>
      </Card>

      {/* Visibility */}
      <Card className="p-6">
        <SectionLabel>Visibility</SectionLabel>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {visibilities.map((v) => {
            const Icon = v.icon;
            const active = visibility === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setVisibility(v.id)}
                className={cn(
                  "text-left p-4 rounded-xl border transition-all duration-200",
                  active
                    ? "border-accent/50 bg-accent/10 shadow-glow"
                    : "border-line bg-surface hover:border-line-strong"
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon
                    size={15}
                    className={active ? "text-accent" : "text-muted"}
                    strokeWidth={1.75}
                  />
                  {active && <Check size={13} className="text-accent" />}
                </div>
                <p className="mt-3 text-[13px] font-medium text-ink">
                  {v.label}
                </p>
                <p className="text-[11px] text-muted mt-0.5 leading-snug">
                  {v.desc}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Collaborators */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Collaborators · {block.team.length}</SectionLabel>
          <Button variant="outline" size="sm">
            Manage roles
          </Button>
        </div>
        <ul className="mt-4 divide-y divide-line">
          {block.team.map((id, i) => {
            const p = getPerson(id);
            if (!p) return null;
            const role = i === 0 ? "lead" : i < 3 ? "collaborator" : "reviewer";
            return (
              <li key={id} className="flex items-center gap-3 py-2.5 first:pt-0">
                <span className="h-8 w-8 rounded-full overflow-hidden border border-line shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.avatar} alt={p.name} className="h-full w-full object-cover" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium text-ink truncate">
                    {p.name}
                  </p>
                  <p className="text-[10.5px] text-muted truncate">
                    {p.role} · @{p.handle}
                  </p>
                </div>
                <Badge tone={roleTones[role]}>{role}</Badge>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Danger zone — owner only. Collaborators never see archive/delete. */}
      {isOwner && (
        <Card className="p-6 border-danger/30">
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-danger" />
            <SectionLabel className="!text-danger">Danger zone</SectionLabel>
          </div>
          {/* Archive — separate, non-destructive, recoverable. */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-ink">
                Archive this Block
              </p>
              <p className="text-[11.5px] text-muted mt-0.5">
                Hidden from the workspace, recoverable for 30 days.
              </p>
            </div>
            <Button variant="outline" size="md">
              Archive
            </Button>
          </div>
          {/* Delete — permanent, owner-only, confirmation-gated. */}
          <div className="mt-4 pt-4 border-t border-line flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-medium text-ink">
                Delete permanently
              </p>
              <p className="text-[11.5px] text-muted mt-0.5">
                This cannot be undone. All files, messages, tasks, split sheet
                data, collaborators, and history are removed.
              </p>
            </div>
            <DeleteBlockButton blockId={block.id} />
          </div>
        </Card>
      )}
    </div>
  );
}
