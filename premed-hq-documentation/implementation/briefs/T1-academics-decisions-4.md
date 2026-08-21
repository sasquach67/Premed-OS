# T1 · Academics — output-first Materials intake decision

**Stage:** B · DRAWN, NOT DECIDED  
**Status:** decision brief only. Do not modify `src/`, persistence, prompts,
Edge Functions, or provider configuration in this pass.

## 0. Outcome and protected ruling

Choose one visual treatment for the output-first Materials intake family before
anything is built. The result must preserve later app annotations: they are
product rulings, not implementation drift to erase for screenshot fidelity.

The already-settled interaction is not being re-decided:

1. A student starts with **Generate study guide**, **Generate flashcards**, or
   **Revised Notes**.
2. That action opens an artifact-contextual source intake view. The requested
   artifact remains visible while the student selects or adds source material.
3. There is no permanent **Add material** generator control in the Materials
   header. `Import syllabus` remains class setup.
4. Revised Notes remains in **Materials**, is based on the student-selected
   note, and never overwrites that note. Notes *about the class* remain in the
   class **Notes** tab.

## 1. Step-1 audit

### A. Spec → paper

For the active Materials amendment, all newly ruled behaviour now has a paper
surface:

| Ruled behaviour | Paper evidence |
| --- | --- |
| Artifact-first entry for Study Guide, Flashcards, and Revised Notes | `study-guide-intake`, `flashcards-intake`, `revised-notes-intake` |
| Only class/student-supplied, visibly owned sources may ground an artifact | All three intake views show source identity, ownership, readiness, and a selected-source tray |
| A file without readable/pasted text cannot silently become evidence | `source-not-ready` preserves the file and offers only readable-text or alternate-source recovery |
| No usable source never produces a made-up output | `no-eligible-source` holds the requested artifact and offers only allowed input paths |
| Revised Notes needs the student's notes as a baseline | `revised-notes-intake` routes to the existing baseline/no-baseline states |
| Flashcards export one-way to Anki, without card review or scheduling here | `flashcards-intake` leads to the existing one-way export path |

No U-9 score, ranking, invented readiness, progress bar, starter deck, full
textbook upload, or external course lookup is drawn. The remaining question is
layout hierarchy, not a missing ruled state, so stage A passes.

### B. Mockup → app

| Surface | Current app evidence | Match? |
| --- | --- | --- |
| Materials entry area | `ClassHub.tsx:758-766` keeps `Import syllabus`, persistent `Add material`, `Paste excerpt`, Study Guide, and Flashcards together | **No.** The app has the older toolbar-first arrangement, not the artifact-contextual intake. |
| Study Guide / Flashcards | `StudyToolActions` in `ClassHub.tsx:1298-1367` directly invokes the current generators | **No.** The source-grounded behaviour exists, but it does not first present the newly drawn artifact-scoped source chooser. |
| Revised Notes | `RevisedNotesPanel.tsx` and `generateRevisedNotes.ts` implement the Materials-owned baseline repair | **Partial.** The behaviour is present, but discovery sits below the shelf rather than following the selected Revised Notes intake path. |
| New intake family | `academics-materials-extensions.html` lines 58-62 | **Mockup only.** Nothing in `src/` renders these five views yet. |

#### Measured primary record surface — August 21

This is a comparison of actual computed values, not token names. The current
local app was inspected at
`#/academics/classes/demo-course-biol252?classTab=materials` in its light
theme; the proposed source mockup currently supplies the approved dark
treatment. They are different themes, so this is an evidence row, **not** a
claim that light-mode fidelity has passed.

| Surface | Mockup value | Running app value |
| --- | --- | --- |
| Materials page canvas | `#211e1a` | `rgb(247, 239, 225)` / `#f7efe1` |
| Proposed solid intake panel | `#2b2722`, `#3c352d` border, `16px` radius | Existing Materials tab panel is transparent; `rgb(233, 226, 213)` border, `14.4px` radius |
| Proposed dense source object | `#322e28`, `#3c352d` border, `13px` radius | Current primary generator button is `rgb(75, 156, 211)`, transparent border, `12.4px` radius |

The eventual implementation must define the corresponding light ladder from
the real tokens and then measure both themes. It must not copy the mockup's
inline values or make a light surface artificially dark.

### C. Already built — preserve, do not rebuild

- The Class Hub's five-tab grammar, Material catalog, provenance, class-file
  storage, source-only policy, and Materials-versus-Notes distinction.
- The bounded-textbook-excerpt and Revised Notes foundation from `db0509b`.
- The source-grounded Revised Notes generator from `00036a5`.
- One-way Anki export: no imported deck, card review, self-rating, or card
  scheduling in Premed OS.
- Every later app annotation, even where an older drawing differs.

