# T1 · Academics — build the selected output-first Materials intake

**Stage:** C · DECIDED, NOT BUILT
**Status:** implementation brief. This is one bounded Materials-flow build,
not permission to rebuild the whole Academics tab or to replace later
annotation-backed app decisions.

## 0. Outcome

Build the selected **A · Anchored source map** interaction into the existing
class **Materials** tab. A student starts with the artifact they want—**Study
Guide**, **Flashcards**, or **Revised Notes**—then selects or adds only the
class material allowed to ground that one artifact. The selected artifact stays
visible until the student generates, cancels, or reaches the existing result
surface.

This replaces the old persistent `Add material` generator entry and direct
"all available chunks" generation. It does **not** remove the Material
catalog, syllabus import, lecture-capture, assessment, or existing generated
artifact surfaces.

## 1. Step-1 audit

### A. Spec → paper

The active amendment is fully drawn and decided:

| Ruled behaviour | Approved paper evidence |
| --- | --- |
| Artifact-first Study Guide, Flashcards, and Revised Notes paths | `academics-materials-extensions.html` product views `study-guide-intake`, `flashcards-intake`, and `revised-notes-intake` |
| Selected artifact stays visible while sources are chosen | Variant A source map, selected-source tray, and compact output rail |
| Only student/class material may ground an output | Source ownership/readiness markers and the paired Materials decision record |
| A file without readable text is not usable evidence | `source-not-ready` recovery state |
| No usable material gives an honest recovery, not a generated answer | `no-eligible-source` recovery state |
| Revised Notes repairs a selected student note, never overwriting it | `revised-notes-intake` hands off to the existing baseline/no-baseline states |
| Flashcards leave Premed OS one-way for Anki | `flashcards-intake` leads to the existing export surface |

Variant A is explicitly selected in
`mockup-lab/01-academics/academics-materials-extensions.md`. Its behaviour,
appearance, responsive hierarchy, and decision reason are recorded there.
Stages A and B therefore pass.

### B. Mockup → app

| Surface | Current implementation evidence | Result |
| --- | --- | --- |
| Materials header | `src/components/academics/ClassHub.tsx` renders `Import syllabus`, persistent `Add material`, `Paste excerpt`, direct Study Guide / Flashcards actions, and overflow actions | **Divergent.** The old toolbar-first flow remains. |
| Study Guide / Flashcards | `StudyToolActions` directly calls existing generators using available class chunks | **Partial.** The source-only generators exist, but there is no artifact-contextual source picker. |
| Revised Notes | `RevisedNotesPanel.tsx` and `generateRevisedNotes.ts` implement the student-note baseline contract | **Partial.** The behavior exists but discovery is below the Materials shelf instead of through the selected output’s intake. |
| Intake and recovery family | `academics-materials-extensions.html` views noted above | **Missing in `src/`.** |

#### Measured visual baseline — August 21

The mockup dark ladder is a visual role reference; its inline values must not
be copied into the application. The previous inspection of the running app
shows its light theme uses a different, valid token ladder:

| Surface | Approved mockup role/value | Running app, light-theme value |
| --- | --- | --- |
| Canvas | dark canvas `#211e1a` | `rgb(247, 239, 225)` / `#f7efe1` |
| Solid intake panel | dark solid `#2b2722`, border `#3c352d`, `16px` radius | Existing Materials content is transparent, with `rgb(233, 226, 213)` border and `14.4px` radius |
| Dense source object | dark nested `#322e28`, border `#3c352d`, `13px` radius | Existing primary generator is `rgb(75, 156, 211)`, transparent border, `12.4px` radius |

The build must create the analogous **solid** panel/object ladder from the
real token system in both themes. It must measure all three rungs after
implementation. It must never make light mode dark merely to match a dark
mockup screenshot.

### C. Already built — preserve, do not rebuild

- Class Hub’s five-tab grammar, Material catalog, provenance, file storage,
  assessment catalogue, and Materials-versus-Notes distinction.
- Source-only generation policy and the existing `generateStudyGuide`,
  `generateFlashcards`, and `generateRevisedNotes` functions.
- The bounded textbook excerpt flow, generated-output storage, and Revised
  Notes baseline/no-baseline paths.
