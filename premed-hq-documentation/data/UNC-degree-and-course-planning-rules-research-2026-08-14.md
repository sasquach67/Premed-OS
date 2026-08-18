# UNC degree and course planning: source hierarchy and product guardrails

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC and application-owner sources. This is a routing/safety packet, not a substitute for a student’s current degree audit, departmental advisor, registrar decision, or a medical school’s admissions requirements.

## Decision in one screen

Atlas can help a UNC student build a **draft** plan from the current undergraduate catalog, catalog course pages, and the student’s stated constraints. It must label the result a draft until four separate checks occur:

1. the student’s current **ConnectCarolina degree audit**;
2. the current **course schedule** and each section’s prerequisites/restrictions;
3. a departmental/academic-advisor check for major and graduation implications; and
4. the **target professional school’s** current prerequisites and admissions policy.

No single “pre-med plan,” AP credit equivalency, catalog sample plan, or past offering proves all four.

## The official source hierarchy

| Question | Official owner/source | Safe Atlas behavior | What it cannot establish alone |
|---|---|---|---|
| University curriculum and degree rules | [UNC Undergraduate Degree Requirements](https://catalog.unc.edu/undergraduate/degree-requirements/) and [IDEAs in Action](https://ideasinaction.unc.edu/) | Cite catalog edition/retrieval date; show relevant requirement family as a planning constraint. | That the user’s individual audit is satisfied. |
| Major/minor requirements and catalog course rules | Current [UNC Undergraduate Catalog](https://catalog.unc.edu/undergraduate/) and department page | Link the named major’s published rules and specific course requisites. | That every course is offered next term or that the student may enroll. |
| Live enrollment and section availability | [ConnectCarolina](https://connectcarolina.unc.edu/) / official registrar course-search experience | Route the student to live search and registration information. | That a catalog course has seats, an acceptable section, or no departmental restriction. |
| Individual progress toward a UNC degree | Student’s authenticated degree audit and assigned academic advisor | Prompt review of the audit and advisor escalation for ambiguous combinations. | A public catalog cannot see transfer/test-credit posting or substitutions. |
| AP/IB/transfer credit | [UNC Credit Evaluation](https://catalog.unc.edu/policies-procedures/credit-evaluation/) and [Admissions transfer-credit information](https://admissions.unc.edu/apply/types-of-applications/transfer/transfer-credit/) | Treat owner-awarded equivalency as the record of what UNC accepts. | That a professional school accepts it for its own prerequisites. |
| Away/study-abroad course credit | [UNC Study Abroad](https://studyabroad.unc.edu/) plus program/academic approval route | Require advance owner approval where applicable and retain the approved equivalency/source. | That a proposed course will count before approval/transcript processing. |
| Pre-health application readiness | [UNC Health Professions Advising](https://careers.unc.edu/students/pre-health/) and each target school/application service | Use HPA as advising route; store a school-specific requirement source separately. | That “pre-med” is a major or that one common prerequisite grid suits every program. |

## Rules that should never be collapsed

### 1. University requirement ≠ major requirement ≠ professional-school prerequisite

UNC’s **IDEAs in Action** curriculum is the university general-education framework. A major adds its own requirements; a medical, dental, PA, or other health-profession program can impose a different or more specific prerequisite. Atlas should store them as different requirement owners, rather than treating a course that satisfies one as automatically satisfying all others. [UNC Degree Requirements](https://catalog.unc.edu/undergraduate/degree-requirements/) · [UNC Health Professions Advising](https://careers.unc.edu/students/pre-health/)

### 2. Catalog listing ≠ live offering or registration access

Catalog course pages establish description, credit, and published requisites. They do not establish term frequency, section modality, instructor, seat availability, consent, reserve-capacity, or co-requisite pairing for a particular registration cycle. The current registrar/ConnectCarolina experience controls live availability. Atlas can show “verify in live course search,” never “take this next term” from catalog data alone.

### 3. A sample four-year plan is illustrative

Departmental sample plans commonly warn that offerings and individual plans vary. Atlas may use them as a possible sequencing reference while showing the source and assumptions. It must not mark sample-plan courses as the user’s commitments or promise graduation in eight semesters.

### 4. UNC transfer/test credit ≠ external admissions acceptance

UNC may award test or transfer credit under its own published Credit Evaluation policy. The catalog also distinguishes a course that transfers as a direct equivalency from one that only contributes hours/elective credit. That determination helps UNC degree planning, but a medical school can have independent expectations about AP/IB, online, lab, upper-level, or institutional coursework. Atlas must attach the medical-school owner source before representing an application prerequisite as satisfied. [UNC Credit Evaluation](https://catalog.unc.edu/policies-procedures/credit-evaluation/) · [AAMC Medical School Admission Requirements](https://students-residents.aamc.org/applying-medical-school/applying-medical-school-process/medical-school-admission-requirements)

### 5. Pre-health is an advising pathway, not a UNC major

UNC’s catalog states that it has no formal pre-health curriculum or major; students choose an undergraduate degree program and incorporate relevant prerequisites in planning. Atlas should let a student start from their actual major and goals, then add a separate target-program requirements layer. [UNC academic resources catalog](https://catalog.unc.edu/resources/academic-research/)

## Scenario routing

| Student asks | Atlas first response | Required confirmation |
|---|---|---|
| “Will this satisfy my degree requirement?” | Show the relevant current catalog rule and direct them to their degree audit. | Audit result, substitutions, transfer/test-credit posting, advisor if unclear. |
| “Can I take course B after course A?” | Surface the published prerequisite/co-requisite from the current catalog page. | Live section restrictions, grade/credit status, placement and department permissions. |
| “Can I use AP/IB/dual-enrollment credit?” | Explain it is an UNC credit-evaluation question **and** a target-school question. | Official UNC equivalency plus target program’s own policy. |
| “Can I take this course abroad/elsewhere?” | Direct to Study Abroad/appropriate UNC advance approval route before enrollment. | Written approval/equivalency and later transcript posting. |
| “Is this a good pre-med major?” | Clarify that pre-health is not a major; compare degree requirements, interest, and practical sequencing. | Student’s goals, academic advisor, HPA, and target-school requirements. |
| “Will this schedule graduate me on time?” | Produce a gap-check checklist, not a promise. | Audit, live offerings, major advisor, transfer/test credit, and chosen concentration/minor. |

## Product data model

```text
RequirementClaim
  owner: university | major_department | registrar | application_service | target_school
  source_url
  catalog_or_policy_edition
  source_checked_at
  applies_to: cohort_or_program_or_course
  status: published_rule | audit_confirmed | advisor_confirmed | student_reported | unknown
  satisfies: [university, major, target_school]  # explicit, never inferred across owners
  verification_needed: [degree_audit, live_section, advisor, target_school]
```

**Planner result labels:**

- **Published constraint:** sourced catalog/policy wording, not personalized confirmation.
- **Draft sequence:** based on published requisites and user inputs; must be checked in the live schedule/audit.
- **Confirmed only when evidence is attached:** audit screenshot/export, authorized advisor confirmation, or target-school official page retained with date.

## Medical/pre-health-relevant academic surfaces

The current catalog is the source of truth for rules for Biology, Chemistry, Neuroscience, Psychology and Neuroscience, Statistics and Analytics, Physics and Astronomy, Public Health, Biomedical Engineering, and any other declared program. Do not hard-code one list of “medical majors” or reproduce every department’s course inventory. For a user’s chosen major, route to its current catalog program page, then map only the user-selected requirements and published course requisites.

For application planning, keep the following questions separate and school-specific: required sciences/labs, acceptable AP/IB/transfer substitutions, statistics/biochemistry/psychology/sociology expectations, online-course policy, grade/minimum standards, and expiry/timing rules. HPA can guide planning, but the target school retains authority.

## Refresh rules and limitations

1. **Catalog:** record edition and retrieval date; UNC publishes a new undergraduate catalog by academic year.
2. **Course availability:** inspect the live schedule at every registration decision; never cache an offering as permanent.
3. **Degree audit:** access is student-specific and protected; Atlas should not claim access or reconstruct it from public data.
4. **Credit evaluation:** recheck when a new score/transcript/equivalency posts or a student considers outside coursework.
5. **Professional schools:** recheck current admissions pages in the application year; do not use a general guide to override a school.

This packet does not calculate a graduation date, decide a major, verify a course equivalency, or establish that any particular school will accept a prerequisite choice.
