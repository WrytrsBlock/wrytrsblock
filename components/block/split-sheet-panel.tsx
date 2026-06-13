"use client";

import { useMemo, useState } from "react";
import {
  Check,
  PenLine,
  PieChart,
  Plus,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  SectionLabel,
} from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { getPerson, type Block, type SplitContributor } from "@/lib/mock";

type Row = SplitContributor;

export function SplitSheetPanel({ block }: { block: Block }) {
  const [status, setStatus] = useState(block.splits?.status ?? "draft");
  const [rows, setRows] = useState<Row[]>(block.splits?.contributors ?? []);
  const [adding, setAdding] = useState(false);

  const writingTotal = rows.reduce((n, r) => n + (r.writing || 0), 0);
  const publishingTotal = rows.reduce((n, r) => n + (r.publishing || 0), 0);
  const signedCount = rows.filter((r) => r.signed).length;
  const balanced = writingTotal === 100 && publishingTotal === 100;
  const allSigned = rows.length > 0 && signedCount === rows.length;

  // Team members not yet on the sheet — candidates to add.
  const candidates = useMemo(
    () => block.team.filter((id) => !rows.some((r) => r.id === id)),
    [block.team, rows]
  );

  function patch(id: string, field: "writing" | "publishing", value: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: Math.max(0, Math.min(100, value)) } : r
      )
    );
  }

  function toggleSign(id: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, signed: !r.signed } : r))
    );
  }

  function addContributor(id: string) {
    const p = getPerson(id);
    setRows((prev) => [
      ...prev,
      { id, role: p?.role ?? "Contributor", writing: 0, publishing: 0, signed: false },
    ]);
    setAdding(false);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  const statusTone =
    status === "signed" ? "success" : status === "circulated" ? "warning" : "soft";

  return (
    <div className="page-fluid py-7 space-y-5 animate-fade-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel className="flex items-center gap-2">
            <PieChart size={11} className="text-accent" /> Music · Rights
          </SectionLabel>
          <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
            Split Sheet
          </h2>
          <p className="text-[12.5px] text-muted mt-1">
            Agree writer and publishing splits, then circulate for sign-off.
          </p>
        </div>
        <Badge tone={statusTone as "success" | "warning" | "soft"} dot>
          {status === "signed"
            ? "Fully signed"
            : status === "circulated"
            ? "Circulated"
            : "Draft"}
        </Badge>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title="No splits yet"
          description="Add the contributors to this track and assign writer + publishing percentages. WrytrsBlock keeps the agreement and sign-offs in one place."
          action={
            candidates.length > 0 ? (
              <Button variant="primary" size="md" onClick={() => setAdding(true)}>
                <Plus size={12} /> Add contributor
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* header row */}
          <div className="grid grid-cols-[1fr_110px_110px_92px_36px] items-center gap-2 px-5 h-10 border-b border-line bg-surface-2/40">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted font-medium">
              Contributor
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted font-medium text-right">
              Writing %
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted font-medium text-right">
              Publishing %
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted font-medium text-center">
              Sign-off
            </span>
            <span />
          </div>

          <ul className="divide-y divide-line">
            {rows.map((r) => {
              const p = getPerson(r.id);
              if (!p) return null;
              return (
                <li
                  key={r.id}
                  className="grid grid-cols-[1fr_110px_110px_92px_36px] items-center gap-2 px-5 py-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={p.avatar} name={p.name} size={30} />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-ink truncate">
                        {p.name}
                      </p>
                      <p className="text-[10.5px] text-muted truncate">{r.role}</p>
                    </div>
                  </div>

                  <SplitInput
                    value={r.writing}
                    onChange={(v) => patch(r.id, "writing", v)}
                    disabled={status === "signed"}
                  />
                  <SplitInput
                    value={r.publishing}
                    onChange={(v) => patch(r.id, "publishing", v)}
                    disabled={status === "signed"}
                  />

                  <div className="flex justify-center">
                    {r.signed ? (
                      <Badge tone="success">
                        <Check size={9} /> Signed
                      </Badge>
                    ) : status === "circulated" ? (
                      <button
                        onClick={() => toggleSign(r.id)}
                        className="inline-flex items-center gap-1 h-6 px-2 rounded-md border border-line text-[10.5px] text-ink hover:bg-surface-2 transition-colors"
                      >
                        <PenLine size={9} /> Sign
                      </button>
                    ) : (
                      <span className="text-[10.5px] text-muted">—</span>
                    )}
                  </div>

                  <button
                    onClick={() => removeRow(r.id)}
                    disabled={status === "signed"}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-md flex items-center justify-center text-muted hover:text-danger disabled:hidden"
                    aria-label="Remove"
                  >
                    <X size={12} />
                  </button>
                </li>
              );
            })}
          </ul>

          {/* totals */}
          <div className="grid grid-cols-[1fr_110px_110px_92px_36px] items-center gap-2 px-5 h-12 border-t border-line bg-surface-2/40">
            <span className="text-[11.5px] font-medium text-ink">Total</span>
            <Total value={writingTotal} />
            <Total value={publishingTotal} />
            <span className="text-center text-[10.5px] text-muted">
              {signedCount}/{rows.length}
            </span>
            <span />
          </div>
        </Card>
      )}

      {/* Add contributor inline picker */}
      {adding && candidates.length > 0 && (
        <Card className="p-4">
          <SectionLabel>Add from team</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-2">
            {candidates.map((id) => {
              const p = getPerson(id);
              if (!p) return null;
              return (
                <button
                  key={id}
                  onClick={() => addContributor(id)}
                  className="inline-flex items-center gap-2 h-8 pl-1 pr-3 rounded-full border border-line hover:border-line-strong hover:bg-surface-2 transition-all"
                >
                  <Avatar src={p.avatar} name={p.name} size={22} />
                  <span className="text-[12px] text-ink">{p.name}</span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Workflow actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {rows.length > 0 && candidates.length > 0 && !adding && (
            <Button variant="outline" size="md" onClick={() => setAdding(true)}>
              <Plus size={12} /> Add contributor
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!balanced && rows.length > 0 && (
            <span className="text-[11.5px] text-warning">
              Splits must total 100% before circulating.
            </span>
          )}
          {status === "draft" && (
            <Button
              variant="primary"
              size="md"
              disabled={!balanced}
              onClick={() => setStatus("circulated")}
            >
              <Send size={12} /> Circulate for sign-off
            </Button>
          )}
          {status === "circulated" && (
            <Button
              variant="primary"
              size="md"
              disabled={!allSigned}
              onClick={() => setStatus("signed")}
            >
              <ShieldCheck size={12} /> Finalize agreement
            </Button>
          )}
          {status === "signed" && (
            <Badge tone="success" dot>
              Agreement signed by all contributors
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function SplitInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-[88px] h-8 px-2.5 rounded-lg bg-surface-2 border border-line text-ink text-[12.5px] text-right tabular-nums focus:outline-none focus:border-accent/50 disabled:opacity-60"
      />
    </div>
  );
}

function Total({ value }: { value: number }) {
  const ok = value === 100;
  return (
    <span
      className={cn(
        "text-right text-[12.5px] font-mono tabular-nums pr-2.5",
        ok ? "text-success" : value > 100 ? "text-danger" : "text-warning"
      )}
    >
      {value}%
    </span>
  );
}
