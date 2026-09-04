# 18 · At a glance — derived preview and compatibility contract

**Status: INCORPORATED — not a separate student-facing artifact or API call.**
The former Lecture Brief is now the **AT A GLANCE** opening of the canonical
Study Guide. Its deterministic builder in `src/lib/academics/lectureWorkspace.ts`
remains only for pre-generation previews, source-coverage metadata, and older
saved lectures. The API-generated Study Guide and Mastery Map remain separate
stored resources because the Mastery Map carries objective state rather than
teaching prose.

## Why this distinction matters

The preview is not allowed to imply that a second model read more source
material than the generation pipeline processed. It is assembled
deterministically from the selected readable lecture chunks, while the same
build operation asks the API for `study-guide-v1` and
`unit-mastery-outline-v1`. Source-use coverage is then reconciled against the
verified references carried by those generated artifacts.

## Required preview information

- A concise lecture-in-one-page summary.
- Concept connections when connective source language exists.
- Important vocabulary shown in its source context.
- Professor emphasis and examples only when supported by the source.
- Important processes or comparisons when supported.
- Misconceptions or cautions only when supported.
- A Mastery Map preview and selected/used/unused source coverage.

Once generation succeeds, these are represented inside the Study Guide's
AT A GLANCE opening and its source controls. They must not be rendered as a
second Lecture Brief beside the full guide, and the detailed guide must expand
rather than repeat the opening.

Readable practice-question scenarios may appear as source-backed explanatory
examples when they clarify a concept. Copied stems or answer choices and
standalone question generation stay out of the preview. Distractors are
never treated as factual evidence.

Every displayed claim keeps its exact source chunk id and exposes a Show source
interaction. Empty conditional sections stay absent. Figures remain labeled
not interpreted unless a separate consented vision path is implemented and
verified.

## Future version boundary

Do not reintroduce Lecture Brief as a second generated artifact. A future split
would require a new explicit product decision plus its own registered runtime
spec, structured schema, citation closure, validator, migration, and disclosure.
