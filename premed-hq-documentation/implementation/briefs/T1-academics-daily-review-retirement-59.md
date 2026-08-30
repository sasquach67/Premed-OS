# T1 — Academics Daily review-system retirement 59

**Stage:** A through E — settled product removal, mockup correction, app removal, and proof
**Supersedes:** `T1-academics-daily-review-resume-58.md`
**Authority:** Andy, Aug 29 2026 — remove Review Session and related review/Anki features
**Data boundary:** remove the feature from the product without erasing existing local history

> **Aug. 29 follow-up:** Flashcards may be created again only as a selected-source
> class Material through **Create study resources**. They stay inspectable with
> the class and do not restore Review Session, scheduling/readiness, Quiz me, or
> Anki export. This follow-up supersedes only the broader flashcard-removal wording
> below.

## 1. Single objective

Remove the Academics review system as a user-facing product and simplify every
class card to a direct **Open** action. Keep the lecture-first workflow,
syllabus-led Topics, assignments, exam planning, course materials, study
guides/outlines, revised notes, and Guide/Course lens.

## 2. User-facing features to retire

- Dedicated Review Session route and every Start review / Review / Quiz me entry.
- FSRS due queues, retrievability/forgetting-curve panels, review streaks,
  review grading, and review-specific Class Plan/Learning Signals surfaces.
- The Forecast Accuracy ledger, because it scores the now-retired per-review
  retrievability predictions. Existing prediction records remain readable but
  no longer have a user-facing route.
- The review-driven Mistake Evidence state in Grades & Archive. Exam/practice
  mistake records remain available to their owning evidence flows and legacy
  data remains readable; the removed state must not route back to recall.
- Academics flashcard review, scheduling, Anki package/TSV export, Anki deck
  quick links, and review-result states. Selected-source flashcard resources in
  Materials remain allowed.
- Center Peek/Preview as the default class-card action. A class card opens its
  full Class Hub directly and its visible action is named **Open**.

## 3. Features that stay

- Numbered lecture journal and transcript-first capture.
- Optional lecture evidence followed by source-selected study work.
- Study guides/outlines, revised notes, and existing generated documents.
- Selected-source flashcards stored and inspected as class Materials only.
- Syllabus standards/objectives as Topics; schedules remain timing context.
- Course assignments, grades/what-if context, exam-plan builder and practice
  material that is not the retired Review Session.
- Guide, Course lens, professor evidence and source attribution.
- MCAT-owned flashcards or study tools; this brief is Academics-only.

## 4. Data-safety rule

Do not delete or rewrite existing `ReviewEvent`, FSRS, prediction,
`FocusStudySession`, or generated-flashcard records. Keep their legacy types and
migrations readable so an existing local store still hydrates losslessly. Stop
creating or displaying those records in Academics. A later explicit data-erasure
decision may remove them physically.

## 5. Mockup and specification changes

- Remove the Review Session registry entry and standalone HTML/MD in both
  Mockup Lab mirrors.
- Remove the standalone Forgetting Curve and Study Method/Class Plan artifacts
  from the active Daily review contract; delete their now-retired source pairs
  when they are no longer registered.
- Remove the standalone Forecast Accuracy artifacts and registry entry, and
  remove the Mistake Evidence state from the Grade Decisions mockup and registry.
- Rewrite Daily Class Center cards to use **Open**, remove Preview/Review rails,
  and replace the review queue/weakness panels with source-backed recent study
  work and useful course-material/assignment context.
- Rewrite Class Hub Overview without Start review, Class Plan, Learning Signals,
  forgetting curve, readiness/retention claims, or flashcard counts.
- Rewrite Materials output choices around flashcards, study guide/outline, and
  revised notes; remove review/scheduling and Anki states.
- Update class-type and empty-state copy so no retired route remains promised.
- Add a dated authority amendment to `tabs/01-academics.md`; stale review sections
  below it are historical and explicitly superseded.
- Mark the retired manifest rows as `RETIRED / NO`, never BUILT.

## 6. App changes

- Remove `/academics/review/:courseId` and its lazy page import.
- Remove `AcademicRecallSession.tsx` after all routes and imports are gone.
- Make Class Center card click, keyboard activation, context action, and visible
  primary action open `/academics/classes/:courseId` directly.
- Remove Center Peek state from Class Center.
- Remove review-specific Class Hub imports, actions, panels and topic controls.
- Remove Academics flashcard review/export UI. Keep source-selected flashcard
  creation inside the unified Materials resource menu.
- Replace the Daily review streak with a factual non-review metric.
- Rewrite How to study around syllabus → lecture evidence → selected-source
  guide/outline/revised notes.
- Keep legacy store fields/migrations intact and unused.

## 7. Done when

1. No visible Academics control or registered Daily mockup says Start review,
   Quiz me, Forgetting curve, FSRS, or Anki. Flashcards appear only as one
   selected-source Materials format.
2. Class cards expose one primary **Open** action and go directly to Class Hub.
3. No `/academics/review/*` route resolves to Review Session.
4. Class Hub still completes transcript → optional evidence → study work.
5. Materials creates source-backed flashcards, guides/outlines, and revised notes.
6. Existing review/flashcard data hydrates without loss but is not displayed.
7. Exact Mockup Lab mirrors and registries stay synchronized.
8. Scoped interaction tests, full tests, and production build pass.
9. Desktop light/dark mockup-to-app comparison passes at the real viewport.
10. No Planning, MCAT, flashcard-output files outside Academics, or unrelated
    dirty work is overwritten.
