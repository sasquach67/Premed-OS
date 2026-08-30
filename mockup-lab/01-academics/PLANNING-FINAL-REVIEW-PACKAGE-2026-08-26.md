# Planning final review package — 2026-08-26

**Gate: APPROVED by Andy on Aug 27, 2026; no production implementation or built status follows automatically.**

This package is the single current Planning review record. Tar Heel Tracker is
not a separate destination: its useful source-bearing requirement audit is now
the Planner **Requirement map**. Andy approved all current non-legacy Planning
Variant A mockups on Aug 27, 2026.

## Start with the integrated Planner

| Review view | Direct shared Lab URL | Approval question |
|---|---|---|
| Timeline-first workbench | [Open Planner](http://localhost:8765/variant-lab.html?page=planner&view=plan&variant=A) | Does the term timeline remain primary while Plan coverage and Find a course read as unmistakable first-class tools? |
| Detailed requirement map | [Open Requirement map](http://localhost:8765/variant-lab.html?page=planner&view=requirements&variant=A) | Are the local statuses, sources, evidence, and ConnectCarolina/advising boundary trustworthy and legible? |
| Browseable Add course drawer | [Open Add course](http://localhost:8765/variant-lab.html?page=planner&view=catalog&variant=A) | Is subject A–Z browsing plus category and plan-fit filtering the right catalog model? |

Plan Coverage persistently occupies the adjacent rail with all four requirement
groups, status counts, source lineage, and the local-plan/official-audit
boundary. Find a Course persistently occupies a wide bay beneath the term
canvas with search, filters, planning context, recommendations, and provenance.
Their full drawers add working depth; they are not hidden entry points.

The Add course drawer uses a scrollable A–Z subject/department spine, optional
discipline categories, plan filters, and expandable results. Every sample result
is labeled illustrative and links to the UNC Catalog. It does not claim a
complete local catalog, live sections, seats, eligibility, or enrollment.

## Hierarchy revision — first-class Planner tools

| Before this refinement | Current review proposal | Why |
|---|---|---|
| Requirement coverage was a compact card inside a generic outcome rail. | A 334px source-bearing **Plan coverage** workbench owns the adjacent rail with four groups, four status counts, program and degree sources, and the ConnectCarolina boundary visible. | Requirements are one of the reasons the timeline exists, not metadata about it. |
| Course discovery was visible mainly as Add course buttons; the substantial catalog appeared only after opening a drawer. | A wide sage-edged **Find a course** bay sits directly below the term canvas with search, filters, full planning context, two reasoned examples, direct catalog links, and the illustrative/live boundary. | Students can recognize and enter course discovery immediately without creating another top-level tab. |
| Narrow layouts moved a generic rail below the board. | Timeline, course discovery, unplaced work, requirement coverage, and outcome guidance become deliberate full-width sections; term columns retain their internal horizontal scroll. | Neither first-class tool disappears, clips, or collapses into an unlabeled icon. |

## Final readability and usability sweep

The final rendered pass covered **27 registered Planning / Planning · Grades
views plus the two additional B/C term-report state proofs: 29 review screens
total**. Every screen was inspected at 1440×900 and 480×900.

- **First glance:** Planner opens with the course timeline as the working
  canvas, Plan coverage beside it, and Find a course directly below it. Grades
  views open on the earned record or the exact missing fact; transition and
  forecast states open on the decision or evidence boundary rather than an
  explanatory preamble.
- **Navigation:** removed the obsolete `Tar Heel Tracker` tab from Planning
  decisions, cold start, all Grades & Archive views, grade decisions, and
  forecast. The visible model now matches the proposal: Planner owns planning
  plus its local requirement map; Grades & Archive owns the historical record.
- **Task controls:** state selectors in Planning decisions, Grade decisions,
  Term rollover, and Forecast accuracy are now real keyboard-focusable buttons
  with visible focus treatment and a compact 38px minimum height. Placement,
  restore, substitution, rollover, and cold-start actions are real buttons too.
- **Surface discipline:** no new container was added. Existing panels remain
  only where they carry a distinct record, decision, source boundary, or action.
  Empty/paused/below-gate views remain intentionally sparse.
- **Narrow layout:** term columns retain intentional internal horizontal
  exploration; requirement and catalog drawers become full-width; all other
  two-column compositions stack source before decision. State strips scroll
  horizontally rather than clipping or shrinking labels into unreadability.

## Research and data foundation

Canonical packet:
[`unc-planning-requirements-and-course-catalog-foundation-2026-27.md`](../../premed-hq-documentation/implementation/research-prompts/unc-planning-requirements-and-course-catalog-foundation-2026-27.md)

| Evidence state | Result |
|---|---|
| Proven from current official UNC owner pages | University graduation baseline; fall-2026 IDEAs boundary; Gillings admission-term rule; 46 source-versioned program/degree/track records; newly readable HPM, NDSS, RADI, and Nursing summary tables. |
| Coverage totals | 46 program/degree/track records; all 5 Gillings B.S.P.H. majors through 7 paths; 18 named Data Science branches; 55 Exa discovery results reviewed; 11 official UNC pages fetched directly. |
| Normalization | Source provenance, catalog/cohort scope, admission gates, requirement nodes, course/choice/minimum-credit rules, exclusions, no-double-count logic, evidence state, and manual-review reasons have explicit fields. |
| Repository catalog inventory | **0 complete searchable UNC course catalogs.** The repository has partial requirements data and a 46-record summary library, not a normalized 2026–27 course corpus or live-section index. |
| Still unresolved | Full option/elective member tables, footnotes, cross-lists, historical snapshots, current admissions decisions/deadlines, transfer articulation, enrollment-time attributes, clinical compliance, substitutions, waivers, and student-specific exceptions. These stay manual or unknown. |
| Intentionally excluded | Minors, graduate-only programs, unrelated majors, school-specific medical-school prerequisite determinations, and a fabricated generic “Public Health” record. |
| Authority boundary | UNC Catalog supports published catalog facts. ConnectCarolina remains authoritative for the individual degree audit, live sections, seats, restrictions, and enrollment. Advising/program owners remain authoritative for substitutions and manual determinations. |

The acquisition specification requires course ID, title, credits, description,
subject, catalog number/level, requisites, restrictions, repeat/exclusion rules,
IDEAs attributes, catalog year, effective term only when source-backed, source
owner and URL, and retrieved/verified dates. Source snapshots must be versioned
by catalog year and refreshed owner-page by owner-page. Live availability must
never be inferred from catalog text.

Official origins retained in the packet include the
[Undergraduate Catalog](https://catalog.unc.edu/undergraduate/),
[Courses A–Z](https://catalog.unc.edu/courses/),
[Programs A–Z](https://catalog.unc.edu/undergraduate/programs-study/), and
[Gillings undergraduate programs](https://catalog.unc.edu/undergraduate/schools-college/public-health/).

## Exact authorities used for the mockup audit

- `S` = `/Users/andyquach/Documents/premed-os/mockup-lab/01-academics/`
- `M` = `/Users/andyquach/Documents/premed-os/premed-hq-documentation/specifications/mockups/01-academics/`
- `AC–E` = `/Users/andyquach/Documents/premed-os/premed-hq-documentation/tabs/01-academics.md`, §§4.2-C through 4.2-E and the Planning acceptance list
- `VR` = `/Users/andyquach/Documents/premed-os/premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `RS` = `/Users/andyquach/Documents/premed-os/mockup-lab/variant-lab.html`
- `RM` = `/Users/andyquach/Documents/premed-os/premed-hq-documentation/specifications/mockups/variant-lab.html`

For every row, the exact source pair is `S/<stem>.html` and `S/<stem>.md`;
the exact mirror pair is `M/<stem>.html` and `M/<stem>.md`. Each was checked
with AC–E, VR, RS, and RM. Additional cited sections are named in the row.

## Exhaustive current-view ledger

| # | Page / Variant-A interface | Exact source stem and additional spec | Disposition and exact visible change | Direct Lab URL | Andy decision |
|---:|---|---|---|---|---|
| 1 | Planner · timeline workbench | `academics-planner-prototype`; AC | **Changed + visually verified.** Kept compact controls, horizontal term columns, dense course cards, MCAT lane, and unplaced tray; elevated source-bearing Plan coverage into the adjacent rail and Find a course into a persistent lower bay. | [Open](http://localhost:8765/variant-lab.html?page=planner&view=plan&variant=A) | Approve / deny / comment |
| 2 | Planner · requirements | `academics-planner-prototype`; AC/AE | **Changed + visually verified.** Integrated 50 source-bearing local requirement rows in Major/Program, IDEAs, University graduation, and Premed groups; exposed Complete, Planned, Not complete, Manual review, and Not applicable evidence without asserting an official audit. | [Open](http://localhost:8765/variant-lab.html?page=planner&view=requirements&variant=A) | Approve / deny / comment |
| 3 | Planner · Add course | `academics-planner-prototype`; AC | **Changed + visually verified.** Replaced the short recommendation stack with an in-context A–Z subject browser, category and plan-fit filters, expandable illustrative results, warnings, empty-data state, and per-result provenance. | [Open](http://localhost:8765/variant-lab.html?page=planner&view=catalog&variant=A) | Approve / deny / comment |
| 4 | Grades & Archive · Ledger | `academics-grades-archive`; AD | **Changed + verified.** Fluid outer canvas; dense ledger remains internally scrollable. | [Open](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=ledger) | **APPROVED — Andy, Aug 27, 2026** |
| 5 | Grades & Archive · GPA | `academics-grades-archive`; AD | **Changed + verified.** Paired UNC/AMCAS views retain source and interpretation limits. | [Open](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=gpa) | **APPROVED — Andy, Aug 27, 2026** |
| 6 | Grades & Archive · What-if | `academics-grades-archive`; AD | **Changed + verified.** Scratch scenario stays visibly separate from recorded grades. | [Open](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=what-if) | **APPROVED — Andy, Aug 27, 2026** |
| 7 | Grades & Archive · Transcript record | `academics-grades-archive`; AD | **Changed + verified.** Restored the Academics/Planning shell and kept transcript-exact fields. | [Open](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=transcript-record) | **APPROVED — Andy, Aug 27, 2026** |
| 8 | Grades & Archive · No transcript | `academics-grades-archive`; AD | **Changed + verified.** Honest first-record state with no fake GPA or export. | [Open](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=transcript-empty) | **APPROVED — Andy, Aug 27, 2026** |
| 9 | Grades & Archive · Export | `academics-grades-archive`; AD | **Changed + verified.** Student-controlled coursework export remains explicitly non-registrar. | [Open](http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=transcript-export) | **APPROVED — Andy, Aug 27, 2026** |
| 10 | Planning decisions · Requirement preview | `academics-planning-decisions`; AC | **Changed + verified.** Added confidence, cap, unlock, staleness, and local-catalog boundary. | [Open](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=preview) | **APPROVED — Andy, Aug 27, 2026** |
| 11 | Planning decisions · Compare | `academics-planning-decisions`; AC | **Changed + verified.** Neutral plan sheets, restore controls, and honest export note. | [Open](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=compare) | **APPROVED — Andy, Aug 27, 2026** |
| 12 | Planning decisions · MCAT timing | `academics-planning-decisions`; AC | **Changed + verified.** Shows relative course/MCAT sequence without score or retention claims. | [Open](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=decay) | **APPROVED — Andy, Aug 27, 2026** |
| 13 | Planning decisions · Registered term | `academics-planning-decisions`; AC | **Changed + verified.** Registered facts are locked while future plans remain editable. | [Open](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=locked) | **APPROVED — Andy, Aug 27, 2026** |
| 14 | Planning decisions · Substitute | `academics-planning-decisions`; AC | **Changed + verified.** Alternatives name what they clear and what remains. | [Open](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=substitute) | **APPROVED — Andy, Aug 27, 2026** |
| 15 | Planning decisions · Advisor export | `academics-planning-decisions`; AC | **Changed + verified.** Snapshot includes sources, assumptions, and non-official boundary. | [Open](http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=export) | **APPROVED — Andy, Aug 27, 2026** |
| 16 | Planning cold start | `academics-planning-cold-start`; AC | **Changed + verified.** Three quiet term lanes request one durable fact; no fake plan or metrics. | [Open](http://localhost:8765/variant-lab.html?page=academics-planning-cold-start&variant=A) | Approve / deny / comment |
| 17 | Grade decisions · Returned work | `academics-grade-decisions`; AD | **Changed + verified.** Source record, deadline, and review action remain together without claiming an appeal is justified. | [Open](http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=regrade) | **APPROVED — Andy, Aug 27, 2026** |
| 18 | Grade decisions · Policy | `academics-grade-decisions`; AD | **Changed + verified.** Applied rules and missing-curve boundary stay inspectable. | [Open](http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=policy) | **APPROVED — Andy, Aug 27, 2026** |
| 19 | Grade decisions · Missing inputs | `academics-grade-decisions`; AD | **Changed + verified.** Result remains dormant until one named fact is supplied. | [Open](http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=incomplete) | **APPROVED — Andy, Aug 27, 2026** |
| 20 | Grade decisions · Mistake evidence | `academics-grade-decisions`; AD | **Changed + verified.** Student-marked causes route to distinct actions with evidence limits. | [Open](http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=mistakes) | **APPROVED — Andy, Aug 27, 2026** |
| 21 | Term rollover · Ritual | `academics-term-rollover`; AC/AD | **Changed + verified.** Origin and reversible topic fates use compact semantic rows. | [Open](http://localhost:8765/variant-lab.html?page=academics-term-rollover&variant=A&view=ritual) | **APPROVED — Andy, Aug 27, 2026** |
| 22 | Term rollover · Paused | `academics-term-rollover`; AC/AD | **Changed + verified.** Reversible bulk exit remains spacious and non-celebratory. | [Open](http://localhost:8765/variant-lab.html?page=academics-term-rollover&variant=A&view=paused) | **APPROVED — Andy, Aug 27, 2026** |
| 23 | Term rollover · January | `academics-term-rollover`; AC/AD | **Changed + verified.** One low-pressure re-offer resumes nothing automatically. | [Open](http://localhost:8765/variant-lab.html?page=academics-term-rollover&variant=A&view=january) | **APPROVED — Andy, Aug 27, 2026** |
| 24 | Grades & Archive · Term report A | `academics-grades-archive`; AD + `01-academics.md` §6.10-C | **Changed + verified.** Default report uses counts and named records, never correlations; the report now lives in its settled Grades & Archive home. | [Open](http://localhost:8765/variant-lab.html?page=grades-archive&view=term-retrospective&variant=A) | Approve A / revise |
| 25 | Grades & Archive · Term report B | `academics-grades-archive`; AD + §6.10-C | **Changed + verified.** Sectioned comparison renders from the same saved term record. | [Open](http://localhost:8765/variant-lab.html?page=grades-archive&view=term-retrospective&variant=B) | Comparison comment |
| 26 | Grades & Archive · Term report C | `academics-grades-archive`; AD + §6.10-C | **Changed + verified.** Thin-evidence state suppresses a retrospective that the record cannot support. | [Open](http://localhost:8765/variant-lab.html?page=grades-archive&view=term-retrospective&variant=C) | State comment |
| 27 | Forecast accuracy · A | `academics-forecast-accuracy`; AD + `01-academics.md` §6.12 | **Changed + verified.** Default accountability ledger evaluates app claims, not the student. | [Open](http://localhost:8765/variant-lab.html?page=academics-forecast-accuracy&variant=A) | Approve A / revise |
| 28 | Forecast accuracy · B | `academics-forecast-accuracy`; AD + §6.12 | **Changed + verified.** Resolved prediction table now renders instead of repeating A. | [Open](http://localhost:8765/variant-lab.html?page=academics-forecast-accuracy&variant=B) | Comparison comment |
| 29 | Forecast accuracy · C | `academics-forecast-accuracy`; AD + §6.12 | **Changed + verified.** Below-gate state suppresses unreliable numbers. | [Open](http://localhost:8765/variant-lab.html?page=academics-forecast-accuracy&variant=C) | State comment |

## Legacy artifacts—no competing destination

| Artifact | Exact sources | Disposition | Review URL | Decision |
|---|---|---|---|---|
| Requirements audit | `S/academics-requirements.{html,md}`; `M/academics-requirements.{html,md}`; AE; VR; RS/RM | **Superseded.** Visible retirement notice points to Planner Requirement map. | [Historical source](http://localhost:8765/01-academics/academics-requirements.html) | Keep for history or separately authorize deletion. |
| Tar Heel Tracker | `S/academics-tar-heel-tracker.{html,md}`; `M/academics-tar-heel-tracker.{html,md}`; AE; VR; RS/RM | **Superseded.** Registry artifact is visibly retired; no separate approval target. | [Retired artifact](http://localhost:8765/variant-lab.html?page=requirements-legacy&variant=A) | No design approval requested. |
| Planning Library | `S/academics-planning-library.{html,md}`; `M/academics-planning-library.{html,md}`; AE; VR; RS/RM | **Superseded and unregistered.** Visible banner links to Planner Requirement map. | [Historical source](http://localhost:8765/01-academics/academics-planning-library.html) | No design approval requested. |

## QA evidence and remaining prerequisites

- All **27 registered product views plus two B/C term-report state proofs**
  loaded through the shared Lab; none was blank and every intended view/variant
  resolved. All **32 review URLs** (29 current review screens + 3 legacy
  references) returned HTTP 200.
- All **14 current source HTML/Markdown files** across the seven active Planning
  families are byte-identical to their 14 documentation mirrors (**28 files
  total**) after this sweep. The three legacy families remain visibly
  superseded and were not rewritten.
- All 29 current review screens were visually inspected at 1440×900 and
  480×900. Desktop visibly renders the timeline, 334px Plan coverage ledger,
  and lower Find a course bay together. At narrow width, course discovery and
  requirement coverage become full-width sections; page-level overflow is
  absent. The timeline keeps intentional internal horizontal scroll and drawers
  keep internal vertical scroll.
- Post-change desktop/mobile rerenders rechecked the six edited visual families:
  Planning decisions, cold start, Grades & Archive, grade decisions, rollover,
  and forecast. The two-destination navigation remains readable at both widths.
- In-place selector checks passed for Planning decisions, Grade decisions, Term
  rollover, and Forecast accuracy; each control changes the visible state and
  records the selected view in the URL. Direct B/C Term report routes now render
  their own sectioned and thin-evidence states at narrow width rather than
  falling back to A.
- Add course search, subject, category, catalog-number, credit, plan-lens, and
  reset controls filter the illustrative rows. An unsupported combination
  shows a data-acquisition gap rather than claiming UNC has no matching course.
- The persistent **Browse all illustrative courses** control opened the catalog
  browser; **Open all 50 rows** opened the complete grouped requirement map;
  both close controls returned to the unchanged timeline workbench.
- No production application file was changed by this consolidation pass. Dirty
  app and Daily work already present in the shared workspace was preserved.
- Remaining prerequisite: ingest and verify a complete selected program's
  option/elective/footnote graph and the official course records it references
  before any result can lose its **illustrative** label. Live enrollment still
  requires ConnectCarolina.

## Approval gate

Andy approved every current non-legacy Planning Variant A page family on Aug 27,
2026, including the three integrated Planner views. No mockup-to-app brief,
production implementation, or **BUILT** status follows from that approval without
the separate manifest and proof gates.

**Approved mockup package; no production implementation or built status yet.**
