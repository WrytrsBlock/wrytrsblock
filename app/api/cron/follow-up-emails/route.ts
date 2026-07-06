import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { CRON_SECRET } from "@/lib/env";
import { claimDueFollowUpCreators } from "@/services/creator-profiles.service";
import { sendEmail } from "@/lib/email";
import { firstBlockFollowUpEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

// Vercel Cron hits this once daily (see vercel.json) — Vercel's Hobby plan
// caps cron jobs at one run per day, so daily is the schedule that works
// regardless of plan tier. That means a creator's actual send time can land
// anywhere in the 24-48h window after publish, not exactly at 24h. If this
// project is on a Vercel Pro plan (which allows more frequent schedules),
// tightening vercel.json's schedule to hourly ("0 * * * *") gets much closer
// to a true 24h mark — the claim query itself (`created_at <= now() - 24h`)
// already only looks for creators who are AT LEAST 24h in, so this route's
// logic doesn't need to change either way, only the schedule.
//
// claimDueFollowUpCreators() atomically marks each due creator's
// follow_up_sent_at *before* we attempt to email them (see that function's
// comment for why this is race-safe under overlapping cron runs). That
// ordering is a deliberate tradeoff: "never sends twice" is the hard
// requirement here, so a row is claimed up front; if sendEmail then fails
// for that creator, they will not be retried on the next run. sendEmail()
// itself never throws (logs and returns {ok:false}), and every per-creator
// step below is additionally wrapped so one failure can't stop the batch —
// this route always returns 200 with a summary, never a mid-batch crash.
export async function GET(request: Request) {
  if (CRON_SECRET) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    console.log("[cron/follow-up-emails] service role not configured — skipping");
    return NextResponse.json({ ok: true, claimed: 0, sent: 0 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let claimed: Awaited<ReturnType<typeof claimDueFollowUpCreators>>;
  try {
    claimed = await claimDueFollowUpCreators(supabase, cutoff);
  } catch (e) {
    console.error("[cron/follow-up-emails] claim query failed:", e);
    return NextResponse.json({ ok: false, error: "Claim query failed" }, { status: 500 });
  }

  let sent = 0;
  for (const creator of claimed) {
    try {
      const { data } = await supabase.auth.admin.getUserById(creator.id);
      const address = data.user?.email;
      if (!address) continue;

      const email = firstBlockFollowUpEmail({ name: creator.display_name ?? "" });
      const result = await sendEmail({ to: address, subject: email.subject, html: email.html });
      if (result.ok) sent++;
    } catch (e) {
      console.error("[cron/follow-up-emails] send failed for", creator.id, e);
    }
  }

  return NextResponse.json({ ok: true, claimed: claimed.length, sent });
}
