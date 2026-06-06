// Plain (non-client) module so both the server Block page and the client
// BlockTabs component can import `tabsForType` / `BlockTabId`.

import type { LucideIcon } from "lucide-react";
import {
  Folder,
  Inbox,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  PieChart,
  Settings2,
  Users,
} from "lucide-react";
import type { BlockType } from "@/lib/mock";

export type Tab = {
  id: BlockTabId;
  label: string;
  icon: LucideIcon;
};

export type BlockTabId =
  | "overview"
  | "team"
  | "files"
  | "splits"
  | "messages"
  | "tasks"
  | "requests"
  | "settings";

// Collaboration Block — the clean 7-tab set.
const COLLAB_TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "team", label: "Team", icon: Users },
  { id: "files", label: "Files", icon: Folder },
  { id: "splits", label: "Split Sheet", icon: PieChart },
  { id: "messages", label: "Messages", icon: MessagesSquare },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "settings", label: "Settings", icon: Settings2 },
];

// Service Block — simplified set.
const SERVICE_TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "files", label: "Files", icon: Folder },
  { id: "messages", label: "Messages", icon: MessagesSquare },
  { id: "settings", label: "Settings", icon: Settings2 },
];

// Block Party — event-style set (reuses existing panels with party labels).
const PARTY_TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "team", label: "Guests", icon: Users },
  { id: "messages", label: "Chat", icon: MessagesSquare },
  { id: "files", label: "Media", icon: Folder },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export function tabsForType(t: BlockType): Tab[] {
  if (t === "service") return SERVICE_TABS;
  if (t === "block_party") return PARTY_TABS;
  return COLLAB_TABS;
}
