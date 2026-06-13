"use client";

import { useState } from "react";
import { Check, CircleDashed, Clock, Plus, Upload, X } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  SectionLabel,
} from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { getPerson, type Block, type Deliverable } from "@/lib/mock";

const flow: Deliverable["status"][] = ["pending", "submitted", "approved"];

const statusMeta: Record<
  Deliverable["status"],
  { label: string; tone: "soft" | "warning" | "success"; icon: typeof Check }
> = {
  pending: { label: "Pending", tone: "soft", icon: CircleDashed },
  submitted: { label: "Submitted", tone: "warning", icon: Clock },
  approved: { label: "Approved", tone: "success", icon: Check },
};

export function DeliverablesPanel({ block }: { block: Block }) {
  const [items, setItems] = useState<Deliverable[]>(block.deliverables ?? []);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const isService = block.blockType === "service";
  const approved = items.filter((d) => d.status === "approved").length;

  function advance(id: string) {
    setItems((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const i = flow.indexOf(d.status);
        return { ...d, status: flow[Math.min(i + 1, flow.length - 1)] };
      })
    );
  }

  function add() {
    const title = draft.trim();
    if (!title) return;
    setItems((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, title, status: "pending", ownerId: block.leadId },
    ]);
    setDraft("");
    setAdding(false);
  }

  return (
    <div className="page-fluid py-7 space-y-5 animate-fade-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>{isService ? "Delivery" : "Output"}</SectionLabel>
          <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
            Deliverables
          </h2>
          <p className="text-[12.5px] text-muted mt-1">
            {isService
              ? "What you're delivering to the client, and where each item stands."
              : "Concrete outputs this Block produces. Track them to approval."}
          </p>
        </div>
        {items.length > 0 && (
          <div className="text-right">
            <p className="font-mono text-[13px] text-ink">
              {approved}/{items.length}
            </p>
            <p className="text-[10.5px] text-muted">approved</p>
          </div>
        )}
      </div>

      {items.length === 0 && !adding ? (
        <EmptyState
          icon={Upload}
          title="No deliverables yet"
          description={
            isService
              ? "Add the items you'll deliver — rough mix, final master, stems — and move each to approved as you go."
              : "Define the outputs that mark this project done, and track them to approval."
          }
          action={
            <Button variant="primary" size="md" onClick={() => setAdding(true)}>
              <Plus size={12} /> Add deliverable
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {items.map((d) => {
              const owner = d.ownerId ? getPerson(d.ownerId) : undefined;
              const meta = statusMeta[d.status];
              const Icon = meta.icon;
              const isLast = d.status === "approved";
              return (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center border shrink-0",
                      d.status === "approved"
                        ? "bg-success/10 border-success/30 text-success"
                        : d.status === "submitted"
                        ? "bg-warning/10 border-warning/30 text-warning"
                        : "bg-surface-2 border-line text-muted"
                    )}
                  >
                    <Icon size={13} strokeWidth={2} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-ink font-medium truncate">
                      {d.title}
                    </p>
                    {d.dueIn && d.status !== "approved" && (
                      <p className="text-[10.5px] text-muted mt-0.5">
                        due {d.dueIn}
                      </p>
                    )}
                  </div>
                  {owner && <Avatar src={owner.avatar} name={owner.name} size={24} />}
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  {!isLast && (
                    <Button variant="outline" size="sm" onClick={() => advance(d.id)}>
                      {d.status === "pending" ? "Submit" : "Approve"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>

          {adding ? (
            <div className="flex items-center gap-2 px-5 py-3 border-t border-line bg-surface-2/30">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") add();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDraft("");
                  }
                }}
                placeholder="Deliverable title…"
                className="flex-1 h-8 px-3 rounded-lg bg-surface border border-line text-[12.5px] text-ink focus:outline-none focus:border-accent/50"
              />
              <Button variant="primary" size="sm" onClick={add} disabled={!draft.trim()}>
                Add
              </Button>
              <button
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
                className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-ink"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-1.5 py-3 border-t border-line text-[12px] text-muted hover:text-ink hover:bg-surface-2/40 transition-colors"
            >
              <Plus size={12} /> Add deliverable
            </button>
          )}
        </Card>
      )}
    </div>
  );
}
