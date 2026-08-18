# Tuition / COA sweep 01 — official medical-school sources

Research preparation only. This packet does not modify the canonical corpus. It covers the first 25 canonical rows whose `tuition.inState` or `tuition.outOfState` is null, in corpus order. **Tuition** is an institutional charge; **COA** also includes the financial-aid living/indirect-cost allowance. Never import a parent undergraduate budget.

Checked 2026-08-14. Capture only an explicit academic year. A prior-cycle page is flagged rather than silently relabelled.

## Verified, official medical-school values

| Canonical ID | Medical-school / campus grain | Cycle | Tuition or direct charges | Full COA | Official source | Safe-use note |
|---|---|---|---|---|---|---|
| `a-t-still-university-school-of-osteopathic-medicine-in-arizona` | ATSU-SOMA, Mesa, DO | 2026–27 | $71,750 tuition + $1,484 technology + $1,000 medical equipment (M1); COA table gives $74,234 tuition/fees | $112,684, M1/class of 2030, 10 months | [ATSU financial aid](https://www.atsu.edu/student-affairs/enrollment-services/federal-direct-student-loans) | Private/common rate; source does not state an IS/OOS split. |
| `albany-medical-college` | AMC, MD | 2026–27 guide exists | — | — | [AMC 2026–27 guide PDF](https://www.amc.edu/wp-content/uploads/sites/3/2026/01/AMC-26-27-Student-FA-Guide_1.7.26.pdf) | Do not ingest until the PDF table is inspected; public HTML cost page is 2024–25. |
| `alice-l-walton-school-of-medicine` | Alice L. Walton, MD | current | $69,650 tuition + $2,360 fees + $4,710 insurance; first five cohorts have a stated tuition waiver of $74,264 | $38,181, M1/11 months | [ALW cost of attendance](https://www.alwmedschool.org/admissions/cost-of-attendance) | Private/common rate. Preserve the waiver separately; do not report nominal tuition as student cost. |
| `arizona-college-of-osteopathic-medicine-of-midwestern-university` | AZCOM, Glendale, DO | 2026–27 | $82,672 annual tuition + $1,500 student-services fee; $675 first-year diagnostic kit | — | [AZCOM financial services catalog](https://catalog.az.midwestern.edu/student-financial-services) | Private/common rate; no full COA captured. |
| `arizona-state-university-john-shufeldt-school-of-medicine-and-medical-engineering` | ASU School of Medicine, MD | — | — | — | [ASU admissions](https://medicine.asu.edu/future-students/admissions) | No official tuition/COA page located; new program. Keep unresolved, do not infer a price. |
| `arkansas-college-of-osteopathic-medicine` | ARCOM, Fort Smith, DO | 2026–27 | $60,500 IS and OOS tuition; $665 annual fees; $4,470 health insurance | — | [ARCOM official COA hub](https://achehealth.edu/cost-of-attendance/) | A school-published DO PDF is linked from the official hub; retain its campus/cycle when importing full COA. |
| `baylor-college-of-medicine` | BCM, Houston, MD | 2026–27 | Nonresident M1 tuition $32,782.50; nonresident total direct charges $44,630.85 | M1: $65,462.85 Texas resident; $78,784.85 non-Texas | [BCM MD tuition and fees](https://www.bcm.edu/education/school-of-medicine/m-d-program/tuition-and-fees) | School/campus-specific. |
| `boston-university-aram-v-chobanian-edward-avedisian-school-of-medicine` | BU Chobanian & Avedisian, MD | 2026–27 | M1 tuition $74,078 | $103,677, M1/10 months | [BU MD COA](https://www.bumc.bu.edu/osfs/cost-of-attendance-bot/camed-coa/) | Use detailed MD table; private/common rate. |
| `brody-school-of-medicine-at-east-carolina-university` | Brody/ECU, MD | Fall 2026 term | $11,488.50 tuition + fees = $13,094.80 for full-time 9+ credits | — | [ECU Brody Fall 2026 fees](https://financialservices.ecu.edu/bsom-tuition-and-fees-fall-2026/) | This is term-level, not annual. Official medical-school FA COA page is still 2024–25. |
| `burrell-college-of-osteopathic-medicine` | Burrell COM, DO; Las Cruces or Melbourne | 2026–27 | $70,622 tuition; $1,975 Las Cruces fees / $3,657 Melbourne fees | — | [Burrell budgeting page](https://burrell.edu/students/budgeting-your-education/) | Keep campus-specific; do not collapse two campuses. |
| `california-northstate-university-college-of-medicine` | CNU COM, MD | 2026–27 PDFs | — | — | [CNU COM financial aid](https://www.cnsu.edu/financial-aid/com/) | Current tuition PDFs are official but values were not reliably extracted; inspect PDF before ingesting. |
| `california-university-of-science-and-medicine` | CUSM, MD | 2025–26 only | $70,000 tuition; $79,982 direct incl. fees/insurance | — | [CUSM tuition](https://cusm.edu/student/student-business-services/tuition-and-fees.php) | Prior cycle only; leave 2026–27 null pending current publication. |
| `case-western-reserve-university-school-of-medicine` | CWRU SOM, MD University Program | 2026–27 | $72,526 tuition; $74,542 listed direct educational costs | $115,226, M1/class of 2030, 11.25 months | [CWRU MD COA](https://case.edu/medicine/students/financial-aid/cost-attendance) | MD-specific, private/common rate. |
| `central-michigan-university-college-of-medicine` | Covenant HealthCare COM at CMU, MD | 2025–26 | $47,710 IS / $70,793 OOS tuition | $75,295 IS / $99,363 OOS | [CMU medical COA](https://www.cmich.edu/academics/colleges/college-of-medicine/education/md/admissions/prospective/cost/) | Medical-specific but prior cycle; recheck before 2026–27 ingestion. |
| `charles-e-schmidt-college-of-medicine-at-florida-atlantic-university` | FAU Schmidt COM, MD | 2026–27 | M1 tuition $28,111 resident / $67,696 nonresident | M1 on-campus COA $60,758 resident / $105,394 nonresident | [FAU COM COA](https://www.fau.edu/medicine/students/financial-aid/cost/) | Use the M1 tuition line, not “estimated direct cost” (which includes fees). |
| `cooper-medical-school-of-rowan-university` | CMSRU, MD | 2026–27 | $50,680 NJ / $78,086 nonresident tuition | $86,799 NJ / $114,205 nonresident, M1 | [CMSRU COA](https://cmsru.rowan.edu/admissions/financial-aid-services/cost-of-attendance.html) | Finalized medical-school M1 COA. |
| `creighton-university-school-of-medicine` | Creighton MD | 2026–27 | $70,094 M1 tuition | $121,134 M1, 10 months | [Creighton MD costs](https://www.creighton.edu/cost-aid/find-costs/doctor-medicine-md-costs) | Confirm campus-specific applicability if the corpus distinguishes campuses. |
| `d-youville-university-college-of-osteopathic-medicine` | D’Youville COM, DO | 2026–27 | $55,000 tuition; $5,600 comprehensive services fees; displayed $62,150 also includes a $1,500 seat deposit | — | [D’Youville tuition](https://www.dyu.edu/cost-aid/tuition-fees) | Do not store the $62,150 total as tuition. |

## First-25 audit ledger

`pending` means a medical-school financial-aid/bursar target exists but was not verified in this pass; it is **not** evidence that the field is not published.

| # | Canonical ID | Status |
|---:|---|---|
| 1 | `a-t-still-university-school-of-osteopathic-medicine-in-arizona` | values captured |
| 2 | `albany-medical-college` | current official PDF needs table inspection |
| 3 | `alice-l-walton-school-of-medicine` | values captured |
| 4 | `arizona-college-of-osteopathic-medicine-of-midwestern-university` | tuition captured; COA pending |
| 5 | `arizona-state-university-john-shufeldt-school-of-medicine-and-medical-engineering` | pending/new program |
| 6 | `arkansas-college-of-osteopathic-medicine` | tuition captured; COA PDF pending inspection |
| 7 | `baylor-college-of-medicine` | values captured |
| 8 | `boston-university-aram-v-chobanian-edward-avedisian-school-of-medicine` | values captured |
| 9 | `brody-school-of-medicine-at-east-carolina-university` | term charge only; annual current COA pending |
| 10 | `burrell-college-of-osteopathic-medicine` | tuition captured; campus COA total pending |
| 11 | `california-northstate-university-college-of-medicine` | current official PDF needs table inspection |
| 12 | `california-university-of-science-and-medicine` | prior cycle only |
| 13 | `campbell-university-jerry-m-wallace-school-of-osteopathic-medicine` | pending |
| 14 | `carle-illinois-college-of-medicine` | pending |
| 15 | `case-western-reserve-university-school-of-medicine` | values captured |
| 16 | `central-michigan-university-college-of-medicine` | prior cycle only |
| 17 | `charles-e-schmidt-college-of-medicine-at-florida-atlantic-university` | values captured |
| 18 | `charles-r-drew-university-of-medicine-and-science-college-of-medicine` | pending |
| 19 | `columbia-university-vagelos-college-of-physicians-and-surgeons` | pending |
| 20 | `cooper-medical-school-of-rowan-university` | values captured |
| 21 | `creighton-university-school-of-medicine` | values captured |
| 22 | `cuny-school-of-medicine` | pending |
| 23 | `d-youville-university-college-of-osteopathic-medicine` | tuition captured; COA pending |
| 24 | `dell-medical-school-at-the-university-of-texas-at-austin` | pending |
| 25 | `donald-and-barbara-zucker-school-of-medicine-at-hofstra-northwell` | pending |

## Import rules derived from the sweep

1. The present schema’s `inState` and `outOfState` appear to describe annual tuition, not COA. Do not substitute COA for tuition.
2. A private school’s single published rate may be copied to both residency fields only after an explicit schema-normalization ruling; absence of an IS/OOS split is not an error.
3. Preserve exact cycle, medical-school campus, and M1/year context. Do not use a university-wide graduate or undergraduate page.
4. Recheck every prior-cycle entry before it moves into the 2026–27 corpus.
