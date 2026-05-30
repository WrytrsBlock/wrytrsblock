import {
  FileText,
  AudioLines,
  Video,
  Image as ImageIcon,
  FileType2,
  MoreHorizontal,
  Play,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { FileAsset } from "@/lib/mock";

const iconFor = {
  doc: FileText,
  audio: AudioLines,
  video: Video,
  image: ImageIcon,
  pdf: FileType2,
} as const;

const tintFor: Record<FileAsset["kind"], string> = {
  doc: "from-accent-2/15 to-accent/10",
  audio: "from-success/15 to-accent-2/10",
  video: "from-danger/15 to-warning/10",
  image: "from-warning/15 to-accent/15",
  pdf: "from-danger/15 to-danger/5",
};

export function FilesGrid({ files }: { files: FileAsset[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
      {files.map((f) => {
        const Icon = iconFor[f.kind];
        const isPlayable = f.kind === "audio" || f.kind === "video";
        return (
          <div
            key={f.id}
            className="group rounded-xl border border-line bg-surface overflow-hidden hover:border-line-strong hover:shadow-elevated transition-all duration-300 cursor-pointer"
          >
            <div
              className={cn(
                "relative h-24 bg-gradient-to-br",
                tintFor[f.kind]
              )}
            >
              {f.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.cover}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="h-8 w-8 rounded-lg bg-bg/80 backdrop-blur-md flex items-center justify-center border border-line">
                  {isPlayable ? (
                    <Play size={12} className="text-ink translate-x-0.5" />
                  ) : (
                    <Icon size={13} className="text-ink" strokeWidth={1.75} />
                  )}
                </span>
              </div>
              <button className="absolute top-1.5 right-1.5 h-6 w-6 rounded-md bg-bg/80 backdrop-blur border border-line opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center text-muted hover:text-ink">
                <MoreHorizontal size={11} />
              </button>
            </div>
            <div className="p-2.5">
              <p className="text-[12px] text-ink font-medium truncate">
                {f.name}
              </p>
              <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted">
                <span className="font-mono">{f.size}</span>
                <span>{f.updated}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
