# T1 · Academics — lecture capture and evidence index

**Stage:** C · DECIDED, NOT BUILT  
**Status:** Full implementation brief. Build the approved lecture-capture
surface and its persisted evidence behaviour together. This is an Academics
feature, not a media product and not a prediction engine.

## 1. Fidelity audit — before this brief

### A. Spec → paper

**Pass.** Every manifest-cleared Academics family has an owner surface in
`mockup-lab/01-academics/`. The two HTML files without a paired decision record
are `academics-mode-switch.html` and `class-center-study-hub.html`; both are
concept-only `NO` rows in `BUILD-MANIFEST.md`, so neither is eligible work.

The current, manifest-cleared paper map includes Daily/Class Center,
Assignments, Class Hub, Review, Empty States, Class Types, Exam Prep, Syllabus,
Study Method, Forgetting Curve, Learning Signals, Grade Decisions, Materials
Extensions, Lecture Capture, Topic Linking, Planner, Requirements, Grades &
Archive, Planning Decisions, Planning Cold Start, and Term Rollover. No ruled,
build-cleared Academics feature is missing a button, state, field, or screen.

### B. Mockup → app

| Family | Existing app evidence | Translation result |
|---|---|---|
| Course/class workspace and Materials | `ClassHub.tsx`, `MaterialCatalog.tsx`, local `AcademicFile` and `SourceChunk` records | Shipped foundation. Preserve it. |
| Pasted lecture transcript | `TranscriptImport.tsx` and `lib/academics/transcriptImport.ts` | Partial. It saves student-pasted transcript chunks and honest timestamp absence, but has no capture desk, review workspace, evidence index, proposed material links, or proposed coverage. |
| Lecture capture mockup | `academics-lecture-capture.{html,md}` | Not translated. The app has a small paste form under Materials, not the approved `start`, `review`, `index`, and `unavailable` product views. |
| Professor evidence, real assessments, concept canvas, transcript-faithful coursework | `a64f973` | Built in the preceding pass; do not rebuild them in this brief. |

#### Measured primary record surface — Aug 21, 2026

Measured in the running dark app at
`#/academics/classes/demo-course-biol252?classTab=materials`, using computed
styles rather than token names.

| Surface | Mockup value | App value |
|---|---|---|
| Class-page canvas | `#211e1a` | `rgb(33, 30, 26)` / `#211e1a` |
| Solid content panel | `#2b2722`, `#3c352d` border, `16px` radius | `rgb(43, 39, 34)` / `#2b2722`, `rgb(60, 53, 45)` / `#3c352d`, `16px` |
| Dense nested object | `#322e28`, `13px` radius | `rgb(50, 46, 40)` / `#322e28`; existing selected generation tile uses `13px` |

The current Materials ladder is correct. This does **not** prove lecture
capture fidelity because its approved record surface does not yet exist.

### C. Already built — preserve, do not rebuild

- The single Class Center store; existing `AcademicFile`, `SourceChunk`, topic,
  coverage, and local-blob seams.
- Pasted GoodNotes transcript import. It is a valid, lower-friction alternate
  path and must remain available after capture ships.
- Device-local binary storage in `localBlobStore.ts` and existing academic
  material retention. Persist references, not audio bytes in Zustand or
  localStorage.
- Materials shelf, source ownership/provenance, Revised Notes, Study Guide,
  Flashcards, and one-way Anki export: `00036a5`, `326a17a`, `d009cb7`.
- Professor evidence, assessment catalog/attempt, concept canvas, and
  transcript coursework: `a64f973`.

### D. Manifest gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-lecture-capture.html` **YES**. This implementation is
permitted. Do not alter the manifest.

### E. Decision record

**Pass.** `academics-lecture-capture.md` records both behaviour and appearance:
the recording desk, evidence-first review rail, selected index treatment,
honest unavailable state, warm-dark surface ladder, responsive order, focus,
and reduced-motion outcome. There is no decision-only blocker.

### F. Integrations and services this surface owns

| Dependency | Classification | Student-visible state today | Required result |
|---|---|---|---|
| Local Academic store + IndexedDB blob retention | **CODE BUILT AND CONFIGURED** | Pasted transcript text survives as course material; local blob helpers already retain files without writing their bytes to Zustand | Reuse for local lecture-audio references and delete/repair paths. |
| Pasted GoodNotes/Zoom/other student-owned transcript | **CODE BUILT AND CONFIGURED** | Student can paste a transcript into Materials, with timestamp absence named honestly | Preserve as an equal input path. |
| Browser microphone capture and persistent lecture audio | **CODE MISSING for this use** | No lecture recorder; the unrelated recall-session recorder is temporary response audio only | Build the opt-in, course-scoped capture path and local-only retention. |
| On-device transcription | **CODE MISSING** | Premed OS cannot turn an audio recording into a transcript | Build behind a provider-neutral local seam; it is the default and must not transmit raw audio. |
| Optional cloud transcription | **CODE MISSING** | No cloud-audio transfer exists | Keep off by default. If later selected, require a pre-transfer disclosure and provider configuration; it is not a substitute for local transcription. |
| Transcript analysis, material-link proposals, and evidence index | **CODE MISSING** | Imported chunks are searchable only indirectly through Materials; no evidence review or quote/timestamp retrieval exists | Build the student-started, full-transcript analysis and explicit-confirmation flow. |
| Existing Supabase OpenAI study-tools secret | **NOT A LECTURE-CAPTURE ENDPOINT** | It supports existing selected-source generation, not audio/transcript emphasis analysis | Do not put a key in Vite or reuse this route silently. A later provider-backed analysis endpoint must use server-side secrets and have its own live verification. |

