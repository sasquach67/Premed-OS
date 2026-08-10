# Build Prompt 04 — Foundation Layer 4: bulk, undo/trash, saved views, focus mode

*Handoff prompt for Claude Code / Codex. ONE chunk. Builds on L2/L3. The "safety nets" that make the data grammar trustworthy.*

---

You are implementing **Premed HQ**. `premed-hq-documentation/` is the single source of truth (`AGENT-IMPLEMENTATION-GUIDE.md`).

## Chunk scope

Bulk operations, undo/recovery with soft-delete/trash, saved views + density modes, and the reusable focus mode.

## Read first

1. `specifications/01-shared-interface-patterns.md` **§6, §7, §9, §10**, and **§13 resolved decisions** (density = Comfortable+Compact only; split cap = 2; History deferred; view-switch persistence per-list).
2. `general.md` — undo/recovery, saved views, bulk operations, dependency awareness.
3. `implementation/data-model.md` §3 (soft-delete / `deletedAt` target) and §9 (additive migration rules).
4. `specifications/00-product-shell.md` §7.1 / §8.3 (focus routes outside the shell; persistence). Repo: the MCAT session route (`/mcat/session`) as the focus-mode precedent.

## What to build

1. **Bulk operations (§6):** multi-select in any list → **bulk action bar**; v1 actions where compatible: archive, restore, add tag, change status, assign term, link organization, export, delete. Operate on canonical entities; undoable where feasible; destructive actions confirm and **show what's affected** (dependency awareness).
2. **Undo / recovery (§7):** immediate **undo toast** for create/complete/archive/move/bulk; **trash/recovery via soft-delete** — add `deletedAt` per data-model §3 (additive migration, §9); permanent deletion is a **separate explicit** action; before destructive/structural changes show dependents + offer reassign/archive/cancel.
3. **Saved views + density (§9):** persist filters, sort, grouping, visible columns, density, date range, and any view switch **per list** (§13.4), per-user, restorable. Ship **Comfortable + Compact only** — Visual deferred (§13.1).
4. **Focus mode (§10):** generalize the MCAT-session pattern into a **reusable distraction-reduced route** (renders outside the shell) that hides nav/analytics, preserves autosave, and always provides an exit back to the owning page. Wire the reusable route + apply to MCAT (exists); essay drafting and long study blocks are candidate adopters, not required here.

## Out of scope / must NOT

- Do **not** build true version history (deferred, §13.3 — Activity remains the audit surface).
- Do **not** add a third density mode. Do **not** hard-delete without trash. Do **not** trap a focus route (always an exit).
- No new deps/tokens; no per-tab forks.

## Process

1. **Plan first, stop for approval.** 2. Implement; craft rules (`04`); `npm run build` passes. 3. Report vs. acceptance; stop.

## Acceptance criteria

- [ ] Bulk bar with the v1 actions; destructive actions confirm + preview dependencies; undoable where feasible.
- [ ] Soft-delete + trash/recovery works (additive `deletedAt` migration, no data loss); permanent delete is separate.
- [ ] Saved views persist per-list, per-user, restorable; exactly two density modes.
- [ ] Reusable focus route with a guaranteed exit; MCAT session uses it.
- [ ] Light/dark, desktop/mobile, keyboard-only, reduced-motion verified. `npm run build` passes.
- [ ] Commit: `feat(ui): bulk ops, trash/undo, saved views + density, focus mode (foundation L4)`.
