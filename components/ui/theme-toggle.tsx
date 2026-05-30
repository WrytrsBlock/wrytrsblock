"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "./primitives";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={toggle}
      title={isDark ? "Switch to light" : "Switch to dark"}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </Button>
  );
}
