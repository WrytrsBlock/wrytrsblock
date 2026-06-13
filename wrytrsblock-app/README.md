# WrytrsBlock

A music collaboration platform under the **CR8TV Collectv** brand. WrytrsBlock connects independent artists, producers, songwriters, vocalists, and engineers — structuring the music creation process from idea to release.

The core feature is the **Block**: a creative space that can be a collaborative session *or* a listing for selling beats, sample packs, and services.

This repository is a single-page React app built with Vite.

---

## Running it locally

You need [Node.js](https://nodejs.org) installed (version 18 or newer).

```bash
# 1. install dependencies
npm install

# 2. start the dev server
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173`).

To build a production version:

```bash
npm run build      # output goes to /dist
npm run preview    # preview the production build locally
```

---

## Project structure

```
wrytrsblock/
├─ index.html            # HTML entry point
├─ package.json          # dependencies + scripts
├─ vite.config.js        # Vite + React config
├─ src/
│  ├─ main.jsx           # React entry point
│  ├─ WrytrsBlock.jsx    # the entire app (single-file component)
│  └─ index.css          # global styles
└─ .gitignore
```

The whole app lives in `src/WrytrsBlock.jsx`. It is intentionally a single file.

---

## Current state

This is an **MVP prototype**. It runs entirely in the browser with no backend:

- Data lives in React state — refreshing the page resets everything
- No real authentication, accounts, or persistence
- Messages, file sharing, and purchases are not connected to a server
- Demo artists and one demo Block are seeded so the flow can be explored immediately

It is built for **testing the core experience and showing the product**, not for production use.

### Implemented

- Onboarding (sign up, role selection, photo, demos)
- Block Market — discover collaborators
- Two Block types: **Session** (collaboration) and **Listing** (selling)
- Block detail — collaborators, split sheet, session chat, file sharing
- Invite flow, ratings, profiles

---

## Next steps toward production

1. Add a backend (Supabase or Firebase) for auth + persistence
2. Wire real messaging between users
3. Real file storage for stems/demos
4. Payments for Listing Blocks
5. Native build (React Native) for App Store / Play Store

---

## Deploying

This app deploys cleanly to [Vercel](https://vercel.com):

1. Push this repo to GitHub (see below)
2. Import the repo on Vercel
3. Vercel auto-detects Vite — no config needed
4. Each push to `main` redeploys automatically

---

## Pushing this to GitHub

From inside this folder:

```bash
git init
git add .
git commit -m "Initial commit — WrytrsBlock MVP prototype"
git branch -M main
```

Then create an empty repository on GitHub (no README, no .gitignore — this repo
already has them), copy its URL, and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/wrytrsblock.git
git push -u origin main
```

Done — your project is on GitHub.
