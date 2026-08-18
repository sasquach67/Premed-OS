# UNC Neuroscience: course, advising, and research-routing boundaries

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC academic routes. This is a source/route packet, not a professor ranking, workload forecast, major recommendation, research-opening list, or professional-school prerequisite determination.

## Decision in one screen

Atlas can help a student find the official source for Neuroscience-related course rules, current registration, program/major planning, and research discovery. It cannot infer a student’s eligibility, the next term’s offering, a research vacancy, a career fit, or whether a course meets an outside health-program prerequisite.

| Student need | Official owner route | Safe action | Atlas must not claim |
|---|---|---|---|
| Verify course description/requisites | [UNC Psychology and Neuroscience catalog](https://catalog.unc.edu/undergraduate/departments/psychology-neuroscience/) | Read the current catalog course page and published rules. | Individual enrollment eligibility, current offering, or target-school credit. |
| Find/register for a current section | [ConnectCarolina](https://connectcarolina.unc.edu/) | Inspect live sections, restrictions, requisites, consent, and seat availability. | That the catalog entry will run or the student can register. |
| Plan a major/minor/coursework | Current department/program advising route and degree audit | Start with the published program page; confirm with the current advisor and audit. | That a generic neuroscience sequence fits every student or declared program. |
| Explore undergraduate neuroscience research | [Office for Undergraduate Research](https://our.unc.edu/find/opportunities/) plus relevant faculty/center profiles | Use owner-run current opportunity listings and profiles to identify leads. | That a PI/lab profile means an opening, pay, credit, or acceptance. |
| Identify programs/centers | [Carolina Institute for Developmental Disabilities](https://cidd.unc.edu/) / current university center or department pages as relevant | Treat program pages as research/topic discovery. | That an undergraduate can join, observe, or contact a program through an unverified route. |
| Need academic support | [Learning Center peer tutoring](https://learningcenter.unc.edu/appointment-peer-tutoring/) and [STEM resources](https://learningcenter.unc.edu/services/stem/) | Check whether the current exact course has a listed support route. | Tutor availability or that a listed tutor covers all advanced coursework. |
| Need formal accommodation | [Student/Applicant Accommodations](https://compliance.unc.edu/) and course process | Use individualized owner process. | A particular adjustment, testing seat, or research accommodation. |

## The four owner checks

1. **Catalog:** course description, credit, and published prerequisites/co-requisites. [Psychology and Neuroscience catalog](https://catalog.unc.edu/undergraduate/departments/psychology-neuroscience/)
2. **ConnectCarolina:** a specific term’s sections, registration restrictions, and current capacity. [ConnectCarolina](https://connectcarolina.unc.edu/)
3. **Degree audit/program advisor:** how a student’s completed credit, declaration, and choices apply to a UNC degree.
4. **Target program:** whether a health-profession program accepts the relevant course as a prerequisite.

Atlas can generate a checklist across those owners; it must not merge their answers into an automatic graduation/pre-health plan.

## Research discovery vs. research availability

Neuroscience-related labs and centers can help a student identify research themes and potential contacts. They do not publish a universal undergraduate-opening inventory. The official OUR Opportunities Database is the current-opening owner; faculty/lab/center profiles are discovery references and require current confirmation before outreach or an application. [OUR opportunities](https://our.unc.edu/find/opportunities/) · [OUR faculty liaisons](https://our.unc.edu/liaisons/)

Keep the following facts separate in Atlas:

- research topic/center;
- lab profile/contact route;
- current opening (only if owner-posted and current);
- compensation/credit/volunteer mechanism;
- student eligibility and actual acceptance.

## Product rules

1. **No automatic course path.** Present only sourced published relations, plus `verify with audit/live section/advisor`.
2. **No specialization inference.** Course/center keywords do not establish a student’s research expertise, career path, or fit.
3. **No static lab-vacancy catalog.** Store owner links and retrieval date; live posts are time-limited.
4. **Department/program advising is not universal pre-health advising.** Use HPA and the target program for external requirement questions.
5. **No professor/difficulty narratives in the official layer.** Those belong to separately captured, dated community evidence.
6. **Keep research and health data private.** Do not retain study participant details, health information, or accommodation documentation.

## Minimal data contract

```text
NeuroscienceRoute
  owner: catalog | registrar | department | degree_audit | OUR | lab_or_center | Learning_Center | accommodations
  source_url
  source_checked_at
  route_kind: course_rule | live_offering | advising | research_discovery | current_opening | support
  confirmation_needed: [degree_audit, live_section, advisor, lab_owner, target_program]
  claims_not_supported: [enrollment_guarantee, research_opening, grade_outcome, career_fit, prerequisite_acceptance]
```

## Source register and refresh rules

1. [UNC Psychology and Neuroscience catalog](https://catalog.unc.edu/undergraduate/departments/psychology-neuroscience/) — current published course/program rule owner; record catalog edition.
2. [ConnectCarolina](https://connectcarolina.unc.edu/) — live term/registration owner; recheck for every enrollment decision.
3. [Office for Undergraduate Research](https://our.unc.edu/find/opportunities/) — current opportunity-discovery owner; follow its current listing/reuse rules.
4. [OUR faculty liaisons](https://our.unc.edu/liaisons/) — current departmental research-wayfinding contacts; recheck named contact details before display.
5. [Learning Center peer tutoring](https://learningcenter.unc.edu/appointment-peer-tutoring/) — current tutoring route; coverage/capacity changes by term.

## Evidence limits

- This packet does not name the “best” neuroscience course, professor, lab, or pathway.
- It does not certify course credit, registration, research access, or future professional-school eligibility.
