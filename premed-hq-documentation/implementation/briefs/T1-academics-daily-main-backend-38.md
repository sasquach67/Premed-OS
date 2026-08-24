# T1 · Academics — Daily Class Center promotion-proof data boundary

**Stage:** D · BACKEND MISSING
**Scope:** Establish the missing promotion evidence for the Daily · Class
Center page after the card-fidelity commit. This is a persistence and
empty-workspace pass only. It must not change the approved card composition,
restyle a surface, or promote the page.

## 1. Step-1 audit

### A. Spec → paper

**Pass.** The Daily Class Center has a manifest-cleared, decided owner for its
record collection, its honest zero-class recovery, the card/preview/overflow
handoff, and responsive Cards/List presentation:

- `mockup-lab/01-academics/academics-daily-main-page.{html,md}`;
- `premed-hq-documentation/tabs/01-academics.md` §4.0–§4.1; and
- the Aug. 23, 2026 later-app-annotations section in the Daily decision
  record, which overrides the older sample-card composition.

No ruled Daily Class Center behaviour lacks a paper surface. Stage A passes.

### B. Mockup → app

`src/components/academics/ClassCenter.tsx` owns the live page. The just-landed
`9b16cfc` pass translates Cards view into fixed equal 206px/198px record
cells, with a student-entered letter standing only, factual class context,
honest no-date copy, and Preview plus overflow. It deliberately leaves the
existing List view alone.

Measured in the running app on Aug. 23, 2026, the populated **demo** route
`#/academics?tab=class-center` renders five `.academics-class-card` records.
The source and the prior fidelity pass establish the current dark card ladder:

| surface | approved mockup value | running app value |
| --- | --- | --- |
| page field → card | `#211e1a` → `#322e28` | `rgb(33, 30, 26)` → `rgb(50, 46, 40)` |
| card edge | `#3c352d` | `rgb(60, 53, 45)` |
| card geometry | 13px radius; 12px padding; 206px desktop row | 13px; 12px; 206px cards grid |

The live demo confirms the populated visual target, but it is **not proof** of
the personal first-run boundary. It is explicitly labelled “Demo data.”

### C. Already built — preserve, do not rebuild

- `9b16cfc` — approved Daily card hierarchy and equal footprint.
- `589bf0e` — the Daily owner decision repair; this is the current appearance
  authority.
- `4fe210f` — original Academics inert-control sweep; it repaired genuine
  controls and documented the legitimate trigger exceptions.
- `324e4f3` / `src/data/personalInitialData.ts` — real first-run data is
  record-free; `src/data/demoSeed.ts` is isolated behind the explicit demo
  namespace.
- Existing card open, Preview, overflow, context menu, archive, import,
  keyboard, drag/reorder, and class-Hub routes.

### D. Manifest gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-daily-main-page.html` **YES**. Backend proof work is
permitted. It does not authorize a redesign of the bento, Class Hub, or
Assignments.

### E. Decision record

**Pass.** `academics-daily-main-page.md` records both behaviour and appearance,
including Cards/List purpose, equal footprint, card information hierarchy,
absence recovery, solid ladder, hover/focus, and narrow reflow.

### F. Integrations and services

No external integration belongs to this record surface. It reads the local,
persisted Academics store. Google Calendar and syllabus import can enrich
nearby records but are not prerequisites for rendering a class card or its
honest empty state.

## 2. Why this lands at Stage D

Stages A, B, and the recent E pass. The page cannot yet reach F because
promotion conditions **2–4 lack fresh, surface-level proof**:

1. The browser inspection used a populated demo namespace, so it did not
   exercise the real record-free first run or prove that no demo facts survive
   an empty personal store.
2. The current focused card test proves only `Preview` and no-date content.
   It does not exercise the Daily dashboard's persisted card/list view state,
   nor every rendered card menu/context control.
3. `createInitialDataForMode(false)` is correctly tested as record-free, and
   `ClassCenterDashboard` has an `activeClasses.length === 0` branch. The two
   pieces are not yet tested **together**, so an accidental future fallback to
   `createSeedData()` could produce a believable, populated page rather than
   the drawn recovery state.

Per `PAGE-PROMOTION-PROMPT.md`, a failure or missing proof for conditions 2,
3, or 4 returns the page to **D · BACKEND**. This brief adds the proof and
guards the data boundary; it does not claim that reading source code is enough
to promote the page.

## 3. Work — promotion-grade data proof only

