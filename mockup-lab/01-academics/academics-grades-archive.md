# Grades & Archive — decisions

**File:** `academics-grades-archive.html` · **Status:** PROPOSED (Aug 2026)
**Spec:** `tabs/01-academics.md` §4.2 tab table · §6.8 (grade ledger) ·
§4.2-D (AMCAS-shaped record) · §6.9 (structural decisions)

The one question this tab answers: **what have I earned?**

## Product views

| View | Slug | Job |
|---|---|---|
| Ledger | `ledger` | The full record, status as a filter. |
| GPA | `gpa` | Dual UNC/AMCAS, BCPM, year-by-year trend. |
| What-if | `what-if` | Scenario mode and the inverse solve. |

## Decisions encoded

1. **Archive is a filter, not a destination.** Withdrawn, completed and
   superseded are status chips on the one ledger. The old split made Archive a
   thin separate page; it is really a filter.
2. **Dual GPA, permanently side by side.** UNC 3.71 and AMCAS 3.66 are shown
   together with the delta explained in one line — the repeated BIOL 101 plus 17
   credits of prior coursework. Students discover this gap in May of their
   application year, which is the worst possible time.
3. **AMCAS truncates rather than rounds.** The true value 3.667 is shown, then
   truncated to 3.66 — stated explicitly rather than quietly rounded to 3.67.
4. **Every attempt of a repeat counts.** Both BIOL 101 attempts stay in the
   ledger. The C+ is marked "Superseded at UNC" but remains in the AMCAS math,
   and the row group says why.
5. **Grade trend by academic year.** Committees read the trajectory, not the
   endpoint, so the shape is rendered. The partial senior year is visibly
   partial.
6. **What-if is weight-aware and inverse-solving.** "You need 84 on the final
   for an A−", plus mathematically irrelevant and highest-leverage items.
   Syllabus policies are listed, applied, and editable — a projection that
   ignores a drop-lowest rule is simply wrong. A curve at instructor discretion
   is named and **excluded** rather than guessed at.

## Deliberately excluded

- **No separate Archive page.** See decision 1.
- **No single academic score.** Cumulative, BCPM, AO and term stay separate.
- **No celebration on a GPA number.** Celebrations are for real milestones.
- **No normalised course titles.** Titles are the transcript strings.

## Rejected alternatives

- **A term-scoped view.** Everything valuable here — the trend, the repeat
  handling, the dual number — is cross-term. Term-scoping is the mistake most
  trackers make and it cannot be retrofitted (§6.9).
- **Showing only the AMCAS number.** Simpler, but it hides the gap that is the
  single most useful thing this tab knows.

## A/B/C in the lab

Per view, declared in `VIEW_VARIANTS`:

- `ledger` — terms as cards · dense transcript · two-column terms
- `gpa` — dual hero · trend first · instrument panel
- `what-if` — landing then inputs · inputs first · solve-first

## The ruling — A for Ledger, GPA, and What-if

**A is the composition for all three product views.** B and C remain in the
lab as the record of alternatives considered; neither is an implementation
target.

### The ruling — Ledger A · Terms as cards

**Why.** A keeps each term's transcript context, its status treatment, and its
own ledger table together. That is the only treatment that makes a repeated or
withdrawn course legible without hiding it in a dense all-history stream.

**Hierarchy.** The term is the unit of scanning. Its term name and small GPA
readout lead; exact transcript strings and course rows are the durable record.
Archive remains a filter on those same rows, never a separate destination.

**Appearance, literally.** In warm-dark, the page background is `#211e1a`;
each term panel is solid `#2b2722` with a `#3c352d` border, `16px` radius, and
the recipe's `0 10px 26px -14px rgba(0,0,0,.55)` depth. Table rows, filters,
and status treatments are solid `#322e28` inner surfaces at `13px` radius;
they are not glass. In paper, the same ladder is `#f7efe1` page background →
`#fffaf0` term panel → `#efe6d4` inner surface, with `#e9e2d5` borders and the
same `16px`/`13px` radii. The mode pill and banner stat strip alone retain the
recipe's glass treatment in both themes.

**Empty state.** “Add prior or current coursework to start a transcript-faithful
ledger.” It offers course entry; it shows neither a made-up standing nor empty
table chrome.

**Re-open in the lab.** `Grades & Archive → Ledger → A · Terms as cards`.

### The ruling — GPA A · Dual hero

**Why.** The permanent UNC/AMCAS pairing is the purpose of this view. A makes
that relationship visible before the breakdown and the academic-year trend;
B buries the pairing, and C turns it into an unreadable instrument cluster.

**Hierarchy.** The two GPA figures lead at equal visual weight, followed by a
one-line explanation of their difference. The academic-year trend is the next
surface; BCPM and supporting breakdowns remain subordinate. AMCAS truncation,
all-attempt repeat handling, and the guide-version note remain explicit.

**Appearance, literally.** In warm-dark, the dual hero and trend panels are
solid `#2b2722` with `#3c352d` borders and `16px` radii. Each paired GPA block
is solid `#322e28` at `13px`; the AMCAS distinction may use the restrained
`#c9a4e8` tint and edge already drawn, never a competing primary accent. In
paper, the same surfaces are `#fffaf0` panels with `#e9e2d5` borders and
`#efe6d4` paired blocks at the identical radii. The banner keeps the literal
layered recipe; its stat strip is the only glass surface in this view.

**Empty state.** “Record graded coursework to compare your UNC and AMCAS GPA.”
No figure, trend, or apparent standing renders until records exist.

**Re-open in the lab.** `Grades & Archive → GPA → A · Dual hero`.

### The ruling — What-if A · Landing then inputs

**Why.** Students first need to see what their selected hypothetical term means
before changing the course-letter assumptions beneath it. A keeps that causal
order while making the controls discoverable; B starts with mechanics and C
elevates one course above the term-level question this Planning view answers.

**Hierarchy and handoff.** This Planning view owns term-level hypothetical
letter-grade scenarios and their separate cumulative and BCPM effects. Its
selected-course “What do I need?” card is a compact, linked summary only. The
full category- and policy-aware calculator lives at **Class page → Assignments**
for that exact course: categories and weights, locked-in work, assumptions for
remaining work, inverse solve, policy handling, highest leverage, irrelevant
items, and the resulting GPA effect. Opening the summary passes the selected
`courseId`; it never asks the student to re-enter data and never creates a
second calculation engine. Both surfaces state that scenarios are scratch work
and do not change the canonical record.

**Appearance, literally.** In warm-dark, the landing/result panel is solid
`#2b2722` with a `#3c352d` border and `16px` radius. Grade-assumption rows,
the compact linked summary, and policy/status rows are solid `#322e28` at
`13px`, with the restrained `#4b9cd3` edge reserved for the active result.
In paper, those are respectively `#fffaf0` / `#e9e2d5` with `#e9e2d5` borders
and the same radii. Only the mode pill and banner stat strip use the literal
glass recipe in either theme.

**Empty state.** “Add an in-progress course and its grade categories to try a
scenario.” It contains a direct path to the selected course’s Assignments
setup, rather than showing a projected result without evidence.

**Re-open in the lab.** `Grades & Archive → What-if → A · Landing then inputs`.

### Implementation constraint carried forward

The authored What-if frame visually contains an inverse-solve card in Planning.
The product ruling above resolves that location conflict: it is implemented as
a compact linked summary there, while the complete calculator is implemented
once on the selected class’s Assignments page. This preserves the mockup’s
information scent and the specification’s one-home rule.

**Decision commit:** `6c4c0fb` — `docs(academics): rule the Grades & Archive
composition for all three views`.
