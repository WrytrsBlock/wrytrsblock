"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSignature, Plus, X } from "lucide-react";
import { Badge, Button, Card, Input, Label, Progress, SectionLabel } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { type Block } from "@/lib/mock";
import { supabaseConfigured } from "@/lib/env";
import { useUser } from "@/hooks/use-user";
import { useRealtimeTable } from "@/hooks/use-realtime";
import {
  addSplitEntryAction,
  getSplitSheetAction,
  removeSplitEntryAction,
  updateSplitEntryAction,
  updateSplitSheetProjectTitleAction,
  type SplitEntryFieldPatch,
  type SplitEntryView,
} from "@/app/actions/split-sheets";
import { SPLIT_SHEET_PROS, SPLIT_SHEET_ROLES } from "@/types";
import { SplitSheetGenerated } from "./split-sheet-generated";

type Entry = SplitEntryView;
type EditableField = Exclude<keyof Entry, "id" | "userId">;

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const FIELD_DEBOUNCE_MS = 700;

function blankEntry(id: string, seed?: Partial<Entry>): Entry {
  return {
    id,
    userId: null,
    legalName: "",
    artistName: "",
    email: "",
    phone: "",
    role: "Songwriter",
    publishingCompany: "",
    pro: "",
    ipiCae: "",
    ownershipPct: 0,
    notes: "",
    ...seed,
  };
}

