# T1 · Academics Planning Library — final implementation brief

**Authorization:** `BUILD-MANIFEST.md` clears the Planning screen. This brief
supersedes the unsafe completion-count language in the earlier Requirements
mockup; it does not authorize a local degree-audit engine.

## Decision

Planning owns a selected **catalog plan**: exact program/degree/track,
matriculation term, exact applicable IDEAs catalog year, and—where applicable—
Gillings admission term/status. The app can show source-backed requirement
nodes and candidate local-course evidence. ConnectCarolina remains the only
authoritative Tar Heel Tracker and degree audit.

## Research intake and encoding boundary

The source packet was refreshed 2026-08-25 using Exa discovery and official
UNC pages. The current catalog says 120 hours, a final 2.000 UNC GPA, 45 UNC
academic hours, and applicable IDEAs are university-level rules; they are not
local completion nodes. IDEAs 2026–27 applies specifically to students
beginning Fall 2026. Earlier students must select the exact archived catalog;
pre-Fall-2022 students use Making Connections. Gillings records require the
admission-term context.

The local library contains 46 separately selectable source-backed
program/degree/track/concentration records. It can encode human-readable
`all_of`, `choose_n`, minimum-credit, admission, manual-review, exclusion, and
no-double-count constraints. It must not infer course equivalencies, grades,
attributes at enrollment, transfer/AP articulation, substitutions, CLEs,
admission decisions, clinical compliance, advisor approvals, or graduation.

## Experience

1. **Requirements / Audit** begins with an explicit official-audit boundary and
   a ConnectCarolina action. A student selects an exact program/track and
   records provenance context without any default program assumption.
2. Requirement cards label only **Course recorded**, **Not scheduled**, or
   **Manual review**. “Course recorded” means a local course code matches an
   explicitly captured source code; it never means the node is fulfilled.
3. Choice, exclusion, and no-double-count rules stay visible on the affected
   node. Admission-gated and incompletely captured rows lead with manual
   review and the owning official source.
4. Planner’s attention rail consumes the same selected-plan candidate nodes;
   without a selection it retains the existing local catalog behavior.
5. All requirements and Prior credit remain the existing source-evidence and
   transcript-faithful views. They do not duplicate the Planner or create a
   completion verdict.

## Persistence and migration

`planningProgramContext` is added at store version 36. Migration creates only
an empty object, preserving every existing course, requirement, profile, and
program selection as unknown. A reload must retain context entered by the
student; no historical cohort is guessed.

## Acceptance criteria

- No user-facing percentage, “met”, “cleared”, “remaining requirement total”,
  or graduation/pace verdict is derived from local catalog data.
- Each selected record shows source URL, retrieval date, catalog year, and
  manual-review boundary.
- B.S.P.H. records collect admission-term context; tracks remain distinct.
- Program context changes persist after reload; an empty context stays empty.
- Planner, Requirements Audit, All requirements, and Prior credit keep their
  separate ownership and reachable states.

## Deferred source work

Full elective/option tables, historical catalog archive ingestion,
ConnectCarolina reconciliation, course attributes at enrollment, and
student-specific substitutions remain deliberate manual/official-review work.
