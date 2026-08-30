# Planner integrated requirements + Add course — review report

**Date:** 2026-08-26  
**State:** APPROVED by Andy on Aug 27, 2026 · not built or implemented

## Review these three Variant A views

| View | Direct shared Lab URL | Visible review question |
|---|---|---|
| Plan | [Open Planner](http://localhost:8765/variant-lab.html?page=planner&view=plan&variant=A) | Does the timeline remain primary while the persistent Plan coverage rail and Find a course bay read as first-class Planner tools? |
| Requirement map | [Open detailed map](http://localhost:8765/variant-lab.html?page=planner&view=requirements&variant=A) | Are the four groups, five local states, sources, and official-audit boundary clear enough to trust without overstating certainty? |
| Add course | [Open Add course](http://localhost:8765/variant-lab.html?page=planner&view=catalog&variant=A) | Does the subject A–Z browser, discovery/category layer, plan filters, provenance, and missing-live-data boundary feel clear? |

The old standalone Tar Heel Tracker / Planning Library is withdrawn from the
registry. Its useful detailed-audit behavior now belongs to Planner. The
historical source remains only for traceability and is not an approval target.

## Exact files changed in this revision

- `mockup-lab/01-academics/academics-planner-prototype.html`
- `mockup-lab/01-academics/academics-planner-prototype.md`
- same-name HTML/Markdown mirrors under
  `premed-hq-documentation/specifications/mockups/01-academics/`
- `mockup-lab/variant-lab.html` and its specification mirror
- `premed-hq-documentation/tabs/01-academics.md`
- `mockup-lab/01-academics/PLANNING-REVIEW-BATCH-2026-08-26.md`
- `premed-hq-documentation/implementation/briefs/T1-academics-planner-integrated-requirements-catalog-mockup-revision.md`
- this shared-root review report

No `src/` or application file was changed by this revision.

## Exact authorities inspected

- Planner source HTML, same-name decision Markdown, and both specification
  mirrors listed above
- `premed-hq-documentation/tabs/01-academics.md`, especially §4.2-C through E
  and the Planning acceptance list
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `mockup-lab/README.md` and `mockup-lab/CLAUDE-HANDOFF.md`
- both `variant-lab.html` registries
- `premed-hq-documentation/data/unc-requirements.json`
- `premed-hq-documentation/implementation/research-prompts/unc-tar-heel-tracker-major-requirements-2026-27-v2.md`
- `premed-hq-documentation/implementation/research-prompts/unc-tar-heel-tracker-planning-library-foundation-2026-27.md`
- `premed-hq-documentation/data/UNC-degree-and-course-planning-rules-research-2026-08-14.md`
- `premed-hq/src/data/seed.ts`

## Visible changes and why

| Surface | Before | Review-ready proposal |
|---|---|---|
| Planning destinations | A standalone tracker/library competed with Planner. | Planning navigation remains Planner · Grades & Archive; Requirement map and Add course are in-context Planner views. |
| Plan context | Requirement evaluation inputs were implicit or split across surfaces. | Program, catalog/cohort, premed path, prior credit, and interests are visible above the timeline. |
| Plan coverage | Requirement progress was a compact card inside a generic outcome rail. | A 334px source-bearing workbench owns the adjacent rail with four groups, four status counts, program/degree sources, and an explicit ConnectCarolina boundary. |
| Requirement evidence | Detailed rows were attached to a separate destination. | A source-bearing drawer shows 13 major/program, 23 IDEAs, 5 graduation/foundation, and 9 premed rows. Every row has evidence, local status, and a direct owner link. |
| Add course | Discovery depended on Add course buttons and a drawer, so it did not share the default workbench. | A persistent sage-edged Find a course bay now exposes search, quick filters, planning context, reasoned recommendations, catalog links, and the illustrative/live boundary. Its wide drawer retains the A–Z subject index, deeper filters, expandable rows, warnings, and empty-data state. |
| Trust boundary | Local planning could be mistaken for an official audit or live schedule. | Permanent amber notices say the map is not an official degree audit, results are not a complete course catalog, and ConnectCarolina remains authoritative for official audit and live enrollment. |

The Planner keeps the literal Variant A structure: dense horizontal term
columns, inline MCAT lane, outcome rail, unplaced tray, charcoal surface ladder,
compact Baloo/Nunito hierarchy, status chips, and internally scrolling drawers.
It was not replaced with a dashboard or card wall.

## Data boundary and prerequisite for implementation

The legacy requirements JSON contains 23 IDEAs rows, 9 broad premed rows, 6
major records / 46 major rows, and 28 retained source URLs. Only its 13-row
Neuroscience B.S. record is labeled live-verified. The reconciled 2026–27
research packet inventories 46 source-versioned program/degree/track records,
including 5 Gillings B.S.P.H. majors through 7 paths and 18 named Data Science
concentration branches. It also defines the normalized provenance and
requirement schema, but records the remaining official-source extraction gaps.

There is no complete normalized UNC course catalog, course-to-requirement map,
requisite graph, historical catalog library, or live availability feed in the
repository. The three course results are therefore labeled illustrative.

Before implementation can present real catalog results, acquire and normalize
official UNC Catalog and owning-department records with course ID, title,
description, credits, subject, catalog number/level, prerequisites, corequisites,
restrictions, repeat/exclusion rules, IDEAs attributes, catalog year, effective
term when source-backed, source URL, source owner, retrieved date, verified date,
and freshness. Retain program
choice groups, minimum-credit rules, exclusions, and no-double-count predicates
separately. Historical cohorts require archived catalog editions.

Official owner routes:

- <https://catalog.unc.edu/undergraduate/>
- <https://catalog.unc.edu/courses/>
- <https://catalog.unc.edu/undergraduate/programs-study/>
- <https://catalog.unc.edu/undergraduate/archives/>
- the owning program/department pages linked from those indexes

ConnectCarolina/current Registrar surfaces—not the catalog—remain authoritative
for student-specific audit status, sections, meeting patterns, restrictions,
capacity, waitlists, holds, and enrollment results. Advising remains the owner
of substitutions and manual determinations.

## Verification performed

- All three shared Lab routes returned HTTP 200 and selected the intended view.
- Planner source and specification HTML are byte-identical; their decision
  Markdown files are byte-identical; both Lab registries are byte-identical.
- The embedded Planner script compiles.
- Variant A plan visibly retains the timeline, MCAT milestone, outcome rail,
  and unplaced tray; Plan coverage and Find a course are simultaneously visible
  as substantial workbench regions.
- Requirement map visibly renders all four groups and its official-audit and
  acquisition boundaries. Static inventory totals 50 rows: 5 Complete,
  19 Planned, 15 Not complete, 10 Manual review, and 1 Not applicable.
- Add course visibly renders a subject browser and three expandable illustrative
  results, each with rationale, a warning, and a direct UNC Catalog source link.
- Subject, discipline, catalog-number, credit, plan-lens, search, and reset
  controls filter the local sample; unsupported subjects/categories show a
  data-gap empty state instead of a false no-course claim.
- The plan uses intentional horizontal timeline scrolling; drawer content uses
  internal vertical scrolling. At the narrow breakpoint, course discovery,
  unplaced work, Plan coverage, and outcome guidance become full-width sections;
  drawers also become full-width without a competing page destination.
- Registry and decision status are **APPROVED** as Variant A mockup targets.

## Decision requested from Andy

Andy approved the Planner family on Aug 27, 2026. The approval applies to the
three linked Variant A views as one Planner target. A mockup-to-app brief and
implementation still require their separate authorization and proof gates.
