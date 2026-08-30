# Decisions — Add-class type selection

**Status:** APPROVED by Andy on August 26, 2026.

**Mockup:** `01-academics/academics-class-type-selection.html`  
**Spec:** `tabs/01-academics.md` §3.3 and §4.1-N  
**Contract:** `src/lib/academics/classTypeProposal.ts`

## Treatment

This is one compact add-class decision inside the existing class-creation
context—not onboarding, a wizard, or a separate settings page. The course
identity stays quiet at the top. The three equal study-layer choices are the
visual center. The evidence/reassurance line and the Add action close the
decision without turning it into another card wall.

There are no A/B/C alternatives. `suggested-writing`, `suggested-stem`,
`needs-choice`, and `mobile` are required outcomes of the actual proposal
contract, so they are named product views in the lab.

## Behaviour

- A proposal has the form `suggestion` (type + named source/reason) or
  `needs-choice`; it is never a saved `ClassWorkspace.type`.
- In either suggestion view, the proposal chip is preselected, the source is
  stated in one human line, and the student may choose either other chip before
  adding the class.
- In `needs-choice`, none of the three chips is selected. Add class is disabled
  with the nearby reason “Choose a class type to continue.” General is an
  equal explicit choice, never a fallback default.
- Chip selection updates only the uncommitted selection and explanation. The
  new workspace is written only after Add class. A later syllabus parse or
  re-import may offer a proposal but cannot overwrite a saved type.
- Keyboard focus is visible; Enter/Space operates a chip; reduced motion
  settles selection feedback immediately.

## Appearance

- The hierarchy is compact course context → one horizontal row of three equal
  chips → source/reassurance line → footer action. The type decision has more
  visual weight than the surrounding form fields, but no extra panel.
- Dark surfaces use the literal warm ladder: `#211e1a` page → `#2b2722`
  dialog → `#322e28` course context/chips → `#3c352d` edges. Inputs and chips
  are solid. The dialog may float; its dense fields never become glass.
- A selected proposal uses the Academics blue border plus a restrained fill and
  halo. It reads as a reversible suggestion, not an AI certainty badge. An
  unselected state is neutral, quiet, and equally sized.
- In paper, preserve the same hierarchy with `#f7efe1` page → `#fffaf0`
  dialog → `#efe6d4` nested objects → `#e9e2d5` edges. The blue selection
  treatment remains category color, not a score or warning.
- On mobile, the course context stacks above the same three chip targets. They
  do not become a dropdown, carousel, or second step. Focus and selection are
  still visible; reduced motion has no lift or travelling checkmark.

## Do not

- No fourth type, per-tool checklist, confidence percentage, score, rank,
  readiness bar, or AI verdict badge.
- No automatic type update after import/re-import, no hidden STEM/General
  default, and no type badge on class cards.
- Do not change grades, BCPM, credits, requirements, planner data, or any
  existing saved type from this screen.
