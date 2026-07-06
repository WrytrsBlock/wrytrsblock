"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/env";
import { getBlockBySlug } from "@/services/blocks.service";
import { getProfiles } from "@/services/profiles.service";
import {
  getMediaAssetById,
  getSignedMediaUrl,
  uploadMedia,
} from "@/services/media.service";
import {
  addSongwriterComment,
  addSongwriterContributor,
  addSongwriterLoopMarker,
  addSongwriterSection,
  ensureSongwriterDoc,
  getSongwriterComments,
  getSongwriterContributors,
  getSongwriterLoopMarkers,
  getSongwriterSections,
  removeSongwriterComment,
  removeSongwriterContributor,
  removeSongwriterLoopMarker,
  removeSongwriterSection,
  resolveSongwriterComment,
  updateSongwriterContributorRole,
  updateSongwriterDoc,
  updateSongwriterSection,
  type SongwriterDocPatch,
} from "@/services/songwriter.service";
import type {
  SongwriterSectionKind,
  SongwriterStatus,
} from "@/types";

export type SongwriterResult = { ok: true } | { ok: false; error: string };

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong.";
}

const avatarFor = (id: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${id}&backgroundColor=transparent`;

export type SongwriterSectionView = {
  id: string;
  kind: SongwriterSectionKind;
  label: string | null;
  lyrics: string;
  position: number;
};

export type SongwriterLoopMarkerView = {
  id: string;
  name: string;
  startSeconds: number;
  endSeconds: number;
};

export type SongwriterCommentView = {
  id: string;
  sectionId: string;
  parentCommentId: string | null;
  lineIndex: number;
  quotedText: string | null;
  body: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type SongwriterContributorView = {
  id: string;
  userId: string | null;
  displayName: string;
  avatar: string;
  role: string;
};

export type SongwriterView = {
  docId: string;
  blockTitle: string;
  status: SongwriterStatus;
  bpm: number | null;
  key: string | null;
  genre: string | null;
  instrumentalUrl: string | null;
  instrumentalName: string | null;
  sections: SongwriterSectionView[];
  loopMarkers: SongwriterLoopMarkerView[];
  comments: SongwriterCommentView[];
  contributors: SongwriterContributorView[];
};

export async function getSongwriterDataAction(
  blockSlug: string
): Promise<SongwriterView | null> {
  if (!supabaseConfigured) return null;
  try {
    const supabase = createSupabaseServerClient();
    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return null;

    const doc = await ensureSongwriterDoc(supabase, block.id);

    // The instrumental lookup only depends on `doc`, same as the other four
    // fetches — running it inside the same Promise.all instead of after it
    // overlaps its latency with theirs instead of adding it serially on top,
    // on a path that runs on every load and every realtime-triggered refresh.
    const [sections, loopMarkers, comments, contributors, instrumental] = await Promise.all([
      getSongwriterSections(supabase, doc.id),
      getSongwriterLoopMarkers(supabase, doc.id),
      getSongwriterComments(supabase, doc.id),
      getSongwriterContributors(supabase, doc.id),
      (async () => {
        if (!doc.instrumental_id) return null;
        const asset = await getMediaAssetById(supabase, doc.instrumental_id);
        if (!asset) return null;
        const url = await getSignedMediaUrl(supabase, asset.storage_path);
        return { url, name: asset.name };
      })(),
    ]);

    const instrumentalUrl = instrumental?.url ?? null;
    const instrumentalName = instrumental?.name ?? null;

    const authorIds = [
      ...new Set(comments.map((c) => c.author_id).filter((id): id is string => !!id)),
    ];
    const contributorUserIds = [
      ...new Set(
        contributors.map((c) => c.user_id).filter((id): id is string => !!id)
      ),
    ];
    const profileIds = [...new Set([...authorIds, ...contributorUserIds])];
    const profiles = profileIds.length ? await getProfiles(supabase, profileIds) : [];
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    return {
      docId: doc.id,
      blockTitle: block.title,
      status: doc.status,
      bpm: doc.bpm,
      key: doc.key,
      genre: doc.genre ?? (block.tags?.[0] ?? null),
      instrumentalUrl,
      instrumentalName,
      sections: sections.map((s) => ({
        id: s.id,
        kind: s.kind,
        label: s.label,
        lyrics: s.lyrics,
        position: s.position,
      })),
      loopMarkers: loopMarkers.map((m) => ({
        id: m.id,
        name: m.name,
        startSeconds: Number(m.start_seconds),
        endSeconds: Number(m.end_seconds),
      })),
      comments: comments.map((c) => {
        const profile = c.author_id ? profileMap.get(c.author_id) : undefined;
        return {
          id: c.id,
          sectionId: c.section_id,
          parentCommentId: c.parent_comment_id,
          lineIndex: c.line_index,
          quotedText: c.quoted_text,
          body: c.body,
          authorId: c.author_id,
          authorName: profile?.display_name || profile?.handle || "Member",
          authorAvatar: profile?.avatar_url || avatarFor(c.author_id ?? c.id),
          resolved: c.resolved,
          resolvedBy: c.resolved_by,
          resolvedAt: c.resolved_at,
          createdAt: c.created_at,
        };
      }),
      contributors: contributors.map((c) => {
        const profile = c.user_id ? profileMap.get(c.user_id) : undefined;
        const displayName =
          profile?.display_name || c.display_name || profile?.handle || "Contributor";
        return {
          id: c.id,
          userId: c.user_id,
          displayName,
          avatar: profile?.avatar_url || avatarFor(c.user_id ?? c.id),
          role: c.role,
        };
      }),
    };
  } catch (e) {
    console.error("getSongwriterDataAction failed:", e);
    return null;
  }
}

export async function updateSongwriterMetaAction(
  blockSlug: string,
  docId: string,
  patch: SongwriterDocPatch
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await updateSongwriterDoc(supabase, docId, patch);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export type AttachInstrumentalResult =
  | { ok: true; url: string | null; name: string }
  | { ok: false; error: string };

export async function attachInstrumentalAction(
  blockSlug: string,
  docId: string,
  formData: FormData
): Promise<AttachInstrumentalResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file received." };
  }
  if (!supabaseConfigured) {
    return { ok: true, url: null, name: file.name };
  }
  try {
    const supabase = createSupabaseServerClient();
    const block = await getBlockBySlug(supabase, blockSlug);
    if (!block) return { ok: false, error: "Block not found." };

    const asset = await uploadMedia(supabase, {
      workspace_id: block.workspace_id,
      block_id: block.id,
      file,
      kind: "audio",
    });
    await updateSongwriterDoc(supabase, docId, { instrumental_id: asset.id });
    // Deliberately not deleting whatever the doc's previous instrumental_id
    // pointed at: it stays block_id-scoped to this Block (so it's still
    // visible/manageable from the Files tab), and silently deleting a
    // collaborator's uploaded audio as a side effect of someone else
    // attaching a replacement would be a surprising destructive action to
    // take without explicit confirmation — same bias as removeInstrumentalAction
    // below, which detaches without deleting for the same reason.
    const url = await getSignedMediaUrl(supabase, asset.storage_path);
    return { ok: true, url, name: asset.name };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function removeInstrumentalAction(
  blockSlug: string,
  docId: string
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await updateSongwriterDoc(supabase, docId, { instrumental_id: null });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function addSongwriterSectionAction(
  blockSlug: string,
  docId: string,
  kind: SongwriterSectionKind,
  label?: string | null
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await addSongwriterSection(supabase, docId, kind, label ?? null);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function updateSongwriterSectionLyricsAction(
  blockSlug: string,
  sectionId: string,
  lyrics: string
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await updateSongwriterSection(supabase, sectionId, { lyrics });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function renameSongwriterSectionAction(
  blockSlug: string,
  sectionId: string,
  label: string
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await updateSongwriterSection(supabase, sectionId, { label });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function reorderSongwriterSectionAction(
  blockSlug: string,
  sectionId: string,
  newPosition: number
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await updateSongwriterSection(supabase, sectionId, { position: newPosition });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function removeSongwriterSectionAction(
  blockSlug: string,
  sectionId: string
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await removeSongwriterSection(supabase, sectionId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function addSongwriterLoopMarkerAction(
  blockSlug: string,
  docId: string,
  name: string,
  startSeconds: number,
  endSeconds: number
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await addSongwriterLoopMarker(supabase, docId, name, startSeconds, endSeconds);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function removeSongwriterLoopMarkerAction(
  blockSlug: string,
  markerId: string
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await removeSongwriterLoopMarker(supabase, markerId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function addSongwriterCommentAction(
  blockSlug: string,
  input: {
    docId: string;
    sectionId: string;
    parentCommentId?: string | null;
    lineIndex: number;
    quotedText?: string | null;
    body: string;
  }
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await addSongwriterComment(supabase, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function resolveSongwriterCommentAction(
  blockSlug: string,
  commentId: string,
  resolved: boolean
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await resolveSongwriterComment(supabase, commentId, resolved, user?.id ?? null);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function removeSongwriterCommentAction(
  blockSlug: string,
  commentId: string
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await removeSongwriterComment(supabase, commentId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function addSongwriterContributorAction(
  blockSlug: string,
  docId: string,
  input: { userId?: string | null; displayName?: string | null; role: string }
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await addSongwriterContributor(supabase, docId, input);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function updateSongwriterContributorRoleAction(
  blockSlug: string,
  contributorId: string,
  role: string
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await updateSongwriterContributorRole(supabase, contributorId, role);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

export async function removeSongwriterContributorAction(
  blockSlug: string,
  contributorId: string
): Promise<SongwriterResult> {
  if (!supabaseConfigured) return { ok: true };
  try {
    const supabase = createSupabaseServerClient();
    await removeSongwriterContributor(supabase, contributorId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
