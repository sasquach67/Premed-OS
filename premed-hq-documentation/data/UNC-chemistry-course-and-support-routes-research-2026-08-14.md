# UNC Chemistry: course and support routing boundaries

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC academic routes. This is a course-planning/support packet, not a professor ranking, difficulty estimate, grade forecast, or professional-school prerequisite determination.

## Decision in one screen

For UNC Chemistry, Atlas can show a student how to verify the **current catalog rule**, the **live section/restriction**, the **departmental advising route**, and the **right academic-support resource**. These are separate checks. A catalog page does not prove that a section is offered; a live section does not prove it meets a medical school’s prerequisite; a tutoring page does not guarantee a tutor/time slot.

| Student need | Official owner route | Safe action | Atlas must not claim |
|---|---|---|
| Find the published course description/requisites | [UNC Chemistry catalog](https://catalog.unc.edu/undergraduate/departments/chemistry/) | Read the current course page for published prerequisite/co-requisite and credit rules. | That a student is eligible, that the course runs next term, or that it satisfies an outside program. |
| Find/register for a current section or lab | [ConnectCarolina](https://connectcarolina.unc.edu/) / current registrar course search | Inspect the live section, lab/recitation pairing, restrictions, seats, and enrollment requirements. | That catalog availability equals live enrollment access. |
| Choose chemistry-major sequencing/electives | [Chemistry undergraduate advising](https://chem.unc.edu/undergraduate-advising/) | Use the current department process for major-specific planning. | That this is universal pre-health advising or concept tutoring. |
| Need help with a Chemistry concept/problem set | [Learning Center peer tutoring](https://learningcenter.unc.edu/appointment-peer-tutoring/) and [STEM resources](https://learningcenter.unc.edu/services/stem/) | Search the current course/tutor list or Chemistry Canvas support route. | A tutor’s availability, coverage for any particular assignment, or grade result. |
| Need a formal academic adjustment | [Student/Applicant Accommodations](https://compliance.unc.edu/) plus instructor/course process | Use the individualized official route and current course communication channel. | A particular adjustment, testing seat, timing, or course exception. |
| Ask whether Chemistry credit meets a health-program prerequisite | Target program’s official admissions page plus [UNC HPA](https://careers.unc.edu/students/pre-health/) | Keep UNC course equivalency separate from the target program’s own policy. | That a UNC course sequence automatically satisfies every medical/health program. |

## Course pathway rules

### Catalog rule → live section → individual plan

1. **Catalog:** Establishes published course/requisite information for the current catalog edition. [UNC Chemistry catalog](https://catalog.unc.edu/undergraduate/departments/chemistry/)
2. **Live search:** Establishes whether a section/lab/recitation is offered and whether an individual can currently attempt registration. [ConnectCarolina](https://connectcarolina.unc.edu/)
3. **Advisor/audit:** Establishes how a particular student’s prior credit, major requirements, and plan interact.
4. **Target school:** Establishes whether any coursework is accepted for that program’s admissions prerequisite.

Atlas should never skip a layer. A correct answer can be “the catalog lists this prerequisite; confirm the live section and your audit.”

### Chemistry support is course- and term-specific

The Learning Center’s official peer-tutoring list has published support for several chemistry courses, including CHEM 101, 102, 241, 251, 261, 262, 421, 430, and 450 when checked for the relevant term. Its list is explicitly subject to availability, so Atlas should direct students to search their exact current course and contact the program if it is absent rather than treating that list as a permanent guarantee. [Peer tutoring](https://learningcenter.unc.edu/appointment-peer-tutoring/) · [STEM resources](https://learningcenter.unc.edu/services/stem/)

For a concept/problem-learning need, route to peer tutoring/STEM resources. For a Chemistry-major curriculum or sequencing question, route to departmental advising. For a grade/assignment interpretation question, course staff/instructor policy controls. Do not collapse those into one “Chemistry help” button.

## Product rules

1. **No automatic sequences.** Present a draft sequence only with the catalog edition, student audit context, and a live-offering check.
2. **Labs/recitations are registration facts.** Surface them only from current section data; do not infer pairings from old schedules.
3. **No professor/difficulty verdicts in the official layer.** Community evidence, if later collected, stays dated and separate from catalog facts.
4. **Do not convert a course title into pre-health credit.** Target-program requirements own that conclusion.
5. **Live support capacity is not a feature guarantee.** Tutor, Canvas, and appointment access must remain a current owner check.
6. **Accommodations are individualized/private.** Do not retain documentation or make course-exception promises.

## Minimal data contract

```text
CourseSupportRoute
  subject: CHEM
  owner: catalog | registrar | chemistry_department | Learning_Center | accommodations | target_program
  source_url
  source_checked_at
  fact_type: published_requisite | live_offering | advising | tutoring | individual_accommodation
  confirmation_needed: [degree_audit, live_section, advisor, target_program]
  claims_not_supported: [enrollment_guarantee, grade_outcome, difficulty, prerequisite_acceptance]
```

## Source register and refresh rules

1. [UNC Chemistry catalog](https://catalog.unc.edu/undergraduate/departments/chemistry/) — course/requisite owner; record catalog edition.
2. [ConnectCarolina](https://connectcarolina.unc.edu/) — live registration/section surface; recheck every registration decision.
3. [Chemistry undergraduate advising](https://chem.unc.edu/undergraduate-advising/) — department-major planning route; recheck current personnel/process.
4. [Learning Center peer tutoring](https://learningcenter.unc.edu/appointment-peer-tutoring/) and [STEM resources](https://learningcenter.unc.edu/services/stem/) — current academic-support routes; availability changes by term.
5. [UNC Health Professions Advising](https://careers.unc.edu/students/pre-health/) — general pre-health planning route; target program is still authoritative.

## Evidence limits

- This packet does not rate professors, predict workload/grades, state which course to take first, or guarantee tutoring/enrollment.
- It does not establish that any CHEM course satisfies a particular medical, dental, PA, or other program’s prerequisite.
