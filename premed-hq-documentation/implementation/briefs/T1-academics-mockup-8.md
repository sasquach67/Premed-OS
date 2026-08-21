# T1 · Academics — source baseline and pasted-excerpt states

**Stage:** A · NOT DRAWN  
**Status:** Mockup brief only. Draw the two newly ruled Materials states and
their recovery state; do not touch `src/`, data models, migrations, prompts,
or provider configuration in this pass.

## 1. Fidelity audit — before this brief

### A. Spec → paper

The existing, manifest-cleared Academics owner surfaces cover the previously
ruled feature families. The following later product rulings do **not** yet have
a visible mockup surface:

| Ruled behaviour | Missing paper surface |
| --- | --- |
| A student may paste a bounded textbook **excerpt** as one of the sources for Revised Notes, Study Guide, or Flashcards. | A Materials source-selection state with the excerpt text box, optional source label, and visible ownership/provenance. |
| Revised Notes repairs the student's record; their own notes are the baseline, while slides, transcript, and excerpts support or clarify them. | A source-selection/result treatment that makes the selected student note visually primary and makes the support relationship legible. |
| Revised Notes cannot honestly begin when no student note has been selected. The student must be told that there is nothing to revise and offered the appropriate non-revision path. | A no-baseline recovery state in the existing Materials generation flow. |

The following are **not** gaps and must not be redrawn in this brief:

- `academics-lecture-capture.html?view=review` already draws pending material
  and coverage proposals as reviewable actions; `index` already draws quoted
  evidence plus a material connection.
- The existing Materials source map already draws the three output choices:
  Revised Notes, Study Guide, and Flashcards.
- Whole-textbook upload, indexing, or searching is not drawn or ruled here.
  Only a student-pasted, bounded excerpt is in scope. Do not imply that Premed
  OS uploads, retains, or searches a copyrighted textbook.

### B. Mockup → app

| Surface | Existing app evidence | Translation result |
| --- | --- | --- |
| Materials shelf and current source selector | `src/components/academics/ClassHub.tsx`, `RevisedNotesPanel.tsx` | Shipped foundation. It offers processed files as generic selectable inputs, but does not show an excerpt input or require/privilege the student's notes as the Revised Notes baseline. Divergent from the new ruling. |
| Existing Revised Notes caller and source trace | `src/lib/academics/generateRevisedNotes.ts`, `schemas/revisedNotes.v1.ts` | Existing source-only generation and closed citation validation must be preserved. Its current request does not encode the newly approved baseline relationship. A later build must update it only after the drawing and decision record are approved. |
| Lecture capture and class-note proposals | `LectureCapturePanel.tsx`, `ProfessorRemarkProposals` in `ClassHub.tsx`, `4f734e4` | Newly built. Preserve; not part of this mockup pass. |
| Materials extensions mockup | `mockup-lab/01-academics/academics-materials-extensions.{html,md}` | Has a source map and results, but no textbook-excerpt source, no baseline hierarchy, and no Revised Notes recovery when student notes are absent. |

#### Measured primary record surface — Aug 21, 2026

Measured in the running dark app at
`#/academics/classes/demo-course-biol252?classTab=materials`, using
`getComputedStyle`, not token names.

| Surface | Existing Materials mockup value | Running app value |
| --- | --- | --- |
| Page canvas | `#211e1a` | `rgb(33, 30, 26)` / `#211e1a` |
| Solid content panel | `#2b2722`, `#3c352d` border, `16px` radius | `rgb(43, 39, 34)` / `#2b2722`, `rgb(60, 53, 45)` border, `16px` |
| Dense nested object | `#322e28`, `#3c352d` border, `13px` radius | `rgb(50, 46, 40)` / `#322e28`, `rgb(60, 53, 45)` border, `13px` |

The existing Materials ladder matches. This brief must extend that same
page → solid panel → dense object ladder; it must not introduce a new visual
direction or reproduce mockup CSS in the app.

### C. Already built — preserve, do not rebuild

- The Class Hub's five-tab grammar and Materials ownership.
- Academic file/source-chunk provenance, source-only generation policy, source
  traces, and one-way Anki export.
