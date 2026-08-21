# T1 · Academics — evidence, actual-assessment, and transcript-record states

**Stage:** C · DECIDED, NOT BUILT  
**Status:** Full implementation brief. Build the decided states below as one
bounded Academics pass: their frontend and their persisted behaviour ship
together. Do not turn this into a visual-only pass or invent a second record
system beside the existing Class Center store.

## 1. Fidelity audit — before this brief

### A. Spec → paper

**Pass.** The final five ruled groups are now reachable in the lab, with
behaviour and appearance recorded in their owner documents:

| Ruled group | Owner mockup and decision record |
|---|---|
| Professor evidence from a student's returned work | `academics-class-hub.{html,md}` → `professor-dormant`, `professor-evidence` |
| Writing readings and current-draft work | `academics-class-hub.{html,md}` → `writing-readings`, `writing-draft` |
| Optional concept canvas and confirm-only links | `academics-review-session.{html,md}` → `concept-canvas`, `concept-link-proposal`, `concept-recovery` |
| Real assessment catalog, attempt, and return/mistake loop | `academics-materials-extensions.{html,md}` → `assessment-catalog`, `assessment-take`, `assessment-return` |
| Transcript-faithful course record and coursework export | `academics-grades-archive.{html,md}` → `transcript-record`, `transcript-empty`, `transcript-export` |

No new surface needs drawing. `academics-mode-switch.html` and
`class-center-study-hub.html` remain `NO` in the manifest and are excluded.

### B. Mockup → app

| Family | Existing app evidence | Match to the newly decided state |
|---|---|---|
| Writing records | `PaperDraft`, `AssignedReading`, and `FeedbackNote` types; `WritingTools` in `ClassHub.tsx` | Partial only. Basic add/status controls exist, but the approved reading input paths, current-draft workspace, deadline distinction, and repeated-feedback treatment do not. |
| Professor evidence | Contacts and returned-work fields exist (`ClassAssignment.returnedAt`) | Missing. There is no course-scoped evidence model, sample gate, or honest dormant/eligible surface. |
| Review and links | Existing review queue and `TopicLink` graph helpers | Missing. There is no canvas response persisted with a review, and no proposed-link confirmation state in the active-recall loop. |
| Real assessment work | `MaterialCatalog`, `PracticeExam`, `PracticeQuestion`, generated full mock, and `AcademicMistake` exist | Partial only. Current material cards lack source/permission capture and the actual-material take/return loop. The legacy mistake cause union is only `blanked | didnt-know`, which contradicts the locked six-cause taxonomy. |
| Transcript fidelity | canonical `Course`, Planning ledger/GPA views, and lecture-text `TranscriptImport` | Missing. A lecture transcript is not enrollment capture; course fields have no institution, exact-as-printed fields, optional line evidence, classification evidence, or coursework-export view. |

#### Measured primary record surface — Aug 21, 2026

Measured in the running dark app at
`#/academics/classes/demo-course-biol252?classTab=materials`. Values are
computed, not token-name guesses.

| Surface | Mockup value | App value |
|---|---|---|
| Class-page canvas | recipe `#211e1a` | `rgb(33, 30, 26)` / `#211e1a` |
| Solid content panel | `#2b2722`, `#3c352d` border, `16px` radius | `rgb(43, 39, 34)` / `#2b2722`, `rgb(60, 53, 45)` / `#3c352d`, `16px` |
| Nested object rung | `#322e28`, `13px` radius | existing material cards use that rung; re-measure every new state in both themes before promotion |

The existing outer ladder matches. The five new states do not yet exist in the
app, so this is **not** promotion proof.

### C. Already built — preserve, do not rebuild

- Class workspace, course data, local store, syllabus/re-import: existing
  Academics foundation.
- Writing arrays and basic controls: class-types migration / `ClassHub.tsx`.
- Explicit TopicLink graph and confirmable authored relation helpers:
  `migrateTopicLinksV21`, `topicGraph.ts`, `TopicConnectField.tsx`.
- Generated class Full Mock and source-grounded generation: `d009cb7` and
  `326a17a`. A real assessment is **not** a generated mock.
- Revised Notes, study guide, Flashcards, and browser `.apkg` export:
  `00036a5`, `326a17a`. None is a substitute for a student's returned work.
- The five paper completions: `a4de557`; their appearance records:
  `1065263`.

Extend these seams. Do not fork a second Writing panel, material catalog,
TopicLink store, mistake store, generator, or export facility.

