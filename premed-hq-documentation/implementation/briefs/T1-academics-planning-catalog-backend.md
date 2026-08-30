# T1 · Academics Planning — official UNC course-catalog backend

**Stage:** D · BACKEND MISSING

**Scope:** Replace the 46-code requirement-reference index as Planner's course
catalog with a source-versioned local snapshot of the official UNC 2026–2027
Courses of Instruction. Preserve the requirement index as a separate mapping
layer. This brief is backend/data work only: catalog ingestion, typed records,
search/filter selectors, provenance, and plan-write defaults. Planner and
Grades & Archive visual translation is the next stage.

## 1. Audit before implementation

### A. Spec → paper

`tabs/01-academics.md` §4.2-C1 requires an in-app catalog whose stable facts
come from the official published catalog: catalog year, course code, title,
description, credits, published prerequisites/corequisites, restrictions,
attributes, and provenance. It explicitly separates those facts from live
sections, instructors, seats, waitlists, holds, and enrollment status, which
remain owned by ConnectCarolina or a separately authorized live source.

The approved Planner Variant A records the same structure: official UNC
subject/department A–Z browsing; catalog year, subject, number, attribute and
credit filters; dense results; and a separate selected-plan relevance layer.

### B. Mockup → app

The UI exists but consumes `localCatalogCandidates()`, which derives only
course codes found inside 46 program-requirement records. Its own contract says
it cannot produce titles, credits, descriptions, availability, equivalency, or
fulfillment. Consequently a selected BIOL/CHEM course asks the student to
retype the title and credits, and most UNC subjects/courses do not exist in the
browser. This is the backend failure reported by Andy on 2026-08-27.

### C. Already built — do not rebuild

- Planning context, requirement-source records, candidate-only requirement
  effects, advisor provenance, migrations, term/course CRUD, locks, saved
  plans, and local-first persistence.
- Concrete cold-start chronology (`Fall 2026` → `Spring 2027` → `Fall 2027`).
- Manual course entry as an honest fallback.

### D. Gate

`BUILD-MANIFEST.md` marks the Planner and Planning Library rows `YES`. The
superseded standalone Requirements surface remains `NO` and is not revived.

### E. Decisions

Variant A appearance and behavior are settled in
`academics-planner-prototype.md`. The catalog-data prerequisite section already
requires the normalized official-course record implemented here. No product
decision is outstanding.

### F. Integrations

- **Official UNC 2026–2027 course catalog:** publicly available and
  source-versioned at `https://catalog.unc.edu/courses/`; code/data ingestion is
  missing and belongs in this brief.
- **Current sections, meeting times, instructors, restrictions at a specific
  offering, capacity, seats, waitlists, holds and enrollment:** not part of the
  published catalog snapshot. Keep the visible ConnectCarolina boundary; do
  not infer or fabricate them.
- **Official degree audit and substitutions:** not part of course search. The
  existing candidate-evidence boundary remains.

## 2. Backend work

1. Add a generated, checked-in UNC catalog snapshot with catalog year,
   retrieved date, source URL, and one typed row per published course. Each row
   carries: subject code/name; course number/code; title; description; credit
   text plus numeric minimum/maximum when parseable; level/career; published
   requisites/rules; IDEAs attributes; grading status; source URL; and
   provenance. Unknown fields remain absent rather than inferred.
2. Add a reproducible ingestion script that reads only official UNC catalog
   pages, validates the catalog year, normalizes whitespace without rewriting
   published meaning, sorts deterministically, and fails loudly on duplicate
   course codes or an implausibly small/empty dataset.
3. Keep catalog facts separate from the 46-record requirement mapping. Join by
   normalized course code only when presenting optional plan relevance; never
   convert that join into an official fulfillment verdict.
4. Replace/extend the local catalog adapter with selectors for free-text,
   official subject A–Z, catalog number/range, IDEAs attribute, credit range,
   level/career, and selected-program relevance. An empty result says no local
   match in the captured catalog, not that UNC offers no course.
5. Expose stable catalog facts to the reviewed Add-to-plan flow so code, title,
   and fixed published credits are prefilled. Variable-credit courses require
   the student to choose within the published range. BCPM, transcript-exact
   title, current offering, and enrollment remain explicit student/official
   evidence and are never guessed.
6. Persist only the resulting student-owned `Course` plus catalog provenance;
   do not duplicate the full catalog in localStorage. Manual entry remains
   available for missing or historical records.
7. Add regression coverage for BIOL 103 and representative humanities,
   language, quantitative, and health courses; subject/attribute/credit filters;
   deterministic ingestion; title/credit prefill; variable-credit handling;
   cancel/no-write; save/reload; and the catalog-versus-live-section boundary.

## 3. Do not break

- No scraping or representation of private Student Center/ConnectCarolina
  data. The useful filter semantics may be mirrored; current registration facts
  may not.
- No invented title, credits, attribute, prerequisite, section, instructor,
  seat, availability, enrollment, equivalency, or degree verdict.
- No requirement percentage/composite/ranking and no revival of Tar Heel
  Tracker.
- No changes to mockup HTML, Daily/Class Hub, shared shell, flashcards, or
  unrelated dirty work.
- No new localStorage catalog blob or lossy migration.

## 4. Done when

- [ ] The local course browser covers the official 2026–2027 UNC catalog, not
      only the 46 requirement records, with subject diversity and source
      provenance proven by tests.
- [ ] BIOL 103 and other fixed-credit catalog selections carry their published
      title and credits into Add-to-plan without retyping.
- [ ] Variable-credit courses require a valid choice inside their published
      range.
- [ ] Search and all ruled catalog filters are pure, deterministic, and tested.
- [ ] Requirement relevance remains candidate evidence and live-section data
      remains explicitly unavailable.
- [ ] Cancel writes nothing; confirmation writes one course; JSON reload keeps
      the course and its catalog provenance.
- [ ] Focused tests, TypeScript, production build, generated-data validation,
      and scoped diff check pass.

## 5. Commit

`feat(academics): ingest the official UNC course catalog`

## 6. Next stage

Re-run the Planning router. The next expected stage is E · FRONTEND MISSING:
literal Variant A Planner and Grades & Archive fidelity, including every
filled state and interaction path. That frontend work is not in this brief.