**Andy checklist:** none is required for the local capture/paste path. If this
brief adds a cloud fallback or server-side analysis endpoint, the executor must
give Andy the exact secret/deployment checklist before claiming that optional
path is configured. It must state the visible local-only recovery until then.

## 2. References — read before changing code

- `premed-hq-documentation/tabs/01-academics.md` §4.1-Q, §6.4, §6.7,
  §6.12, §6.14, and acceptance criteria 71 / Lecture capture.
- `mockup-lab/01-academics/academics-lecture-capture.{html,md}` — Variant A,
  product views `start`, `review`, `index`, `unavailable`.
- `mockup-lab/01-academics/academics-materials-extensions.{html,md}` — source
  ownership, material links, and generated-output boundary.
- `mockup-lab/_shared/_visual-recipes.md` and
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.
- `premed-hq-documentation/implementation/component-inventory.md` — reuse
  Materials Tabs, `AnimatedFileUpload`, `InfoTip`, `Resizable`, `DocEmbed`,
  `Card`, `EmptyState`, and quiet motion primitives.
- `src/components/academics/TranscriptImport.tsx`,
  `src/lib/academics/transcriptImport.ts`, `src/lib/localBlobStore.ts`, and
  the current Class Center types/migrations.
- `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`.

## 3. FRONTEND — one nested Materials feature

1. Keep the shared class banner and five-tab class grammar. Lecture Capture is
   a Materials-owned nested state, not a sixth class tab and not a new app
   destination.
2. Replace the isolated paste-only control with one compact entry row offering
   **Record locally**, **Upload audio**, and **Paste transcript**. Paste keeps
   its current timestamp disclosure and does not require recording.
3. Implement the approved product views exactly:
   - **`start`:** the recording desk. One central recording state, small upload
     and input-check affordances, and a quiet one-time course-policy reminder
     at the lower edge. No fake waveform, duration, or processed result.
   - **`review`:** timestamp rail → readable transcript evidence → bounded
     proposal rail. A quote is visually primary; metadata names its lecture,
     timestamp, and source. Student-confirm actions are the only data-changing
     controls.
   - **`index`:** selected A treatment — compact timestamp trail, evidence
     stack, constrained material-connection rail. Search returns exact
     student-supplied quote + timestamp + actual linked-material record. A
     missing phrase and no processed transcript are quiet in-surface states.
   - **`unavailable`:** permission denied, unsupported capture, unusable audio,
     or missing on-device transcription is recoverable. Route to upload, paste,
     or ordinary notes; do not make the course look blocked.
4. Use the existing `Resizable` primitive for the desktop review/index split;
   stack timestamp trail, evidence, then proposal/material rail at narrow
   widths. Use existing `Card`, `Tabs`, `InfoTip`, upload, and focus styling;
   do not create another recorder, rail, or file-card family.
5. Translate only through real signed-in tokens/classes: page → solid panel →
   dense object in the measured ladder. No copied mockup CSS, hex values,
   fonts, radii, width animation, glass on dense transcript/data surfaces, or
   unbounded inner scrolling. Preserve visible focus and direct reduced-motion
   states.

## 4. BACKEND — evidence, not prediction

### 4.1 Additive, course-owned records and migration

Add the minimum additive, versioned Academic data needed for a captured lecture:

- one course-owned lecture record with title, input path (`recorded`,
  `uploaded`, or `pasted`), local audio reference when one exists, transcript
  file id, explicit processing state/error, created/processed timestamps, and
  stable ordering;
- transcript segments that retain their **exact** source text and precise
  time-anchor label. A time must come from the transcript/transcriber; never
  estimate it from segment position;
- descriptive evidence findings that hold an exact segment/quote reference,
  timestamp, source lecture id, and optional measured corroboration; and
- separate, pending-only material-link and coverage proposals. Neither becomes
  a material relationship nor seen coverage until the student confirms the
  existing owner write.

Use a fresh, lossless, idempotent store migration. Backfill existing pasted
transcript `AcademicFile` records into a lecture record only when their
provenance can be preserved without guessing; otherwise leave them as usable
legacy pasted transcripts and offer the review/index only once the student
chooses to process them. Never invent audio, duration, course topic, material
link, coverage, quote, or timestamp.

