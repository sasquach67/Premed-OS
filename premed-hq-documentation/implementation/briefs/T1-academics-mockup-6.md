# T1 · Academics — folder intake and watched-note mapping

**Stage:** A · NOT DRAWN  
**Status:** Mockup-only brief. Do not edit `src/`, storage, migrations, edge functions, OAuth, provider secrets, or the build manifest in this pass.  
**Why now:** Materials already accepts one or several local files, but its next two ruled ingestion paths have no reviewable surface: filing a local course folder without inventing placement, and one-way ingestion from a student's own auto-backup folder.

## 1. Audit before this brief

### A. Spec → paper

The following ruled Academics feature groups still lack a reachable mockup surface. A sentence in a class-hub description is not a surface: the student must be able to see the state, the decision, and the recovery.

| Ruled feature group | Spec source | Existing paper coverage | Gap |
|---|---|---|---|
| Bulk local course-folder intake and positional filing | `tabs/01-academics.md` §4.1-A, §4.1-I Materials; acceptance criteria “Organization” and “Coverage ledger” | `academics-materials-extensions.html` has a single-file Add Material affordance and the catalog has an Unassigned treatment | No folder tree, proposed class/week placement, confirm-week action, or honest no-match state. This is local intake, not Canvas API work. |
| Watched-folder note ingest and one-time mapping confirmation | §4.1-I “Note ingest — watched folders”; acceptance criterion “Watched-folder note ingest” | `academics-class-hub.html` mentions GoodNotes Auto Backup in descriptive copy; `academics-materials-extensions.html` can show a manually-added note | No provider/setup handoff, inferred path map, confirm-once choice, new/unguessable-folder exception, or “Review each import instead” state. |
| Professor evidence model | §3 data model; §6.8 `ProfessorModel` | No paper surface | No own-graded-work evidence view, sample-size gate, or dormant/silent state. |
| Concept canvas in the recall runner | §4.1-K / §4.1-I and acceptance criteria “Surface placement” | No paper surface | No draw/import map, labelled-edge composition, or proposed topic-link confirmation. |
| Writing and reading work surfaces | `PaperDraft` / `AssignedReading` model and class-type rules | `academics-class-types.html` establishes STEM, writing, and general configurations | No detailed Draft or Readings workspace, including empty, active, and status states. |
| Exam/resource catalog take-and-return loop | §4.1-P | Materials catalog covers source and permission labels | No timed take state, score entry, `AcademicMistake` handoff, or historical-scope evidence state. |
| Transcript-fidelity enrollment capture and export | §4.2-D; acceptance criteria “Transcript-fidelity capture” | `academics-grades-archive.html` covers ledger, GPA, and what-if | No exact-as-printed enrollment/edit state, optional transcript image, or visible export surface. |

The material reader and searchable lecture index were drawn in `c38738f`; they are no longer paper gaps. Existing mockup coverage remains for syllabus/re-import, source-grounded outputs, calendar-review handoff, lecture-capture review, topic linking, exam prep, grades, planner, requirements, study method, forgetting curve, grade decisions, and term rollover.

**First gap selected:** the two related intake paths in the first two rows. They both end in Materials, use the same course/week placement vocabulary, and share the same essential restraint: show a proposal, never silently file or overwrite. The five later gaps remain outside this pass.

### B. Mockup → app

| Mockup family | `src/` evidence | Matches the drawing? | Result |
|---|---|---|---|
| Daily / Class Center | `Academics.tsx`, `ClassCenter.tsx` | Behaviour present; old visual translation remains unmeasured | Not rebuilt in this Stage-A pass. |
| Class Hub | `ClassHub.tsx` | Five-tab class page and Materials route now render; full family not fidelity-promoted | Partial / unverified. |
| Materials catalog, manual upload, filters, source-grounded outputs | `MaterialCatalog.tsx`, `ClassHub.tsx`, `RevisedNotesPanel.tsx`, `FlashcardDecks.tsx` | Manual multi-file upload persists locally and unfiled materials remain visible, but neither folder-review nor watched-folder mapping exists | Partial. |
| Syllabus import / re-import | `SyllabusImport.tsx`, `syllabusReimport.ts` | Behaviour exists; older mockup translation has not passed promotion | Unverified. |
| Assignments, review session, class types, exam prep, study method, forgetting curve, learning signals, grade decisions | Corresponding components in `src/components/academics/` | Existing behaviour or screen surface; not individually measured for promotion | Unverified / out of selected gap. |
| Planner, requirements, Grades & Archive, planning decisions/cold start, rollover | Corresponding Academics components | Existing behaviour or screen surface; not individually measured for promotion | Unverified / out of selected gap. |
| Lecture capture / transcript import | `TranscriptImport.tsx` | Paste/upload transcript import exists; audio capture, whole-transcript analysis, and durable searchable index are still unbuilt | Partial. |

