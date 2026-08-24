# Academics finish-line audit — Aug 24, 2026

**Baseline inspected:** `c684b35` (`feat(academics): wire reviewed folder intake into Materials`).

This is a **non-authorizing inventory**, not an execution brief. It does not
replace the one-brief / one-review / one-execute loop. Its job is to make the
next run purposeful: finish Academics as one coherent student journey without
deleting the app-specific visual decisions Andy has made during testing.

## 1. What “finished” means from here

The old labels are not enough. A page is only **built** after it passes all six
conditions in `PAGE-PROMOTION-PROMPT.md`:

1. measured visual match in light **and** dark,
2. every control has a handler,
3. each ruled behavior persists after reload,
4. an empty store has only honest empty states,
5. each integration is coded **and configured**, and
6. the committing hash is recorded beside the mockup.

Andy is the visual authority: match the approved drawing unless he has made a
specific app annotation or visual adjustment. Those app-specific decisions are
preserved and take priority over an older mockup. The implementation owner is
still responsible for behavior, data integrity, honest empty/error states, and
the six proofs above.

### Working labels for this audit

| Label | Meaning |
|---|---|
| **C0 · absent** | No usable implementation has been located. |
| **C1 · screen / explanation only** | A truthful surface exists but cannot perform the promised calculation or workflow. |
| **C2 · functional slice** | Local behavior and a data model exist, with automated coverage, but it still needs a page-level end-to-end and fidelity proof. |
| **C3 · locally proved** | Tests explicitly cover persistence and empty data for the owned surface; it still is not terminal `built` until the six-condition audit passes. |
| **C4 · externally blocked** | Code exists, but an account, OAuth grant, API configuration, or deployment is required before a student can use it. |

No item in this document is promoted merely because it has a component or a
mockup. Conversely, nothing gets removed just because its final proof is still
missing.

## 2. Evidence located

- `src/pages/Academics.tsx` owns the Daily / Planning shell, tabs, routing, and
  shared course data.
- `src/components/academics/` contains 31 dedicated Academics surfaces,
  including Class Center, Class Hub, review, materials, planner, requirements,
  archive, reports, transcript import, and generation intake.
- `src/lib/academics/` contains tested domain modules for syllabus parsing and
  re-import, class types, review scheduling, grades, planning, requirements,
  transcripts, lecture evidence, source selection, generated artifacts, term
  reports, and folder discovery.
- The recent narrow proof commits are `be10e7f` (Daily Class Center persistence
  and empty state), `cdc7308` (Class Types persistence and empty state), and
  `c684b35` (reviewed folder intake).
- The build manifest clears every listed Academics mockup for implementation;
  Requirements is explicitly cleared for the **screen only**, not graduation
  completion math.

## 3. Surface inventory

The lab registry status remains a design-review status, not a claim that the
student workflow is complete. “Next proof” is deliberately concrete so the
router can select one bounded brief rather than creating another broad sweep.

### Daily / Class Center

| Surface | Lab state | Current evidence | Audit level | Next proof before built |
|---|---:|---|---:|---|
| Daily Class Center | built | `ClassCenter.tsx`; persistence/empty-store dashboard tests; `be10e7f` | C3 | Re-run the six-condition page audit against an ordinary local account, including every card overflow action and both themes. |
| Class type selection | built | proposal model + tests; Class Center selection tests; `cdc7308` | C3 | Six-condition audit: selection, edit, manual override, reload, empty add-class state. |
| Assignments | approved | `AssignmentsPanel`, assignment create dialog, Class Hub assignment links | C2 | Student adds/edits/completes/deletes an assignment, reloads, then checks empty and overdue states. |
| Class Hub | approved | `ClassHub.tsx`, dedicated tests for Writing persistence and empty states | C2 | Page-level route audit across Overview, Materials, Notes, and class-type-specific states; document its visual ladder. |
| Review session | approved | `AcademicRecallSession`, `activeRecall`, `studySession`, `fsrs` modules and tests | C2 | Start a session from a card, record each result, reload, and show the changed due state without demo residue. |
| Empty states / first import | approved | Class Center dashboard cold-import test; syllabus importer | C2 | Test the real empty personal store on desktop and mobile; verify all routes return to the scoped flow. |
| Exam prep mode | proposed | `ExamPrepMode`, `examPrep`, `fullMock`, `generateFullMock` | C2 | Create a plan, run catch-up/closeout, reload, then test no-evidence state. |
| Syllabus import + re-import | proposed | PDF/text extraction tests, `SyllabusImportMode`, identity-based `syllabusReimportDiff`, scoped entry paths | C2 | Run a real syllabus through new-class, existing-class, and re-import. Insert a week mid-syllabus and prove later items stay unchanged; confirm removed rows never auto-delete. |
| Study method | proposed | `StudyMethodPanel`, `StudyMethodTrack`, `studyMethod` and `pretest` / `predict` / `fullMock` models | C2 | Confirm every visible method has a real engine and a safe no-data state; do not expose a method solely because a mockup drew it. |
| Forgetting curve | proposed | `ForgettingCurve`, `forgettingCurve` tests, FSRS states | C2 | Verify the explanation derives only from the student’s review evidence and remains honest when none exists. |
| Learning signals | approved | `LearningSignalsPanel`, deterministic signal tests, topic-link writer | C2 | Create the evidence that triggers each signal, reload, then resolve it; verify the capped list never hides a more urgent item without explanation. |
| Grade decisions | proposed | `GradeDecisions`, grade ledger / decision modules and tests | C2 | Create a grade decision, verify its evidence and reload behavior, then test absence of grade data. |
| Topic linking / Connect | approved | `TopicLinkFields`, `TopicConnectField`, topic graph/link tests | C2 | Add, edit, remove, and reload topic-to-work links; verify learning signals only use explicit links. |

