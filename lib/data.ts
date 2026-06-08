// Orchestration layer between server components and services.
//
// When Supabase is configured, fetches go through the service modules with the
// server client. When not configured (local dev / preview without keys), we
// fall back to the mock dataset so the entire UI still renders end-to-end.

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { initialsOf } from "@/lib/cn";
import { listIncomingRequests } from "@/services/block-requests.service";
import type { IncomingRequest } from "@/components/block/block-request-inbox";
import {
  blocks as mockBlocks,
  people as mockPeople,
  workspaces as mockWorkspaces,
  featuredCreators,
  getCreatorByHandle,
  type Block,
  type CreatorProfile,
  type Person,
  type Workspace,
} from "@/lib/mock";
import {
  availabilityLabel,
  creatorTypeLabel,
  experienceLabel,
  interestLabel,
} from "@/lib/onboarding";
import type {
  Availability,
  CreatorType,
  ExperienceLevel,
  Interest,
} from "@/lib/onboarding";
import type { BlockRow, CreatorProfileRow, FeaturedContentItem } from "@/types";
import { getProfile } from "@/services/profiles.service";
import {
  getBlockBySlug,
  listBlocksForWorkspace,
  listBlockMembers,
  getMembership,
  type BlockMemberStatus,
} from "@/services/blocks.service";
import {
  listCreatorProfiles,
  getCreatorProfileByHandle,
  getCreatorProfileById,
  getCreatorIdByHandle,
  listSavedCreatorIds,
} from "@/services/creator-profiles.service";
import {
  getOrCreateDm,
  listMyConversationIds,
  listConversationOthers,
  listProfilesByIds,
  listLatestMessages,
  listDirectMessages,
} from "@/services/dm.service";
import { listWorkspacesForUser } from "@/services/workspaces.service";

export type CreatorView = { person: Person; profile: CreatorProfile };

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
  const isParty = blockType === "block_party";
  const isCollab = !isService && !isParty;
  const tagline = isParty
    ? "A fresh Block Party. Set the time, go live, and gather your audience."
    : isService
    ? "A fresh Service Block. Define your service, then start delivering."
    : "A fresh Collaboration Block. Add a brief, invite collaborators, start building.";
  // Default the party to one hour out so a just-created event reads as Upcoming.
  const startsAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return {
    id: slug,
    slug,
    title,
    tagline,
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
    category: isCollab ? "Project" : undefined,
    party: isParty
      ? {
          category: "Livestream",
          startsAt,
          status: "upcoming",
          access: "public",
          chatEnabled: true,
          interested: 0,
        }
      : undefined,
    board: isCollab
      ? [
          { id: "c1", title: "Brief", cards: [] },
          { id: "c2", title: "In Progress", cards: [] },
          { id: "c3", title: "Review", cards: [] },
          { id: "c4", title: "Shipped", cards: [] },
        ]
      : [],
    activity: [],
    files: [],
    threads: [],
    deliverables: [],
    splits: isCollab ? { status: "draft", contributors: [] } : undefined,
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
    return null;
  }
}

// The signed-in user's creator handle IF they've completed onboarding (a
// creator_profiles row with a handle exists). Returns null when signed out or
// onboarding is incomplete — callers route to /onboarding in that case.
export async function getMyCreatorProfileHandle(): Promise<string | null> {
  if (!supabaseConfigured) return mockPeople[0].handle;
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  try {
    const row = await getCreatorProfileById(supabase, user.id);
    return row?.handle ?? null;
  } catch {
    return null;
  }
}

// The signed-in user's own creator_profiles row in an editable shape (for the
// Edit Profile page). Null when signed out / no profile yet.
export type EditableCreatorProfile = {
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  country: string;
  city: string;
  creatorTypes: string[];
  genres: string[];
  lookingFor: string[];
  availability: string[];
  website: string;
  // All social links keyed by platform (instagram, youtube, spotify, …).
  socials: Record<string, string>;
  // Featured Work (legacy single-image + youtube fields, kept for compatibility)
  portfolio: string[];
  youtube: string;
  // Block Showcase — the curated grid the creator manages.
  featuredContent: FeaturedContentItem[];
};