#### Measured primary record surface — Aug 21, 2026

Measured in the running dark app at `#/academics/classes/demo-course-biol252?classTab=materials`. Unlike the earlier check, the requested Materials tab now rendered correctly.

| Surface | Mockup value | Running-app `getComputedStyle` value |
|---|---|---|
| Class-page canvas | `.frame` in `academics-class-hub.html`: `#211e1a` | `body`: `rgb(33, 30, 26)` = `#211e1a` |
| Primary Materials panel | `.card` in `academics-materials-extensions.html`: `#2b2722`, `1px #3c352d`, `16px` | Materials catalog article: `rgb(43, 39, 34)` = `#2b2722`, `rgb(60, 53, 45)` = `#3c352d`, `16px` |
| Inner material object | mockup object: solid `#322e28`, `13px` | current file row: `bg-muted/25` = translucent `oklab(... / 0.25)`, `rgb(60, 53, 45)` border, `18.4px` radius |

The page and primary-panel rungs match. The inner-object rung does **not** match the planned solid `#322e28` / 13px object treatment; it is translucent and roomier. That is a later Stage-E fidelity issue, not permission to change app code in this mockup brief.

### C. Already built — do not rebuild

- Manual local material retention and the Materials add path: `1f5d908` (`feat(academics): give course materials a real add path`).
- Grounded artifact foundation: `8ca4d65`.
- Class full-mock / Flashcards V1 and browser `.apkg` export: `d009cb7`, `326a17a`.
- Source-grounded Revised Notes: `00036a5`.
- The material reader and lecture-index paper pass: `c38738f`.

This brief adds no second blob store, source-ownership model, generator, course tab, or Canvas design.

### D. Manifest gate

`BUILD-MANIFEST.md` marks `01-academics/academics-materials-extensions.html` **YES**. The Material views drawn here may later be implemented after Andy reviews them and their companion decision record is complete. Do not edit the manifest.

### E. Decision-file check

`academics-materials-extensions.md` has both Behaviour and Appearance, but neither half decides local-folder placement or watched-folder mapping. `academics-class-hub.md` mentions note ingest but does not provide a dedicated, navigable setup/recovery treatment. The new mockup views must extend the Materials decisions file with both halves; prose-only mention is insufficient.

### F. Integrations and services

| Dependency | Status | What a student sees today | What changes later |
|---|---|---|---|
| Local multi-file material retention | **CODE BUILT** | Select multiple local files; they persist locally and land under Unfiled until the student links a topic. | Folder intake needs a reviewed proposal/confirm model before a later implementation adds any batch classification. |
| Browser directory access | **CODE MISSING** | A normal file picker only; no folder tree or filing preview. | Later backend/frontend work may use user-initiated directory selection where supported, with a plain multi-file fallback. It must never claim background desktop access. |
| GoodNotes / Drive / Dropbox / OneDrive watch | **CODE MISSING** | A student can attach notes manually or paste a GoodNotes transcript. | Later build requires an explicit provider connection and a one-way ingest seam; no GoodNotes API, no browser-side provider secret, and no write-back. |
| Cloud storage / background sync authorization | **CODE MISSING** | No provider account is connected. | The later implementation brief owns the service contract and an Andy checklist only if a real provider OAuth client/secret is required. This screen alone must not imply it is configured. |

Academics cannot reach Stage F: its ruled folder/watch surfaces remain undrawn, and several existing visual surfaces and external dependencies remain unproven.

## 2. Work — draw the next missing paper only