### Materials, source intake, and generation

| Surface | Lab state | Current evidence | Audit level | Next proof before built |
|---|---:|---|---:|---|
| Materials catalog | proposed | `MaterialCatalog`, catalog tests, class hub Materials tab | C2 | Confirm a student sees only files they accepted, correct provenance, empty state, and a route back from one selected output flow. |
| Output-specific material intake | proposed | `MaterialGenerationIntake`; selection, baseline, and source-sync tests | C2 | Verify Study guide, Flashcards, and Revised Notes each open the same focused intake, require evidence, and never silently select a newly added file. |
| Study-guide generation | proposed | `generateStudyGuide`, `study-tools` server route | C2/C4 | End-to-end with a signed-in account: select chunks, generate, persist a source trace, reload, and view the saved guide. C4 until deployed provider/config is verified live. |
| Flashcard generation + Anki export | proposed | `generateFlashcards`, flashcard spec, `flashcardExport` APKG/TSV code and tests | C2/C4 | End-to-end: select sources → generate → save → reload → download `.apkg` → import into Anki Desktop and confirm the reference model/rendering. C4 until deployed provider is verified live. |
| Revised Notes | proposed | `RevisedNotesPanel`, `generateRevisedNotes` caller/model tests | C2/C4 | End-to-end: choose **my notes** baseline plus source material, generate a separate material record, reload, and confirm original notes remain untouched. C4 until deployed provider is verified live. |
| Paste excerpt | proposed | `PastedExcerptDialog`, bounded-excerpt tests | C2 | Test that an excerpt is visibly bounded and sourced, persists, and may be selected only after review. |
| Transcript import | proposed | `TranscriptImport`, parsing / record tests | C2 | Import a representative transcript; verify classification review, ledger output, reload, and empty/error import states. |
| Lecture transcript / professor evidence | proposed | `LectureCapturePanel`, `lectureAnalysis`, `lectureEvidence`, `watchedNotes` tests | C2/C4 | Test transcript ingestion and the confirm/deny “professor evidence” note flow with timestamp traceability. C4 if the live analysis function or provider is not deployed/configured. |
| Reviewed local folder intake | proposed | `MaterialFolderIntake`, local-folder model, focused component test, `c684b35` | C2 | Run native folder selection in the supported browser; stage, accept/reject, reload, and ensure no rejected file became material. |
| Optional Google Drive folder | proposed | client contract, Edge Function, migration, UI recovery states | C4 | Requires deployed `google-drive-materials`, Drive API/OAuth client, callback URL, redirect/secret configuration, and a real folder review. The UI correctly says unavailable until then. |
| Calendar review | not a current registry row | `CalendarReview`, calendar module/test | C2/C4 | Route and test a read-only calendar review against a connected account; C4 until Calendar OAuth configuration and live event data are verified. |

### Planning, requirements, archive, and term learning

| Surface | Lab state | Current evidence | Audit level | Next proof before built |
|---|---:|---|---:|---|
| Planner board | approved | `PlannerBoard`, `planner` and `savedPlans` tests | C2 | Add/move/edit term courses, reload, test current-term workspace synchronization and recovery boundaries. |
| Planning decisions | proposed | `PlanningDecisions`, course planner models | C2 | Verify each explanation reads the shared course list and never changes a plan by merely opening it. |
| Planning cold start | proposed | `PlanningColdStart`, route and no-course guard in `Academics.tsx` | C2 | New account, no courses: add one course, reload, and confirm no zero metrics masquerade as facts. |
| Requirements / Tar Heel Tracker | proposed | `RequirementsAudit`, requirements tests, UNC data | C1 | Screen can guide planning; it **must not** calculate individualized graduation completion until cohort-specific requirements and a trustworthy requirement model exist. Test its honest non-audit state. |
| Grades & Archive | proposed | `GradesArchive`, grade ledger tests, transcript records | C2 | Test local ledger, transcript-faithful ledger, what-if scratch work, and reload; scenario scratch work must not mutate saved courses. |
| Forecast accuracy | approved | `ForecastAccuracyPanel`, forecast tests | C2 | Create forecast/evidence, inspect report after grading, reload, and verify absent evidence uses a truthful state. |
| Term rollover | proposed | `TermRollover`, unit tests | C2 | Run rollover on a disposable set of courses; prove completed coursework/grade evidence remains intact and new workspaces are correct. |
| Term retrospective / report | proposed | `TermReportPanel`, report synthesis / route tests | C2/C4 | Generate or compose the readable report from real grades, exam outcomes, notes, materials, and study evidence; check citations/traces and reload. C4 if AI synthesis is not live. |

