# Academics Planner — prototype decisions

> **Status:** APPROVED (Aug 27, 2026 — Andy) · **Variant A inline Planner workbench is the approved mockup target.**
> Approval records the design decision; implementation and built status remain
> governed separately by the manifest and proof gates.
>
> **Mockup:** `academics-planner-prototype.html`
>
> **Decided under:** `implementation/briefs/T1-academics-planner-decisions.md`

## Current spec boundary

The July 2026 spec supersedes the old **Planner & GPA / Tracker / Archive** split.

- **Planner:** what should I take next term? Future terms, major/graduation/IDEAs/premed requirement effects, prerequisite sequencing, and live projected GPA. It contains the local requirement map because those facts explain course placement.
- **Grades & Archive:** what have I earned? Transcript ledger, dual UNC/AMCAS GPA, BCPM, What-if, completed/withdrawn/superseded filters.

There is no separate Tar Heel Tracker. ConnectCarolina remains the official graduation audit; the Planner’s requirement map is a local planning aid with its source and uncertainty attached. This prototype deliberately does not pull the full GPA ledger or What-if calculator back into this tab.

## Data represented

The terms and courses are adapted from `premed-hq/src/data/seed.ts`.
Requirement names and verification language are adapted from
`premed-hq-documentation/data/unc-requirements.json` and the 2026–27 research
packet. The JSON currently contains 23 IDEAs rows, 9 broad premed rows, and 6
major records / 46 major requirement rows. Only its 13-row Neuroscience B.S.
record is labeled live-verified. The reconciled research foundation inventories
46 source-versioned program/degree/track records, but it is not yet a complete
option-row runtime library.

The repository now carries a **source-versioned in-app reference library** of
requirement-linked course codes across 46 program records. It is not yet a
complete UNC course catalog, course-requisite graph, historical catalog
library, or live availability feed: titles, credits, prerequisites, attributes,
and offerings remain explicit gaps when they were not captured.

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
- The selected major owns an inline, source-bearing requirements ledger beside the timeline, with all four groups, local status counts, provenance, and the official-audit boundary. There is no requirements modal or drawer.
- Every editable semester owns `Add course` and remove actions. On pointer devices, the compact `Draft` / add / remove cluster appears only while that semester is hovered; keyboard focus reveals the same controls, and touch layouts keep them visible. `Add course` opens one inline catalog workspace for that destination term; it does not open a second nested add popup.
- The catalog workspace offers `Suggested for Neuroscience B.S.` and `All UNC courses`, with compact Major, IDEAs, and MCAT planning tags that explain ranking without claiming official completion.
- The smaller outcome rail shows projected cumulative + BCPM, graduation, the prereq-vs-MCAT verdict, suggestions, and watch-outs.
- Requirement effects are previewed before committing.
- Mapping confidence is explicit.
- Suggestions remain optional.
- Dragging may be available in production, but never becomes the only way to move a course.

## Variants

### A — Timeline first

All terms are visible as the main horizontal board. A persistent requirements
ledger owns the adjacent rail; a wide course-discovery bay sits immediately
below the term canvas; outcome projections remain subordinate.

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

**Why A leads.** Term columns and a persistent adjacent workbench are already chosen in the
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
3. **It shows what the chip cannot** — named Planner-owned requirement effects with their
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

- Term columns scroll horizontally; the MCAT divider stays inline between terms
  so the sequence still reads. Course discovery, unplaced work, the full-width
  requirements ledger, and outcome guidance then form one deliberate vertical
  sequence—none is hidden or clipped.
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
  caps, unlocks, and offering risk. Explicit placement is the committing action.
  The detailed audit behavior is a named in-context Planner view; it is not a
  separate Tracker destination.

## Appearance

- The board is a bounded sequence of solid term columns with one substantial,
  source-labeled requirements ledger beside it. A wide sage-edged course-
  discovery bay anchors the lower canvas. Together they form one Planner
  workbench rather than a timeline plus miscellaneous dashboard cards.
  It is not a wall of long rectangles: compact course chips create the rhythm,
  the inline MCAT divider preserves the sequence, and selection adds a narrow
  academics edge rather than duplicating the whole chip in a modal.
