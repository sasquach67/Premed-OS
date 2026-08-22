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

**Resolved: the page reports observations with their counts attached, never
findings.** *"Your blanks outnumbered your knowledge gaps two to one"* is a
count. *"Blurting improved your grade"* is a claim this app cannot make from one
term, and does not.

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
- **Counts, never correlations.** Every line carries its sample.
- **Percentages state their denominator.** "61% of 23 marked mistakes" — never
  "61% of your mistakes", which would imply the log is complete.
- **The thin state is not a scold.** *"Studying without logging it is still
  studying."* A term too lightly tracked produces no page, and says why.
- U-9: no study score, no method ranking, no term grade for how the student
  worked.

## Appearance

- One narrow column — a page, not a dashboard. Nothing here is a widget, and
  there is no chart.
- Violet accent, matching the rollover ritual it fires from, so the two read as
  one end-of-term moment rather than two features.
- Observations sit in a left-ruled block; the limit note is warning-toned and
  always last, so the page cannot be read without it.
- Solid-with-depth; the banner is the only floating surface.

## Implementation selection — A · Term report

**Ruled Aug. 22, 2026.** The implementation is Variant A, reframed as a
compact **Term report**: a single narrow reading column with an end-of-term
stamp and four ordered sections — the record, count-attached observations,
carry-forward, and the non-causation limit.

This is the spec's "one honest page," made to feel more deliberate than a
reflection card. It is not a dashboard, a printable transcript, or a
per-course scorecard.
The sectioned review remains in the lab as a comparison treatment, but is not a
product subtab. If a later implementation needs a class-specific detail, it
opens from a quiet contextual disclosure without breaking the page's narrative.

The **Too little to say** state inherits this same reading-column composition:
the page remains absent when history is too thin, explains the evidence boundary
without scolding, and never substitutes inferred study data.
