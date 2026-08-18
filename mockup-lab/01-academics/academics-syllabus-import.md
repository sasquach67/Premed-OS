# Academics · Syllabus Import — decisions

**Status:** PROPOSED · Stage-B decision record · **translated to the app in `T1-academics-fidelity.md`**
**Source:** `academics-syllabus-import.html` — 4 frames: upload · review · re-import + nothing-parsed · wrong document (frame 4 added under `T1-academics-mockup-2.md`)

## Product views

| View | Job |
|---|---|
| Upload and read | Accept a syllabus file or pasted text and name the local parse work while it is happening. |
| Review before apply | Let the student inspect every extracted class fact before any record is written. |
| Re-import diff | Compare a newer syllabus to confirmed records without silently replacing student corrections. |
| Nothing parsed | Keep the file and route directly into manual entry instead of stranding the student. |
| Wrong document | Say the upload isn't a syllabus and route it to Materials, where it belongs. |

## Behaviour

- All four entry paths use one temporary Import → Parse → Review → Apply flow:
  cold start creates the class; Class Hub Materials, Class Center overflow, and
  Add a class attach to the existing course. Scoped entries replace only the
  class-identity group with a static course header and never create a second
  identity.
- This is one screen changing state, not a multi-step wizard. The temporary
  banner says that nothing has been saved or that review is pending, never a
  numbered step.
- Upload and paste are equal first-class inputs. Multiple related course files
  may be read into one proposal. Reading is named, cancellable, and does not
  write a record.
- Review happens before Apply. Each proposed field retains quoted source text;
  students may correct individual items; grade weights visibly validate to a
  complete total; partial extraction preserves what worked and surfaces a
  manual entry route for what did not.
- Re-import is a three-way diff by stable identity. Added rows default to
  **Accept**. Changed and removed rows default to **Keep mine**, visibly shown
  as the selected action. Unchanged items remain collapsed and counted.
  Removed is a proposed record change, never automatic deletion.
- Applying accepted changes happens once and states its exact consequence.
  Confirmed student data is not overwritten by a newer file without an
  explicit acceptance.
- When nothing can be read, the file remains locally attached to the class and
  the student can enter details manually, paste text, or try another file.
  There is no bare error or forced restart.
- **Wrong document is a separate diagnosis from nothing-parsed.** When the file
  reads cleanly but is not a syllabus — a problem set, a slide deck — the
  screen says so, names what it looked for and did not find, and offers
  **filing it in Materials** as the primary route, because that is where the
  file belongs. The detection is a proposal like every other one on this
  screen: an explicit override reviews it as a syllabus anyway, since some
  syllabi genuinely carry no weights table. The file is retained either way,
  and nothing is written to the class.

## Appearance

- The temporary mode begins with a shallow, layered Academics banner. A quiet
  cancel/back affordance sits above the title; the mode tag communicates state
  rather than a wizard count. The banner may use the shared glass treatment
  only where it floats over its own art.
- **Upload** gives the dropzone the most visual weight, centered in a narrow
  reading column. Its equal paste/manual paths sit beneath the source input;
  the supportive MascotNote is secondary. Drag feedback lifts only the
  dropzone. Reading uses named rows and a small determinate strip, never an
  unexplained spinner.
- **Review** uses an uneven two-column workspace. On the left, flagged groups
  are expanded with amber evidence and source quotations; clean groups collapse
  to one factual summary. On the right, a sticky solid-with-depth Apply rail
  lists the exact records the student will add or change. This makes inspection
  more prominent than completion.
- **Re-import** is a compact editorial diff, not a table wall: status tag,
  old-to-new value, and two explicit choices share each row. The selected
  default is visible. A small explanatory note appears only where accepting a
  change affects a dependent plan.
- **Nothing parsed** is a contained recovery card inside the same review
  composition. It keeps the student's file and makes the next three routes
  visible, rather than replacing the whole screen with an error state.
- **Wrong document** uses the same containment and the same Apply rail, but
  **must not reuse the nothing-parsed treatment.** Nothing failed: the file was
  read perfectly and simply isn't a syllabus, so the card takes the Academics
  accent rather than the warning tone that marks a parse failure. It carries a
  short did-not-find list — weights, exam dates, a schedule, an instructor
  block — with the one thing it *did* find shown in accent as the reason
  Materials is the better home. The Apply rail stays visible and reads
  **"Nothing to apply"** with explicit zero counts, because a rail that
  vanished would hide the fact that this import writes nothing.
- Dropzones, review groups, evidence quotes, diff rows, and the Apply rail are
  solid-with-depth using the shared Academics tokens. They do not use glass.
  Focus is visible for keyboard controls; confidence and change state use text
  and status labels in addition to color. Motion honors reduced-motion.

## Data and privacy boundary

- The source file stays local to the student's device for retention and
  re-import. The interface must not imply a shared document library or
  cross-device file storage.
- Any shared learning may use extracted structure only, never the uploaded
  document or another student's grades.
- Generated study material can use only student-supplied, selected course
  sources and retains reachable provenance. No source selection means no
  generated course content.

## Component translation

- Reuse `AnimatedFileUpload` for the source input, `MascotNote` for the
  compact guidance/recovery note, and the existing dialog/workspace owner for
  the temporary flow. Do not fork another upload or review wizard.
- Review groups are configured `InteractiveCard`/`Collapsible` compositions;
  source evidence remains attached to the field it supports. The Apply rail is
  a configured solid card, not a new sidebar system.
- The existing re-import diff engine owns matching and default actions. The
  interface only renders those actions; it does not recreate diff logic.

## States

- Cold-start, scoped-class, and re-import entries share the same composition;
  only the identity block differs.
- A low-confidence extract, an incomplete weight total, and a missing field
  each state the exact reason and preserve manual correction.
- Added, changed, removed, and unchanged re-import rows preserve their distinct
  defaults and keep/accept meaning.
- The no-parse route retains the file and returns the student to a useful
  manual path without discarding partial work.
- The wrong-document route retains the file, writes no class record, and keeps
  an explicit override back into ordinary review.

## Built

Translated from the dialog to the ruled temporary full-screen mode in
`src/components/academics/SyllabusImportMode.tsx`, replacing the former
`SyllabusImportDialog`. Verified in the running app: `1fr 372px` split
resolving to `700px 372px`, sticky rail at 372px, native `<details>` gone,
groups in the ruled order collapsing on clean and expanding on flagged, and
the wrong-document card rendering in the Academics accent with a zeroed Apply
rail. Both themes and keyboard traversal checked.

One open shell question, not owned by this surface: the Academics page header
and its Daily/Planning tabs remain visible above the mode, because
`ClassCenter` returns sub-views the same way it returns `ClassHub` and
`ExamPrepMode`. §4.1-M-a asks import to behave *"like exam prep mode"*, so
this matches the shipped precedent — but if the mode should suppress the pillar
chrome, that is a shell decision affecting exam prep equally.