- The inspector replaces the outcome guidance at desktop, so board context remains
  visible. Both are solid data surfaces with the shared card/row ladder,
  borders, radii, and depth; neither is glass. Outcome metrics, the evidence-
  bounded readiness warning, and ranked next moves share one contained surface;
  no detached action card hangs below the Planner workbench. Adjacent controls
  and columns stay equal-height and bounded.
- Desktop may horizontally explore term columns without creating an internal
  vertical sidebar scroll. On mobile the outcome rail and inspector move below
  the selected term while the unplaced tray stays above the board. Focus is
  visible; hover/selection uses the shared quiet transition; reduced motion
  removes chip/rail movement but preserves the selection edge.

## Visual conformance sweep — 2026-08-26

- Verified unchanged after a literal pass against the shared visual recipe.
  Variant A uses the settled timeline-first structure: compact control strip,
  horizontal term columns, MCAT divider, unplaced tray, persistent requirement
  ledger, and course-discovery bay.
- The warm-paper/charcoal ladder, solid 16px panels, 12–13px internal nodes,
  Baloo/Nunito type hierarchy, and restrained blue/sage/violet status accents
  already match the Planning system. No ornamental card wall or replacement
  layout was introduced.
- Variant A plus the on-demand inspector is **APPROVED** as the mockup target.
  Approval is not implementation or build evidence.

## Revision — integrated requirements, 2026-08-26

Andy retired the separate Tar Heel Tracker concept. Variant A now keeps a
compact bulk requirement summary in the Planner’s permanent right rail and expands
the full source-bearing map inline with the selected major. Program/catalog context, major
foundation, IDEAs mapping uncertainty, and the open premed path all explain the
term sequence in one place. The inline ledger names ConnectCarolina as the
official degree audit. The former tracker mockup is retained only as a
historical source file and is no longer registered in the Mockup Lab.

The editable **planning context** is intentionally visible above the board:
major/program, catalog and matriculation cohort, premed path/MCAT target, and
prior credit. Changing any of those inputs changes the requirement map — they
are not buried in settings or a separate tracker. The map carries forward the
former Tracker’s high-value details: program-specific choices, manual-review
rules, IDEAs mapping uncertainty, graduation foundations, and the open premed
sequence.

## Course catalog and suggestions

Each editable semester carries its own compact `Add course` action beside the
semester status and remove action. The cluster stays hidden until semester
hover or keyboard focus on pointer layouts and remains visible on touch layouts.
Activating it reveals one bounded, inline
catalog workspace beneath the term board, already scoped to the selected
semester. The workspace has two explicit modes: **Suggested for Neuroscience
B.S.** and **All UNC courses**. Search, catalog context, compact Major / IDEAs /
MCAT planning tags, direct `Add to [term]` actions, source-version labels, and
the local/live boundary remain in that one workspace. A result never opens a
second add popup; the same workspace owns discovery and the explicit add action.

The subject index and result set are visibly labeled **Source-versioned course
library · captured records only**. A subject/category with no local row produces
a data-gap state rather than implying UNC offers no courses.
Catalog pages own published descriptions, credits, attributes, and requisites.
ConnectCarolina owns current term sections, restrictions, seats, waitlists, and
whether the student can enroll. Interests only shape elective discovery after
rule-based fit; they never make an audit or enrollment decision.

The catalog workspace deliberately does not copy ConnectCarolina's registration
form. It uses published catalog facts and planning fit while keeping live section
search visibly unconfigured until that integration is authorized. Compact filters
remain secondary to the two course sets and the destination semester.

The right workbench keeps a two-by-two group map, four status counts,
source lineage, and the official-audit boundary visibly persistent. **Review all
50 source rows inline** expands those rows in place. The direct
`?view=requirements` review route opens that inline disclosure by default; it
never routes to or recreates a separate Tracker destination.