- The three-choice output grouping and existing Flashcards V1 rule that an
  `Ex:` relation is subordinate context, not a second answer.
- Lecture capture, local audio references, transcript evidence, and pending
  professor class-note proposals from `4f734e4`.

### D. Manifest gate

`BUILD-MANIFEST.md` marks both
`01-academics/academics-materials-extensions.html` and
`01-academics/academics-lecture-capture.html` **YES**. Drawing within their
existing owner pages is permitted. Do not edit the manifest.

### E. Decision records

The paired decision records already describe both behaviour and appearance for
their current views. They are incomplete only because the three new states
above do not exist yet. This is therefore stage **A**, not a decision-only
stage B.

### F. Integrations and services this tab owns

| Dependency | Classification | Student-visible state today | Required follow-up |
| --- | --- | --- | --- |
| Pasted excerpt intake | **CODE MISSING** | A student can select processed files/transcripts, but cannot enter a bounded textbook passage as a named source. | Draw it here; a later build adds local persisted text/provenance. |
| Revised Notes source-only generation | **CODE BUILT; configuration unverified** | The existing panel can attempt a source-linked generation and shows its honest unavailable recovery if the provider call fails. | Later verify the deployed Supabase study-tools route with the existing server-side OpenAI secret; never expose a key in the browser. |
| Lecture capture analysis endpoint | **CODE BUILT; not configured/deployed** | Capture/paste/review remain usable locally, but provider-backed analysis is unavailable until deployment and the server secret are verified. | Keep its exact Andy deployment checklist in the lecture-capture implementation handoff; do not modify it in this drawing pass. |

**Andy checklist, later—not part of this mockup brief:** in the correct
Supabase project, verify the server-only `OPENAI_API_KEY`, deploy the relevant
Edge Functions, then perform one signed-in source-only generation using
student-supplied material. Do not put the value in Vite, localStorage, or a
client request.

## 2. References — read before drawing

- `premed-hq-documentation/tabs/01-academics.md` §4.1-I, §4.1-Q, §6.7,
  §6.12, §6.14, and the two-notes distinction.
- `mockup-lab/01-academics/academics-materials-extensions.{html,md}` — the
  existing Materials source map and output triad.
- `mockup-lab/01-academics/academics-lecture-capture.{html,md}` — preserve its
  already drawn evidence/proposal boundary.
- `mockup-lab/_shared/_visual-recipes.md`,
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`,
  and `premed-hq-documentation/implementation/component-inventory.md`.
- `src/components/academics/RevisedNotesPanel.tsx` and
  `src/lib/academics/generateRevisedNotes.ts` — reference only; do not edit.

## 3. DRAW — nested Materials states only

Extend the existing `academics-materials-extensions` page and its paired `.md`.
Keep the page registration in `variant-lab.html` as **`proposed`** and append
the new product-view keys there. Do not create a new class tab, a generator
home, or a standalone page.

### 3.1 `textbook-excerpt` — an eligible, bounded source

Draw an add-source state beside the existing source map:

1. The student pastes a **section or excerpt**, not a whole book. The textarea
   is the dominant input. A compact optional source label (for example,
   `OpenStax Psychology · Ch. 1.2`) and optional section label sit alongside
   it for provenance; neither fabricates a citation.
2. The incoming excerpt resolves into one named source node in the same map as
   course files, notes, and transcript. It must plainly read `Pasted excerpt ·
   Mine` and remain selected only by the student's action.
3. The state says that the pasted passage may support Revised Notes, Study
   Guide, or Flashcards, but no output may use material outside the selected
   sources.
4. Include an empty/too-short recovery that preserves what the student typed,
   tells them to paste a usable section, and never fills the box with demo
   textbook content.

### 3.2 `revised-notes-baseline` — repair, not replacement

Draw a source-selection state and resulting paper/provenance state that make
the relationship unambiguous:

1. A selected `My notes` source occupies the visual anchor in the source map.
   Selected slides, transcript, and pasted excerpt feed toward it as supporting
   evidence, then toward **Revised Notes**. Their geometry must not imply that
   any one source is automatically more authoritative than the student's notes.
2. The helper copy must state the job succinctly: preserve the student's
   organization, language, and emphasis where the selected sources support it;
   use the other selected material to fill supported gaps or expose an
   unresolved source difference. It is not a study guide, rewritten textbook,
   or general-course explanation.
3. The result keeps the existing paper-plus-provenance composition. Add a
   restrained annotation showing one baseline passage with its supporting
   slide/transcript/excerpt traces. The annotation must prove source trace, not
   invent an editing score, confidence, completion percentage, or summary
   metric.

### 3.3 `revised-notes-no-baseline` — honest recovery

When the student selects only slides, transcript, or a pasted excerpt, show a
quiet in-flow recovery: **there is no student note selected to revise.** Keep
the sources visible and route the student to select their notes or make a Study
Guide/Flashcards from the current selection. No source is automatically called
notes and no Revised Notes artifact is previewed.

### Variants

No A/B/C treatment is warranted. These are evidence and ownership states, not
competing visual directions. Draw one Variant A that continues the approved
source-map / three-choice-triad system, then document why the hierarchy makes
the student-note baseline and bounded excerpt legible.

## 4. Appearance and interaction constraints

- Continue the measured warm-dark ladder literally: page `#211e1a` → solid
  `#2b2722` panel → `#322e28` dense source/decision objects, `#3c352d`
  borders, 16px panels, 13px inner objects. The shared banner is the only
  floating/glass region.
