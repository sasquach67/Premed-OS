# T1 · Academics — remaining paper-completion surfaces

**Stage:** A · NOT DRAWN
**Status:** Mockup-only. This is intentionally a broad final paper pass: it
draws the remaining ruled Academics surfaces together, but it does not edit
`src/`, the store, migrations, Edge Functions, provider configuration, or the
build manifest.

**Why this is one pass:** These are the last five paper gaps found by the
Academics tab audit. They have separate homes, but share one purpose: make a
student-controlled record, evidence, or retrieval action visible before any
backend work is authorised. Splitting them into five further Stage-A briefs
would add ceremony without improving a decision.

## 1. Audit before this brief

### A. Spec → paper

| Ruled feature group | Spec source | Existing paper coverage | Missing surface |
|---|---|---|---|
| Professor evidence model | `tabs/01-academics.md` §3.3 `ProfessorModel`, §4.1-Q, §6.12 | Class Hub has contacts, office-hours and exam scope. | No own-graded-work evidence, sample-size gate, silent-below-threshold state, or explicit non-prediction boundary. |
| Concept canvas in active recall | §4.1-J, especially “Concept canvas — a retrieval affordance” and its acceptance criteria | Review Session draws cue, text/audio/image composer, confidence, and a cited gap report. | No optional Draw affordance, uploaded-map parity, simple nodes/labelled-edges response, or confirm-only `TopicLink` proposal. |
| Writing-class work layer | §3.3 `PaperDraft` / `AssignedReading` / `FeedbackNote`; §4.1-N | Class Types establishes STEM / Writing / General; Class Hub establishes shared banner and five-tab grammar. | No Writing third-tab treatment for drafts, readings, recurring feedback, valid-empty, or partial-syllabus-reading states. |
| Real assessment catalog and take-and-return loop | §3.3 `AcademicMistake`; §4.1-P | Materials has a permission-aware source catalog; Exam Prep has generated full-mock states. | No catalog of real assessment material, timed actual-material attempt, score/miss capture, or historical-scope evidence without a prediction. |
| Transcript-fidelity enrollment and export | §4.2-D, §6.8–§6.9, §9, acceptance criteria “Transcript-fidelity capture” | Grades & Archive has Ledger, GPA, and What-if; `TranscriptImport` handles lecture transcript text only. | No exact-as-printed enrollment/edit state, optional transcript-line image, classification evidence, or visible complete export. |

The material reader and lecture index were drawn in `c38738f`; folder intake
and watched-note mapping were drawn in `f7b4119`. Syllabus/re-import,
source-grounded outputs, lecture-capture review, topic linking, study method,
forgetting curve, grade decisions, planner, requirements, and term rollover
already have a reachable mockup surface. They are not redrawn here.

### B. Mockup → app

| Mockup family | `src/` evidence | Does it match the drawing? | Result |
|---|---|---|---|
| Daily / Class Center | `Academics.tsx`, `ClassCenter.tsx` | Existing behaviour; pre-Aug-19 visual work is unmeasured. | Preserve; unverified for promotion. |
| Class Hub and class types | `ClassHub.tsx`, `ClassCenter.tsx`, `PaperDraft`, `AssignedReading`, `FeedbackNote` types | Shared class workspace and some Writing records exist, but no drawn Professor evidence or Writing work state exists to translate. | Partial. |
| Review Session | `ReviewSession.tsx`, topic-link helpers | Recall loop exists; no concept-map response surface is drawn or proven. | Partial. |
| Materials / Exam Prep | `MaterialCatalog.tsx`, `ExamPrepMode.tsx`, `AcademicMistake`, source-grounded generator files | Generated practice and source catalog behaviour exist, but the real-assessment catalog/take/return loop has no paper or proven owner. | Partial. |
| Grades & Archive | `GradesArchive.tsx`, `TranscriptImport.tsx`, canonical Course fields | Ledger and GPA surfaces exist; lecture transcript import is not transcript-faithful course enrollment or export. | Partial. |
| Planning, syllabus, calendar handoff, learning signals, grade decisions, term lifecycle | Existing Academics components and their current mockups | Existing or separately audited; none is a replacement for the five rows above. | Preserve. |

#### Measured primary record surface — Aug 21, 2026

Measured in the running dark app at
`#/academics/classes/demo-course-biol252?classTab=materials`.

