"use client";

import { Plus } from "lucide-react";
import { openNewBlock } from "@/lib/ui-events";

// The mockup's blue glass pill CTA, wired to the existing New Block dialog.
export function LgNewBlockButton({ label = "New Block" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => openNewBlock()}
      className="lg-btn lg-btn-p"
      style={{ color: "#FFFFFF" }}
    >
      <Plus size={14} strokeWidth={2.2} /> {label}
    </button>
  );
}
