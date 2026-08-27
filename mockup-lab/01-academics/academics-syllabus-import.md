# Academics · Syllabus Import — decisions

**Status:** APPROVED by Andy on August 26, 2026 · Stage-B decision record; cold Add-class handoff revised August 27, 2026.
**Source:** `academics-syllabus-import.html` — cold import dialog · class-details handoff · record review · re-import + recovery · wrong document.

## Product views

| View | Job |
|---|---|
| Add-class import dialog | Accept a syllabus file or pasted text without leaving Class Center. This is the default first surface for Add class. |
| Class-details handoff | After a readable cold import, open the existing class-details sheet with attributable identity/logistics prefilled; the student completes the remaining fields and chooses/reviews the class type before saving. |
| Review before apply | Let the student inspect every extracted class fact before any record is written. |
| Re-import diff | Compare a newer syllabus to confirmed records without silently replacing student corrections. |
| Nothing parsed | Keep the file and route directly into manual entry instead of stranding the student. |
| Wrong document | Say the upload isn't a syllabus and route it to Materials, where it belongs. |

## Behaviour

- A cold **Add class** starts in a focused Import dialog. Drop or paste the
  source there; a readable proposal closes that dialog and opens the existing
  class-details sheet with course identity and attributable meeting facts
  prefilled. The student completes or edits the fields, chooses the class type,
  and presses **Add class**. No course, workspace, or syllabus record is
  written before that final confirmation.
- Class Hub Materials and Class Center overflow entries remain scoped to an
  existing course and use the temporary review/re-import flow. They never
  create a second identity. The cold handoff is a short two-surface decision,
  not a numbered wizard.
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

- The cold entry is a compact, solid dialog over the Class Center context. The
  underlying page remains recognizable; the title, `Nothing saved` tag,
  dropzone, paste path, and `Read syllabus` action carry the hierarchy. A
  quiet `Enter details manually` path remains visible.
- The post-read state is the existing solid class-details sheet, not a second
  import dashboard. A short source strip identifies the file and extraction
  count; fields found in the syllabus are populated in the normal form, while
  missing values stay editable. The class-type chips retain their proposal
  semantics: a syllabus signal can be suggested, never silently persisted.
- **Upload** gives the dropzone the most visual weight, centered in the import
  dialog. Its equal paste/manual paths sit beneath the source input;
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

- Reuse `AnimatedFileUpload` for the source input and the existing
  `ClassEditorDialog` for the details handoff. The cold import dialog is a
  focused entry surface, not another upload wizard; scoped review continues
  to use `SyllabusImportMode`.
- Review groups are configured `InteractiveCard`/`Collapsible` compositions;
  source evidence remains attached to the field it supports. The Apply rail is
  a configured solid card, not a new sidebar system.
- The existing re-import diff engine owns matching and default actions. The
  interface only renders those actions; it does not recreate diff logic.

## States

- Cold-start uses import dialog → class-details handoff. Scoped-class and
  re-import entries use the existing review composition; only their identity
  scope differs.
- A low-confidence extract, an incomplete weight total, and a missing field
  each state the exact reason and preserve manual correction.
- Added, changed, removed, and unchanged re-import rows preserve their distinct
  defaults and keep/accept meaning.
- The no-parse route retains the file and returns the student to a useful
  manual path without discarding partial work.
- The wrong-document route retains the file, writes no class record, and keeps
  an explicit override back into ordinary review.

## Build status

The cold Add-class handoff is implemented in
`src/components/academics/SyllabusImportDialog.tsx` and
`src/components/academics/ClassCenter.tsx`: import opens as a focused dialog,
then a readable proposal opens the existing class-details sheet with
identity/logistics prefilled and class-type suggestion evidence visible. The
existing full-screen `SyllabusImportMode` remains for scoped review/re-import.
The app build passes; live visual verification of the revised cold handoff is
still required before this surface can be called BUILT.

Scoped imports still use the temporary mode shell; the cold import dialog
deliberately keeps the Class Center context visible so the student understands
where the new class will land.

## Action hierarchy — ruled 2026-08-27 (Andy)

The upload step previously put all three actions on one stretched footer row, so
`Enter details manually`, `Cancel` and `Read syllabus` read as three equal
choices. They are not equal.

**The ruled hierarchy, top to bottom:**

1. **`Read syllabus` is the primary action, alone on the upper action line**,
   right-aligned, carrying the accent fill. The local-first note — *"Reading
   happens on this device. Review comes before save."* — sits at the left of the
   same line, so the reassurance is read with the action it qualifies.
2. **`Enter details manually` is the larger left secondary** on the line beneath:
   full `.btn` size on `var(--muted)`. It is a real route, not a footnote — a
   student without a readable file must not feel pushed out of the flow.
3. **`Cancel` is a smaller quiet button on the right**: `.btn.sm.ghost`,
   transparent, `11.5px`. Leaving is always available and never competes with
   the two productive actions.

Measured in the lab: `Read syllabus` 108×42 accent; `Enter details manually`
158×42 on muted; `Cancel` 59×32 transparent. The action line keeps the `1px`
top rule; the footer beneath carries no second rule, so the two lines read as
one block rather than two panels.

**Behaviour is unchanged.** Reading still happens on this device, nothing is
saved before the reviewed details are confirmed, and the manual route still
reaches the same class-details sheet.
