# Batch 5 official-source gap-fill audit

**Retrieved:** 2026-08-14  
**Scope:** only fields marked `not-found` in merged Batch 5, searched in this order: first-year MD tuition/COA, prerequisites, admissions dates expressly tied to 2026–2027, then official entering-class MCAT/GPA pages.  
**Source rule:** school-controlled pages only. This packet is a research handoff; it does **not** change the merged JSON.

## Published values recovered

### `indiana-university-school-of-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Tuition | The school fact sheet lists **$40,038.16 in-state** and **$67,579.32 out-of-state** MD tuition. | published; the current page does not put a 2026–2027 label next to these figures | [IU School of Medicine fact sheet](https://medicine.iu.edu/facts) |
| Prerequisites | One year each of general and organic chemistry, physics, and biology, each with lab; one semester of biochemistry; one social-science and one behavioral-science course. Pass/satisfactory grades are accepted; online coursework is accepted, while classroom science courses at four-year accredited institutions are preferred. | published | [IU MD application requirements](https://medicine.iu.edu/md/admissions/application-requirements) |
| Entering profile | **Class of 2029 enrolled students:** average GPA **3.84** and average MCAT **512.4**. The page identifies the students as enrolled, so these are matriculant figures. | published; average/mean; class year 2029 | [IU MD class selection](https://medicine.iu.edu/md/admissions/class-selection) |

### `university-of-minnesota-medical-school`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| First-year tuition and estimated average fees | 2026–2027 Year 1 fall/spring: **$34,136 resident** and **$51,122 non-resident**. This is the tuition-and-estimated-average-fees row, not total cost of attendance. | published; explicitly 2026–2027 | [UMN MD student budget](https://med.umn.edu/md-students/financial-aid/costs-budgeting/twin-cities-student-budget) |
| Prerequisite rule | Applicants must complete **seven prerequisite courses** at an accredited U.S. or Canadian college or university by July 1 of matriculation. | published; the reviewed page does not expose the course-by-course list in the retrieved text | [UMN prepare to apply](https://med.umn.edu/admissions/prepare-apply) |
| Cycle-labeled dates | For **Application Cycle 2027 (Class of 2031):** Aug. 13, 2026 last accepted PREview date; Aug. 22, 2026 last accepted MCAT date; Oct. 1, 2026 MD AMCAS deadline; Oct. 15, 2026 transcript deadline; Oct. 30, 2026 MD supplemental deadline. | published; explicitly 2026–2027 application activity | [UMN prepare to apply](https://med.umn.edu/admissions/prepare-apply) |

### `university-of-maryland-school-of-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Published academic profile | For the **2025 entering class**, the page says accepted students had an **average GPA of 3.84** and **average MCAT of 512**. | published; mean/average; population = accepted; class year 2025 | [UMSOM admissions FAQ](https://www.medschool.umaryland.edu/admissions/your-path-to-medical-school/frequently-asked-questions/) |

The same FAQ gives a primary/secondary/letter schedule but does not explicitly identify its admission cycle. Keep those date fields null until the school labels them for 2026–2027.

## Targeted fields not safely recovered in this bounded pass

The entries below were in the merged file’s `not-found` set. “Not found” is scoped to this audit, not a claim that the institution never publishes the item.

| Exact dataset id | Fields still needing a direct official capture | Status / guardrail |
|---|---|---|
| `loyola-university-chicago-stritch-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `northwestern-university-feinberg-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `rush-medical-college-of-rush-university-medical-center` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `southern-illinois-university-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `university-of-chicago-pritzker-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `university-of-illinois-college-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `university-of-kansas-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `university-of-kentucky-college-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `university-of-louisville-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `louisiana-state-university-school-of-medicine-in-new-orleans` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `louisiana-state-university-school-of-medicine-in-shreveport` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `tulane-university-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `boston-university-aram-v-chobanian-edward-avedisian-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `harvard-medical-school` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `tufts-university-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `university-of-massachusetts-t-h-chan-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `johns-hopkins-university-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `uniformed-services-university-of-the-health-sciences-f-edward-hebert-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `tufts-university-school-of-medicine-maine-track` | cost, prerequisites, cycle-labelled admission dates, class profile | do not copy a parent-campus figure unless the official source expressly applies it to the Maine Track |
| `central-michigan-university-college-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `michigan-state-university-college-of-human-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `oakland-university-william-beaumont-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `university-of-michigan-medical-school` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `wayne-state-university-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `western-michigan-university-homer-stryker-m-d-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `mayo-clinic-alix-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |
| `saint-louis-university-school-of-medicine` | cost, prerequisites, cycle-labelled admission dates, class profile | not-found in this pass |

## Application guardrails

- IU’s page uses **average**, so these figures must never be written to a field that implies a median.
- The UMN tuition figures are tuition plus estimated average fees for the fall/spring Year 1 period; the page separately reports living and other budget components.
- UMN’s cycle label says “Application Cycle 2027 (Class of 2031)”; preserve that source wording rather than relabeling it without a note.
- Maryland’s profile is explicitly for the 2025 entering class. Its unsuffixed timeline cannot safely be converted into a 2026–2027 deadline record.
