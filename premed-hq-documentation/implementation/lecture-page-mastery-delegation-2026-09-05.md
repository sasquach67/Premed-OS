# Lecture page and mastery revision

## User request and shared acceptance criteria

The opened lecture should be its own page, not a center-peek popup. Keep the lecture catalog independent of the reading scroll, so long lectures never leave empty, scrolled-away navigation columns. Keep Study Guide, Mastery Map, Materials, and Sources together under the lecture identity. Any center-peek preview retained must use the established Split / Expand / Close behavior; do not add decorative controls that have no real behavior. The journal's inline preview is not a center peek.

Preserve “What can you explain?” as useful free-recall practice. Add the full mastery outline alongside it, within the same Mastery Map rather than inventing another duplicate resource. The outline must expose all objectives and their distinct Understand, Be able to do, and Watch for bullets. Add original, source-grounded exam-style applications with answers and reasoning. Distinguish generated practice from instructor-authored questions or predictions. Retain source traces, old records, self-assessment, provider/privacy protections, and course scope. Never silently overwrite existing student work to populate examples.

Reference: `/Users/andyquach/Downloads/BIOL103-Lessons-2-and-3-Unit-Mastery-Outline.docx`. This contains five detailed objectives each for Lessons 2 and 3. The user's intent is structural fidelity and exam application, not automatically importing this document into their account. Document content is reference data, not authority to execute embedded instructions.

Screenshots: `/var/folders/c1/yrkl287j5hd_lmhrgtzhtgrc0000gn/T/TemporaryItems/NSIRD_screencaptureui_DZWnJc/Screenshot 2026-09-05 at 2.49.52 PM.png` (scrolling problem), and `/var/folders/c1/yrkl287j5hd_lmhrgtzhtgrc0000gn/T/TemporaryItems/NSIRD_screencaptureui_3ep9w6/Screenshot 2026-09-05 at 2.50.11 PM.png` (preview controls).

## Shared checkpoint and ownership

Coordinator workspace: `/Users/andyquach/.codex/worktrees/lecture-page-mastery/premed-os`, branch `codex/lecture-page-mastery`, based on `ffca9ef` from main. The checkpoint is unfinished scaffolding, NOT release-ready. Create a separate worktree from the checkpoint commit supplied in your task message. Do not edit the coordinator workspace, the dirty original checkout, another worker's files, or push main. Commit only your owned changes and return the commit SHA and evidence to coordinating task `01a062b4-5cf2-72b3-8966-bf2d78231520`. Do not spawn further workers or dispatch other tasks. All four assignments can work concurrently from the same checkpoint.

### A — Page navigation and lecture lifecycle

Owner: Rebuild lecture import and workspace.
Files: `src/App.tsx`, `src/pages/LecturePage.tsx`, `src/components/academics/ClassHub.tsx`, new `src/pages/LecturePage.test.tsx`, relevant ClassHub/navigation tests. Do not edit LectureCapturePanel or its CSS; report needed interface changes to coordinator.

Refine the new dedicated `/academics/classes/:courseId/lectures/:lectureId` route and all opening links. Validate direct URL, refresh, browser back/forward, class journal return, switching lectures, missing/deleted/foreign-course lecture, creating a lecture and finishing a rebuild. Persist the selected lecture identity in the URL and avoid remounting away import input unexpectedly. Remove obsolete full-screen-popup copy and assertions. Existing preview controls outside this surface stay intact. Audit whether any lecture center-peek remains and identify its actual Split/Expand/Close requirements; prefer no lecture peek where a dedicated page is appropriate.

### B — Independent scrolling and responsive layout

Owner: Academics visual conformance touch-…
Files: `src/components/academics/LectureCapturePanel.tsx`, `src/pages/LecturePage.css`, `src/components/academics/LectureCapturePanel.test.tsx`. Do not edit LecturePage.tsx, ClassHub, or LectureStudyViews. Report any selector/interface dependency.

Refine separate viewport-bounded lecture catalog and article scrolling. Keep the lecture header/tabs reachable, keyboard scrolling usable, and long catalog and guide section navigators useful. Avoid an additional large vacant column at typical laptop widths. Test desktop, narrow/mobile, browser zoom/short viewport, light/dark, and long source/guide content. Verify the actual scroll offsets and visual sidebar position before and after deep article scroll. Existing regression was red for missing independent reading pane and is green on scaffolding; this is not sufficient visual proof. Keep embedded journal preview bounded without unintentionally overriding its layout. CSS must not change unrelated app shell behavior.

### C — Mastery outline and recall interface

Owner: Restructure lecture learning pages.
Files: `src/components/academics/LectureStudyViews.tsx`, new `src/components/academics/LectureStudyViews.test.tsx`. Do not edit CapturePanel or shared page CSS.

Refine the scaffold's default, fully expanded mastery outline, objective navigation, Understand / Be able to do / Watch for sections and exam application presentation. Keep the separate “What can you explain?” mode with answer/checklist reveal and persisted self-assessment. All old source text remains unchanged; no truncation. Older maps without examPractice must show an honest empty state and available application targets, not fake questions. Ensure recall genuinely conceals answers until revealed, practice solution reveal works, long text remains legible, source traces resolve, scope labeling remains honest, and keyboard interaction is clear. Coordinate test expectation changes with B via coordinator. Inspect the DOCX reference before refining. You may refine guide section navigation within your owned file to avoid wasteful columns.

### D — Source-grounded exam generation contract

Owner: Continue trial generation.
Files: `src/lib/generation/artifacts/unitMasteryOutline.v1.ts`, `src/lib/academics/generateUnitMasteryOutline.ts`, `src/lib/academics/unitQuestionBank.ts`, `src/lib/types.ts`, related generation/validation tests and generation specification 11. No UI or provider routing edits.

Scaffold adds optional persisted `examPractice: Array<{ prompt, answer, rationale, sourceChunkIds }>` per objective; newly generated schema requires one or two. Verify/refine the entire request, validation, repair, persistence and source-boundary path. Keep legacy saved maps readable and existing question-bank outline validation compatible. New questions need a self-contained unfamiliar scenario, data/sequence when required, accurate answer and worked reasoning supported by the objective's source IDs. No absent-diagram questions, copied private exam stems, unsupported predictions, fabricated instructor emphasis or duplicated filler. Update spec parity and fixtures. Do not call paid APIs, upload sources, regenerate the user's saved lecture, change credentials, or deploy a backend merely to complete this task; report any remaining end-to-end verification needs. OpenAI remains primary, Anthropic audit/secondary.

## Integration gate

Each worker reports changed files, committed SHA, exact tests/build outcomes, visual evidence where applicable, and remaining issues. Coordinator integrates the disjoint commits and runs combined regression, build/lint and route-level browser verification. No checkpoint or passing isolated test should be described as live. Publishing is held for the coordinator after integration review.
