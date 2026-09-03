# premedOS Generation Engine — specification set

**Status: APPROVED FOR BUILD, Aug 2026 — documents `00`–`09`, plus the shipped resource briefings `11`–`18`.**
**`10-reading-summary-v1.md` is PROPOSED and is NOT part of that approval**; it carries its own
open decisions and does not gate anything in `09`. Andy reviewed the
educational philosophy and generation behavior, supplied the flashcard authoring standard (`04`),
and resolved all nine open decisions — see the decision log below. **Build against `09` §3, starting
at Phase 0.**

The governing principle, in one line:

> **"Create Study Guide" invokes a versioned premedOS learning methodology. It does not ask a model
> to make something good.**

---

## Read order

| # | Document | Covers |
|---|---|---|
| 0 | [`00-current-state-audit.md`](./00-current-state-audit.md) | What generation exists today, and the dependency graph |
| 1 | [`01-architecture.md`](./01-architecture.md) | The four layers, the assembler, versioning, traceability, the pass model |
| 2 | [`02-global-rules-and-source-modes.md`](./02-global-rules-and-source-modes.md) | Rules applied to every artifact; the three source modes |
| 3 | [`03-study-guide-v1.md`](./03-study-guide-v1.md) | Study Guide generator specification |
| 4 | [`04-flashcards-v1.md`](./04-flashcards-v1.md) | Flashcard generator specification |
| 5 | [`05-presets-and-preferences.md`](./05-presets-and-preferences.md) | Presets, independent controls, persistent user preferences |
| 6 | [`06-visual-system.md`](./06-visual-system.md) | Visual learning system, eight primitives, emphasis, callouts, consistency |
| 7 | [`07-schemas.md`](./07-schemas.md) | Structured output schemas — content blocks, cards, diagrams |
| 8 | [`08-regeneration-and-quality.md`](./08-regeneration-and-quality.md) | Regeneration semantics, edit protection, the quality pass |
| 9 | [`09-migration-plan.md`](./09-migration-plan.md) | Sequenced plan against the real dependency graph |
| 10 | [`10-reading-summary-v1.md`](./10-reading-summary-v1.md) | **PROPOSED, not approved.** The third Layer-2 generator — reading summaries. Three decisions open in its §8 |
| 11 | [`11-unit-mastery-outline-v1.md`](./11-unit-mastery-outline-v1.md) | Unit mastery map: syllabus standards split into understand, do, and watch-for checkpoints |
| 12 | [`12-unit-question-bank-v1.md`](./12-unit-question-bank-v1.md) | Source-grounded practice questions with course-specific moves and adjustable integration |
| 13 | [`13-course-question-blueprints.md`](./13-course-question-blueprints.md) | Biology, psychology, and general question-style defaults |
| 14 | [`14-gap-check-v1.md`](./14-gap-check-v1.md) | Recall gap-check contract and attempt-only interpretation boundary |
| 15 | [`15-revised-notes-v1.md`](./15-revised-notes-v1.md) | Student-notes-baseline revision with exact source traces |
| 16 | [`16-class-full-mock-v1.md`](./16-class-full-mock-v1.md) | Timed class practice mock; never an official or predictive exam |
| 17 | [`17-term-report-v1.md`](./17-term-report-v1.md) | Evidence-bounded end-of-term observations and optional experiments |
| 18 | [`18-lecture-brief-derived-v1.md`](./18-lecture-brief-derived-v1.md) | Derived Lecture Brief front-page contract; not a separate API call |

## Runtime briefing coverage

Every artifact in `src/lib/generation/artifacts/registry.ts` names one Markdown
authority through `authorityDocument`. The assembler includes that versioned
briefing path beside the compiled objective and rules sent to the API. A
registry-wide drift test rejects a generator when its document is missing or
when the runtime objective or rule text no longer appears in that document.

The browser does not fetch repository Markdown and ask a provider to interpret
it at generation time. The reviewed briefing is compiled into the runtime
artifact spec so the exact prompt remains deterministic, hashable, testable,
and available in production without shipping the entire documentation corpus.

| Student-facing result | Briefing | Runtime status |
| --- | --- | --- |
| Lecture Brief | `18-lecture-brief-derived-v1.md` | Derived locally from selected readable chunks; not a separate API call |
| Full Study Guide | `03-study-guide-v1.md` | Registered API artifact |
| Mastery Map | `11-unit-mastery-outline-v1.md` | Registered API artifact |
| Revised Notes | `15-revised-notes-v1.md` | Registered API artifact; requires explicit student-notes baseline |
| Flashcards | `04-flashcards-v1.md` | Registered API artifact |
| Question Bank | `12-unit-question-bank-v1.md` plus `13-course-question-blueprints.md` | Registered API artifact |
| Class Practice Mock | `16-class-full-mock-v1.md` | Registered API artifact |
| Term Report | `17-term-report-v1.md` | Registered API artifact |
| Recall Gap Check | `14-gap-check-v1.md` | Registered API artifact |
| Reading Summary | `10-reading-summary-v1.md` | Proposed only; deliberately not registered or exposed |

## Your 12 deliverables → where they landed

