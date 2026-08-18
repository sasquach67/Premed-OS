# Experience pillar dashboard — mockup notes

## Scope

A configurable source for Clinical, Volunteering, Shadowing, Research, and Extracurriculars.

## Encoded decisions

- Clinical uses Sites / Shifts / Reflections.
- Volunteering uses Organizations / Events / Reflections.
- Shadowing uses Physicians / Visits / Reflections.
- Research is output-first: Projects / Outputs / Lab notes / Reflections / Discover, not an electronic lab notebook and not an hours dashboard.
- Extracurriculars is contribution-first: Organizations / Initiatives / Reflections / Discover, never a leadership ladder.
- Experience records carry their own context; aggregate hours are not treated as the center of the page.
- Every experience pillar uses the same signed-in header grammar as Academics and MCAT: **page title + variable stats in the banner, underline section tabs, then a solid control bar**. The configured pillar accent is the only visual difference; the create action lives in the control bar.
- The shared default is a **card grid with a selected-record workspace**: selecting one organization, physician, project, or initiative keeps the cards visible and opens that record in one full-width inline workspace beneath the grid. It is neither a nested accordion nor a detached inspector.
- **Clinical Sites uses square cards**, matching the Class Center scan geometry:
  four across in A, three across in B, and two across in C. Each card keeps the
  site identity, role, recent context, and honest hour total inside the square;
  selecting it opens the full site workspace below.

## Variants

- **A:** default scan grid with the selected record workspace below. Clinical
  Sites is four square cards across.
- **B:** dense three-card scan with the same workspace below; Clinical remains
  square.
- **C:** focused two-card composition for Clinical Sites; other pillars retain
  their compact focus treatment.
