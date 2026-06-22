// Hand-written types that mirror the SQL schema in supabase/migrations.
// In production you'd replace these with the output of:
//   supabase gen types typescript --project-id <ref> > types/db.generated.ts

export type UUID = string;
export type ISODate = string;

export type WorkspaceRole = "owner" | "admin" | "member" | "guest";
export type BlockRole = "lead" | "collaborator" | "reviewer" | "guest";
// The product Block types.
export type BlockType = "collaboration" | "service" | "block_party";
// Block Party event categories + lifecycle status.
export type BlockPartyCategory =
  | "Livestream"
  | "Listening Session"
  | "Q&A"
  | "Networking"
  | "Release Party"
  | "Open Room"
  | "Workshop"
  | "Other";
export type BlockPartyStatus = "live" | "upcoming" | "ended";
// Event payload stored on a Block Party (blocks.party jsonb). Entry price reuses
// blocks.price (null = free); public/invite reuses blocks.visibility.
export interface BlockPartyData {
  category: BlockPartyCategory;
  startsAt: ISODate;
  status: BlockPartyStatus;
  access: "public" | "invite";
  capacity?: number;
  chatEnabled: boolean;
  livestreamUrl?: string;
  interested: number;
}
export type CompletionStatus = "open" | "active" | "in_review" | "completed";
export type BlockStatus =
  | "Drafting"
  | "In Review"
  | "Producing"
  | "Shipped"
  | "On Hold";
export type BlockKind =
  | "Audio Drama"
  | "Film"
  | "Editorial"
  | "Album"
  | "Series"
  | "Music"
  | "Other";
// What a Collaboration Block is — the prototype's collaboration categories.
export type BlockCategory =
  | "Song"
  | "Beat"
  | "Project"
  | "Open Block"
  | "Community";
export const BLOCK_CATEGORIES: BlockCategory[] = [
  "Song",
  "Beat",
  "Project",
  "Open Block",
  "Community",
];
// Who can see/access a Block (from the prototype's New Block visibility).
export type BlockVisibility =
  | "Public"
  | "Followers Only"
  | "Paid Subscribers"
  | "By Invite";
export const BLOCK_VISIBILITIES: BlockVisibility[] = [
  "Public",
  "Followers Only",
  "Paid Subscribers",
  "By Invite",
];
export type ProjectStatus =
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "blocked";
export type ChannelKind = "public" | "private" | "dm";
export type MediaKind = "image" | "video" | "audio" | "doc" | "pdf";
export type ActivityKind =
  | "comment"
  | "upload"
  | "status"
  | "join"
  | "edit"
  | "create";

