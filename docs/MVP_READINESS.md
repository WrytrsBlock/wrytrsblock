# WrytrsBlock — MVP Readiness Report

_Phase 6 cleanup complete. Generated after wiring the production MVP (Phases 1–6)._

## TL;DR

The MVP core — **creator profiles, marketplace, blocks + membership, invitations, and direct messaging** — is **code-complete and database-backed**, with **no mock data substituted in production**. The remaining work before public testing is **operational** (apply + live-test the new migrations) and a few **feature gaps** (payments, notifications surface, per-Block content persistence).

**Status legend:** ✅ DB-backed & wired · 🟡 wired, needs live-Supabase test · ⚪ not built / mock

---

## 1. Mock/demo data removed from the production path

The app runs in two modes via `supabaseConfigured`. Cleanup guarantee: **when Supabase is configured, no mock data is ever substituted** — every read hits the DB and renders honest empty states when there's no data. `lib/mock.ts` is now strictly a **local-dev seed** used only when Supabase is unconfigured.

Fixed in `lib/data.ts`:
- `getBlocks()` — removed the `rows.length === 0 → mockBlocks`, the `mockBlocks[0]` row-mapping fallback, and the `catch → mockBlocks`. Real mode now maps rows via `blockRowToView()` (clean synthesized base, empty content arrays) and returns `[]` when empty.
- `getBlock()` — removed the mock-find + mock-spread fallback. Real mode returns the mapped row or an honest **404** (`null`).
- `getCurrentProfile()` — error fallback no longer returns a mock person (`null`).
- `blockRowToView()` overrides `leadId`/`team`/`service.providerId` so no mock person ids leak into a real Block.

Confirmed remaining `@/lib/mock` imports on the production path are **type-only** (`import type …`) or **dev-seed-gated** behind `!supabaseConfigured`. The sidebar and command palette are prop-driven (real `getBlocks`).

---

## 2. Subsystem status

| Surface | Status | Source of truth |
|---|---|---|
| Authentication | ✅ | Supabase Auth (sign-up/in, callback, sign-out, middleware) |
| Onboarding → creator profile | ✅ | `completeOnboardingAction` → `profiles` + `creator_profiles` |
| Marketplace discovery | ✅ | `getCreators()` ← `creator_profiles` (no mock) |
| Creator profile page | ✅ | `getCreator()` ← `creator_profiles` |
| Save creator | ✅ | `saved_creators` + `toggleSaveCreatorAction` |
| Start Block (collab/service/party) | ✅ | `createBlockAction` → `blocks` + `block_members` (lead) |
| Invite collaborator | ✅ | `inviteCollaboratorAction` → `block_members` (invited) |
| Accept / decline invite | ✅ | `respondToInvitationAction` + `InvitationBanner` |
| View Block members | ✅ | `getBlockMembers()` ← `block_members` (+ status badges) |
| Direct messaging | ✅ | `conversations`/`direct_messages` + `get_or_create_dm` RPC + realtime |
| Block content (board/files/splits/service/deliverables) | 🟡 | empty in real mode; some actions wired, full persistence not verified |
| Notifications | ⚪ | table/service/realtime exist; **page still mock** |
| Payments / paid entry / paid services | ⚪ | UI only, no charging |
| Reviews → Block Score | ⚪ | score is static; no `reviews` table |

---

## 3. Creator categories — ✅ verified

`CREATOR_TYPES` (lib/onboarding.ts) and the marketplace filter include all required categories:
**Producer · Rapper · Singer · Songwriter · Engineer · Videographer · Influencer** (plus Musician, DJ, Photographer, Graphic Designer, Manager, Record Label, Filmmaker, Screenwriter, Podcaster, Other). Verified rendering in the marketplace filter bar.

## 4. Block types — ✅ verified

`BlockType = "collaboration" | "service" | "block_party"` end-to-end: create flow, `block_type` enum (+ `block_party` via 0004), header badge, tabs, and cards. **Collaboration Block · Service Block · Block Party** all persist.

