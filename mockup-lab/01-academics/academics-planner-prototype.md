# Academics Planner — prototype decisions

> **Status:** APPROVED · **A + C ruled Aug 19, 2026 (Andy)** — the whole-plan
> board with the selected-course inspector on demand.
>
> **Mockup:** `academics-planner-prototype.html`
>
> **Decided under:** `implementation/briefs/T1-academics-planner-decisions.md`

## Current spec boundary

The July 2026 spec supersedes the old **Planner & GPA / Tracker / Archive** split.

- **Planner:** what should I take next term? Future terms, requirement effects, prerequisite sequencing, live projected GPA.
- **Tar Heel Tracker:** what is left and am I on pace? The full requirement audit.
- **Grades & Archive:** what have I earned? Transcript ledger, dual UNC/AMCAS GPA, BCPM, What-if, completed/withdrawn/superseded filters.

This prototype mocks **Planner only**. It deliberately does not pull the full GPA ledger or What-if calculator back into this tab.

## Data represented

The terms and courses are adapted from `premed-hq/src/data/seed.ts`. Requirement names and verification language are adapted from `premed-hq-documentation/data/unc-requirements.json`.

The prototype intentionally includes the demo states required by `implementation/demo-data.md`:

- a 13-credit term just below pace;
- a 9-credit underloaded term;
- an unplaced Biochemistry prerequisite before the MCAT;
- a spring-only offering risk;
- verified and inferred requirement mappings;
- BCPM-heavy coursework;
- the MCAT inside the timeline.

## Locked across all variants

- Horizontal term columns remain the backbone.
- Course chips show code, title, credits, BCPM/AO, what they clear, and offering/critical-path signals.
- Past/registered terms can be locked.
- The MCAT is a milestone divider between terms.
- Unplaced requirements are always visible.
- The live outcome rail shows projected cumulative + BCPM, graduation, the prereq-vs-MCAT verdict, open gaps, suggestions, and watch-outs.
- Requirement effects are previewed before committing.
- Mapping confidence is explicit.
- Suggestions remain optional.
- Dragging may be available in production, but never becomes the only way to move a course.

## Variants

### A — Timeline first

All terms are visible as the main horizontal board, with a persistent live outcome rail.

- Closest to the locked specification.
- Best whole-plan visibility.
- Makes the MCAT divider and unplaced tray impossible to miss.
- Risk: dense on a laptop when many terms exist.

### B — Next-term builder

The selected term becomes the main working surface. Other terms are a compact navigator, with ranked additions and their consequences beside it.

- Best answer to the Planner’s literal question: “What should I take next term?”
- Easiest to use without dragging.
- Risk: weakens the full-sequence view, although the miniature timeline remains.

### C — Decision inspector

The term board stays visible, but selecting a course opens a detailed marginal-effect inspector.

- Best treatment of “if you take this, it clears that.”
- Strongest trust/provenance treatment.
- Risk: selected-course detail competes with whole-plan guidance.

## The ruling — A + C

**A is the composition. C is an affordance inside it.** B is retired; its frame
stays only as the record of what was compared.

**Why A leads.** Term columns and a live right rail are already chosen in the
specification, so A is the only variant that does not argue with it. Whole-plan
visibility is also what makes the MCAT divider and the unplaced tray legible —
both of which exist precisely to be impossible to miss.

**Why C survives as an affordance.** "If I take this, it clears that" is the
question the Planner exists to answer, and a chip cannot carry it. As an
on-demand inspector it answers that question without spending permanent board
width on one selected course.

**Why not B.** Its advantage — no dragging required — is already a locked rule
for every variant ("dragging never becomes the only way to move a course"), so
B pays the full-sequence view for something A must provide anyway.

### The handoff, specified

1. **The inspector opens from a course chip, never on its own.** One click
   selects; the chip takes a `--cat` edge mark so the board still shows what
   is being inspected.
2. **It is a rail, not a modal.** The board stays visible and interactive
   beside it; a modal would break the "whole-plan visibility" that A was
   chosen for.
3. **It shows what the chip cannot** — named requirement effects with their
   confidence, the double-count cap, downstream unlocks, and offering risk.
   It never repeats the chip's own credits and BCPM line.
4. **Closing returns to the outcome rail**, which is the board's default
   right-hand occupant. The two never render at once — the inspector replaces
   the rail for as long as a course is selected.
5. **Selecting a second course replaces the inspector's contents**, never
   stacks a second panel.
6. **Nothing the inspector shows is committed by opening it.** Requirement
   effects are a preview; placement still needs an explicit action.

### Mobile

- Term columns scroll horizontally with the outcome rail moved beneath the
  board; the MCAT divider stays inline between terms so the sequence still
  reads.
- The inspector becomes a full-width panel below the selected term rather than
  a side rail, and the board stays scrolled to the selected chip.
- The unplaced tray stays visible above the board — it is the one thing that
  must not fall below the fold.

## Retired variant

- **B · Next-term builder** — selected term as the working surface with a
  compact navigator. Not built.

## Behaviour

- Variant A is the planner composition: terms remain visible as a sequence,
  the unplaced tray remains available, and dragging is optional rather than
  required. A course chip opens the inspector; opening, closing, or selecting
  another chip never commits a placement.
- The inspector previews named requirement effects, confidence, double-count
  caps, unlocks, and offering risk. Explicit placement is the committing action;
  the Planner remains distinct from the Tracker audit.

## Appearance

- The board is a bounded sequence of solid term columns with one outcome rail.
  It is not a wall of long rectangles: compact course chips create the rhythm,
  the inline MCAT divider preserves the sequence, and selection adds a narrow
  academics edge rather than duplicating the whole chip in a modal.
- The inspector replaces the outcome rail at desktop, so board context remains
  visible. Both are solid data surfaces with the shared card/row ladder,
  borders, radii, and depth; neither is glass. Adjacent controls and columns
  stay equal-height and bounded.
- Desktop may horizontally explore term columns without creating an internal
  vertical sidebar scroll. On mobile the outcome rail and inspector move below
  the selected term while the unplaced tray stays above the board. Focus is
  visible; hover/selection uses the shared quiet transition; reduced motion
  removes chip/rail movement but preserves the selection edge.
