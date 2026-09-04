# 13 · Course question blueprints

Question banks use a small course blueprint after the shared `unit-question-bank-v1`
rules are assembled. The blueprint changes the *kind of practice* a student sees;
it never changes the source boundary or the syllabus-led Topic contract.

## Biology

| Runtime default | Value |
| --- | --- |
| `courseStyle` | `biology` |
| `defaultCurrentUnitPercent` | `70` |
| `defaultIntegrationPercent` | `30` |
| question moves | application, integration, method-and-controls, interpretation |

Build linked stimulus sets around biological scenarios, experiments, data, or
diagrams. Every question requires application, and at least half depend on a
visual or quantitative representation. Across a set, progress through moves such
as interpretation, comparison or calculation, prediction, justification, and
experimental design. The student can change the current/prior mix for a bank.

## Psychology

| Runtime default | Value |
| --- | --- |
| `courseStyle` | `psychology` |
| `defaultCurrentUnitPercent` | `100` |
| `defaultIntegrationPercent` | `0` |
| question moves | situational, application, interpretation |

Use evidence-rich situations and careful concept application. Every question
must depend on the supplied scenario. Keep the answer tied to the supplied course
language; do not turn a vignette into generic advice.

## General and interpretive courses

| Runtime default | Value |
| --- | --- |
| `courseStyle` | `general` |
| `defaultCurrentUnitPercent` | `100` |
| `defaultIntegrationPercent` | `0` |
| question moves | application, interpretation |

Anthropology, writing, and other interpretive classes may add a reviewed Course
lens when one exists. Questions still need to identify the supplied standard and
evidence; the lens must not invent cultural context or replace the syllabus.
Direct recall belongs in flashcards and the Mastery Map, not the question bank.

## Classification contract

`src/lib/academics/unitQuestionBank.ts` is the runtime authority. Course code and
title are used together for classification, so a title such as “How Cells
Function” still resolves to Biology even when a code is missing. Unknown courses
resolve to General and do not inherit the Biology 70/30 default.
