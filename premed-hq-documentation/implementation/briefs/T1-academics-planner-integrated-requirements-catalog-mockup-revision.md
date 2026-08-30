# T1 — Planner integrated requirements + Add course mockup revision

**Date:** 2026-08-26  
**Status:** MOCKUP REVISION AUTHORIZED · REVIEW PROPOSAL ONLY  
**Build authority:** none; do not edit `src/`, promote the mockup, or claim a live UNC integration

## Outcome

Revise the existing Academics Planner Variant A prototype so it remains a
timeline-first planning workspace while absorbing the useful requirement-audit
behavior formerly proposed as a separate Tar Heel Tracker destination.

The finished proposal has two named in-context Planner views in addition to the
plan canvas:

1. **Requirement map** — a Planner-owned drawer with every locally modeled
   requirement grouped under major/program, IDEAs in Action,
   graduation/foundations, or premed.
2. **Add course** — a Planner-owned catalog drawer with subject A–Z browsing,
   discipline discovery lenses, planning-relevance filters, expandable results,
   rationale, warnings, provenance, and placement preview without pretending a
   complete or live UNC course catalog is available.

Grades & Archive remains a separate Planning destination. Tar Heel Tracker does
not remain a current destination.

## Authorities inspected

- `mockup-lab/01-academics/academics-planner-prototype.html`
- `mockup-lab/01-academics/academics-planner-prototype.md`
- same-name HTML/Markdown mirror under
  `premed-hq-documentation/specifications/mockups/01-academics/`
- `premed-hq-documentation/tabs/01-academics.md`, especially §4.2-C–E and
  the Planning acceptance list
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`
- `mockup-lab/README.md` and `mockup-lab/CLAUDE-HANDOFF.md`
- `mockup-lab/variant-lab.html` and its specification mirror
- `premed-hq-documentation/data/unc-requirements.json`
- `premed-hq-documentation/implementation/research-prompts/unc-tar-heel-tracker-major-requirements-2026-27-v2.md`
- `premed-hq-documentation/implementation/research-prompts/unc-tar-heel-tracker-planning-library-foundation-2026-27.md`
- `premed-hq-documentation/data/UNC-degree-and-course-planning-rules-research-2026-08-14.md`
- `premed-hq/src/data/seed.ts` as the source of illustrative local plan rows

## Settled product decisions

- Variant A remains the composition: horizontal term columns, inline MCAT
  milestone, outcome rail, unplaced tray, and dense course rows.
- The selected-course inspector remains an on-demand rail that replaces the
  normal outcome rail; opening it never commits a placement.
- Requirements and Add course are Planner overlays, not tabs or destinations.
- Every local requirement status says what the local plan can support:
  `Complete`, `Planned`, `Not complete`, `Manual review`, or `Not applicable`.
- A local status is never worded as an official graduation verdict.
- Every requirement row or requirement group links directly to its owner source.
- Course recommendations are illustrative until a real catalog acquisition and
  normalization pass exists. They never imply live availability or eligibility.
- ConnectCarolina remains authoritative for the student-specific degree audit,
  current enrollment, sections, seats, restrictions, and transaction results.

## Actual local data inventory

### Present

`premed-hq-documentation/data/unc-requirements.json` currently contains:

- 23 IDEAs in Action rows;
- 9 broad premed prerequisite rows;
- 6 major records with 46 total requirement rows;
- 13 Neuroscience B.S. requirement rows, the only major in that file labeled
  live-verified;
- 28 unique retained source URLs;
- a known cohort defect: the file-level `appliesTo` statement is broader than
  the 2026–27 research packet supports.

The newer research packet separately defines a 36-record source-backed program
universe and the normalized schema needed to represent tracks, gates, choices,
exclusions, double-count rules, and manual review. It is a research/spec packet,
not a completed JSON library. Four professional-program records remain explicit
official-source extraction gaps, and named elective lists/footnotes are not yet
fully transcribed.

`premed-hq/src/data/seed.ts` contains a personalized illustrative course plan.
It is not a UNC course catalog.

### Absent

There is no complete normalized UNC course catalog, course-to-requirement map,
course-requisite graph, historical catalog archive, or live availability feed
in the repository. The mockup must therefore label every Add course result
**Illustrative local sample**.

## Data acquisition required before this can be real

### Catalog-owned course record

Acquire from the current official UNC Undergraduate Catalog and department
course directories, preserving:

- course code, title, description, credits, department/subject, career/level;
- published prerequisites, corequisites, restrictions, repeat/exclusion rules,
  and IDEAs attributes;
- catalog year, effective/source term, source URL, source owner, retrieved date,
  and freshness state;
- program/requirement mappings with choice-group, minimum-credit, exclusion,
  and no-double-count semantics retained as separate predicates.

Authoritative discovery/owner routes:

- `https://catalog.unc.edu/undergraduate/`
- `https://catalog.unc.edu/undergraduate/courses/`
- `https://catalog.unc.edu/undergraduate/programs-study/`
- `https://catalog.unc.edu/undergraduate/archives/`
- the owning department/program pages linked from those indexes

