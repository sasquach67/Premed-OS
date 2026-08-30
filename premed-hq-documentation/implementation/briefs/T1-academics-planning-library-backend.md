# T1 · Academics Planning Library — backend completion

**Stage:** D · BACKEND MISSING

**Scope:** Add the lossless, local-first data contract that the approved
Planning frontend consumes: explicit program/catalog context, source-versioned
UNC planning references, candidate-only coverage, honest catalog lookup, and
advisor export provenance. This is backend/data work only. It does not alter
mockups, CSS, component composition, or user-facing promotion status.

## 1. Audit before implementation

### A. Spec → paper

The canonical Academics rules and approved Planning Library brief require an
explicit program/degree/track, matriculation term, applicable IDEAs catalog
year, and Gillings admission context where applicable. Existing planner terms,
course placement, saved plans, transcript records, and source-warning
acknowledgements already persist at store version 35. The missing ruled data is
the selected catalog-plan context and its source-backed local lookup boundary.

### B. Mockup → app

Not applicable to this stage. The approved Planning frontend already exists;
this brief may only supply typed data, selectors/adapters, migration, and pure
backend behavior. No visual file is in scope.

### C. Already built — do not rebuild

- Planner term/course placement, locks, notes, saved-plan restore, and reload:
  `b4f9a2e` and `T1-academics-planner-operations.md`.
- Transcript-faithful grade records and requirement-source warning
  acknowledgements: current `ClassCenterData` v35 contract.
- Generic single-store hydration and recovery: `src/store/store.ts`.

### D. Gate

`BUILD-MANIFEST.md` marks the Planner, Requirements, Grades & Archive, and
their Planning decision/recovery surfaces `YES`. The Requirements row forbids
unsafe fulfillment mathematics; this brief preserves that boundary.

### E. Decisions

`T1-academics-planning-library-implementation.md` settles the backend shape:
candidate states are only Course recorded / Not scheduled / Manual review;
local data never produces a degree-audit, completion, graduation, or admission
verdict.

### F. Integrations

- **Local official-source reference library:** code missing in this worktree;
  implement from the approved 2026–27 source packet.
- **Live UNC catalog, ConnectCarolina/Tar Heel Tracker, archived catalogs,
  transfer/AP articulation, substitutions, enrollment attributes:** not
  configured and not locally authoritative. Implement an explicit adapter
  status and safe local fallback; never fabricate availability, course titles,
  credits, equivalencies, or fulfillment.

## 2. Backend work

1. Add `PlanningProgramContext` to the existing `ClassCenterData`, with no
   guessed defaults. Include selected program id, matriculation term, exact
   IDEAs catalog year, Gillings admission term, admission status, and update
   timestamp.
2. Add store migration v36. It adds only an empty context when absent, returns
   the original object when already migrated, accepts frozen input, and never
   rewrites courses, grades, requirements, saved plans, or transcript records.
3. Add the source-versioned UNC planning library from the approved research
   packet. Every node remains `official-audit-required`; course-code matches
   yield candidate context only.
4. Add a local catalog adapter over explicit captured course codes. Expose
   exact code/source/program provenance and an `unconfigured` live-integration
   status. Do not derive titles, credits, term offerings, substitutions, or
   completion.
5. Add pure context validation/update helpers. Invalid program ids/statuses are
   rejected on new writes; hydration migration remains lossless and does not
   delete an already-stored value.
6. Extend advisor export input with optional Planning context and selected
   source provenance. Absence must render as not recorded, and the document
   must retain the official-review boundary.
7. Test program/context edits, local catalog lookup, candidate coverage,
   migration idempotence/frozen input/JSON reload, planner term/course and
   saved-plan retention through v36, prior-credit/manual-review/grades
   retention, and no Daily/Class Hub mutation.

## 3. Do not break

- No completion percentage, progress total, score, ranking, pace, admission,
  equivalency, graduation, or official-audit verdict.
- No second storage key and no binary/external credentials in persisted state.
- No mock data in personal first-use state; context defaults to `{}`.
- No changes to Planning UI, mockup HTML/CSS, shared visual tokens, Daily/Class
  Hub, flashcards, or unrelated dirty files.
- Transcript/grades remain exact records. Prior credit and requirement source
  acknowledgements remain distinct from planned-course candidate coverage.

## 4. Done when

- [ ] Store version 36 and all first-use/demo/seed factories are structurally complete.
- [ ] Context survives JSON/local-store hydration without guessed defaults.
- [ ] v36 is lossless, pure, and idempotent, including malformed/missing legacy context.
- [ ] All 46 source records remain source-versioned and non-computational.
- [ ] Catalog adapter exposes only captured official-reference facts and labels the live integration unconfigured.
- [ ] Advisor export names selected provenance and preserves the not-official boundary.
- [ ] Focused tests cover edits, term/course CRUD safety, coverage, manual review, grades/prior credit, reload, migration, and no cross-domain leakage.
- [ ] TypeScript, production build, `git diff --check`, and a backend handler/control audit pass.

## 5. Commit

`feat(academics): persist safe Planning catalog context`

## 6. Next stage

Re-run the Planning router and promotion audit. Live catalog/ConnectCarolina
configuration and official historical catalog ingestion remain external
integration blockers; they are not follow-on implementation in this brief.

## 7. Execution audit · 2026-08-27

**Planning migration:** v36 (`planningProgramContext`). In the combined dirty
worktree the later Daily Guide migration is v37; Planning remains the v36 link
and runs before it.

**Verified:**

- Focused backend suite: 8 files, 39 tests passed.
- Full-suite green checkpoint: 107 files, 719 tests passed. A subsequently
  added, Daily-owned `ClassHub.guide.test.tsx` has two missing-ToastProvider
  harness failures; Planning tests remain green and this backend pass does not
  alter that Daily file.
- TypeScript project build: passed.
- Production Vite build: passed.
- Backend inert-control audit: zero UI controls in the Planning backend files.
- Planning-scoped whitespace audit: passed.

| Promotion proof | Result | Evidence / boundary |
| --- | --- | --- |
| Measured visual match | Not part of backend stage | No frontend or mockup file changed. Retain the existing Planning visual audit. |
| No inert controls | Pass for this stage | Backend audit found zero `Button`, menu, or click/change handlers. |
| Reload persistence | Pass | JSON hydration retains context, terms, courses, requirement evidence, transcript records, warning acknowledgements, and saved plans. |
| Honest empty store | Pass | Personal state initializes `planningProgramContext` to `{}`; no program or cohort is guessed. |
| Integrations configured | **Fail / external boundary** | Live UNC Catalog, ConnectCarolina/Tar Heel Tracker, historical catalog, transfer/AP, and substitution services are unconfigured. The adapter is explicitly `local-reference-only`. |
| Commit provenance | Pass | `feat(academics): persist safe Planning catalog context` (final hash reported by the executing agent). |

**Promotion disposition:** do not mark Planning `BUILT`. The local backend is
ready, but the required live/official integrations remain unconfigured and an
official degree-audit claim remains deliberately impossible.
