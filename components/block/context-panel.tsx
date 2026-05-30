import { AtSign, AudioLines, Send, Smile } from "lucide-react";
import { Avatar, Badge, SectionLabel } from "@/components/ui/primitives";
import { getPerson, people, type Block } from "@/lib/mock";
import { LivePresence, type SeedPresence } from "./live-presence";

const comments = [
  {
    id: "c1",
    actorId: "p1",
    target: "Ep.3 — Cold Open.fdx",
    text: "The transition into the press cue still feels rushed — can we hold on the breath one beat longer?",
    at: "12m",
  },
  {
    id: "c2",
    actorId: "p6",
    target: "newsroom-theme-v4.wav",
    text: "Pushed v4 with the upright bass swap. Floor sits at -18 LUFS.",
    at: "38m",
  },
  {
    id: "c3",
    actorId: "p3",
    target: "Ep.2 picture-lock.mp4",
    text: "Locked. @aria can you sign off before EOD?",
    at: "1h",
  },
];

const activityNow: Record<string, string> = {
  Composer: "editing newsroom-theme-v4.wav",
  Director: "viewing Ep.3 cold open",
  Writer: "drafting Ep.4 · Scene 11",
  Editor: "in Frame.io",
  Producer: "preparing call sheet",
};

export function ContextPanel({ block }: { block: Block }) {
  const seed: SeedPresence[] = people
    .filter((p) => p.online && block.team.includes(p.id))
    .map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      role: p.role,
      activity: activityNow[p.role] ?? "online",
    }));

  return (
    <aside className="hidden xl:flex flex-col w-[340px] shrink-0 border-l border-line bg-surface/30">
      {/* Live presence (client island — joins a realtime presence channel
          when Supabase is configured, otherwise renders the seed roster) */}
      <LivePresence blockId={block.id} seed={seed} />

      <div className="mx-5 my-5 h-px bg-line" />

      {/* Comments */}
      <div className="px-5 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between">
          <SectionLabel>Recent Comments</SectionLabel>
          <Badge tone="accent">3 new</Badge>
        </div>
        <ul className="mt-4 space-y-2.5 overflow-y-auto pr-1 -mr-2">
          {comments.map((c) => {
            const actor = getPerson(c.actorId);
            if (!actor) return null;
            return (
              <li
                key={c.id}
                className="rounded-xl border border-line bg-surface p-3 hover:border-line-strong transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Avatar src={actor.avatar} name={actor.name} size={20} />
                  <span className="text-[11.5px] text-ink font-medium">
                    {actor.name}
                  </span>
                  <span className="text-[10px] text-muted font-mono ml-auto">
                    {c.at}
                  </span>
                </div>
                <p className="mt-2 text-[12px] text-ink/90 leading-snug">
                  {c.text}
                </p>
                <p className="mt-2 text-[10px] text-muted font-mono truncate flex items-center gap-1">
                  <span className="text-muted/50">↳</span> {c.target}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Composer */}
      <div className="m-3 rounded-xl border border-line bg-surface p-2.5">
        <div className="flex items-center gap-1 text-[10px] text-muted px-1 pb-1.5">
          <AtSign size={10} />
          Mention people or files with @
        </div>
        <div className="flex items-end gap-1">
          <textarea
            placeholder="Write a comment…"
            rows={2}
            className="flex-1 resize-none bg-transparent text-[12.5px] text-ink placeholder:text-muted/70 focus:outline-none px-1"
          />
          <button
            className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-ink transition-colors"
            title="Voice note"
          >
            <AudioLines size={13} />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-surface-2 text-muted hover:text-ink transition-colors"
            title="Emoji"
          >
            <Smile size={13} />
          </button>
          <button
            className="p-1.5 rounded-md bg-ink text-bg hover:opacity-90 transition-opacity"
            title="Send"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
}