| Surface | Mockup value | App value |
|---|---|---|
| Class-page canvas | `.frame` / recipe `#211e1a` | `body` `rgb(33, 30, 26)` = `#211e1a` |
| Solid content panel | `.card` / `var(--card)` = `#2b2722`, `#3c352d` border, `16px` | rendered `card-soft` `rgb(43, 39, 34)` = `#2b2722`, `rgb(60, 53, 45)` = `#3c352d`, `16px` |
| Nested object rung | `var(--muted)` = `#322e28`, `13px` | present on existing material cards, but must be re-measured when a new actual-material state is built |

The outer ladder matches. That is **not** promotion proof: the five missing
surfaces do not yet exist in the app, and all new implementation still needs
its own two-theme measurement.

### C. Already built — do not rebuild

- Local Materials add path: `1f5d908`.
- Grounded artifact foundation: `8ca4d65`.
- Flashcards / class full mock / browser `.apkg` export: `d009cb7`, `326a17a`.
- Revised Notes generation: `00036a5`.
- Materials reader and lecture-index **drawings**: `c38738f`.
- Folder intake and watched-note mapping **drawings**: `f7b4119`.

These are seams to extend later, never duplicate. A real past exam is not a
generated mock; a Writing reading is not a STEM topic; an enrollment transcript
is not a lecture transcript.

### D. Gate

The manifest marks all owning sources **YES**:
`academics-class-hub.html`, `academics-review-session.html`,
`academics-materials-extensions.html`, `academics-exam-prep-mode.html`, and
`academics-grades-archive.html`. The gate permits a later implementation, not
this mockup-only pass. Do not edit the manifest.

### E. Decision-record audit

The five owning mockups already have companion decision files with a real
visual system: shared banner grammar, literal warm-dark ladder, glass only in
banner stat surfaces, and solid dense work areas. Their existing records do
not decide the five new states because those states do not exist yet.

This pass must add **both** Behaviour and Appearance for every new product
view. In particular, no future builder may infer that a sample-size gate is a
zero state, that a concept canvas is a drawing app, or that a transcript image
is a requirement rather than optional evidence.

### F. Integrations and services owned by these surfaces

| Dependency | Classification | What a student sees today | Requirement later |
|---|---|---|---|
| Professor evidence aggregation | **CODE MISSING** | Contact / office-hours information, not evidence from the student’s graded work. | A backend brief must persist only student-supplied, course-scoped evidence; gate it by sample size and never make a prediction. |
| Recall gap-check provider | **CODE BUILT, NOT CONFIGURED/PROVEN** | Existing review UI can render, but a live source-grounded request has not proven the provider path for this account. | Andy checklist in the later build: deploy the invoked function, keep provider secret server-only, sign in, run a real source-grounded review and reload its result. |
| Local concept map / map image | **CODE MISSING** | Keyboard, mic and image-response paths; no Draw response. | Later build must keep map data local or explicit user-upload input; it needs no GoodNotes API. |
| Assessment catalog / real attempt | **CODE MISSING** | Generated full mock and manual material records. | Later build must persist source/permission, attempt state and `AcademicMistake` causes locally; no external exam-bank scraping or redistribution service. |
| Transcript-line image and export | **CODE MISSING** | Course/ledger fields and a lecture-transcript parser. | Later build needs private student file handling and a local/export path. No registrar, National Student Clearinghouse, or transcript-provider integration is authorised. |

Academics cannot reach Stage F: ruled surfaces are still undrawn and several
dependencies are either missing or unconfigured/unproven.

## 2. Work — draw the remaining paper in one bounded pass

Modify only the following existing mockup owners, their companion `.md` files,
and `mockup-lab/variant-lab.html` registrations:

1. `academics-class-hub.{html,md}`
2. `academics-review-session.{html,md}`
3. `academics-materials-extensions.{html,md}`
4. `academics-grades-archive.{html,md}`
5. `variant-lab.html`

Every new view registers as `proposed`. Do not create another Academics page,
a sixth class tab, or a second app-level generator.

### 2.1 Class Hub — evidence and Writing without a parallel class page

Add three product states nested under the existing class-page grammar:

1. **Professor evidence** — a compact Overview-adjacent evidence sheet,
   reached from exam context rather than a new navigation tab. It has two
   honest states:
   - **Dormant:** “Not enough of your graded work yet.” It names what would
     count (returned quizzes/exams and the student’s own labels), displays no
     zero, trend, percentage, predictive wording, or rumour.
   - **Eligible:** a bounded evidence trail from this course only: a sample
     count, visibly dated graded-work entries, and observations tied directly
     to those entries. It may say that a pattern was observed; it never says
     what the professor will ask next or turns evidence into a score.
