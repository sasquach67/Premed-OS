# Academics · Learning signals — decisions

**Status:** APPROVED · **A · Priority rail ruled Aug 18, 2026 (Andy)**
**Source:** `academics-learning-signals.html` · **Spec:** `tabs/01-academics.md` §4.1
**Decided under:** `implementation/briefs/T1-academics-learning-signals-decisions.md`

## The ruling

**A · Priority rail wins.** B and C are retired as compositions; their frames
stay in the lab only as the record of what was compared.

**Why A over B.** B's editorial section reads well but demotes the action to a
small text route at the end of a paragraph, and its 128px story-mark column
spends the widest part of a dense class Overview on a label. The signals exist
to change what the student does in the next ten minutes; a reading sequence is
the wrong shape for that.

**Why A over C.** C is the only treatment that puts an interaction between the
student and an actionable signal. At most three signals ever exist, and they
are already scoped to one class — there is not enough volume to justify
progressive disclosure. C also hides the cross-class `TopicLink` proposal
behind the same click, which makes the one decision that needs the most
visible evidence the hardest to reach.

## Behaviour

- This is a small, pull-first panel inside a **STEM class's Overview**, beneath
  that class's next action. It is not a Daily tab, alert feed, or generic study
  coach.
- It shows at most three entries, always **cause → consequence → one action**.
  The action opens the existing owner: Topics/review, Materials, Assignments,
  or the recall summary. The panel never repairs anything in place.
- A signal is absent until its required class evidence exists. Writing and
  General never render an imitation of this panel. When no signal qualifies,
  the whole panel is not rendered — no card, no header, no placeholder.
- A cross-class overlap is only a proposed `TopicLink`; it shows its evidence,
  asks the student to confirm, never merges courses, and never shares credit
  for review automatically.
- No readiness score, composite, ranking, progress bar, or inferred "behind"
  state. A missing signal means the evidence is not there yet and is never
  restyled as a warning or a zero.

## Appearance

- **Placement.** Directly below the class's primary next-action card, inside
  Overview, as the first element of a two-column `grid` —
  `minmax(0,1fr) 330px`, 15px gap, 15px below the next action. The class banner,
  tab row, and underline hierarchy stay identical to Class Hub; this is a
  section of Overview, never a sixth tab.
- **Left column — the signal list.** One `card` (`--card`, 1px `--bd`, 16px
  radius, `0 10px 26px -14px` shadow), 18px padding. Header is eyebrow
  (`Learning signals`) / `h2` / one 12px `--mut` line, with a right-aligned
  10.5px `--dim` `STEM only` boundary label.
- **Signal rows.** Separated by a 1px `--bd` top border, none on the first.
  Each row carries a 7px square-ish status mark at left with a 4px colour halo:
  `--cat` for a routine next move, `--warning` for a timing conflict,
  `--violet` for a cross-class proposal — colour is the signal's *kind*, never
  a severity ranking. Title is 14px Baloo 2 800; the cause line is 11.5px
  `--mut`; the single action is 11px Baloo 2 in `--cat`, a text route, not a
  button. **Exactly one action per row and no second primary button** — the
  next-action card above keeps the view's one primary action.
- **Right column — the evidence rail.** A 330px `card`, 17px padding, headed
  `Why these appear` / `Evidence stays visible`. Facts are `--bd`-separated
  rows: a Baloo 2 `--fg` source label (`Lecture record`, `Assignment record`,
  `Topic proposal`) over the 11px `--mut` record it came from. The rail states
  records, never conclusions.
- **Hierarchy.** Next action → signal titles → causes → evidence rail. The rail
  is deliberately the quietest surface on the row; it justifies, it does not
  compete.
- **Depth and motion.** Solid-with-depth only — glass belongs to the banner
  stat strip per `_visual-recipes.md`, not to this dense class-work panel.
  Motion is `.15s cubic-bezier(.16,1,.3,1)` with a `motion-reduce` fallback;
  focus is `:focus-visible` only.

## Mobile

- Below 760px the grid collapses to one column and the signal list keeps its
  order and full composition.
- **The evidence does not disappear.** The drawn frame currently sets
  `.rail{display:none}` at that breakpoint, which would drop the evidence
  requirement on phones. **Ruled:** on one column each signal's evidence moves
  inline, directly under its cause line, as the same source-label + record pair
  at 11px `--mut`, and the standalone rail card is what is removed — not the
  facts. The `TopicLink` proposal keeps its evidence inline for the same
  reason: it is the row that most needs it.
- Nothing else re-orders, and no signal is collapsed behind a disclosure
  control on mobile either — the C composition was rejected on desktop for that
  reason and the reason does not change on a phone.

## Retired variants

- **B · editorial section** — full-width reading sequence under the next
  action. Not built.
- **C · evidence drawer** — quiet workspace plus a slim right-side drawer.
  Not built.
