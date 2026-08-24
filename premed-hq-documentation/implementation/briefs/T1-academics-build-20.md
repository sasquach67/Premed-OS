# T1 · Academics — grounded Flashcards V1 and the class full mock

**Stage:** C · DECIDED, NOT BUILT

**Scope:** Build the two nested study states that were just drawn: **Materials
→ Flashcards V1** and **Exam Prep → Full mock**. This is one bounded
generation-and-attempt vertical, not a rebuild of Class Hub, Materials, Exam
Prep planning, Anki, or MCAT.

The two surfaces share the only layer that may generate them: a closed,
student-supplied source set. They do **not** share a product home, navigation,
or result model. Keep those seams separate.

---

## 1. Fidelity audit — before implementation

### a. Spec → paper

There is no remaining **un-deferred, manifest-cleared** Academics behaviour
without a paper surface.

| Ruled behaviour | Reviewable surface | Decision state |
|---|---|---|
| Student-material-only Flashcards V1, preview, source inspection, and one-way export | `mockup-lab/01-academics/academics-materials-extensions.html` → `artifact-choice`, `flashcards-result`, `flashcards-export`, `flashcards-unavailable` | Behaviour and appearance added to `academics-materials-extensions.md` |
| Timed class full mock, source/scope eligibility, and post-attempt autopsy | `mockup-lab/01-academics/academics-exam-prep-mode.html` → `full-mock-start`, `full-mock-runner`, `full-mock-autopsy` | Behaviour and appearance added to `academics-exam-prep-mode.md` |

The remaining apparent gaps are not license to add work here:

- Canvas Path B, grade distributions, course-catalog substitutes, and the
  saved-plan work beyond what already landed are deferred or separately gated.
- Lecture **audio** capture was superseded by transcript import. Do not revive
  a recorder in order to feed either generator.
- A practice exam catalog is a different source-owner feature. It must not be
  quietly folded into a generated full mock.

### b. Mockup → app

| Surface | Current app evidence | Result |
|---|---|---|
| Materials source selection and study guide | `ClassHub.tsx`, `generateStudyGuide.ts`, `492832f` | Existing and working; reuse its source-selection / generated-ownership seam. |
| Flashcards V1 | `src/lib/generation/artifacts/registry.ts` contains only `gap-check-v1` and `study-guide-v1`; `ClassHub.tsx` has no flashcard result/export caller | **Missing.** |
| Exam Prep plan, catch-up, and closeout | `ExamPrepMode.tsx`, `examPrep.ts`, `1fb6ea7` | Existing. Do not rebuild it. |
| Full mock / runner / autopsy | `studyMethod.ts` marks `mock` `hasEngine: false`; there is no runner or attempt persistence owner | **Missing.** |

Measured in the live Class Center on Aug 20, 2026: page background
`rgb(33, 30, 26)` / `#211e1a`; panel `rgb(43, 39, 34)` / `#2b2722` at `16px`;
class card `rgb(50, 46, 40)` / `#322e28` at `13px`. That matches the literal
Academics warm-dark recipe. New nested work must preserve this ladder rather
than introduce a second generation or exam visual language.

### c. Already built — preserve, do not redo

- Syllabus import, PDF parsing, ISO dates, and safe re-import: `e638095`,
  `ac23637`, `28011d4`, `227cfb0`.
- Course Materials add path: `1f5d908`.
- Study-guide artifact registration, citation closure, provider call, and
  class-page caller: `795df93`, `509c11b`, `c31590e`, `492832f`.
- Topic linking, Predict, and Pretest: `e44b4ca`, `415c025`, `87cfc20`.
- Existing Exam Prep planning: `1fb6ea7`.

### d. Gate

`BUILD-MANIFEST.md` marks both existing source surfaces **YES**:

| Source extended by this work | Gate |
|---|---|
| `01-academics/academics-materials-extensions.html` | YES |
| `01-academics/academics-exam-prep-mode.html` | YES |

