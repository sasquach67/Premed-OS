# Academics · Planning decisions — decisions

**Status:** PROPOSED · Stage-A coverage

## Product views

| View | Job |
|---|---|
| Requirement preview | See named requirement effects, confidence, caps, and downstream unlocks before placing a course. |
| Plan comparison | Restore/compare named saved plans, understand substitutes, and export an honest advisor snapshot. |
| MCAT timing | Explain the relative future relearning consequence of a scheduling choice. |

## Behaviour

- Planner remains the course-building owner; Tar Heel Tracker remains the audit. A course preview consumes tracker data but does not merge the pages.
- A catalog change flags the plan; it never silently recalculates it. Locked terms remain stable.
- The MCAT view uses a relative ordering from named inputs. It makes no retention claim for untracked courses and uses a planning window when there is no test date.
- Suggestions and substitutes are optional. The design never frames a plan as official advice.

## Appearance

- **Requirement preview** preserves the planner’s term board as the working surface. Compact course tickets live inside real terms; the selected ticket has a small edge mark and the narrow inspector describes consequences. This prevents the decision from becoming a stack of generic rows.
- **Plan comparison** is two paper-like plan sheets bridged by a deliberately neutral `OR`. The course order itself is the visual comparison; consequences appear as small editorial notes instead of metric cards.
- **MCAT timing** is a reading path rather than a ranking table: violet ordinal dots mark the relative order and the sentence underneath names the evidence. It contains no gauge, progress bar, readiness score, or retention percentage.
- Every work surface is solid-with-depth. Only the shared Planning mode pill uses glass.

## Component translation

- Keep `ModeSwitch`, `Tabs`, Planner, `TrackerTable`, and `Collapsible` as the only owners. The compact course tickets are configured `InteractiveCard` compositions, not a new planner-card system.
- The comparison sheets use a page-owned CSS composition; 21st.dev is a density/layout reference only. They must not replace the planner’s existing state or interactions.
- Animate UI may enhance tabs, disclosure, and view transitions with the shared reduced-motion rules. It never supplies palette, spacing, or planning data.

## States

- Requirement preview includes catalog staleness, named/inferred mapping distinction, double-count cap, downstream unlock, and an editable-term action.
- Plan comparison includes a restore action and an honest advisor export boundary.
- MCAT timing includes the no-MCAT-date planning-window fallback and explicitly calls out missing tracked-topic information.