- Flashcard `.apkg`/TSV export as a one-way Anki handoff. Premed OS neither
  imports, reviews, schedules, self-rates, nor reads back cards.
- Every app annotation made after the mockup. An annotation is a later product
  ruling, not screenshot drift to delete.

### D. Gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-materials-extensions.html` **YES**. Do not edit the
manifest.

### E. Integrations and services the surface owns

| Dependency | Classification and verification | What the student sees today | Work in this brief |
| --- | --- | --- | --- |
| Private source mirror and rate-limit schema | **CODE BUILT AND CONFIGURED.** Remote migration list contains `20260727` and `20260811`; the source-store and usage-bucket migration is present. | No useful source picker; direct actions still use the older flow. | Reuse it; do not change the schema or localStorage shape. |
| `study-tools` Edge Function | **CODE BUILT AND CONFIGURED.** Remote function list reports `study-tools` as `ACTIVE`, JWT-verified, version 5. | Existing actions can reach the protected service only after sign-in and source disclosure. | Preserve private server retrieval; do not send source text in a generation request. |
| Anthropic generation and optional embeddings | **Configured names present.** The Edge Function has `ANTHROPIC_API_KEY` and `OPENAI_EMBEDDING_API_KEY` configured; `AI_PROVIDER` is unset, leaving the citation-verified Anthropic generation path active. Secret *values* were not read or exposed. | Existing failures correctly leave local data unchanged, but this pass has not performed an authenticated real-material generation. | Reuse Anthropic's citation-verified path. Do not switch generation to the weaker OpenAI path or add a browser key. |
| Actual signed-in output proof | **Not yet verified.** This is a user-data operation, not a configuration gap. | No current proof that a real class source produces each saved artifact and Anki-importable deck end to end. | Add an explicit promotion test plan; do not generate from demo or invented content just to claim success. |

There is no Andy account checklist in this build: the code, deployed function,
remote schema, and required secret names are already present. If an actual
authenticated request reports provider-unavailable later, report the exact
safe status/error and stop that integration item; do not ask for or expose
another API key preemptively.

## 2. References — read in full before implementation

- `premed-hq-documentation/tabs/01-academics.md` §4.0b, §4.1-I, §4.1-Q,
  §6.2, §6.3, §6.7, §6.12, and §6.14.
- `mockup-lab/01-academics/academics-materials-extensions.{html,md}` —
  **Variant A only** is the implementation source of truth; retain B/C only
  as comparison history.
