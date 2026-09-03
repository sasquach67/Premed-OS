# 16 · Class Practice Mock — `class-full-mock-v1`

**Status: SHIPPED FOR ACADEMICS.** This is the versioned briefing for the timed
class-practice API. The runtime mirror is
`src/lib/generation/artifacts/classFullMock.v1.ts`.

## Runtime objective

Create a timed class-practice mock from the selected student material. It is
generated practice, never a real, past, official, or professor exam.

## Rules

| id | Rule | Kind |
| --- | --- | --- |
| `FM-SOURCE` | Every question must cite one supplied material chunk. | invariant |
| `FM-NOT-REAL` | Never describe the output as a real, past, official, professor, or upcoming exam. | invariant |
| `FM-AUTOPSY` | Do not calculate score, percent correct, readiness, rank, or forecast. | invariant |

## Eligibility and scope

Generation stays unavailable until the class has an exam date, a student-set
exam scope, and processed study material for that scope. The model may vary the
question phrasing and cognitive move only within the supplied evidence. It must
return fewer questions rather than use general course knowledge as filler.

This artifact is for Academics only. It does not create MCAT QBank content,
copy a private assessment, or claim to predict what a professor will ask.

## Output and session behavior

Each question has a stable id, prompt, display order, and one verified source
chunk. The attempt stores answers, flags, current position, and elapsed time so
it can resume after reload. Finishing records the attempt; it does not create an
automatic score or readiness verdict.

