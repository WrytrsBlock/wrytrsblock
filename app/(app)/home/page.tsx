import Link from "next/link";
import {
  Bolt,
  Briefcase,
  Coins,
  Layers,
  Mail,
  Music,
  PartyPopper,
} from "lucide-react";
import { TopBar } from "@/components/shell/topbar";
import { LgNewBlockButton } from "@/components/ui/lg-button";
import { NeedsReply } from "@/components/home/needs-reply";
import { Avatar } from "@/components/ui/primitives";
import { lgProgress, lgStatus, lgTileGradient } from "@/lib/lg";
import { getPerson, type Block } from "@/lib/mock";
import {
  getBlocks,
  getCreator,
  getCurrentProfile,
  getIncomingBlockRequests,
  getMyCreatorProfileHandle,
} from "@/lib/data";

export const dynamic = "force-dynamic";

// Demo earnings series — there's no earnings model yet, so the dashboard
// mirrors the mockup's chart until payouts ship.
const EARNINGS_BARS = [30, 42, 36, 55, 48, 70, 62, 92];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function BlockIcon({ block }: { block: Block }) {
  const Icon =
    block.blockType === "service"
      ? Briefcase
      : block.blockType === "block_party"
        ? PartyPopper
        : Music;
  return <Icon size={14} />;
}

