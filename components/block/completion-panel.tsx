"use client";

import { useState } from "react";
import { CheckCircle2, Circle, PartyPopper, Sparkles } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Progress,
  SectionLabel,
} from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Block } from "@/lib/mock";

export function CompletionPanel({ block }: { block: Block }) {
  const isService = block.blockType === "service";
  const deliverables = block.deliverables ?? [];
  const approved = deliverables.filter((d) => d.status === "approved").length;
  const deliverablesDone =
    deliverables.length > 0 && approved === deliverables.length;
  const splitsSigned = block.splits ? block.splits.status === "signed" : true;

  const [completed, setCompleted] = useState(
    block.completion.status === "completed"
  );

  // Gates that must be true before a Block can be marked complete.
  const gates = isService
    ? [
        {
          label: "All deliverables approved",
          done: deliverablesDone,
          hint: `${approved}/${deliverables.length} approved`,
        },
        { label: "Final files exchanged with client", done: deliverablesDone },
      ]
    : [
        {
          label: "All deliverables approved",
          done: deliverablesDone,
          hint: `${approved}/${deliverables.length} approved`,
        },
        {
          label: "Split Sheet signed by all contributors",
          done: splitsSigned,
          hint: block.splits ? block.splits.status : "n/a",
        },
      ];

  const ready = gates.every((g) => g.done);
  const passed = gates.filter((g) => g.done).length;
  const pct = completed
    ? 100
    : Math.round((passed / gates.length) * 100);

  return (
    <div className="px-8 py-7 space-y-5 max-w-[820px] animate-fade-up">
      <div>
        <SectionLabel>Wrap up</SectionLabel>
        <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
          Completion
        </h2>
        <p className="text-[12.5px] text-muted mt-1">
          {isService
            ? "Close out the service once the client has everything."
            : "Mark the project complete once the work and the splits are settled."}
        </p>
      </div>

      {completed ? (
        <Card className="p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-grad-mesh opacity-50" />
          <div className="relative">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 border border-success/30 text-success">
              <PartyPopper size={24} strokeWidth={1.5} />
            </span>
            <h3 className="mt-4 font-display text-2xl text-ink tracking-tight">
              {block.title} is complete.
            </h3>
            <p className="mt-2 text-[13px] text-muted max-w-sm mx-auto leading-relaxed">
              {isService
                ? "Delivered and signed off. This Service Block is archived in your completed work."
                : "Shipped and settled. Credits and splits are locked to everyone's profile."}
            </p>
            <div className="mt-5">
              <Button variant="outline" size="md" onClick={() => setCompleted(false)}>
                Reopen Block
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SectionLabel>Status</SectionLabel>
                <Badge tone={ready ? "success" : "warning"} dot>
                  {ready ? "Ready to complete" : "In progress"}
                </Badge>
              </div>
              <span className="text-[12px] font-mono text-ink">{pct}%</span>
            </div>
            <Progress value={pct} className="mt-3" tone={ready ? "success" : "accent"} />

            <ul className="mt-5 space-y-2.5">
              {gates.map((g) => (
                <li key={g.label} className="flex items-center gap-2.5 text-[13px]">
                  {g.done ? (
                    <CheckCircle2 size={15} className="text-success" strokeWidth={2} />
                  ) : (
                    <Circle size={15} className="text-muted" strokeWidth={1.5} />
                  )}
                  <span className={cn(g.done ? "text-ink" : "text-muted")}>
                    {g.label}
                  </span>
                  {g.hint && (
                    <span className="ml-auto text-[10.5px] font-mono text-muted">
                      {g.hint}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles size={15} className="text-accent mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-[13px] font-medium text-ink">
                  Mark this Block complete
                </p>
                <p className="text-[11.5px] text-muted mt-0.5 max-w-sm">
                  {ready
                    ? "Everything checks out. Completing locks credits and splits."
                    : "Resolve the open items above before completing."}
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              disabled={!ready}
              onClick={() => setCompleted(true)}
            >
              <CheckCircle2 size={14} /> Complete Block
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}
