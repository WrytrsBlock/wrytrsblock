// Orchestration layer between server components and services.
//
// When Supabase is configured, fetches go through the service modules with the
// server client. When not configured (local dev / preview without keys), we
// fall back to the mock dataset so the entire UI still renders end-to-end.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { initialsOf } from "@/lib/cn";
import {
  blocks as mockBlocks,
  people as mockPeople,
  workspaces as mockWorkspaces,
  type Block,
  type Person,
  type Workspace,
} from "@/lib/mock";
import { getProfile } from "@/services/profiles.service";
import {
  getBlockBySlug,
  listBlocksForWorkspace,
} from "@/services/blocks.service";
import { listWorkspacesForUser } from "@/services/workspaces.service";

// Default cover for freshly created Blocks (demo mode).
const FRESH_COVER =
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=2400&q=80";

// Builds a clean, empty Block from a slug so a just-created Block (demo mode,
// no persistence) still lands on a real-looking workspace. The type hint comes
// from the create dialog via ?type= so the right tab set renders.
function synthesizeBlock(
  slug: string,
  blockType: import("@/lib/mock").BlockType = "collaboration"
): Block {
  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const isService = blockType === "service";
  return {
    id: slug,
    slug,
    title,
    tagline: isService
      ? "A fresh Service Block. Define your service, then start delivering."
      : "A fresh Collaboration Block. Add a brief, invite collaborators, start building.",
    blockType,
    status: "Drafting",
    completion: { status: "open", percent: 0 },
    progress: 0,
    deadline: "Not set",
    cover: FRESH_COVER,
    leadId: mockPeople[0].id,
    team: [mockPeople[0].id],
    tags: ["New"],
    kind: "Other",
    board: isService
      ? []
      : [
          { id: "c1", title: "Brief", cards: [] },
          { id: "c2", title: "In Progress", cards: [] },
          { id: "c3", title: "Review", cards: [] },
          { id: "c4", title: "Shipped", cards: [] },
        ],
    activity: [],
    files: [],
    threads: [],
    deliverables: [],
    splits: isService
      ? undefined
      : { status: "draft", contributors: [] },
    service: isService
      ? {
          summary: "",
          scope: [],
          price: "Set your price",
          turnaround: "Set turnaround",
          revisions: "1 included",
          providerId: mockPeople[0].id,
        }
      : undefined,
  };
}

export async function getCurrentProfile(): Promise<Person | null> {
  if (!supabaseConfigured) return mockPeople[0];

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const profile = await getProfile(supabase, user.id);
    return {
      id: user.id,
      name: profile?.display_name ?? user.email?.split("@")[0] ?? "Member",
      handle:
        profile?.handle ?? user.email?.split("@")[0] ?? "member",
      role: (profile?.role as Person["role"]) ?? "Director",
      avatar:
        profile?.avatar_url ??
        `https://api.dicebear.com/9.x/notionists/svg?seed=${user.id}&backgroundColor=transparent`,
      online: true,
    };
  } catch {
    return mockPeople[0];
  }
}

export async function getMyWorkspaces() {
  if (!supabaseConfigured) {
    return [
      {
        id: "ws-mock",
        name: "Inkwell Studio",
        slug: "inkwell",
        description: null,
        cover_url: null,
        created_by: null,
        created_at: "",
        updated_at: "",
      },
    ];
  }
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  try {
    return await listWorkspacesForUser(supabase, user.id);
  } catch {
    return [];
  }
}

const HUES = [
  "from-amber-400/80 to-rose-400/80",
  "from-rose-500/80 to-orange-500/80",
  "from-emerald-500/80 to-teal-500/80",
  "from-violet-500/80 to-blue-500/80",
  "from-sky-500/80 to-indigo-500/80",
];

// Returns workspaces in the switcher's display shape ({id,name,initials,hue})
// for both demo and Supabase modes.
export async function getWorkspacesForSwitcher(): Promise<Workspace[]> {
  if (!supabaseConfigured) return mockWorkspaces;

  const rows = await getMyWorkspaces();
  if (!rows.length) return mockWorkspaces;
  return rows.map((w, i) => ({
    id: w.id,
    name: w.name,
    initials: initialsOf(w.name),
    hue: HUES[i % HUES.length],
  }));
}

export async function getBlocks(workspaceId?: string): Promise<Block[]> {
  if (!supabaseConfigured) return mockBlocks;

  const supabase = createSupabaseServerClient();

  // If no workspace given, infer first one for the user.
  let wsId = workspaceId;
  if (!wsId) {
    const wss = await getMyWorkspaces();
    wsId = wss[0]?.id;
    if (!wsId) return mockBlocks;
  }

  try {
    const rows = await listBlocksForWorkspace(supabase, wsId);
    if (rows.length === 0) return mockBlocks;

    return rows.map((row) => {
      const fallback =
        mockBlocks.find((b) => b.slug === row.slug) ?? mockBlocks[0];
      return {
        ...fallback,
        id: row.id,
        title: row.title ?? fallback.title,
        slug: row.slug ?? fallback.slug,
        tagline: row.tagline ?? fallback.tagline,
        blockType: row.block_type ?? fallback.blockType,
        status: row.status ?? fallback.status,
        progress: row.progress ?? fallback.progress,
        deadline: row.deadline ?? fallback.deadline,
        cover: row.cover_url ?? fallback.cover,
        tags: row.tags ?? fallback.tags,
        budget: row.budget ?? fallback.budget,
        kind: row.kind ?? fallback.kind,
      };
    });
  } catch {
    return mockBlocks;
  }
}

// Marketplace discovery — split Blocks by type. (Demo: mock; Supabase: filter.)
export async function getBlocksByType(
  type: import("@/lib/mock").BlockType
): Promise<Block[]> {
  const all = await getBlocks();
  return all.filter((b) => b.blockType === type);
}

export async function getBlock(
  slug: string,
  typeHint?: import("@/lib/mock").BlockType
): Promise<Block | null> {
  if (!supabaseConfigured) {
    return (
      mockBlocks.find((b) => b.slug === slug) ??
      synthesizeBlock(slug, typeHint)
    );
  }
  const supabase = createSupabaseServerClient();
  try {
    const row = await getBlockBySlug(supabase, slug);
    if (!row)
      return (
        mockBlocks.find((b) => b.slug === slug) ??
        synthesizeBlock(slug, typeHint)
      );
    const fallback =
      mockBlocks.find((b) => b.slug === row.slug) ?? mockBlocks[0];
    return {
      ...fallback,
      id: row.id,
      title: row.title,
      slug: row.slug,
      tagline: row.tagline ?? fallback.tagline,
      blockType: row.block_type ?? fallback.blockType,
      status: row.status,
      progress: row.progress,
      deadline: row.deadline ?? fallback.deadline,
      cover: row.cover_url ?? fallback.cover,
      tags: row.tags ?? fallback.tags,
      budget: row.budget ?? fallback.budget,
      kind: row.kind,
    };
  } catch {
    return mockBlocks.find((b) => b.slug === slug) ?? null;
  }
}