## Revision brief carried out — requirements + Add course, 2026-08-26

The review candidate now exposes three directly shareable Planner product views
without changing the A/B/C design-variant system:

- `?view=plan&variant=A` — the unchanged timeline-first composition;
- `?view=requirements&variant=A` — the detailed requirement rows expanded inline;
- `?view=catalog&variant=A` — the single inline Add course workspace.

### Requirement map

The detailed map renders all 50 rows modeled for this selected mock scenario:
13 Neuroscience program nodes, 23 IDEAs nodes, 5 graduation/foundation nodes,
and 9 broad premed nodes. Every row sits in one of those four groups and carries
one honest local state: `Complete`, `Planned`, `Not complete`, `Manual review`,
or `Not applicable`. Every row and group has a direct owner-source link.

`Complete` never means the official UNC audit cleared the item. It means only
that the local plan has matching evidence attached. A permanent
amber boundary names ConnectCarolina as the owner of posted credit, official
GPA, attributes, exceptions, and graduation clearance; advising remains the
owner of substitutions and manual decisions.

### Add course data prerequisite

The first pass already captures requirement-linked course codes across 46
source-versioned program records. To deepen the in-app library, a separate
data task must acquire and normalize official UNC course records with course
code, title, description, credits, department, career/level, published
prerequisites/corequisites, restrictions, repeat/exclusion rules, IDEAs
attributes, catalog year, effective/source term, source URL, retrieved date,
and freshness. The mapping layer must separately retain program choice groups,
minimum-credit rules, exclusions, and no-double-count predicates. Historical
cohorts require archived catalog editions.

Live section facts—term, section, instructor, meeting pattern, component
pairing, restrictions, capacity, waitlist, holds, and enrollment result—must
come from ConnectCarolina/current Registrar surfaces and may not be inferred
from the catalog.

### Review status

This Variant A composition is **APPROVED**. The source-bearing requirement
ledger is the single intentional visual signature; the board, MCAT lane,
outcome rail, dark token ladder, dense course rows, and unplaced tray remain
literal Variant A. Implementation still requires the separate manifest and
build-proof workflow.

## Final readability and access sweep — 2026-08-26

- At desktop, the timeline remains the largest working surface while the
  persistent major requirements rail explains the plan. Each editable semester
  reveals its own add/remove actions on hover or keyboard focus; opening Add course reveals the single
  catalog workspace below the board without obscuring the term sequence.
- At 480px, the term sequence remains horizontally explorable; the requirement
  map and open catalog workspace become deliberate full-width layers. The unplaced tray,
  official-audit boundary, captured-library label, and source-version markers
  remain visible rather than clipping away.
- Direct `plan`, `requirements`, and `catalog` routes were rechecked. Close,
  search, course-set tabs, source links, and explicit placement affordances retain
  visible focus treatment; no sample implies live seats or official completion.

## Interaction clarification — 2026-08-28

- Requirements stay inline with the selected major; there is no standalone
  Requirements destination, modal, or drawer.
- Registered terms remain locked. Every editable semester owns a compact
  `Add course` action and a separate trash/remove action. On pointer layouts,
  that action cluster appears only on semester hover or keyboard focus.
- `Add course` opens one course-catalog workspace for the selected semester.
  `Suggested for Neuroscience B.S.` and `All UNC courses` are sibling views in
  that workspace, and each result adds directly to the named semester.
- Major, IDEAs, and MCAT tags explain planning relevance only. Official course
  facts belong to the UNC Catalog; live sections and enrollment belong to
  ConnectCarolina.

## Requirement-rail readability revision — 2026-08-28

- The default rail is for bulk scanning, not explanation. It keeps the four
  status-count cards, then shows Major, IDEAs in Action, Graduation, and Premed
  in a compact two-by-two map.
- Each group exposes its row count, status mix, and three representative
  requirements. Long category descriptions were removed because they repeated
  what the requirement names and statuses already communicate.
