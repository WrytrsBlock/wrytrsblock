# WrytrsBlock

A cinematic, desktop-first **creative collaboration OS** for music, film, and media production. Built with Next.js (App Router) + TypeScript + Tailwind + Supabase.

The core unit is a **Block** — a creative container (an album, a film, an audio drama) holding projects, collaborators, threads, and media.

---

## Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 14 (App Router, RSC, server actions-ready) |
| Language   | TypeScript (strict)                                |
| Styling    | Tailwind CSS with CSS-variable design tokens       |
| Backend    | Supabase (Postgres, Auth, Storage, Realtime)       |
| Deployment | Vercel                                             |

Dark mode is the default; light mode is fully supported through theme tokens.

---

## Architecture

```
app/
  page.tsx           Cinematic marketing landing (signed-out); redirects signed-in → /home
  not-found.tsx      Branded 404
  (auth)/            Public auth surfaces (sign-in, sign-up) + cinematic split layout
  (app)/             Authenticated workspace (route-protected by middleware)
    layout.tsx       Server component: fetches profile + workspaces + blocks, mounts shell + overlays
    loading.tsx      Skeleton shown while app routes stream
    error.tsx        Client error boundary for the workspace
    home/            Dashboard
    blocks/          Block list + [slug] flagship Block Workspace (tabs via ?tab=, + loading skeleton)
    settings/        Account: profile + appearance (server page + client form)
    messages/        Workspace-wide messaging (live channel switching + composer)
    marketplace/     Hire / be hired
    media/           Cross-Block media library
    community/       Creator feed
  actions/           Server actions ("use server"): blocks, projects, messages, media, profile, collaborators
  auth/              Route handlers: /callback (OAuth), /sign-out
components/
  shell/             Sidebar, TopBar, CommandPalette, MobileNav, Notifications
  block/             Block Workspace surface (header, tabs, panels, context rail, presence)
  ui/                Reusable primitives (Button, Card, Badge, Avatar, Progress, Input…)
hooks/               Client hooks: useSupabase, useUser, useRealtimeTable, usePresence, useTheme
services/            Pure data-access functions, one module per domain
types/               Hand-written DB types mirroring the SQL schema
lib/
  supabase/          server / client / middleware Supabase factories
  data.ts            Orchestration layer (services + mock fallback) for server components
  env.ts             Typed env + `supabaseConfigured` flag
  mock.ts            Seed dataset + fallback when Supabase isn't configured
supabase/
  migrations/        0001_init.sql — full schema, RLS, triggers, storage, realtime
  seed.sql           Optional dev seed
  config.toml        Supabase CLI config
```

**Separation of concerns**

- **Services** are framework-agnostic: each takes a Supabase client + args, returns typed rows. Easy to unit-test and reuse from server components, route handlers, or actions.
- **Server actions** (`app/actions/`) are the write path — mutations the UI calls directly. They wrap services, handle the demo-mode no-op, and `revalidatePath`.
- **`lib/data.ts`** is the read path for server components and the only place that decides *Supabase vs. mock*, keeping that branching out of the UI.
- **Components** never call Supabase directly except through hooks (client realtime/presence) or `lib/data` (server reads).

**Working flows today** (both modes — they persist with Supabase, no-op gracefully without):

- **Create Block** — `New` / ⌘K / switcher → dialog → `createBlockAction` (bootstraps a workspace on first use) → lands on the new Block. Demo mode synthesizes a clean workspace from the slug.
- **Add & move tasks** — inline composer per board column → `createProjectAction`; drag cards between columns → `moveProjectAction`.
- **Upload media** — drag-drop / picker → optimistic preview → `uploadMediaAction` (Storage + signed URL).
- **Send message** — Block Threads and workspace Messages composers → optimistic append → `sendMessageAction`; realtime fan-out via `useRealtimeTable` when channel IDs are real.
- **Invite collaborators** — dialog → `inviteCollaboratorAction` (adds a `block_members` row by handle).
- **Edit profile** — Settings → `updateProfileAction`.
- **Switch workspaces** — sidebar dropdown, selection persisted to `localStorage` (ready for `workspace_state`).

**New Blocks feel intentional, not blank.** An `isEstablishedBlock()` check shows tailored empty states (Overview "getting started", empty Board/Docs/Media/Threads) instead of another Block's demo content.

**Polish layer.** ⌘K command palette, topbar notifications popover, mobile drawer, branded 404, error boundary, and loading skeletons.

---

## How the 8 focus areas are addressed