### D. Gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-materials-extensions.html` **YES**. A later build is
permitted after this decision. Do not edit the manifest.

### E. Decision record

`mockup-lab/01-academics/academics-materials-extensions.md` now records both
behaviour **and** appearance: literal ladder, geometry, responsive behaviour,
source ownership, recovery states, motion, and the reason for each treatment.
It deliberately leaves the one necessary product choice open: **A, B, or C**.
That is stage B; no decision is being inferred from a prototype URL.

### F. Integrations and services this tab owns

| Dependency | Classification | Student-visible state today | This decision pass |
| --- | --- | --- | --- |
| Source-grounded Study Guide / Flashcards / Revised Notes routes | Code exists; end-to-end proof still required | Existing direct controls operate from the old Materials layout | Do not change configuration or call providers. The later build/promotion verifies real signed-in material through each path. |
| File material, transcript, and bounded excerpt | Partially implemented | Eligible readable text and pasted material can be used; a raw file must not be treated as evidence | Decide how readiness and recovery look; do not invent storage behaviour. |
| Anki export | Existing one-way handoff | Flashcards can lead to export, not to review/scheduling | Keep the boundary visible in every treatment. |

No web search, course lookup, textbook retrieval, or new provider belongs in
this decision pass.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.0b, §4.1-I, §4.1-Q,
  §6.2, §6.7, §6.12, and §6.14.
- `mockup-lab/01-academics/academics-materials-extensions.{html,md}`.
- `mockup-lab/_shared/_visual-recipes.md`.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
  and `component-inventory.md`.
- `src/components/academics/ClassHub.tsx`,
  `src/components/academics/RevisedNotesPanel.tsx`, and
  `src/lib/academics/generateRevisedNotes.ts` — audit only in this pass.

## 3. DECIDE — one direction for the intake family

Choose one treatment for **Study Guide, Flashcards, and Revised Notes**. The
two recovery states inherit that chosen composition.

### A · Anchored source map

The selected artifact is fixed at the right of a source map. Input paths form
the map; selected sources form a compact tray; a narrow rail explains the
artifact's route. This is the most continuous with the existing Materials
source-map language and makes grounding visually explicit.

### B · Artifact-first workbench

The output anchors the header above five compact, varied source objects and a
wide selected-source tray. The explanatory rail disappears. This makes source
collection feel most hands-on and avoids long identical file rows.

### C · Contextual intake sheet

A bounded solid sheet appears over the Materials shelf with the output name and
source count leading. It reads as a focused temporary action, rather than a
subtab or permanent toolbar. On narrow screens it becomes the content column.

### Settled constraints that apply to any choice

- The Material header does not become a long row of generator tabs.
- An output action opens this intake view; it does not first force the student
  through a generic Add Material flow.
- Each source path remains inside the chosen artifact's context: existing
  material, My notes, lecture transcript, instructor/course material, or one
  bounded pasted textbook excerpt.
- `Import syllabus` remains a separate class-setup action.
- The `source-not-ready` and `no-eligible-source` states stay honest; they do
  not create content, invent a file preview, or hide the chosen destination.
- Use the application token system for both themes. Mockup hex values explain
  the dark visual recipe; they are not implementation tokens.

**Approval response format:** `A`, `B`, or `C`.

## 4. Work in this pass

After the selection is received, update only the paired Materials decision
record to name the selected treatment and record why it won. Keep all three
views available in the lab for historical comparison, but mark the selected
treatment as the implementation source of truth. Do not change `src/`.

## 5. Do not break / do not decide silently

- Do not remove an annotation-backed app adjustment because an older mockup
  differs.
- Do not add a top-level Academics tab, generator subtab strip, duplicate
  study-tool component, or a permanent Add Material generator CTA.
- Do not broaden generation beyond student/class-provided material or add a
  pre-authored deck.
- Do not change store shapes, prompts, Edge Functions, secrets, authentication,
  Anki ownership, or an integration configuration.
- Do not copy mockup inline CSS, fonts, colors, radii, or spacing values into
  code.

## 6. Done when

- One of A/B/C is explicitly selected and recorded with its hierarchy,
  responsive behaviour, and reason in the Materials `.md`.
- The selected treatment preserves the settled output-first flow and every
  source-boundary/recovery rule above.
- The lab registry remains `status:"proposed"`; nothing is promoted to built.
- `git diff --check` passes; only the decision-record changes are committed.

## 7. Commit

`docs(academics): decide output-first Materials intake`

Commit unrelated work separately.

## 8. Next stage — C · DECIDED, NOT BUILT (not in scope here)

The next rerun writes one full implementation brief: front end and backend
together, source selection persistence, generated artifact handoffs, the
light/dark fidelity measurements, handler audit, reload proof, empty-store
proof, and real signed-in service verification. It does not begin until this
visual decision is explicit.
