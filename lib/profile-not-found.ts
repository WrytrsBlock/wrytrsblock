import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Checks whether a published creator profile exists for `handle`, using a
// direct PostgREST fetch (Edge-runtime safe — no supabase-js client, which
// pulls in Node APIs unsupported in Middleware). Mirrors the same lookup the
// real page uses (services/creator-profiles.service.ts's
// getCreatorProfileByHandle: case-insensitive) plus the "is_published" half
// of the "creator_profiles read published" RLS policy — the anon-visible
// half, since this check only ever runs for anonymous requests (see
// lib/supabase/middleware.ts).
export async function creatorHandleExists(handle: string): Promise<boolean> {
  const url = `${SUPABASE_URL}/rest/v1/creator_profiles?handle=ilike.${encodeURIComponent(
    handle
  )}&is_published=eq.true&select=id&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    // Never let a slow Supabase response hold up the page load — fail open
    // (treat as "exists") so a network hiccup can't wrongly 404 a real
    // profile; worst case it falls back to the pre-existing (already
    // present) soft-404 behavior for that one request.
    signal: AbortSignal.timeout(2000),
  });
  if (!res.ok) return true;
  const rows = (await res.json()) as unknown[];
  return rows.length > 0;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// A minimal, on-brand 404 response for a creator handle that doesn't exist
// (or isn't published). Built by hand rather than rendered by the app's own
// not-found.tsx: notFound() called from app/(app)/profile/[handle]/page.tsx
// never sets a real 404 status here — app/(app)/loading.tsx's Suspense
// boundary means Next.js has already streamed a 200 status by the time the
// not-found content resolves (confirmed via isolated testing to be a Next.js
// 14 streaming limitation, not something fixable from the page or
// generateMetadata layer). Short-circuiting in Middleware, before any of
// that rendering starts, is the only way to get a correct status code
// without touching loading.tsx (which the rest of the app depends on) or
// restructuring routes (which would break the signed-in shell for this page).
export function notFoundResponse(handle: string): Response {
  const safeHandle = escapeHtml(handle);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Creator not found | WrytrsBlock</title>
<meta name="robots" content="noindex, follow">
<style>
  body { margin:0; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; background:#07080D; color:#f4f5f7; font-family:-apple-system,"Segoe UI",Inter,ui-sans-serif,system-ui,sans-serif; text-align:center; padding:24px; }
  h1 { font-size:28px; margin:0; }
  p { margin:0; color:#9aa0b2; max-width:44ch; line-height:1.5; }
  a { color:#fff; background:#3548c7; text-decoration:none; padding:10px 20px; border-radius:10px; font-weight:600; font-size:14px; margin-top:6px; }
</style>
</head>
<body>
  <h1>Creator not found</h1>
  <p>“${safeHandle}” isn't a WrytrsBlock creator — the profile may have been renamed, unpublished, or never existed.</p>
  <a href="/marketplace">Browse the Block Market</a>
</body>
</html>`;
  return new Response(html, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // This response bypasses Next's rendering pipeline (returned directly
      // from Middleware), so it doesn't pick up next.config.mjs's headers()
      // — set the baseline security headers directly instead.
      "x-content-type-options": "nosniff",
      "x-frame-options": "SAMEORIGIN",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  });
}
