# 14 · Recall Gap Check — `gap-check-v1`

**Status: SHIPPED.** This is the versioned briefing for the recall comparison
API. The runtime mirror is `src/lib/generation/artifacts/gapCheck.v1.ts`.

## Runtime objective

Compare a student’s free-recall attempt against the supplied source chunks and
report what they covered, what they missed, and what they stated incorrectly —
so the next study action is obvious. This is an assessment of one attempt,
never a judgement of the student.

## Rules

| id | Rule | Kind |
| --- | --- | --- |
| `GC-1` | Every covered, missed, or wrong item cites the chunk that supports it. An item with no citable support is omitted rather than attributed to a general claim. | invariant |
| `GC-2` | Never mark something wrong that the sources do not contradict. Absence from the sources is not evidence of error. | invariant |
| `GC-3` | The suggested grade reflects retrieval on this attempt only. It is not a claim about the student’s understanding, and it never accounts for effort or history. | invariant |
| `GC-4` | Prefer the student’s own terminology when it matches the source’s meaning, so the report reads as a response to what they actually wrote. | tunable |
| `GC-5` | A partially correct recollection is covered with its gap named, not wrong. Getting it partly right is the normal outcome of retrieval practice. | invariant |

## Output and trust boundary

The result separates covered, missed, and incorrect claims, retains the
existing suggested-grade vocabulary, and carries exact source citations. The
server closes citations against its own source chunks before the result is
accepted. A gap check never edits the student’s source material or turns one
attempt into a readiness, ability, or trait judgment.

