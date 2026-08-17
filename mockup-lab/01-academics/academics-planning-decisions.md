# Academics · Planning decisions — decisions

**Status:** PROPOSED · Stage-A coverage

## Product views

| View | Job |
|---|---|
| Requirement preview | See named requirement effects, confidence, caps, and downstream unlocks before placing a course. |
| Plan comparison | Restore/compare named saved plans, understand substitutes, and export an honest advisor snapshot. |
| MCAT decay | Explain the relative future relearning consequence of a scheduling choice. |

## Behaviour

- Planner remains the course-building owner; Tar Heel Tracker remains the audit. A course preview consumes tracker data but does not merge the pages.
- A catalog change flags the plan; it never silently recalculates it. Locked terms remain stable.
- The MCAT view uses a relative ordering from named inputs. It makes no retention claim for untracked courses and uses a planning window when there is no test date.
- Suggestions and substitutes are optional. The design never frames a plan as official advice.

## Appearance

- Reuses the term-column board with a compact solid decision rail. Selected course, preview diff, and locked term are separated by border/light, not by giant metrics.
- The comparison view uses two equal solid plan cards so neither option looks recommended by color alone.
- MCAT ordering uses small violet ordinal cells and explanatory sentences. No gauge, progress bar, or composite measure appears.
- The standard A/B/C planning composition remains available in the existing Planner source; this page supplies the missing decision states rather than replacing its board.