export async function getMyCreatorProfile(): Promise<EditableCreatorProfile | null> {
  if (!supabaseConfigured) return null;
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  try {
    const row = await getCreatorProfileById(supabase, user.id);
    if (!row) return null;
    return {
      handle: row.handle ?? "",
      displayName: row.display_name ?? "",
      bio: row.bio ?? "",
      avatarUrl: row.avatar_url,
      bannerUrl: row.banner_url,
      country: row.country ?? "",
      city: row.city ?? "",
      creatorTypes: row.creator_types ?? [],
      genres: row.genres ?? [],
      lookingFor: row.looking_for ?? [],
      availability: row.availability ?? [],
      website: row.website ?? "",
      socials: row.socials ?? {},
      portfolio: row.portfolio ?? [],
      youtube: row.socials?.youtube ?? "",
      featuredContent: row.featured_content ?? [],
    };
  } catch {
    return null;
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

// Builds a Block view-model purely from a DB row (no mock substitution) — a
// clean synthesized base supplies empty content arrays so real Blocks render
// honest empty states until their subsystems fill in.
function blockRowToView(row: BlockRow): Block {
  const base = synthesizeBlock(row.slug, row.block_type ?? "collaboration");
  return {
    ...base,
    id: row.id,
    title: row.title ?? base.title,
    slug: row.slug ?? base.slug,
    tagline: row.tagline ?? base.tagline,
    blockType: row.block_type ?? base.blockType,
    status: row.status ?? base.status,
    progress: row.progress ?? base.progress,
    deadline: row.deadline ?? base.deadline,
    cover: row.cover_url || base.cover,
    tags: row.tags ?? base.tags,
    budget: row.budget ?? base.budget,
    kind: row.kind ?? base.kind,
    category: row.category ?? base.category,
    price: row.price ?? undefined,
    visibility: row.visibility ?? base.visibility,
    party: row.party ?? base.party,
    leadId: row.lead_id ?? "",
    team: [],
    service: base.service
      ? { ...base.service, providerId: row.lead_id ?? "" }
      : undefined,
  };
}

export async function getBlocks(workspaceId?: string): Promise<Block[]> {
  if (!supabaseConfigured) return mockBlocks;

  const supabase = createSupabaseServerClient();

  // If no workspace given, infer first one for the user.
  let wsId = workspaceId;
  if (!wsId) {
    const wss = await getMyWorkspaces();
    wsId = wss[0]?.id;
    if (!wsId) return []; // real mode: honest empty, never mock
  }

  try {
    const rows = await listBlocksForWorkspace(supabase, wsId);
    return rows.map(blockRowToView);
  } catch {
    return [];
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
    // Real mode: a row or an honest 404 — never a mock substitute.
    return row ? blockRowToView(row) : null;
  } catch {
    return null;
  }
}

// ---------- Creators (marketplace source of truth) ----------

// Maps a DB creator row into the {person, profile} view-model the marketplace +
// profile UI already consume, so the components stay unchanged.
function creatorRowToView(row: CreatorProfileRow): CreatorView {
  const roles = row.creator_types
    .map((t) => creatorTypeLabel(t as CreatorType))
    .filter(Boolean);
  const skills = row.genres
    .map((g) => interestLabel(g as Interest))
    .filter(Boolean);
  const location =
    [row.city, row.country].filter(Boolean).join(", ") || "Remote";
  const openTo: ("collaboration" | "service")[] = [];
  if (row.availability?.includes("collaborate")) openTo.push("collaboration");
  if (row.availability?.includes("paid_work")) openTo.push("service");

  const person: Person = {
    id: row.id,
    name: row.display_name ?? row.handle ?? "Creator",
    handle: row.handle ?? row.id.slice(0, 8),
    role: (roles[0] ?? "Producer") as Person["role"],
    avatar:
      row.avatar_url ??
      `https://api.dicebear.com/9.x/notionists/svg?seed=${row.id}&backgroundColor=transparent`,
    online: false,
  };
  const profile: CreatorProfile = {
    personId: row.id,
    // Real uploaded cover only — undefined when the creator hasn't added one, so
    // the profile hero falls back to their photo/featured work, not a random
    // stock image (see lib/creator-image.ts).
    banner: row.banner_url ?? undefined,
    tagline: row.tagline ?? row.bio ?? `${roles[0] ?? "Creator"} on WrytrsBlock.`,
    bio: row.bio ?? "",
    location,
    website: row.website ?? undefined,
    blockScore: row.block_score,
    blockMatch: row.block_match,
    rating: row.rating,
    reviews: row.reviews,
    roles: roles.length ? roles : ["Creator"],
    skills,
    availability: (row.availability ?? []).map((a) =>
      availabilityLabel(a as Availability)
    ),
    experienceLevel: row.experience
      ? experienceLabel(row.experience as ExperienceLevel)
      : undefined,
    country: row.country ?? undefined,
    credits: [],
    // Services offered are managed as "service" tiles in the Block Showcase, so
    // they surface both in the showcase grid and the dedicated Services section.
    services: (row.featured_content ?? [])
      .filter((i) => i.type === "service")
      .map((i) => ({
        title: i.title || "Service",
        price: i.subtitle || "",
        slug: i.url?.startsWith("/blocks/")
          ? i.url.replace(/^\/blocks\//, "")
          : undefined,
      })),
    portfolio: row.portfolio ?? [],
    portfolioLinks: [],
    socials: row.socials ?? {},
    openTo: openTo.length ? openTo : ["collaboration"],
    featuredContent: row.featured_content ?? [],
  };
  return { person, profile };
}

// Marketplace creators. Real DB data when Supabase is configured (no mock
// fallback — production shows real creators or an honest empty state); a dev
// seed only in local/demo mode.
export async function getCreators(): Promise<CreatorView[]> {
  if (!supabaseConfigured) return featuredCreators();
  const supabase = createSupabaseServerClient();
  try {
    const rows = await listCreatorProfiles(supabase);
    return rows.map(creatorRowToView);
  } catch {
    return [];
  }
}

export async function getCreator(handle: string): Promise<CreatorView | null> {
  if (!supabaseConfigured) return getCreatorByHandle(handle);
  const supabase = createSupabaseServerClient();
  try {
    const row = await getCreatorProfileByHandle(supabase, handle);
    return row ? creatorRowToView(row) : null;
  } catch {
    return null;
  }
}

// ---------- Block membership ----------

export type BlockMemberView = {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: string;
  status: BlockMemberStatus;
  isLead: boolean;
};

const avatarFor = (id: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${id}&backgroundColor=transparent`;

// Real roster from block_members in Supabase; mock team in demo mode.
export async function getBlockMembers(slug: string): Promise<BlockMemberView[]> {
  if (!supabaseConfigured) {
    const b = mockBlocks.find((x) => x.slug === slug);
    if (!b) return [];
    return b.team
      .map((id) => {
        const p = mockPeople.find((pp) => pp.id === id);
        if (!p) return null;
        return {
          id: p.id,
          name: p.name,
          handle: p.handle,
          avatar: p.avatar,
          role: id === b.leadId ? "lead" : "collaborator",
          status: "accepted" as BlockMemberStatus,
          isLead: id === b.leadId,
        };
      })
      .filter((m): m is BlockMemberView => m !== null);
  }
  const supabase = createSupabaseServerClient();
  try {
    const block = await getBlockBySlug(supabase, slug);
    if (!block) return [];
    const rows = await listBlockMembers(supabase, block.id);
    return rows.map((r) => ({
      id: r.user_id,
      name: r.profile?.display_name ?? r.profile?.handle ?? "Member",
      handle: r.profile?.handle ?? r.user_id.slice(0, 8),
      avatar: r.profile?.avatar_url ?? avatarFor(r.user_id),
      role: r.role,
      status: r.status,
      isLead: r.role === "lead",
    }));
  } catch {
    return [];
  }
}

// The signed-in user's invitation/membership status on a Block (for the banner).
export async function getMyBlockMembership(
  slug: string
): Promise<{ status: BlockMemberStatus } | null> {
  if (!supabaseConfigured) return null;
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  try {
    const block = await getBlockBySlug(supabase, slug);
    if (!block) return null;
    const m = await getMembership(supabase, block.id, user.id);
    return m ? { status: m.status } : null;
  } catch {
    return null;
  }
}

// ---------- Direct messaging ----------

export type ConversationView = {
  id: string;
  other: { id: string; name: string; handle: string; avatar: string };
  lastMessage?: string;
  lastAt?: string;
};
export type DirectMessageView = {
  id: string;
  senderId: string;
  body: string;
  at: string;
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Demo inbox so the messages experience renders without Supabase.
const DM_DEMO_LAST: Record<string, string> = {
  p2: "Sent the v3 cut — take a look.",
  p3: "Picture lock by Friday.",
  p4: "Numbers look good this month.",
  p6: "New theme is up in /audio.",
};
const DM_DEMO_THREADS: Record<string, DirectMessageView[]> = {
  "c-p2": [
    { id: "m1", senderId: "p2", body: "Yo — that cold open is fire.", at: "9:24 AM" },
    { id: "m2", senderId: "p1", body: "Right? Let's build on it.", at: "9:26 AM" },
  ],
  "c-p3": [
    { id: "m1", senderId: "p3", body: "Picture lock by Friday, good?", at: "8:10 AM" },
  ],
  "c-p4": [
    { id: "m1", senderId: "p4", body: "Reforecast is in the sheet.", at: "Mon" },
  ],
  "c-p6": [
    { id: "m1", senderId: "p6", body: "New theme is up in /audio.", at: "Yesterday" },
  ],
};
function demoConversations(): ConversationView[] {
  const out: ConversationView[] = [];
  for (const id of ["p2", "p3", "p4", "p6"]) {
    const p = mockPeople.find((pp) => pp.id === id);
    if (!p) continue;
    out.push({
      id: `c-${id}`,
      other: { id: p.id, name: p.name, handle: p.handle, avatar: p.avatar },
      lastMessage: DM_DEMO_LAST[id] ?? "Say hi 👋",
      lastAt: "now",
    });
  }
  return out;
}

export async function getCurrentUserId(): Promise<string | null> {
  if (!supabaseConfigured) return mockPeople[0].id;
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Real unread direct-message count for the signed-in user (messages from others
// after their last_read_at). 0 → no badge. Demo mode has no real unread state.
export async function getUnreadMessageCount(): Promise<number> {
  if (!supabaseConfigured) return 0;
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  try {
    const { data: mems } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id);
    if (!mems?.length) return 0;
    const lastRead = new Map(
      mems.map((m) => [m.conversation_id as string, m.last_read_at as string])
    );
    const { data: msgs } = await supabase
      .from("direct_messages")
      .select("conversation_id, created_at")
      .in(
        "conversation_id",
        mems.map((m) => m.conversation_id)
      )
      .neq("sender_id", user.id);
    let count = 0;
    for (const m of msgs ?? []) {
      const lr = lastRead.get(m.conversation_id as string);
      if (!lr || new Date(m.created_at as string) > new Date(lr)) count++;
    }
    return count;
  } catch {
    return 0;
  }
}

export async function getConversations(): Promise<ConversationView[]> {
  if (!supabaseConfigured) return demoConversations();
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  try {
    const ids = await listMyConversationIds(supabase, user.id);
    if (!ids.length) return [];
    const [others, latest] = await Promise.all([
      listConversationOthers(supabase, ids, user.id),
      listLatestMessages(supabase, ids),
    ]);
    const otherUserByConv = new Map(
      others.map((o) => [o.conversation_id, o.user_id])
    );
    const profs = await listProfilesByIds(supabase, [
      ...new Set(others.map((o) => o.user_id)),
    ]);
    const profById = new Map(profs.map((p) => [p.id, p]));
    const lastMap = new Map<string, { body: string; created_at: string }>();
    for (const m of latest) {
      if (!lastMap.has(m.conversation_id))
        lastMap.set(m.conversation_id, { body: m.body, created_at: m.created_at });
    }
    return ids
      .map((id) => {
        const prof = profById.get(otherUserByConv.get(id) ?? "") ?? null;
        const last = lastMap.get(id);
        return {
          id,
          other: {
            id: prof?.id ?? "",
            name: prof?.display_name ?? prof?.handle ?? "Creator",
            handle: prof?.handle ?? "",
            avatar: prof?.avatar_url ?? avatarFor(prof?.id ?? id),
          },
          lastMessage: last?.body,
          lastAt: last ? fmtTime(last.created_at) : undefined,
          _ts: last ? new Date(last.created_at).getTime() : 0,
        };
      })
      .sort((a, b) => b._ts - a._ts)
      .map(({ _ts, ...c }) => c);
  } catch {
    return [];
  }
}

export async function getDirectMessages(
  convId: string
): Promise<DirectMessageView[]> {
  if (!supabaseConfigured) return DM_DEMO_THREADS[convId] ?? [];
  const supabase = createSupabaseServerClient();
  try {
    const rows = await listDirectMessages(supabase, convId);
    return rows.map((r) => ({
      id: r.id,
      senderId: r.sender_id,
      body: r.body,
      at: fmtTime(r.created_at),
    }));
  } catch {
    return [];
  }
}

// Resolve a creator @handle to a conversation id, creating the 1:1 if needed.
export async function getOrStartConversationByHandle(
  handle: string
): Promise<string | null> {
  const h = handle.replace(/^@/, "");
  if (!supabaseConfigured) {
    const p = mockPeople.find((pp) => pp.handle === h);
    return p ? `c-${p.id}` : null;
  }
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  try {
    const otherId = await getCreatorIdByHandle(supabase, h);
    if (!otherId || otherId === user.id) return null;
    return await getOrCreateDm(supabase, otherId);
  } catch {
    return null;
  }
}

// Ids of creators the signed-in user has saved (empty in demo mode — the
// marketplace falls back to local bookmarks there).
export async function getSavedCreatorIds(): Promise<string[]> {
  if (!supabaseConfigured) return [];
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  try {
    return await listSavedCreatorIds(supabase, user.id);
  } catch {
    return [];
  }
}

// Incoming Block Requests awaiting the signed-in user's accept/decline.
// Returns [] gracefully if the block_requests table hasn't been migrated yet.
export async function getIncomingBlockRequests(): Promise<IncomingRequest[]> {
  if (!supabaseConfigured) return [];
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  try {
    const rows = await listIncomingRequests(supabase, user.id);
    return rows.map((r) => ({
      id: r.id,
      requesterName: r.requester_name ?? r.requester_handle ?? "A creator",
      requesterHandle: r.requester_handle,
      blockTitle: r.block_title,
      blockType: r.block_type,
      introMessage: r.intro_message,
      expectedOutcome: r.expected_outcome,
    }));
  } catch {
    return [];
  }
}