### 4.2 Capture and transcription boundary

1. A student explicitly starts recording. The browser permission request occurs
   then, never on page load and never in the background.
2. Retain raw audio device-locally through the existing blob-reference seam.
   Do not put bytes, audio data URLs, or a transcription-provider key in
   Zustand/localStorage/a Vite variable. Deleting the lecture removes its local
   blob reference safely and never deletes unrelated Materials.
3. On-device transcription is the default. It must create timestamped source
   segments or fail honestly. It never uploads raw audio by default.
4. Cloud transcription is optional only, explicitly selected, and disclosed
   before bytes leave the device. If its provider is unavailable or unconfigured,
   it must fall back to the `unavailable` / paste-transcript path without
   claiming the audio was processed.
5. Keep the existing pasted GoodNotes path. It must still accept a transcript
   with no timestamp anchors, but then it may offer search/reading only; it
   must not produce an evidence finding that pretends to have a precise time.

### 4.3 Analyse the whole supplied transcript on demand

1. Analysis is student-started from a processed lecture and may be offered
   before a selected exam. It is never background work merely because a lecture
   exists.
2. Pass the **complete, in-order transcript** to the analysis seam. Segments
   may organize storage and cite evidence, but must never rank, filter, or
   discard text before analysis. A test must prove that a short final segment
   remains in the analysis input.
3. Each displayed finding requires an exact quote belonging to the transcript
   and a real timestamp. Validation rejects generated/paraphrased quotes,
   orphaned source ids, missing anchors, and claims that exceed the source.
4. Output remains descriptive: quote, timestamp, linked material when
   confirmed, and measured context such as a returned-to stretch only when it
   is actually calculated. It never says or implies **high yield**, likely,
   confidence, score, rank, readiness, or “will be on the exam.”
5. Material linking and coverage are proposal-only. The UI shows the proposed
   source/topic and an explicit confirm/keep-unlinked choice. Confirming writes
   through the existing Material/coverage owners; dismissing leaves the
   transcript untouched.

### 4.4 Retrieval

Implement deterministic lecture-index search over course-scoped processed
transcript text and confirmed linked material titles. It returns source-backed
quotes only, never an explanation or inferred topic. No processed transcript
means “capture or paste one first”; no match means “no matching lecture moment.”

## 5. Do not break / prohibited work

- Do not remove or regress existing pasted GoodNotes transcript import.
- Do not build a general audio drive, full video analysis, a provider settings
  product, Canvas sync, registrar sync, or a second Materials library.
- Do not upload raw audio by default; do not silently use an external provider;
  do not expose a secret in the client.
- Do not pre-filter transcript segments, use a keyword list as a proxy for
  analysis, score professor importance, predict exam content, or create an
  accuracy ledger.
- Do not silently link material, set topic coverage, or treat unlinked text as
  a fabricated lesson/unit.
- Do not add U-9 scores/composites/rankings/progress bars or mock/sample
  lecture evidence that survives an empty store.
- Preserve keyboard navigation, screen-reader labels, light/dark themes,
  reduced-motion behavior, local-store backup/restore, and existing source
  ownership rules.

## 6. Done when

- `npm run test` and `npm run build` pass; add focused unit tests for time
  anchors, full-transcript assembly, evidence validation, migration idempotence,
  proposal-confirm/dismiss behavior, and local-blob cleanup/absence recovery.
- A course can record locally or upload/paste its own transcript; permission,
  no-audio, unsupported-device, and no-timestamp outcomes remain honest and
  usable.
- Raw audio remains local by default. Grep proves no audio key, raw blob/data
  URL, or provider credential enters Vite, Zustand, persisted localStorage, or
  a normal generation request.
- The analysis request consumes every segment in source order. Grep and tests
  prove there is no top-N/rank/filter gate before it.
- Every displayed evidence finding resolves to a stored student-supplied quote
  and real timestamp; no timestamp means no timed finding.
- Material links and coverage are visibly proposed and write only after the
  student confirms. Reload preserves confirmed records and preserves dismissed
  transcript evidence without side effects.
- The `start`, `review`, `index`, and `unavailable` views match the approved
  hierarchy/literal ladder in both themes, with computed-style measurements
  captured before promotion.
- Emptying the store leaves no demo lecture, duration, quote, material link,
  coverage, or finding on screen.
- Run the global button/menu handler audit from `4fe210f` and paste zero
  unhandled interactive items for the affected surfaces.

## 7. Commit

`feat(academics): build local lecture capture and evidence index (§4.1-Q)`

Stage only these implementation files. Commit unrelated working-tree changes
separately.

## 8. Next stage — not in this brief

After this commit, re-run `TAB-BRIEF-PROMPT.md` for Academics. It must re-audit
the remaining decided screens and then land on the first actual C/D/E/F gap.
Promotion is explicitly out of scope: every Academics surface still needs the
six `built` proofs, including live configured provider proof for any
provider-backed analysis route.
