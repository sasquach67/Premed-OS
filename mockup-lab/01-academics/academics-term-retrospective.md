# Academics · Term report — decisions

**Status:** PROPOSED · DECIDED, awaiting manifest authorization
**Source:** `academics-term-retrospective.html` · **Spec:** `tabs/01-academics.md` #43, §6.10-C

## Why it exists

> **#43 Term retrospective** — at term end, one honest page: what worked, which
> methods correlated with your best outcomes, what to carry into next term.
> **The only backward-looking surface in the tab, and the one that makes the
> next semester better.**

It fires from the term rollover ritual (§6.10-C: *"the term retrospective (#43)
fires here — the natural moment"*), and it is why a retired topic is never
deleted — the retrospective reads history.

Undrawn until Aug 20, 2026, found by the same catalogue sweep that surfaced #52.

## The tension this drawing resolves

The spec asks which methods **"correlated with your best outcomes."** One term
of data cannot support a correlation claim, and §6.12 forbids false precision
in the same breath — *"one visibly wrong number costs more than ten vague
ones."*

**Resolved: the page reports useful, plain-English observations with their
evidence attached, never findings.** It may lead with recorded final grades,
returned assignments/exams, and student-marked trouble spots; it then turns
those facts into a small next-term experiment. *"Try a closed-notes check
before re-reading"* is actionable. *"Blurting improved your grade"* is a
causal claim this app cannot make from one term, and does not.

The limit is stated on the page rather than buried: **"One term is not enough to
say a method caused a grade."**

## Product views

| View | Job |
|---|---|
| Term report | The selected one-page report — the record, observations, carry-forward, and evidence limit. |
| Sectioned review | The same record per question, for interrogating one class. |
| Too little to say | A lightly-tracked term, where the honest output is no page. |

## Behaviour

- **Fires at term rollover**, not as a standing tab. It is a moment, not a place.
- Reads history that rollover deliberately preserves — retired topics stay
  queryable precisely so this can run.
- **Useful course context first.** Where recorded, final grades, returned work,
  exams, and instructor feedback are the report's understandable starting
  facts—not internal app counters such as connected topics.
- **Counts, never correlations.** Every pattern carries its sample or named
  source record, and becomes a next-term experiment rather than a conclusion.
- **Percentages state their denominator.** "61% of 23 marked mistakes" — never
  "61% of your mistakes", which would imply the log is complete.
- **The thin state is not a scold.** *"Studying without logging it is still
  studying."* A term too lightly tracked produces no page, and says why.
- U-9: no study score, no method ranking, no term grade for how the student
  worked.

## Appearance

- One narrow column — a readable report, not a dashboard. Nothing here is a
  widget, and there is no chart.
- Violet accent, matching the rollover ritual it fires from, so the two read as
  one end-of-term moment rather than two features.
- Observations sit in a left-ruled block; the limit note is warning-toned and
  always last, so the page cannot be read without it.
- Solid-with-depth; the banner is the only floating surface.

## Implementation selection — A · Term report

**Ruled Aug. 22, 2026.** The implementation is Variant A, reframed as a
compact **Term report**: a single narrow reading column with an end-of-term
stamp and four ordered sections — term-at-a-glance facts, plain-language
course takeaways, specific carry-forward experiments, and the evidence limit.

This is the spec's "one honest page," made to feel more deliberate than a
reflection card. It is not a dashboard, a printable transcript, or a
per-course scorecard.
The sectioned review remains in the lab as a comparison treatment, but is not a
product subtab. If a later implementation needs a class-specific detail, it
opens from a quiet contextual disclosure without breaking the page's narrative.

The **Too little to say** state inherits this same reading-column composition:
the page remains absent when history is too thin, explains the evidence boundary
without scolding, and never substitutes inferred study data.

## Implementation history

- 2026-08-23 — `fix(academics): route and align the end-of-term report` moved
  the saved report out of Ledger's generic tool stack, added its contextual
  reloadable Archive route, and aligned the renderer to Variant A's solid,
  one-column reading composition. It remains **proposed** until its configured
  provider run is proved end to end.