- `mockup-lab/_shared/_visual-recipes.md` and
  `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.
- `premed-hq-documentation/implementation/component-inventory.md` — reuse
  `Button`/Smooth Button, `Dialog`, `Select`, `CollectionState`, `EmptyState`,
  `DocEmbed`, `Tooltip`/`InfoTip`, Sonner, and the existing mobile sheet.
- `src/components/academics/ClassHub.tsx` and
  `src/components/academics/RevisedNotesPanel.tsx`.
- `src/lib/academics/generateStudyGuide.ts`, `generateFlashcards.ts`,
  `generateRevisedNotes.ts`, `syncGenerationSources.ts`, and
  `flashcardExport.ts`.
- `src/lib/intelligence/studyTools.ts`,
  `supabase/functions/study-tools/index.ts`,
  `supabase/migrations/20260727_d6_ai_coverage.sql`, and `supabase/DEPLOY.md`.
- `premed-hq-documentation/specifications/generation/04-flashcards-v1.md`.

## 3. BUILD — one shared artifact-intake implementation

### 3.1 Replace the entry architecture, not the existing data model

1. Keep **Import syllabus** in the Materials header as class setup.
2. Remove the persistent header-level **Add material** generator CTA and the
   separate always-visible **Paste excerpt** CTA from that header.
3. Retain one prominent **Generate study guide** action and a quiet,
   accessible **Create study material** menu/overflow containing **Generate
   flashcards** and **Generate revised notes**. This preserves §4.1-I's one
   dominant action without a long tab/tool strip.
4. Each action opens one shared, artifact-contextual intake surface. Do not
   create three copied components or separate navigation tabs.
5. Closing, cancelling, or navigating back returns to the same Materials
   shelf without creating, deleting, or silently changing a source or output.

Use a shared typed artifact enum/model and one `MaterialGenerationIntake`
composition (or a clearly equivalent existing component). Artifact-specific
rules configure that component; they do not fork the source-picker UI.

### 3.2 Source selection and input paths

Implement Variant A’s hierarchy with real application tokens:

- a solid bounded source-map panel, not translucent glass;
- the selected output anchored beside the source field on desktop, with a
  compact explanatory rail;
- the selected-source tray below the map; and
- a single contextual source-action chooser, not a permanent header toolbar.

The chooser exposes only these input paths, all scoped to the current class:

1. **Existing eligible material** — file/chunk has readable, processed text.
2. **My notes** — an eligible item owned by the student; it is the required
   baseline choice for Revised Notes.
3. **Lecture transcript** — reuse the existing transcript/capture path;
   do not create a second transcript store.
4. **Instructor/course material** — reuse the existing class-material upload
   or file intake path in the selected artifact’s context.
5. **Pasted textbook excerpt** — one named, bounded excerpt using the existing
   excerpt flow. Do not offer full-textbook upload, fetching, OCR, external
   lookup, or a general textbook corpus.

After adding/pasting through a contextual path, return to the intake with the
chosen artifact intact and the item’s state truthful. A source becomes
selected only through an explicit student action.

Use source identity, owner, and readiness from the existing records—never
guess source type from its title. When a file has no usable chunks, preserve
its identity as **not ready for generation** and offer only: add readable text,
wait/retry its existing extraction route where one exists, or select/add a
different allowed source. Never display an invented preview or treat the raw
file as evidence.

### 3.3 Artifact-specific handoffs

All three artifacts must receive **exactly the selected eligible chunks**, not
every chunk in the class by default.

- **Study Guide:** call the existing source-only generator; persist the
  existing generated-note shape and its existing source trace. Return to the
  existing generated guide view.
- **Flashcards:** call the existing Flashcards V1 route, preserve its
  source-trace/validation rules, and lead to the existing `.apkg` primary / TSV
  secondary export view. Never add a starter deck, Anki import, review,
  scheduling, rating, or read-back flow.
- **Revised Notes:** require an explicitly selected eligible **My notes**
  baseline before enabling generation. Pass the baseline and selected chunks
  to the existing generator. It creates a new generated Material artifact; it
  never overwrites the student’s original note. Keep all class logistics,
  wink-wink/professor remarks, and other notes *about the class* in the
  separate class Notes tab.

Do not modify the contents of `flashcards-v1`, Study Guide, or Revised Notes
prompts in this pass. This work is wiring and source-intake behavior, not a
new content ruling.

### 3.4 Backend and trust boundary

Audit and complete only the wiring needed for the selected source set:

- Reuse `prepareGenerationSources()` and its disclosure, fingerprint, private
  mirror, and authenticated retrieval boundary.
- Confirm all generator calls pass the selected chunk IDs and retain their
  existing class-scoped server retrieval. The Edge Function must continue to
  reject chunks outside the authenticated user/course/scope.
- Do not put any provider secret, service-role secret, source content, or
  `VITE_*` provider key in the browser.
- Do not switch `AI_PROVIDER` to OpenAI. The current Anthropic generation path
  is the citation-verified one; embeddings remain an optional retrieval
  enhancement, not evidence.
- Map sign-in, disclosure refusal, no source, rate limit, server unavailable,
  invalid response, and citation-not-carried outcomes to actionable in-context
  states. No failure may save a partial artifact or silently fall back to
  general course knowledge.

### 3.5 Interaction, responsive behavior, and accessibility

- Desktop follows Variant A’s source-map / output-anchor / narrow-rail
  composition. At the relevant narrow breakpoint, stack source map, output,
  tray, then rail; preserve source order and the chosen artifact.
- Use only opacity/transform for the contextual entry/exit; respect
  `prefers-reduced-motion`. Do not animate layout width, margins, or the
  Materials page itself.
- The action menu, chooser, source selection/removal, baseline selection,
  generate button, cancellation, and errors must all be keyboard reachable,
  labelled, focus-managed, and have visible focus.
- Use existing tooltip/InfoTip patterns to explain source-only generation and
  one-way Anki export without adding copy-heavy dashboard panels.
- Maintain the approved system type, icons, colours, radii, and theme tokens.
  No mockup inline CSS values may enter `src/`.

## 4. Verification

### Automated and integration checks

Add/extend tests proving:

1. Study Guide, Flashcards, and Revised Notes receive only the chunk IDs the
   student selected.
2. A no-text file cannot be selected as evidence; recovery retains its
   identity and cannot generate an artifact.
3. Revised Notes cannot generate without an explicit owned-note baseline and
   never replaces that source record.
4. Flashcards keep the existing one-way export boundary.
5. A generation failure—including disclosure refusal, sign-in required,
   no source, provider failure, and citation rejection—persists no partial
   output.
6. Existing generated artifacts, source data, and local store shapes migrate
   unchanged. Do not add a migration unless a new persisted property is truly
   necessary; if one is necessary, obtain an explicit, versioned lossless
   migration and test it.
7. The provider call still requests only server-owned selected chunks. A
   client-supplied source body must not be accepted as a generation substitute.

Run `npm run test` and `npm run build`.

### Visual and behavior proof before calling the build complete

1. Run the mock lab standalone on port 4599 and the app locally; compare the
   approved Variant A and the real Materials tab side by side.
2. In **both themes**, measure computed `backgroundColor`, border colour, and
   radius for canvas → solid intake → dense source object. Report the values
   and prove the application ladder matches the mockup’s *roles*, using real
   tokens rather than copied dark hex values.
3. Keyboard-test opening each artifact, selecting/removing source material,
   choosing a Revised Notes baseline, cancelling, and generating where an
   eligible signed-in source exists. Test reduced motion.
4. Run the 4fe210f inert-control audit across the touched Materials surface;
   assert zero `Button`, `DropdownMenuItem`, or `ContextMenuItem` elements
   lacking a handler.
5. Reload during selection and after every completed artifact. Selected
   source/context may be transient if it is not a stored draft, but no saved
   artifact, original note, selected-source provenance, or source-boundary
   rule may be lost or broadened.
6. Empty the local store and open Materials. It must show a friendly honest
   setup state, with no demo course, source, number, generated note, or deck
   surviving.
7. Do one real signed-in run with material the user selected: generate one
   artifact, download its `.apkg` if Flashcards is exercised, and manually
   import that file into installed Anki Desktop. This is a promotion proof,
   not permission to fabricate a test lecture or deck.

## 5. Do not break / do not decide silently

- Do not build new class tabs, a generator subtab strip, an independent
  material store, a duplicate file uploader, or a separate study-tool
  component family.
- Do not delete annotation-backed changes because older mockups differ.
- Do not render mock/sample class content in an empty store.
- Do not generate from the internet, a stored corpus, a full textbook, prior
  decks, or general model knowledge. The source boundary is class/student
  material only.
- Do not change provider secrets, auth, RLS, migrations, model prompts,
  flashcard content policy, colour tokens, fonts, theme system, or Anki
  ownership without a new explicit ruling.
- Do not introduce a score, readiness/progress bar, ranking, confidence
  percentage, or invented metric.
- Do not make dense Materials content glass. Glass remains limited to true
  floating surfaces per the contract.

## 6. Done when

- One shared output-first Materials intake implements Variant A for all three
  artifacts; no permanent `Add material` or `Paste excerpt` generator control
  remains in the header.
- Every artifact preserves selected-source context and reaches its existing
  generator/result handoff with only eligible selected chunks.
- Revised Notes has its explicit baseline and remains a Materials artifact;
  class Notes remains separate.
- Existing source-only, citation, private-server, and one-way-Anki rules are
  proved by tests and behavior checks.
- Both themes pass the measured visual ladder check; keyboard and
  reduced-motion checks pass; the inert-control audit reports zero.
- `npm run test`, `npm run build`, reload proof, and empty-store proof pass.
- The real signed-in source run is either proved or reported as the sole
  remaining promotion condition. Do not promote the lab page unless all six
  `VARIANT-LAB.md` promotion conditions pass.

## 7. Commit

`feat(academics): build output-first Materials intake`

Commit unrelated working-tree changes separately.

## 8. Next stage — promotion audit (not in scope here)

Re-run `TAB-BRIEF-PROMPT.md` for Academics after this build. It must audit
the broader tab again and either identify the next first blocked surface or,
for this Materials page when applicable, apply the six-condition
`PAGE-PROMOTION-PROMPT.md` test. Do not mark the page `built` in this pass.