- **View all 50 requirements** expands the complete source-bearing ledger in
  place. The UNC program source and ConnectCarolina boundary remain visible,
  but the boundary is one line rather than a paragraph.
- This revises the approved mockup target only. It is not production
  implementation or evidence that the Planner is built.

## Outcome-rail visual revision — 2026-08-28

- The previous two-by-two GPA/credits/date card grid and nested warning/action
  cards are retired. Those objects repeated facts already visible in the
  Planner header and broke one planning consequence into unrelated boxes.
- The replacement is one **Plan trajectory**. A compact cumulative/BCPM
  readout leads into a connected vertical runway: placed credits → unplaced
  Biochemistry → January 2029 MCAT → projected May 2030 graduation.
- The open prerequisite is the emphasized interruption in the route. The two
  next actions sit directly under the runway as quiet action rows rather than
  another card stack.
- The trajectory is a local projection, not an official degree-audit or MCAT
  readiness verdict. This is a mockup-only change and does not authorize app
  implementation.

### Placement correction — 2026-08-29

The vertical trajectory no longer lengthens the narrow requirements rail or
leave an empty block under **Unplaced**. It now sits in the timeline column
immediately beneath the Unplaced tray, while the requirement summary remains a
parallel reference column. At desktop its route runs horizontally from placed
credits through the Biochemistry gap, MCAT, and graduation, with actions at the
route's end. At narrow widths it returns to the same vertical sequence.

### Requirements / trajectory baseline correction — 2026-08-29

- On desktop, **Plan requirements** now stretches to the same bottom edge as
  the timeline column. Its complete 50-row ledger is open by default and
  scrolls inside the rail, so the extra height exposes useful requirements
  instead of becoming an empty card extension.
- **Plan trajectory** receives a little more vertical room for its projected
  route and actions. The two columns end on the same baseline without making
  the full Planner canvas longer.
- Below the desktop breakpoint, the workbench returns to natural document
  height; the requirements ledger remains collapsible and the trajectory keeps
  its established vertical mobile sequence.

## Proposed ruled interaction states — 2026-08-29

The approved `plan`, `requirements`, and `catalog` views remain unchanged in
status. Three additional Planner interaction states are now drawn for Andy’s
review and remain **PROPOSED**:

| View slug | Placement | Immediate decision |
| --- | --- | --- |
| `term-create` | Inline beneath the timeline | Add a compact Summer term or an intentional gap-year span. |
| `term-note` | Inline beneath the selected semester | Save planning context beside the term, or discard it without changing the plan. |
| `registration-window` | Compact nudge inside the affected Fall 2027 term, expanding inline | Review the term, dismiss the nudge, or open ConnectCarolina for live registration facts. |

### Behaviour

- Summer is a real compact term in chronological order. A gap year is a
  visually distinct time span with no credits or invented enrollment.
- A term note records the reason behind the semester plan. It does not alter
  credits, requirement effects, or registration state. The review state shows
  editing and the compact saved appearance together; cancel returns to the
  unchanged plan.
- The registration nudge appears only where timing changes an immediate
  decision. The Planner can identify the affected term and its local critical
  path, while current sections, seats, restrictions, and enrollment stay in
  ConnectCarolina.
- Each state is addressable directly through Variant Lab and also opens from a
  visible Planner control. No new destination, drawer, or nested popup is added.

### Appearance

- Each interaction uses one solid 16px Planner panel and the existing 12–13px
  inset row language. Blue marks the selected draft action; amber marks the
  gap span or registration boundary; neither color decorates unrelated rows.
- The timeline remains the dominant surface. The interaction panel sits below
  it and above catalog work so the reading order stays plan → decision →
  supporting workbench.
- At narrow widths, option and note columns stack while the timeline remains
  horizontally explorable. Controls keep visible focus and no page-level
  horizontal overflow is introduced.

These states are mockup-only proposals. They are not approved, implemented, or
built until Andy reviews them and the later brief/execute/promotion stages pass.