- Use the source map as the grounding metaphor, the compact output triad as
  the chooser, and paper-plus-provenance as the result composition. Do not turn
  this into long identical rectangle rows or a generic file-upload dashboard.
- The student note is prominent through placement, labeled anchor treatment,
  and line direction—not by moving every icon or applying a new color system.
- Focus-visible is mandatory. Hover and state changes use the shared short
  ease-out treatment; `prefers-reduced-motion` resolves directly. No width,
  layout, or page-reflow animation.
- All examples must be visibly illustrative and source-shaped. Do not draw
  sample grades, inferred course coverage, model confidence, flashcard
  scheduling, a readiness score, a composite, a ranking, or a progress bar.

## 5. Do not break / do not decide silently

- Do not change any code, generation prompt, API call, store shape,
  localStorage data, model key, or Supabase configuration.
- Do not erase the distinction: **Materials** owns Revised Notes; the class
  **Notes** tab owns student-confirmed professor/course notes.
- Do not draw full-textbook upload, remote textbook lookup, copyright claims,
  or a provider search. Those are a separate future ruling.
- Do not duplicate the existing lecture-capture proposal UI or invent a second
  Materials generator.
- The app design system wins over mockup inline styling. Use the shared visual
  recipe vocabulary and update the paired decision `.md` with both behaviour
  **and** appearance.

## 6. Done when

- `academics-materials-extensions.html` exposes exactly these additional
  Product views: `textbook-excerpt`, `revised-notes-baseline`, and
  `revised-notes-no-baseline`.
- `variant-lab.html` lists those views beneath the existing Materials entry and
  keeps that entry `status:"proposed"`.
- `academics-materials-extensions.md` records input ownership, the
  no-baseline rule, layout/hierarchy, literal surface ladder, responsive order,
  focus, reduced motion, and why no variants were drawn.
- Grep proves `textbook`, `baseline`, and `no-baseline` occur in the mockup and
  paired decision record; grep also proves no `score`, `confidence`,
  `progress`, `schedule`, or `Canvas token` was added to these new states.
- The lab renders all three views directly by query parameter with no console
  error. No `src/` file changes in the commit.

## 7. Commit

`docs(mockups): draw Academics source-baseline states`

Commit only the mockup HTML, paired decision record, and `variant-lab.html`
registration changes. Keep unrelated working-tree changes separate.

## 8. Next stage — explicitly out of scope

After the drawing is reviewed and approved, the paired decision record must be
updated with the exact approved copy, hierarchy, and recovery treatment in this
brief. Rerun the tab brief generator then. If that record is complete, it
should land on **C · DECIDED, NOT BUILT**; a single later build brief can add
the excerpt record, updated Revised Notes prompt, and server-side end-to-end
verification. If the decision record is incomplete, the generator must instead
land on **B** and stop there.
