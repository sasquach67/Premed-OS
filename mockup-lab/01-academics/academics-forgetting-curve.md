# Academics · Forgetting curve — decisions

**Status:** PROPOSED · Stage-A coverage · **⚠️ one blocking conflict (C1)**
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
  a filled `--warning` dot at the crossing point.
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

## ⚠️ C1 — BLOCKING. The exam-day number is not decided, and only Andy can.

**§4.1-L rules an exam line** *"with the projected retention where the curve
crosses it: `≈78% on exam day`. That converts an abstract algorithm into an
actionable number."*

**`U-9` rules** (`05-experience-pillar.md:111`) *"Nothing is scored, ranked, or
compared — not against a bar, not against other students, **not against the
student's own past.** No invented composites."*

Both are binding, and here they point opposite ways. The two defensible reads:

| Read | Argument |
|---|---|
| **The number is fine** | FSRS retrievability is a deterministic model read-out from the student's own review log, not an invented composite. `U-9` was aimed at fabricated scores and rankings, and a physics-style projection with a stated model is neither. Without the number the panel is decorative, which §4.1-L explicitly argues against. |
| **The number violates U-9** | It is a percentage about the student, on the highest-stakes day, presented as fact. §6.14 (observed vs self-reported) and §6.12 (trust) both constrain claims like this, and a projection shown as a number invites exactly the "am I on track?" comparison `U-9` exists to refuse. |

**What the drawing does:** it draws the **crossing** — a fact about the curve —
and leaves the **figure** as a labelled empty slot on the chart itself, so the
omission cannot be mistaken for a design choice. **Do not fill it in code.**

Andy's options, for the record: (a) allow the figure as spec'd; (b) allow a
non-numeric form — "still solid" / "fading" / "likely gone" — which satisfies
both rules; (c) drop the exam line entirely and keep the curve as teaching.
**No option is chosen here.** Related: [[academics-study-method]] C2, the same
collision over the retrievability bar.

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
