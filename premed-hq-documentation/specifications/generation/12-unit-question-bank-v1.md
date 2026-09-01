# 12 · Unit Question Bank — `unit-question-bank-v1`

The Unit Question Bank is source-grounded practice for one class and one unit. It uses the mastery outline's syllabus standards as the question contract and varies question moves by course style. It is never presented as an official or private exam.

**Runtime objective:** Build a source-grounded question bank for one course unit. Questions must test the supplied mastery standards, vary by course style, and include deliberate cross-standard reasoning where the source supports it. This is practice material, never a reproduction of a private or official assessment.

## Rules

| Rule | Meaning | Kind |
| --- | --- | --- |
| `UQB-SOURCE` | Every question, answer, and rationale must be grounded in one or more supplied source chunks. | invariant |
| `UQB-STANDARDS` | Each question names one primary syllabus standard and may name supporting standards. Transcript concepts are evidence, not Topics. | invariant |
| `UQB-STYLE` | Biology favors applied examples, methods and controls, and cross-standard integration. Psychology and interpretive courses favor situational application and careful concept identification. Use the course blueprint supplied in the request. | invariant |
| `UQB-BALANCE` | Honor the requested current-unit and prior-unit integration mix. Biology defaults to 70% current-unit and 30% prior-unit integration; the student may adjust it. | tunable |
| `UQB-UNIQUE` | Multiple-choice options must be distinct and exactly one answer must be correct. Short-answer questions still need a specific, gradeable answer. | invariant |
| `UQB-NO-COPY` | Use assessment moves and source concepts, not copied wording, stems, or answer choices from supplied private assessment material. | invariant |
| `UQB-GAPS` | Do not manufacture a question for a standard the source does not support. Return fewer questions rather than fill with general knowledge. | invariant |

The runtime artifact spec is `src/lib/generation/artifacts/unitQuestionBank.v1.ts`. The generated response records `courseStyle`, `currentUnitPercent`, `integrationPercent`, and each question's scope, move, standard IDs, answer, rationale, and source chunk IDs.

Before persistence, `validateUnitQuestionBank()` checks source closure, standard
coverage (when a saved mastery map is supplied), actionable/non-ambiguous prompts,
unique IDs and options, exactly-one multiple-choice answer, the requested
current/prior integration mix, and phrase/trigram similarity against any supplied
private-assessment reference. A failed check saves nothing.
