# T1 · Academics Planning — filled-state fidelity and interaction completion

**Stage:** E · FRONTEND MISSING

**Scope:** Translate the approved Variant A Planner and Grades & Archive views
into the main app after the official-catalog backend stage. This brief owns the
filled and empty routes, every visible control on those views, and their
student-owned persistence. It does not revive Tar Heel Tracker or change Daily.

## 1. Audit before implementation

- `academics-planner-prototype.html/.md` requires the horizontal term board,
  in-context Plan coverage rail, official A–Z catalog bay, selected-course
  inspector, and honest official/live-data boundary.
- `academics-grades-archive.html/.md` requires Ledger A (term cards with the
  six-column transcript table), GPA A (dual UNC/AMCAS hero), and What-if A
  (result first, then term assumptions, then the class calculator handoff).
- Current filled Planner still exposes the legacy 46-record picker and asks the
  student to retype published titles and fixed credits. Current Ledger rows
  collapse six columns into one summary line. Current What-if starts with an
  empty generic assumption form instead of the selected term result.
- `BUILD-MANIFEST.md` authorizes Planner, Planning Library, and Grades & Archive.
  The standalone Requirements/Tracker surface remains out of scope.

## 2. Implementation

1. Use the checked-in official UNC catalog snapshot in the existing catalog
   modal. Show search plus subject A–Z, level, attribute, credit, and optional
   selected-program relevance filters. Show official title, description,
   credits, requisites, attributes, source year and retrieval date.
2. A catalog selection prefills code/title/fixed credits. Variable-credit
   records require an in-range choice. The student still chooses term, status,
   residence, and BCPM evidence. Manual/historical entry remains available.
3. Keep term chronology concrete (`Fall 2026` → `Spring 2027`), never raw
   `This term`/`Next term` labels in the user-facing populated plan when a real
   start term exists. Course chips open a useful inspector and all edit/remove/
   placement actions remain reversible and persistent.
4. Recompose Ledger rows as the approved six-column transcript table inside
   term cards: exact course number, exact title, credits, grade, AMCAS
   classification, and status. Term headers expose credits and supported term
   GPA/BCPM values without inventing missing data. Archive stays a filter.
5. Keep the dual-GPA view side by side and preserve the AMCAS rule/version
   boundary. Recompose What-if so its current hypothetical result leads; use
   real in-progress courses as default assumptions and expose grade controls
   below. The full weighted inverse solve remains linked to the selected
   class’s Assignments tab.
6. Match Variant A tokens and geometry literally from the mockup CSS: warm
   canvas, solid panel/row ladder, Baloo display hierarchy, 16/13px radii,
   compact blue accents, and no glass on normal content.

## 3. Done when

- [ ] Catalog browse/search/filter/inspect/add/manual/cancel paths work and
      fixed facts are not retyped.
- [ ] Planner empty → filled → reload keeps concrete terms and course facts.
- [ ] Ledger/GPA/What-if match the approved structure in both themes.
- [ ] Every visible button, tab, select, chip and linked handoff has a verified
      destination or state effect; cancel paths write nothing.
- [ ] Focused interaction tests, TypeScript, build, and desktop visual checks
      pass. The surface is not marked BUILT without the full promotion proof.

## 4. Commit

`feat(academics): complete planning interactions and visual fidelity`
