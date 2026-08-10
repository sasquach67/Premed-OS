# Academics Planner — prototype decisions

> **Status:** PROTOTYPE — not approved for implementation.
>
> **Mockup:** `academics-planner-prototype.html`
>
> **Question:** Which composition best turns the locked term-column Planner into an understandable course-sequencing tool?

## Current spec boundary

The July 2026 spec supersedes the old **Planner & GPA / Tracker / Archive** split.

- **Planner:** what should I take next term? Future terms, requirement effects, prerequisite sequencing, live projected GPA.
- **Requirements:** what is left and am I on pace? The full requirement audit.
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

## Recommendation to test first

**A** should remain the default because term columns and a live right rail are already chosen in the specification. The strongest likely final combination is **A’s whole-plan board with C’s selected-course inspector available on demand**.
