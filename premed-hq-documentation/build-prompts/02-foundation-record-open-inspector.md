# Build Prompt 02 — Foundation Layer 2: record-open model + object inspector

*Handoff prompt for Claude Code / Codex. ONE chunk — the record-interaction centerpiece. Do not build lists/bulk/saved-views (later chunks) beyond the click→open hook.*

---

You are implementing **Premed HQ**. `premed-hq-documentation/` is the single source of truth (`AGENT-IMPLEMENTATION-GUIDE.md` — the docs win).

## Chunk scope

Build the **center-peek record-open model** (peek → expand → split) and the **lean object inspector** that every tab will reuse. This replaces the current right-slide `SidePeek` as the desktop default; `SidePeek` is retained as the mobile sheet.

## Read first

1. `specifications/01-shared-interface-patterns.md` **§2 (2.1–2.5)**, **§3**, §5 (click→peek), §8 (states inside a peek), §13 (resolved: split cap = 2 panes; History deferred).
2. `general.md` — inspector sections, relationships/backlinks ("where is this used").
3. `specifications/00-product-shell.md` §7.7 (breadcrumb for expand routes), `specifications/04-visual-craft-standards.md`.
4. Repo: `src/components/common/SidePeek.tsx`, `src/components/ecs/OrgPeek.tsx`, `src/app/routes.tsx`, one existing record list.

## What to build

1. **`CenterPeek`** — floating card over a **blurred + dimmed** backdrop; `min(920px, 72vw)` × ~`85vh`; rounded, elevated, scrollable body. Top-right cluster: **`Split · Expand · Close`**. Dismiss via backdrop / `Esc` / Close, **guarded when there are unsaved edits**.
2. **Expand** → promote to a **deep-linkable full-page route** (e.g. `/clinical/exp/:id`); breadcrumb `Parent / Record` (shell §7.7); `collapse` returns to the peek.
3. **Split** → dock the open record + the originating list; clicking another list item loads it into the record pane **without closing**; a **Pin** action locks a second object into the opposite pane. **Cap at two panes** (§13.2).
4. **Object inspector** — **always-visible core:** Overview/Details, Relations (with backlinks), Files, Activity, Actions; **progressive (collapsed):** Notes, Data quality; **History deferred** → use Activity (§13.3). Sections are configurable per entity (fields only); a tab may **not** drop a core section.
5. **Responsive** — desktop: peek/expand/split; tablet: split collapses to stacked/tabbed; mobile: peek becomes a **full-screen sheet** (retain `SidePeek`), split → tabs within the sheet.
6. **Keyboard (§2.5)** — `Enter` open, `Esc` close→exit split, `Cmd/Ctrl+\` split, `Cmd/Ctrl+.` expand/collapse, `↑/↓` move through the list in split.

## Out of scope / must NOT

- Do **not** build per-tab inspector *content* beyond a generic configurable shell — tabs fill their fields later.
- Do **not** implement true version history (deferred; Activity is the audit surface).
- Do **not** remove `SidePeek` — it becomes the mobile sheet.
- Do **not** build list presentations, bulk, saved views, or undo here — only the click→peek hook. No new deps/tokens.

## Process

1. **Plan first, stop for approval** — files, spec→code mapping, ambiguities (flag anything about existing peek usages you'd change).
2. Implement; apply craft rules (`04`). `npm run build` must pass.
3. Report vs. acceptance; stop for the next chunk.

## Acceptance criteria

- [ ] Click opens a center peek over a blurred backdrop with `Split · Expand · Close`.
- [ ] Expand routes to a deep-linkable full page; collapse returns; split docks record + list with click-through; Pin locks a second object; never more than two panes.
- [ ] Mobile renders peek as a full-screen sheet; split degrades to tabs.
- [ ] Inspector shows the five core sections; Notes + Data quality progressive; History deferred.
- [ ] Unsaved-changes guard on close; keyboard map works; light/dark, desktop/mobile, reduced-motion verified.
- [ ] `npm run build` passes. Commit: `feat(ui): center-peek record-open model + object inspector (foundation L2)`.
