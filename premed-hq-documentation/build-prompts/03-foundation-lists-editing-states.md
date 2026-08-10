# Build Prompt 03 — Foundation Layer 3: list presentations + inline editing + states

*Handoff prompt for Claude Code / Codex. ONE chunk. Builds on L2 (click→peek). Bulk / saved views / undo / focus mode are the NEXT chunk — not here.*

---

You are implementing **Premed HQ**. `premed-hq-documentation/` is the single source of truth (`AGENT-IMPLEMENTATION-GUIDE.md`).

## Chunk scope

The shared **list-and-edit grammar**: per-shape list presentations, inline autosave editing, in-app-styled controls, layout discipline, and empty/loading/error + toast states. All configured once and reused by every tab.

## Read first

1. `specifications/01-shared-interface-patterns.md` **§4, §4a, §4b (mode switch — first adopter Academics), §5, §5c, §8, §11**.
2. `general.md` — completeness states (Incomplete→Usable→Well documented→Ready for export), in-app controls.
3. `specifications/04-visual-craft-standards.md` §5c/§6/§10 (compact stats, anti-patterns).
4. Repo: `src/components/common/TrackerTable.tsx`, `Kanban.tsx`, `DateField.tsx`, `src/components/ui/select.tsx`, existing list pages (and the Requirements uneven-column case).

## What to build

1. **List presentations by shape (§5):** Table (`TrackerTable`) for structured records; Cards for experiences; Kanban/list for tasks; Timeline for time-ordered. Each tab declares its **default**; offer a table⇄cards switch only where it genuinely helps. All lists share filter→sort→group→render, click→peek (L2), and the same states.
2. **Inline editing + autosave (§4):** edit in place (table cells, inspector Overview); **autosave default** with a quiet Saved/Saving status; unsaved-changes guard on close; continuous validation; character counters on AMCAS-limited fields. No manual Save for routine edits.
3. **In-app controls only (§4a):** every select / date / time picker / menu uses styled Radix components — **no native `<select>` or native date picker** — in both themes.
4. **Layout discipline (§5c):** equal-height siblings, bounded max dimensions with internal scroll / truncate-expand, fit the `max-w-6xl` container, mobile tables → card rows. Fix the Requirements uneven-column protrusion.
5. **States (§8):** `EmptyState` (what belongs + why + first action); skeleton loading per section (no full-page spinner); inline, scoped errors + retry (the rest of the page survives).
6. **Toasts (§11):** create/edit confirm (with Open + Undo), errors, sync events; non-blocking, stackable, screen-reader-polite.

## Out of scope / must NOT

- No bulk bar, saved views, trash/undo-recovery, or focus mode — that's the next chunk.
- Do **not** fork components per tab — configure the shared ones.
- Do **not** add view switches, densities, or controls no domain needs. No new deps/tokens.

## Process

1. **Plan first, stop for approval** — files, spec→code mapping, ambiguities.
2. Implement; craft rules (`04`). `npm run build` must pass.
3. Report vs. acceptance; stop.

## Acceptance criteria

- [ ] Per-shape defaults render; view switch only where declared; all lists share filter/sort/group, selection hook, click→peek, and states.
- [ ] Inline autosave with visible status; unsaved-changes guard; char counters where limits apply.
- [ ] Zero native `<select>` / native date pickers anywhere; all styled, both themes.
- [ ] §5c layout-discipline acceptance holds (no protruding siblings, bounded dimensions, nothing overflows the container).
- [ ] Empty/loading/error everywhere — no blank voids or full-page spinners; toasts carry Open + Undo.
- [ ] Light/dark, desktop/mobile, keyboard-only, reduced-motion verified. `npm run build` passes.
- [ ] Commit: `feat(ui): shared list presentations + inline autosave editing + states (foundation L3)`.