2. **Writing → Readings** — the Writing configuration replaces STEM’s third
   **Topics** tab with **Readings**, while preserving the same banner,
   Overview, Materials, Assignments and Notes geometry. Draw by-week reading
   rows with `Not started` / `Skimmed` / `Read`, an optional discussion date,
   and three intentional entry paths: paste list, add one, add this week.
   Include a valid “no readings for this workshop class” empty state and a
   partial-syllabus state that suppresses reading debt rather than inventing a
   denominator.
3. **Writing → current draft** — make the contextual primary action lead to a
   bounded draft workspace, not a text editor imitation: assignment’s real
   deadline, private self-deadline, stage `outline → draft → revision →
   submitted`, and a feedback-theme rail. Recurring feedback is shown only
   when repeated evidence exists; one feedback note stays an ordinary note.

Use the same class-page surface, not an “English mode.” A type change hides
dormant STEM records without deleting them; the Drawing must make that
non-destructive boundary clear without showing greyed-out STEM panels.

### 2.2 Review Session — optional concept canvas in the existing composer

Add `concept-canvas` and `concept-link-proposal` states inside the existing
Review Session, not a new study destination.

- Keep the normal text composer visible as the default. **Draw** opens only on
  request and is equal to **Attach map** (GoodNotes/paper image). Neither path
  is labelled better or degraded.
- The canvas is deliberately simple: text nodes, labelled edges, and one clear
  delete/undo affordance. No palettes, shape library, templates, or diagram
  application metaphor.
- Scope chips remain above the response. The eventual grading result may say
  what a map missed only against that stated scope; it never reveals full notes.
- A link suggestion is a reviewable after-state: each proposed relation shows
  both topics and one of the locked relation verbs. The student **confirms** or
  dismisses it; nothing writes a `TopicLink` automatically.
- Include the no-source / no-scope recovery state. It keeps the map attached
  and sends the student back to the existing class material path rather than
  producing a generic explanation.

### 2.3 Materials — actual assessment catalog and take-and-return

Extend the existing Materials surface with `assessment-catalog`,
`assessment-take`, and `assessment-return` views.

1. **Catalog:** show compact assessment records grouped by scope, not a file
   wall. Each record visibly carries its source/permission state
   (`instructor-provided`, `publicly posted`, `my own returned work`, or
   `unknown origin`), term/year when known, units, answer-key state, timed
   length, and taken/untaken state. Unknown-origin stays private and has no
   sharing affordance.
2. **Take:** a real-material timed attempt is visually distinct from the
   generated full mock. It states the named source, confirmed unit scope, time
   boundary, and a conservative “this is practice from this material” line.
   It makes no claim about a coming professor exam.
3. **Return:** the end of an attempt collects score as a record of the attempt,
   not a readiness score; each missed or flagged item can open one lightweight
   `AcademicMistake` capture with the locked cause taxonomy. Show the student
   the source and unit it came from, preserve the option to leave an item
   unclassified, and never create a second generic mistake system.
4. **Historical scope:** when several sources exist, draw evidence as a
   transparent record (“these tagged past assessments included Unit 2”), never
   a weighted predictor, ranking, percent, or “likely on the exam” label.

### 2.4 Grades & Archive — transcript-faithful capture and export

Add `transcript-record` and `transcript-export` product views as thin linked
states of the existing ledger—never a separate archive.

- **Record:** exact-as-printed institution, number, title, credit hours,
  grade, term/year, course type and display name as a separate field. Make
  optional transcript-line image attachment visible as supporting evidence,
  never a requirement. Course-content classification includes source/reason
  rather than a guessed BCPM label. Do not normalise a transcript string.
- **Export:** a visibly complete, explainable output preview includes every
  institution and attempt plus attached classification evidence. It is a
  student-controlled export, explicitly not an official transcript, AMCAS
  submission, registrar transaction, or degree audit.
- Include real no-data and partial-data states. No GPA figure, trend, or
  export-ready claim appears without the records that support it.

### 2.5 Appearance and variants

Use the existing literal recipe everywhere: `#211e1a` page → `#2b2722` solid
panel → `#322e28`/`#262320` dense object, `#3c352d` border, 16px panel and
13px inner-object radii. The shared banner stat strip remains the sole glass
surface. `Baloo 2` carries titles/controls/numbers; Nunito carries body copy.