export interface Profile {
  id: UUID;
  display_name: string | null;
  handle: string | null;
  role: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

// Marketplace source of truth — structured creator data (see 0006 migration).
// ── Block Showcase — creator-selected showcase pieces shown in the profile
// banner's 3×3 grid (formerly "Featured Content"). A curated portfolio grid:
// photos, reels, videos, songs, beat packs, services, active Blocks, projects,
// upcoming releases, Block Party promos, and testimonials. ───────────────────
export type ContentType =
  | "youtube"
  | "youtube_short"
  | "instagram"
  | "tiktok"
  | "video"
  | "audio"
  | "song"
  | "beat_pack"
  | "image"
  | "portfolio"
  | "service"
  | "block"
  | "release"
  | "block_party"
  | "testimonial";

export interface FeaturedContentItem {
  id: string;
  type: ContentType;
  // Primary link (video/audio/portfolio/service/block/release/party). Optional
  // for text-only tiles (testimonial) and image tiles (url == the image).
  url: string;
  // When "demo", the item belongs to the Demos block (not Videos / Featured).
  scope?: "demo";
  title?: string;
  // Optional supporting label shown under the title on richer tiles.
  subtitle?: string;
  // Uploaded/derived image used as the tile's visual (for non-image types).
  thumbnail?: string;
  // Free text body — used by testimonial tiles.
  body?: string;
  // Pinned tiles sort to the front of the showcase grid.
  pinned?: boolean;
  // Exactly one item may be flagged featured (shown first + larger in the
  // legacy list view). When none is flagged the first item is treated as such.
  featured?: boolean;
}

export interface CreatorProfileRow {
  id: UUID;
  handle: string | null;
  display_name: string | null;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  // Vertical focal point of the cover photo, 0–100 (50 = centered). See 0020.
  cover_position: number | null;
  country: string | null;
  city: string | null;
  creator_types: string[];
  genres: string[];
  looking_for: string[];
  availability: string[];
  experience: string | null;
  gender: string | null;
  age_group: string | null;
  socials: Record<string, string>;
  portfolio: string[];
  featured_content: FeaturedContentItem[];
  website: string | null;
  block_score: number;
  block_match: number;
  rating: number;
  reviews: number;
  is_published: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface SavedCreatorRow {
  user_id: UUID;
  creator_id: UUID;
  created_at: ISODate;
}

export interface Workspace {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  created_by: UUID | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface WorkspaceMember {
  workspace_id: UUID;
  user_id: UUID;
  role: WorkspaceRole;
  joined_at: ISODate;
}

export interface BlockRow {
  id: UUID;
  workspace_id: UUID;
  slug: string;
  title: string;
  tagline: string | null;
  block_type: BlockType;
  status: BlockStatus;
  completion_status: CompletionStatus;
  kind: BlockKind;
  category: BlockCategory | null;
  // Monetization (one-time price in whole currency units) + visibility.
  price: number | null;
  visibility: BlockVisibility | null;
  // Block Party event payload (null for collaboration / service Blocks).
  party: BlockPartyData | null;
  progress: number;
  deadline: ISODate | null;
  cover_url: string | null;
  tags: string[];
  seeking: string[];
  budget: string | null;
  lead_id: UUID | null;
  created_by: UUID | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface BlockMember {
  block_id: UUID;
  user_id: UUID;
  role: BlockRole;
  joined_at: ISODate;
}

// ---------- Collaboration Block: Split Sheets ----------

export type SplitSheetStatus = "draft" | "circulated" | "signed";

export interface SplitSheet {
  id: UUID;
  block_id: UUID;
  status: SplitSheetStatus;
  created_at: ISODate;
}

export interface SplitSheetEntry {
  id: UUID;
  split_sheet_id: UUID;
  user_id: UUID | null;
  role: string;
  writing_pct: number; // 0–100
  publishing_pct: number; // 0–100
  signed_at: ISODate | null;
}

// ---------- Deliverables (both Block types) ----------

export type DeliverableStatus = "pending" | "submitted" | "approved";

export interface Deliverable {
  id: UUID;
  block_id: UUID;
  title: string;
  status: DeliverableStatus;
  owner_id: UUID | null;
  due_at: ISODate | null;
  created_at: ISODate;
}

// ---------- Service Block: service details ----------

export interface ServiceDetailRow {
  block_id: UUID;
  title: string | null;
  category: string | null;
  summary: string | null;
  scope: string[];
  price: string | null;
  turnaround: string | null;
  revisions: string | null;
  requirements: string | null;
  provider_id: UUID | null;
}

export interface ProjectRow {
  id: UUID;
  block_id: UUID;
  title: string;
  description: string | null;
  status: ProjectStatus;
  position: number;
  due_at: ISODate | null;
  assignee_id: UUID | null;
  tag: string | null;
  created_by: UUID | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface Channel {
  id: UUID;
  workspace_id: UUID;
  block_id: UUID | null;
  name: string;
  kind: ChannelKind;
  created_by: UUID | null;
  created_at: ISODate;
}

export interface ChannelMember {
  channel_id: UUID;
  user_id: UUID;
  joined_at: ISODate;
}

export interface Message {
  id: UUID;
  channel_id: UUID;
  author_id: UUID;
  body: string;
  reply_to: UUID | null;
  created_at: ISODate;
  edited_at: ISODate | null;
}

export interface MediaAsset {
  id: UUID;
  workspace_id: UUID;
  block_id: UUID | null;
  name: string;
  kind: MediaKind;
  size_bytes: number | null;
  storage_path: string;
  cover_path: string | null;
  uploaded_by: UUID | null;
  created_at: ISODate;
}

export interface Comment {
  id: UUID;
  block_id: UUID;
  asset_id: UUID | null;
  author_id: UUID | null;
  body: string;
  resolved_at: ISODate | null;
  created_at: ISODate;
}

export interface ActivityEventRow {
  id: UUID;
  block_id: UUID | null;
  workspace_id: UUID | null;
  actor_id: UUID | null;
  kind: ActivityKind;
  text: string | null;
  target_id: UUID | null;
  target_kind: string | null;
  created_at: ISODate;
}

export interface Notification {
  id: UUID;
  recipient_id: UUID;
  actor_id: UUID | null;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: ISODate | null;
  created_at: ISODate;
}

export interface WorkspaceState {
  user_id: UUID;
  workspace_id: UUID;
  pinned_block_ids: UUID[];
  last_block_id: UUID | null;
  sidebar_collapsed: boolean;
  theme: "dark" | "light" | "system";
  updated_at: ISODate;
}

// ---------- Domain view models (joined / derived) ----------

export interface BlockWithLead extends BlockRow {
  lead?: Profile | null;
}

export interface MessageWithAuthor extends Message {
  author: Profile | null;
}

export interface MediaAssetWithUploader extends MediaAsset {
  uploaded_by_profile?: Profile | null;
  public_url?: string | null;
}
