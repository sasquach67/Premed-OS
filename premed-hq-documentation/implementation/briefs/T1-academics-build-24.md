# T1 · Academics — bounded excerpts and baseline Revised Notes

**Stage:** C · DECIDED, NOT BUILT
**Status:** Implementation brief. Build this single Materials-owned vertical:
student-pasted excerpt → explicit source selection → baseline-led Revised
Notes generation → source-trace result/recovery. It is not a new Class Hub
tab, a new generator home, or a whole-textbook product.

## 1. Fidelity audit — before implementation

### A. Spec → paper

**Pass for this owner surface.** Commit `d8b72cc` added the three formerly
missing, manifest-cleared Materials states to
`mockup-lab/01-academics/academics-materials-extensions.{html,md}`:

| Ruled behaviour | Reviewable state | Translation state |
| --- | --- | --- |
| A student may provide a bounded textbook passage as a named, student-owned source. | `textbook-excerpt` | Drawn and documented. |
| Revised Notes repairs a student's note record; their own note is the baseline and selected course sources support it. | `revised-notes-baseline` | Drawn and documented. |
| A Revised Notes request without a student-note baseline recovers honestly. | `revised-notes-no-baseline` | Drawn and documented. |

The following are explicitly **not** part of this work:

- Whole-textbook upload, retention, indexing, search, scraping, or a claim
  that Premed OS has access to an assigned textbook.
- Lecture capture, professor/course-note proposals, Study Guide, Flashcards,
  assessment records, or Anki review/scheduling. Preserve their existing
  owners and seams.
- A sixth Class Hub tab or an app-wide Materials sub-navigation system.

### B. Mockup → app

| Surface | Existing app evidence | Translation result |
| --- | --- | --- |
| Class Hub information architecture | `src/components/academics/ClassHub.tsx:691-772` | **Built foundation.** The only real Class Hub navigation is the established five-tab grammar. Materials currently owns contextual actions, a shelf, and nested panels. Preserve this hierarchy. |
| Add material | `ClassHub.tsx:708-744` | **Divergent.** It is upload-only (`input[type=file]`), so a student cannot save a pasted excerpt as a named material/source. |
| Revised Notes source chooser | `src/components/academics/RevisedNotesPanel.tsx:46-135` | **Divergent.** It treats every processed file as a peer selectable input and enables generation when any selected chunk exists. It neither requires a student-note baseline nor offers the no-baseline recovery. Its visible output trio must not become an additional persistent tab strip. |
| Revised Notes request contract | `src/lib/academics/generateRevisedNotes.ts:28-95`; `src/lib/generation/artifacts/revisedNotes.v1.ts:4-44` | **Partial.** It already uses the closed source set, server study-tools seam, citation validation, and an unresolved-difference outcome. It does not express the approved baseline relationship in the artifact request or validate that a student note was selected. |
| Material/source persistence | `src/lib/types.ts:378-407,498-520`; `src/lib/academics/transcriptImport.ts:101-154` | **Reusable seam.** `sourceType: 'paste'`, student ownership, `AcademicFile`, and precise `SourceChunk` records already exist. Reuse them; do not introduce a second material store or new binary retention route. |

#### Measured primary record surface — Aug 21, 2026

Measured with `getComputedStyle` in the running dark app at
`#/academics/classes/demo-course-biol252?classTab=materials`.

| Surface | Approved Materials mockup | Running app |
| --- | --- | --- |
| Page canvas | `#211e1a` | `rgb(33, 30, 26)` / `#211e1a` |
| Solid content panel | `#2b2722`, `#3c352d` border, `16px` radius | `rgb(43, 39, 34)` / `#2b2722`, `rgb(60, 53, 45)` / `#3c352d`, `16px` |
| Dense source/decision object | `#322e28`, `#3c352d` border, `13px` radius | `rgb(50, 46, 40)` / `#322e28`, `rgb(60, 53, 45)` / `#3c352d`, `13px` |

The application already matches the approved warm-dark surface ladder. Extend
it through existing tokens/components; never copy mockup CSS, hardcoded hex,
font, or radius values into `src/`.

### C. Already built — preserve, do not rebuild