Do **not** manufacture A/B/C treatments just to satisfy a switcher:

- Professor evidence uses one evidence-first composition because whether a
  sample exists is a product state, not a layout preference.
- Concept canvas uses one low-tooling composition because a feature-rich
  variant would violate the “not a drawing app” rule.
- Writing, assessment, and transcript states each use their owning page’s
  existing hierarchy. Their named views are product states, not variants.

Document desktop and narrow layout, focus order, hover motion, and a direct
`prefers-reduced-motion` outcome in every altered companion file.

## 3. References — read before drawing

- `premed-hq-documentation/tabs/01-academics.md` §§3.2–3.3, 4.1-I, 4.1-J,
  4.1-N, 4.1-P, 4.2-D, 6.8–6.12, 6.14, 7a, 9, and 13.
- `mockup-lab/01-academics/academics-class-hub.{html,md}`.
- `mockup-lab/01-academics/academics-review-session.{html,md}`.
- `mockup-lab/01-academics/academics-materials-extensions.{html,md}`.
- `mockup-lab/01-academics/academics-grades-archive.{html,md}`.
- `mockup-lab/_shared/_visual-recipes.md`.
- `premed-hq-documentation/implementation/component-inventory.md`:
  `DocEmbed`, `Animated File Upload`, `FocusModeLayout`, `Tabs`,
  `ContextMenu`, `EmptyState`, `InfoTip`, and `CollectionState`.
- `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`.

## 4. Do not break or broaden

- Do not edit `src/`, schema, storage, migrations, Edge Functions, OAuth,
  provider secrets, mockup manifest, data corpus, or unrelated mockups.
- Do not create a Canvas API/token surface, browser-side provider connection,
  scraping, an external exam bank, or an actual registrar integration.
- Do not add a fourth class type, a sixth STEM class tab, a writing-specific
  page shell, a map app, a second calculator, or a second mistake taxonomy.
- Do not use fabricated lecture/class records as if they are the student’s.
  Any illustrative example must be explicitly prototype framing.
- No U-9 violation: no composite, score used as a prediction, ranking,
  progress bar, confidence percentage, likely-on-exam wording, or unlabelled
  inferential metric. A real attempt’s recorded score is allowed only as that
  attempt’s fact.
- Preserve the student-supplied-material boundary. Generated work does not
  become course evidence; unknown-origin exams are not shared.

## 5. Done when

- [ ] The five ruled groups in §1A each have a reachable product state in the
  lab; no new top-level Academics page or class tab was created.
- [ ] New views are registered in `variant-lab.html` as `proposed`, pass their
  selected `?view=` state to their existing source, and work at desktop and
  narrow widths.
- [ ] Every changed companion `.md` records **Behaviour** and **Appearance**,
  including the literal visual ladder, hierarchy, responsive order, focus, and
  reduced-motion rule.
- [ ] Professor evidence is sample-gated and course/graded-work-scoped; it
  contains no rumour, zero state, prediction, or metric that looks measured.
- [ ] Concept canvas is optional, simple, attachment-equal, and only writes a
  link after explicit confirmation.
- [ ] Writing uses the single type system and four/five-tab grammar; missing
  readings are an honest state, not a false zero or generic STEM-empty panel.
- [ ] Actual assessment records show permission and privacy boundaries; return
  paths use the one `AcademicMistake` cause taxonomy.
- [ ] Transcript capture preserves exact strings, keeps its image optional,
  and makes export plainly non-official.
- [ ] `rg -n -i 'canvas token|canvas api|scrape|share unknown|likely on the exam|confidence score|readiness score|fourth type|sixth tab|auto.?write|official transcript' mockup-lab/01-academics` finds no new forbidden product claim.
- [ ] `git diff --check` passes and the diff contains no `src/`, services,
  OAuth, migration, manifest, data, or unrelated mockup change.

## 6. Commit

`docs(academics): brief remaining paper-completion mockups`

Commit only this brief. Keep existing working-tree changes separate.

## 7. Next stage — not in this brief

After these remaining states are drawn, re-run `TAB-BRIEF-PROMPT.md` for
Academics. It must audit whether every companion decision record is complete.
If any appearance ruling is missing, land on **B · DECIDED, NOT BUILT** for
that decision record. Only after all paper is drawn and decided may it write a
Stage-C frontend-and-backend implementation brief; implementation and promotion
are explicitly out of scope here.
