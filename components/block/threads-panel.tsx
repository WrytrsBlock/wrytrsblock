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
import { people } from "@/lib/mock";
import { useUser } from "@/hooks/use-user";
import { useRealtimeTable } from "@/hooks/use-realtime";
import { supabaseConfigured } from "@/lib/env";
import { sendMessageAction } from "@/app/actions/messages";
import type { BlockMemberView, ChatMessageView } from "@/lib/data";

const avatarFor = (id: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${id}&backgroundColor=transparent`;

type ChatMessage = {
  id: string;
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

export function ThreadsPanel({
  channelId,
  initialMessages,
  members,
  currentUserId,
}: {
  // The Block's real General channel id (null only in demo / if missing).
  channelId: string | null;
  initialMessages: ChatMessageView[];
  members: BlockMemberView[];
  currentUserId: string | null;
}) {
  const { user } = useUser();

  // Resolve a sender id → name/avatar from the Block roster (for realtime rows).
  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map((m) => ({
      id: m.id,
      authorName: m.authorName,
      authorAvatar: m.authorAvatar,
      body: m.body,
      at: m.at,
      mine: !!currentUserId && m.authorId === currentUserId,
    }))
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const me = useMemo(() => {
    const fallback = people[0];
    const mine = currentUserId ? memberById.get(currentUserId) : undefined;
    return {
      name:
        mine?.name ??
        (user?.user_metadata?.display_name as string) ??
        user?.email?.split("@")[0] ??
        "You",
      avatar:
        mine?.avatar ??
        (user?.user_metadata?.avatar_url as string) ??
        fallback.avatar,
    };
  }, [user, currentUserId, memberById]);

  // Realtime: live-append messages from OTHER members on the same channel. Only
  // active in production with a real channel UUID. Our own messages are shown
  // optimistically, so we ignore the echo of rows we authored.
  const isUuid = !!channelId && /^[0-9a-f-]{36}$/i.test(channelId);
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
        const author = memberById.get(row.author_id);
        return [
          ...prev,
          {
            id: row.id,
            authorName: author?.name ?? "Member",
            authorAvatar: author?.avatar ?? avatarFor(row.author_id),
            body: row.body,
            at: "now",
          },
        ];
      });
    },
    `channel_id=eq.${channelId}`,
    "INSERT",
    supabaseConfigured && isUuid
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

      {/* Composer */}
      <div className="page-fluid pb-5">
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
