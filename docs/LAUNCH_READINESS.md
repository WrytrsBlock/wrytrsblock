# WrytrsBlock — Launch-Readiness Audit (P0)

**Status: BLOCKED — awaiting live run.** The P0 checklist (apply migrations, seed,
two accounts, E2E) must run against a live Supabase database. This assistant's
sandbox has **no Supabase CLI, no psql, no credentials, and no `.env`** — and
account creation/signup is something the assistant will not perform. Run the
runbook below in your terminal, paste the outputs, and the report table gets
filled in.

Legend: ✅ Pass · ❌ Fail · ⚠️ Warning · ⛔ Blocked (not yet executed)

---

## A. Static readiness (verified now — no DB needed)

| Check | Status | Evidence |
|---|---|---|
| `tsc --noEmit` clean | ✅ | full project type-checks |
| Migrations authored 0001–0008 | ✅ | `supabase/migrations/` |
| No mock substitution in prod path | ✅ | `lib/data.ts` real-mode returns DB or empty (Phase 6) |
| Creator categories present | ✅ | Producer/Rapper/Singer/Songwriter/Engineer/Videographer/Influencer |
| Block types present | ✅ | collaboration / service / block_party |
| All 9 flow steps wired in code | ✅ | actions + services + data layer |

## B. Live E2E (run the runbook, then fill in)

| # | Step | Status | Notes |
|---|---|---|---|
| 0 | Migrations apply cleanly (0001–0008) | ⛔ | |
| 0b | RLS + functions (`get_or_create_dm`, `is_*`) exist | ⛔ | |
| 0c | `direct_messages` in realtime publication | ⛔ | |
| 1 | Seed runs (`seed.sql`) → 6 demo creators | ⛔ | |
| 2 | Two accounts exist (you signup + a demo login) | ⛔ | signup = your action |
| 3 | Onboarding persists → `creator_profiles` row | ⛔ | |
| 4 | Marketplace shows real creators | ⛔ | |
| 5 | Save creator → `saved_creators` row | ⛔ | |
| 6 | Start Block → `blocks` + lead `block_members` | ⛔ | |
| 7 | Invite creator → `invited` `block_members` | ⛔ | |
| 8 | Accept invite → status `accepted` | ⛔ | |
| 9 | Direct message → `direct_messages` + realtime | ⛔ | |

---

## Runbook (run in YOUR terminal)

> Recommended: use **local Supabase** (Docker) — full reset is safe and it
> applies migrations + seed in one shot. Don't `db reset` a cloud project.

### 1. Boot local Supabase + apply migrations + seed
```bash
cd "/Users/product/Desktop/My Work/wrytrsblock"
supabase --version   # install if missing: brew install supabase/tap/supabase
supabase start                 # boots local Postgres + Auth (Docker)
supabase db reset              # applies 0001..0008 + runs supabase/seed.sql
supabase migration list        # CHECK 0: local == remote, all applied
```
Capture: the tail of `db reset` (no errors) and `migration list`.

### 2. Verify schema objects (CHECK 0b/0c/1)
```bash
DBURL="$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '\"')"
psql "$DBURL" -c "select tablename from pg_tables where schemaname='public' and tablename in
  ('creator_profiles','saved_creators','block_members','conversations','conversation_members','direct_messages');"
psql "$DBURL" -c "select proname from pg_proc where proname in ('get_or_create_dm','is_conversation_member','is_block_member');"
psql "$DBURL" -c "select tablename from pg_publication_tables where pubname='supabase_realtime' and tablename='direct_messages';"
psql "$DBURL" -c "select handle, display_name, creator_types from public.creator_profiles order by block_score desc;"
```
Capture: each result (expect 6 tables, 3 functions, 1 publication row, 6 creators).

### 3. Point the app at local Supabase
```bash
supabase status        # copy API URL + anon key
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase status>
EOF
npm run dev            # app now runs in REAL mode
```

### 4. Run the E2E in the browser (http://localhost:3000)
- **Step 1–3 Signup + Onboarding:** /sign-up → complete the 8-step onboarding → ENTER.
  Verify: `psql "$DBURL" -c "select handle, creator_types, country from public.creator_profiles where handle='<your-handle>';"`
- **Step 4 Marketplace:** /marketplace shows the 6 demo creators (+ you). Filter by Producer/Singer/etc.
- **Step 5 Save:** Save a creator → `select * from public.saved_creators;`
- **Step 6 Start Block:** open a creator (e.g. @dexmara) → Start Block → publish.
  `select id, slug, block_type from public.blocks order by created_at desc limit 1;`
  `select user_id, role, status from public.block_members where block_id='<id>';`  (expect you=lead/accepted, dex=collaborator/invited)
- **Step 7–8 Invite/Accept:** log in as the invited demo creator (`dex@demo.wrytrsblock.dev` / `wrytrs-demo`) in a second browser/incognito → open the Block → **Accept** the banner.
  `select status from public.block_members where user_id='<dex-id>';`  (expect accepted)
- **Step 9 Direct message:** from the marketplace, Message a creator → send.
  `select sender_id, body from public.direct_messages order by created_at desc limit 5;`
  Confirm the message appears live in the other account's window (realtime).

### 5. Paste back
Paste the `migration list`, the four `psql` verification outputs, and a one-line
pass/fail for each browser step. I'll finalize the table above into
**Pass / Fail / Warnings / Remaining blockers**.

---

## Known warnings to watch for during the run
- ⚠️ `seed.sql` `auth.users` insert can vary by GoTrue version — if it errors,
  create the demo creators via the dashboard instead.
- ⚠️ `is_block_member` returns true for `invited` rows, so an invited user can
  read the Block before accepting (acceptable for MVP; note it).
- ⚠️ Username uniqueness isn't enforced in onboarding — a duplicate handle makes
  the `creator_profiles` upsert fail silently.
- ⚠️ Use a **local or staging** project — `seed.sql` Part A creates demo auth
  users and must not run against production.
