# 11 · Unit Mastery Outline — `unit-mastery-outline-v1`

The Unit Mastery Outline preserves official objectives and otherwise derives
clearly labeled source-supported study objectives without creating syllabus Topics.
Every objective has three study parts: actual course questions, observable
application skills linked to those questions, and factual understanding.

**Runtime objective:** Turn the supplied course evidence into a mastery map organized as How it's tested, Be able to do, then Understand. Preserve every relevant official objective and distinct supported subpoint. Show actual course questions before observable application skills and factual answers in formal exam vocabulary.

## Rules

| Rule | Meaning | Kind |
| --- | --- | --- |
| `UMO-OBJECTIVE-IDENTITY` | Do not require formal learning objectives when readable materials support derived study objectives. Preserve every supplied official objective verbatim in its requirements ledger, including partial, missing and explicitly excluded objectives. Keep the required “Study objective:” prefix for supported derived objectives. Never turn an assessment stem into a new official objective or infer instructor approval. | invariant |
| `UMO-THREE-PARTS` | Each supported objective has exactly three displayed parts in order: How it's tested, Be able to do, Understand. No extra recall, caution, twist, trap or try-one sections. | invariant |
| `UMO-HOW-TESTED` | Begin with one setup line naming the input and exam action. Then quote the actual relevant questions from the class outline, live responses, guided reading questions and lecture, retaining exact wording and required stimulus. Never invent, paraphrase or predict a question to populate this list. Keep source IDs, exact excerpt IDs and needed asset IDs attached to each question for the collapsed Source evidence fold; do not put source tags in question text. Display numbers come from question order. If no real question is supplied, show one honest line explaining that fact and keep questions empty. A missing question alone does not mean the conceptual objective lacks evidence. | invariant |
| `UMO-APPLICATION-SKILLS` | State observable skills in concrete terms: given a named input, interpret, compare, trace, calculate or predict the supported result. Each skill references the actual question IDs it answers; the reader turns those into Q1 Q3 or Q2–Q4 labels. Do not invent question numbers. If there are no course questions, supported skills may have empty question references. | invariant |
| `UMO-UNDERSTAND-FACTS` | State the answers and underlying principles as facts in formal exam vocabulary, not tasks beginning “Explain why”. Cover all supported ideas without duplicating one sentence across fields. Preserve the professor's supported answers and meaningful scientific qualifications. If an answer appears wrong or conflicts with the material, resolve and disclose that conflict through the existing evidence/correction rules rather than silently substitute a contradictory answer. | invariant |
| `UMO-EVIDENCE-AND-GAPS` | Retain exact evidence, source hierarchy, instructor emphasis only where documented, and specific evidence limits when understanding itself is unsupported. A fully unsupported objective stays in coverage without fabricated mastery content. Source fidelity does not permit invented quotes, inaccessible figures or false complete-coverage claims. | invariant |

Do not require formal learning objectives when readable materials support a
source-derived objective. Keep “Study objective:” on derived titles and never
create or modify syllabus Topics. Claims of instructor emphasis require evidence.

## Built-in runtime fields and compatibility

The source-chunk API uses `standards[]`, retaining stable `id`, `title`,
`sourceChunkIds`, and optional `evidenceLimit`. New standards contain
`howTested: {setup, questions:[{id,text,sourceChunkIds}], noQuestionsReason?}`,
`applicationSkills:[{text,questionIds}]`, factual `understand` strings and matching
`beAbleToDo` strings. Each question must quote actual selected source text.
Questions have unique IDs within their objective and skill references resolve
there. Empty questions require a specific noQuestionsReason; populated questions
omit it. Exact quotes and closed citations are checked locally, while semantic
coverage and correctness still require source review.

For newly generated maps, legacy `freeRecallCues` and `watchFor` are empty arrays,
and `examPractice` is empty: never invent objective questions. Their old optional
or required schema fields remain accepted for reading stored records and existing
question-bank consumers. No old stored field is deleted or rewritten. New map
validation requires useful nonempty factual understanding and application skills,
closed source evidence and complete question references; it has no numeric detail
quota. A bounded full-artifact repair uses the same sources and rules; a second
invalid result is not saved. A successful validation is not proof of learning.

## Shared source and formatting contract

[19-study-source-and-format-contract.md](19-study-source-and-format-contract.md)
is included directly in runtime instructions. Personal class notes retain their
student-authored role and do not establish instructor approval or answer keys.

## Portable objective coverage

**External Review runtime objective:** Turn the supplied course evidence into a
mastery map organized as How it's tested, Be able to do, then Understand.
Preserve every relevant official objective and distinct supported subpoint.
Show the actual course questions before observable application skills and factual
answers in formal exam vocabulary. This is a preparation map, not a claim that
the learner has mastered the material or that a question will appear on an exam.

For external Review, EC-MASTERY-TASKS supersedes the display part of
`UMO-HOW-TESTED`: How it's tested shows an exam forecast (a setup line in the
instructor's voice, 3–4 question-shape rows and a basis line), a soft launch into
the practice set. The actual class questions stay quoted in `questions` as
evidence for skill references and appear in Practice in structured form. Forecast
rows are likely question shapes, never full items or copies of class questions.

External Review uses the shared rules above with the field mapping below. Old
records retain their stored fields; new authoring does not impose recall cues,
cautions, original question quotas or numeric detail floors.

### Portable fields and compatibility

For each new external v4 Review objective, use:

- `howTested: {setup, forecast, basis, questions, noQuestionsReason?}`.
  `forecast` holds 3–4 `{format, text}` rows and `basis` one line (EC-MASTERY-TASKS).
  Each question has `{id, text, sourceIds, excerptIds, assetIds?}`. Question IDs are
  unique within the objective. `questions: []` requires a concrete `noQuestionsReason`; omit
  that field when questions are present. Quotes and excerpts must match.
- `applicationSkills: [{text, questionIds}]`. References use question IDs from
  this same objective. A skill needs at least one reference when actual questions
  are present. Keep `beAbleToDo` as compatible skill-text strings alongside this
  structured representation; it is not another displayed part.
- `understand` holds factual answer statements in exam vocabulary.
- Required legacy `freeRecallCues` and `watchFor` are empty arrays for new
  authoring. Never erase these or other stored fields when updating an existing
  notebook; preserve prior content losslessly while the reader hides retired
  presentation fields.

Keep `requirementId`, objective identity, exact source/asset links and usable
Practice references. The class questions in How it's tested are quoted evidence
of application, not permission to expose practice solutions before reveal.
Practice remains on its separate tab; the study guide retains the grouped-term
contract. Neither source tags nor reviewer chrome belongs on the questions.
