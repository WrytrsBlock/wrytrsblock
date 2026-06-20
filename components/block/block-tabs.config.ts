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
  UserPlus,
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
  | "invite"
  | "settings";

// Collaboration Block — chat-first. The Block opens on Messages; everything else
// (including Invite) lives in the bottom tab bar.
const COLLAB_TABS: Tab[] = [
  { id: "messages", label: "Chat", icon: MessagesSquare },
  { id: "team", label: "Team", icon: Users },
  { id: "files", label: "Files", icon: Folder },
  { id: "splits", label: "Splits", icon: PieChart },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "invite", label: "Invite", icon: UserPlus },
  { id: "settings", label: "Settings", icon: Settings2 },
];

// Service Block — keeps its Overview (service details) as the landing view.
const SERVICE_TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "messages", label: "Chat", icon: MessagesSquare },
  { id: "requests", label: "Requests", icon: Inbox },
  { id: "files", label: "Files", icon: Folder },
  { id: "invite", label: "Invite", icon: UserPlus },
  { id: "settings", label: "Settings", icon: Settings2 },
];

// Block Party — event-style set (reuses existing panels with party labels).
const PARTY_TABS: Tab[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "messages", label: "Chat", icon: MessagesSquare },
  { id: "team", label: "Guests", icon: Users },
  { id: "files", label: "Media", icon: Folder },
  { id: "invite", label: "Invite", icon: UserPlus },
  { id: "settings", label: "Settings", icon: Settings2 },
];

export function tabsForType(t: BlockType): Tab[] {
  if (t === "service") return SERVICE_TABS;
  if (t === "block_party") return PARTY_TABS;
  return COLLAB_TABS;
}

// The view a Block opens on: chat for collaboration, overview elsewhere.
export function defaultTabForType(t: BlockType): BlockTabId {
  return t === "collaboration" ? "messages" : "overview";
}
