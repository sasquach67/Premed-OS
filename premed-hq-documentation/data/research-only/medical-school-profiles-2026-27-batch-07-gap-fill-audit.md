# Batch 7 official-source gap-fill audit

**Retrieved:** 2026-08-14  
**Scope:** fields marked `not-found` in merged Batch 7, searched in this order: MD tuition/COA, prerequisites, admissions dates explicitly tied to 2026–2027, then official class-profile material.  
**Source rule:** school-controlled pages only. This packet does **not** modify the merged JSON.

## Published values recovered

### `new-york-university-grossman-school-of-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| First-year cost | 2026–27 first-year MD tuition is **$65,500**; the school applies a **-$65,500 full-tuition scholarship**. First-year fees are **$4,550**. Its listed first-year cost after the tuition scholarship and health-insurance subsidy is **$38,616**. | published; explicitly 2026–27 | [NYU Grossman cost of attendance](https://med.nyu.edu/education/md-degree/affordability-financial-aid/cost-attendance) |
| Prerequisite policy | NYU Grossman says it **does not have prerequisites**. It recommends inorganic chemistry, organic chemistry, and biochemistry with lab; general biology with lab; general physics with lab; statistics; genetics; and English. | published; preserve required-versus-recommended distinction | [NYU Grossman MD admissions requirements](https://med.nyu.edu/education/md-degree/md-admissions/admissions-requirements) |
| Cycle-labeled dates | For the **2026–27 Application Schedule**: primary due **October 15**; secondary due **November 10, 2026, 11:59 p.m. ET**; interview season begins in September and ends in December; tertiary due **February 2, 2027, 11:59 p.m. ET**. | published; explicitly 2026–27 | [NYU Grossman MD admissions timeline](https://med.nyu.edu/education/md-degree/md-admissions/admissions-timeline) |
| Secondary fee / waiver | Secondary fee is **$110**, waived for applicants with an AAMC Fee Assistance Program waiver. | published | [NYU Grossman how to apply](https://med.nyu.edu/education/md-degree/md-admissions/how-to-apply) |

### `oregon-health-science-university-school-of-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|
| Academic profile | The admissions page says its entering class has average total GPA **3.66**, average science GPA **3.57**, and average MCAT **509**. | published; averages; class year and population label are unstated | [OHSU MD admissions](https://www.ohsu.edu/school-of-medicine/md-program/admissions) |
| Prerequisite policy | OHSU says its recommended **17 premedical core competencies** have fully replaced prerequisite coursework. | published; competency model, not a course list | [OHSU MD admissions](https://www.ohsu.edu/school-of-medicine/md-program/admissions) |
| Cost source | The admissions page identifies **Academic Year 2026–2027** and directs readers to the official Tuition & Fee Book for a cost breakdown. The tuition-book search extract was not sufficiently structured to safely transcribe a first-year annual resident/non-resident figure. | official 2026–27 source located; numeric annual field not safely captured | [OHSU MD admissions](https://www.ohsu.edu/school-of-medicine/md-program/admissions) |

### `the-warren-alpert-medical-school-of-brown-university`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Tuition | **$75,162** annual full-time medical-school tuition for 2026–2027. The page separately lists annual student-activity, recreation, health-services, health-insurance, and academic-record charges. | published; explicitly 2026–27 | [Brown medical-school tuition and fees](https://sfs.brown.edu/tuition-and-fees/medical-school) |

## Targeted fields not safely recovered in this bounded pass

| Exact dataset id | Fields still needing a direct official capture | Status / guardrail |
|---|---|---|
| `renaissance-school-of-medicine-at-stony-brook-university` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `suny-downstate-health-sciences-university-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `suny-upstate-medical-university-alan-and-marlene-norton-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-rochester-school-of-medicine-and-dentistry` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `weill-cornell-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `case-western-reserve-university-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `northeast-ohio-medical-university` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `ohio-state-university-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-cincinnati-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-toledo-college-of-medicine-and-life-sciences` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `wright-state-university-boonshoft-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-oklahoma-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `drexel-university-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `geisinger-commonwealth-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `lewis-katz-school-of-medicine-at-temple-university` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `pennsylvania-state-university-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `perelman-school-of-medicine-at-the-university-of-pennsylvania` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `sidney-kimmel-medical-college-at-thomas-jefferson-university` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-pittsburgh-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `ponce-health-sciences-university-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `san-juan-bautista-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `universidad-central-del-caribe-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-puerto-rico-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `medical-university-of-south-carolina-college-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-south-carolina-school-of-medicine-columbia` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |
| `university-of-south-carolina-school-of-medicine-greenville` | cost, prerequisites, cycle-labelled dates, class profile | distinct campus/program; do not substitute Columbia figures without an explicit school statement |
| `university-of-south-dakota-sanford-school-of-medicine` | cost, prerequisites, cycle-labelled dates, class profile | not-found in this pass |

## Application guardrails

- NYU Grossman’s tuition figure and the scholarship offset are both important: the tuition is published, but the ordinary billed tuition balance is offset for MD students by the named institutional scholarship.
- OHSU’s stated competencies are not prerequisites. Keep that policy distinction rather than translating them into semesters of coursework.
- OHSU’s entering-class numbers are averages, with no class year or population label in the retrieved official text; retain those metadata limits.
