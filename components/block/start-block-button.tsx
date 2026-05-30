"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { openNewBlock } from "@/lib/ui-events";

// "Start Block" is the action after discovering a creator — it kicks off a
// Collaboration Block. (The creator you came from is who you'll invite in.)
export function StartBlockButton({
  className,
  size = "sm",
  variant = "primary",
  label = "Start Block",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "outline" | "accent";
  label?: string;
}) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => openNewBlock("collaboration")}
    >
      <Plus size={size === "lg" ? 14 : 12} /> {label}
    </Button>
  );
}
