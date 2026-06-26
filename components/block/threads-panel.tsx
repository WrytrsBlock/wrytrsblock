"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Smile,
  Square,
} from "lucide-react";
import { Avatar } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/empty-state";
import { type Block } from "@/lib/mock";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import { useRealtimeTable } from "@/hooks/use-realtime";
import { supabaseConfigured } from "@/lib/env";
import { sendMessageAction } from "@/app/actions/messages";

const avatarFor = (id: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${id}&backgroundColor=transparent`;

type ChatMessage = {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  at: string;
  mine?: boolean;
  // A recorded voice note (object URL), played back inline.
  audioUrl?: string;
  // An attached file (object URL) — images render inline, others as a chip.
  attachment?: { url: string; name: string; isImage: boolean };
};

type Author = { name: string; avatar: string };

const EMOJIS = [
  "😀", "😂", "😍", "🔥", "👍", "🙌", "🎉", "💯",
  "👀", "🙏", "💪", "✅", "❤️", "😅", "🤝", "🎶",
  "🚀", "✨", "👏", "😎", "🤔", "😭", "🥳", "💡",
];

function fmtDur(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);

export function ThreadsPanel({ block }: { block: Block }) {
  const { user } = useUser();
  const supabase = useSupabase();
  const currentUserId = user?.id ?? null;

  // The real Block id is a UUID in production; demo/synthesized Blocks use the
  // slug, which means no real channel — the chat then stays local/optimistic.
  const realBlock = supabaseConfigured && isUuid(block.id);

  const [channelId, setChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // id → display name/avatar for every member of this Block (for both the
  // initial history and live realtime rows). Held in a ref so the realtime
  // handler can read it without re-subscribing.
  const authorsRef = useRef<Map<string, Author>>(new Map());

  const me = useMemo(() => {
    const mine = currentUserId ? authorsRef.current.get(currentUserId) : undefined;
    return {
      name:
        mine?.name ??
        (user?.user_metadata?.display_name as string) ??
        user?.email?.split("@")[0] ??
        "You",
      avatar:
        mine?.avatar ??
        (user?.user_metadata?.avatar_url as string) ??
        (currentUserId ? avatarFor(currentUserId) : ""),
    };
    // authorsRef is a ref; messages length nudges recompute after load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentUserId, messages.length]);

  // Load the Block's General channel + its existing messages (shared by every
  // accepted member). Fully guarded so a failure never throws the page.
  useEffect(() => {
    let cancelled = false;
    if (!realBlock || !supabase) return;
    (async () => {
      try {
        const { data: chans } = await supabase
          .from("channels")
          .select("id")
          .eq("block_id", block.id)
          .order("created_at", { ascending: true })
          .limit(1);
        const ch = (chans?.[0]?.id as string) ?? null;
        if (!ch || cancelled) return;

        // Build the author map from the Block roster.
        const { data: mems } = await supabase
          .from("block_members")
          .select("user_id")
          .eq("block_id", block.id);
        const ids = [...new Set((mems ?? []).map((m) => m.user_id as string))];
        if (ids.length) {
          const { data: profs } = await supabase
            .from("creator_profiles")
            .select("id, display_name, handle, avatar_url")
            .in("id", ids);
          const map = new Map<string, Author>();
          for (const p of profs ?? []) {
            map.set(p.id as string, {
              name:
                (p.display_name as string) ??
                (p.handle as string) ??
                "Member",
              avatar: (p.avatar_url as string) ?? avatarFor(p.id as string),
            });
          }
          authorsRef.current = map;
        }

        const { data: rows } = await supabase
          .from("messages")
          .select("id, author_id, body, created_at")
          .eq("channel_id", ch)
          .order("created_at", { ascending: true })
          .limit(200);

        if (cancelled) return;
        setChannelId(ch);
        setMessages(
          (rows ?? []).map((r) => {
            const a = authorsRef.current.get(r.author_id as string);
            return {
              id: r.id as string,
              authorId: r.author_id as string,
              authorName: a?.name ?? "Member",
              authorAvatar: a?.avatar ?? avatarFor(r.author_id as string),
              body: r.body as string,
              at: fmtTime(r.created_at as string),
              mine: r.author_id === currentUserId,
            };
          })
        );
      } catch {
        /* leave the chat empty rather than crash */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [realBlock, supabase, block.id, currentUserId]);

  // Realtime: append messages from OTHER members on this channel (our own show
  // optimistically). Active only once we have a real channel id.
  useRealtimeTable<{
    id: string;
    body: string;
    created_at: string;
    author_id: string;
  }>(
    "messages",
    (payload) => {
      if (payload.eventType !== "INSERT") return;
      const row = payload.new;
      if (row.author_id === currentUserId) return; // our own, already shown
      setMessages((prev) => {
        if (prev.some((m) => m.id === row.id)) return prev;
        const a = authorsRef.current.get(row.author_id);
        return [
          ...prev,
          {
            id: row.id,
            authorId: row.author_id,
            authorName: a?.name ?? "Member",
            authorAvatar: a?.avatar ?? avatarFor(row.author_id),
            body: row.body,
            at: fmtTime(row.created_at),
          },
        ];
      });
    },
    `channel_id=eq.${channelId}`,
    "INSERT",
    !!channelId && supabaseConfigured
  );

  // Auto-scroll to newest.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");

    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      authorId: currentUserId ?? undefined,
      authorName: me.name,
      authorAvatar: me.avatar,
      body: text,
      at: "now",
      mine: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    if (channelId) {
      setSending(true);
      await sendMessageAction(channelId, text).catch(() => {});
      setSending(false);
    }
  }

  // ── Voice notes ───────────────────────────────────────────────────────────
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [recError, setRecError] = useState<string | null>(null);

  // Tick the duration while recording.
  useEffect(() => {
    if (!recording) return;
    setRecSecs(0);
    const t = setInterval(() => setRecSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  // Release any object URLs when the panel unmounts.
  useEffect(() => {
    return () => {
      for (const m of messages) {
        if (m.audioUrl) URL.revokeObjectURL(m.audioUrl);
        if (m.attachment) URL.revokeObjectURL(m.attachment.url);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Emoji + file attachments ──────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart ?? input.length;
      const end = el.selectionEnd ?? input.length;
      setInput(input.slice(0, start) + emoji + input.slice(end));
      // Restore focus + caret after the inserted emoji.
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + emoji.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      setInput((v) => v + emoji);
    }
    setEmojiOpen(false);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    const url = URL.createObjectURL(file);
    const att: ChatMessage = {
      id: `file-${Date.now()}`,
      authorName: me.name,
      authorAvatar: me.avatar,
      body: input.trim(),
      at: "now",
      mine: true,
      attachment: {
        url,
        name: file.name,
        isImage: file.type.startsWith("image/"),
      },
    };
    setInput("");
    setMessages((prev) => [...prev, att]);
  }

  async function toggleVoiceNote() {
    setRecError(null);
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setRecError("Voice notes aren't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        if (blob.size === 0) return;
        const url = URL.createObjectURL(blob);
        const note: ChatMessage = {
          id: `voice-${Date.now()}`,
          authorName: me.name,
          authorAvatar: me.avatar,
          body: "",
          at: "now",
          mine: true,
          audioUrl: url,
        };
        setMessages((prev) => [...prev, note]);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setRecError("Microphone access was blocked.");
    }
  }

  return (
    // One big chat that fills the whole Block. min-h-0 lets the message list
    // scroll inside the available flex space instead of overflowing under the
    // Block tabs / bottom nav on mobile; the composer is pinned (shrink-0).
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={scrollRef}
        className="page-fluid min-h-0 flex-1 space-y-4 overflow-y-auto py-6"
      >
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Start the conversation"
              description="No messages yet — share an update or @mention a collaborator to pull them in."
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
              {m.body && (
                <p className="mt-0.5 text-[13px] text-ink/90 leading-relaxed">
                  {m.body}
                </p>
              )}
              {m.audioUrl && (
                <audio
                  controls
                  src={m.audioUrl}
                  className="mt-1.5 h-9 w-full max-w-[280px]"
                />
              )}
              {m.attachment &&
                (m.attachment.isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.attachment.url}
                    alt={m.attachment.name}
                    className="mt-1.5 max-h-[220px] max-w-[280px] rounded-lg border border-line object-cover"
                  />
                ) : (
                  <a
                    href={m.attachment.url}
                    download={m.attachment.name}
                    className="mt-1.5 inline-flex max-w-[280px] items-center gap-2 rounded-lg border border-line bg-surface-2/50 px-3 py-2 text-[12.5px] text-ink transition-colors hover:bg-surface-2"
                  >
                    <Paperclip size={13} className="shrink-0 text-muted" />
                    <span className="truncate">{m.attachment.name}</span>
                  </a>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Composer — shrink-0 so it stays visible above the Block tabs + nav. */}
      <div className="page-fluid shrink-0 pb-3">
        <div className="rounded-2xl border border-line bg-surface p-3 shadow-soft transition-shadow focus-within:shadow-elevated">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Write a message..."
            className="w-full resize-none bg-transparent px-1 text-[13px] text-ink placeholder:text-muted/70 focus:outline-none"
          />
          {/* Hidden file picker driven by the + button. */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={onPickFile}
          />
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-0.5 text-muted">
              {/* Attach a file */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach a file"
                className="rounded-md p-1.5 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <Plus size={13} />
              </button>
              {/* Voice note — records mic audio and posts it as a playable note. */}
              <button
                type="button"
                onClick={toggleVoiceNote}
                aria-label={recording ? "Stop recording" : "Record voice note"}
                aria-pressed={recording}
                className={
                  "inline-flex items-center gap-1.5 rounded-md p-1.5 transition-colors " +
                  (recording
                    ? "bg-danger/15 text-danger"
                    : "hover:bg-surface-2 hover:text-ink")
                }
              >
                {recording ? <Square size={13} /> : <AudioLines size={13} />}
                {recording && (
                  <span className="text-[11px] font-medium tabular-nums">
                    {fmtDur(recSecs)}
                  </span>
                )}
              </button>
              {/* Emoji picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEmojiOpen((o) => !o)}
                  aria-label="Add emoji"
                  aria-expanded={emojiOpen}
                  className={
                    "rounded-md p-1.5 transition-colors " +
                    (emojiOpen
                      ? "bg-surface-2 text-ink"
                      : "hover:bg-surface-2 hover:text-ink")
                  }
                >
                  <Smile size={13} />
                </button>
                {emojiOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setEmojiOpen(false)}
                    />
                    <div className="absolute bottom-full left-0 z-20 mb-2 w-[244px] rounded-xl border border-line bg-surface p-2 shadow-elevated">
                      <div className="grid grid-cols-8 gap-0.5">
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => insertEmoji(e)}
                            className="rounded-md p-1 text-[16px] leading-none transition-colors hover:bg-surface-2"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {recError && (
                <span className="ml-1.5 text-[11px] text-danger">{recError}</span>
              )}
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
