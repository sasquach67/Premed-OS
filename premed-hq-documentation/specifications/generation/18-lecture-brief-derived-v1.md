# 18 · Lecture Brief — derived front-page contract

**Status: SHIPPED, DERIVED — not a separate API artifact.** The Lecture Brief
is the concise front of a completed lecture. Its current builder is
`src/lib/academics/lectureWorkspace.ts`; the API-generated Full Study Guide and
Mastery Map remain separate stored resources.

## Why this distinction matters

The Lecture Brief is not allowed to imply that a second model read more source
material than the generation pipeline processed. It is assembled
deterministically from the selected readable lecture chunks, while the same
build operation asks the API for `study-guide-v1` and
`unit-mastery-outline-v1`. Source-use coverage is then reconciled against the
verified references carried by those generated artifacts.

## Required front-page sections

- A concise lecture-in-one-page summary.
- Concept connections when connective source language exists.
- Important vocabulary shown in its source context.
- Professor emphasis and examples only when supported by the source.
- Important processes or comparisons when supported.
- Misconceptions or cautions only when supported.
- A Mastery Map preview and selected/used/unused source coverage.

Every displayed claim keeps its exact source chunk id and exposes a Show source
interaction. Empty conditional sections stay absent. Figures remain labeled
not interpreted unless a separate consented vision path is implemented and
verified.

## Future version boundary

If Lecture Brief becomes its own model-generated artifact, it must receive a
new registered `lecture-brief-v1` runtime spec, structured schema, server-side
citation closure, validator, drift test, persistence migration, and disclosure.
This document alone must never be treated as permission to add that model call.

