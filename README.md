# Premed OS

Andy's personal premed command center — a private, interactive dashboard for UNC
pre-med planning, AMCAS prep, and daily execution. Built per `premed-dashboard-brief.md`
(esp. §15 design direction).

**Stack:** React + TypeScript + Vite · Tailwind v4 · shadcn-style components (Radix) ·
Recharts · dnd-kit · Zustand (+ immer + persist). Single-page app, client-side routing
(HashRouter), data lives in your browser (localStorage) with an optional Google Drive backup.

---

## Run it locally

This machine has a user-local Node at `~/.local/node`. Put it on your PATH first:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
cd "premed-dashboard-project 2/premedos"

npm install        # first time only
npm run dev        # http://localhost:5173  (we used 5179 in dev)
```

## Build & host (needed for Google sign-in)

```bash
npm run build      # outputs static files to dist/
npm run preview    # preview the production build locally
```

Google OAuth does **not** work from a bare `file://` page, so to use Drive backup you
must serve it. Easiest free options: drag `dist/` onto **Netlify Drop**, or push to a repo
and deploy with **Vercel** / **GitHub Pages**. Any static host works — there's no backend.

> Data always lives in your browser's localStorage regardless of hosting. Drive is the
> redundant off-device safety layer. Use **Settings → Export JSON** anytime for a manual copy.

---

## Google Drive backup — one-time OAuth setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → create/select a project.
2. **APIs & Services → Library →** enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen →** External; add yourself as a **Test user**.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.**
   - Under **Authorized JavaScript origins**, add your hosted URL (e.g. `https://your-site.netlify.app`)
     and, for local testing, `http://localhost:5179`.
5. Copy the **Client ID** (`…apps.googleusercontent.com`).
6. In the app: **Settings → Google Drive backup →** paste the Client ID → **Connect Drive**.

The app then: backs up on change (debounced) while open, pushes a fresh backup once per day
on open (≥24h since last), and shows a "last backed up" time. The backup file is stored in
Drive's hidden **appDataFolder** (only this app can see it). **Restore** pulls it back down.

> Honest limit: a static page only runs while open, so it can't back up while fully closed.
> The on-open daily check covers the realistic case; true always-on backup would need a small
> backend (a future add-on — the hook is in `src/lib/googleDrive.ts`).

---

## Swapping in the final ram mascot art

The mascot is currently a hand-drawn **SVG** (`src/components/mascot/Ram.tsx`) — cute, warm,
and emoji-free as a functional placeholder. Per brief §15.5 the final art should be a
commissioned/image-model **Ghibli-adjacent cartoon ram** from your reference pics. To swap:
drop the artwork (e.g. a few PNG poses) into `src/assets/`, then replace the SVG in `Ram.tsx`
with an `<img>` — every mascot slot (`MascotBubble`, `MascotLayer`, home hero, sidebar) reuses
that one component, so it updates everywhere. The per-tab positions live in `src/app/routes.tsx`.

---

## Project map

```
src/
  app/routes.tsx            nav registry (grouped sidebar + per-tab mascot spot)
  lib/                      types, AMCAS GPA engine + selectors, dates, Drive, calendar, export/import
  data/seed.ts              Andy's seeded UNC plan (Appendix A), resources, tips, story prompts
  data/mcatQotd.ts          curated MCAT Question-of-the-Day bank
  store/                    zustand store (localStorage autosave) + backup + theme hooks
  components/ui/            shadcn-style primitives (button, card, dialog, tabs, …)
  components/common/        TrackerTable, Ring, SegmentedBar, Kanban, ResourceGrid, DocEmbed, …
  components/mascot/        the ram + speech bubble + per-tab layer
  components/layout/        Sidebar, Topbar, AlertsStrip, CommandSearch (⌘K), AppShell
  pages/                    Home + 13 pillar deep-views + Help + Settings
```

Press **⌘K / Ctrl+K** anywhere to search every page, course, task, school, and resource.
