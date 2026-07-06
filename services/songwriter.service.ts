import type {
  SongwriterComment,
  SongwriterContributor,
  SongwriterDoc,
  SongwriterLoopMarker,
  SongwriterSection,
  SongwriterSectionKind,
  SongwriterSectionRevision,
  UUID,
} from "@/types";
import type { DB } from "./types";

// ---------- doc ----------

export async function ensureSongwriterDoc(
  supabase: DB,
  blockId: UUID
): Promise<SongwriterDoc> {
  const { data: existing, error: selErr } = await supabase
    .from("songwriter_docs")
    .select("*")
    .eq("block_id", blockId)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing as SongwriterDoc;

  const { data, error } = await supabase
    .from("songwriter_docs")
    .insert({ block_id: blockId })
    .select("*")
    .single();
  if (error) throw error;
  return data as SongwriterDoc;
}

export type SongwriterDocPatch = Partial<
  Pick<SongwriterDoc, "status" | "bpm" | "key" | "genre" | "instrumental_id">
>;

export async function updateSongwriterDoc(
  supabase: DB,
  docId: UUID,
  patch: SongwriterDocPatch
): Promise<SongwriterDoc> {
  const { data, error } = await supabase
    .from("songwriter_docs")
    .update(patch)
    .eq("id", docId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SongwriterDoc;
}

// ---------- sections ----------

export async function getSongwriterSections(
  supabase: DB,
  docId: UUID
): Promise<SongwriterSection[]> {
  const { data, error } = await supabase
    .from("songwriter_sections")
    .select("*")
    .eq("doc_id", docId)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data as SongwriterSection[]) ?? [];
}

// Goes through the add_songwriter_section() RPC (see migration 0033) instead
// of a plain insert: computing "append at max(position)+1" as a separate
// read before this insert would race two concurrent "Add Section" clicks
// into the same position. The RPC computes and inserts in one statement.
export async function addSongwriterSection(
  supabase: DB,
  docId: UUID,
  kind: SongwriterSectionKind,
  label?: string | null
): Promise<SongwriterSection> {
  const { data, error } = await supabase.rpc("add_songwriter_section", {
    p_doc_id: docId,
    p_kind: kind,
    p_label: label ?? null,
  });
  if (error) throw error;
  return data as SongwriterSection;
}

export type SongwriterSectionPatch = Partial<
  Pick<SongwriterSection, "lyrics" | "label" | "kind" | "position">
>;

