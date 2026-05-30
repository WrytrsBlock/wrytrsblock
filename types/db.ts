// Hand-written types that mirror the SQL schema in supabase/migrations.
// In production you'd replace these with the output of:
//   supabase gen types typescript --project-id <ref> > types/db.generated.ts

export type UUID = string;
export type ISODate = string;

export type WorkspaceRole = "owner" | "admin" | "member" | "guest";
export type BlockRole = "lead" | "collaborator" | "reviewer" | "guest";
// The two product Block types.
export type BlockType = "collaboration" | "service";
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
