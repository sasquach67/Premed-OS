# T1 · Academics — source-grounded Revised Notes V1

**Stage:** C · DECIDED, NOT BUILT

**Scope:** Build the missing **Materials → select sources → Revised Notes**
vertical slice: selector, generation request, citation-closed result, durable
record, and result viewer. This is not a rewrite of Materials, Study Guide,
Flashcards, Canvas, or lecture capture.

Revised Notes is a distinct output. It repairs a student's lecture record from
the course material they selected; it is neither a study guide's organized
teaching plan nor Flashcards' retrieval deck.

---

## 1. Fidelity audit — before implementation

### a. Spec → paper

There is no remaining un-deferred, manifest-cleared Academics behaviour without
a reviewable paper surface.

| Ruled behaviour | Reviewable surface | Decision state |
|---|---|---|
| Select slides, student notes, and/or a pasted lecture transcript, then choose an output | `mockup-lab/01-academics/academics-materials-extensions.html` → `generate`, `artifact-choice` | Documented in `academics-materials-extensions.md` |
| Create a source-linked Revised Notes record; identify unresolved conflicts rather than guessing | Same mockup → `revised-notes-result` | The record contains a literal generation contract and appearance rules |
| Study Guide and Flashcards remain alternate outputs from the same selection | Same mockup → `guide-result`, `flashcards-result`, `flashcards-export` | Already have separate owners; do not merge their models |

The following are explicitly outside this brief:

- A lecture audio recorder. GoodNotes or another tool may make the recording;
  the student pastes or uploads its transcript to Materials.
- Canvas Path B, a course-content lookup, a public resource directory, or any
  external course knowledge. Those are separate source-owner features.
- Flashcard generation, Anki export, Study Guide design, and all Anki review /
  scheduling. Preserve their existing seams.

### b. Mockup → app

| Surface | Current app evidence | Result |
|---|---|---|
| Materials source collection and source sync | `ClassHub.tsx`, `MaterialCatalog`, `syncGenerationSources.ts` | Existing; reuse, do not fork. |
| Study Guide generation | `generateStudyGuide.ts`, `study-guide-v1`, `study-tools` `generate` action | Existing; preserve as a different artifact. |
| Flashcards V1 and class full mock | `flashcards-v1`, `class-full-mock-v1`, `generatedFlashcardDecks`, `generatedMockAttempts` | Existing; preserve. |
| Revised Notes V1 artifact | Registry contains `gap-check-v1`, `study-guide-v1`, `flashcards-v1`, and `class-full-mock-v1` only. `ClassCenterData` has no revised-notes record and no caller exists. | **Missing — first failed ladder stage C.** |

Measured in the live class Materials surface on Aug 21, 2026:

| Layer | Live computed value | Required recipe value | Result |
|---|---|---|---|
| Page | `rgb(33, 30, 26)` | `#211e1a` | Match |
| Panel | `rgb(43, 39, 34)`, `16px` radius | `#2b2722`, `16px` | Match |
| Inner object | `rgb(50, 46, 40)`, `13px` class-card radius | `#322e28`, `13px` | Match |
| Border | `rgb(60, 53, 45)` | `#3c352d` | Match |

The new result must stay on this warm-dark, solid-with-depth ladder. It must
not copy the mockup's inline CSS, introduce glass below the shared banner, or
create a new generator landing page.

### c. Already built — preserve, do not redo

- Course Materials add/import and source chunks.
- Syllabus parsing, safe re-import, class assignment/workspace persistence.
- Shared source preparation and private server sync:
  `prepareGenerationSources()`.
- Two-pass, closed-citation generation in `study-tools`.
- Study Guide, Flashcards V1, class full mock, and `.apkg` export paths.

The recent artifact work is in `8ca4d65`, `d009cb7`, `326a17a`, and `8a5adc5`.
This brief extends that one generation system; it must not duplicate it.

### d. Gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-materials-extensions.html` **YES**. Its `PROPOSED`
lab badge does not override the manifest gate: the manifest expressly clears
the source for implementation. Do not edit the manifest.

