"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { openNewBlock } from "@/lib/ui-events";

// Client trigger that opens the global New Block dialog. Pass a `type` to jump
// straight to that Block type's details step.
export function NewBlockButton({
  variant = "primary",
  size = "md",
  label = "New Block",
  type,
}: {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "accent";
  size?: "sm" | "md" | "lg";
  label?: string;
  type?: "collaboration" | "service";
}) {
  return (
    <Button variant={variant} size={size} onClick={() => openNewBlock(type)}>
      <Plus size={size === "lg" ? 13 : 12} />
      {label}
    </Button>
  );
}