function timeAgo(iso: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function SplitSheetPanel({ block }: { block: Block }) {
  const realBlock = supabaseConfigured && isUuid(block.id);
  const { user } = useUser();

  const [projectTitle, setProjectTitle] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [view, setView] = useState<"edit" | "generated">("edit");
  const [loaded, setLoaded] = useState(!realBlock);

  async function refresh() {
    const data = await getSplitSheetAction(block.slug);
    if (!data) return;
    setSheetId(data.sheetId);
    setProjectTitle(data.projectTitle);
    setUpdatedAt(data.updatedAt);
    setEntries(data.entries);
    setLoaded(true);
  }

  // Load (or seed) the sheet for a real Block; a demo/local Block just starts
  // with one blank card, matching the requirement to always begin with a
  // single contributor row.
  useEffect(() => {
    if (!realBlock) {
      setEntries([
        blankEntry("local-1", {
          artistName:
            (user?.user_metadata?.display_name as string) ??
            user?.email?.split("@")[0] ??
            "",
          email: user?.email ?? "",
        }),
      ]);
      return;
    }
    (async () => {
      const data = await getSplitSheetAction(block.slug);
      if (!data) return;
      if (data.entries.length === 0) {
        await addSplitEntryAction(block.slug);
        await refresh();
      } else {
        setSheetId(data.sheetId);
        setProjectTitle(data.projectTitle);
        setUpdatedAt(data.updatedAt);
        setEntries(data.entries);
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realBlock, block.slug]);

  // Any change to this sheet or its entries — by us or another member —
  // re-syncs the whole view, same pattern as the chat/media live-updates.
  useRealtimeTable<Record<string, unknown>>(
    "split_sheet_entries",
    () => refresh(),
    sheetId ? `split_sheet_id=eq.${sheetId}` : undefined,
    "*",
    realBlock && !!sheetId
  );
  useRealtimeTable<Record<string, unknown>>(
    "split_sheets",
    () => refresh(),
    sheetId ? `id=eq.${sheetId}` : undefined,
    "UPDATE",
    realBlock && !!sheetId
  );

  const total = entries.reduce((n, e) => n + (Number(e.ownershipPct) || 0), 0);
  const balanced = Math.round(total * 100) / 100 === 100;
  const canGenerate = entries.length > 0 && balanced;

  const fieldTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const titleTimer = useRef<ReturnType<typeof setTimeout>>();

  function patchField(id: string, field: EditableField, value: string | number) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
    if (!realBlock) return;
    const key = `${id}:${field}`;
    const existing = fieldTimers.current.get(key);
    if (existing) clearTimeout(existing);
    fieldTimers.current.set(
      key,
      setTimeout(() => {
        updateSplitEntryAction(
          block.slug,
          id,
          { [field]: value } as SplitEntryFieldPatch
        ).catch(() => {});
      }, FIELD_DEBOUNCE_MS)
    );
  }

  function onProjectTitleChange(value: string) {
    setProjectTitle(value);
    if (!realBlock || !sheetId) return;
    clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      updateSplitSheetProjectTitleAction(block.slug, sheetId, value).catch(() => {});
    }, FIELD_DEBOUNCE_MS);
  }

  async function addContributor() {
    const tempId = `local-${Date.now()}`;
    setEntries((prev) => [...prev, blankEntry(tempId)]);
    if (!realBlock) return;
    const res = await addSplitEntryAction(block.slug);
    if (res.ok) await refresh();
  }

  function removeContributor(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (realBlock) removeSplitEntryAction(block.slug, id).catch(() => {});
  }

  if (view === "generated") {
    return (
      <SplitSheetGenerated
        blockTitle={block.title}
        projectTitle={projectTitle}
        entries={entries}
        onBack={() => setView("edit")}
      />
    );
  }

  return (
    <div className="page-fluid py-7 space-y-5 animate-fade-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel className="flex items-center gap-2">
            <FileSignature size={11} className="text-accent" /> Music · Rights
          </SectionLabel>
          <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
            Split Sheet Generator
          </h2>
          <p className="text-[12.5px] text-muted mt-1">
            Fill in every contributor, get the splits to 100%, then generate a
            clean, signable split sheet.
          </p>
        </div>
        {updatedAt && (
          <span className="text-[11px] text-muted font-mono whitespace-nowrap">
            Updated {timeAgo(updatedAt)}
          </span>
        )}
      </div>

      <Card className="p-6 space-y-6">
        {/* Song / project title */}
        <div>
          <Label htmlFor="split-project-title">Song / project title</Label>
          <Input
            id="split-project-title"
            value={projectTitle}
            onChange={(e) => onProjectTitleChange(e.target.value)}
            placeholder={block.title}
          />
        </div>

        {/* Live percentage tracker */}
        <div className="space-y-2.5 pt-6 border-t border-line">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-ink">Total ownership split</span>
            <span
              className={cn(
                "text-[13px] font-mono font-semibold tabular-nums",
                balanced ? "text-success" : total > 100 ? "text-danger" : "text-warning"
              )}
            >
              {total}%
            </span>
          </div>
          <Progress
            value={total}
            tone={balanced ? "success" : total > 100 ? "warning" : "accent"}
          />
          {!balanced && entries.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11.5px] text-warning">
              <AlertTriangle size={12} />
              {total > 100
                ? `Splits are ${(total - 100).toFixed(1)}% over 100% — adjust before generating.`
                : `Splits are ${(100 - total).toFixed(1)}% short of 100% — adjust before generating.`}
            </div>
          )}
          {balanced && entries.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11.5px] text-success">
              <CheckCircle2 size={12} /> Splits total 100% — ready to generate.
            </div>
          )}
        </div>

        {/* Contributors */}
        {loaded && (
          <div className="pt-6 border-t border-line space-y-6">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={cn(i > 0 && "pt-6 border-t border-line")}
              >
                <ContributorSection
                  index={i}
                  entry={entry}
                  onChange={(field, value) => patchField(entry.id, field, value)}
                  onRemove={() => removeContributor(entry.id)}
                />
              </div>
            ))}

            <Button variant="outline" size="md" onClick={addContributor}>
              <Plus size={12} /> Add Contributor
            </Button>
          </div>
        )}

        {/* Generate */}
        <div className="flex items-center justify-end pt-6 border-t border-line">
          <Button
            variant="primary"
            size="md"
            disabled={!canGenerate}
            onClick={() => setView("generated")}
          >
            <FileSignature size={12} /> Generate Split Sheet
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ContributorSection({
  index,
  entry,
  onChange,
  onRemove,
}: {
  index: number;
  entry: Entry;
  onChange: (field: EditableField, value: string | number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge tone="soft">Contributor {index + 1}</Badge>
        <button
          onClick={onRemove}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted hover:text-danger hover:bg-surface-2 transition-colors"
          aria-label="Remove contributor"
        >
          <X size={13} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Legal name">
          <Input
            value={entry.legalName}
            onChange={(e) => onChange("legalName", e.target.value)}
            placeholder="Jordan Michael Reyes"
          />
        </Field>
        <Field label="Artist / producer name">
          <Input
            value={entry.artistName}
            onChange={(e) => onChange("artistName", e.target.value)}
            placeholder="Sasha Reyes"
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={entry.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="sasha@example.com"
          />
        </Field>
        <Field label="Phone number">
          <Input
            type="tel"
            value={entry.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="(555) 555-0123"
          />
        </Field>
        <Field label="Role">
          <Select value={entry.role} onChange={(v) => onChange("role", v)}>
            {SPLIT_SHEET_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ownership split %">
          <Input
            type="number"
            min={0}
            max={100}
            value={entry.ownershipPct}
            onChange={(e) =>
              onChange("ownershipPct", Math.max(0, Math.min(100, Number(e.target.value))))
            }
          />
        </Field>
        <Field label="Publishing company">
          <Input
            value={entry.publishingCompany}
            onChange={(e) => onChange("publishingCompany", e.target.value)}
            placeholder="Reyes Publishing LLC"
          />
        </Field>
        <Field label="PRO">
          <Select value={entry.pro} onChange={(v) => onChange("pro", v)}>
            <option value="">Select PRO</option>
            {SPLIT_SHEET_PROS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="IPI / CAE number">
          <Input
            value={entry.ipiCae}
            onChange={(e) => onChange("ipiCae", e.target.value)}
            placeholder="00123456789"
          />
        </Field>
      </div>

      <Field label="Contribution notes">
        <textarea
          value={entry.notes}
          onChange={(e) => onChange("notes", e.target.value)}
          rows={2}
          placeholder="What did they contribute? (lyrics, beat, mix, top-line...)"
          className="w-full resize-none rounded-lg bg-surface-2 border border-line px-3 py-2 text-[13px] text-ink placeholder:text-muted/70 transition-colors focus:outline-none focus:border-accent/50 focus:bg-surface"
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded-lg bg-surface-2 border border-line text-ink text-[13px] transition-colors focus:outline-none focus:border-accent/50 focus:bg-surface"
    >
      {children}
    </select>
  );
}
