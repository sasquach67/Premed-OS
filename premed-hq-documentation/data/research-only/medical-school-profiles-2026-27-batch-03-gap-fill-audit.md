# Batch 3 official-source gap-fill audit

Retrieved: 2026-08-14  
Scope: records/fields still missing in `medical-school-profiles-2026-27-batch-03-figure-level-v2.json`. Order: 2026-27 tuition/COA, prerequisites, cycle-labelled admission dates, then official class profiles. This packet does not modify JSON.

## Published values recovered

| Exact dataset id | Field | Published value | Status | Official source |
| --- | --- | --- | --- | --- |
| `pacific-northwest-university-of-health-sciences-college-of-osteopathic-medicine` | Prerequisites | English composition/literature 6 semester/9 quarter hours; general chemistry 8/12; organic chemistry 8/12 (up to 4 semester hours may be biochemistry); physics 8/12; biological sciences 12/18. | Published | [PNWU COM admissions](https://www.pnwu.edu/admissions/doctor-of-osteopathic-medicine/) |
| `pacific-northwest-university-of-health-sciences-college-of-osteopathic-medicine` | Application deadline | Supplemental application and required documents: April 3. The page does not label the cycle/year, so it is evidence only and not safe to load as a 2026-27 deadline. | Published but not cycle-labelled | [PNWU COM admissions](https://www.pnwu.edu/admissions/doctor-of-osteopathic-medicine/) |
| `pacific-northwest-university-of-health-sciences-college-of-osteopathic-medicine` | 2026-27 cost source | School publishes a dedicated 2026-27 COM Tuition and Budget Expenses document. Exact values were not exposed in the retrieved page text and are not transcribed here. | Published source, values not extracted | [PNWU cost of attendance](https://www.pnwu.edu/admissions/financial-aid/cost-of-attendance/) |
| `university-of-south-alabama-frederick-p-whiddon-college-of-medicine` | Prerequisites | General Chemistry with lab 8 semester hours; General Biology with lab 8; Mathematics 6; Organic Chemistry with lab 8; General Physics with lab 8; Humanities 3; Behavioral/Social Sciences 3; English Composition or Literature 6. Biochemistry may substitute for Organic Chemistry II. | Published | [Whiddon COM application information](https://usa50.southalabama.edu/colleges/com/futurestudents/apply.html) |
| `university-of-south-alabama-frederick-p-whiddon-college-of-medicine` | 2026-27 cost source | 2026-27 cost-of-attendance page is published. | Published source, exact tuition not extracted | [Whiddon COM 2026-27 COA](https://www.southalabama.edu/departments/finaid/com/cost.html) |
| `university-of-south-alabama-frederick-p-whiddon-college-of-medicine` | Cycle test timing | For the 2027 cycle, September 2026 MCAT dates are the latest considered and 2023 is the earliest for the 2027 entering class. This is not a primary/secondary application deadline. | Published, not a deadline | [Whiddon COM application information](https://usa50.southalabama.edu/colleges/com/futurestudents/apply.html) |

## Targeted official results without a safe fill

| Exact dataset id | Status | Reason |
| --- | --- | --- |
| `university-of-north-texas-health-science-center-texas-college-of-osteopathic-medicine` | Not found | No usable current official field captured in this pass. |
| `west-virginia-school-of-osteopathic-medicine` | Not found | No usable current official field captured in this pass. |
| `university-of-alabama-at-birmingham-marnix-e-heersink-school-of-medicine` | Not found | No usable current official field captured in this pass. |
| `alice-l-walton-school-of-medicine` | Not found | New institution; do not borrow values from a different Arkansas school. |
| `arizona-state-university-john-shufeldt-school-of-medicine-and-medical-engineering` | Not found | New institution; do not borrow values from another Arizona school. |
| `university-of-arizona-college-of-medicine-phoenix` | Not found | No usable current official cost/deadline/profile field captured. |
| `university-of-arizona-college-of-medicine-tucson` | Not found | No usable current official cost/profile field captured. |
| `california-northstate-university-college-of-medicine` | Not found | No usable current official field captured. |
| `california-university-of-science-and-medicine` | Not found | No usable current official cost/prerequisite field captured. |
| `charles-r-drew-university-of-medicine-and-science-college-of-medicine` | Not found | No usable current official cost/profile field captured. |
| `kaiser-permanente-bernard-j-tyson-school-of-medicine` | Not found | No usable current official cost/profile field captured. |
| `keck-school-of-medicine-of-the-university-of-southern-california` | Not found | No explicit 2026-27 application deadline captured. |
| `stanford-university-school-of-medicine` | Not found | No usable current official cost/profile field captured. |
| `university-of-california-davis-school-of-medicine` | Not found | No usable current official prerequisite/profile field captured. |

## Guardrails

- PNWU’s tuition link is explicit, but its PDF values were not extracted; do not replace a null with a non-visible figure.
- South Alabama’s 2026-27 COA page is official, but the retrieved text did not expose its tuition line; no value is inferred from fee schedules.
- No stale profile statistic was used to fill a current source-cited profile field in this audit.
