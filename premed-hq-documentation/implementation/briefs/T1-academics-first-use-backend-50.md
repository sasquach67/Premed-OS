# T1 · Academics — first-use runtime proof and recovery

**Stage:** D · BACKEND / durable first-use behavior  
**Status:** ready to execute  
**Authority:** `T1-academics-first-use-promotion-49.md`,
`tabs/01-academics.md` §4.1-M-a, and the approved empty-state and syllabus
import decision records.

## Why this brief exists

Daily · Class Center now has Andy's live visual acceptance for Variant A.
The remaining first-use failure is not a new layout: a genuinely fresh,
personal workspace has not yet been proven end-to-end in the running app.

The pure store factory is already correct: real mode starts from
`createPersonalInitialData()` with no courses, workspaces, assignments,
topics, files, metrics, or demo facts. `ClassCenter.dashboard.test.tsx` also
shows the intended launchpad. The runtime audit, however, opened an otherwise
separate local app and found an already populated course collection. That is
not enough evidence to call the zero-class experience built: the saved or
cloud-restored source of those records was not identified, and a production
fresh-start route must never accidentally inherit seed/demo records.

This pass makes that boundary explicit and testable. It does not change the
approved Class Center visual treatment.

## 1. Fidelity audit — preserve, do not restyle

- Preserve the accepted Variant A Class Center appearance and all later
  app-specific card rulings in `academics-daily-main-page.md`.
- Preserve the approved Empty-state A launchpad: primary **Import syllabus**,
  quiet **Add manually**, no inactive controls or invented metrics.
- Preserve the temporary full-screen syllabus Import → Parse → Review → Apply
  flow. Cold start is unscoped; scoped import attaches to one existing
  `courseId`; neither route duplicates a course.
- The manifest clears Daily, Empty states, Class Hub, and Syllabus import with
  `Build? = YES`.

## 2. Work — first-use ownership and proof

### 2.1 Establish the source of runtime data before altering it

- Trace startup in `src/store/store.ts`, `src/store/useCloudSync.ts`, and the
  persistence namespace helpers. Identify whether records in a fresh browser
  came from a persisted local namespace, an authenticated cloud reconciliation,
  demo mode, or an illegal seed path.
- Do not infer the cause from a populated screenshot. Add a focused regression
  test for the observed source once identified.
- In real (non-demo) mode, a missing persisted namespace plus no authenticated
  cloud record must resolve exactly to `createPersonalInitialData()`.
- A returning local namespace and a signed-in cloud snapshot may restore only
  that student's saved records. Neither may fall back to `createSeedData()`.

### 2.2 Make the transition safe

- Keep the existing non-destructive legacy upgrade and merge boundary. Never
  clear, overwrite, or reseed a student's real namespace merely to demonstrate
  first use.
- If cloud reconciliation supplies data, keep its existing merge safeguards:
  the student decides a local/remote merge before reconciliation can replace
  local work.
- Keep Demo mode isolated to its stamped demo namespace. A real profile may
  never display a demo badge, course, task, GPA, recommendation, or class
  panel.

### 2.3 Prove the actual first-use journey with disposable data

Add a test harness that uses an empty, disposable persisted namespace—not
Andy's personal store—to prove all of this in one flow:

1. cold hydrate → no courses and the launchpad only;
2. **Import syllabus** reaches unscoped Import → Parse → Review without a
   synthetic course;
3. Cancel leaves the store byte-for-byte empty;
4. Apply creates exactly one course and one workspace;
5. reload restores that course and its accepted syllabus data;
6. entering scoped import / re-import uses that same `courseId`, never `uid()`;
7. a missing date stays an honest absence, rather than a sample assignment;
8. **Add manually** remains available and creates a real course without
   requiring a syllabus.

The harness must be capable of proving hydration/persistence, not merely
calling `createPersonalInitialData()` in isolation. It must not add a visible
reset button, query-string seed mode, or other student-facing testing control.

### 2.4 Keep external services out of this core proof

- The core journey is local-first; it must pass with no model key, Google
  scope, Drive permission, Calendar configuration, or shared-syllabus lookup.
- If an optional cloud snapshot is involved, mock it in the disposable test
  and separately assert that an unauthenticated first run never calls it.
- Do not change Supabase secrets, RLS, OAuth, or external configuration in
  this pass.

## 3. Do not break

- Do not change Class Center layout, color, card hierarchy, Review ownership,
  planner, Materials generation, Class Hub, assignment rules, or any approved
  mockup.
- Do not alter the current user’s storage or cloud dashboard while testing.
- Do not introduce demo data into the real path or use `createSeedData()` as a
  first-use recovery.
- Preserve re-import identity matching and the Keep/Accept defaults.
- Keep unrelated flashcard/output work out of the commit.

## 4. Done when

- [ ] A focused runtime/persistence test proves the eight-step first-use flow
      above from an empty disposable namespace.
- [ ] A regression test identifies and prevents the concrete source that made
      the separate local runtime appear populated.
- [ ] `createInitialDataForMode(false)` still creates the record-free personal
      shape; demo and reset behavior remain explicitly separate.
- [ ] The focused Academics suite, `npm test -- --run`, `npm run build`, and
      `git diff --check` pass.
- [ ] A real manual verification is documented using a fresh browser profile
      or disposable account, never Andy's existing workspace.

## 5. Commit

`fix(academics): prove and protect personal first-use state`

Commit only the store/cloud-boundary change and its narrow tests. Keep the
existing flashcard and generated-output work separate.

## 6. Next stage — not in scope

Rerun `T1-academics-first-use-promotion-49.md`. It may promote only the pages
whose six live proofs now pass; it must not promote Syllabus Import or Class
Hub based solely on these first-use tests.
