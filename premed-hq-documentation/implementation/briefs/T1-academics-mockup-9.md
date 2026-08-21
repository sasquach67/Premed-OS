# T1 · Academics — output-first Materials intake

**Stage:** A · NOT DRAWN  
**Status:** Mockup brief only. Draw the newly ruled source-intake interaction;
do not modify `src/`, storage, prompts, provider calls, or configuration in
this pass.

## 0. Protected baseline — app annotations win

This pass must preserve every behaviour or visual correction made through an
app annotation. An annotation is a later product ruling, not an implementation
accident for a mockup to erase.

- The mockup remains authoritative for the target layout, grouping, states, and
  interaction once it is reconciled with those rulings.
- If an existing annotation-backed app behaviour differs from the old drawing,
  do **not** remove or redraw it away silently. Draw around it, record the
  conflict in the paired decision file, and leave the eventual build brief to
  reconcile the two explicitly.
- Preserve existing controls and behaviours unless a later, explicit ruling
  names their replacement. “Make it match the mockup” is not permission to
  delete an annotated improvement.

The present direct ruling is one such replacement: Materials must not keep a
permanent **Add material** control as the primary way into generation. The
student begins from the artifact they want, then supplies or selects eligible
sources in that contextual flow.

## 1. Fidelity audit — before this brief

### A. Spec → paper

The existing Materials drawing covers source ownership, a catalog, source-map
selection, the output triad, bounded textbook excerpts, a Revised Notes
baseline, and result/recovery states. The following ruled interaction has no
paper surface:

| Ruled behaviour | Missing paper surface |
| --- | --- |
| A student starts with **Generate study guide**, **Generate flashcards**, or **Revised Notes**, then is guided to choose or add the material that may ground that one artifact. | An output-first intake state for each artifact, with the selected artifact held as context while sources are selected or added. |
| Source-input paths are contextual rather than persistent toolbar clutter: existing eligible material, student notes, a lecture transcript, instructor/course material, or a bounded pasted textbook excerpt. | A single intake grammar showing all five paths, selected-source provenance, and the honest difference between ready text and an uploaded file that has not produced usable text. |
| Revised Notes repairs the student’s own notes; the student must choose a baseline note before generation. | The output-first Revised Notes path handing off to the existing baseline and no-baseline recovery views rather than bypassing them. |
| Student-supplied material is the only evidence. A study artifact cannot quietly fill a source gap with general course knowledge. | An in-flow no-eligible-source recovery that preserves the selected output and points to an input path without fabricating course content. |

Do **not** redraw these already present, settled surfaces:

- `textbook-excerpt`, `revised-notes-baseline`, and
  `revised-notes-no-baseline` in `academics-materials-extensions`;
- the Materials catalog, reader, folder, watched-note, Canvas, and assessment
  flows;
- lecture-capture evidence/proposal states; and
- the generated result, Anki-export, and provider-unavailable states.

The missing work is the front door and handoff between them, not a new
Materials tab or a second generator family.

### B. Mockup → app

| Surface | Existing app evidence | Translation result |
| --- | --- | --- |
| Materials header actions | `src/components/academics/ClassHub.tsx` | It currently exposes persistent `Add material`, `Paste excerpt`, and direct Study Guide / Flashcards controls. This diverges from the new output-first ruling. |
| Study Guide and Flashcards generation | `StudyToolActions` in `ClassHub.tsx` | Behaviour exists, but direct actions currently collect from available chunks instead of first presenting the artifact-scoped source picker drawn here. |
| Revised Notes | `src/components/academics/RevisedNotesPanel.tsx`, `src/lib/academics/generateRevisedNotes.ts` | The baseline repair feature exists below the Materials shelf. Its discovery and entry point do not match the newly ruled contextual intake. Preserve its baseline/source-only contract. |
| Existing Materials mockup | `mockup-lab/01-academics/academics-materials-extensions.{html,md}` | It contains `generate` then `artifact-choice`, which is the reverse of the new start point. It does not show the output held while sources are added. |

#### Measured primary record surface — existing baseline

The previous Materials fidelity pass measured the running dark page at
`#/academics/classes/demo-course-biol252?classTab=materials`, using
`getComputedStyle`.

| Surface | Mockup value | Running app value |
| --- | --- | --- |
| Page canvas | `#211e1a` | `rgb(33, 30, 26)` / `#211e1a` |
| Solid content panel | `#2b2722`; `#3c352d` border; `16px` radius | `rgb(43, 39, 34)`; `rgb(60, 53, 45)` border; `16px` |
| Dense nested object | `#322e28`; `#3c352d` border; `13px` radius | `rgb(50, 46, 40)`; `rgb(60, 53, 45)` border; `13px` |

This ladder is a protected visual baseline. New drawings continue it; a later
implementation pass measures both themes and must not reset any annotation-made
correction in pursuit of an older screenshot.

### C. Already built — preserve, do not rebuild

- Class Hub’s five-tab grammar, Materials ownership markers, material catalog,
  and the distinction between **Materials** (notes on material) and **Notes**
  (notes about the class).