export default async function HomePage() {
  const [profile, blocks, requests, myHandle] = await Promise.all([
    getCurrentProfile(),
    getBlocks(),
    getIncomingBlockRequests(),
    getMyCreatorProfileHandle(),
  ]);
  const creator = myHandle ? await getCreator(myHandle) : null;

  const firstName = profile?.name.split(" ")[0] ?? "Creator";
  const open = blocks.filter((b) => b.completion.status !== "completed");
  const inReview = open.filter(
    (b) => b.completion.status === "in_review"
  ).length;
  const attention = inReview + requests.length;
  const inMotion = open.slice(0, 3);

  // Recent activity across all of my Blocks (newest entries first per Block).
  const activity = blocks
    .flatMap((b) => b.activity.map((a) => ({ ...a, blockTitle: b.title })))
    .slice(0, 3);

  return (
    <>
      <TopBar />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="page-fluid pb-12 animate-fade-up">
          {/* Greeting + Start Block */}
          <div className="flex items-center gap-3 pt-5 md:pt-6">
            <div>
              <h1 className="text-[24px] font-semibold text-white md:text-[28px]">
                {greeting()}, {firstName}
              </h1>
              <p className="mt-1 text-[12.5px] text-white/60">
                {attention > 0
                  ? `${attention} Block${attention === 1 ? "" : "s"} need${attention === 1 ? "s" : ""} your attention today`
                  : "All quiet — a good day to start something"}
              </p>
            </div>
            <span className="flex-1" />
            <LgNewBlockButton label="Start Block" />
          </div>

          {/* Stat cards */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <div className="lg-glass px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11.5px] text-white/60">
                <Bolt size={13} /> Block Score
              </p>
              <p className="mt-1.5 text-[23px] font-semibold text-white">
                {creator?.profile.blockScore ?? "—"}
              </p>
              <p className="mt-0.5 text-[11px] text-white/60">
                {creator ? `${creator.profile.rating} ★ rating` : "build it with Blocks"}
              </p>
            </div>
            <div className="lg-glass px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11.5px] text-white/60">
                <Layers size={13} /> Active Blocks
              </p>
              <p className="mt-1.5 text-[23px] font-semibold text-white">
                {open.length}
              </p>
              <p className="mt-0.5 text-[11px] text-white/60">
                {inReview} in review
              </p>
            </div>
            <div className="lg-glass px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11.5px] text-white/60">
                <Mail size={13} /> Requests
              </p>
              <p className="mt-1.5 text-[23px] font-semibold text-white">
                {requests.length}
              </p>
              <p className="mt-0.5 text-[11px] text-[#FFD98A]">
                {requests.length > 0 ? "awaiting reply" : "all caught up"}
              </p>
            </div>
            <div className="lg-glass px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[11.5px] text-white/60">
                <Coins size={13} /> Earnings
                <span className="lg-pill lg-pill-w ml-auto !px-2 !text-[9px]">
                  Demo
                </span>
              </p>
              <p className="mt-1.5 text-[23px] font-semibold text-white">
                $1,240
              </p>
              <p className="mt-0.5 text-[11px] text-white/60">
                payouts coming soon
              </p>
            </div>
          </div>

          {/* Main grid */}
          <div className="mt-3 grid gap-3 lg:grid-cols-[1.45fr_1fr]">
            <div className="flex flex-col gap-3">
              {/* In motion */}
              <div className="lg-glass p-3.5">
                <div className="mb-2 flex items-center">
                  <p className="flex-1 text-[13.5px] font-semibold text-white">
                    In motion
                  </p>
                  <Link
                    href="/blocks"
                    className="text-[11.5px] text-white/60 transition-colors hover:text-white"
                  >
                    My Blocks →
                  </Link>
                </div>
                {inMotion.length === 0 ? (
                  <p className="py-3 text-[12px] text-white/60">
                    Nothing in motion yet — start a Block to get moving.
                  </p>
                ) : (
                  inMotion.map((b, i) => {
                    const status = lgStatus(b);
                    return (
                      <Link
                        key={b.id}
                        href={`/blocks/${b.slug}`}
                        className={`flex items-center gap-3 py-2 ${
                          i < inMotion.length - 1
                            ? "border-b border-white/[0.09]"
                            : ""
                        }`}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-white/25 text-white"
                          style={{ background: lgTileGradient(b) }}
                        >
                          <BlockIcon block={b} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-white">
                            {b.title}
                          </span>
                          <span className="lg-prog mt-1.5 block max-w-[185px]">
                            <span
                              className="block"
                              style={{ width: `${lgProgress(b)}%` }}
                            />
                          </span>
                        </span>
                        <span className={`lg-pill ${status.cls}`}>
                          {status.label}
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>

              {/* Earnings — demo data until payouts ship */}
              <div className="lg-glass p-3.5">
                <div className="mb-2 flex items-center gap-2">
                  <p className="flex-1 text-[13.5px] font-semibold text-white">
                    Earnings · last 8 weeks
                  </p>
                  <span className="lg-pill lg-pill-w !px-2 !text-[9px]">
                    Sample data
                  </span>
                  <span className="text-[11.5px] text-white/60">$1,240</span>
                </div>
                <div className="flex h-[84px] items-end gap-[7px]">
                  {EARNINGS_BARS.map((h, i) => (
                    <div key={i} className="lg-bar" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between">
                  <span className="text-[10.5px] text-white/60">Apr 14</span>
                  <span className="text-[10.5px] text-white/60">Jun 8</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Needs your reply — incoming Block Requests */}
              <NeedsReply requests={requests} />

              {/* Activity */}
              <div className="lg-glass flex-1 p-3.5">
                <p className="mb-2.5 text-[13.5px] font-semibold text-white">
                  Activity
                </p>
                {activity.length === 0 ? (
                  <p className="text-[12px] text-white/60">
                    No recent activity in your Blocks.
                  </p>
                ) : (
                  activity.map((a) => {
                    const actor = getPerson(a.actorId);
                    return (
                      <div
                        key={`${a.blockTitle}-${a.id}`}
                        className="mb-2.5 flex items-start gap-2.5 last:mb-0"
                      >
                        <Avatar
                          src={actor?.avatar}
                          name={actor?.name ?? "?"}
                          size={23}
                        />
                        <p className="text-[12px] leading-[1.45] text-white/60">
                          <span className="font-semibold text-white">
                            {actor?.name ?? "Someone"}
                          </span>{" "}
                          {a.text} · {a.blockTitle}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