- The five Class Hub tabs: **Overview, Materials, Topics, Assignments, Notes**.
  Materials owns notes *on a material* and generated Revised Notes; the Notes
  tab owns confirmed notes *about the class*.
- Existing `AcademicFile` / `SourceChunk` provenance, course ownership,
  source-only generation policy, citation closure, and generated-artifact
  persistence.
- The existing Study Guide and Flashcards owners. Flashcard export remains
  one-way `.apkg`; Anki, not Premed OS, owns review/scheduling.
- Pasted transcript import, local material retention, lecture capture, and
  pending professor/course-note proposal work.
- The existing Materials shelf, unit grouping, filters, assessment catalog,
  and class-appropriate study actions.

### D. Manifest gate

`premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md` marks
`01-academics/academics-materials-extensions.html` **YES**. This scoped build
is authorized. Do not edit the manifest or infer authority over other
Academics pages.

### E. Decision record

**Pass.** `academics-materials-extensions.md` now records both behaviour and
appearance for the excerpt, baseline, and recovery states. The following
user-approved hierarchy is binding in the application:

1. The many chips in the mockup lab are a **review-only state selector**. They
   are not a product navigation row and must not be copied into the app.
2. The product keeps the five Class Hub tabs. In **Materials**, the shelf and
   its normal contextual controls remain primary: **Add material**, **Generate
   study guide**, **Generate flashcards**, and a quiet **More study tools**
   overflow.
3. Source picking, pasted-excerpt entry, baseline selection, unavailable
   recovery, and a generated result are contextual views opened from those
   controls. They are not sibling tabs.

### F. Integrations and services this surface owns

| Dependency | Classification | Student-visible state today | Required result |
| --- | --- | --- | --- |
| Local Academic store + source chunks | **CODE BUILT AND CONFIGURED** | Pasted transcript content can become an owned `AcademicFile` and precise chunks. | Reuse for a bounded excerpt; persist the student-entered title/text locally and reload it safely. |
| Server-side study-tools generation | **CODE BUILT; live configuration unverified** | Revised Notes calls `study-tools` after synchronizing its selected chunks, and fails closed if the provider rejects the request. | Preserve the server-only seam, pass the approved baseline contract, and retain its honest unavailable state. |
| Anthropic document-citation route | **CODE BUILT; SERVER CONFIGURATION REQUIRED** | No browser key is needed or permitted. The function honestly reports unavailable until its server secret is present. | Keep `AI_PROVIDER` unset and configure only `ANTHROPIC_API_KEY` in the deployed `study-tools` Edge Function. Its provider-attested citation locations remain the required source proof. |
| Whole textbook / external source lookup | **NOT A FEATURE** | No supported source exists. | Keep absent. Only a bounded student-pasted excerpt is eligible. |

**Andy live checklist after code is merged (not a substitute for tests):**

1. In the correct Supabase project, add or confirm the server-only
   `ANTHROPIC_API_KEY`; do not paste or expose its value. Leave `AI_PROVIDER`
   unset and do not set `OPENAI_API_KEY` for this source-linked path.
2. Deploy the existing `study-tools` Edge Function from this repository and
   confirm its authenticated invocation path is enabled for the live app.
3. Signed in, add one short student-owned note, one student-pasted excerpt,
   and one actual course source; generate Revised Notes; confirm it saves,
   reloads, and exposes only cited selected sources.
4. Disconnect/disable the provider for one local test if practical: the app
   must name the unavailable condition and save no partial artifact.

This integration remains **unverified** until that real signed-in run is
captured. Do not promote the Materials lab page to `built` merely because the
frontend compiles.

## 2. References — read before changing code

- `premed-hq-documentation/tabs/01-academics.md` — Class Hub grammar,
  Materials ownership, the two-notes distinction, and the rule that study
  tools are a primary action plus overflow rather than an eight-button grid.
- `mockup-lab/01-academics/academics-materials-extensions.{html,md}` —
  Variant A, including `textbook-excerpt`, `revised-notes-baseline`, and
  `revised-notes-no-baseline`.
