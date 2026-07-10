import { SITE_URL } from "@/lib/env";

export type EmailContent = { subject: string; html: string };

const LOGO_URL = `${SITE_URL}/brand/wrytrsblock-symbol.png`;

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

// Dark-mode support: inline styles are the default (light) look, which every
// email client renders correctly. The <style> block's `!important` class
// rules are the progressive enhancement — clients that honor
// `prefers-color-scheme` (Apple/iOS Mail, Outlook.com, newer Gmail apps) swap
// to the dark palette; clients that don't just keep the light inline styles.
// This is why every colored element below carries BOTH an inline style and a
// wb-* class rather than one or the other.
const DARK_MODE_STYLE = `
  body, .wb-bg { background:#f5f5f4 !important; }
  .wb-card { background:#ffffff !important; border-color:#e7e5e4 !important; }
  .wb-heading, .wb-value { color:#161616 !important; }
  .wb-text { color:#3a3a3a !important; }
  .wb-muted { color:#8b8b8b !important; }
  .wb-divider { border-top-color:#e7e5e4 !important; }
  .wb-btn { background:#161616 !important; color:#ffffff !important; }
  @media (prefers-color-scheme: dark) {
    body, .wb-bg { background:#0b0b0b !important; }
    .wb-card { background:#171717 !important; border-color:#2b2b2b !important; }
    .wb-heading, .wb-value { color:#f5f5f4 !important; }
    .wb-text { color:#d4d4d4 !important; }
    .wb-muted { color:#9a9a9a !important; }
    .wb-divider { border-top-color:#2b2b2b !important; }
    .wb-btn { background:#f5f5f4 !important; color:#161616 !important; }
  }
`;

// Shared layout — a full HTML document (not just a fragment) so the
// color-scheme meta tags and the dark-mode <style> block above actually take
// effect. Single-column, max-width card with generous padding: responsive by
// construction at any width, no layout media queries needed. `extraHtml` is
// an escape hatch for a template that needs more than plain paragraphs (a
// checklist, a data table) without every template reimplementing the card
// chrome. `button` is optional — a template with nothing to link to (e.g. an
// internal notification with no admin dashboard yet) can omit it entirely.
function layout(opts: {
  heading: string;
  lines: string[];
  extraHtml?: string;
  button?: { label: string; href: string };
}): string {
  const paragraphs = opts.lines
    .map(
      (l) =>
        `<p class="wb-text" style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3a3a3a;">${l}</p>`
    )
    .join("");
  const button = opts.button
    ? `
    <a href="${opts.button.href}"
       class="wb-btn"
       style="display:inline-block;margin-top:12px;padding:11px 20px;background:#161616;color:#ffffff;text-decoration:none;border-radius:10px;font-size:13.5px;font-weight:600;">
      ${opts.button.label}
    </a>`
    : "";
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${opts.heading}</title>
<style>${DARK_MODE_STYLE}</style>
</head>
<body style="margin:0;padding:0;background:#f5f5f4;">
  <div class="wb-bg" style="background:#f5f5f4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div class="wb-card" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e7e5e4;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr>
          <td style="padding-right:8px;vertical-align:middle;">
            <img src="${LOGO_URL}" width="24" height="24" alt="WrytrsBlock"
                 style="display:block;border-radius:6px;" />
          </td>
          <td class="wb-muted" style="vertical-align:middle;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#8b8b8b;">
            WrytrsBlock
          </td>
        </tr>
      </table>
      <h1 class="wb-heading" style="margin:0 0 16px;font-size:19px;line-height:1.35;color:#161616;">${opts.heading}</h1>
      ${paragraphs}
      ${opts.extraHtml ?? ""}
      ${button}
    </div>
  </div>
</body>
</html>`.trim();
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

// A Block Request is addressed to one specific creator, before they've joined
// anything — so unlike the other activity emails, this doesn't go through
// notifyBlockActivity's block-membership fan-out (there's no Block they're a
// member of yet). See lib/notify.ts's emailDirectRecipient.
export function blockRequestEmail(input: {
  requesterName: string;
  blockTitle: string;
  introMessage: string;
}): EmailContent {
  const preview =
    input.introMessage.length > 200
      ? input.introMessage.slice(0, 200) + "…"
      : input.introMessage;
  return {
    subject: `${input.requesterName} sent you a Block Request`,
    html: layout({
      heading: `${input.requesterName} wants to start a Block with you`,
      lines: [
        `<strong>${input.requesterName}</strong> invited you to collaborate on "${escapeHtml(
          input.blockTitle
        )}":`,
        `<em>${escapeHtml(preview)}</em>`,
      ],
      button: { label: "View Request", href: `${SITE_URL}/notifications` },
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
        <p class="wb-text" style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#3a3a3a;">
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