- Academic-file/source-chunk provenance, source-only generation policy,
  source traces, and one-way Anki export.
- The bounded-textbook-excerpt and baseline Revised Notes foundation from
  `db0509b`.
- The source-grounded Revised Notes generator from `00036a5`.
- Any app-annotation changes made after those commits, whether or not an older
  mockup matches them exactly.

### D. Gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-materials-extensions.html` **YES**. That permits the
eventual implementation, but this pass stops at the first failed stage and
draws only. Do not edit the manifest.

### E. Decision records

`academics-materials-extensions.md` records both behaviour and appearance for
the existing source map and output triad. It cannot decide a state that has not
been drawn: the artifact-first intake, persistent output context, ready versus
unprocessed-source recovery, and toolbar hierarchy are missing. This is stage
**A**, not a decision-only stage B.

### F. Integrations and services this tab owns

| Dependency | Classification | Student-visible state today | Required follow-up |
| --- | --- | --- |
| Artifact-scoped source-intake UI | **CODE MISSING** | The user sees persistent add/source controls and direct generator actions. | Draw the state here; a later one-pass build wires each action to it. |
| Source-grounded study-tools endpoint | **CODE BUILT AND CONFIGURED; end-to-end proof pending** | Existing generator UI can call the protected server route, but this audit has not run a signed-in user’s real material through each artifact. | Later build/promotion verifies a signed-in source-only run and its honest unavailable state; do not ask for a new browser key or expose a secret. |
| File, transcript, and bounded-excerpt data | **PARTIALLY BUILT** | Processed material and pasted text have routes; a bare uploaded file is not evidence until readable text is available. | The later build makes readiness explicit and persists any missing artifact-intake linkage. |

No external search, course lookup, textbook retrieval, or additional provider
is part of this drawing.

## 2. References — read before drawing

- `premed-hq-documentation/tabs/01-academics.md` §4.1-I, §4.1-Q, §6.2,
  §6.7, §6.12, §6.14, and the Materials-versus-Notes distinction.
- `mockup-lab/01-academics/academics-materials-extensions.{html,md}` — reuse
  its existing catalog, source-map, output, baseline, and result grammar.
- `mockup-lab/01-academics/academics-lecture-capture.{html,md}` — preserve the
  distinct lecture-evidence/proposal model; do not duplicate it.
- `mockup-lab/_shared/_visual-recipes.md`,
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`, and
  `premed-hq-documentation/implementation/component-inventory.md`.
- `src/components/academics/ClassHub.tsx`,
  `src/components/academics/RevisedNotesPanel.tsx`, and
  `src/lib/academics/generateRevisedNotes.ts` — audit/reference only; do not
  edit them in this stage.

## 3. DRAW — output-first intake inside Materials

Extend `academics-materials-extensions` and its paired decision record. Keep
the registry page `status:"proposed"`; add named product views under the same
Materials entry. Do not add a sixth class tab, a permanent strip of generator
subtabs, or a standalone generator page.

### 3.1 One shared interaction model

Every treatment must use the same product grammar:

1. The student chooses **Study Guide**, **Flashcards**, or **Revised Notes**
   from the existing contextual action area. The chosen output becomes the
   visible task context — it is not a later hidden option.
2. The intake surface asks for selected sources. It offers only:
   - existing eligible material already filed to this class;
   - **My notes**;
   - pasted or imported **lecture transcript**;
   - instructor/course material such as slides or a handout; and
   - a named, bounded **pasted textbook excerpt**.
3. Every selected item shows its ownership and readiness. A file with no
   extractable/pasted text is visibly **not ready for generation** and offers a
   recovery; it must not be depicted as usable evidence.
4. The student can remove a selected source without losing the chosen output.
   No source is silently added, searched for, or inferred.
5. Study Guide and Flashcards continue to their existing generated states.
   Revised Notes continues to the existing baseline choice; without `My notes`,
   it reaches the existing no-baseline recovery. Revised Notes never overwrites
   the original note.

The input prompt is contextual, not a cluttered header. **Do not draw a
persistent Add material button.** File/paste actions appear after the student
has chosen an artifact, plus within the contextual source picker. Keep
`Import syllabus` separate: it is class setup, not study-artifact intake.

### 3.2 Three real treatments — same behaviour, different hierarchy

Draw all three variants for the new product view family. They are legitimate
layout decisions, not three cosmetic skins.

#### Variant A — anchored source map

The selected output is a compact fixed destination at the right of the
existing source-map canvas. Existing and newly added source nodes converge into
it. Source-input actions live in a narrow intake rail below the node field;
the map remains the visual explanation of grounding. This is the continuity
treatment with the existing Materials extensions design.

#### Variant B — artifact-first workbench

The chosen output occupies a small header anchor above a collection workbench.
Five input paths appear as varied, compact source objects around one selected
source tray — not five matching long rows. The tray is visually dominant and
the artifact remains visible as a destination badge, so the student never
forgets what they are making.

#### Variant C — contextual intake sheet

The Materials shelf remains legible behind a bounded solid-with-depth intake
sheet. The sheet is entered from the chosen output, carries its label and
source count, and uses a compact source stack plus a single “add a source”
chooser. It is a contextual view, not a modal permission wall or a permanent
tab bar. At narrow width it becomes the full content column while preserving
source order and the chosen-output context.

For each variant, draw these named product views:

- `study-guide-intake` — selected artifact plus a mix of ready and unselected
  eligible sources;
- `flashcards-intake` — same model, explicitly leading toward the existing
  one-way export result rather than in-app scheduling;
- `revised-notes-intake` — the same source picker, including the route to
  baseline selection and the no-baseline recovery;
- `source-not-ready` — one selected course file lacks usable text; preserve its
  identity and show the actual recovery path, not an invented preview; and
- `no-eligible-source` — no usable material yet, with the selected output
  retained and only the allowed input paths offered.

Use only student/course-supplied, visibly illustrative source labels. Do not
invent lecture facts, grades, readiness, coverage, model confidence, scores,
rankings, or progress values.

### 3.3 Paired decision record and registry

Update both mirrored copies after drawing. The paired `.md` must record, for
each treatment:

- its behaviour and source-boundary rules;
- exact hierarchy, layout, source geometry, responsive order, and why that
  treatment makes the selected artifact persistently visible;
- why input affordances are contextual instead of a permanent Materials header
  button row;
- the literal warm-dark surface ladder, focus treatment, quiet motion, and
  reduced-motion behaviour; and
- every annotation-backed app decision that the drawing deliberately preserves
  or requires a later reconciliation to change.

Register all product-view keys in both `variant-lab.html` mirrors, under the
existing Materials entry, with `status:"proposed"` intact. The app’s class-tab
navigation must not gain new labels.

## 4. Appearance and interaction constraints

- Continue the literal ladder: page `#211e1a` → solid `#2b2722` panel →
  `#322e28` dense object, `#3c352d` borders, `16px` panels, `13px` inner
  objects. Glass belongs only to a surface floating above the banner/content;
  dense intake and source objects stay solid-with-depth.
