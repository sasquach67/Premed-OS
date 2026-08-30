# Daily / Class Center — shared Mockup Lab review batch

**Date:** August 26, 2026  
**Gate:** APPROVED by Andy on Aug 27, 2026. Every registered Daily / Class Center Variant A view in this batch is approved as the mockup target; no build claim is implied.

## Coverage

The shared Lab exposes **13 Daily / Daily · Class Center pages and 69 Variant-A product views**:

| Page | Views |
|---|---:|
| Class Center | 1 |
| Global Assignments | 3 |
| Daily empty states | 1 |
| Class Hub | 12 |
| Review Session | 6 |
| Exam Prep | 6 |
| Syllabus Import | 3 |
| Shareable syllabus structure | 3 |
| Class Types | 3 |
| Add Class / type selection | 4 |
| Materials extensions | 25 |
| Learning signals | 1 |
| Topic linking | 1 |
| **Total** | **69** |

The complete per-view cross-reference, visual result, exact edits, direct URL, mirror result, and Andy decision gate is in [DAILY-CLASS-CENTER-VARIANT-A-EXHAUSTIVE-REVIEW-2026-08-26.md](./DAILY-CLASS-CENTER-VARIANT-A-EXHAUSTIVE-REVIEW-2026-08-26.md).

## Review entry points