Extend **only** `mockup-lab/01-academics/academics-materials-extensions.html` and its companion `.md`. Keep the existing Class Hub banner, Materials underline, catalog, reader, generation, and lecture-capture routes intact. Do not add a sixth class tab or a new top-level Academics page.

### 2.1 Local folder intake — `?view=folder-intake` and `?view=folder-review`

1. **Folder intake** starts from the existing Materials add affordance. Show a deliberately user-initiated local-folder choice plus the existing individual-file fallback. State plainly that only selected files are read and that the app will not move, rename, or alter the original folder.
2. Use a three-part intake composition rather than a repeated rectangle list:
   - a compact source-tree rail with a chosen folder and its contained file kinds;
   - a central course-position board that aligns proposed file groups with known units/weeks in course order; and
   - a narrow review rail that counts `Ready to file`, `Confirm week`, and `Stay unfiled` without rendering a score or percent.
3. **Folder review** must show individual proposed placements with their evidence: an unmistakable course/week path, a visible `Confirm` action, and a `Keep unfiled` alternative. A file with no unambiguous position remains present and is marked **Confirm week**; no semester-wide Misc / Loose Ends bucket.
4. The default is review-before-apply. No file is auto-filed merely because its name resembles a unit. When the student confirms, the preview says it updates Premed OS's material position only; it never moves or writes the source file.
5. Include a small empty/recovery state: no files usable for this class, unsupported file type, and all files already attached. It must preserve the picked folder and offer individual-file selection, not a blank error screen.

### 2.2 Watched notes — `?view=watch-setup` and `?view=watch-exception`

1. **Watch setup** is a one-way notes intake configuration nested in Materials. It may name GoodNotes Auto Backup, Dropbox, Google Drive, OneDrive, Notability, and OneNote as sources, but must not draw a GoodNotes API or a fake connected account.
2. The primary visual is a **path-to-placement map**: path segments become proposed `class → week → category → document` chips. It needs to make the inference legible at a glance:
   - enrolled-course name matches a class;
   - `Week 3` / `Wk 3` / `W3` maps to a week;
   - `Notes`, `Homework`, and `Practice problems` map to a category;
   - the file is the document.
