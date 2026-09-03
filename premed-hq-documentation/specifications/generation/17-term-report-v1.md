# 17 · Term Report — `term-report-v1`

**Status: SHIPPED.** This is the versioned briefing for the end-of-term report
API. The runtime mirror is `src/lib/generation/artifacts/termReport.v1.ts`.

## Runtime objective

Turn only the supplied end-of-term evidence snapshot into a short,
plain-language Term Report.

## Rules

| id | Rule | Kind |
| --- | --- | --- |
| `TR-SOURCE` | Use only evidence IDs supplied in the snapshot. Every takeaway and experiment needs one or more exact evidenceIds. | invariant |
| `TR-NO-CAUSALITY` | Never claim that a study method caused, improved, explains, predicts, or determined a grade or outcome. | invariant |
| `TR-NO-TRAITS` | Do not infer a learning style, habit, amount of study time, trait, diagnosis, rank, score, or prediction. | invariant |
| `TR-EXPERIMENTS` | Phrase each next-term item as a small optional experiment, never an instruction or treatment. | invariant |
| `TR-PLAIN` | Use student-facing language. Do not mention model prompts, internal identifiers, or hidden calculations in prose. | invariant |

## Evidence boundary

The request contains a frozen, student-reviewed snapshot of saved term facts and
any course excerpts the student explicitly selected after disclosure. Every AI
observation refers only to an allowed evidence id. Unsupported references or
causal/trait language reject the result rather than being softened after the
fact.

## Output

Return two to four concise takeaways, one or two optional next-term experiments,
and a plain limitation statement. Every takeaway and experiment carries at
least one exact evidence id. The report supplements the local factual summary;
it never replaces or edits those facts.

