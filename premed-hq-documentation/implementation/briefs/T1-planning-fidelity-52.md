# T1 · Academics Planning — Variant A fidelity correction

**Stage:** E · frontend fidelity only  
**Date:** 2026-08-27  
**Execution target:** Variant A only  
**Supersedes for this correction:** the unresolved fidelity items in `T1-planning-fidelity-51.md`

## 1. Audit before implementation

### A. Spec → paper

Pass. The ruled Planning information architecture remains two destinations:
**Planner** and **Grades & Archive**. Requirements/catalog are contextual Planner
work, and transcript/GPA/What-if/rollover/grade-decision work is owned by Grades
& Archive. No new product behavior or entity is required by this correction.

### B. Mockup → app

The first Stage-E port established the approved surface ladder and two-tab
structure, but an independent visual audit found three literal Variant A gaps:

| Surface | Approved mockup | Current app before this correction | Result |
|---|---|---|---|
| Grades & Archive with zero transcript records | `transcript-empty`: two-column shell only | Ledger/GPA/What-if chrome, filters, count, empty card, and record tools all render | **Divergent · P0** |
| Planner top control strip | Plan, program/catalog, Add course, Compare, MCAT, Export, overflow | Program/catalog, Export, and overflow omitted; Add term substituted into the strip | **Divergent · P1** |
| Planner context strip | Major, Catalog, Premed path, Prior credit, Interests | Requirement map substituted for Premed path; Interests omitted | **Divergent · P1** |
| Planning type density | compact controls at a `1.42` workspace line height | workspace defaults to looser inherited/`1.45` rhythm | **Divergent · P2** |

Measured literal source values to preserve:

| Property | Planner Variant A | Grades transcript-empty Variant A | App target |
|---|---:|---:|---:|
| Workspace line-height | `1.42` audit target | `1.42` audit target | `1.42` |
| Top bar padding / gap | `10px 24px` / `9px` | n/a | exact |
| Top control radius / padding / type | `9px` / `6px 10px` / `11.5px 800 Baloo 2` | n/a | exact |
| Context padding / gap | `10px 24px` / `7px` | n/a | exact |
| Empty page padding | n/a | `24px` (`14px` narrow) | exact |
| Empty shell width / columns / gap | n/a | `1060px`; `1.35fr .65fr`; `14px` | exact |
| Empty card radius / padding | n/a | `16px` / `17px` | exact |
| Empty title type | n/a | `25px 800 Baloo 2` | exact |
| Narrow shell | n/a | one column at `760px` | exact |
| Paper ladder | `#f7efe1 → #efe6d4 → #fffaf0`, border `#e9e2d5` | same | exact |
| Dark ladder | `#211e1a → #322e28 → #2b2722`, border `#3c352d` | same | exact |

### C. Already built — do not rebuild

Preserve the existing Planner model, course placement, term editing, requirement
drawer, course discovery, local coverage evidence, transcript persistence, grade
ledger calculations, GPA calculations, What-if behavior, reports, grade decisions,
rollover behavior, and migration resolution. This brief changes composition and
styling only.

### D. Gate

Pass. The Planning mockups are authorized `YES` in
`premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`.

### E. Decisions files

Pass. The approved Variant A appearance is recorded in the same-name mockup MD
files. The independent audit is narrower and more current than the stale app
composition, so this correction follows the exact HTML/CSS target.

### F. Integrations and services

No new integration is introduced. The UNC catalog integration remains coded as
a truthful source boundary but is not configured as a live catalog; this remains
a promotion blocker, not a reason to fabricate data.

## 2. The work — Stage E only

### P0 · Grades & Archive zero-record route

- Branch before all ledger chrome when `buildGradeLedger(...).rows.length === 0`.
- Render only the approved `transcript-empty` two-column shell.
- Do not render view tabs, filters/count, export/tools, rollover, reports,
  forecast, grade decisions, GPA, or What-if before the first record exists.
- The primary **Add a transcript record** control opens the existing persisted
  transcript-entry form. It must not seed or invent a record.
