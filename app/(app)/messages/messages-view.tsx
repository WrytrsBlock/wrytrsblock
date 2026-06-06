"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Search, Send } from "lucide-react";
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
    <div className="flex flex-1 min-h-0">
      {/* Conversations */}
      <div
        className={cn(
          "flex-col w-full md:w-[300px] shrink-0 border-r border-line bg-surface/30",
          active ? "hidden md:flex" : "flex"
        )}
      >
        <div className="px-4 pt-5 pb-2">
          <h2 className="font-display text-xl text-ink tracking-tight">
            Messages
          </h2>
        </div>
        <div className="mx-3 mb-3">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages"
              className="!h-8 pl-7 !text-[12px]"
            />
          </div>
        </div>

        <div className="px-2 overflow-y-auto pb-4">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12.5px] text-muted">
              No conversations yet. Message a creator from the Marketplace.
            </p>
          ) : (
            <ul className="space-y-px">
              {filtered.map((c) => {
                const isActive = c.id === activeId;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/messages?c=${c.id}`}
                      scroll={false}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-2.5 h-14 rounded-lg transition-colors",
                        isActive
                          ? "bg-surface-2"
                          : "hover:bg-surface-2/60"
                      )}
                    >
                      <Avatar src={c.other.avatar} name={c.other.name} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[13px] font-medium text-ink truncate">
                            {c.other.name}
                          </span>
                          {c.lastAt && (
                            <span className="text-[10px] text-muted shrink-0">
                              {c.lastAt}
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-muted truncate">
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

      {/* Thread */}
      <div
        className={cn(
          "flex-1 min-w-0 flex-col",
          active ? "flex" : "hidden md:flex"
        )}
      >
        {active ? (
          <>
            <div className="h-14 px-5 border-b border-line flex items-center gap-3">
              <Link
                href="/messages"
                className="md:hidden text-muted hover:text-ink"
              >
                ←
              </Link>
              <Avatar
                src={active.other.avatar}
                name={active.other.name}
                size={32}
              />
              <div className="min-w-0">
                <Link
                  href={`/profile/${active.other.handle}`}
                  className="text-[13.5px] font-semibold text-ink hover:text-accent transition-colors truncate block"
                >
                  {active.other.name}
                </Link>
                <p className="text-[11px] text-muted truncate">
                  @{active.other.handle}
                </p>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-5 py-5 space-y-3"
            >
              {local.length === 0 && (
                <p className="text-center text-[12.5px] text-muted py-8">
                  Say hello 👋
                </p>
              )}
              {local.map((m) => {
                const mine = m.senderId === meId;
                return (
                  <div
                    key={m.id}
                    className={cn("flex", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed",
                        mine
                          ? "bg-grad-accent text-white rounded-br-sm"
                          : "bg-surface-2 text-ink border border-line rounded-bl-sm"
                      )}
                    >
                      {m.body}
                      <span
                        className={cn(
                          "ml-2 align-baseline text-[9.5px]",
                          mine ? "text-white/70" : "text-muted"
                        )}
                      >
                        {m.at}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 pb-5">
              <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-soft focus-within:shadow-elevated transition-shadow">
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
                  placeholder={`Message ${active.other.name}`}
                  className="flex-1 resize-none bg-transparent text-[13px] text-ink placeholder:text-muted/70 focus:outline-none px-2 py-1.5 max-h-32"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || pending}
                  aria-label="Send message"
                  className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-grad-accent text-white shadow-glow hover:opacity-95 transition-opacity disabled:opacity-40"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 border border-line text-muted">
              <MessageSquare size={20} />
            </span>
            <p className="mt-4 text-[14px] font-medium text-ink">
              Your messages
            </p>
            <p className="mt-1 text-[12.5px] text-muted max-w-xs">
              Find a creator in the Marketplace and hit Message to start a
              conversation.
            </p>
            <Link
              href="/marketplace"
              className="mt-4 inline-flex items-center h-9 px-4 rounded-lg bg-grad-accent text-white text-[12.5px] font-medium shadow-glow"
            >
              Browse creators
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