### e. Decision-record audit

`mockup-lab/01-academics/academics-materials-extensions.md` has both required
halves:

- **Behaviour:** one selection can lead to Revised Notes, Study Guide, or
  Flashcards; all derive only from selected student material; conflicts remain
  visible; Anki is one-way only.
- **Appearance:** Materials remains the home; source-map selection leads to a
  compact three-choice triad; Revised Notes uses the shared paper/provenance
  result layout; selected sources stay reachable; dense surfaces are solid.

No unresolved A/B/C choice remains. Revised Notes leads visually because it is
the lecture-record repair path, not because it replaces the two other outputs.

### f. Integrations and services

| Dependency | State at start | Requirement |
|---|---|---|
| Local selected class sources | Built | Reuse selection and sync. Never transmit raw source text in the browser's generation request. |
| `study-tools` Edge Function | Built in source | Add this artifact through its existing typed `generate` action and closed citation path. |
| Anthropic generation provider | Code expects `ANTHROPIC_API_KEY` for the two-pass citation flow | **Unconfigured / unproven until a signed-in live request succeeds.** Existing OpenAI embedding credentials do not satisfy `callAnthropic()`. |
| OpenAI key currently in Supabase | May support embeddings only | Do not silently substitute it for the citation-enforced generation path. A provider change requires its own reviewed citation-equivalence work. |
| Supabase auth and function deployment | External configuration | The UI must distinguish signed-out, provider-unavailable, and citation-rejected states. A rendered button is not proof it works. |

### Andy's configuration checklist after the code commit

1. In the correct Supabase project, deploy the current `study-tools` Edge
   Function from this repository.
2. In **Edge Function secrets**, set `ANTHROPIC_API_KEY` and, if desired,
   `ANTHROPIC_MODEL`. Keep both server-only; neither belongs in Vite or a
   browser bundle.
3. Sign in at `https://premedos.app`, upload/paste processed class material,
   select at least one text-bearing source, and generate Revised Notes.
4. Reload the class page: the exact result, selected-source list, source traces,
   `specId`, and `specHash` must still exist.
5. Confirm a conflict stays labeled rather than being silently resolved, and
   inspect browser network traffic to ensure no provider secret or unselected
   material was sent from the client.

---

## 2. References — read before coding

- `mockup-lab/01-academics/academics-materials-extensions.{html,md}`, especially
  `artifact-choice` and `revised-notes-result`.
- `premed-hq-documentation/tabs/01-academics.md` §§4.1-M, 6.2–6.3 and 6.13.
- `premed-hq-documentation/specifications/generation/01-*` and
  `02-global-rules-and-source-modes.md`.
- `src/lib/generation/`, `src/lib/academics/generationPolicy.ts`,
  `src/lib/academics/syncGenerationSources.ts`, and
  `supabase/functions/study-tools/index.ts`.