### D. Manifest gate

`BUILD-MANIFEST.md` marks each owning active source `YES`:
Class Hub, Review Session, Materials Extensions, Exam Prep, and Grades &
Archive. This implementation is permitted. Do not modify the manifest.

### E. Decision records

**Pass.** The five owner records named in §1A each now state both behaviour and
appearance. Their specified warm-dark ladder, hierarchy, responsive treatment,
focus treatment, quiet motion, and reduced-motion outcome bind this build.

### F. Integrations and services this pass owns

| Dependency | Classification | Student-visible state today | Work in this brief |
|---|---|---|---|
| Local Academic store and migrations | configured local persistence | existing Academic records survive reload | extend with a versioned, additive, idempotent migration and tests |
| Student-owned files and optional transcript-line evidence | code missing for this use | files can be linked/added as materials; no transcript-line record exists | use the existing local/private file mechanism; never claim registrar or cloud-transcript access |
| Active-recall gap-check provider | code exists but configuration/live proof is not established | existing review may render without a verified live gap request | preserve its no-provider recovery; do not make this build depend on provider configuration |
| Canvas, Drive, GoodNotes, registrar, or an exam-bank service | intentionally unconfigured/unshipped | no automatic import, scraping, or registrar data | do not add one |

No Andy cloud-console step is required to make these local record surfaces
work. Live provider verification remains a later promotion condition for any
screen that invokes the provider.

## 2. References — read before changing code

- `premed-hq-documentation/tabs/01-academics.md` §§3.2–3.3, 4.1-J,
  4.1-N, 4.1-P, 4.2-D, 6.6, 6.8–6.12, and §9 acceptance criteria.
- `mockup-lab/01-academics/academics-class-hub.{html,md}`.
- `mockup-lab/01-academics/academics-review-session.{html,md}`.
- `mockup-lab/01-academics/academics-materials-extensions.{html,md}`.
- `mockup-lab/01-academics/academics-grades-archive.{html,md}`.
- `mockup-lab/_shared/_visual-recipes.md` — literal visual values.
- `premed-hq-documentation/implementation/component-inventory.md` — reuse
  `Card`, `Tabs`, `EmptyState`, `InfoTip`, `DocEmbed`, `Animated File Upload`,
  `FocusModeLayout`, and existing Context Menu primitives where applicable.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.
- `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`.

## 3. FRONTEND — translate the approved owner states

### 3.1 Class Hub — evidence and Writing work

1. Add the compact Professor evidence sheet inside the current Class Hub
   overview/exam context. It has only these states:
   - **Dormant:** honest “not enough of your returned work yet” recovery,
     saying what can count. It must show neither a zero nor a trend.
   - **Eligible:** dated, course-only returned-work observations with their
     displayed sample size. It may report an observation tied to its records;
     it never predicts the next exam or makes a readiness claim.
2. Keep Writing inside the existing five-tab class grammar. The Writing type
   replaces STEM's Topics surface with Readings; it does not add a sixth tab or
   an “English mode.” Add the approved paste-list, add-one, and this-week
   entry paths; show the no-readings/workshop and partial-syllabus states
   without inventing a reading denominator.
3. Make the current draft a bounded workspace rather than a document editor:
   actual assignment deadline beside optional self-deadline; four existing
   stages; attached feedback themes only after repeated evidence. One feedback
   note remains an ordinary note.

### 3.2 Review Session — optional concept canvas

1. Keep keyboard/text the default composer. **Draw map** and **Attach map** are
   equal optional affordances, never a new study destination or a fourth
   recall mode.
2. The canvas is intentionally small: text nodes, labelled edges, delete, and
   undo. No palette, templates, shape library, or diagram-app framing.
3. Keep scope chips above the response. A gap result can produce a *proposed*
   relation showing both topics and one existing locked relation verb. It
   writes `TopicLink` only after the student confirms.
4. Preserve the map in the no-source/no-scope recovery state and route the
   student to existing Materials/topic selection. Never open or substitute a
   notes dump.

### 3.3 Materials — real assessment catalog and take/return loop

1. Extend the existing `MaterialCatalog`; do not build a second library. Show
   actual assessment material by course/unit as the approved compact source
   catalog. Every item states exactly one source/permission condition:
   instructor-provided, publicly posted, my returned work, or unknown origin.
   Unknown origin remains private, with no sharing action.
