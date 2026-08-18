# UNC Biology: course and support routing boundaries

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC academic routes. This is a course-planning/support packet, not a professor ranking, workload prediction, grade forecast, or professional-school prerequisite determination.

## Decision in one screen

Atlas can point a UNC student to the right owner for Biology course rules, live registration, major advising, course-specific help, and research mechanisms. It must keep these layers separate: catalog rules, live section availability, individual degree audit, and outside professional-school policy are not interchangeable.

| Student need | Official owner route | Safe action | Atlas must not claim |
|---|---|---|---|
| Verify a Biology course description/requisite | [UNC Biology catalog](https://catalog.unc.edu/undergraduate/departments/biology/) | Check the current catalog course page and its published rules. | Individual eligibility, next-term availability, or external prerequisite acceptance. |
| Find/register for a current class/lab/recitation | [ConnectCarolina](https://connectcarolina.unc.edu/) | Inspect current sections, pairings, restrictions, seats, and enrollment requirements. | That a catalog course has a section or a place for the student. |
| Plan a Biology major/minor/curriculum | [Biology undergraduate program](https://bio.unc.edu/undergraduate/) | Use the current departmental advising/program route for major-specific questions. | Universal pre-health sequence or course-concept tutoring. |
| Need support in a current Biology course | [Learning Center peer tutoring](https://learningcenter.unc.edu/appointment-peer-tutoring/) and [STEM resources](https://learningcenter.unc.edu/services/stem/) | Search current exact-course support, SI/mentoring/Canvas resources where shown. | A tutor/mentor slot, a particular session, or grade improvement. |
| Want undergraduate research through Biology | [Biology undergraduate research](https://bio.unc.edu/undergraduate/research/) and [Office for Undergraduate Research](https://our.unc.edu/find/opportunities/) | Check the owner’s current mechanisms/listings and confirm with the relevant lab/department. | That a lab is hiring, credit is approved, or a volunteer role is open. |
| Need an academic adjustment | [Student/Applicant Accommodations](https://compliance.unc.edu/) plus course/instructor process | Follow the individualized official route. | A specific adjustment, lab modification, testing seat, or timing. |
| Ask whether Biology credit satisfies a target health program | Target program’s official admissions page plus [UNC HPA](https://careers.unc.edu/students/pre-health/) | Verify with the target program, preserving its own wording. | That a UNC catalog course automatically fulfills any program’s requirement. |

## The four checks for any Biology plan

1. **Published course rule:** The catalog establishes current description, credits, and stated requisite rules. [UNC Biology catalog](https://catalog.unc.edu/undergraduate/departments/biology/)
2. **Live registration fact:** ConnectCarolina establishes offered sections, lab/recitation linkage, restrictions, and capacity for a specific term. [ConnectCarolina](https://connectcarolina.unc.edu/)
3. **Individual UNC plan:** The student’s degree audit and departmental advisor establish how posted/test/transfer credit and declared-program rules apply to that student.
4. **External health-profession requirement:** The target school/program establishes whether it accepts the relevant coursework.

Atlas may give a sourced draft/checklist at steps 1–2. It must never jump directly from “catalog course exists” to “student is ready, eligible, or done.”

## Academic-support boundary

The Learning Center’s current peer-tutoring list has published Biology support for courses including BIOL 101, 103, 104, 220, 240, 252, and 430 when checked in the relevant term. The list is term- and availability-dependent. If an exact course is absent, Atlas should direct the student to the Learning Center’s current contact/alternative route rather than assume another course’s tutor can cover it. [Peer tutoring](https://learningcenter.unc.edu/appointment-peer-tutoring/) · [STEM resources](https://learningcenter.unc.edu/services/stem/)

For a course concept, use Learning Center/course-support routes. For major requirements, use Biology advising. For research participation, use the Biology/OUR owner routes. For target professional-school credit, use target-program sources. These must stay distinct in both data and UI.

## Research-credit/role boundary

Biology’s academic research mechanisms and OUR’s opportunity discovery are not an employment directory. A faculty/lab profile establishes a research area, not a vacancy. Credit, pay, volunteer status, work-study, term, supervision, and department policy must be captured as separate, owner-confirmed facts. [Biology undergraduate research](https://bio.unc.edu/undergraduate/research/) · [OUR opportunities](https://our.unc.edu/find/opportunities/)

## Product rules

1. **Do not prescribe a universal sequence.** Display published relations and request audit/live-section confirmation.
2. **No course difficulty or professor judgment in this official packet.** Community evidence, if collected later, is dated/contextual and never substitutes for the course owner.
3. **Labs are not inferred.** Show current lab/recitation conditions only from the current registration surface.
4. **Support is live/capacity-limited.** Do not market tutoring, SI, Canvas, or mentoring as a guaranteed feature.
5. **Research terms stay unmerged.** Credit, paid work, volunteer work, and work-study have distinct requirements and claims.
6. **Keep accommodations private and individualized.** No stored documentation or outcome prediction.

## Minimal data contract

```text
CourseSupportRoute
  subject: BIOL
  owner: catalog | registrar | biology_department | Learning_Center | OUR | accommodations | target_program
  source_url
  source_checked_at
  fact_type: published_requisite | live_offering | advising | tutoring | research_route
  confirmation_needed: [degree_audit, live_section, advisor, lab_owner, target_program]
  claims_not_supported: [enrollment_guarantee, grade_outcome, difficulty, prerequisite_acceptance]
```

## Source register and refresh rules

1. [UNC Biology catalog](https://catalog.unc.edu/undergraduate/departments/biology/) — published course rules; record current catalog edition.
2. [ConnectCarolina](https://connectcarolina.unc.edu/) — live section and registration information; recheck at every enrollment decision.
3. [Biology undergraduate program](https://bio.unc.edu/undergraduate/) — major/program advising route; recheck current department process.
4. [Learning Center peer tutoring](https://learningcenter.unc.edu/appointment-peer-tutoring/) and [STEM resources](https://learningcenter.unc.edu/services/stem/) — term-specific support routes.
5. [Biology undergraduate research](https://bio.unc.edu/undergraduate/research/) and [OUR opportunities](https://our.unc.edu/find/opportunities/) — research route/current opportunity owners.

## Evidence limits

- This packet does not rank instructors, predict grades/workload, dictate a sequence, or guarantee a place in a course, lab, tutor session, or research role.
- It does not certify that any Biology credit meets a specific health-profession program’s requirements.