export async function updateSongwriterSection(
  supabase: DB,
  sectionId: UUID,
  patch: SongwriterSectionPatch
): Promise<SongwriterSection> {
  const { data, error } = await supabase
    .from("songwriter_sections")
    .update(patch)
    .eq("id", sectionId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SongwriterSection;
}

export async function removeSongwriterSection(
  supabase: DB,
  sectionId: UUID
): Promise<void> {
  const { error } = await supabase
    .from("songwriter_sections")
    .delete()
    .eq("id", sectionId);
  if (error) throw error;
}

// ---------- loop markers ----------

export async function getSongwriterLoopMarkers(
  supabase: DB,
  docId: UUID
): Promise<SongwriterLoopMarker[]> {
  const { data, error } = await supabase
    .from("songwriter_loop_markers")
    .select("*")
    .eq("doc_id", docId)
    .order("start_seconds", { ascending: true });
  if (error) throw error;
  return (data as SongwriterLoopMarker[]) ?? [];
}

export async function addSongwriterLoopMarker(
  supabase: DB,
  docId: UUID,
  name: string,
  startSeconds: number,
  endSeconds: number
): Promise<SongwriterLoopMarker> {
  const { data, error } = await supabase
    .from("songwriter_loop_markers")
    .insert({
      doc_id: docId,
      name,
      start_seconds: startSeconds,
      end_seconds: endSeconds,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SongwriterLoopMarker;
}

export async function removeSongwriterLoopMarker(
  supabase: DB,
  markerId: UUID
): Promise<void> {
  const { error } = await supabase
    .from("songwriter_loop_markers")
    .delete()
    .eq("id", markerId);
  if (error) throw error;
}

// ---------- comments ----------

export async function getSongwriterComments(
  supabase: DB,
  docId: UUID
): Promise<SongwriterComment[]> {
  const { data, error } = await supabase
    .from("songwriter_comments")
    .select("*")
    .eq("doc_id", docId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as SongwriterComment[]) ?? [];
}

export async function addSongwriterComment(
  supabase: DB,
  input: {
    docId: UUID;
    sectionId: UUID;
    parentCommentId?: UUID | null;
    lineIndex: number;
    quotedText?: string | null;
    body: string;
  }
): Promise<SongwriterComment> {
  const { data, error } = await supabase
    .from("songwriter_comments")
    .insert({
      doc_id: input.docId,
      section_id: input.sectionId,
      parent_comment_id: input.parentCommentId ?? null,
      line_index: input.lineIndex,
      quoted_text: input.quotedText ?? null,
      body: input.body,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SongwriterComment;
}

export async function resolveSongwriterComment(
  supabase: DB,
  commentId: UUID,
  resolved: boolean,
  resolvedBy: UUID | null
): Promise<SongwriterComment> {
  const { data, error } = await supabase
    .from("songwriter_comments")
    .update(
      resolved
        ? { resolved: true, resolved_by: resolvedBy, resolved_at: new Date().toISOString() }
        : { resolved: false, resolved_by: null, resolved_at: null }
    )
    .eq("id", commentId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SongwriterComment;
}

export async function removeSongwriterComment(
  supabase: DB,
  commentId: UUID
): Promise<void> {
  const { error } = await supabase
    .from("songwriter_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw error;
}

// ---------- contributors ----------

export async function getSongwriterContributors(
  supabase: DB,
  docId: UUID
): Promise<SongwriterContributor[]> {
  const { data, error } = await supabase
    .from("songwriter_contributors")
    .select("*")
    .eq("doc_id", docId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as SongwriterContributor[]) ?? [];
}

// Resolves a Block's Songwriter doc (if any) and its contributors in one
// call. Returns [] when the Block has no Songwriter doc yet. General-purpose
// accessor — app/actions/split-sheets.ts is one caller (it seeds a fresh
// split sheet from this roster), but nothing here is shaped around that.
export async function getSongwriterContributorsByBlock(
  supabase: DB,
  blockId: UUID
): Promise<SongwriterContributor[]> {
  const { data: doc, error: docErr } = await supabase
    .from("songwriter_docs")
    .select("id")
    .eq("block_id", blockId)
    .maybeSingle();
  if (docErr) throw docErr;
  if (!doc) return [];
  return getSongwriterContributors(supabase, (doc as { id: UUID }).id);
}

export async function addSongwriterContributor(
  supabase: DB,
  docId: UUID,
  input: { userId?: UUID | null; displayName?: string | null; role: string }
): Promise<SongwriterContributor> {
  const { data, error } = await supabase
    .from("songwriter_contributors")
    .insert({
      doc_id: docId,
      user_id: input.userId ?? null,
      display_name: input.displayName ?? null,
      role: input.role,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SongwriterContributor;
}

export async function updateSongwriterContributorRole(
  supabase: DB,
  contributorId: UUID,
  role: string
): Promise<SongwriterContributor> {
  const { data, error } = await supabase
    .from("songwriter_contributors")
    .update({ role })
    .eq("id", contributorId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SongwriterContributor;
}

export async function removeSongwriterContributor(
  supabase: DB,
  contributorId: UUID
): Promise<void> {
  const { error } = await supabase
    .from("songwriter_contributors")
    .delete()
    .eq("id", contributorId);
  if (error) throw error;
}

// ---------- revisions (read-only; no viewer UI yet) ----------

export async function getSongwriterSectionRevisions(
  supabase: DB,
  sectionId: UUID
): Promise<SongwriterSectionRevision[]> {
  const { data, error } = await supabase
    .from("songwriter_section_revisions")
    .select("*")
    .eq("section_id", sectionId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as SongwriterSectionRevision[]) ?? [];
}