2. A real-material attempt is visually and semantically distinct from
   `GeneratedMockAttempt`: name its source, confirmed scope, and time boundary
   and say only that it is practice from that material. No “likely on the
   exam,” prediction, or readiness score.
3. The return view records the attempt result as a fact, then optionally opens
   the **single** `AcademicMistake` capture. It keeps source and unit visible,
   permits an unclassified miss, and shows history as records rather than a
   trend or composite.
4. Historical-scope evidence is transparent source history only. It never
   becomes a weighted forecast, rank, percent, or exam prediction.

### 3.4 Grades & Archive — transcript-faithful record/export

1. Add transcript record, empty/partial, and export states inside the existing
   Grades & Archive owner. Do not create a standalone “transcript app.”
2. Capture institution, transcript course number/title, recorded credits,
   recorded grade, term/year, course type, and separate display name exactly as
   the student enters them. An image of the relevant transcript line is visibly
   optional supporting evidence.
3. Course-content classification records the student's source and reason; it
   never guesses BCPM from a title or department.
4. Export is a visibly complete student-controlled coursework preview/file. It
   includes all institutions, attempts, and classification evidence and says
   plainly it is not an official transcript, registrar action, AMCAS
   submission, or degree audit.

### 3.5 Fidelity and accessibility rules for every state

- Use the owner records’ literal recipe: `#211e1a` page → `#2b2722` 16px
  panel → `#322e28` 13px object with `#3c352d` borders. Solid-with-depth is
  required for dense data. The existing banner stat strip is the only eligible
  glass surface.
- Preserve shared `Baloo 2` hierarchy and body typography. Do not copy mockup
  inline CSS, raw palette, font sizes, or radii into app code; use the
  corresponding real tokens/classes.
- Desktop keeps the bounded evidence/context rail next to the working surface;
  narrow layouts stack it beneath. Every interactive control has a visible
  focus state and keyboard path.
- Hover/selection uses the shared quiet color transition (~150ms). Reduced
  motion resolves directly; never rely on animation to convey a state change.

## 4. BACKEND — one additive Academic model, one migration

### 4.1 Preserve and extend the existing model

Do **not** add a parallel store. Add only the entities/fields required by the
five approved states to `ClassCenterData`, with strict course ownership and
stable source links:

1. **Professor evidence**: course-scoped, student-authored observations linked
   to a returned `ClassAssignment` and optionally the instructor `personId`.
   Store the evidence and its date; derive eligible/dormant and sample count
   deterministically. Do not persist a prediction, a confidence score, or a
   model verdict.
2. **Canvas response**: a course/topic/review-scoped response containing only
   student-authored nodes, labelled edges, and optional attached file id. Link
   proposals are ephemeral until the existing `TopicLink` confirm action writes
   the link.
3. **Real assessment attempt**: extend the existing material and practice
   seams with an explicit material source/permission condition, confirmed topic
   scope, attempt timing, and result. Do not reuse `GeneratedMockAttempt` and
   do not duplicate `AcademicMistake`.
4. **Academic mistakes**: migrate the old optional two-cause union losslessly
   to the spec’s six values:
   `didnt-know`, `knew-it-but-blanked`, `misread-the-question`, `arithmetic`,
   `ran-out-of-time`, `wrong-method`. Map legacy `blanked` to
   `knew-it-but-blanked`; retain every record, id, text, timestamp, and source
   relation. Causes remain optional.
5. **Transcript fidelity**: add a course-attached transcript record that keeps
   every source string distinct from `Course`’s operational display fields,
   plus optional local evidence reference and classification source/reason.
   Model the export as derived output; never save an “official” export claim.

Document each exact proposed interface in `src/lib/types.ts` before UI code.
If an existing interface already faithfully carries the proposed data, extend
it instead of adding an alias. The migration must be additive, lossless,
idempotent, return fresh data, register in `migrateAll`, increment
`CURRENT_STORE_VERSION`, and include frozen-input/idempotence tests.

### 4.2 Persistence and rules

- Every create/edit/remove action writes the existing Zustand/Immer store and
  survives a reload. No new localStorage key or unversioned shape.
- Professor evidence accepts only student-entered observations tied to a
  `returnedAt` assignment in the same course. It stays dormant below the
  defined small sample gate and cannot consume rumours, generated work, or
  other-course records.
- Canvas nodes/edges remain student-owned. The only route to TopicLink is the
  existing explicit-confirm helper. Undo/deleting a canvas item never deletes
  a confirmed link.
