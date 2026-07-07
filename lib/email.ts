import { Resend } from "resend";
import { RESEND_API_KEY, RESEND_FROM_EMAIL, resendConfigured } from "@/lib/env";

const resend = resendConfigured ? new Resend(RESEND_API_KEY) : null;

// Thin, fail-safe Resend wrapper. Every activity (chat, upload, voice note,
// join, split sheet) must succeed regardless of email delivery — callers
// never need a try/catch of their own; failures are logged and swallowed
// here. Without RESEND_API_KEY set, this just logs instead of sending, so the
// app runs the same before and after a key is added.
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean }> {
  if (!resend) {
    console.log(`[email] not configured — would send "${input.subject}" (recipient redacted)`);
    return { ok: false };
  }
  try {
    const { error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (error) {
      console.error("[email] send failed:", error);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[email] send threw:", e);
    return { ok: false };
  }
}
