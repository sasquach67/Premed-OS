# Batch 1 official-source gap-fill pass 2

**Retrieved:** 2026-08-14  
**Scope:** only Batch 1 fields still marked `not-found` after the first audit: tuition/COA, prerequisites, and dates expressly tied to the 2026–2027 cycle.  
**Source rule:** school-controlled financial-aid, bursar, admissions, catalog, and PDF pages only. This packet records only new recoveries and does **not** alter the merged JSON.

## New recoveries

### `lake-erie-college-of-osteopathic-medicine-at-jacksonville-university`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| OMS-I tuition | **$44,000** for Florida residents and non-residents. The page also lists $500 curriculum fee, $500 technology fee, $300 board-prep fee, and $50 mandatory student-government fee. | published; explicitly 2026–2027 | [LECOM at Jacksonville tuition and fees](https://lecom.edu/college-of-osteopathic-medicine/com-tuition-and-fees/lecom-at-jacksonville-tuition-and-fees/) |
| Supplementary-application fee | **$50** nonrefundable LECOM supplementary fee. | published; explicitly 2026–2027 | [LECOM at Jacksonville tuition and fees](https://lecom.edu/college-of-osteopathic-medicine/com-tuition-and-fees/lecom-at-jacksonville-tuition-and-fees/) |

### `burrell-college-of-osteopathic-medicine-florida`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| First-year tuition / total COA | Melbourne, Florida 2026–2027: **$70,622 tuition**, **$3,657 student-activity fees**, and **$113,175 total cost of attendance** for the first year. | published; explicitly 2026–2027 | [Burrell Florida 2026–2027 tuition and COA PDF](https://burrell.edu/wp-content/uploads/2026/03/05.b-FAM-FL-Campus-Tuition-and-Cost-of-Attendance-2026-2027-1-1-1.pdf) |
| Prerequisite source | Burrell’s official admissions page says the listed requirements apply consistently across New Mexico and Florida campuses and includes a course-requirement table; it includes six English credit hours among the published requirements. | source found; transcribe the full table from the page before replacing a structured prerequisite record | [Burrell DO admission requirements](https://burrell.edu/prospective-students/admission-requirements/) |

### `western-university-of-health-sciences-college-of-osteopathic-medicine-of-the-pacific`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Application dates | For **Fall 2027**, AACOMAS primary opens **May 4, 2026**, primary closes **March 1, 2027**, and secondary closes **March 15, 2027**. | published; cycle explicitly identified as Fall 2027 | [WesternU COMP application process](https://www.westernu.edu/osteopathic/programs/doctor-of-osteopathic-medicine/apply-now/) |

### `kansas-college-of-osteopathic-medicine`

| Field | Exact official finding | Status | Source |
|---|---|---|---|
| Secondary-application fee | **$60**. | published; explicitly 2026–2027 tuition-and-fee schedule | [KansasCOM tuition and fees](https://www.kansascity.edu/admissions/financial-aid/tuition/com) |

## Still not safely filled in this pass

No additional new value was captured that safely resolves the remaining Batch 1 fields for VCOM Auburn, AZCOM, The Valley COM, CCOM/Illinois COM, Marian COM, Nova/clearwater campus distinctions, or the remaining campus-specific fee-waiver fields. Those records remain `not-found` rather than borrowing data from sibling campuses or older cycles.

## Guardrails

- The LECOM Jacksonville figures are campus-specific. Do not substitute Bradenton, Erie, Seton Hill, or Elmira schedules.
- Burrell’s Florida figures are Melbourne-campus figures. Its admissions page expressly covers both the Florida and New Mexico campuses, but cost figures are campus-specific.
- WesternU’s dates are for COMP and WesternU HCOM’s Fall 2027 application process. Keep any later merge scoped to the exact COMP record.
- KansasCOM’s recovered value is its institutional secondary fee; no fee-waiver policy was stated on the cited page.