- Reuse the Material source map, compact object tiles, output triad, and
  paper-plus-provenance result language. Do not turn source choice into a wall
  of identical rectangles, a generic upload dashboard, or a row of persistent
  sub-tabs.
- Keep a clear 10–12px icon/label rhythm and the established course-blue only
  for active source/output context. Do not introduce a new palette, font,
  radius scale, or icon set.
- All controls need focus-visible states. Hover is quiet; transitions use the
  shared short ease-out curve and reduced motion resolves directly. Do not
  animate width, layout, or content reflow.
- Preserve narrow layouts without internal scroll regions. A source’s
  provenance and selected/not-ready state must remain adjacent to its identity.

## 5. Do not break / do not decide silently

- Do not modify `src/`, tests, Edge Functions, model prompts, API calls,
  migrations, localStorage, secrets, or Supabase configuration.
- Do not delete, hide, or reverse an app-annotation change merely because the
  old mockup differs. Record the reconciliation instead.
- Do not collapse Revised Notes into Study Guide, or move Revised Notes out of
  Materials. Class Notes remains the place for student-confirmed notes **about**
  the course/professor.
- Do not draw whole-textbook upload/search, remote source discovery, Canvas
  tokens, general-knowledge fill, flashcard review/scheduling, or a second
  Anki integration.
- Do not change the existing syllabus-import entry point or make it look like
  a study-artifact input path.
- The design system wins over inline mockup values. The mirror copies must
  remain byte-identical after drawing.

## 6. Done when

- `academics-materials-extensions.html` exposes exactly the five additional
  named views in §3.2, and each renders Variant A/B/C through the lab’s normal
  variant switcher.
- In every treatment, choosing an output happens before source intake; no
  permanent `Add material` header action remains in the new Materials
  composition; and `Import syllabus` remains separate.
- The paired `.md` documents both behaviour **and** appearance for all three
  treatments and explicitly records the annotation-protection rule.
- `variant-lab.html` registers all five views under Materials and keeps their
  page `status:"proposed"`.
- Direct query navigation renders every new view without console error, both
  mirror copies are byte-identical, and `git diff --check` passes.
- Grep proves the new states contain no `score`, `ranking`, `confidence`,
  `progress`, `schedule`, `Canvas token`, full-textbook upload, or external
  source lookup claim.
- No `src/` file changes appear in this drawing commit.

## 7. Commit

`docs(mockups): draw output-first Academics material intake`

Commit only the two mirrored mockup HTML files, their paired decision records,
and both `variant-lab.html` registrations. Keep unrelated working-tree changes
separate.

## 8. Next stage — explicitly out of scope

Andy chooses a treatment. The paired decision record then receives the exact
approved hierarchy and wording, including any explicit annotation
reconciliation. Rerun the tab-brief generator after that. If the decision
record is complete, it lands on **C · DECIDED, NOT BUILT** for a single
frontend-and-backend implementation brief; if not, it lands on **B** and
stops. No code is authorised by this brief.
