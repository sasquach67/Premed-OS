# Academics · Forgetting curve — decisions

**Status:** PROPOSED · Stage-A coverage · **C1 ruled Aug 18, 2026** · **BUILT**
**Source:** `academics-forgetting-curve.html` · **Spec:** `tabs/01-academics.md` §4.1-L
**Drawn under:** `implementation/briefs/T1-academics-mockup-2.md`

> **Why this file exists.** §4.1-L opens with *"Mockup: the sawtooth panel"* —
> and that mockup did not exist. The maths has been shipped and unused the
> whole time: `src/lib/academics/fsrs.ts:48` exports `topicRetrievability` and
> **nothing imports it.** The surface it was written for was never designed.

## Product views

| View | Job |
|---|---|
| The sawtooth | Show retention over time for one topic, so the review schedule stops being arbitrary. |
| Not enough history | Refuse to draw a curve from one review, honestly. |
| Entry points | Open from the two places the question actually gets asked. |

## Behaviour

- **One topic at a time**, named by a picker. Never a spaghetti of all eighteen.
- **Each review is a vertical reset to 100%**, and **each reset flattens the
  following decay** so the gaps widen — `2 → 5 → 12 → 26` days. That widening
  is the entire argument for spaced repetition; a curve that doesn't show it
  has no reason to exist.
- **History is solid. Projection is dashed. The two are never blurred**, and
  the dash begins exactly at the last real review — not a pixel earlier.
- **The legend is always present**, in plain language, never behind a hover or
  an info icon: each review resets you to 100% · every reset slows the next
  fall · reviews are timed just before you'd forget, because earlier wastes the
  effort and later loses the memory.
- **Fewer than two reviews → no curve.** Show the honest "not enough history
  yet" state. One review is a dot, not a shape. Never fabricate.
- **Deterministic from FSRS stability and retrievability. No API, no model
  call, no network.** The panel is identical offline.
- **Reached from two places**: a topic row (anywhere topics are listed), and
  the exam-scope panel. It is not a tab and not a page.
- It doubles as **the teaching artifact behind §4.1-F** — the picture the
  "how to study" guide points at — which is why the legend has to stand alone
  without a tutorial wrapped around it.

## Appearance

- A standard panel on the class page, holding one inline SVG at full panel
  width. Gridlines at 100/75/50/25/0% in `--bd`; axis labels in Baloo 2 800 at
  10px, `--dim`, tabular numerals.
- **The curve is `--cat` at 2.5px**, round-joined. History is a solid
  polyline; the projection is the same stroke with `stroke-dasharray="6 5"` at
  90% opacity. **Same colour, same weight — only the dash differs**, so the
  eye reads one continuous story with an honest seam rather than two datasets.
- **Reset lines are `--success` at 2px**, drawn from the 100% line down to the
  trough they interrupt, each labelled `review` above the plot.
- **Today** is a thin `--mut` hairline, `2 4` dash, quiet.
- **Exam day is `--warning` at 2px**, `5 4` dash, labelled with its date, with
  a filled `--warning` dot at the crossing point. The crossing carries a solid
  `--card` callout outlined in `--warning`: the figure in Baloo 2 800 at 15px
  `--warning`, `on exam day` beside it in `--mut`, and beneath it the band
  reading in `--fg` with its consequence clause in `--dim`. **The two lines are
  one block** — there is no layout in which the figure renders without the
  reading.
- The **legend is three equal `--muted` cards** below the plot, not a key
  squeezed into a corner — it carries as much design weight as the chart,
  because teaching is half this panel's job. Above it sits a compact stroke key
  (solid / dashed / reset / exam).
- The right rail carries the widening-gaps read-out (`day 2 → 5 → 12 → 26` in
  Baloo 2 800, `--cat`, tabular) and the provenance note that this is computed
  on-device with no API call.
- **The "not enough history" state** is a dashed-border `--muted` card with a
  two-dot progress-free indicator (one filled, one hollow), a plain headline,
  and two real actions. It is contained in the same panel — the panel does not
  disappear, only the curve is withheld.
- Solid-with-depth throughout; glass only on the banner stat strip.
  `:focus-visible` only. The SVG carries an `aria-label` describing the shape.

## ✅ C1 — RULED (Andy, Aug 18, 2026): both forms, always together

**The ruling: the exam line carries a number AND a plain-language reading, and
neither ships without the other.**

This resolves the collision rather than picking a side. §4.1-L's argument was
that a figure is what makes the panel actionable instead of decorative — that
survives. `U-9`'s concern was a bare score handed to the student as a verdict —
that is answered by never letting the number travel alone. **A number with a
plain reading beside it is a measurement; a number by itself is a grade.**

**The wording is banded, never written per-case**, so it cannot editorialise
and cannot drift into encouragement or scolding:

| Projected retention | Reading | Consequence clause |
|---|---|---|
| **≥ 80%** | Should hold | no action implied |
| **55–79%** | Fading | one more pass would hold it |
| **< 55%** | Likely gone by then | worth rebuilding before the exam |

One short clause per band, and no fourth band. The drawing shows the ~55% case:
**`≈55%` · `Fading — one more pass would hold it`.**

**Binding on implementation:** the figure and the reading are one component and
one render. There is no configuration in which the percentage appears without
its band label. Related: [[academics-study-method]] C2, resolved the same way.

## Deliberately excluded — do not add these back

- All eighteen topics on one chart.
- A solid projection, or a dashed history. Blurring them is the one thing that
  would make this panel dishonest.
- An invented curve for a topic with one review.
- A "mastery score", grade, or letter for the topic. `U-9`.
- Any comparison to other students or to this student's other topics. `U-9`.

## Component translation

- One presentational SVG component taking a topic's FSRS state and its review
  log. It owns no scheduling and no persistence.
- It **reads** `topicRetrievability` from `fsrs.ts` — the function that already
  exists and is currently dead. Do not write a second decay implementation.

## States

- ≥2 reviews → the full sawtooth with history, projection, today, and exam line.
- 1 review or 0 → "not enough history yet", no shape drawn.
- No exam date on the class → the curve draws without the exam line; the
  panel is still useful and says nothing about an exam that isn't scheduled.

## Built

Implemented in `src/components/academics/ForgettingCurve.tsx` over
`src/lib/academics/forgettingCurve.ts`. The previously dead
`topicRetrievability` export is now live; `fsrs.ts` itself is unchanged.

**One thing the drawing could not have told us.** A topic stores only its
*current* stability, so drawing every past interval with today's value made all
the teeth identical — and the widening of the gaps, which §4.1-L calls the
whole argument, vanished from the picture. The build reconstructs the stability
that actually governed each interval by replaying the review log through the
shipped scheduler. No schema change, no second model, and the flattening now
appears because it is real rather than because it was drawn that way.

Verified against the demo review log: history solid and projection dashed
beginning at the same review moment, retention jumping back to full at each
reset, the exam line inside the plot, `≈63% on exam day · Fading` rendering as
one block, the legend always visible, and a topic with fewer than two reviews
emitting no polyline at all. Both themes checked; 266 tests and the production
build pass.
