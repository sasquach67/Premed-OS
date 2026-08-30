# T1 — Academics Daily review-session recovery 58

**Stage:** D — backend persistence and reload recovery
**Build authority:** `BUILD-MANIFEST.md` → `academics-review-session.html` = YES
**Decision gate:** SUPERSEDED — Andy retired Review Session on Aug 29, 2026
**Visual authority:** approved Variant A Review Session, especially `view=resume`
**Behavior authority:** `tabs/01-academics.md` and the existing FSRS/review-event boundary

## 1. Single objective

Make an interrupted Review Session recover after a reload without inventing a
review result, mutating FSRS early, or losing the student's queue position and
serializable response work. Keep completed `ReviewEvent` rows append-only and
keep timer-only `FocusStudySession` rows distinct from recall work.

## 2. Current audit

- `AcademicRecallSession.tsx` holds phase, queue index, typed response,
  confidence, source dispositions, elapsed time, results, purpose and break
  state only in React component state.
- A reload therefore returns to the start screen even though the approved
  Review Session mockup exposes a `resume` recovery state.
- `ReviewSessionPreferences` contains course-agnostic defaults only. It is not
  a safe home for course-scoped in-progress work.
- `ReviewEvent` is intentionally append-only and represents a completed graded
  recall. Writing a partial session there would falsely affect review history
  and scheduling.
- `FocusStudySession` records completed timer blocks and likewise cannot hold a
  recall draft.
- Class removal does not require a schema change: `ClassWorkspace.status`
  already supports `active | archived`. The current destructive Class Center
  action should route to that recoverable archive behavior in a separate,
  bounded hunk after this decision is cleared.

## 3. Proposed persisted contract — requires Andy approval

Add an optional course-scoped `ActiveReviewSession` record to
`ClassCenterData`:

- stable `id` and `courseId`
- `purpose`: `recall | focus`
- recoverable phase: `active | report | focus | break`
- ordered queue topic IDs and current index
- typed response, selected confidence, and source dispositions
- elapsed seconds, started/updated timestamps, and completed in-session result
  summaries that have not already been emitted elsewhere
- optional break resume phase and remaining seconds
- no raw `Blob`, `File`, object URL, microphone stream, or generated AI result

Image/audio attachments remain explicitly non-resumable until there is an
approved blob-reference contract. Recovery copy must say that unsaved local
media needs to be attached again; it must not claim those bytes survived.

Lifecycle:

1. Persist only after the student starts Recall or Focus.
2. Update the draft after meaningful state transitions and typed-response
   changes, with bounded/debounced writes rather than every timer tick.
3. On route load, show the approved Resume state when a valid draft exists for
   this course.
4. Resume restores the queue against surviving topic IDs; missing/deleted
   topics are removed without fabricating results.
5. End/Discard removes the draft without creating a review event.
6. Completing the session clears the draft only after all final writes succeed.
7. A graded topic still creates exactly one `ReviewEvent` and one matched
   retrievability prediction through the current atomic path.

## 4. Authorized implementation after approval

- Add the type in `src/lib/types.ts` and the collection/optional record in
  `ClassCenterData`.
- Add the next pure, idempotent, lossless Academics migration and wire it into
  `migrateAll` / `CURRENT_STORE_VERSION`.
- Initialize personal/demo data honestly with no active draft.
- Add focused migration, persistence, discard, resume, missing-topic and
  completion tests.
- Implement the approved Resume state in `AcademicRecallSession.tsx` using the
  existing solid-surface Review Session visual language.
- Replace destructive Class Center deletion with the existing recoverable
  archive state; keep permanent cascade deletion out of this brief.
- Run scoped tests, the full suite, production build, reload proof, empty-store
  proof, and light/dark visual comparison at the real app viewport.

## 5. Explicitly excluded

- Persisting audio/image bytes or object URLs.
- A new Grades-owned evidence container for prior-credit PDFs/images.
- Permanent class deletion or a new Trash entity.
- Planning, mockup, registry, flashcard/output, or unrelated source changes.
- Marking Review Session or Class Center BUILT before all six promotion proofs
  pass.

## 6. References to read before execution

- `premed-hq-documentation/implementation/briefs/EXECUTE-BRIEF-PROMPT.md`
- `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`
- `premed-hq-documentation/tabs/01-academics.md`
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `mockup-lab/01-academics/academics-review-session.html`
- `mockup-lab/01-academics/academics-review-session.md`
- `premed-hq-documentation/specifications/mockups/01-academics/academics-review-session.html`
- `premed-hq-documentation/specifications/mockups/01-academics/academics-review-session.md`
- `src/pages/AcademicRecallSession.tsx`
- `src/lib/types.ts`
- `src/store/store.ts`
- `src/store/migrations/reviewSessionV32.ts`
- `src/components/academics/ClassCenter.tsx`

## 7. Done when

1. Reload during Recall/Report/Focus/Break offers Resume or Discard and restores
   only serializable state.
2. Discard creates no review, FSRS, prediction or focus-completion record.
3. Resume never duplicates a completed review event.
4. Removed topics are reconciled safely and course scope cannot leak.
5. Completed sessions clear their draft after durable writes.
6. Class removal is recoverable archive behavior, not a partial hard cascade.
7. Empty-store, migration and reload tests pass; full tests/build pass.
8. Both-theme visual and inert-control audits pass at the real app viewport.
9. No unrelated dirty file is reverted, staged or overwritten.
10. Status stays unchanged until all six Mockup Lab promotion proofs pass.

## 8. Andy decision

This draft is retained only as decision history. Do not execute it; follow
`T1-academics-daily-review-retirement-59.md` instead.
