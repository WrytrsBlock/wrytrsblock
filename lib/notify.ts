import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import type { EmailContent } from "@/lib/email-templates";
import type { DB } from "@/services/types";

// One choke point for every Block-activity notification (in-app + email).
// Adding a new activity type later means: one entry in SETTINGS_COLUMN, one
// email template, and a call to notifyBlockActivity — nothing else here
// changes.
export type ActivityKind =
  | "message"
  | "upload"
  | "voice_note"
  | "block_member_joined"
  | "split_sheet_updated"
  | "block_request";

const SETTINGS_COLUMN: Record<ActivityKind, string> = {
  message: "email_chat_messages",
  upload: "email_file_uploads",
  voice_note: "email_voice_notes",
  block_member_joined: "email_block_members",
  split_sheet_updated: "email_split_updates",
  block_request: "email_block_requests",
};

// A block_viewers heartbeat older than this is treated as "not actively
// viewing" (see hooks/use-presence.ts for the write side).
const VIEW_STALE_MS = 45_000;

type SettingsRow = {
  user_id: string;
  email_notifications_enabled: boolean;
  [column: string]: boolean | string;
};

type ViewerRow = { user_id: string; last_seen_at: string };

// Insert a notifications row (bell + realtime) for every other accepted
// member of the Block, via the generic SECURITY DEFINER RPC — runs as the
// calling user, who must already be an accepted member (enforced in SQL).
// Returns the recipient ids so the caller can decide who also gets an email.
export async function fanOutInAppNotification(
  authedSupabase: DB,
  input: {
    blockId: string;
    kind: ActivityKind;
    title: string;
    body: string;
    link?: string;
  }
): Promise<string[]> {
  try {
    const { data, error } = await authedSupabase.rpc("fan_out_block_notification", {
      p_block_id: input.blockId,
      p_kind: input.kind,
      p_title: input.title,
      p_body: input.body,
      p_link: input.link ?? null,
    });
    if (error) {
      console.error("[notify] fan-out failed:", error);
      return [];
    }
    return (data as string[] | null) ?? [];
  } catch (e) {
    console.error("[notify] fan-out threw:", e);
    return [];
  }
}

// For each recipient, skip the email if they're actively viewing the Block
// right now, or if they've turned this activity type (or all email) off.
// Everyone else gets it. Never throws — email is a side effect, not the
// activity itself.
export async function emailQualifiedRecipients(
  recipientIds: string[],
  input: { blockId: string; kind: ActivityKind; buildEmail: () => EmailContent }
): Promise<void> {
  if (recipientIds.length === 0) return;
  const service = createSupabaseServiceClient();
  if (!service) return; // no service-role key configured — in-app only for now

  try {
    const column = SETTINGS_COLUMN[input.kind];

    const [{ data: settingsRows }, { data: viewerRows }] = await Promise.all([
      service
        .from("notification_settings")
        .select(`user_id, email_notifications_enabled, ${column}`)
        .in("user_id", recipientIds) as unknown as Promise<{ data: SettingsRow[] | null }>,
      service
        .from("block_viewers")
        .select("user_id, last_seen_at")
        .eq("block_id", input.blockId)
        .in("user_id", recipientIds) as unknown as Promise<{ data: ViewerRow[] | null }>,
    ]);

    const settingsByUser = new Map((settingsRows ?? []).map((r) => [r.user_id, r]));
    const now = Date.now();
    const activeViewers = new Set(
      (viewerRows ?? [])
        .filter((r) => now - new Date(r.last_seen_at).getTime() < VIEW_STALE_MS)
        .map((r) => r.user_id)
    );

    const toEmail = recipientIds.filter((id) => {
      if (activeViewers.has(id)) return false;
      const s = settingsByUser.get(id);
      if (!s) return true; // no row (shouldn't happen — seeded on signup): default on
      if (s.email_notifications_enabled === false) return false;
      if (s[column] === false) return false;
      return true;
    });
    if (toEmail.length === 0) return;

    const email = input.buildEmail();

    await Promise.all(
      toEmail.map(async (id) => {
        try {
          const { data } = await service.auth.admin.getUserById(id);
          const address = data.user?.email;
          if (!address) return;
          await sendEmail({ to: address, subject: email.subject, html: email.html });
        } catch (e) {
          console.error("[notify] per-recipient email failed:", id, e);
        }
      })
    );
  } catch (e) {
    console.error("[notify] emailQualifiedRecipients threw:", e);
  }
}

// For a notification addressed to one specific person who isn't (yet) a
// Block member — a Block Request — so the block_viewers active-viewer
// suppression in emailQualifiedRecipients doesn't apply (they have no access
// to view the Block before accepting). Just checks their notification_settings
// row for this activity kind and sends directly. Never throws.
export async function emailDirectRecipient(
  recipientId: string,
  input: { kind: ActivityKind; buildEmail: () => EmailContent }
): Promise<void> {
  const service = createSupabaseServiceClient();
  if (!service) return; // no service-role key configured — in-app only for now

  try {
    const column = SETTINGS_COLUMN[input.kind];
    const { data: settings } = (await service
      .from("notification_settings")
      .select(`email_notifications_enabled, ${column}`)
      .eq("user_id", recipientId)
      .maybeSingle()) as unknown as { data: SettingsRow | null };

    if (settings) {
      if (settings.email_notifications_enabled === false) return;
      if (settings[column] === false) return;
    } // no row (shouldn't happen — seeded on signup): default on

    const { data } = await service.auth.admin.getUserById(recipientId);
    const address = data.user?.email;
    if (!address) return;

    const email = input.buildEmail();
    await sendEmail({ to: address, subject: email.subject, html: email.html });
  } catch (e) {
    console.error("[notify] emailDirectRecipient failed:", e);
  }
}

// Convenience for the common case: fan out in-app, then email the same
// recipient set. Chat, uploads, voice notes, and split-sheet updates all use
// this. (Block-join is the one exception — its in-app notification is
// inserted inside the accept_block_request RPC itself, so it only needs
// emailQualifiedRecipients directly.)
export async function notifyBlockActivity(
  authedSupabase: DB,
  input: {
    blockId: string;
    kind: ActivityKind;
    title: string;
    body: string;
    link?: string;
    buildEmail: () => EmailContent;
  }
): Promise<void> {
  const recipientIds = await fanOutInAppNotification(authedSupabase, input);
  await emailQualifiedRecipients(recipientIds, {
    blockId: input.blockId,
    kind: input.kind,
    buildEmail: input.buildEmail,
  });
}
