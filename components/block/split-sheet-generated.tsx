"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { Badge, Button, Card, SectionLabel } from "@/components/ui/primitives";
import type { SplitEntryView } from "@/app/actions/split-sheets";

// The clean, printable split sheet document — the "output" half of the
// generator. Kept as its own component so the edit form (split-sheet-panel)
// doesn't balloon in size.
export function SplitSheetGenerated({
  blockTitle,
  projectTitle,
  entries,
  onBack,
}: {
  blockTitle: string;
  projectTitle: string;
  entries: SplitEntryView[];
  onBack: () => void;
}) {
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="page-fluid py-7 space-y-5 animate-fade-up">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Button variant="outline" size="md" onClick={onBack}>
          <ArrowLeft size={12} /> Back to edit
        </Button>
        <Button variant="primary" size="md" onClick={() => window.print()}>
          <Printer size={12} /> Print / Save as PDF
        </Button>
      </div>

      <Card className="p-8 space-y-8 print:border-0 print:shadow-none">
        <div className="text-center space-y-1 border-b border-line pb-6">
          <SectionLabel className="justify-center flex">Split Sheet</SectionLabel>
          <h1 className="font-display text-2xl text-ink tracking-tight">
            {projectTitle || blockTitle}
          </h1>
          {projectTitle && (
            <p className="text-[12.5px] text-muted">Block: {blockTitle}</p>
          )}
          <p className="text-[11.5px] text-muted font-mono">{today}</p>
        </div>

        <div className="space-y-6">
          {entries.map((e, i) => (
            <div key={e.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[14px] font-semibold text-ink">
                    {e.artistName || e.legalName || `Contributor ${i + 1}`}
                    {e.legalName && e.artistName && e.legalName !== e.artistName && (
                      <span className="text-[12px] font-normal text-muted">
                        {" "}
                        (legal name: {e.legalName})
                      </span>
                    )}
                  </p>
                  <p className="text-[11.5px] text-muted">{e.role}</p>
                </div>
                <Badge tone="accent">{e.ownershipPct}% ownership</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[12px] text-ink/85">
                {e.email && <Row label="Email" value={e.email} />}
                {e.phone && <Row label="Phone" value={e.phone} />}
                {e.publishingCompany && (
                  <Row label="Publishing company" value={e.publishingCompany} />
                )}
                {(e.pro || e.ipiCae) && (
                  <Row
                    label="PRO / IPI-CAE"
                    value={[e.pro, e.ipiCae].filter(Boolean).join(" · ")}
                  />
                )}
              </div>

              {e.notes && (
                <p className="text-[11.5px] text-muted italic">"{e.notes}"</p>
              )}

              <div className="pt-3 flex items-end gap-6">
                <div className="flex-1">
                  <div className="border-b border-line-strong h-8" />
                  <p className="text-[10px] text-muted mt-1">Signature</p>
                </div>
                <div className="w-32">
                  <div className="border-b border-line-strong h-8" />
                  <p className="text-[10px] text-muted mt-1">Date</p>
                </div>
              </div>

              {i < entries.length - 1 && <div className="border-t border-line pt-2" />}
            </div>
          ))}
        </div>

        <p className="text-[10.5px] text-muted text-center pt-4 border-t border-line">
          Generated on WrytrsBlock · {today}
        </p>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted">{label}: </span>
      {value}
    </p>
  );
}