---

## 5. End-to-end MVP validation matrix

All nine steps are **wired and DB-backed in code** (✅). 🟡 marks "needs a live Supabase run to fully confirm" — the preview environment has no Supabase, so I validated via `tsc`, code review, and the demo flow.

| # | Flow step | Code status | How it's wired | Live-test |
|---|---|---|---|---|
| 1 | Signup | ✅ | `sign-up/form.tsx` → `supabase.auth.signUp` → `/auth/callback` → `/onboarding` | 🟡 |
| 2 | Onboarding | ✅ | 8-step flow → `completeOnboardingAction` | 🟡 |
| 3 | Creator profile creation | ✅ | upsert `creator_profiles`; profile page reads DB | 🟡 |
| 4 | Marketplace discovery | ✅ | `getCreators()` ← `creator_profiles` | 🟡 |
| 5 | Save creator | ✅ | `toggleSaveCreatorAction` → `saved_creators` | 🟡 |
| 6 | Start Block | ✅ | `createBlockAction` → `blocks` + lead member | 🟡 |
| 7 | Invite collaborator | ✅ | `inviteCollaboratorAction` → `block_members` invited | 🟡 |
| 8 | Accept invitation | ✅ | `respondToInvitationAction` | 🟡 |
| 9 | Direct messaging | ✅ | `get_or_create_dm` + `direct_messages` + realtime | 🟡 |

Verification performed: `tsc --noEmit` clean; demo walkthroughs (marketplace 4-action cards, Team roster, DM inbox, Message→DM `?to=`); no console errors.

---

## 6. Blockers before public testing

### P0 — must clear first
1. **Apply + smoke-test migrations `0006`, `0007`, `0008`** on the live Supabase project. I authored them but have not run them against your DB. Verify tables, RLS, the `get_or_create_dm`/`is_conversation_member` functions, and the `direct_messages` realtime publication.
2. **Validate `supabase/seed.sql`** — the `auth.users` insert pattern can vary by GoTrue version; confirm it runs, or create demo creators via the dashboard.
3. **Run the live E2E** (steps 1–9 above) signed-in with two accounts (to test invite accept + DM both directions).
4. **Disable demo fallback in prod** — ensure `NEXT_PUBLIC_SUPABASE_*` are set in the deploy so `supabaseConfigured` is true (otherwise the app serves the dev seed).

### P1 — needed for a credible public test
5. **Payments** (deferred by request) — paid entry/services don't charge; Stripe Connect + checkout + webhooks.
6. **Notifications surface** — wire the page to the existing `notifications` table/realtime (currently mock).
7. **Per-Block content persistence** — board tasks, files, split sheets, service details, deliverables render empty in real mode; finish their create/read paths.
8. **Profile "Blocks" tab** — still mock-derived; query `block_members` for blocks a creator belongs to.
9. **Username uniqueness** — onboarding `creator_profiles` upsert can silently fail on a handle collision; add a uniqueness check + UX.
10. **Auth hardening** — password reset, email-verification UX, optional Google/Apple OAuth, rate limiting.
11. **Tests + CI** — at minimum: Vitest for `lib/` (block-match, onboarding), a Playwright smoke for signup→onboarding→create-block, GitHub Actions running `typecheck`.

### P2 — fast-follow
12. Reviews → real Block Score inputs.
13. My Blocks card lead avatar/score (mock lookups → empty in real mode; cosmetic).
14. Profile **Save**/**Hire** buttons (still local/demo; marketplace Save is real).
15. Remove `getWorkspacesForSwitcher` dead code.

---

## Recommended path to public beta
**P0 (1–2 days):** apply migrations, run live E2E, fix anything the live run surfaces, set prod env. → invite-only alpha.
**P1 (1–2 weeks):** payments + notifications + per-Block content + auth hardening + a thin test suite. → public beta.
