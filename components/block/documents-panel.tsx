import {
  FileText,
  FileType2,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Input,
  SectionLabel,
} from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { getPerson, isEstablishedBlock, type Block } from "@/lib/mock";

type Doc = {
  id: string;
  title: string;
  kind: "doc" | "pdf";
  excerpt: string;
  authorId: string;
  updated: string;
  size: string;
  status?: "Draft" | "In Review" | "Locked";
};

const docs: Doc[] = [
  {
    id: "d1",
    title: "Ep. 4 — Cold Open",
    kind: "doc",
    excerpt:
      "FADE IN. INT. NEWSROOM — NIGHT. The printing press starts. Three beats. We hold on Reza's hands — ink-stained, steady.",
    authorId: "p2",
    updated: "12 min ago",
    size: "84 KB",
    status: "Draft",
  },
  {
    id: "d2",
    title: "Foley shot list — Ep. 5",
    kind: "doc",
    excerpt:
      "Sequence A · Coffee pour, rolling chair, distant siren. Sequence B · Footsteps on linoleum, door whine, light switch.",
    authorId: "p3",
    updated: "1h ago",
    size: "34 KB",
    status: "In Review",
  },
  {
    id: "d3",
    title: "Series bible (v2.3)",
    kind: "doc",
    excerpt:
      "Tone: noir, intimate, score-forward. Themes: institutional silence, the cost of truth, the architecture of an exposé.",
    authorId: "p1",
    updated: "Yesterday",
    size: "112 KB",
    status: "Locked",
  },
  {
    id: "d4",
    title: "Legal — Source clearance",
    kind: "pdf",
    excerpt:
      "Counsel: Hessler & Aboud LLP · 12 named sources, 4 anonymized. Two outstanding releases pending. See appendix C.",
    authorId: "p8",
    updated: "Yesterday",
    size: "212 KB",
    status: "In Review",
  },
  {
    id: "d5",
    title: "Production calendar",
    kind: "doc",
    excerpt:
      "Picture lock: May 30. Final mix: Jun 18. Cover art delivery: Jun 22. Trailer cut: Jun 24. Release: Jun 28.",
    authorId: "p4",
    updated: "3d ago",
    size: "48 KB",
  },
  {
    id: "d6",
    title: "Casting notes",
    kind: "doc",
    excerpt:
      "Imani Ross confirmed for Marisol. Holds out for second pass on Reza voice. Three offers out for the editor role.",
    authorId: "p4",
    updated: "1w ago",
    size: "22 KB",
    status: "Locked",
  },
];

const statusTone: Record<NonNullable<Doc["status"]>, "accent" | "warning" | "success"> = {
  Draft: "accent",
  "In Review": "warning",
  Locked: "success",
};

export function DocumentsPanel({ block }: { block: Block }) {
  const established = isEstablishedBlock(block);
  return (
    <div className="px-8 py-7 space-y-5 animate-fade-up">
      <div className="flex items-end justify-between gap-4">
        <div>
          <SectionLabel>Library</SectionLabel>
          <h2 className="mt-1.5 font-display text-3xl text-ink tracking-tight">
            Documents
          </h2>
          <p className="text-[12.5px] text-muted mt-1">
            Scripts, briefs, calendars, legal — versioned and shareable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-[280px]">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <Input placeholder="Search documents…" className="pl-9" />
          </div>
          <Button variant="primary" size="md">
            <Plus size={12} /> New
          </Button>
        </div>
      </div>

      {!established ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Start a script, a brief, or a production calendar. Documents are versioned, commentable, and shareable with your team."
          action={
            <Button variant="primary" size="md">
              <Plus size={12} /> New document
            </Button>
          }
        />
      ) : (
        <>
          <Card className="p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-grad-mesh opacity-50 pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <span className="h-9 w-9 rounded-lg bg-grad-accent flex items-center justify-center text-bg shadow-glow shrink-0">
                <Sparkles size={15} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink">
                  WiZee · Doc summary
                </p>
                <p className="text-[11.5px] text-muted mt-0.5">
                  Series bible v2.3 changed in 4 places this week. Episode 4
                  cold open trimmed 90 seconds. Want a digest?
                </p>
              </div>
              <Button variant="outline" size="md">
                Open digest
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {docs.map((d) => {
          const author = getPerson(d.authorId);
          const Icon = d.kind === "pdf" ? FileType2 : FileText;
          return (
            <Card
              key={d.id}
              hover
              className="p-5 cursor-pointer flex items-start gap-4"
            >
              <span className="h-10 w-10 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-ink shrink-0">
                <Icon size={15} strokeWidth={1.75} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-ink tracking-tight truncate">
                      {d.title}
                    </h3>
                    <p className="mt-1 text-[12px] text-muted leading-relaxed line-clamp-2">
                      {d.excerpt}
                    </p>
                  </div>
                  {d.status && (
                    <Badge tone={statusTone[d.status]}>{d.status}</Badge>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10.5px] text-muted">
                  {author && (
                    <span className="inline-flex items-center gap-1.5">
                      <Avatar
                        src={author.avatar}
                        name={author.name}
                        size={16}
                      />
                      <span className="text-ink/80">{author.name}</span>
                    </span>
                  )}
                  <span>·</span>
                  <span>{d.updated}</span>
                  <span>·</span>
                  <span className="font-mono">{d.size}</span>
                </div>
              </div>
                  <button className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-ink transition-colors self-start">
                    <MoreHorizontal size={13} />
                  </button>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
