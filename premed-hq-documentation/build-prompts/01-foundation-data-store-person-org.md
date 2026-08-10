# Build Prompt 01 — Foundation Layer 1: data-model alignment + Person/Organization (Phase 1)

*Handoff prompt for Claude Code / Codex. Paste the block below. This is ONE chunk — do not run ahead into shell/tabs.*

---

You are implementing **Premed HQ**. The `premed-hq-documentation/` folder is the single source of truth (`AGENT-IMPLEMENTATION-GUIDE.md` — read it first; the docs win over your priors).

## Chunk scope

Foundation Layer 1 — **align the store to the written data model and stand up canonical `Person` and `Organization` as Phase-1 (non-breaking) linked records.** No shell changes, no tab rebuilds, no Phase-2 backfill. This is plumbing plus one small linking control.

## Read first

1. `implementation/data-model.md` — the whole file, especially **§2 persistence, §3 envelope, §4.4 experiences, §5 relationships, §9 migration, §10 canonical-entity evolution (RESOLVED, phased)**.
2. `general.md` — Global entity system, **Deduplication** (never auto-merge; reversible, show confidence), "capture once, reuse everywhere."
3. `specifications/01-shared-interface-patterns.md` **§4a** (in-app styled controls only — no native widgets) and `specifications/04-visual-craft-standards.md` (tokens only, states, a11y).
4. Repo, before writing anything: `src/lib/types.ts`, `src/store/store.ts`, `src/data/seed.ts`, `src/lib/selectors.ts`, and whatever currently renders experience supervisor/org and letter recommender fields (experience pages/tables, `src/components/ecs/*`, `src/components/common/TrackerTable.tsx`, letters page).

## What to build

1. **New entities in `types.ts`** — `Person` and `Organization`, each with the **full target envelope** (`id`, `createdAt`, `updatedAt`, `archived`, optional `ownerId`/`deletedAt`/`source`) plus `order` for CRUD compatibility.
   - `Person`: `name` (required), optional `email`, `phone`, `role`/`title`, `organizationId?` (a person can belong to an org), `tags?`, `notes`.
   - `Organization`: `name` (required), optional `type` (hospital/clinic/lab/nonprofit/club/school/other), `location`, `website`, `notes`.
2. **Wire the collections** — add `persons` and `organizations` to `AppData`, to `DATA_KEYS`, and to `CollectionKey`; seed both as `[]` in `src/data/seed.ts`. Generic CRUD (`addItem`/`patchItem`/`removeItem`/`reorderItems`) must work on them unchanged.
3. **Optional reference fields alongside existing strings (do NOT remove the strings)** — additive only:
   - `ExperienceEntry`: add `organizationId?: ID` (links `org`) and `supervisorId?: ID` (links `supervisor`/`contact` → a `Person`).
   - `LetterEntry`: add `recommenderId?: ID` (→ `Person`).
   - `Org`: add `verifierId?: ID` (→ `Person`, links the `verifier*` fields).
   - `ClassContact`: add `personId?: ID` (→ `Person`) — optional/lower priority.
4. **Dedup util** — `findPersonMatches(name, persons)` and `findOrganizationMatches(name, orgs)` returning likely matches by normalized name (trim/lowercase/inclusion). Pure functions; **never auto-merge** — they only surface candidates.
5. **Shared "link existing or create new" control** — one reusable, in-app-styled combobox (Radix, matching the design system — `01` §4a) used on **at least the experience supervisor + organization fields** this chunk. Typing shows dedup matches; selecting sets the id link and keeps the display string in sync; a "Create '<name>'" option makes a new `Person`/`Organization` and links it. Keyboard-accessible, both themes.

## Migration

Purely **additive** — `persons`/`organizations` appear via the existing seed-defaults `merge` path; new optional link fields need no migrate function (`data-model.md` §9 rule 1). **No destructive change, no version-breaking reshape, no data loss.** Signed-out/local mode must stay fully functional.

## Out of scope / must NOT

- **No Phase-2 backfill** — do not sweep existing free-text strings into entities yet.
- **Do not merge** the existing EC `Org` entity into `Organization` (that reconciliation is a later chunk). Name the canonical entity `Organization`, distinct from `Org`.
- Do not stop writing or remove the existing string fields — they remain the fallback/display.
- Do not touch the shell, tabs, other foundation layers, tokens, fonts, or add dependencies.
- Do not backfill `createdAt`/`ownerId` onto pre-existing entities (envelope backfill order is still open — `data-model.md` §14.2).

## Process

1. Produce a **short plan first** — files you'll add/change, the spec-section→code mapping, and any ambiguity — and **stop for approval before coding** (`AGENT-IMPLEMENTATION-GUIDE` §3). Flag naming choices (`supervisorId` vs `supervisorPersonId`, etc.) in the plan.
2. Implement to spec; apply the global craft rules (`04`).
3. `npm run build` must pass (typecheck clean) before you're done.
4. Report against the acceptance criteria below; then stop for the next chunk.

## Acceptance criteria (definition of done)

- [ ] `Person` + `Organization` interfaces exist with the full envelope; `persons`/`organizations` are in `AppData`, `DATA_KEYS`, `CollectionKey`; seeded as `[]`; generic CRUD works on both.
- [ ] Optional `organizationId`/`supervisorId` (ExperienceEntry), `recommenderId` (LetterEntry), `verifierId` (Org) added alongside — not replacing — the existing string fields.
- [ ] Dedup utils return name matches and never auto-merge.
- [ ] The shared in-app "link existing or create new" control renders on the experience supervisor + organization fields; type→match→link and create-new→link both work, keyboard-accessible, in light + dark.
- [ ] Additive migration only; existing data intact; signed-out/local mode fully functional.
- [ ] `npm run build` passes.
- [ ] Commit: `feat(data): add Person/Organization entities + Phase-1 linking (foundation L1)`.