Do not edit the manifest. This brief is executable only for these nested
surfaces; it grants no authority over other Academics mockups.

### e. Decision-record audit

Both records contain the required two halves:

- `academics-materials-extensions.md` rules source-map placement, one generous
  card plus provenance rail, solid warm-dark surfaces, `.apkg` primary / TSV
  fallback, and the one-way Anki boundary.
- `academics-exam-prep-mode.md` rules a temporary focused runner, broad
  eligibility panel, autopsy evidence list, no permanent navigation, and no
  readiness / rank / score composition.

There is no competing A/B/C choice to make for either nested state. The
existing source and scope hierarchy is the decision.

### f. Integrations and services

| Dependency | State at start | Rule for this work |
|---|---|---|
| `study-tools` closed-citation generation | Code exists for the two-pass `generate` action | Add structured Flashcards and class-full-mock artifacts through this one path; never send source text from the browser. |
| AI provider / Supabase runtime configuration | Code may be present but a live authenticated request remains a deployment proof | Implement every unavailable / sign-in / citation-rejection state. Do not call a rendered button evidence that the provider is configured. |
| Anki | No live integration is needed or allowed | Export is one-way only. Never use AnkiConnect, import an `.apkg`, read review history, or create card-level FSRS. |
| `.apkg` writer | **Code and dependency missing** | An `.apkg` contains a SQLite collection in a zip. Before changing `package.json` or the lockfile, name the exact browser-compatible dependency, licence, client bundle cost, and test plan in the implementation report. If it is not already approved, stop that substep rather than shipping a fake `.apkg` download. TSV must remain a real, working fallback. |

---

## 2. References — read before coding

- Flashcard rules, Extra examples, source modes, quality gate, and export:
  `specifications/generation/04-flashcards-v1.md` §§1–14, especially §9.1,
  §12, and §14.
- Generation stack and citation closure: `specifications/generation/01-*`,
  `02-global-rules-and-source-modes.md`, `src/lib/generation/`, and
  `supabase/functions/study-tools/index.ts`.
- Academics placement and full-mock rules:
  `tabs/01-academics.md` §§4.1-I, 4.1-P, 4.1-R, 6.2, 6.3, 6.6, 6.13, and §13.
- The two approved visual targets and their records:
  `mockup-lab/01-academics/academics-materials-extensions.{html,md}` and
  `mockup-lab/01-academics/academics-exam-prep-mode.{html,md}`.
- Translation / interaction rules:
  `implementation/MOCKUP-TRANSLATION-CONTRACT.md`,
  `specifications/01-shared-interface-patterns.md`, and
  `mockup-lab/_shared/_visual-recipes.md`.

---

## 3. Work — one source-grounded pipeline, two owned outcomes

### 3.1 Extend the artifact system, never fork it

1. Add `flashcards-v1` as an `ArtifactSpec`, structured schema, registry entry,
   and generator caller beside—not inside—`generateStudyGuide.ts`. Keep it
   versioned and `specHash`-stamped.
2. Make the Flashcards schema carry the fields in `04` §11: retrieval type,
   front/back or cloze, Extra, tags, stable concept id, and a material citation
   for every card. A card with a missing / out-of-closed-set citation is a
   rejected artifact, not a recoverable card.
3. Add the deterministic portion of the quality gate before persistence:
   malformed clozes, unsupported card type, missing source reference,
   invalid incidental salience, forbidden stock prompts, unanchored comparison
   / change prompts, and malformed `Ex:` placement. Keep model-judged checks
   model-judged; do not pretend heuristics can determine pedagogy.
4. Treat `Ex:` correctly. When the source supports a compact concrete bridge,
   it lives as a subordinate own-line `Ex: …` in **Extra**. It relates an
   abstraction to a familiar instance, without weakening the precise answer or
   hiding a second tested fact. In `SOURCE_ONLY`, omit it if the materials do
   not support it; in a permissive source mode, mark allowed background exactly
   as the generation spec requires.