- `premed-hq-documentation/specifications/generation/02-global-rules-and-source-modes.md`
  and the current `04-flashcards-v1.md` — source boundary; do not overwrite
  the user's unrelated working-tree revision to Flashcards V1.
- `src/components/academics/ClassHub.tsx`, `RevisedNotesPanel.tsx`,
  `MaterialCatalog.tsx`, `TranscriptImport.tsx`,
  `src/lib/academics/transcriptImport.ts`, and
  `src/lib/academics/generateRevisedNotes.ts`.
- `src/lib/generation/artifacts/revisedNotes.v1.ts`, its schema/tests, and
  `src/lib/intelligence/studyTools.ts`.
- `supabase/functions/study-tools/index.ts` and `supabase/DEPLOY.md` —
  transport/configuration only; product generation rules live in `src/lib/generation`.
- `mockup-lab/_shared/_visual-recipes.md`,
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`,
  and `premed-hq-documentation/implementation/component-inventory.md`.

## 3. FRONTEND — one contextual Materials flow

### 3.1 Keep the real hierarchy small

1. Keep the existing five Class Hub tabs unchanged. Do not add an internal
   row for `catalog`, `generate`, `excerpt`, `baseline`, `result`, or any other
   lab product-view key.
2. Keep the Materials shelf and current toolbar. Extend **Add material** with
   a compact choice that includes **Paste excerpt** beside its existing upload
   path. The option opens a focused in-flow dialog/sheet, not a new route.
3. Keep **Generate study guide** and **Generate flashcards** as their existing
   owners. Make Revised Notes a quiet contextual choice in the existing study
   output/source-selection flow or overflow—not a third permanent action row
   and not a second generator panel competing with the shelf.
4. A generated result opens in the established Materials workspace beside the
   source/provenance rail. Returning returns to the same shelf/context; it
   does not leave a stack of persistent generator tabs behind.

### 3.2 Pasted excerpt intake

1. Add a source-owned **Paste excerpt** form with:
   - required substantial text area labelled as a section/excerpt, never a
     whole textbook;
   - optional source label (for example, book/title/chapter) and optional
     section label, clearly metadata rather than invented citation; and
   - a clear student-ownership/provenance sentence: it may support selected
     generated outputs, and no selected output may use anything outside its
     source set.
2. Preserve typed text and metadata when validation fails. Whitespace-only or
   too-short content stays in the form with an actionable recovery; do not
   replace it with demo textbook content and do not create a hollow file.
3. On save, create exactly one `AcademicFile` with `sourceType: 'paste'`,
   `owner: 'mine'`, a truthful type/title/notes label, and its course id;
   derive complete, ordered `SourceChunk` records with exact character ranges.
   Reuse the transcript-import parsing/chunk provenance ideas where useful,
   but do not mislabel an excerpt as a lecture transcript.
4. The new node appears in the ordinary Materials shelf and source picker as
   **Pasted excerpt · Mine**. It is selected only when the student selects it.

### 3.3 Baseline-led Revised Notes

1. Source selection must identify student-owned note material separately from
   course slides, lecture transcript, and pasted excerpt. A student deliberately
   chooses one baseline note. Multiple selected supporting sources remain
   allowed.
2. Revised Notes generation is disabled until both conditions hold:
   - at least one usable student note is designated as the baseline; and
   - at least one selected source chunk exists.
3. If a student selects only slides, transcript, or an excerpt, preserve that
   selection and show the approved in-flow recovery: **There is no student note
   selected to revise.** Offer either **Select my notes** or the appropriate
   existing Study Guide/Flashcards action for those sources. Do not call any
   selected source “notes” automatically; do not preview or save an artifact.
4. The source map/result should make the baseline visually primary through
   placement and trace direction only. Keep the paper-plus-provenance result;
   do not add scores, confidence, completion bars, rankings, or an editing
   percentage.
5. Preserve copy/download and the generated-record boundary. Revised Notes is
   a generated Material record: it never overwrites the student's original
   notes, course material, transcript, or pasted excerpt.

### 3.4 Appearance, accessibility, and motion

- Reuse existing `Card`, `Button`, `Dialog`/sheet, form, focus-ring, and
  toast primitives from the component inventory. Configure; do not fork a
  new file-card, source-picker, or generator family.
- Preserve page → solid panel → dense source object in both themes. Glass is
  only appropriate on a banner/floating overlay, never on this dense Materials
  workspace or its source data.
- At compact widths, stack source context then result/provenance; action labels
  remain available and no horizontal source rail forces clipping.
- Every keyboard path is reachable: open add choice, enter excerpt text,
  save/cancel, select baseline/supporting source, generate, read recovery,
  copy/download, and return. Visible focus is mandatory.
- Hover/selection uses quiet existing background/color transitions. Respect
  `prefers-reduced-motion`; animate only opacity/transform where an existing
  primitive already does so. No width, margin, left, or layout animation.

## 4. BACKEND — source provenance and a closed repair request

### 4.1 Persisted excerpt model

Use the existing AcademicFile/SourceChunk model before introducing a new type.
If the current material record lacks only an optional, backward-compatible
field needed to distinguish a pasted excerpt from a pasted transcript, add it
as the **next** versioned migration (v28 is already owned by lecture capture),
using the approved lossless/idempotent fresh-object migration design:

- existing `paste` records retain their current exact type, title, owner,
  chunks, ranges, ordering, and timestamps;
- only new excerpt records carry the new explicit classification;
- legacy data must never be guessed into an excerpt or recategorized;
- backup/restore/trash selectors retain the additive field; and
- the migration runs twice with no change on the second pass.

Do **not** store raw pasted text separately in localStorage when it already
lives exactly and citeably in `SourceChunk.content`. Do not create a blob for
the text, a remote document, a browser API key, or an external textbook lookup.

### 4.2 Exact Revised Notes generation contract

Update the registered `revised-notes-v1` artifact specification and caller so
the server receives a closed selected-source set plus the explicitly selected
baseline file/chunk ids. The product rule to encode is:

> Create a Revised Notes material from the student-selected sources only. The
> student's own notes are the baseline: preserve their organization, language,
> and emphasis where possible. Compare those notes against the complete
> selected lecture transcript and instructor-provided materials, then add or
> clarify only details those sources directly support.
>
> Improve gaps in the student's record without turning it into a study guide,
> textbook chapter, summary of outside knowledge, or replacement for the
> original notes. Preserve meaningful instructor terminology, distinctions,
> examples, and qualifiers.
>
> Every factual passage must include one or more traceable references to the
> selected source material. If sources conflict or do not settle a detail,
> place the competing details in an Unresolved source difference section with
> both traces. Never silently choose a version, invent a fact, or use general
> background knowledge.
>
> Return a coherent lecture-note document with clear sections, source-linked
> passages, and unresolved differences only when they genuinely exist.

Implementation requirements:

1. Validate baseline eligibility before source synchronization and before the
   Edge Function request. A missing/invalid baseline fails locally with the
   no-baseline recovery and produces no source sync or generated artifact.
2. Preserve the current `SOURCE_ONLY` control, server-resolved source IDs,
   assembled spec hash, citation closure, response schema, and malformed-output
   fail-closed behavior.
3. Explicitly include baseline identity in the artifact request and persisted
   result provenance so a reload can explain which selected material was the
   student's record. Do not claim a source was used merely because it was
   selected; keep existing selected/used/unused distinction.
4. Enforce that a passage cannot cite a chunk outside the selected set, that
   a baseline cannot be silently substituted, and that unresolved differences
   include both actual supporting traces. No general/background fallback is
   permitted.
5. The Edge Function remains transport/enforcement. It must not own a copied
   product prompt, receive a provider key from the browser, or find its own
   sources. Keep `AI_PROVIDER` unset so the existing Anthropic
   document-citation path supplies provider-attested source locations before
   the app's closure validation. The existing OpenAI secret is out of scope for
   this source-linked artifact unless a later brief adds equivalent independent
   evidence verification.

### 4.3 No accidental work transfer

- Study Guide and Flashcards may use the selected excerpt/source set under
  their own existing generation contracts. This brief does not alter their
  prompts, extra/example rules, artifact schemas, `.apkg` export, or Anki
  boundary.
- Revised Notes is Materials-owned; professor “wink-wink”/class-running notes
  stay in the Notes owner and must not be smuggled into a generated material.
- Do not add an agentic recommendation, office-hours inference, course
  knowledge, or external research path to this generator.

## 5. Tests and verification

Add focused tests before implementation is considered done:

1. **Excerpt intake:** substantial pasted text creates one student-owned
   course material and ordered, exact chunks/ranges; blank or too-short input
   creates neither; typed form state survives validation failure.
2. **Persistence/migration:** a pre-new-version frozen store migrates without changing
   existing files/chunks; current stores retain fields byte-for-byte except the
   documented additive default; two runs are a no-op; backup/restore and trash
   retain the new record/classification.
3. **Baseline boundary:** slides/transcript/excerpt alone cannot invoke
   Revised Notes; choosing a student note enables it; an invalid/deleted
   baseline re-enters the honest recovery without saving anything.
4. **Closed-source request:** the baseline ids and selected source ids reach
   the generation assembler; a generated passage/difference with a foreign,
   missing, or malformed citation fails closed.
5. **Artifact persistence:** a successful source-linked record survives a
   reload; it retains selected/used/unused provenance and does not mutate the
   original note or its supporting files.
6. **UI behavior:** no product-facing internal state-tab row is rendered;
   there are only five Class Hub tabs. The contextual add/generate/recovery
   controls have handlers, names, and keyboard access.

Run and report:

```bash
npm run test
npm run build
```

Then manually verify the new Materials flow in light and dark themes,
keyboard-only and reduced-motion modes, and an empty store. Measure the
completed primary dark and light surfaces before any promotion audit.

## 6. Do not break / prohibited work

- Do not add the mockup lab's large state-selector row to the real app.
- Do not add a sixth Class Hub tab, a second Materials library, a new app
  destination, or duplicate Study Guide/Flashcard/Revised Notes panels.
- Do not alter `BUILD-MANIFEST.md`, global theme tokens, sidebar/app shell,
  auth sync, provider keys, data research, or unrelated dirty files.
- Do not turn an excerpt into a whole-textbook feature or promise copyright
  indexing/search. Do not query the web or a book provider.
- Do not generate from unsupplied material, invent a citation, use general
  course knowledge, silently resolve source disagreement, or overwrite a
  student's notes.
- Do not introduce a metric, score, ranking, confidence, “completion,”
  progress bar, flashcard scheduling, office-hours recommendation, or predictor.
- Do not change Flashcards V1's current working-tree spec edits in this commit.

## 7. Done when

- [ ] Materials retains its existing hierarchy with no large product-facing
  inner state-tab row.
- [ ] A student can add a bounded, named excerpt; it persists as one truthful,
  selectable student-owned source with exact chunks and survives reload.
- [ ] Revised Notes requires an explicit usable student-note baseline; sources
  without one remain visible and route to an honest recovery or the existing
  appropriate artifact owner.
- [ ] The baseline-aware source-only request has the exact product contract
  above, preserves citation closure, and fails closed before a provider call
  on invalid selection.
- [ ] Generated Revised Notes remains a separate Materials record with
  baseline/selected/used/unused provenance and never modifies originals.
- [ ] Source-only tests, migration tests, persistence tests, accessibility
  paths, full suite, and production build pass.
- [ ] The signed-in Supabase end-to-end generation is either demonstrated or
  explicitly still **configuration unverified**. Do not label the associated
  mockup `built` until the six promotion conditions are separately passed.

## 8. Commit

One focused implementation commit after the entire vertical is complete:

```text
feat(academics): add bounded excerpts and baseline revised notes
```

Stage only the implementation, migrations/tests, and any tightly coupled
generation specification changes. Keep current unrelated briefs, mockup work,
and Flashcards V1 edits out of the commit.

## 9. Next stage

Rerun `TAB-BRIEF-PROMPT.md` for Academics after this implementation. Do not
assume the whole tab has reached Stage F: it must re-audit every eligible
Academics owner, visual fidelity in both themes, all buttons, and the live
signed-in provider proof before promoting any lab page to `built`.