### 1. Authentication flow structure
- `app/(auth)/sign-in` and `/sign-up` with password **and** magic-link flows.
- `app/auth/callback/route.ts` exchanges the OAuth/magic code for a session.
- `app/auth/sign-out/route.ts` clears the session.
- Forms degrade gracefully: with no Supabase env, they bypass to `/home` so the UI is demoable.

### 2. Supabase client setup
- `lib/supabase/server.ts` — server client bound to Next cookies (RSC + route handlers).
- `lib/supabase/client.ts` — browser client.
- `lib/supabase/middleware.ts` — session-refreshing client for `middleware.ts`.
- `hooks/use-supabase.ts` — memoized browser client for components.
- All read `lib/env.ts`, which exposes `supabaseConfigured` so the app runs with or without keys.

### 3. Database schema planning
- `supabase/migrations/0001_init.sql` defines: `profiles`, `workspaces`, `workspace_members`, `blocks`, `block_members`, `projects`, `channels`, `channel_members`, `messages`, `media_assets`, `comments`, `activity_events`, `notifications`, `workspace_state`.
- Enums for roles/statuses, indexes on hot paths, `updated_at` triggers, and signup/creation triggers (auto-profile, auto-owner, auto-lead).
- `types/db.ts` mirrors the schema; swap for `supabase gen types` output in production.

### 4. Protected routes
- `middleware.ts` → `lib/supabase/middleware.ts` redirects unauthenticated users to `/sign-in` (preserving `?next=`), and signed-in users away from auth pages.
- `app/(app)/layout.tsx` re-checks the profile server-side and redirects if absent — defense in depth.
- **Row Level Security** on every table enforces access at the database, gated by `is_workspace_member` / `is_block_member` / `is_channel_member` helpers.

### 5. Persistent Block Workspace state
- `workspace_state` table stores per-user, per-workspace UI state: pinned Blocks, last opened Block, sidebar collapse, theme.
- `services/workspace-state.service.ts` provides `get` / `upsert` (upsert keyed on `(user_id, workspace_id)`).
- Block Workspace tab is encoded in the URL (`?tab=board`) so deep links and back/forward work.

### 6. Realtime collaboration architecture
- `hooks/use-realtime.ts` — generic Postgres-changes subscription (insert/update/delete) for any table + filter.
- `hooks/use-presence.ts` — presence channels (who's online + what they're doing).
- `components/block/live-presence.tsx` — the "Now Active" rail, a client island that joins a Block-scoped presence channel and falls back to a seeded roster offline.
- Migration publishes `messages`, `activity_events`, `notifications`, `projects`, `media_assets`, `comments` to `supabase_realtime`.

### 7. Media upload system structure
- `services/media.service.ts` — upload to the `block-media` Storage bucket, write a `media_assets` row, generate public/signed URLs, delete.
- Storage paths are namespaced `workspace/block/file`; Storage RLS gates access by workspace membership encoded in the path.
- `components/block/media-panel.tsx` provides the dropzone + grid UI.

### 8. Messaging system architecture
- `services/messages.service.ts` — channels (workspace- or Block-scoped), paginated message history, send/edit/delete.
- `channels` + `channel_members` model public/private/DM channels.
- `components/block/threads-panel.tsx` is the in-Block chat; pair with `useRealtimeTable("messages", …, channel_id=eq.X, "INSERT")` for live updates.

---

## Getting started

```bash
cp .env.example .env.local      # add NEXT_PUBLIC_SUPABASE_URL + ANON_KEY (optional for demo)
npm install
npm run dev                     # http://localhost:3000 → /home
```

Without Supabase keys the app renders fully against `lib/mock.ts`. With keys, middleware enforces auth and data flows through the services.

### Provision Supabase

```bash
supabase db push                # or run supabase/migrations/0001_init.sql in the SQL editor
```

Then add `https://<your-domain>/auth/callback` to **Auth → URL Configuration** in the Supabase dashboard.

---

## Design system

Cinematic, restrained, creator-grade — drawing from Linear, Spotify, Apple, and Notion.

- **Tokens** in `app/globals.css` (`--bg`, `--surface`, `--accent`, …) drive both themes; `tailwind.config.ts` maps them to utilities.
- Near-black dark palette with a warm amber primary accent + cool indigo secondary, film-grain overlay, vignettes, and soft elevation.
- Display serif (Instrument Serif) for titles, Inter for UI, JetBrains Mono for metadata.
- Motion: `fade-up` on mount, `pulse-ring` for live presence, eased hover transitions.

Keyboard: **⌘K** command palette · **⌘J** Blocky (AI sidekick, stubbed).
```