5. Add a distinct structured artifact for generated class full-mock questions.
   It may share the request/citation closure infrastructure with Flashcards,
   but it must not reuse a flashcard card schema or call a generated question a
   real / past / professor exam.

### 3.2 Persist the correct records, with a lossless migration

1. Add a class-owned generated-deck record that persists the successful
   Flashcards V1 artifact and its source ids / citations / spec hash, so a
   student can reload, inspect, and export the same generated deck. It stores
   **no card review, due, grade, Anki, or FSRS fields**.
2. Add a separate class/exam-owned generated-mock attempt record. It needs the
   named exam assignment, topic scope, source ids, generated questions,
   started / ended timestamps, answers, explicit student flags, and the
   student-confirmed topic/mistake links needed by the autopsy.
3. A generated mock is not the existing `PracticeExam` score model. Do not put
   an invented percentage, readiness value, or automated exam verdict into
   `PracticeExam.score` merely because that field exists for actual assessment
   material.
4. Add the next versioned, lossless store migration. Existing `classCenter`
   values and every unrelated collection must survive byte-for-byte. Test an
   old store, idempotence, and a frozen input. Do not mutate persisted history
   to make an old record look like it had source provenance.

### 3.3 Build the Flashcards V1 Materials path

1. Reuse the current Materials source selector. The student chooses source
   files/chunks first, then chooses **Study guide** or **Flashcards**. No new
   generator landing page and no page-level `Make flashcards` shortcut.
2. The initial state must be deliberately unavailable until selected source
   material has processed chunks. Say what is missing and preserve selection;
   never make a deck from generic course knowledge or a bundled deck.
3. On success, persist then show the mockup's deck summary, one readable
   preview card, type mix, provenance rail, and source-opening affordance.
   Numbers describe this concrete generated deck only; they must not become a
   learning score or completion meter.
4. Export TSV as a real local download. Its columns must preserve enough
   information to inspect / import manually: front, back or cloze text, Extra,
   tags, card type, concept id, source reference, spec id, and spec hash.
5. Implement the mockup's `.apkg` primary action only after the explicit
   exporter-dependency check in §1f. If that check blocks, retain the deck and
   show a truthful, non-destructive exporter-unavailable state; never emit a
   file with an `.apkg` extension that is not a valid importable package.
6. Export success says exactly once that Anki schedules and reviews cards after
   handoff. Premed OS neither imports nor synchronizes the package back.

### 3.4 Build the Full mock loop inside existing Exam Prep

1. Add a **Full mock** entry within the existing dated-exam plan only. Eligibility
   requires one class, one dated exam, a user-confirmed topic scope, and enough
   student-supplied processed material. Each missing piece is dormant with its
   relevant Materials / Topics route; no generic fallback questions.
2. Let the student set/confirm the timed attempt from factual scope information
   or their own input. Do not silently invent a duration from a course name.
   The persisted start timestamp is the timer authority. There is no pause or
   answer-peek path.
3. Render the temporary full-screen runner from the approved target: shallow
   solid top bar, centered question, source-context rail, elapsed time, and one
   explicit **End mock** action. Remove ordinary sidebar and Class Hub tabs for
   the attempt; browser reload resumes the same attempt deterministically.
4. Ending a mock creates an autopsy, not a scorecard. Per question/topic, show
   the student’s answer or self-flag, named source support, and a next action
   to review / connect / inspect the source. The student chooses an
   `AcademicMistake` cause before it is written; no cause, weak flag, or FSRS
   change is inferred merely from an answer.
5. Do not calculate a total, percent correct, readiness number, rank,
   forecast, or “exam-like” verdict. A count needed to navigate within a fixed
   attempt is acceptable; it must not be reframed as performance.