- Once the first valid record is saved, the normal Grades & Archive chrome may
  render from the real ledger.

### P1 · Planner controls and context

- Restore the exact control order: current plan; program/catalog; Add course;
  Compare plans; MCAT; spacer; Export for advisor; overflow.
- Export must be functional and local-only, using recorded data with an explicit
  non-official planning boundary.
- Overflow must be functional; put the already-existing Add term and requirement
  map actions there rather than inventing a new destination.
- Restore the exact context fields: Major / program; Catalog + cohort; Premed
  path; Prior credit; Interests.
- Use real recorded values. Where this repository has no persisted value, show
  **Not recorded**; do not add a persisted entity in a fidelity-only brief.
- Context fields that can open the existing requirement map should do so.
  Non-editable missing fields must be visibly unavailable rather than inert.

### P2 · Density

- Apply `line-height: 1.42` to both Planning workspaces.
- Preserve exact Variant A control padding, radii, font size, weight, wrapping,
  and narrow horizontal overflow behavior.

### Migration-review boundary

Do not add a migration banner to either surface. Preserve the shared
`AcademicMigrationReview`; its component already returns `null` when no migration
entry is genuinely pending.

## 3. References — read in full before execution

- `mockup-lab/01-academics/academics-planner-prototype.html`
- `mockup-lab/01-academics/academics-planner-prototype.md`
- `mockup-lab/01-academics/academics-grades-archive.html`
- `mockup-lab/01-academics/academics-grades-archive.md`
- mirrored same-name HTML/MD under
  `premed-hq-documentation/specifications/mockups/01-academics/`
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `premed-hq-documentation/tabs/01-academics.md` §4.2
- `mockup-lab/VARIANT-LAB.md`
- `src/components/academics/PlannerBoard.tsx`
- `src/components/academics/PlanningWorkspace.css`
- `src/components/academics/GradesArchive.tsx`
- `src/components/academics/GradesArchive.css`
- `src/components/academics/TranscriptRecordsPanel.tsx`
- `src/components/academics/AcademicMigrationReview.tsx`

## 4. Do not break

- Do not change Planning entities, grade formulas, migration logic, persistence,
  Daily components, the shared Academics shell, `src/index.css`, or demo seeds.
- Do not render mock rows or sample numbers in an empty store.
- Do not expose a score, readiness composite, rank, or progress bar (U-9).
- Preserve keyboard focus, mobile stacking, both themes, and reload persistence.
- Preserve all unrelated dirty work byte-for-byte.

## 5. Done when

- [x] Zero records renders only the literal two-column transcript-empty shell.
- [x] Add transcript record opens the real entry form and a valid save reveals
      the normal ledger chrome without reload.
- [x] Planner top controls and context match the approved order and labels.
- [x] Export and overflow are functional; no new inert control is introduced.
- [x] Missing context is labeled `Not recorded`; no mock context is fabricated.
- [x] Both stylesheets specify `line-height: 1.42`.
- [ ] Exact paper/dark ladder, geometry, radii, density, and 760px stacking are
      measured in the running app against the standalone mockup. The delegated
      task had no connected visual-browser backend; parent capture is required.
- [x] Scoped tests, TypeScript, and production build pass.
- [x] The six promotion proofs are re-audited; no surface is marked built unless
      all six pass.

### Execution evidence

- Focused ESLint: pass.
- TypeScript project build: pass.
- Focused tests: 4 files / 31 tests pass.
- Production build: pass.
- Control audit: `PLANNING_CONTROL_AUDIT total=65 unresolved=0`.
- Promotion: blocked by missing corrected live visual capture, unconfigured
  catalog integration, data-dependent state proof, and commit provenance.

## 6. Commit

Commit only the correction brief and the exact Planning-scoped component/style
hunks. Unrelated dirty changes remain uncommitted and untouched.

## 7. Next stage — out of scope

Re-run the Planning router. If it reaches F, perform the page promotion audit.
Catalog configuration and commit provenance remain possible terminal blockers;
do not mark a page built without all six proofs.
