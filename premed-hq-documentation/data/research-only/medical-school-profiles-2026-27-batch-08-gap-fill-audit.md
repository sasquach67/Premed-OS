# Batch 8 official-source gap-fill audit

**Retrieved:** 2026-08-14  
**Scope:** fields marked `not-found` in merged Batch 8 only, searched in priority order: MD tuition/COA, prerequisites, admission dates explicitly tied to 2026–2027, then official class-profile material.  
**Source rule:** official school sources only. This is a research packet and does **not** edit the merged JSON.

## Published values recovered

### `baylor-college-of-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Cost of attendance | For **Temple Campus, non-Texas residents**, 2026–2027 first-year cost of attendance is **$74,047.85**; direct charges are **$44,630.85**, including **$32,782.50** non-Texas-resident tuition. | published; explicitly 2026–2027; do not use this non-Texas Temple figure as an in-state value | [BCM MD tuition and fees](https://www.bcm.edu/education/school-of-medicine/m-d-program/tuition-and-fees) |
| Required coursework | At least 90 undergraduate semester hours by enrollment. Required: math 3–4 semester hours; expository writing 3–4; humanities/social-behavioral sciences 12; organic chemistry 2 semesters/6–8 hours; biochemistry 3–4; advanced biology 3–4. The page says AP courses are not accepted for required coursework; labs are not required for organic chemistry, biochemistry, or advanced biology. | published | [BCM MD admission requirements](https://www.bcm.edu/education/school-of-medicine/m-d-program/admissions-process/requirements) |

### `university-of-texas-southwestern-medical-school`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| First-year tuition and fees / total COA | 2026–2027 MS1 tuition and fees: **$25,436 Texas resident** and **$38,536 non-Texas resident**. Corresponding total COA: **$66,847** and **$79,947**. | published; explicitly 2026–2027 | [UT Southwestern 2026–2027 medical-school COA](https://www.utsouthwestern.edu/education/students/financial-aid/cost-of-attendance/medical/) |
| Course requirements | Biology 14 semester hours including formal lab; biochemistry 3; chemistry 12 including 4 hours general/inorganic with lab and 8 hours organic with lab; English 6; mathematics 3; physics 8 including lab. Required courses must be at an accredited U.S. or Canadian college/university; AP is accepted only if the transcript specifies course and units; each course must be C or better. | published | [UT Southwestern prerequisite courses](https://medschool.utsouthwestern.edu/admissions/prerequisites.html) |
| Cycle-labeled dates | For the **2026–2027 application cycle**: TMDSAS accepts applications May 1–October 1; CASPer deadline October 27, 2026 and score-distribution deadline November 1, 2026; interviews are virtual, August through early December. | published; explicitly cycle-labelled | [UT Southwestern MD admissions](https://medschool.utsouthwestern.edu/admissions/) |

## Targeted fields not safely recovered in this bounded pass

| Exact dataset id | Fields still needing a direct official capture | Status / guardrail |
|---|---|---|
| `east-tennessee-state-university-james-h-quillen-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `meharry-medical-college` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `thomas-f-frist-jr-college-of-medicine-at-belmont-university` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-tennessee-health-science-center-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `vanderbilt-university-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `dell-medical-school-at-the-university-of-texas-at-austin` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `long-school-of-medicine-at-ut-health-san-antonio` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `mcgovern-medical-school-at-uthealth-houston` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `texas-a-m-university-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `texas-christian-university-burnett-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `texas-tech-university-health-sciences-center-paul-l-foster-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `texas-tech-university-health-sciences-center-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | distinct Texas Tech program; do not copy Paul L. Foster-campus values without explicit coverage |
| `university-of-houston-tilman-j-fertitta-family-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-texas-medical-branch-john-sealy-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-texas-rio-grande-valley-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-texas-at-tyler-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-utah-spencer-fox-eccles-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `eastern-virginia-medical-school-at-old-dominion-university` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-virginia-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `virginia-commonwealth-university-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `virginia-tech-carilion-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `robert-larner-m-d-college-of-medicine-at-the-university-of-vermont` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `elson-s-floyd-college-of-medicine-at-washington-state-university` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-washington-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `medical-college-of-wisconsin` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-wisconsin-school-of-medicine-and-public-health` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `marshall-university-joan-c-edwards-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `west-virginia-university-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |

## Application guardrails

- Baylor’s recovered tuition figure is specifically for the listed **Temple Campus, non-Texas-resident** schedule. It cannot be promoted to a generic Baylor in-state or campus-neutral price.
- UT Southwestern’s tuition-and-fee figures and total COA are distinct values; preserve both rather than treating the COA as tuition.
- Texas programs have service-specific application mechanics. The UT Southwestern dates belong to TMDSAS and should not be rewritten as AMCAS dates.
