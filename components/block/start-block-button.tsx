"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { openNewBlock } from "@/lib/ui-events";

// "Start Block" opens the one unified Create-a-Block flow everywhere. When
// started from a creator, that creator is pre-invited into the new Block.
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
  // When started from a creator, that creator is pre-invited into the new Block.
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
      onClick={() => openNewBlock(undefined, handle)}
    >
      <Plus size={size === "lg" ? 14 : 12} /> {label}
    </Button>
  );
}
