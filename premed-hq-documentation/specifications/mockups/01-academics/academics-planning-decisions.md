# Academics · Planning decisions — decisions

**Status:** Existing six states APPROVED (Aug 27, 2026 — Andy) · prerequisite conflict, redundant course, and retake consequence remain PROPOSED (Aug 29, 2026); implementation remains manifest-gated.

## Product views

| View | Job |
|---|---|
| Requirement preview | See named requirement effects, confidence, caps, and downstream unlocks before placing a course. |
| Plan comparison | Restore/compare named saved plans, understand substitutes, and export an honest advisor snapshot. |
| MCAT timing | Explain the relative future relearning consequence of a scheduling choice. |
| Prerequisite conflict · PROPOSED | Keep a course unplaced when the saved prerequisite evidence contradicts the requested term. |
| Redundant course · PROPOSED | Show when two courses satisfy the same local choice and ask why the second should remain. |
| Retake consequence · PROPOSED | Plan a repeat while keeping every earned attempt visible for transcript-faithful AMCAS treatment. |

## Behaviour

- Planner remains the course-building, local requirement-evidence, and
  constraint-review owner. A course preview consumes that evidence without
  claiming an official audit; there is no separate Tar Heel Tracker destination.
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
- A registered term is a factual boundary: the term’s student-recorded courses remain visible, but suggestions cannot appear to move or replace them. The planner still explains effects in future editable terms.
- Substitute choice is a comparison, never an automatic course replacement. Each alternative visibly names what it clears and what remains open before a student reviews placement.
- Advisor export is a paper-like snapshot with the catalog source date, included terms, open requirements, substitution state, and a plain statement that it is not an official audit or enrollment action.
- Prerequisite conflict leaves the blocked course in Unplaced until the student
  moves it after the prerequisite, supplies supported evidence, or explicitly
  keeps it unplaced. It never implies live enrollment permission.
- Redundant course distinguishes “no additional requirement effect” from “no
  value.” The student may keep it for preparation or interest, replace it with
  a course for the open need, or remove it.
- Retake consequence preserves the first earned attempt and the planned repeat
  as separate rows. It never assumes a future grade, grade replacement, or
  requirement completion.

## Visual conformance sweep — 2026-08-26

- Re-anchored every state under the shared **Academics** banner and labeled the
  page as Planning decisions rather than presenting a competing page title.
- Requirement preview uses the blue planning edge; MCAT order uses violet;
  recorded/registered facts use sage; substitutions and advisor-export limits
  use amber. These colors communicate state rather than decorate containers.
- Converted comparison notes, MCAT order, and choice evidence to solid 16px
  panels with 12px clay rows. Selection lift is quiet, focus is visible, and
  reduced motion removes travel without removing the selected state.

## Final readability and access sweep — 2026-08-26

- Removed the stale Tracker destination so first-glance navigation now presents
  the two settled jobs only: build/check the future in Planner, or inspect the
  earned record in Grades & Archive.
- Kept the state strip horizontally scrollable at narrow widths and made its
  nine selectors keyboard-focusable controls with a visible focus ring and
  practical compact tap height.
- Replaced display-only action labels with real buttons for placement, restore,
  substitution review, and advisor-summary actions. No action commits silently.

## Proposed consequence states — 2026-08-29

The three new consequence states use the approved inspector-substitution
treatment: the plan or attempt history stays visible on the left while one
focused consequence panel occupies the right. They do not create a modal or a
third Planning destination.

- `prerequisite-conflict` uses an amber edge only on the contradicted placement
  and the source boundary. The course remains visibly out of sequence until a
  safe action is chosen.
- `redundant-course` shows the already-planned statistics choice, the redundant
  second course, and the genuinely open methods requirement at once. The panel
  asks for the student’s reason rather than issuing an official audit verdict.
- `retake-consequence` uses a two-row attempt ledger: the recorded attempt and
  the planned repeat. AMCAS inclusion, Planner uncertainty, and local
  requirement review remain separate statements.

At narrow widths the inspector moves below the evidence canvas, action buttons
wrap without clipping, and the attempt rows keep term, course, and status in a
single readable line. These three states remain **PROPOSED** pending Andy’s
explicit review; the approved status of the original six states is unchanged.
