import Link from "next/link";
import { Avatar } from "@/components/ui/primitives";

export type ActivityItem = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  action: string;
  online: boolean;
};

// A live, auto-scrolling activity ticker — real creators with truthful status
// (online, open to collaborate, shared work, …) so a first-time visitor
// immediately feels the Collectv is alive. Scrolls continuously, pauses on
// hover, and respects prefers-reduced-motion.
export function ActivityTicker({ items }: { items: ActivityItem[] }) {
  if (!items.length) return null;
  // Two identical copies so the -50% translate loops seamlessly.
  const loop = [...items, ...items];

  return (
    <section className="mt-9">
      <div className="mb-2.5 flex items-center gap-2 px-0.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2BC48A] opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2BC48A]" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
          Live on WrytrsBlock
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] py-2.5">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#07080d] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#07080d] to-transparent" />

        <div className="flex w-max animate-ticker items-center gap-2.5">
          {loop.map((it, i) => (
            <Link
              key={`${it.id}-${i}`}
              href={`/profile/${it.handle}`}
              aria-hidden={i >= items.length}
              tabIndex={i >= items.length ? -1 : 0}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 transition-colors hover:bg-white/[0.09]"
            >
              <span className="relative shrink-0">
                <Avatar src={it.avatar} name={it.name} size={24} />
                {it.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d0f14] bg-[#2BC48A]" />
                )}
              </span>
              <span className="whitespace-nowrap text-[12.5px] leading-none text-white/85">
                <span className="font-semibold text-white">{it.name}</span>{" "}
                <span className="text-white/55">{it.action}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