function adminInfoTable(rows: [string, string][]): string {
  return `
    <div class="wb-card" style="margin:4px 0 4px;border:1px solid #e7e5e4;border-radius:12px;overflow:hidden;">
      ${rows
        .map(
          ([label, value], i) => `
        <div class="${i > 0 ? "wb-divider" : ""}" style="display:flex;justify-content:space-between;gap:16px;padding:10px 14px;${
          i > 0 ? "border-top:1px solid #e7e5e4;" : ""
        }">
          <span class="wb-muted" style="font-size:12.5px;color:#8b8b8b;">${label}</span>
          <span class="wb-value" style="font-size:12.5px;color:#161616;font-weight:600;text-align:right;">${escapeHtml(value)}</span>
        </div>`
        )
        .join("")}
    </div>`;
}

// Fires immediately when supabase.auth.signUp() succeeds (see
// app/actions/signup-notify.ts), before onboarding/creator-type/location are
// known — so this intentionally only has name, email, and signup time. The
// fuller newCreatorAdminEmail below fires again once onboarding completes.
export function newSignupAdminEmail(input: {
  fullName: string;
  email: string;
  signupAt: string;
}): EmailContent {
  const tableHtml = adminInfoTable([
    ["Full name", input.fullName || "—"],
    ["Email", input.email],
    ["Signed up", formatSignupDateTime(input.signupAt)],
  ]);
  return {
    subject: "🆕 New Signup on WrytrsBlock",
    html: layout({
      heading: "🆕 New Signup on WrytrsBlock",
      lines: ["Creator type and location aren't known yet — they'll show up in the follow-up email once onboarding is complete."],
      extraHtml: tableHtml,
    }),
  };
}

// Internal notification — not sent to the creator. Fires once onboarding
// completes (full name/creator type/city/country all known by then — see
// app/actions/onboarding.ts's notifyNewCreator). `totalCreators` and
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
  return {
    subject: "🎉 New Creator Joined WrytrsBlock",
    html: layout({
      heading: "🎉 New Creator Joined WrytrsBlock",
      lines: [],
      extraHtml: adminInfoTable(rows),
      button: input.adminDashboardUrl
        ? { label: "Open Admin Dashboard", href: input.adminDashboardUrl }
        : undefined,
    }),
  };
}

// 24h automated follow-up — sent once, by app/api/cron/follow-up-emails, to
// every creator whose profile turned a day old without a second visit.
const FIRST_BLOCK_STEPS = [
  "Add or update your profile photo",
  "Browse the Block Market",
  "Start your first Block with another creator",
];

export function firstBlockFollowUpEmail(input: { name: string }): EmailContent {
  const firstName = input.name?.trim().split(/\s+/)[0] || "there";
  const stepsHtml = `
    <div style="margin:4px 0 4px;">
      ${FIRST_BLOCK_STEPS.map(
        (step, i) => `
        <p class="wb-text" style="margin:0 0 10px;font-size:14px;line-height:1.5;color:#3a3a3a;">
          <span class="wb-heading" style="color:#161616;font-weight:700;">${i + 1}.</span>&nbsp; ${escapeHtml(step)}
        </p>`
      ).join("")}
    </div>
    <p class="wb-text" style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#3a3a3a;">
      WrytrsBlock is built to help creators find each other, collaborate, and actually finish projects.
    </p>`;
  return {
    subject: "Ready to start your first Block?",
    html: layout({
      heading: "Ready to start your first Block?",
      lines: [
        `Hey ${escapeHtml(firstName)},`,
        "You joined WrytrsBlock yesterday — now it's time to start connecting.",
        "Here are 3 things to do next:",
      ],
      extraHtml: stepsHtml,
      button: { label: "Open WrytrsBlock", href: `${SITE_URL}/home` },
    }),
  };
}