| Deliverable | Document |
|---|---|
| 1. Current-state audit | `00` |
| 2. Proposed architecture | `01` |
| 3. Global learning specification | `02` §1 |
| 4. Study Guide specification | `03` |
| 5. Flashcard specification | `04` |
| 6. Preset definitions | `05` §1–2 |
| 7. Structured output schemas | `07` |
| 8. Source-mode definitions | `02` §2 |
| 9. User-preference model | `05` §3 |
| 10. Regeneration behavior | `08` §1 |
| 11. Quality-control rules | `08` §2 |
| 12. Migration plan | `09` |
| Visual learning system | `06` |

---

## What I added that you did not ask for

Four things, because leaving them implicit would have put the decision in the code again — which is
the failure mode the audit was about.

1. **A defensibility test for "high-yield."** You said mark it "only when there is a defensible
   basis." Without a definition the model guesses and then everything is high-yield. `02` §1.7
   defines five admissible bases and forbids the rest.
2. **Quality checks split into deterministic and model-judged.** Roughly two-thirds of your
   quality list is computable in TypeScript with no model call. Asking a model to audit its own
   output for hallucination is the weakest possible check; asking it to count cloze deletions is a
   waste of a call. `08` §2 splits them.
3. **Stable identity for blocks, cards, and concepts.** Section-level and card-level regeneration
   (your §9) and edit protection (your §11) are both impossible without it, and model-generated ids
   are not stable across runs. `07` §5.
4. **A pass budget.** Cited draft → structure → quality is up to three model calls per artifact
   against a 20/hour limit. `01` §5 makes the cost explicit and proposes where to spend it.

---

## Decision log — ALL RESOLVED, Aug 2026

**No decisions are outstanding. This set is ready to build against.**

| # | Decision | Resolution | Where |
|---|---|---|---|
| **D-1** | Is background visibly marked in `SOURCE_PLUS_BACKGROUND`? | **Marked; the student may hide the inline markers.** On by default, toggle is per-artifact not global, and the header always carries a non-dismissible count — so the *fact* of background never hides, only the decoration. Contradiction blocks are never hideable | `02` §2.3 |
| **D-2** | Pass budget | **Conditional escalation.** 2 calls typical; the third runs only when deterministic checks fire, the artifact is large, or the mode is `SOURCE_PLUS_BACKGROUND`. Rate limit weighted to count artifacts, not calls | `01` §5.2, `08` §2.5 |
| **D-3** | 64 KB request cap | **Invert the transport.** Client sends `chunkIds`; the function retrieves from the table it already owns. Fixes the cap, audit E1, and server-trust of client source text at once | `09` §2.1 |
| **D-4** | APPLICATION cards in MCAT scope | **Permitted, tightly bounded.** No answer choices, one concept, ≤2 sentences of scenario. Anything larger is refused by the gate | `04` §4.6 |
| **D-5** | Regeneration over edited blocks | **Never silently.** Edited blocks locked by default; *Keep my edits* is the default. Orphaned edits are moved, never deleted | `08` §1.4 |
| **D-6** | Anki export | **Yes — one-way `.apkg`, schema designed for it now.** A premedOS note type carries hidden `concept_id`, `source`, and `spec` fields so provenance remains inspectable after export. Premed OS never imports or reads the package back, and scheduling state never exists here | `04` §14 |
| **D-7** | Provider assignment | **OpenAI is the primary Generator; Anthropic is the independent Reviewer.** The server, not either model, closes citations. Anthropic may reject but never silently rewrite OpenAI's artifact. These are current role assignments, not permanent architectural dependencies | `01` §5.3; global intelligence framework, Reviewer Architecture |
| **D-8** | Source coverage disclosure | **Required.** Artifacts record which files they drew from, state coverage plainly, name files that contributed nothing, and flag degraded retrieval | `02` §2.8 |
| **D-9** | Raise figure extraction? | **No.** Occlusion cards authored manually; extraction stays in Phase 6. v1 discloses the limitation and exempts manual cards from generator checks | `04` §10.1 |

### One dependency flagged, per `CLAUDE.md`

`.apkg` is a zip around a SQLite database. **Recommendation: hand-rolled writer, not a library** —
the subset premedOS needs is small and the format is stable, and this codebase's strength is having
few dependencies it does not control. Flagged now rather than discovered mid-Phase-4. See `04` §14.4.

---

## Constraints this set must respect

Carried in from `CLAUDE.md` and existing specs. **These are not negotiable by any preset or user
preference.**

- **MCAT generation stays restricted.** `tabs/02-mcat.md` §2a — qbank questions and CARS passages
  must be externally sourced. `generationPolicy.ts` already enforces this and its scope model is
  correct; the new engine plugs into that gate rather than replacing it.
- **Academics generation stays grounded.** Guardrail 1 — every artifact derives from that class's
  own materials. Empty `groundedIn` is refused.
- **Generated artifacts stay marked.** Guardrail 2 — `owner: 'generated'`.
- **Generated titles never claim to be the genuine article.** Guardrail 3 — `generatedTitle()`.
- **localStorage stays canonical.** Generated artifacts are user data and persist locally first.
- **Signed-out mode must keep working.** Generation requires sign-in; the surrounding app must not.
