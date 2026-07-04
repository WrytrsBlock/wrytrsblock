import { SITE_URL } from "@/lib/env";

export type EmailContent = { subject: string; html: string };

export function blockUrl(slug: string, tab?: "files" | "splits"): string {
  return `${SITE_URL}/blocks/${slug}${tab ? `?tab=${tab}` : ""}`;
}

function fmtDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Shared layout — plain, email-client-safe inline styles (no external CSS).
function layout(opts: {
  heading: string;
  lines: string[];
  buttonLabel: string;
  buttonHref: string;
}): string {
  const paragraphs = opts.lines
    .map(
      (l) =>
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3a3a3a;">${l}</p>`
    )
    .join("");
  return `
<div style="background:#f5f5f4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e7e5e4;">
    <p style="margin:0 0 20px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#8b8b8b;">WrytrsBlock</p>
    <h1 style="margin:0 0 16px;font-size:19px;line-height:1.35;color:#161616;">${opts.heading}</h1>
    ${paragraphs}
    <a href="${opts.buttonHref}"
       style="display:inline-block;margin-top:12px;padding:11px 20px;background:#161616;color:#ffffff;text-decoration:none;border-radius:10px;font-size:13.5px;font-weight:600;">
      ${opts.buttonLabel}
    </a>
  </div>
</div>`.trim();
}

export function chatMessageEmail(input: {
  senderName: string;
  blockTitle: string;
  messageBody: string;
  blockSlug: string;
}): EmailContent {
  const preview =
    input.messageBody.length > 150
      ? input.messageBody.slice(0, 150) + "…"
      : input.messageBody;
  return {
    subject: `New message in "${input.blockTitle}"`,
    html: layout({
      heading: `New message in "${input.blockTitle}"`,
      lines: [
        `<strong>${input.senderName}</strong> sent a message:`,
        `<em>${preview}</em>`,
      ],
      buttonLabel: "Open Block",
      buttonHref: blockUrl(input.blockSlug),
    }),
  };
}

export function fileUploadEmail(input: {
  uploaderName: string;
  blockTitle: string;
  fileName: string;
  fileType?: string;
  blockSlug: string;
}): EmailContent {
  return {
    subject: `New file uploaded in "${input.blockTitle}"`,
    html: layout({
      heading: `New file uploaded in "${input.blockTitle}"`,
      lines: [
        `<strong>${input.uploaderName}</strong> uploaded a file:`,
        `${input.fileName}${input.fileType ? ` (${input.fileType})` : ""}`,
      ],
      buttonLabel: "Open Block",
      buttonHref: blockUrl(input.blockSlug, "files"),
    }),
  };
}

export function voiceNoteEmail(input: {
  senderName: string;
  blockTitle: string;
  durationSeconds: number;
  blockSlug: string;
}): EmailContent {
  return {
    subject: `New voice note in "${input.blockTitle}"`,
    html: layout({
      heading: `New voice note in "${input.blockTitle}"`,
      lines: [
        `<strong>${input.senderName}</strong> sent a voice note (${fmtDuration(
          input.durationSeconds
        )}).`,
      ],
      buttonLabel: "Open Block",
      buttonHref: blockUrl(input.blockSlug),
    }),
  };
}

export function blockJoinEmail(input: {
  creatorName: string;
  blockTitle: string;
  blockSlug: string;
}): EmailContent {
  return {
    subject: `${input.creatorName} joined your Block`,
    html: layout({
      heading: `${input.creatorName} joined your Block`,
      lines: [
        `<strong>${input.creatorName}</strong> just joined "${input.blockTitle}".`,
      ],
      buttonLabel: "Open Block",
      buttonHref: blockUrl(input.blockSlug),
    }),
  };
}

export function splitSheetEmail(input: {
  blockTitle: string;
  changedByName: string;
  blockSlug: string;
}): EmailContent {
  return {
    subject: `Split Sheet Updated`,
    html: layout({
      heading: `Split Sheet Updated`,
      lines: [
        `<strong>${input.changedByName}</strong> updated the Split Sheet for "${input.blockTitle}".`,
      ],
      buttonLabel: "View Split Sheet",
      buttonHref: blockUrl(input.blockSlug, "splits"),
    }),
  };
}