- Assessment material does not scrape, upload an unauthorized answer bank, or
  share unknown-origin content. A publicly posted source remains a link, not a
  copied bank.
- Transcript evidence stays private/local under existing file handling. No
  registrar, National Student Clearinghouse, Canvas, Drive, GoodNotes, or
  cloud-storage integration is implied.

### 4.3 Tests

Add focused tests for:

1. migration from the current v26 store: all five new homes are empty, all
   existing data byte-equivalent apart from added empty fields;
2. migration idempotence and frozen input;
3. legacy `blanked` cause maps losslessly and other legacy causes remain;
4. professor evidence ignores unreturned, other-course, and generated records;
5. a proposed canvas relation leaves `topicLinks` unchanged until confirmation;
6. unknown-origin assessment material cannot expose a sharing path and a real
   assessment never writes `generatedMockAttempts`;
7. transcript record preserves exact entered strings and includes its
   classification evidence in derived export.

## 5. Do not break or broaden

- Keep exactly three class types: `stem`, `writing`, `general`. Type changes
  hide dormant type-specific data but never delete it.
- Keep the class page at five sub-tabs. Do not add a sixth tab, a second
  Materials catalog, a second mistake system, a map app, or a separate archive.
- Keep the student-supplied-material boundary. No pre-authored deck, source
  scraping, professor-rumour model, exam-bank sharing, or general-knowledge
  substitution.
- Preserve generated Flashcards/Study Guide/Revised Notes/full-mock paths and
  their source-selection rules. Real assessment work must not alter or replace
  them.
- No U-9 violation: no readiness/composite score, ranking, fabricated
  percentage, progress bar presented as performance, or predictive wording.
  A returned result belongs only to its named attempt.
- Preserve existing Academic migration history and unrelated working-tree
  changes. Do not change global tokens, auth, OAuth, provider secrets,
  Supabase configuration, the build manifest, or unrelated pages.

## 6. Done when

### Frontend

- [ ] Every state listed in §1A is reachable from its existing owner surface;
  no new top-level Academics destination or class tab exists.
- [ ] Class Hub has honest dormant/eligible Professor evidence plus full
  approved Writing reading/draft states.
- [ ] Review supports optional Draw/Attach map parity, preserves recovery, and
  creates a TopicLink only after explicit confirmation.
- [ ] Materials distinguishes real assessment material from a generated mock,
  keeps its permission/private boundary visible, and completes an attempt →
  optional mistake capture loop.
- [ ] Grades & Archive captures exact transcript fields and exposes only a
  clearly non-official student-controlled export.
- [ ] New solid surfaces match their owner drawings in both themes by measured
  `getComputedStyle` ladder values; no glass appears outside a floating banner
  surface.

### Backend

- [ ] The store version increments once, all migrations are registered, and
  current data receives additive empty homes only.
- [ ] `rg -n 'blanked\\b' src/lib src/components src/store` finds only the
  explicit legacy-migration mapping or test fixture — never a live cause
  option.
- [ ] `rg -n 'generatedMockAttempts' src/components/academics` confirms the
  real-material loop does not write generated attempts.
- [ ] Reload proves a Professor observation, canvas response, confirmed link,
  real attempt/mistake, and transcript record persist.
- [ ] Empty-store checks show real friendly empty states; no sample record,
  score, source, or transcript row survives after the store is emptied.

### Verification

- [ ] `npm run test` and `npm run build` pass.
- [ ] Keyboard-only, both themes, reduced motion, and narrow desktop/mobile
  layouts are exercised for each owner.
- [ ] Run the inert-control audit from `4fe210f` for every changed owner and
  report zero actionable `Button`, `DropdownMenuItem`, or `ContextMenuItem`
  without a handler or an explicit disabled reason.
- [ ] Keep a short visual proof table with mockup/app computed ladder values in
  the implementation report. This brief does **not** promote the pages; each
  must separately pass all six Variant Lab promotion conditions.

## 7. Commit

`feat(academics): build evidence, assessment, and transcript record states`

Commit only source, tests, and directly required decision-record commit notes.
Keep unrelated brief/spec/flashcard changes separate.

## 8. Next stage — not in this brief

Re-run `TAB-BRIEF-PROMPT.md` for Academics after this implementation. The next
audit must decide whether the first remaining gap is **D** (a ruled behaviour
still missing), **E** (a previously shipped screen that does not match its
mockup), or **F** promotion proof. It must also verify any live AI/provider
path with student-supplied material; provider configuration is not silently
declared complete by this local-record build.
