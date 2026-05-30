"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Hash,
  Lock,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  Users2,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Input,
  SectionLabel,
} from "@/components/ui/primitives";
import { getPerson, people } from "@/lib/mock";
import { useUser } from "@/hooks/use-user";

type ChatMessage = {
  id: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  at: string;
};

type Channel = {
  id: string;
  name: string;
  icon: typeof Hash;
  unread: number;
  topic: string;
  block: string;
};

const channels: Channel[] = [
  { id: "writers-room", name: "writers-room", icon: Hash, unread: 3, topic: "Eps. 1–6 script room", block: "Midnight Press" },
  { id: "post-picture", name: "post-picture", icon: Hash, unread: 0, topic: "Editorial workflow", block: "Midnight Press" },
  { id: "sound-design", name: "sound-design", icon: Hash, unread: 0, topic: "Foley, ambience, mix", block: "Midnight Press" },
  { id: "lantern-room", name: "lantern-room", icon: Hash, unread: 1, topic: "Issue 04 planning", block: "Lantern · 04" },
  { id: "exec-only", name: "exec-only", icon: Lock, unread: 0, topic: "Senior staff", block: "Studio" },
];

const dms = ["p2", "p3", "p4", "p6", "p7"];

function msg(actorId: string, body: string, at: string): ChatMessage {
  const p = getPerson(actorId);
  return {
    id: `seed-${actorId}-${at}-${body.slice(0, 5)}`,
    authorName: p?.name ?? "Member",
    authorAvatar: p?.avatar ?? "",
    body,
    at,
  };
}

const SEED: Record<string, ChatMessage[]> = {
  "writers-room": [
    msg("p2", "Ok, the new cold open for Ep.4 lands so much harder.", "9:24 AM"),
    msg("p1", "Agreed. Let's see how Sasha cuts around the diner.", "9:31 AM"),
    msg("p3", "v3 picture cut without the diner today. ETA 4pm.", "9:33 AM"),
    msg("p6", "Pushed newsroom theme v4 — calmer under VO. In /audio.", "9:48 AM"),
  ],
  "post-picture": [msg("p3", "Locked v3 on Frame. Burned-in TC.", "8:10 AM")],
  "sound-design": [msg("p6", "Room tone library tagged and uploaded.", "Yesterday")],
  "lantern-room": [msg("p5", "Cover sketch 03 is up for crit.", "2h")],
  "exec-only": [msg("p4", "Reforecast in the sheet — 4% under.", "Mon")],
};

export function MessagesView() {
  const { user } = useUser();
  const [activeId, setActiveId] = useState(channels[0].id);
  const [store, setStore] = useState<Record<string, ChatMessage[]>>(SEED);
  const [input, setInput] = useState("");
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
      avatar: (user?.user_metadata?.avatar_url as string) ?? fallback.avatar,
    };
  }, [user]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, activeId]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setStore((prev) => ({
      ...prev,
      [activeId]: [
        ...(prev[activeId] ?? []),
        {
          id: `local-${Date.now()}`,
          authorName: me.name,
          authorAvatar: me.avatar,
          body: text,
          at: "now",
        },
      ],
    }));
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* Channels */}
      <div className="hidden md:flex flex-col w-[260px] shrink-0 border-r border-line bg-surface/30">
        <div className="px-4 pt-5 pb-2 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink tracking-tight">
            Messages
          </h2>
          <button className="p-1 rounded text-muted hover:text-ink transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="mx-3 mb-3">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <Input placeholder="Search messages" className="!h-8 pl-7 !text-[12px]" />
          </div>
        </div>

        <div className="px-2 overflow-y-auto">
          <SectionLabel className="px-2 pb-1.5 block">Channels</SectionLabel>
          <ul className="space-y-px">
            {channels.map((c) => {
              const Icon = c.icon;
              const isActive = c.id === activeId;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setActiveId(c.id)}
                    className={
                      isActive
                        ? "w-full flex items-center gap-2 px-2 h-8 rounded-md bg-surface-2 text-ink text-[12.5px]"
                        : "w-full flex items-center gap-2 px-2 h-8 rounded-md text-muted hover:text-ink hover:bg-surface-2/60 text-[12.5px] transition-colors"
                    }
                  >
                    <Icon size={12.5} strokeWidth={1.75} />
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

          <SectionLabel className="px-2 pt-5 pb-1.5 block">
            Direct messages
          </SectionLabel>
          <ul className="space-y-px pb-4">
            {dms.map((id) => {
              const p = getPerson(id);
              if (!p) return null;
              return (
                <li key={p.id}>
                  <button className="w-full flex items-center gap-2 px-2 h-8 rounded-md text-muted hover:text-ink hover:bg-surface-2/60 text-[12.5px] transition-colors">
                    <Avatar src={p.avatar} name={p.name} size={18} online={p.online} />
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
          <Badge tone="ghost" className="hidden sm:inline-flex">
            {active.block}
          </Badge>
          <div className="flex-1" />
          <button className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[11.5px] text-muted hover:text-ink hover:bg-surface-2 transition-all">
            <Users2 size={12} /> 7
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {messages.map((m) => (
            <div key={m.id} className="flex gap-3">
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
                  <Sparkles size={11} className="text-accent" /> Draft with Blocky
                </button>
              </div>
              <button
                onClick={send}
                disabled={!input.trim()}
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
