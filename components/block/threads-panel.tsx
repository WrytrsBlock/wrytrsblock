"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  MessageSquare,
  Plus,
  Send,
  Smile,
  Sparkles,
} from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getPerson,
  isEstablishedBlock,
  people,
  type Block,
} from "@/lib/mock";
import { useUser } from "@/hooks/use-user";
import { useRealtimeTable } from "@/hooks/use-realtime";
import { supabaseConfigured } from "@/lib/env";
import { sendMessageAction } from "@/app/actions/messages";

type ChatMessage = {
  id: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  at: string;
  mine?: boolean;
};

// Internal room keys — drive the seeded demo messages + the realtime channel id.
// There is one shared room per Block now (no channel switching UI).
const channels = [
  { id: "writers-room" },
  { id: "post-picture" },
  { id: "sound-design" },
  { id: "cast-talent" },
  { id: "exec-only" },
];

function msg(actorId: string, body: string, at: string): ChatMessage {
  const p = getPerson(actorId);
  return {
    id: `seed-${actorId}-${at}-${body.slice(0, 6)}`,
    authorName: p?.name ?? "Member",
    authorAvatar: p?.avatar ?? "",
    body,
    at,
  };
}

const SEED: Record<string, ChatMessage[]> = {
  "writers-room": [
    msg("p2", "Ok, the new cold open for Ep.4 lands so much harder. The printing press as the metronome — yes.", "9:24 AM"),
    msg("p2", "Can we kill the diner scene? It's not paying off and we'd buy ourselves three minutes.", "9:24 AM"),
    msg("p1", "Tentatively yes. Let's see how Sasha cuts around the absence first.", "9:31 AM"),
    msg("p3", "I can do a v3 picture cut without the diner today. ETA 4pm.", "9:33 AM"),
    msg("p6", "Pushed the newsroom theme v4 — the upright bass swap reads calmer under VO. WAV in /audio.", "9:48 AM"),
    msg("p1", "Beautiful. Let's lock this for Ep.1–3.", "9:49 AM"),
  ],
  "post-picture": [
    msg("p3", "v3 picture lock is up on Frame. Burned-in TC, 23.98.", "8:10 AM"),
    msg("p1", "Watching now.", "8:22 AM"),
  ],
  "sound-design": [
    msg("p6", "Room tone library tagged and uploaded. 12 takes.", "Yesterday"),
  ],
  "cast-talent": [
    msg("p7", "VO Tues works — sending avails now.", "2h"),
  ],
  "exec-only": [
    msg("p4", "Budget reforecast in the shared sheet. We're 4% under.", "Mon"),
  ],
};

export function ThreadsPanel({ block }: { block: Block }) {
  const { user } = useUser();
  // One shared room per Block — no channel switching.
  const [activeId] = useState(channels[0].id);
  const [store, setStore] = useState<Record<string, ChatMessage[]>>(
    isEstablishedBlock(block) ? SEED : {}
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = store[activeId] ?? [];

  const me = useMemo(() => {
    const fallback = people[0];
    return {
      name:
        (user?.user_metadata?.display_name as string) ??
        user?.email?.split("@")[0] ??
        "You",
      avatar:
        (user?.user_metadata?.avatar_url as string) ?? fallback.avatar,
    };
  }, [user]);

  // Realtime: only active when Supabase is configured AND the channel id is a
  // real UUID (production). Demo channels use slugs, so this stays dormant.
  const isUuid = /^[0-9a-f-]{36}$/i.test(activeId);
  useRealtimeTable<{ id: string; body: string; created_at: string }>(
    "messages",
    (payload) => {
      if (payload.eventType !== "INSERT") return;
      const row = payload.new;
      setStore((prev) => {
        const list = prev[activeId] ?? [];
        if (list.some((m) => m.id === row.id)) return prev;
        return {
          ...prev,
          [activeId]: [
            ...list,
            {
              id: row.id,
              authorName: "Teammate",
              authorAvatar: "",
              body: row.body,
              at: "now",
            },
          ],
        };
      });
    },
    `channel_id=eq.${activeId}`,
    "INSERT",
    supabaseConfigured && isUuid
  );

  // Auto-scroll to newest.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, activeId]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      authorName: me.name,
      authorAvatar: me.avatar,
      body: text,
      at: "now",
      mine: true,
    };
    setStore((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), optimistic],
    }));

    setSending(true);
    await sendMessageAction(activeId, text).catch(() => {});
    setSending(false);
  }

  return (
    // One big chat that fills the whole Block — no channel column. This IS the
    // collab room.
    <div className="flex h-full min-h-[480px] flex-col">
      <div
        ref={scrollRef}
        className="page-fluid flex-1 space-y-4 overflow-y-auto py-6"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              compact
              icon={MessageSquare}
              title="No messages yet"
              description="Kick off the conversation — share an update, drop a file, or @mention a collaborator to pull them in."
              className="border-0 bg-transparent"
            />
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-3 group">
            <Avatar src={m.authorAvatar} name={m.authorName} size={32} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[12.5px] font-semibold text-ink">
                  {m.authorName}
                </span>
                <span className="text-[10px] text-muted font-mono">{m.at}</span>
              </div>
              <p className="mt-0.5 text-[13px] text-ink/90 leading-relaxed">
                {m.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="page-fluid pb-5">
        <div className="rounded-2xl border border-line bg-surface p-3 shadow-soft transition-shadow focus-within:shadow-elevated">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Message the team"
            className="w-full resize-none bg-transparent px-1 text-[13px] text-ink placeholder:text-muted/70 focus:outline-none"
          />
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-0.5 text-muted">
              <button className="rounded-md p-1.5 transition-colors hover:bg-surface-2 hover:text-ink">
                <Plus size={13} />
              </button>
              <button className="rounded-md p-1.5 transition-colors hover:bg-surface-2 hover:text-ink">
                <AudioLines size={13} />
              </button>
              <button className="rounded-md p-1.5 transition-colors hover:bg-surface-2 hover:text-ink">
                <Smile size={13} />
              </button>
              <button className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-ink">
                <Sparkles size={11} className="text-accent" />
                Draft with WiZee
              </button>
            </div>
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-ink px-3 text-[12px] font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Send <Send size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