## 4. The finish-line sequence

This is intentionally a small number of vertical student journeys, not a list
of unrelated tabs. Each future execution brief should select **one package**,
then stop for review as required by the workflow.

### Package A — first-use foundation

1. Empty personal store → Class Center’s truthful cold state.
2. Add a class; choose or explicitly override its type.
3. Import a syllabus into that class, review proposed facts, and apply only
   confirmed rows.
4. Reload. Open Class Hub and ensure the class, syllabus, topics, grade
   categories, assignments, and scoped routes still belong to the same course.

**Exit proof:** no demo facts, no duplicate class, no dropped confirmation, and
every entry point reaches the appropriate scoped/unscoped flow.

### Package B — daily academic loop

1. Add/adjust assignments and topic links.
2. Start a review session, record results, reload, and see only evidence-based
   review/forgetting/signal changes.
3. Exercise Exam Prep with and without the evidence it needs.

**Exit proof:** every card action persists; no review or signal reports a
fictional score, rank, or progress measure.

### Package C — materials to learning output

1. Begin from **Create study material** and choose one output.
2. Select notes, slides, transcript, pasted excerpt, or a reviewed folder file
   inside that specific output flow; no permanent global “Add material” clutter.
3. Generate a study guide, flashcard deck, or revised notes with explicit
   source selection; validate source trace and reload.
4. For flashcards, download and import the `.apkg` into Anki Desktop.

**Exit proof:** no generator runs on empty/general-course knowledge, the notes
baseline remains untouched, and the output’s source set is visible.

### Package D — planning and term learning

1. Use planner and archive from real courses and grades.
2. Confirm the Requirements screen describes planning context rather than
   claiming an official degree audit.
3. Run a safe term rollover and produce a readable, evidence-led term report.

**Exit proof:** shared course records remain coherent across Planner, Class
Center, archive, and the report; nothing silently rewrites a grade or completed
term.

## 5. External configuration checklist

These are not source-code bugs. A surface remains C4 until the relevant live
check passes.

### AI-backed study outputs and lecture analysis

- Confirm `study-tools` and `lecture-analysis` are deployed to the current
  Supabase project.
- Confirm the provider secrets are present **without exposing their values**:
  `ANTHROPIC_API_KEY` when Anthropic is selected, or `OPENAI_API_KEY` when the
  provider is OpenAI; `OPENAI_EMBEDDING_API_KEY` is optional retrieval quality.
- Sign in with the actual account, process a real class material, and record a
  non-sensitive success/failure result. The code must show an actionable error
  instead of pretending generation succeeded.

### Optional Google Drive material folder

- Apply the source-connection migration.
- Deploy `google-drive-materials`.
- Enable Google Drive API; add the exact Supabase callback URL and permitted
  app origin documented in `supabase/DEPLOY.md`.
- Set the Drive OAuth client ID/secret server-side, connect one non-sensitive
  test folder, and review/accept a file.

### Calendar review

- Keep Calendar read-only.
- Verify the deployed client has the configured OAuth client ID, approved
  redirect URI, permitted origin, and read-only Calendar scope.
- Connect a real calendar, confirm today’s events appear in the correct local
  date/time zone, then disconnect and confirm the app shows the recovery state.

## 6. Explicitly not part of the finish line

- Official graduation audit or false Requirements completion mathematics.
- A course substitute catalog without a licensed/current source.
- Automatic Google Drive import; a student must review and accept material.
- A generator that uses general model knowledge to fill missing course facts.
- Any deletion of user-annotated app UI merely to conform to an older mockup.

## 7. First router target

**Start Package A with the Class Hub / syllabus-import page-level audit.** It
unlocks a real current-term class for the rest of the journey and lets us prove
the crucial “set up my actual classes and get syllabi in” path before chasing
downstream intelligence.

The first brief should be bounded to the Class Hub and syllabus import/re-import
student journey, should name its exact mockups/decision documents, and should
not fold Materials generation, Google Drive, or Requirements into the same
execution pass.
