# Batch 6 official-source gap-fill audit

**Retrieved:** 2026-08-14  
**Scope:** records and fields marked `not-found` in merged Batch 6 only. Search order: tuition/COA, prerequisites, admissions dates explicitly tied to 2026–2027, then class-profile figures.  
**Source rule:** school-controlled materials only. This is a findings packet; merged JSON is unchanged.

## Published values recovered

### `duke-university-school-of-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Cycle-labeled deadlines | For the upcoming **2026–27 application cycle**, MCAT must be completed by **September 12, 2026**; AMCAS is due **October 15, 2026, 11:59 p.m. EST**; the DukeMed secondary is due **November 16, 2026, 11:59 p.m. EST**. | published; explicitly cycle-labelled | [Duke MD admissions FAQs](https://medschool.duke.edu/education/health-professions-education-programs/doctor-medicine-md-program/admissions/admissions-0) |
| First-year MD tuition (context-limited) | Duke’s 2026–2027 MSTP award table lists first-year medical-student tuition of **$72,297** ($36,148.50 each fall and spring semester). | published but source is the MSTP award table, not a general MD cost page; do not silently substitute it for a general MD tuition record without an editorial note | [Duke MSTP financial aid](https://medschool.duke.edu/education/health-professions-education-programs/medical-scientist-training-program/about-mstp-0) |

### `university-of-north-dakota-school-of-medicine-and-health-sciences`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Cycle-labeled deadlines | AMCAS primary: **October 15, 2026**; transcripts to AMCAS: **October 31, 2026**; secondary, MCAT, and all letters: **November 1, 2026**. The school’s timeline also says interviews finish in January 2027 and all applicants are notified by month end. | published; 2026–2027 admission timeline | [UND MD how to apply](https://med.und.edu/admissions/student-affairs-admissions/prospective-students/how-to-apply.html) |
| Cost source | UND has a **2026–2027 Academic Year Estimated Cost of Attendance** table. It reports several MS1 tuition-and-fee schedules, but the retrieved result did not retain the labels associating each schedule with the residency category. | official source found; no in-state/out-of-state assignment is safe from this retrieval alone | [UND medical-school cost](https://med.und.edu/admissions/student-affairs-admissions/financial-aid/cost-of-attendance.html) |
| Course requirement policy | The official admissions policy says UND **does not require completion of specific academic coursework** for admission. It recommends preparation in introductory biology, organic and inorganic chemistry, physics, biochemistry, and cellular/molecular biology; the formal policy also suggests upper-level biochemistry, one or two upper-level biology courses, and intensive writing. | published; preserve the “no specific coursework required” distinction | [UND admissions requirements policy](https://med.und.edu/about/policies/_files/docs/5.19-admissions-requirements-2024-25-clean-reccomend-090924.pdf) |

## Targeted fields not safely recovered in this bounded pass

| Exact dataset id | Fields still needing a direct official capture | Status / guardrail |
|---|---|---|
| `university-of-missouri-columbia-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-missouri-kansas-city-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `washington-university-school-of-medicine-in-st-louis` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-mississippi-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `brody-school-of-medicine-at-east-carolina-university` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `methodist-university-cape-fear-valley-health-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | newly developing program; do not infer a profile where an entering class may not yet exist |
| `unc-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `wake-forest-university-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `creighton-university-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-nebraska-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `geisel-school-of-medicine-at-dartmouth` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `cooper-medical-school-of-rowan-university` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `hackensack-meridian-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `rutgers-new-jersey-medical-school` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `rutgers-robert-wood-johnson-medical-school` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-new-mexico-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `kirk-kerkorian-school-of-medicine-at-unlv` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `roseman-university-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | newly developing program; do not infer an entering-class profile |
| `university-of-nevada-reno-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `albany-medical-college` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `albert-einstein-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `cuny-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `columbia-university-vagelos-college-of-physicians-and-surgeons` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `donald-and-barbara-zucker-school-of-medicine-at-hofstra-northwell` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `icahn-school-of-medicine-at-mount-sinai` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `jacobs-school-of-medicine-and-biomedical-sciences-at-the-university-at-buffalo` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `new-york-medical-college` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `new-york-university-grossman-long-island-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | separate program: do not use NYU Grossman Manhattan data unless the school expressly states it applies to Long Island |

## Application guardrails

- Duke’s dates are explicitly 2026–27; the MSTP tuition table has different program context and should be kept as a source-qualified lead rather than silently normalized.
- UND’s cost-page search extract omitted the residency headings for its multiple tuition schedules. Do not assign those figures to in-state or out-of-state fields until the page is manually read with headings intact.
- “Does not require specific academic coursework” (UND) is materially different from a standardized prerequisite list.
