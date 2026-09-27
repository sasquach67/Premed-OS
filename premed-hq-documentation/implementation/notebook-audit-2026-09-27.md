# Notebook generation audit: Sep 27, 2026

This is the public record. The detailed evidence stays on Andy's machine
(`~/Documents/Premed OS Academics Audit/2026-09-27_114133/`) because it quotes
course material, including an instructor exam key whose header forbids sharing.
**Do not copy course or exam content into this repo.**

Scope: the 12 BIOL 103 notebooks Andy studies from. All were generated under
`notebook-workflows-draft-4`.

## Finding 1: study guides tell instead of show

- **E1 (Lesson 2, transcription section).** No worked examples at all. Strand
  complementarity and splicing are explained in roughly 120-word paragraphs.
- **E2 (Lesson 3, Punnett section).** The worked cases exist, but they're
  buried in 60–80 word paragraphs. Andy: "Same problem".
- **Andy:** "i would rather have it 'showing more than telling' … instead of
  trying to overexplain something with convoluted language".
- **Chosen format:** a worked representation plus a one-line reading, with a
  **Show more** for the explanation ("combine 1 and 3").
- **Cause (in the `draft-4` prompt):**
  - It mandates complete explanatory sentences and connected prose.
  - `SG-CONNECTED-EXAMPLES` gives every example a prose recipe.
  - There is no compact worked-representation block.
  - Attribution becomes narration.
- **Fix, step 1 (shipped on branch `notebook/illustration-blocks`):** the v4
  `illustration` block. It is additive, so revision-3 updates of existing
  notebooks still apply.
- **Fix, step 2:** prompt wording, pending Andy's approval of the exact text.

## Finding 2: answer provenance and factual correctness

Andy's requirement (verbatim): "Treat my responses as student attempts,
distinguish them from instructor answers within the same document, and check
the question independently. Compare against matching instructor keys or
explanations and investigate discrepancies … do not equate successful import or
model self-review with verified correctness."

**Lesson 2 check.** Each item was answered independently, then compared with
the textbook pages, the lecture, the Pearson keys and the instructor's Exam 1
key.

**Andy's attempts.** Almost all are correct. The exceptions:
- one incomplete item (end labels missing)
- one imprecise table row
- one ambiguous definition
- two errors in the in-class case-study answers
- a handwritten copy of a question that transposed one base, so it disagrees with Andy's own typed answer

**How the existing notebook did.**

| Did correctly | Did not do |
|---|---|
| Labelled the worksheet's answers "student's own, not an answer key" at the source level | Gave every practice item `provenance: "source"`; nothing says whether an answer came from an instructor key, a publisher key, or a model check of a student attempt |
| Silently fixed several of Andy's gaps | Never told Andy where his attempt differed |
| Built case-study answers from the instructor's lecture, not from Andy's wrong answers | Adopted Andy's imprecise wording for one row and contradicted itself elsewhere in the same notebook |
| Agreed with the instructor's exam key on the items it covers | Never used the exam key; it was in a hidden folder |
| Disclosed that it couldn't read the handwritten sheet | So it could not catch the handwritten miscopy |
| | Put unsourced claims about "the commonest error" into rationales |

**Correction.** An earlier audit note said the only genuine exam items were
three questions quoted in the Exam 1 reflection. **That was wrong.** A full,
keyed Exam 1 (35 items, tagged by learning objective) is in Andy's materials.
The questions phase uses it.

**Proposed prompt rules** (exact wording needs Andy's approval before shipping):
1. Separate instructor questions from student responses by structure, never by formatting.
2. Treat student responses as attempts, never as keys.
3. Answer each question independently, then compare it with keys and attempts.
4. Name each answer's basis.
5. Surface where the student's attempt differs, in one line.
6. Investigate discrepancies before settling them.
7. No unsourced claims about typical errors.
8. Search the materials for keys; a key outranks model reasoning.
9. Import validation and self-review are structural checks, never verification.

## Question provenance (for the questions phase)

| Source | What it is |
|---|---|
| Instructor Exam 1 key | Genuine exam items, with instructor rationales |
| Guided reading worksheets | Assigned course practice, with Andy's attempts |
| Pearson screenshots | Publisher questions, with Pearson's keys |
| Application Questions | 100% generated practice, not exam items |

The generated practice packages are not instructor exams and must not be
presented as exams.
