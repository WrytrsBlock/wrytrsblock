"use client";

import { useState } from "react";
import { Check, Copy, RotateCcw, Sparkles } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button, Card } from "@/components/ui/primitives";
import {
  inspireAction,
  type InspireContext,
  type InspireMode,
} from "@/app/actions/songwriter-ai";

const OPTIONS: { mode: InspireMode; label: string }[] = [
  { mode: "continue_writing", label: "Continue Writing" },
  { mode: "rewrite_section", label: "Rewrite This Section" },
  { mode: "generate_hooks", label: "Generate Hook Ideas" },
  { mode: "make_emotional", label: "Make Lyrics More Emotional" },
];

type Phase = "choose" | "loading" | "results" | "error";

export function InspireModal({
  open,
  onClose,
  context,
  onUse,
}: {
  open: boolean;
  onClose: () => void;
  context: InspireContext;
  onUse: (suggestion: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [mode, setMode] = useState<InspireMode | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  async function run(m: InspireMode) {
    setMode(m);
    setPhase("loading");
    const res = await inspireAction(m, context);
    if (res.ok) {
      setSuggestions(res.suggestions);
      setPhase("results");
    } else {
      setError(res.error);
      setPhase("error");
    }
  }

  function reset() {
    setPhase("choose");
    setMode(null);
    setSuggestions([]);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex((cur) => (cur === i ? null : cur)), 1500);
    } catch {
      // Clipboard access denied — silently ignore, Copy just won't confirm.
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="✨ Inspire" size="md">
      {phase === "choose" && (
        <div className="grid grid-cols-1 gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.mode}
              onClick={() => run(o.mode)}
              className="text-left rounded-lg border border-line px-3.5 py-3 text-[13px] text-ink hover:border-accent/40 hover:bg-accent/5 transition-colors"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {phase === "loading" && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted">
          <Sparkles size={20} className="text-accent animate-pulse" />
          <p className="text-[12.5px]">Thinking…</p>
        </div>
      )}

      {phase === "error" && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <p className="text-[12.5px] text-muted">{error}</p>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw size={12} /> Back
          </Button>
        </div>
      )}

      {phase === "results" && (
        <div className="space-y-2.5">
          {suggestions.map((s, i) => (
            <Card key={i} className="p-3.5 space-y-2.5">
              <p className="text-[12.5px] text-ink leading-relaxed whitespace-pre-wrap">{s}</p>
              <div className="flex items-center gap-1.5">
                <Button variant="accent" size="sm" onClick={() => onUse(s)}>
                  Use
                </Button>
                <Button variant="outline" size="sm" onClick={() => copy(s, i)}>
                  {copiedIndex === i ? <Check size={11} /> : <Copy size={11} />}
                  {copiedIndex === i ? "Copied" : "Copy"}
                </Button>
              </div>
            </Card>
          ))}
          <Button variant="ghost" size="sm" onClick={() => mode && run(mode)} className="w-full">
            <RotateCcw size={12} /> Try Again
          </Button>
        </div>
      )}
    </Dialog>
  );
}
