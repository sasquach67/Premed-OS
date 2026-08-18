# Batch 4 official-source gap-fill audit

**Retrieved:** 2026-08-14  
**Scope:** only fields still marked `not-found` in the merged Batch 4 profile file: MD tuition/COA, admissions prerequisites, admissions dates that the school explicitly labels for the 2026–2027 cycle, then class-profile MCAT/GPA figures.  
**Source rule:** school-controlled pages only. No compiled sites, forums, or inferred values. This packet is a research handoff only; it does **not** edit the merged JSON.

## Published values recovered

### `university-of-california-los-angeles-david-geffen-school-of-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| First-year tuition and fees | **$54,715** for California-resident students living off campus or in university housing, 2026–2027 student financial-aid budget. | published; in-state figure only | [UCLA cost of medical school](https://medschool.ucla.edu/education/md-education/financial-aid-scholarships/how-much-is-medical-school) |
| Prerequisites | UCLA says it **does not evaluate specific prerequisite coursework**; it recommends demonstrating the named competencies through college-level coursework. AP credit is acceptable. | published | [UCLA medical-school application](https://medschool.ucla.edu/education/md-education/admissions/preparing-to-apply) |
| Cycle date confirmation | Primary submission deadline: **October 1, 2026, 8:59 p.m. Pacific**. Latest MCAT considered: **September 1, 2026**. PREview score deadline: **November 13, 2026**. | published; supports existing deadline record | [UCLA medical-school application](https://medschool.ucla.edu/education/md-education/admissions/preparing-to-apply) |

Do not manufacture an out-of-state first-year value from this resident budget; the reviewed page did not publish one in the retrieved extract.

### `university-of-california-san-francisco-school-of-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Prerequisites | One academic year of college-level biology with lab; one academic year of college-level chemistry including at least one semester of organic chemistry with lab; one semester/quarter of biochemistry; one semester/two quarters of physics. AP Chemistry and Physics accepted if shown on the college transcript; accredited community-college, online, and pass/no-pass coursework accepted. | published | [UCSF MD application process](https://meded.ucsf.edu/prospective-students/md-program-admissions/md-program-application-process) |
| Cycle-labeled primary deadline | AMCAS application due **October 15, 2026**. The page says it will accept MCAT scores released Jan. 1, 2024–Sept. 12, 2026 for applications submitted by that date. | published; 2026–2027 cycle | [UCSF MD application process](https://meded.ucsf.edu/prospective-students/md-program-admissions/md-program-application-process) |
| Secondary fee / waiver | Secondary fee: **$85** for U.S. citizens, permanent residents, and DACA applicants. The school says AMCAS Fee Assistance Program approval waives the secondary fee. | published | [UCSF MD application process](https://meded.ucsf.edu/prospective-students/md-program-admissions/md-program-application-process) |
| Interview season | Invited applicants interview **late September to early February**. | published, but not expressly cycle-labelled on the page; use only if schema permits a rolling admissions-season description | [UCSF MD application process](https://meded.ucsf.edu/prospective-students/md-program-admissions/md-program-application-process) |

### `florida-state-university-college-of-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Primary deadline | Regular admission AMCAS deadline: **November 15, 2026, 11:59 p.m. EST**. Early decision primary deadline: **August 3, 2026, 11:59 p.m. EST**. | published; explicitly 2026–2027 | [FSU COM admission process and timeline](https://med.fsu.edu/mdAdmissions/admissionProcess) |
| Secondary deadline | Regular admission secondary-materials deadline: **December 10, 2026, 11:59 p.m. EST**. Early-decision secondary-materials deadline: **August 24, 2026, 11:59 p.m. EST**. | published; explicitly 2026–2027 | [FSU COM admission process and timeline](https://med.fsu.edu/mdAdmissions/admissionProcess) |
| Interview season | Regular-cycle interviews: **mid-October 2026 through March 2027**, most Thursdays and Fridays. | published; explicitly 2026–2027 | [FSU COM admission process and timeline](https://med.fsu.edu/mdAdmissions/admissionProcess) |

### `university-of-central-florida-college-of-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Prerequisites | Biology: 2 semesters with labs; general chemistry: 2 semesters with labs; organic chemistry: 1 semester with lab; **biochemistry: 1 semester** (labs recommended only if available); physics: 2 semesters with labs; college English: 2 semesters; college math: 2 semesters. The viewbook labels biochemistry as a new requirement for the 2026–2027 application cycle. | published; explicitly 2026–2027 for biochemistry change | [UCF COM 2025–26 student viewbook](https://med.ucf.edu/media/2025/10/2025-2026-COM-Viewbook.pdf) |
| Cost source | The school publishes a **2026–2027 Cost of Attendance** link and separately directs users to 2026–2027 tuition and fees (Doctor of Medicine program selection). The retrieved text did not expose a numeric M1 tuition value, so no number is safe to copy from this audit. | published source; numeric value not extracted | [UCF student costs](https://med.ucf.edu/student-affairs/financial-services/student-costs/) |

## Targeted results that remain unfilled

The following records were in the targeted not-found set. A current, directly usable official value was not captured in this bounded pass. This means **not-found in this pass**, not that the school never publishes it.

| Exact dataset id | Fields still needing a direct official capture | Status / handling note |
|---|---|---|
| `university-of-california-irvine-school-of-medicine` | first-year cost | not-found in this pass |
| `university-of-california-riverside-school-of-medicine` | cost, prerequisites, cycle-labelled deadlines, class profile | not-found in this pass |
| `university-of-california-san-diego-school-of-medicine` | cycle-labelled deadline | not-found in this pass |
| `university-of-colorado-school-of-medicine` | cost, prerequisites | not-found in this pass |
| `frank-h-netter-md-school-of-medicine-at-quinnipiac-university` | class profile | not-found in this pass |
| `university-of-connecticut-school-of-medicine` | cost, class profile | not-found in this pass |
| `yale-school-of-medicine` | cycle-labelled deadline | not-found in this pass |
| `george-washington-university-school-of-medicine-and-health-sciences` | cost, cycle-labelled deadline | not-found in this pass |
| `georgetown-university-school-of-medicine` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `howard-university-college-of-medicine` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `sidney-kimmel-medical-college-at-thomas-jefferson-university-delaware-regional-medical-cam` | cost, prerequisites, cycle-labelled deadline, class profile | campus-specific values must not be copied from a parent or another campus without an explicit school statement |
| `charles-e-schmidt-college-of-medicine-at-florida-atlantic-university` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `florida-international-university-herbert-wertheim-college-of-medicine` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `nova-southeastern-university-dr-kiran-c-patel-college-of-allopathic-medicine` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `university-of-florida-college-of-medicine` | first-year in-state and out-of-state cost | not-found in this pass |
| `university-of-miami-leonard-m-miller-school-of-medicine` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `university-of-south-florida-health-morsani-college-of-medicine` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `emory-university-school-of-medicine` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `medical-college-of-georgia-at-augusta-university` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `mercer-university-school-of-medicine` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `morehouse-school-of-medicine` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `university-of-georgia-school-of-medicine` | class profile | not-found in this pass |
| `university-of-hawaii-john-a-burns-school-of-medicine` | cost, prerequisites, cycle-labelled deadline, class profile | not-found in this pass |
| `university-of-iowa-roy-j-and-lucille-a-carver-college-of-medicine` | class profile | not-found in this pass |
| `carle-illinois-college-of-medicine` | prerequisites, cycle-labelled deadline, class profile | not-found in this pass |

## Guardrails for applying these findings later

- Preserve each school’s wording; do not normalize competency-based admissions (UCLA) into a course checklist.
- Treat the UCF cost page as a verified route to the 2026–2027 cost material, not a recovered dollar figure.
- Do not turn UCSF’s non-cycle-labelled secondary/interview descriptions into a cycle-specific deadline.
- FSU’s primary and secondary dates are explicitly labelled for the 2026–2027 admissions cycle and are safe to update when the merge owner elects to do so.
