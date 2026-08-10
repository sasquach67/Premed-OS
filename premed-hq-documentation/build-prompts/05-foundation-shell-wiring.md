# Build Prompt 05 — Foundation Layer 5: shell wiring

*Handoff prompt for Claude Code / Codex. ONE chunk (may sub-commit per §7 area). This is the visible frame — builds on L1 (store), L2 (peek), L3 (forms).*

---

You are implementing **Premed HQ**. `premed-hq-documentation/` is the single source of truth (`AGENT-IMPLEMENTATION-GUIDE.md`).

## Chunk scope

Bring the shell to the finalized spec: nav registry to the final IA, real Quick Add creation, command-palette actions, the attention bell (deadlines feed first), the top-bar composition, the account popup + help launcher, a single mascot, and the Atlas placeholder.

## Read first

1. `specifications/00-product-shell.md` — **all of §2, §6, §7, §8, §13, and §14 resolved decisions**.
2. `implementation/data-model.md` — the store actions Quick Add writes through (no parallel write paths).
3. `specifications/01-shared-interface-patterns.md` §2 (peek) + §4 (forms) — Quick Add and palette reuse these.
4. `general.md` — quick add, search/command palette, review queue/attention. `specifications/04-visual-craft-standards.md`.
5. Repo: `src/app/routes.tsx`, `src/components/layout/*` (AppShell, Sidebar, Topbar, CommandSearch, AlertsStrip, MoreMenu), `src/components/mascot/MascotLayer.tsx`.

## What to build (may sub-commit per area)

1. **Nav registry → final IA (§2.1):** groups/order exactly — Home · Foundation · Experiences · Application (incl. Timeline & Tasks) · Atlas. **No Profile group** — Settings, Help, and **Profile / CV are popup-only** (§14.7). `routes.tsx` stays the single registry driving sidebar/top-bar/palette.
2. **Sidebar (§7.2):** keep mechanics; replace the janky 500ms width animation with the **transform-based hover pop-out (~220ms)**; footer **account popup** (Profile & CV · Settings · Upgrade plan → paywall · Patch Notes · Notifications · sign-out); global **"?" help + feedback launcher** (replaces the Help tab).
3. **Quick Add (§7.4):** a real creation dialog (Task, Course, Assignment, Hour log, Experience, MCAT mistake, School, Story, Note) that **writes through existing store actions**; context-sensitive defaults; toast with **Open + Undo**; opens from the top-bar **+**, the `q` key, and palette actions; fully keyboard-operable; does not navigate.
4. **Command palette actions (§7.3):** add the **Actions** group (new task/course/log hours/new experience/school/story, find overdue, find incomplete, toggle appearance/sidebar), ranked above nav for verb queries; record hits open the owning page **and** its inspector; recency ranking; opens <100ms at 5,000 records.
5. **Attention bell (§7.5):** new top-bar bell. **Start with the deadlines feed** (existing `upcomingAlerts`); leave the **data-health + system feeds as a pluggable interface** the intelligence chunk (L6) fills. Demote `AlertsStrip` to overdue/due-today; `LiveStatusChip` reads the unified model.
6. **Rest of the shell:** top-bar composition (§7.6), one-level deep-route breadcrumb (§7.7), **Atlas entry + `/atlas/*` placeholder page only** (§7.8, §14.2), **one shell-level mascot — remove page-level duplicates** (§14.4), theme (§7.9).

## Out of scope / must NOT

- **No Atlas knowledge graph / Assistant / Import** — sidebar entry + restrained "Coming soon" placeholder only.
- Do **not** build the bell's data-health/system feeds yet — interface only; L6 fills them.
- Do **not** duplicate Quick Add forms inside tabs; no per-tab top bars; no badges for totals. No new deps/tokens.

## Process

1. **Plan first, stop for approval** — files, the §7 area order you'll sub-commit in, ambiguities. 2. Implement; craft rules (`04`); `npm run build` passes. 3. Report vs. acceptance; stop.

## Acceptance criteria (00 §13)

- [ ] Sidebar matches §2.1 exactly; no Profile or "Your Story" groups; `routes.tsx` remains the single registry.
- [ ] Quick Add creates real records via existing store actions with Open + Undo and does **not** navigate; works keyboard-only.
- [ ] Palette Actions rank above nav for verbs; record hits open page + inspector; opens <100ms at 5k records.
- [ ] Bell counts blocking+important, opens popover/sheet with per-item "why" + primary action (deadlines feed live); AlertsStrip shows only overdue/due-today; StatusChip reads the unified model.
- [ ] Atlas renders only the placeholder; one mascot instance; focus routes render outside the shell with an exit.
- [ ] Light/dark, desktop/mobile, keyboard-only, reduced-motion verified. `npm run build` passes.
- [ ] Commit: `feat(shell): finalized IA nav + Quick Add + palette actions + attention bell + account popup (foundation L5)`.