3. Draw the explicit first confirmation: **Confirm this mapping** and a visible **Review each import instead** switch. Confirmation applies only to the shown pattern; later imports are silent only when that path remains unambiguous.
4. **Watch exception** must show both cases that need a question again: a genuinely new folder (for example a new term's course) and an unguessable segment such as `Misc`. It asks only about that new/unknown level. An unplaceable page enters its recognized class marked **Confirm week**; it is never silently placed into a guessed week or discarded.
5. The surface must state the one-way boundary: read/import only; never edits, moves, deletes, or writes back. Include the setup caveats in a compact help disclosure: GoodNotes backup roots can be fixed (`/Apps/Goodnotes 6` in Dropbox / Drive base level) and GoodNotes for macOS does not provide this Auto Backup path.
6. Do not draw continuous background success as if the service is live. Use neutral setup / awaiting-connection language and a recoverable disconnected state that leaves existing imported notes intact.

### 2.3 Variant decision

Do **not** create decorative A/B/C competition. These are constrained decision flows, and their hierarchy is already ruled:

- Folder intake gets **one** spatial treatment: source tree → proposal board → review rail.
- Watched notes gets **one** mapping treatment: source path → inferred placement chips → one-time confirmation.
- The `folder-review` and `watch-exception` states are behaviourally necessary states within those same treatments, not alternate visual variants.

Record that choice in the companion `.md`: variants would obscure the same safety-critical review boundary rather than test a real product question.

### Binding rules

- Materials remain student-supplied or course-linked. Preserve the existing `Course` / `Mine` / `Generated` ownership markers; watched notes land as `Mine`.
- Keep source and destination separate: the source tree/path shows where the student owns the file; the course-position board shows only Premed OS's proposed metadata.
- No Canvas API, browser-side Canvas fetch, third-party CORS proxy, Canvas token, grade sync, or public course lookup. The existing Calendar route is read-only context only and is not part of this work.
- No fabricated file content, real personal directory path, false success, score, ranking, composite, confidence percentage, or progress bar (U-9).
- No automatic overwrite. Confirmation updates only accepted filing metadata; original source files and already-linked material survive unchanged.
- Glass stays in the shared banner only. Intake, placement, and setup surfaces are solid-with-depth. Use tokens in later app work; mockup CSS follows `_visual-recipes.md` literally.
- Preserve keyboard focus through source selection, proposed placement, confirmation, switch, and recovery actions. Reduced motion resolves directly; no movement is needed to understand a placement.

## References

- `premed-hq-documentation/tabs/01-academics.md` §4.1-A, §4.1-I Materials (especially “Note ingest — watched folders”), §6.3–§6.4, acceptance criteria “Organization,” “Coverage ledger,” and “Watched-folder note ingest.”
- `mockup-lab/01-academics/academics-materials-extensions.{html,md}`.
- `mockup-lab/01-academics/academics-class-hub.{html,md}` for the shared class hierarchy and existing descriptive note-ingest ruling.
- `mockup-lab/_shared/_visual-recipes.md` for literal warm-dark ladder, motion, focus, and responsive rules.
- `premed-hq-documentation/implementation/component-inventory.md` (`Animated File Upload`, `ResourceGrid`, `DocEmbed`, `Tabs`, `EmptyState`, `InfoTip`, `Collapsible`).
- `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`.
- `src/components/academics/ClassHub.tsx`, `MaterialCatalog.tsx`, and `src/lib/academics/coverage.ts` as existing behaviour to preserve, not drawing instructions.

## Do not break

- Do not edit `src/`, storage, migrations, edge functions, OAuth, manifest rows, or other mockup families in this pass.
- Do not replace the manual local multi-file add path; folder selection is an additional, explicit entry option with an individual-file fallback.
- Do not make hidden/provider access sound automatic. A provider connection has no live code today.
- Do not use a full-screen setup wizard, a sixth class tab, a separate “Notes Sync” application, or a duplicate Materials catalog.
- Do not turn a descriptive mockup into a claim that the student has connected Drive, Dropbox, GoodNotes, Canvas, or an account.
- Do not add synthetic course names, live-looking personal files, or a generic directory browser. Prototype examples must be visibly illustrative and self-contained.

## Done when

- [ ] `academics-materials-extensions.html` exposes `folder-intake`, `folder-review`, `watch-setup`, and `watch-exception` through `?view=` without breaking the existing states.
- [ ] `variant-lab.html` registers those views as `proposed`; they are reachable at desktop and narrow widths.
- [ ] The companion `.md` adds both **Behaviour** and **Appearance**, including the literal page `#211e1a` → panel `#2b2722` → inner-object `#322e28` / `#262320` ladder, `#3c352d` borders, 16px panel and 13px inner-object radii, and desktop/mobile hierarchy.
- [ ] Folder review visibly offers `Confirm`, `Keep unfiled`, and `Confirm week`; it contains no auto-file / overwrite claim and no Misc / Loose Ends bucket.
- [ ] Watch setup visibly offers one-way intake, inferred path mapping, confirm-once, `Review each import instead`, and an exception state for both new course and unguessable level.
- [ ] `rg -n -i 'Canvas token|Canvas API|write back|auto-filed|auto overwrite|miscellaneous|loose ends|confidence score|likely on the exam' mockup-lab/01-academics/academics-materials-extensions.*` finds no new forbidden product claim. Permitted explanatory text may say “never writes back” only to state the one-way boundary.
- [ ] `git diff --check` passes and the diff contains no `src/`, service, OAuth, migration, or manifest change.
- [ ] Focus and reduced-motion notes are recorded in the companion decision file.

## Commit

`docs(academics): brief folder intake and watched-note mapping mockups`

Commit only this brief. Keep unrelated working-tree changes separate.

## Next stage — not in this brief

After this mockup pass is drawn and decided, re-run `TAB-BRIEF-PROMPT.md`. It must first find the next remaining undrawn group—Professor evidence model, concept canvas, writing/reading work surfaces, exam take-and-return, or transcript-fidelity capture/export—and remain at Stage A. It must not implement folder intake or watched notes until every ruled Academics feature is on paper and its decision record is complete.
