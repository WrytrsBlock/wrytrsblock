import {
  AudioLines,
  FileText,
  FileType2,
  Image as ImageIcon,
  Search,
  Upload,
  Video,
} from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import { Badge, Button, Card } from "@/components/ui/primitives";

type Kind = "image" | "video" | "audio" | "doc" | "pdf";

const media: { id: string; name: string; kind: Kind; cover?: string; meta: string; block: string }[] = [
  { id: "m1", name: "newsroom-theme-v4.wav", kind: "audio", meta: "2:42 · 26.4 MB", block: "Midnight Press" },
  { id: "m2", name: "cover-art-v2.png", kind: "image", cover: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&w=800&q=80", meta: "3200×4000 · 4.1 MB", block: "Midnight Press" },
  { id: "m3", name: "ep2-picture-lock.mp4", kind: "video", cover: "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80", meta: "28:14 · 412 MB", block: "Midnight Press" },
  { id: "m4", name: "lantern-cover-sketch-03.jpg", kind: "image", cover: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=800&q=80", meta: "2400×3000 · 2.8 MB", block: "Lantern · 04" },
  { id: "m5", name: "ep3-cold-open.fdx", kind: "doc", meta: "84 KB", block: "Midnight Press" },
  { id: "m6", name: "halftone-rough-cut.mp4", kind: "video", cover: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80", meta: "12:08 · 184 MB", block: "Halftone" },
  { id: "m7", name: "foley-shotlist.numbers", kind: "doc", meta: "34 KB", block: "Midnight Press" },
  { id: "m8", name: "imani-vo-take-12.wav", kind: "audio", meta: "0:48 · 8.2 MB", block: "Midnight Press" },
  { id: "m9", name: "legal-clearance-v3.pdf", kind: "pdf", meta: "212 KB", block: "Midnight Press" },
  { id: "m10", name: "studio-portrait-aria.jpg", kind: "image", cover: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80", meta: "3600×4500 · 5.2 MB", block: "Inkwell Studio" },
  { id: "m11", name: "halftone-score-sketch.wav", kind: "audio", meta: "1:24 · 14.1 MB", block: "Halftone" },
  { id: "m12", name: "ep1-final-mix.wav", kind: "audio", meta: "29:55 · 308 MB", block: "Midnight Press" },
];

const kindMeta: Record<Kind, { icon: typeof AudioLines; label: string; tint: string }> = {
  image: { icon: ImageIcon, label: "Image", tint: "from-amber-400/30 to-pink-500/30" },
  video: { icon: Video, label: "Video", tint: "from-rose-500/30 to-orange-500/30" },
  audio: { icon: AudioLines, label: "Audio", tint: "from-emerald-500/30 to-teal-500/30" },
  doc: { icon: FileText, label: "Doc", tint: "from-violet-500/30 to-blue-500/30" },
  pdf: { icon: FileType2, label: "PDF", tint: "from-red-500/30 to-orange-500/30" },
};

export default function MediaPage() {
  return (
    <>
      <TopBar
        crumbs={[{ label: "Inkwell Studio" }, { label: "Media Library" }]}
      />
      <div className="flex-1 overflow-y-auto">
      <div className="px-8 py-8 max-w-[1400px] w-full">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted">
              Media Library
            </p>
            <h1 className="mt-1 font-display text-[32px] leading-tight tracking-tight text-ink">
              Every asset across every Block.
            </h1>
            <p className="text-[13px] text-muted mt-1">
              Auto-tagged, searchable, transcribed, and version-tracked.
            </p>
          </div>
          <Button size="lg">
            <Upload size={14} /> Upload
          </Button>
        </div>

        {/* Filter rail */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-surface-2 border border-line text-muted min-w-[320px]">
            <Search size={13} />
            <input
              placeholder="Search assets, transcripts, captions"
              className="bg-transparent text-[12.5px] text-ink placeholder:text-muted/70 focus:outline-none flex-1"
            />
          </div>
          {[
            { label: "All", count: 142 },
            { label: "Images", count: 38 },
            { label: "Video", count: 19 },
            { label: "Audio", count: 54 },
            { label: "Docs", count: 24 },
            { label: "PDF", count: 7 },
          ].map((f, i) => (
            <button
              key={f.label}
              className={
                i === 0
                  ? "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-ink text-bg text-[12px] font-medium"
                  : "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-muted hover:text-ink hover:bg-surface-2 text-[12px]"
              }
            >
              {f.label}
              <span
                className={
                  i === 0
                    ? "text-[10px] opacity-70 font-mono"
                    : "text-[10px] text-muted font-mono"
                }
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {media.map((m) => {
            const meta = kindMeta[m.kind];
            const Icon = meta.icon;
            return (
              <Card
                key={m.id}
                className="overflow-hidden p-0 hover:border-line-strong hover:shadow-soft transition cursor-pointer group"
              >
                <div
                  className={`relative h-32 bg-gradient-to-br ${meta.tint}`}
                >
                  {m.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.cover}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <div className="absolute top-2 left-2">
                    <Badge tone="soft" className="!bg-surface/80 backdrop-blur">
                      <Icon size={10} />
                      {meta.label}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[12.5px] font-medium text-ink truncate">
                    {m.name}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between text-[10.5px] text-muted">
                    <span className="font-mono truncate">{m.meta}</span>
                    <span className="truncate ml-2">{m.block}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      </div>
    </>
  );
}
