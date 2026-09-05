# 11 · Unit Mastery Outline — `unit-mastery-outline-v1`

The Unit Mastery Outline is a source-grounded map for one unit. It preserves syllabus learning standards as the stable Topic contract, then gives each standard four useful study lenses: what to retrieve from a blank page, what to understand, what to be able to do, and what to watch for.

**Runtime objective:** Turn the supplied course evidence into a detailed mastery map. Preserve every explicit objective relevant to the requested scope and organize its distinct source-supported subpoints into Free-recall cues, Understand, Be able to do, and Watch for. This map is the source contract for later study resources, not a transcript summary.

## Rules

| Rule | Meaning | Kind |
| --- | --- | --- |
| `UMO-INSTRUCTOR-CONNECTION` | Ground the objective scope and terminology in identified instructor transcripts and slides; use readings to clarify, not replace or enlarge that scope. Connect application targets and watch-for points to supported instructor examples and distinctions. When a solution relies on both transcript and slide evidence, include the supporting IDs from both within the objective and practice evidence. Preserve pedagogically important sequences and explicitly stated warnings, but do not invent slide numbers, quotes, instructor emphasis or exam predictions. If instructor evidence or a needed example detail is missing, report the limitation rather than claiming complete coverage or fabricating support. | invariant |
| `UMO-SOURCE` | Every standard and every bullet must be traceable to at least one supplied source chunk. | invariant |
| `UMO-EXAM-APPLICATION` | Each objective needs one or two original, self-contained exam-style application questions in examPractice, with an answer, reasoning rationale, and sourceChunkIds supporting the solution. Supply any sequence, values, scenario or other information needed to solve it in the prompt; never refer to an absent diagram. Test application, not definition recall. Label hypothetical scenarios as hypothetical. These are generated practice, not predicted exam questions or instructor-authored questions. Never copy supplied assessment stems or claim a topic will be on the exam. Watch for points should identify concrete tempting errors relevant to solving these tasks. | invariant |
| `UMO-EXAM-SOLUTION` | Make the unfamiliar scenario necessary to solve the question; a decorative vignette followed by a definition is not application. Include all needed quantities, units, sequence orientations, controls and text representations in the prompt. Answer every requested part, then work through the source-supported rule, the relevant scenario evidence, and the inference or calculation in the rationale. Source IDs must be unique and drawn only from the containing objective. Do not reuse a question across objectives, restate the answer as its rationale, fabricate empirical observations, or invent unsupported facts to fill a question quota. | invariant |
| `UMO-OBJECTIVE-IDENTITY` | Preserve the wording of explicitly labeled instructor learning objectives, not incidental transcript dialogue, slide captions, acknowledgments, or assessment stems. Organize supported subtopics under the relevant objective rather than promoting every heading into a new objective. Keep instructor emphasis only when the selected evidence states it; generated applications are never official objectives or exam predictions. | invariant |
| `UMO-STANDARDS` | Use syllabus learning standards or explicitly stated objectives as the stable standard identity. Never promote a transcript-derived concept into a Topic. | invariant |
| `UMO-COVERAGE` | Preserve every explicit objective relevant to the requested lecture, unit, or exam scope and every distinct supported subpoint. Do not merge separate objectives or compress a detailed source outline into a summary. | invariant |
| `UMO-SPLIT` | Separate blank-page retrieval cues, understanding, observable performance, and likely confusion or watch-for points. Do not repeat one sentence across fields. | invariant |
| `UMO-RECALL` | Give every objective one to three objective-specific, source-grounded free-recall cues phrased as direct student tasks such as Explain, Reconstruct, Draw, Trace, or Compare. Each cue must name what the student should retrieve, not say only “explain this topic,” and at least one cue per objective must explicitly require retrieval without notes. When the source supports a process or mechanism, at least one cue must ask the student to explain or reconstruct it from start to finish without notes. | invariant |
| `UMO-DEPTH` | Every saved objective must contain at least five distinct Understand bullets, two objective-specific Be able to do bullets, and one concrete Watch for bullet. If selected sources cannot support that depth, fail instead of padding or inventing. | invariant |
| `UMO-GAPS` | If the source does not support the required sections or depth, do not invent content and do not save a partial objective. | invariant |
| `UMO-CONCISE` | Keep each bullet concise enough to scan before studying; preserve source wording when it carries an official objective, and never reuse a generic application sentence across objectives. | tunable |
| `UMO-PRACTICE-EVIDENCE` | Use supplied questions as evidence of observable tasks, representations, distinctions, and likely traps. Translate those patterns into concrete Be able to do and Watch for bullets without copying stems or treating distractors as facts. | invariant |

The runtime artifact spec is `src/lib/generation/artifacts/unitMasteryOutline.v1.ts`. Its structured response has `title`, `unit`, and `standards[]`; each newly generated standard has `id`, `title`, `freeRecallCues`, `understand`, `beAbleToDo`, `watchFor`, `examPractice`, and `sourceChunkIds`.

## Exam practice and compatibility

`examPractice` contains one or two objects with exactly these content fields:

- `prompt`: an original application task with all scenario facts and required inputs. Include units, sequence direction, control conditions, and any relevant table values or text diagram within the prompt. Do not require another slide, attachment, answer key, or unavailable image. Hypothetical data are teaching inputs, not claimed experimental results.
- `answer`: the complete solution to every requested part; a numerical or sequence answer may be short.
- `rationale`: the worked chain from course-supported principle through scenario evidence to conclusion, including calculations or sequence transformations when needed. Discuss the relevant tempting error where useful, without merely repeating the answer.
- `sourceChunkIds`: nonempty, unique, exact IDs from the containing objective's evidence, which itself must be in the selected-source set. These support the solution principles; they do not falsely authenticate hypothetical observations as empirical data.

The persisted type keeps this field optional only for older records. Reading or validating a legacy outline does not generate practice, migrate student work, or invent content. Existing question-bank workflows can continue validating outlines without exam practice. `generateUnitMasteryOutline()` explicitly requires practice on both initial and repaired results before returning a persistable artifact. A single complete repair uses the same scope, source IDs, source hierarchy, specification and private-assessment boundary. An invalid repair returns no artifact; no partial practice is persisted. The lower-level transport recovery remains separately bounded.

Selected reference-question text is checked locally for copied wording and high lexical overlap. Only marked, selected assessment passages participate; source text is not added to repair diagnostics. Short phrases under eight words are excluded from this heuristic to avoid confusing shared terminology with copying. New prompts are checked for an actionable task, obvious absent-visual references, duplicate prompts across objectives, answer-only/placeholder rationale, and invalid or duplicate source IDs. These are deterministic guardrails, **not proof** of originality, self-containment, scenario dependence, scientific correctness, or full coverage. The model and independent audit must still assess those semantic requirements. Unsupported solutions must fail instead of receiving fabricated evidence.

This artifact remains the existing primary-generator path with independent audit/secondary review; it does not change question-bank provider routing. Its practice is labeled generated practice, not an instructor assessment, guaranteed exam topic, or prediction.

Before persistence, `validateMasteryOutline()` rejects shallow or duplicate
sections, missing or generic free-recall cues, duplicate standard IDs, repeated
generic application bullets, and citations outside the closed selected-source
set. A source set that cannot support the detail floor produces no saved outline
rather than a padded one.