### Live registration record

Do not infer from catalog data. ConnectCarolina/current Registrar surfaces own:
term, section, instructor, meeting pattern, component pairing, restrictions,
capacity, waitlist, holds, and whether a student may enroll. The mockup routes
students to `https://connectcarolina.unc.edu/` for that current state.

## Visual plan

### Palette and type

Use the existing Variant A tokens literally: charcoal `#211e1a`, card
`#2b2722`, clay `#322e28`, border `#3c352d`, Carolina blue `#4b9cd3`, sage
`#6fc0a8`, amber `#e7b06a`, and violet `#8c7bd4`. Baloo 2 owns headings,
numbers, buttons, and compact labels; Nunito owns body and data text.

### Layout

```text
Academics banner + Daily / Planning
Planner · Grades & Archive
plan controls + editable planning context

┌──────────────────────── timeline-first board ─────────────────────┐ ┌─ plan coverage ─┐
│ Fall 26 │ Spring 27 │ Fall 27 │ Spring 28 │ MCAT │ Fall 28       │ │ 4 groups + state│
│ dense course rows + Add course affordances                        │ │ sources + limits│
└────────────────────────────────────────────────────────────────────┘ ├─────────────────┤
┌──────────────── persistent course-discovery bay ──────────────────┐ │ outcome guidance│
│ search · quick filters · context │ reasoned sample recommendations │ └─────────────────┘
└────────────────────────────────────────────────────────────────────┘
┌────────────────── unplaced requirements / courses ────────────────┐

Plan coverage → persistent adjacent ledger; full 50-row Planner drawer
Find a course → persistent lower bay; wide subject/result Planner drawer
```

### Signature

The memorable device is the **source-bearing requirement ledger**: each compact
row binds a local status, the evidence currently attached to the plan, and a
direct owner link. It converts the former audit into a planning explanation
without adding a dashboard or a second destination.

## Visible interactions

1. The source-bearing Plan coverage ledger is visible without opening anything;
   `Open all 50 rows` opens the full Planner requirement drawer.
2. Direct `?view=requirements` loads that drawer for review.
3. The Find a course bay visibly exposes search, quick filters, planning
   context, recommendations, provenance, and the illustrative/live boundary;
   `Add course` opens the illustrative catalog drawer with independently
   scrollable subject and result panes.
4. Direct `?view=catalog` loads that drawer for review.
5. Close button, backdrop click, and Escape return to the unchanged plan.
6. Search, subject A–Z, discipline categories, catalog fields, and plan-lens
   controls filter the illustrative rows; result placement remains a preview
   and does not mutate the mock plan.
7. Each requirement and course result exposes a direct official source link.
8. Mobile keeps the plan horizontally scrollable; course discovery, unplaced
   work, requirements, and outcome guidance become deliberate full-width
   sections. Each drawer is independently scrollable without page-level overflow.

## Acceptance gate

- Source and specification mirrors are byte-identical.
- Planner, Requirement map, and Add course routes load through Variant A.
- Timeline structure, MCAT lane, outcome guidance, and unplaced tray remain intact.
- Requirements and course discovery are visibly first-class workbench regions
  in the default plan view before either full drawer is opened.
- All 50 locally modeled rows for the selected scenario render in one of the
  four named requirement groups.
- Every rendered requirement row has a source link.
- Every illustrative course result has a catalog link and a live-state warning;
  empty subject/category combinations show a data-gap state.
- Desktop and narrow checks show no page-level overflow; dense timeline/drawer
  regions retain intentional internal scrolling.
- The registry remains **PROPOSED** and no application code changes.

Andy must approve the review-ready mockup before any mockup-to-app brief or
implementation begins.