6. Mark the study-method mock step complete only when an attempt has actually
   been ended. A generated question list, an abandoned eligibility check, or a
   closed browser is not completion.

### 3.5 Match the approved UI literally through app tokens

- Materials stays inside the existing Class Hub banner / Materials underline.
  Use the chosen source map → two-artifact choice → centered flashcard preview
  plus narrow provenance rail → one-way export progression. Do not make an
  additional sidebar tab or card wall.
- Full mock stays inside temporary Exam Prep. It returns to Exam Prep for the
  autopsy; it never becomes an MCAT feature.
- Translate the mockup through existing application tokens. Preserve the
  measured ladder `#211e1a → #2b2722 → #322e28`, border `#3c352d`, 16px outer
  panel radius, and 13px inner object radius. Glass is permitted only over
  floating banner art; dense cards, runner, provenance, and autopsy are solid.
- Hover/color changes use the existing short ease-out treatment. Focus order,
  keyboard answer entry, Escape behavior, and `prefers-reduced-motion` must
  work in all new states.

---

## 4. Do not break

- Never generate from material the student did not supply. No pre-authored or
  bundled deck, no generic fill-in content, and no unmarked background claim.
- Never schedule, review, or import cards in Premed OS; Anki owns all of that.
- Do not expose provider keys or source text in client requests. The server
  resolves the closed source set it owns.
- Do not conflate generated class practice with a professor’s real/past/upcoming
  exam, and do not affect MCAT’s distinct practice-content policy.
- No U-9 violation: no composite, readiness score, rank, score percentage, or
  forecast. Do not turn an autopsy into a metric wall.
- Do not rebuild Planning, Class Center, existing Exam Prep plan/catch-up,
  active recall, Syllabus Import, or real assessment-material catalog.
- Do not edit mockup sources, `BUILD-MANIFEST.md`, global tokens, auth sync, or
  an unrelated dirty file. In particular, do not stage the current WIP edits to
  `04-flashcards-v1.md`, `TAB-BRIEF-PROMPT.md`, or the other Academics briefs.

---

## 5. Done when

- [ ] `flashcards-v1` is registered, schema-validated, grounded in a closed
  citation set, and fails closed on unsupported / malformed / uncited output.
- [ ] A selected real class source produces a persisted deck that survives a
  reload; empty or insufficient source material produces the real recovery
  state and saves nothing.
- [ ] An abstract card has the `Ex:` Extra bridge only where the source mode
  permits it; no Extra hides an independent retrieval target.
- [ ] TSV round-trips all stated fields. `.apkg` either imports as a valid
  package with the specified note fields or is explicitly held behind the
  documented dependency decision—never faked.
- [ ] A student can start, reload, end, and autopsy one scoped full mock. The
  resulting local record and only student-confirmed mistakes persist; it never
  renders a score / readiness / forecast.
- [ ] Every new control has a handler or an explicit disabled reason. The
  inert-control audit reports zero unexplained controls.
- [ ] New migration and generation tests pass, as do the full test suite and
  production build. Verify dark and light ladder, keyboard-only flow,
  reduced-motion flow, and a true empty store.
- [ ] Do **not** promote these lab pages to `built` yet unless the six
  promotion proofs, including a successful authenticated provider request and
  configured export route, are captured in the same implementation commit.

---

## 6. Commit

One focused implementation commit after the whole listed vertical is complete:

```
feat(academics): build grounded flashcards and class full-mock loop
```

If the `.apkg` dependency decision blocks the package writer, commit the
completed safe slice separately with a title that names the omission; do not
use the commit title above to imply a working Anki package.

---

## 7. Next stage

After this implementation, rerun `TAB-BRIEF-PROMPT.md` for Academics. It must
re-audit the page rather than assuming Stage F: generated artifacts and the
calendar path still need live integration proof, and other manifest-cleared
Academics pages may still need their own fidelity/promotion passes.
