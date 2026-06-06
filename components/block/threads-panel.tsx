"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Hash,
  Lock,
  Pin,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  Users2,
} from "lucide-react";
import { Avatar, Badge, Input, SectionLabel } from "@/components/ui/primitives";
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

type Channel = {
  id: string;
  name: string;
  icon: typeof Hash;
  unread: number;
  topic: string;
};

const channels: Channel[] = [
  { id: "writers-room", name: "writers-room", icon: Hash, unread: 3, topic: "Eps. 1–6 script room" },
  { id: "post-picture", name: "post-picture", icon: Hash, unread: 0, topic: "Editorial workflow" },
  { id: "sound-design", name: "sound-design", icon: Hash, unread: 0, topic: "Foley, ambience, mix" },
  { id: "cast-talent", name: "cast-talent", icon: Hash, unread: 1, topic: "Casting + VO" },
  { id: "exec-only", name: "exec-only", icon: Lock, unread: 0, topic: "Senior staff" },
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
  const [activeId, setActiveId] = useState(channels[0].id);
  const [store, setStore] = useState<Record<string, ChatMessage[]>>(
    isEstablishedBlock(block) ? SEED : {}
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = channels.find((c) => c.id === activeId) ?? channels[0];
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
    <div className="flex h-full min-h-[480px] border-t border-line">
      {/* Channel list */}
      <div className="w-[240px] shrink-0 border-r border-line bg-surface/30 flex flex-col">
        <div className="px-3 pt-4 pb-2 flex items-center justify-between">
          <SectionLabel>Channels</SectionLabel>
          <button className="p-0.5 rounded text-muted hover:text-ink transition-colors">
            <Plus size={12} />
          </button>
        </div>
        <div className="mx-3 mb-2">
          <div className="relative">
            <Search
              size={11}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <Input
              placeholder="Find a channel"
              className="!h-7 !text-[11.5px] pl-7"
            />
          </div>
        </div>

        <ul className="px-2 mt-2 space-y-px">
          {channels.map((c) => {
            const Icon = c.icon;
            const isActive = c.id === activeId;
            return (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={
                    isActive
                      ? "w-full flex items-center gap-2 px-2 h-7 rounded-md bg-surface-2 text-ink text-[12px] font-medium"
                      : "w-full flex items-center gap-2 px-2 h-7 rounded-md text-muted hover:text-ink hover:bg-surface-2/60 text-[12px] transition-colors"
                  }
                >
                  <Icon size={12} strokeWidth={1.75} />
                  <span className="flex-1 text-left truncate">{c.name}</span>
                  {c.unread > 0 && !isActive && (
                    <Badge tone="accent" className="!h-4 !px-1.5 !text-[10px]">
                      {c.unread}
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="px-2 mt-5">
          <SectionLabel className="px-2 pb-1.5 block">
            Direct messages
          </SectionLabel>
          <ul className="space-y-px">
            {block.team.slice(0, 4).map((id) => {
              const p = getPerson(id);
              if (!p) return null;
              return (
                <li key={p.id}>
                  <button className="w-full flex items-center gap-2 px-2 h-7 rounded-md text-muted hover:text-ink hover:bg-surface-2/60 text-[12px] transition-colors">
                    <Avatar
                      src={p.avatar}
                      name={p.name}
                      size={16}
                      online={p.online}
                    />
                    <span className="flex-1 text-left truncate">{p.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-12 px-5 border-b border-line flex items-center gap-3">
          <Hash size={13} className="text-muted" />
          <h2 className="text-[13px] font-semibold text-ink">{active.name}</h2>
          <span className="text-[11px] text-muted">{active.topic}</span>
          <button className="ml-1 text-muted hover:text-ink p-0.5 rounded transition-colors">
            <Pin size={12} />
          </button>
          <div className="flex-1" />
          <button className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[11.5px] text-muted hover:text-ink hover:bg-surface-2 transition-all">
            <Users2 size={12} /> {block.team.length}
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                compact
                icon={Hash}
                title={`#${active.name} is quiet`}
                description="Kick off the conversation — share an update, drop a file, or @mention a teammate to pull them in."
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
                  <span className="text-[10px] text-muted font-mono">
                    {m.at}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-ink/90 leading-relaxed">
                  {m.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div className="px-6 pb-5">
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
              placeholder={`Message #${active.name}`}
              className="w-full resize-none bg-transparent text-[13px] text-ink placeholder:text-muted/70 focus:outline-none px-1"
            />
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-0.5 text-muted">
                <button className="p-1.5 rounded-md hover:bg-surface-2 hover:text-ink transition-colors">
                  <Plus size={13} />
                </button>
                <button className="p-1.5 rounded-md hover:bg-surface-2 hover:text-ink transition-colors">
                  <AudioLines size={13} />
                </button>
                <button className="p-1.5 rounded-md hover:bg-surface-2 hover:text-ink transition-colors">
                  <Smile size={13} />
                </button>
                <button className="ml-2 inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors">
                  <Sparkles size={11} className="text-accent" />
                  Draft with WiZee
                </button>
              </div>
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-ink text-bg text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Send <Send size={11} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
