"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OPENAI_API_KEY, openaiConfigured, supabaseConfigured } from "@/lib/env";
import type { SongwriterStatus } from "@/types";

export type InspireMode =
  | "continue_writing"
  | "rewrite_section"
  | "generate_hooks"
  | "make_emotional";

export type InspireContext = {
  songTitle: string;
  status: SongwriterStatus | null;
  bpm: number | null;
  key: string | null;
  genre: string | null;
  sectionLabel: string;
  sectionLyrics: string;
};

export type InspireResult =
  | { ok: true; suggestions: string[] }
  | { ok: false; error: string };

const PROMPTS: Record<InspireMode, string> = {
  continue_writing:
    "Continue writing this song section naturally from where it leaves off.",
  rewrite_section:
    "Rewrite this song section with fresh phrasing, keeping the same meaning and mood.",
  generate_hooks:
    "Generate hook / chorus line ideas that fit this song's vibe.",
  make_emotional:
    "Rewrite this section to feel more emotionally resonant and vivid.",
};

const UNAVAILABLE = "AI inspiration isn't available yet.";
const FAILED = "AI inspiration isn't available right now.";
const SIGN_IN_REQUIRED = "Sign in to use Inspire.";

export async function inspireAction(
  mode: InspireMode,
  ctx: InspireContext
): Promise<InspireResult> {
  if (!openaiConfigured) {
    return { ok: false, error: UNAVAILABLE };
  }

  // This action calls a paid third-party API from a plain context object with
  // no Block/doc reference to check membership against — the minimum bar is
  // requiring a signed-in session, so an unauthenticated caller can't invoke
  // the Server Action directly and run up the OpenAI bill for free.
  if (supabaseConfigured) {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: SIGN_IN_REQUIRED };
    }
  }

  try {
    const contextLines = [
      `Song title: ${ctx.songTitle || "Untitled"}`,
      ctx.status ? `Status: ${ctx.status}` : null,
      ctx.bpm != null ? `BPM: ${ctx.bpm}` : null,
      ctx.key ? `Key: ${ctx.key}` : null,
      ctx.genre ? `Genre: ${ctx.genre}` : null,
      `Section: ${ctx.sectionLabel}`,
      `Existing lyrics:\n${ctx.sectionLyrics || "(empty)"}`,
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "You are a professional songwriting collaborator. Given context about " +
              "a song and one of its sections, produce exactly 3 short, distinct " +
              "suggestions for the requested task. Respond with ONLY a JSON array of " +
              "3 strings, nothing else — no markdown, no keys, no explanation.",
          },
          { role: "user", content: `${PROMPTS[mode]}\n\n${contextLines}` },
        ],
      }),
    });

    if (!res.ok) {
      console.error(
        "[songwriter-ai] OpenAI error:",
        res.status,
        await res.text().catch(() => "")
      );
      return { ok: false, error: FAILED };
    }

    const data = await res.json();
    const outputText: string =
      data.output_text ??
      data.output
        ?.flatMap((o: { content?: { type: string; text?: string }[] }) => o.content ?? [])
        .find((c: { type: string }) => c.type === "output_text")?.text ??
      "";

    let suggestions: string[] = [];
    try {
      const parsed = JSON.parse(outputText);
      suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions ?? [];
    } catch {
      suggestions = outputText.split(/\n{2,}/).filter(Boolean);
    }
    suggestions = suggestions.slice(0, 3).map((s) => String(s).trim()).filter(Boolean);

    if (suggestions.length === 0) {
      return { ok: false, error: FAILED };
    }
    return { ok: true, suggestions };
  } catch (e) {
    console.error("[songwriter-ai] inspireAction threw:", e);
    return { ok: false, error: FAILED };
  }
}
