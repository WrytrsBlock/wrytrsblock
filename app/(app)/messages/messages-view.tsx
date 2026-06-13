"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleUser,
  Flag,
  MessageSquare,
  Search,
  Send,
} from "lucide-react";
import { Avatar, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useRealtimeTable } from "@/hooks/use-realtime";
import { sendDmAction } from "@/app/actions/dm";
import type { ConversationView, DirectMessageView } from "@/lib/data";

export function MessagesView({
  conversations,
  activeId,
  messages,
  meId,
}: {
  conversations: ConversationView[];
  activeId: string | null;
  messages: DirectMessageView[];
  meId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [local, setLocal] = useState<DirectMessageView[]>(messages);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  // Re-sync when the server sends a different thread.
  useEffect(() => setLocal(messages), [messages, activeId]);

  // Live updates: append incoming messages from the other person.
  useRealtimeTable<{
    id: string;
    sender_id: string;
    body: string;
    created_at: string;
    conversation_id: string;
  }>(
    "direct_messages",
    (payload) => {
      const n = payload.new as {
        id?: string;
        sender_id?: string;
        body?: string;
      };
      if (!n?.id || n.sender_id === meId) return;
      const incoming = n;
      setLocal((prev) =>
        prev.some((m) => m.id === incoming.id)
          ? prev
          : [
              ...prev,
              {
                id: incoming.id!,
                senderId: incoming.sender_id ?? "",
                body: incoming.body ?? "",
                at: "now",
              },
            ]
      );
    },
    activeId ? `conversation_id=eq.${activeId}` : undefined,
    "INSERT",
    !!activeId
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [local.length, activeId]);

  function send() {
    const text = input.trim();
    if (!text || !activeId) return;
    setInput("");
    setLocal((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, senderId: meId, body: text, at: "now" },
    ]);
    startTransition(async () => {
      await sendDmAction(activeId, text).catch(() => {});
      router.refresh();
    });
  }

  const filtered = query.trim()
    ? conversations.filter((c) =>
        `${c.other.name} ${c.other.handle}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      )
    : conversations;

  return (
    <div className="flex-1 min-h-0 page-fluid pt-4 pb-4">
      <div className="grid h-full min-h-0 gap-3 md:grid-cols-[280px_1fr]">
        {/* Conversations — glass chat list (mockup "Block chats") */}
        <div
          className={cn(
            "min-h-0 flex-col gap-2",
            active ? "hidden md:flex" : "flex"
          )}
        >
          <p className="text-[11.5px] text-white/60">Chats</p>
          <div className="relative">
            <Search
              size={12}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages"
              className="!h-8 pl-8 !text-[12px] !rounded-full !bg-white/[0.06] !border-white/[0.16] !text-white placeholder:!text-white/60"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12.5px] text-white/60">
                No conversations yet. Message a creator from the Block Market.
              </p>
            ) : (
              <ul className="space-y-2">
                {filtered.map((c) => {
                  const isActive = c.id === activeId;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/messages?c=${c.id}`}
                        scroll={false}
                        className="lg-glass2 flex w-full items-center gap-2.5 p-2.5 transition-colors hover:bg-white/[0.1]"
                        style={
                          isActive
                            ? {
                                borderColor: "rgba(120,150,255,0.45)",
                                background: "rgba(59,102,246,0.14)",
                              }
                            : undefined
                        }
                      >
                        <Avatar src={c.other.avatar} name={c.other.name} size={32} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[12.5px] font-semibold text-white">
                              {c.other.name}
                            </span>
                            {c.lastAt && (
                              <span className="shrink-0 text-[10px] text-white/50">
                                {c.lastAt}
                              </span>
                            )}
                          </div>
                          <p className="mt-px truncate text-[11px] text-white/60">
                            {c.lastMessage ?? `@${c.other.handle}`}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Thread — the Block is the room (mockup screen 4) */}
        <div
          className={cn(
            "lg-glass min-h-0 min-w-0 flex-col overflow-hidden",
            active ? "flex" : "hidden md:flex"
          )}
        >
          {active ? (
            <>
              <div className="flex items-center gap-2.5 border-b border-white/[0.12] px-3.5 py-2.5">
                <Link
                  href="/messages"
                  className="md:hidden text-white/65 hover:text-white"
                >
                  ←
                </Link>
                <Avatar
                  src={active.other.avatar}
                  name={active.other.name}
                  size={28}
                />
                <Link
                  href={`/profile/${active.other.handle}`}
                  className="truncate text-[13.5px] font-semibold text-white transition-colors hover:text-[#A9BEFF]"
                >
                  {active.other.name}
                </Link>
                <span className="flex-1" />
                <Link
                  href={`/profile/${active.other.handle}`}
                  aria-label={`Open ${active.other.name}'s profile`}
                  title="View profile"
                  className="text-white/70 hover:text-white"
                >
                  <CircleUser size={15} />
                </Link>
                <a
                  href={`mailto:support@wrytrsblock.com?subject=${encodeURIComponent(
                    `Report conversation with @${active.other.handle}`
                  )}&body=${encodeURIComponent(
                    `I want to report my conversation with @${active.other.handle} on WrytrsBlock.\n\nWhat happened:\n`
                  )}`}
                  title="Report conversation"
                  aria-label="Report conversation"
                  className="text-white/70 hover:text-[#FFD98A] transition-colors"
                >
                  <Flag size={14} />
                </a>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3.5"
              >
                {local.length === 0 && (
                  <p className="py-8 text-center text-[12.5px] text-white/60">
                    Say hello 👋
                  </p>
                )}
                {local.map((m) => {
                  const mine = m.senderId === meId;
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-end gap-2",
                        mine ? "justify-end" : "justify-start"
                      )}
                    >
                      {!mine && (
                        <Avatar
                          src={active.other.avatar}
                          name={active.other.name}
                          size={27}
                        />
                      )}
                      <div
                        className={cn(
                          "max-w-[78%] px-3 py-2 text-[12.5px] leading-relaxed text-white",
                          mine
                            ? "rounded-[14px_14px_4px_14px] border border-[rgba(140,170,255,0.5)] bg-[rgba(59,102,246,0.6)] backdrop-blur-[10px]"
                            : "lg-glass2 !rounded-[14px_14px_14px_4px]"
                        )}
                      >
                        {m.body}
                        <span className="ml-2 align-baseline text-[9.5px] text-white/60">
                          {m.at}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg-glass2 mx-3 mb-3 flex items-center gap-2 !rounded-full px-3.5 py-1.5">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={`Message ${active.other.name}…`}
                  className="max-h-32 flex-1 resize-none bg-transparent px-1 py-1.5 text-[12.5px] text-white placeholder:text-white/60 focus:outline-none"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || pending}
                  aria-label="Send message"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#8FA8FF] transition-colors hover:bg-white/[0.1] disabled:opacity-40"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="lg-glass2 inline-flex h-12 w-12 items-center justify-center text-white/70">
                <MessageSquare size={20} />
              </span>
              <p className="mt-4 text-[14px] font-medium text-white">
                Your messages
              </p>
              <p className="mt-1 max-w-xs text-[12.5px] text-white/60">
                Find a creator in the Block Market and hit Message to start a
                conversation.
              </p>
              <Link href="/marketplace" className="lg-btn lg-btn-p mt-4">
                Browse creators
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
