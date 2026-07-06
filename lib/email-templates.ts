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

// Signup fields (name, city, country, creator type) are free text a user
// controls — escape before interpolating into HTML so a display name like
// `<img src=x onerror=...>` can't execute in whoever reads the email.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatSignupDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

// Shared layout — plain, email-client-safe inline styles (no external CSS).
// Single-column, max-width card with generous padding: renders correctly at
// any width without media queries, so it's responsive on both desktop and
// mobile mail clients by construction. `extraHtml` is an escape hatch for a
// template that needs more than plain paragraphs (a checklist, a data table)
// without every template having to reimplement the card/header chrome.
// `button` is optional — a template with nothing to link to (e.g. an internal
// notification with no admin dashboard yet) can omit it entirely.
function layout(opts: {
  heading: string;
  lines: string[];
  extraHtml?: string;
  button?: { label: string; href: string };
}): string {
  const paragraphs = opts.lines
    .map(
      (l) =>
        `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3a3a3a;">${l}</p>`
    )
    .join("");
  const button = opts.button
    ? `
    <a href="${opts.button.href}"
       style="display:inline-block;margin-top:12px;padding:11px 20px;background:#161616;color:#ffffff;text-decoration:none;border-radius:10px;font-size:13.5px;font-weight:600;">
      ${opts.button.label}
    </a>`
    : "";
  return `
<div style="background:#f5f5f4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e7e5e4;">
    <p style="margin:0 0 20px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#8b8b8b;">WrytrsBlock</p>
    <h1 style="margin:0 0 16px;font-size:19px;line-height:1.35;color:#161616;">${opts.heading}</h1>
    ${paragraphs}
    ${opts.extraHtml ?? ""}
    ${button}
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
      button: { label: "Open Block", href: blockUrl(input.blockSlug) },
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
      button: { label: "Open Block", href: blockUrl(input.blockSlug, "files") },
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
      button: { label: "Open Block", href: blockUrl(input.blockSlug) },
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
      button: { label: "Open Block", href: blockUrl(input.blockSlug) },
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
      button: { label: "View Split Sheet", href: blockUrl(input.blockSlug, "splits") },
    }),
  };
}

// ---------- Signup ----------

const WELCOME_CHECKLIST = [
  "Complete your profile",
  "Upload demos or portfolio",
  "Explore the Block Market",
  "Connect with creators",
  "Start your first Block",
];

export function welcomeCreatorEmail(input: { name: string }): EmailContent {
  const name = input.name?.trim() || "there";
  const checklistHtml = `
    <div style="margin:4px 0 20px;">
      ${WELCOME_CHECKLIST.map(
        (item) => `
        <p style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#3a3a3a;">
          <span style="color:#16a34a;font-weight:700;">✓</span>&nbsp; ${escapeHtml(item)}
        </p>`
      ).join("")}
    </div>`;
  return {
    subject: "Welcome to WrytrsBlock 👋",
    html: layout({
      heading: `Welcome to WrytrsBlock, ${escapeHtml(name)} 👋`,
      lines: [
        "Thanks for joining — WrytrsBlock is where creators find collaborators and start creative projects together, from a first idea to a finished Block.",
        "A few things to do next:",
      ],
      extraHtml: checklistHtml,
      button: { label: "Open WrytrsBlock", href: `${SITE_URL}/home` },
    }),
  };
}

// Internal notification — not sent to the creator. `totalCreators` and
// `adminDashboardUrl` are both optional since neither is guaranteed to be
// available (the count query can fail without blocking signup, and there's
// no admin dashboard yet); omitting either just drops that row/button rather
// than showing a placeholder.
export function newCreatorAdminEmail(input: {
  fullName: string;
  email: string;
  creatorType: string;
  city: string | null;
  country: string | null;
  signupAt: string;
  totalCreators?: number | null;
  adminDashboardUrl?: string | null;
}): EmailContent {
  const rows: [string, string][] = [
    ["Full name", input.fullName || "—"],
    ["Email", input.email],
    ["Creator type", input.creatorType || "—"],
    ["City", input.city || "—"],
    ["Country", input.country || "—"],
    ["Signed up", formatSignupDateTime(input.signupAt)],
  ];
  if (input.totalCreators != null) {
    rows.push(["Total registered creators", String(input.totalCreators)]);
  }
  const tableHtml = `
    <div style="margin:4px 0 4px;border:1px solid #e7e5e4;border-radius:12px;overflow:hidden;">
      ${rows
        .map(
          ([label, value], i) => `
        <div style="display:flex;justify-content:space-between;gap:16px;padding:10px 14px;${
          i > 0 ? "border-top:1px solid #e7e5e4;" : ""
        }">
          <span style="font-size:12.5px;color:#8b8b8b;">${label}</span>
          <span style="font-size:12.5px;color:#161616;font-weight:600;text-align:right;">${escapeHtml(value)}</span>
        </div>`
        )
        .join("")}
    </div>`;
  return {
    subject: "🎉 New Creator Joined WrytrsBlock",
    html: layout({
      heading: "🎉 New Creator Joined WrytrsBlock",
      lines: [],
      extraHtml: tableHtml,
      button: input.adminDashboardUrl
        ? { label: "Open Admin Dashboard", href: input.adminDashboardUrl }
        : undefined,
    }),
  };
}
