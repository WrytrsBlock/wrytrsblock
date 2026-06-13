"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  Clock,
  ListChecks,
  MessageCircle,
  Pencil,
  RefreshCw,
  Tag,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  Label,
  SectionLabel,
} from "@/components/ui/primitives";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { getPerson, type Block, type ServiceDetail } from "@/lib/mock";
import { saveServiceDetailsAction } from "@/app/actions/service";
import { onUIEvent } from "@/lib/ui-events";

type FormState = {
  title: string;
  category: string;
  summary: string;
  included: string; // newline-separated; maps to scope[]
  price: string;
  turnaround: string;
  revisions: string;
  requirements: string;
};

function hasDetails(s: ServiceDetail | null | undefined): s is ServiceDetail {
  return Boolean(s && s.summary && s.summary.trim().length > 0);
}

export function ServiceDetailsPanel({ block }: { block: Block }) {
  const router = useRouter();
  const [service, setService] = useState<ServiceDetail | null>(
    block.service ?? null
  );
  const [editing, setEditing] = useState(false);
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const provider = getPerson(service?.providerId ?? block.leadId);

  function openForm() {
    setError(null);
    setEditing(true);
  }

  // The header's "Edit Service" button opens this panel's form.
  useEffect(() => onUIEvent("wb:edit-service", () => openForm()), []);

  function handleSave(form: FormState) {
    setError(null);
    const scope = form.included
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const next: ServiceDetail = {
      title: form.title.trim() || block.title,
      category: form.category.trim() || block.kind,
      summary: form.summary.trim(),
      scope,
      price: form.price.trim() || "Contact for pricing",
      turnaround: form.turnaround.trim() || "By arrangement",
      revisions: form.revisions.trim() || "By arrangement",
      requirements: form.requirements.trim(),
      providerId: service?.providerId ?? block.leadId,
    };

    // Optimistic local update so the UI reflects the save immediately.
    setService(next);
    setEditing(false);

    startTransition(async () => {
      const res = await saveServiceDetailsAction(block.slug, {
        title: next.title ?? "",
        category: next.category ?? "",
        summary: next.summary,
        scope: next.scope,
        price: next.price,
        turnaround: next.turnaround,
        revisions: next.revisions,
        requirements: next.requirements ?? "",
      }).catch(() => ({ ok: false as const, error: "Save failed." }));
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  // ---- Empty state -------------------------------------------------------
  if (!hasDetails(service)) {
    return (
      <div className="page-fluid py-7 animate-fade-up">
        <EmptyState
          icon={Tag}
          title="Define your service"
          description="Describe what you offer, the scope of work, your price, and turnaround. This is what clients see before they book."
          action={
            <Button variant="primary" size="md" onClick={openForm}>
              Add service details
            </Button>
          }
        />
        <ServiceForm
          open={editing}
          onClose={() => setEditing(false)}
          onSave={handleSave}
          pending={pending}
          error={error}
          block={block}
          service={service}
        />
      </div>
    );
  }

  // ---- Populated view ----------------------------------------------------
  return (
    <div className="page-fluid py-7 space-y-5 animate-fade-up">
      <div className="flex items-center justify-between gap-4">
        <div>
          <SectionLabel>{service.category ?? block.kind} · Service</SectionLabel>
          <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
            {service.title ?? block.title}
          </h2>
        </div>
        <Button variant="outline" size="md" onClick={openForm}>
          <Pencil size={12} /> Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Description + what's included */}
        <Card className="lg:col-span-2 p-6">
          <SectionLabel>Description</SectionLabel>
          <p className="mt-3 text-[14px] text-ink/95 leading-[1.65] whitespace-pre-line">
            {service.summary}
          </p>

          {service.scope.length > 0 && (
            <div className="mt-6">
              <SectionLabel className="flex items-center gap-2">
                <ListChecks size={11} className="text-accent" /> What's included
              </SectionLabel>
              <ul className="mt-3 space-y-2">
                {service.scope.map((s) => (
                  <li key={s} className="flex items-start gap-2.5 text-[13px]">
                    <Check
                      size={14}
                      className="text-success mt-0.5 shrink-0"
                      strokeWidth={2}
                    />
                    <span className="text-ink/90">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {service.requirements && (
            <div className="mt-6">
              <SectionLabel>Requirements from client</SectionLabel>
              <p className="mt-3 text-[13px] text-ink/90 leading-relaxed whitespace-pre-line">
                {service.requirements}
              </p>
            </div>
          )}
        </Card>

        {/* Booking card */}
        <Card className="p-6 h-fit">
          <span className="font-display text-3xl text-ink tracking-tight">
            {service.price}
          </span>
          <dl className="mt-4 space-y-2.5 text-[12.5px]">
            <div className="flex items-center justify-between">
              <dt className="text-muted inline-flex items-center gap-1.5">
                <Clock size={12} /> Turnaround
              </dt>
              <dd className="text-ink">{service.turnaround}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted inline-flex items-center gap-1.5">
                <RefreshCw size={12} /> Revisions
              </dt>
              <dd className="text-ink">{service.revisions}</dd>
            </div>
          </dl>

          {requested ? (
            <div className="mt-5 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-[12px] text-success inline-flex items-center gap-1.5 w-full">
              <Check size={13} /> Request sent — the provider will be in touch.
            </div>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="mt-5 w-full"
              onClick={() => setRequested(true)}
            >
              Request this service
            </Button>
          )}
          <Link href={`/blocks/${block.slug}?tab=messages`} className="block">
            <Button variant="outline" size="md" className="mt-2 w-full">
              <MessageCircle size={13} /> Message provider
            </Button>
          </Link>

          {error && (
            <p className="mt-3 text-[11.5px] text-warning bg-warning/10 border border-warning/30 rounded-md px-3 py-2">
              Saved locally — {error}
            </p>
          )}
        </Card>
      </div>

      {/* Provider */}
      {provider && (
        <Card className="p-5 flex items-center gap-4">
          <Avatar
            src={provider.avatar}
            name={provider.name}
            size={44}
            online={provider.online}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold text-ink">{provider.name}</p>
              <Badge tone="ghost">{provider.role}</Badge>
            </div>
            <p className="text-[11.5px] text-muted mt-0.5">
              Delivering this service · @{provider.handle}
            </p>
          </div>
          <Link
            href={`/profile/${provider.handle}`}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:text-accent-2 transition-colors"
          >
            View profile <ArrowUpRight size={12} />
          </Link>
        </Card>
      )}

      <ServiceForm
        open={editing}
        onClose={() => setEditing(false)}
        onSave={handleSave}
        pending={pending}
        error={error}
        block={block}
        service={service}
      />
    </div>
  );
}

// ---- Form modal ----------------------------------------------------------

function ServiceForm({
  open,
  onClose,
  onSave,
  pending,
  error,
  block,
  service,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (f: FormState) => void;
  pending: boolean;
  error: string | null;
  block: Block;
  service: ServiceDetail | null;
}) {
  const [form, setForm] = useState<FormState>(() => seed(block, service));

  // Re-seed each time the modal opens so it reflects the latest saved values.
  useEffect(() => {
    if (open) setForm(seed(block, service));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const canSave = form.title.trim().length > 0 && form.summary.trim().length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title="Service details"
      description="This is what clients see in the Marketplace before they book."
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => onSave(form)}
            disabled={pending || !canSave}
          >
            {pending ? "Saving…" : "Save service details"}
          </Button>
        </>
      }
    >
      <div className="max-h-[62vh] overflow-y-auto pr-1 -mr-1 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sf-title">Service title</Label>
            <Input
              id="sf-title"
              autoFocus
              placeholder="Mix & Master — Singles"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sf-category">Service category</Label>
            <Input
              id="sf-category"
              placeholder="Mixing · Mastering · Music"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="sf-summary">Service description</Label>
          <textarea
            id="sf-summary"
            rows={3}
            placeholder="What you deliver, and what makes it good."
            value={form.summary}
            onChange={(e) => set("summary", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-line text-ink text-[13px] placeholder:text-muted/70 transition-colors focus:outline-none focus:border-accent/50 focus:bg-surface resize-none"
          />
        </div>

        <div>
          <Label htmlFor="sf-included">What's included</Label>
          <textarea
            id="sf-included"
            rows={4}
            placeholder={"One item per line, e.g.\nMaster for streaming (-14 LUFS)\n1 revision pass included"}
            value={form.included}
            onChange={(e) => set("included", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-line text-ink text-[13px] placeholder:text-muted/70 transition-colors focus:outline-none focus:border-accent/50 focus:bg-surface resize-none"
          />
          <p className="mt-1 text-[10.5px] text-muted">One item per line.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="sf-price">Price</Label>
            <Input
              id="sf-price"
              placeholder="$650 / single"
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sf-turnaround">Turnaround time</Label>
            <Input
              id="sf-turnaround"
              placeholder="5–7 business days"
              value={form.turnaround}
              onChange={(e) => set("turnaround", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sf-revisions">Revisions included</Label>
            <Input
              id="sf-revisions"
              placeholder="1 included"
              value={form.revisions}
              onChange={(e) => set("revisions", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="sf-requirements">Requirements from client</Label>
          <textarea
            id="sf-requirements"
            rows={3}
            placeholder="What you need from the client to start — e.g. 24-bit WAV stems, reference track, tempo & key."
            value={form.requirements}
            onChange={(e) => set("requirements", e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-line text-ink text-[13px] placeholder:text-muted/70 transition-colors focus:outline-none focus:border-accent/50 focus:bg-surface resize-none"
          />
        </div>

        {error && (
          <p className="text-[12px] text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}

function seed(block: Block, service: ServiceDetail | null): FormState {
  const realish = (v: string | undefined, placeholderish: string[]) =>
    v && !placeholderish.includes(v) ? v : "";
  return {
    title: service?.title ?? block.title ?? "",
    category: service?.category ?? block.kind ?? "",
    summary: service?.summary ?? "",
    included: (service?.scope ?? []).join("\n"),
    price: realish(service?.price, ["Set your price"]),
    turnaround: realish(service?.turnaround, ["Set turnaround"]),
    revisions: service?.revisions ?? "1 included",
    requirements: service?.requirements ?? "",
  };
}
