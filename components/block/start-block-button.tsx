"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { openBlockRequest, openNewBlock } from "@/lib/ui-events";

// "Start Block" is the action after discovering a creator — it opens the Block
// Request modal (communication on WrytrsBlock is tied to a Block). Without a
// creator handle it falls back to the generic create-a-Block flow.
export function StartBlockButton({
  className,
  size = "sm",
  variant = "primary",
  label = "Start Block",
  handle,
  name,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "outline" | "accent";
  label?: string;
  // When started from a creator, sends a Block Request to them.
  handle?: string;
  name?: string;
}) {
  return (
    <Button
      variant={variant}
      size={size}
      // Start Block is the primary action everywhere — force the label + icon
      // pure white (#FFFFFF) for high contrast on the blue gradient. The inline
      // color wins over any cascade conflict; the icon inherits via currentColor.
      className={cn("text-[#FFFFFF] [&_svg]:text-[#FFFFFF]", className)}
      style={{ color: "#FFFFFF" }}
      onClick={() =>
        handle
          ? openBlockRequest(handle, name ?? handle)
          : openNewBlock("collaboration")
      }
    >
      <Plus size={size === "lg" ? 14 : 12} /> {label}
    </Button>
  );
}