- `premed-hq-documentation/specifications/generation/04-flashcards-v1.md` for
  the shared student-supplied-material boundary only; do not apply its Anki
  rules to Revised Notes.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`,
  `specifications/01-shared-interface-patterns.md`, and
  `mockup-lab/_shared/_visual-recipes.md`.

---

## 3. FRONTEND — one Materials flow, not a fourth app

### 3.1 Placement and selection

1. Keep the entry in the existing class page **Materials** tab. Do not add a
   class tab, sidebar route, or duplicate material list.
2. Reuse the existing source selector. Each selected text-bearing file must
   show its student-owned provenance and a clear role: course slide/material,
   student's notes, or pasted/uploaded transcript. A file may be selected even
   when it is the only usable source; the UI encourages other useful sources
   without inventing a requirement they do not have.
3. After selection, show one compact **Choose an output** triad. The order is
   **Revised Notes**, Study Guide, Flashcards. Study Guide and Flashcards use
   their existing actions; this brief owns only the new Revised Notes action.
4. If none of the selected sources has processed text, keep the selection,
   explain the missing condition, and offer the normal material-processing
   recovery. Never fall back to general course knowledge.

### 3.2 Generation and result states

1. The primary action is **Create revised notes**. It calls the new typed
   `generateRevisedNotes()` owner and is pending/disabled only for the live
   request; it does not erase source selection or replace it with a spinner
   page.
2. On success, show the generated title, a concise source-linked document, and
   a narrow provenance rail. Every merged passage offers its actual source
   trace; a selected source that was not used is labeled as such, not implied
   to have contributed.
3. Render an explicit **Unresolved source difference** block if the output
   includes one. It must quote/identify both source traces and say that the
   supplied material does not settle the detail. It is not an error and it is
   never auto-resolved by the model.
4. Results must identify themselves as **Generated · Revised notes** and show
   the source count / source links plus `specId`/version in an inspectable
   provenance affordance. Do not call it professor notes, official notes, or a
   study guide.
5. Provide copy and local download/export of the student's own generated note
   as ordinary text/Markdown. This is not an Anki export, does not add a review
   queue, and does not turn the output into a source of unverified facts.
6. Implement friendly and distinct states for: signed out, no processed text,
   source sync failure, provider unavailable, citations not carried, malformed
   response, and an existing saved result. No blank result surface or fake
   success.

### 3.3 Visual translation

1. Match the existing class Materials ladder measured above. Use app tokens,
   never mockup hex literals in app components.
2. Preserve the shared banner and Materials underline. The output selector is
   a quiet tool row, not navigation.
3. Use the existing paper-and-provenance composition: one generous readable
   paper surface with restrained source rail. Avoid long, repeated rectangle
   rows and do not shift to an unrelated dashboard visual language.
4. All hover/loading transitions use the app's shared motion tokens; reduced
   motion resolves directly. Keep keyboard focus through selection, generation,
   result source links, copy, and download.

---

## 4. BACKEND — real Revision Notes generation, not UI copy

### 4.1 Artifact contract and prompt

1. Add a versioned `revised-notes-v1` `ArtifactSpec`, registered beside the
   existing artifact specs. Add a named `revised-notes` Academics artifact to
   `ACADEMICS_ARTIFACTS`; do not rely on the broad `summary` label.
2. Add a distinct structured response schema. It must support:
   - title and ordered note sections;
   - source-linked passages, each with only verified citation references;
   - an explicit `unresolvedDifferences` collection with the competing cited
     statements and a neutral label;
   - selected/used/unused source ids; and
   - `specId` and `specHash` provenance.
   Do not reuse `StudyGuideArtifact` or flatten source traces into an opaque
   Markdown string.
3. The source mode is **SOURCE_ONLY**. Every factual claim and every
   reconciliation must be supported by the selected student material. Editorial
   wording may make a sentence readable, but cannot add a fact, example,
   definition, or course context not grounded in a cited source.
4. The versioned system prompt must state, materially:

   > Create one accurate, readable lecture-note document from only the selected
   > student-supplied sources. Preserve the instructor's terms and distinctions.
   > Reconcile a gap only when another selected source supports it. When sources
   > conflict or do not settle a detail, label the uncertainty. Do not add
   > outside course knowledge. Keep a source trace beside every merged passage.

   It must additionally prohibit silently choosing the "more likely" source,
   writing a textbook explanation, fabricating headings/evidence, or calling
   the result official/professor notes.
5. Require at least one selected, processed text chunk. The generator can make
   an improved record from one source, but only claims a reconciliation when
   multiple selected sources actually support it. Never impose an invented word
   count or pretend source diversity exists.

### 4.2 Server path and source boundary

1. Add `src/lib/academics/generateRevisedNotes.ts`, following the existing
   `generateStudyGuide()` sequence:
   `assertGenerationAllowed` → `prepareGenerationSources` →
   `assembleGenerationRequest` → typed `studyTools.generate` → structural
   validation → persistence-ready outcome.
2. The browser sends only course id, source scope/chunk ids, spec id/hash, and
   assembled request metadata. `prepareGenerationSources` owns the authorized
   source sync; no raw selected source text, provider key, or alternate source
   retrieval goes from the browser.
3. Extend the existing `study-tools` response validation so the two-pass
   closed-citation mechanism validates the new schema. Pass two may reference
   only the verified closed set; a minted, out-of-range, wrong-file, or absent
   citation rejects the whole result and saves nothing.
4. Preserve the current provider seam. The code currently uses Anthropic for
   this two-pass `generate` action and OpenAI only for optional embeddings.
   Do not claim an existing OpenAI secret powers Revised Notes unless the
   citation-equivalent OpenAI generation path has been separately built,
   reviewed, and tested.

### 4.3 Persistence and lossless migration

1. Add a dedicated class-owned `GeneratedRevisedNotes` record to
   `ClassCenterData`, rather than squeezing citation-bearing data into
   `ClassNote.content`. It stores id, course id, generated title, structured
   sections, unresolved differences, selected/used/unused source ids, spec id,
   spec hash, created/updated timestamps, and order.
2. Add the next versioned, lossless store migration that initializes
   `generatedRevisedNotes: []`. It must preserve every existing class-center
   field exactly, be idempotent, and leave frozen input unmutated. Do not
   fabricate provenance for older notes.
3. Saving occurs only after structural and citation validation passes. A failed
   request leaves the old records and the source selection intact.
4. The saved result remains a derived, source-linked document. If a later tool
   offers it in a picker, it must preserve and point back to its original
   student-supplied chunks; it must never become an independent ground-truth
   source that can launder unsupported content into Flashcards or a Study Guide.

### 4.4 Tests

Add focused tests for:

- policy acceptance for `revised-notes` and refusal without sources/course;
- registry/spec hash and structured schema validation;
- source-only prompt invariants, including the conflict/no-resolution rule;
- client caller success and every mapped failure outcome;
- closed-citation rejection for a minted citation and a wrong source file;
- persistence, reload, and lossless/idempotent/frozen-input migration;
- rendering: used versus selected-but-unused source distinction and an explicit
  unresolved-difference block;
- no raw source text or secret in the client request contract.

Run the full test suite and production build. Then perform the authenticated
end-to-end proof in §1f before calling this integration configured.

---

## 5. Do not break / do not broaden

- Never generate from bundled, pre-authored, web-fetched, or general course
  material. The student's selected sources are the evidence boundary.
- Do not create an audio recorder, a fourth output type, a second Materials
  implementation, or another source sync system.
- Do not overwrite or edit student notes/slides/transcripts. Revised Notes is a
  new derived record beside its sources.
- Do not quietly resolve source conflicts, add external explanations, assign
  “high yield,” calculate a score, or introduce completion/readiness metrics.
- Do not change Anki ownership: only Flashcards exports `.apkg`; Revised Notes
  has no Anki behavior.
- Do not expose `ANTHROPIC_API_KEY`, any OpenAI key, Supabase service keys, or
  source text to an unauthenticated client.
- Use design tokens and the existing components; do not copy mockup inline CSS
  or change global theme tokens, shell, typography, or sidebar.

---

## 6. Done when

- A student can enter an existing class's Materials tab, choose processed
  slides, notes, and/or transcript, choose **Revised Notes**, and receive an
  accurately labeled, source-linked result.
- The result contains only closed, verified source citations; an unsupported or
  conflicting detail is absent or explicitly labeled—not guessed.
- Source selection, result, source trace, artifact version, and spec hash
  survive reload. No old records are lost in migration.
- Study Guide, Flashcards, Materials, and the shared class visual language are
  unchanged except for the one shared output chooser.
- Signed-out, unavailable, invalid, and no-source paths explain what happened
  and retain the student's work.
- Unit tests, production build, keyboard flow, reduced-motion behavior, and an
  authenticated Supabase generation test pass.
- The implementation report names the commit and updates the relevant mockup
  record only after all six promotion conditions are evidenced.

## 7. Commit

`feat(academics): add source-grounded revised notes generation`

No unrelated mockup-lab, Flashcards-spec, decision-brief, or term-start changes
belong in this commit.