### 3.1 Add an honest personal-empty Class Center integration test

Add a focused test beside the current Class Center tests using the repository's
real React/store setup.

1. Start from `createInitialDataForMode(false)`, not `createSeedData()`.
2. Hydrate/replace the actual store with that personal state, render the Daily
   Class Center dashboard, and assert the page offers the decided setup
   recovery (primary **Import syllabus**, quiet manual-class alternative).
3. Assert that no course code, course title, assignment, topic count, score,
   percentage, class card, or other demo fixture appears. In particular, no
   `BIOL 252`, `CHEM 262`, `Andy Quach`, `5 active`, or seeded deadline may
   survive.
4. Use the page's own accessible controls to prove the primary recovery route
   targets the class-owned scoped syllabus-import flow. Do not fake a successful
   file parse.

The test must render the screen through its real state boundary, not merely
call `createPersonalInitialData()` and inspect the returned object.

### 3.2 Prove persisted Daily view and a changed course fact across hydration

Use the real Zustand persist/hydration seam or the repository's existing store
snapshot helper. Test two actual Daily behaviours:

1. switch Cards → List, reload/re-hydrate, and verify the URL-backed view
   remains List; and
2. change one existing course-owned fact through the store path that the Daily
   page reads (for example archive/restore or a letter standing), rehydrate,
   and prove the resulting dashboard has the changed record and not a seeded
   replacement.

Do not add a second storage key, a page-local cache, or a migration. Existing
`hq:app-data`/demo namespace separation is deliberate and must remain intact.

### 3.3 Re-run and capture the complete control audit

Reproduce the `4fe210f` audit for this surface after the card refactor:

- enumerate every `Button`, `DropdownMenuItem`, and `ContextMenuItem` that can
  render in the Daily Class Center (including Preview, overflow items, card
  context menu, Cards/List toggle, empty-state actions, and deliberate
  disabled controls);
- assert each has `onClick`, `onSelect`, or intentional `asChild` routing; and
- test the Card-specific controls that are not wrapped by a Link: Preview,
  Import syllabus, Review from menu/context, Edit, Archive/Restore, and Delete.

The audit output must state **zero unexplained controls**. A deliberate
disabled control needs its visible reason in code; do not hide an inert action
by styling it away.

### 3.4 Required verification after the tests

1. In a **new personal-mode browser profile or disposable test namespace**,
   load Daily Class Center with no persisted records and capture the exact
   empty screen. Do not clear Andy's real browser storage.
2. In explicit Demo data mode, confirm the populated card collection still
   uses only demo namespace records and retains the Demo data marker.
3. Run focused tests, the full suite, production build, and `git diff --check`.

## 4. Do not break

- Do not touch `ClassCard` DOM, colour treatment, height, Copy, or card visual
  classes from `9b16cfc`; a visual change belongs to a later fidelity brief.
- Do not alter `mockup-lab/variant-lab.html`, the Daily owner `.md`,
  `BUILD-MANIFEST.md`, or any page status in this pass.
- Do not seed real mode, inspect a user's browser local storage, clear Andy's
  existing data, or weaken the demo namespace stamp.
- Preserve all unrelated briefs, Flashcards V1 specification edits, and
  `output/` worktree content.
- U-9/U-13 remain binding: no student score/rank/composite and no inferred
  readiness facts may appear just to populate an empty-state test.

## 5. Done when

- [ ] A rendered real-mode empty dashboard has the exact setup recovery and no
      demo/populated record survives.
- [ ] A Daily view choice and one changed course-owned record survive the
      persisted hydration seam without seeding replacements.
- [ ] Every rendered Daily control has an attributable handler/routing reason;
      focused interaction tests and the reproduced audit report zero unexplained
      controls.
- [ ] Demo remains explicitly marked and isolated from the personal namespace.
- [ ] Focused tests, full suite, production build, and `git diff --check` pass.

## 6. Commit

`test(academics): prove Daily Class Center persistence and empty-state honesty`

Keep this promotion-proof commit separate from unrelated work.

## 7. Next stage — not in this brief

**F · Daily Class Center promotion audit.** After this pass, re-run all six
conditions in `PAGE-PROMOTION-PROMPT.md`: re-measure dark and light visual
ladders, paste the control audit, reload evidence, real empty-store evidence,
the no-integration classification, and the resulting commit hash. Only then
set `daily-main` to `status:"built"` and note the commit in its decision record.
