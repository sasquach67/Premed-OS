# 12 · Unit Question Bank — `unit-question-bank-v1`

The Unit Question Bank is source-grounded, application-first practice for one class and one unit. It uses the mastery outline's syllabus standards as the question contract and builds linked stimulus sets instead of turning flashcards into multiple-choice questions. It is never presented as an official or private exam.

**Runtime objective:** Build a source-grounded, application-first question bank for one course unit. Every question must use a scenario or shared stimulus, and visual or quantitative stimuli must support real reasoning rather than decorate recall. This is practice material, never a reproduction of a private or official assessment.

## Rules

| Rule | Meaning | Kind |
| --- | --- | --- |
| `UQB-SOURCE` | Every question, answer, and rationale must be grounded in one or more supplied source chunks. | invariant |
| `UQB-STANDARDS` | Each question names one primary syllabus standard and may name supporting standards. Transcript concepts are evidence, not Topics. | invariant |
| `UQB-APPLICATION` | Question banks are not flashcards in test form. Do not write direct-recall questions. Every question must require the student to apply, integrate, interpret, predict, calculate, evaluate, or reason about methods and controls in a concrete scenario. | invariant |
| `UQB-STIMULUS` | Every question must reference at least one bank-level stimulus. Use passages, experiments, data tables, graphs, or diagrams; reuse a stimulus across linked questions when that enables multiple reasoning moves. | invariant |
| `UQB-VISUAL` | In Biology, at least half of questions must use a data table, graph, or diagram. Visuals must carry information needed to answer the question, include accessible alt text, and never be decorative. | invariant |
| `UQB-TEXTBOOK-VISION` | When visually readable textbook evidence is supplied, use the lecture objectives, transcript, and assigned questions to select only textbook figures that directly clarify the closed lesson scope. Ignore decorative, tangential, and redundant figures. Never claim a figure was interpreted when only OCR or caption text was available. | invariant |
| `UQB-FACTUAL` | Source-derived facts and schematics must cite supplied chunks. Invented quantitative results must be labeled simulated data in both basis and caption; never present model-invented measurements as empirical findings. | invariant |
| `UQB-PDF-READY` | Keep visual labels, captions, tables, and answer explanations concise enough to render legibly in a printable PDF. The answer key must remain separable from the student question section. | invariant |
| `UQB-STYLE` | Biology favors experimental scenarios, representations, methods and controls, and cross-standard integration. Psychology and interpretive courses favor evidence-rich situations and careful concept application. Use the course blueprint supplied in the request. | invariant |
| `UQB-BALANCE` | Honor the requested current-unit and prior-unit integration mix. Biology defaults to 70% current-unit and 30% prior-unit integration; the student may adjust it. | tunable |
| `UQB-UNIQUE` | Multiple-choice options must be distinct and exactly one answer must be correct. Short-answer questions still need a specific, gradeable answer. | invariant |
| `UQB-REFERENCE-MODEL` | Treat every supplied question source—publisher practice, lecture-slide questions, worksheets, quizzes, exams, problem sets, or other course material—as assessment-pattern evidence regardless of brand. Model its cognitive move, difficulty, scenario type, representations, terminology, and distractor logic across the selected set; recombine those patterns with source-grounded concepts rather than copying the item. | invariant |
| `UQB-NO-COPY` | Use assessment moves and source concepts, not copied wording, stems, or answer choices from supplied private assessment material. | invariant |
| `UQB-GAPS` | Do not manufacture a question for a standard the source does not support. Return fewer questions rather than fill with general knowledge. | invariant |

The runtime artifact spec is `src/lib/generation/artifacts/unitQuestionBank.v1.ts`. The generated response records reusable bank-level `stimuli`, every question's `stimulusIds`, course style, current/prior mix, standards, answer, rationale, and source chunk IDs. Premed OS renders structured tables, graphs, and diagrams itself; the model does not supply image pixels. Saved banks can be exported as a student-ready PDF with the complete answer key after the question section.

Question-bank authorship is Anthropic-only. Claude authors the artifact or the request fails closed; the server does not silently fall back to OpenAI and does not send the bank to OpenAI for review. Server and client validators remain provider-independent.

Before persistence, `validateUnitQuestionBank()` checks source closure, standard
coverage (when a saved mastery map is supplied), required stimulus links, visual
coverage, simulated-data disclosure, actionable/non-ambiguous prompts,
unique IDs and options, exactly-one multiple-choice answer, the requested
current/prior integration mix, and phrase/trigram similarity against any supplied
private-assessment reference. Banks with four or more questions must include at
least one shared stimulus set. A failed check saves nothing.

## Assessment-pattern evidence

The application and visual requirements are based on the current official
[AP Biology Course and Exam Description](https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf),
[released 2025 free-response questions](https://apcentral.collegeboard.org/media/pdf/ap25-frq-biology.pdf),
and representative public [MIT introductory-biology exams](https://ocw.mit.edu/courses/7-013-introductory-biology-spring-2018/resources/exam-2/).
Those sources inform the cognitive pattern only. Their stems, figures, values,
and answer choices are not copied into generated banks.

Internet search is a versioned pattern-research input, not a per-bank license to
copy web images. A routine generation uses this reviewed contract for consistent
latency. External microscopy or photographic assets require a separate retrieval,
rights, attribution, and factual-verification gate before they may be displayed.
