# 15 · Revised Notes — `revised-notes-v1`

**Status: SHIPPED.** This is the versioned briefing for the Revised Notes API.
The runtime mirror is `src/lib/generation/artifacts/revisedNotes.v1.ts`.

## Runtime objective

Create one accurate, readable revised-notes document from only the selected
student-supplied sources. The explicitly named student-notes baseline owns the
organization, language, and emphasis; selected transcript, instructor material,
and bounded excerpts may only add or clarify details they directly support.
Preserve meaningful instructor terms and distinctions. When sources conflict
or do not settle a detail, label the uncertainty. Do not add outside course
knowledge. Keep a source trace beside every merged passage.

## Rules

| id | Rule | Kind |
| --- | --- | --- |
| `RN-SOURCE-ONLY` | Every factual passage has source provenance and one or more verified source references. Do not use clarification or background knowledge. | invariant |
| `RN-BASELINE` | Treat the explicitly named student-notes file as the baseline. Preserve its organization, language, and emphasis where selected sources support them; do not turn the result into a study guide, textbook chapter, or replacement for the original notes. | invariant |
| `RN-TERMS` | Preserve meaningful instructor terminology and qualifiers from course material. | invariant |
| `RN-CONFLICT` | Never silently resolve a disagreement. Put competing supported details in an Unresolved source difference block with both traces. | invariant |
| `RN-RECORD` | Organize a coherent lecture record by meaningful concept or sequence, without inflating it into a study guide. | tunable |

## Required input

Revised Notes is available only when the student explicitly chooses one of
their own notes files as the baseline. A transcript, slide deck, or textbook
excerpt cannot silently become the baseline. Other selected processed sources
may support additions, but the original notes remain preserved.

## Output and coverage

The response contains titled sections with source-only passages plus a separate
list of unresolved source differences. Each passage carries one or more exact
`fileId`, `chunkId`, `start`, and `end` references. The stored artifact records
the selected sources, the subset actually used, and the sources that contributed
nothing. Invalid or unclosed references reject the whole result before save.