- [Class Center](http://localhost:8765/variant-lab.html?page=daily-main&view=base&variant=A)
- [Global Assignments · Agenda](http://localhost:8765/variant-lab.html?page=assignments&view=agenda&variant=A)
- [Class Hub · Overview](http://localhost:8765/variant-lab.html?page=class-hub&view=overview&variant=A)
- [Class Hub · Assignments](http://localhost:8765/variant-lab.html?page=class-hub&view=assignments&variant=A)
- [Review Session · Start](http://localhost:8765/variant-lab.html?page=review-session&view=start&variant=A)
- [Syllabus Import · Upload](http://localhost:8765/variant-lab.html?page=syllabus-import&view=upload&variant=A)
- [Materials · Revised Notes baseline](http://localhost:8765/variant-lab.html?page=academics-materials-extensions&view=revised-notes-baseline&variant=A)
- [Daily first-use state](http://localhost:8765/variant-lab.html?page=empty-states&view=guided-launchpad&variant=A)

## Worktree-to-shared-root reconciliation

Only Daily mockup artifacts were considered. The shared root retained its newer lecture-first Overview, syllabus-led Topics, Guide boundary, Materials states, responsive Exam Prep canvas, and approved review-gate metadata.

Two safe Daily deltas were carried from the isolated worktree:

1. Global Assignments review copy now states its coursework-only execution purpose without importing the worktree's self-approval metadata.
2. Class Hub Assignments now presents **Open all assignments →** as a visible cross-class handoff; grade and what-if context remains secondary below the CHEM 262 queue.

The final root also includes the shared Materials parser repair, explicit 25-state Materials label map, unified Add material control, compact Review Session action cluster, and corrected Guide navigation labels.

### User-requested Class Center card revision

The Class Center course strip now uses four wider records instead of four narrow cards plus an Add-class tile. Add class moved to the section header. Each course can show factual status chips, one latest linked class record, its supported topic/study state, and its next dated item; missing grade, readiness, or date evidence is named rather than filled with demo data.

### User-requested Calendar revision

Assignments Calendar now shows the complete six-row month instead of a cropped three-week strip. Day cells are slightly taller, the selected-day rail stretches with the board, and the existing month insight is pinned to the bottom of that rail.

### User-requested Weekly revision

Assignments Weekly now defaults to **Weekday focus**: all seven days remain visible, while Sunday and Saturday are narrower and quieter so Monday through Friday carry the working space. The equal-width seven-lane treatment remains available as Variant B.

### User-requested Topics revision

Class Hub Topics now sorts primarily by **syllabus week**. Week labels lead each section and carry section progress; unit number and exam-scope information remain visible as secondary syllabus context.

### User-requested Class Assignments revision

Class Hub Assignments now uses Overview Tasks’ practical execution behavior—complete with Undo, reorder, mark important, and open/edit details—while remaining permanently filtered to the current course. The cross-class handoff remains visible, and the class-specific What-if calculator is retained below as supporting grade context.

### User-requested Guide evidence revision

Class Hub Guide now proposes reviewable additions from the confirmed syllabus and saved lecture transcripts when available. Every proposal identifies its source and must be reviewed, edited, or dismissed before saving; without a transcript, syllabus-backed and student-authored Guide entries continue normally. The stale per-topic-notes rail was removed because material notes belong in Materials, and the suggestion queue now holds its intended supporting side-rail position.

### User-requested Recall dictation revision

Review Session Recall now recommends optional continuous dictation for fuller spoken answers and exposes official links for Wispr Flow, macOS Dictation, and Windows Voice Typing directly inside the composer. Native Premed OS voice, typing, image, and canvas inputs remain fully usable, and the prompt discloses that third-party tools handle audio separately.

### User-requested Concept Canvas input revision

Concept Canvas now shows **Draw map** and a visible **Picture or file** chooser as equal response paths. The chooser names Image/PDF support, while the supporting copy explicitly covers a photo, screenshot, exported GoodNotes page, or PDF; drawn and uploaded maps remain attached through the same review and recovery flow.

### User-approved Class Plan integration

Class Plan is no longer a standalone Mockup Lab page. Its source-backed, course-specific next-step panel now lives in Class Hub Overview; schedule timing appears inside that panel, and the compact before / captured / review lifecycle track stays on the existing Class Hub Topics rows. The historical standalone HTML/MD pair is retained only as a superseded source reference so dirty review work is not destroyed; it has no registry entry or review URL.

### User-approved Forgetting Curve integration

Forgetting Curve is no longer a standalone Mockup Lab page. Its full one-topic teaching panel replaces the older generic mastery chart at the bottom of Class Hub Overview, preserving solid review history, dashed projection, today and exam markers, the exam-day percentage plus plain-language reading, three teaching explanations, the widening-gap rail, and honest thin-history/no-exam behavior. Compact entry points now appear in Topics rows and the Overview exam-scope panel. The historical standalone HTML/MD pair is retained only as a superseded source reference; it has no registry entry or review URL.

### User-requested lecture workflow revision

Class Hub Overview now defaults directly to transcript capture. A bounded, newest-first Class journal shows three numbered lecture rows at a time and scrolls independently; beside it, an equal-height panel offers `Import transcript` and `Paste transcript` for Lecture 18. The compact 1 → 2 → 3 strip keeps supporting evidence visibly optional and after transcript capture, with selected-source study work last. The Journal has no course selector because the surrounding Class Hub already supplies scope. Saved-record, evidence, and study-work views keep the same journal/workbench composition, omit a Topic picker, and are **APPROVED** as part of the Class Hub Variant A family.

### Final Overview copy and surface cleanup

- Replaced six separate Overview cards (Due today, Exam scope, Coming up, Recently covered, Grade breakdown, Class contacts) with one compact Course pulse containing only the next actionable assignment, labelled Midterm readiness, material filing, and Guide suggestions. Grade detail remains in Assignments; contacts remain in class info/Guide; recent lecture evidence remains in the Journal.
- Renamed the integrated course-planning surface to **Class Plan** everywhere user-facing. It now describes a source-backed course-specific plan for before class, captured class evidence, and review after; behavior remains unchanged.
- Removed the Class Plan explanatory side rail and empty zero-state box. Four next-step groups remain inside one solid panel.
- Consolidated a saved lecture’s Transcript, Supporting evidence, and Study work into one grouped source surface instead of three unrelated cards.
- Across Daily home, Class Hub, Review Session, Syllabus Import, Exam Prep, Materials extensions, Class Types, Topic Linking, Learning Signals, and empty states, reviewer-only labels and repeated state explanations were removed or shortened. Trust boundaries, source labels, and required next actions were retained.

## Verification

- All 70 Daily/Class Center Lab URLs resolve to nonblank Variant-A canvases at localhost:8765.
- Every row was reviewed against its source HTML/MD, documentation mirror, `tabs/01-academics.md`, and `_shared/_visual-recipes.md`.
- All registered source HTML/MD pairs changed in this pass and their documentation mirrors compare exactly; the superseded standalone Class Plan and Forgetting Curve source pairs are synchronized as non-registry references.
- The Mockup Lab registries and both review reports compare exactly.
- No Planning-owned artifact or app source was changed during publication.
- No page was marked built.

## Remaining gaps

No missing or broken Daily review URL remains. Andy approved every registered Daily / Class Center Variant A view on Aug 27, 2026; implementation and built status remain separate gates.
