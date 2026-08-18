# Batch 2 official-source gap-fill audit

Retrieved: 2026-08-14  
Scope: fields marked missing in `medical-school-profiles-2026-27-batch-02-figure-level-v2.json`. Priority: 2026-27 tuition/COA, prerequisites, explicitly labelled application-cycle deadlines, then class-profile MCAT/GPA. This is a research packet only; it does not change JSON.

## Rules applied

- Only institution-owned admissions, catalog, financial-aid, or bursar sources are used.
- A tuition due date is not treated as an admissions deadline.
- A figure is not copied from one location to another unless the school explicitly publishes it as program-wide.
- “Not found” means no usable official field was located in this targeted pass—not that no rule exists.

## Published values recovered

| Exact dataset id | Field | Published value | Status | Official source |
| --- | --- | --- | --- | --- |
| `university-of-new-england-college-of-osteopathic-medicine` | 2026-27 application deadline | AACOMAS verified application deadline: Feb. 1, 2027; program starts summer 2027. | Published | [UNE COM criteria and procedures](https://www.une.edu/com/admissions/criteria-procedures) |
| `university-of-new-england-college-of-osteopathic-medicine` | Prerequisites | Biology 8 semester/12 quarter credits with labs; inorganic chemistry 8/12 with labs; physics 8/12 with labs; organic chemistry 4/6 with lab; biochemistry 3/4 no lab; English/humanities 6/9. | Published | [UNE COM criteria and procedures](https://www.une.edu/com/admissions/criteria-procedures) |
| `a-t-still-university-kirksville-college-of-osteopathic-medicine` | Tuition, 2026-27 Class of 2030 year 1 | $68,960 tuition; $1,484 technology fee; $1,200 medical equipment fee. | Published | [ATSU tuition](https://www.atsu.edu/tuition) |
| `new-york-institute-of-technology-college-of-osteopathic-medicine` | Tuition, 2026-27 first year | $70,720 tuition; $72,449 total mandatory listed tuition/fees for Class of 2030 first year. | Published | [NYITCOM tuition and fees](https://catalog.nyit.edu/medicine/financial/tuition_and_fees/) |
| `new-york-institute-of-technology-college-of-osteopathic-medicine` | Prerequisites | English 6 semester hours; Biology lecture/lab 8; General Chemistry lecture/lab 8; Organic Chemistry I lecture/lab 4; Organic Chemistry II lecture/lab 4 (or Biochemistry 4, with or without lab); Physics lecture/lab 8. | Published | [NYITCOM admissions, 2026-27 catalog](https://catalog.nyit.edu/medicine/admissions/) |
| `touro-university-nevada-college-of-osteopathic-medicine` | Tuition/COA, 2026-27 first year | $72,080 tuition; $720 fees; $72,800 total institutional expenses; $107,609 full displayed COA. | Published | [Touro Nevada DO tuition and fees](https://tun.touro.edu/programs/osteopathic-medicine/do-tuition-fees/) |
| `touro-university-nevada-college-of-osteopathic-medicine` | Cycle evidence | Page explicitly labels January 2027 as the last MCAT test month for the 2026-27 application cycle. This is not a primary/secondary deadline. | Published, not an application deadline | [Touro Nevada admission requirements](https://tun.touro.edu/programs/osteopathic-medicine/-do-application--requirements/) |
| `touro-college-of-osteopathic-medicine` | Tuition/COA, 2026-27 Harlem | $72,080 tuition + $200 fees = $72,280 annual tuition/fees; displayed total COA $115,026 for Class of 2030 Harlem. | Published | [TouroCOM tuition](https://tourocom.touro.edu/admissions--aid/tuition/) |
| `touro-college-of-osteopathic-medicine-middletown` | Tuition | The cited official page publishes a DO program tuition total but its detailed COA section is specifically labelled Harlem. Do not assign Harlem COA to Middletown. | Not applicable for campus-specific COA | [TouroCOM tuition](https://tourocom.touro.edu/admissions--aid/tuition/) |
| `touro-college-of-osteopathic-medicine` | Cycle test requirement | Casper must be taken during the application cycle; the page gives the Fall 2027 admission test window. | Published; not a deadline | [TouroCOM admission requirements](https://tourocom.touro.edu/admissions--aid/do-admissions/admission-requirements/) |
| `ohio-university-heritage-college-of-osteopathic-medicine` | 2026-27 tuition and technology fees | Per semester for 9+ credits: Ohio resident $21,402; out-of-state $33,332; comprehensive SIS/network fee $33; medical learning-resource fee $663. | Published | [Ohio University medical tuition](https://www.ohio.edu/bursar/medical-tuition) |
| `ohio-university-heritage-college-of-osteopathic-medicine-cleveland` | 2026-27 tuition and technology fees | Same College of Medicine bursar schedule is published program-wide; no campus-specific split is listed. | Published program-wide | [Ohio University medical tuition](https://www.ohio.edu/bursar/medical-tuition) |
| `ohio-university-heritage-college-of-osteopathic-medicine-dublin` | 2026-27 tuition and technology fees | Same College of Medicine bursar schedule is published program-wide; no campus-specific split is listed. | Published program-wide | [Ohio University medical tuition](https://www.ohio.edu/bursar/medical-tuition) |
| `ohio-university-heritage-college-of-osteopathic-medicine` | Profile, entering 2025 | Average MCAT 503.46; overall GPA 3.68; science GPA 3.60; class size 262; 6.5% out of state. | Published; older than target class | [Ohio Heritage admissions FAQ](https://www.ohio.edu/medicine/med-admissions) |

## Targeted official results without a safe fill

| Exact dataset id | Status | Reason |
| --- | --- | --- |
| `michigan-state-university-college-of-osteopathic-medicine` | Not found | No COM-specific 2026-27 tuition/prerequisite/deadline page captured; do not use general MSU tuition. |
| `michigan-state-university-college-of-osteopathic-medicine-clinton-township` | Not found | Do not create a campus split from MSUCOM-wide data. |
| `michigan-state-university-college-of-osteopathic-medicine-detroit` | Not found | Do not create a campus split from MSUCOM-wide data. |
| `kansas-city-university-college-of-osteopathic-medicine-joplin` | Not found | No campus-specific value captured; do not copy Kansas City campus fields. |
| `william-carey-university-college-of-osteopathic-medicine` | Not found | No usable current official field captured. |
| `montana-college-of-osteopathic-medicine` | Not found | New program; no values should be borrowed. |
| `touro-university-montana-college-of-osteopathic-medicine` | Not found | New program; no values should be borrowed. |
| `campbell-university-jerry-m-wallace-school-of-osteopathic-medicine` | Not found | No usable current official field captured. |
| `rowan-virtua-school-of-osteopathic-medicine` | Not found | Rowan search result located Cooper Medical School, which is a distinct MD school; it was excluded. |
| `rowan-virtua-school-of-osteopathic-medicine-sewell-campus` | Not found | Do not copy figures from the Stratford or Cooper program. |
| `burrell-college-of-osteopathic-medicine` | Not found | No usable current official field captured. |
| `d-youville-university-college-of-osteopathic-medicine` | Not found | No usable current official field captured. |
| `lake-erie-college-of-osteopathic-medicine-elmira` | Not found | No current Elmira-specific official field captured. |
| `xavier-university-college-of-osteopathic-medicine` | Not found | New program; no values should be borrowed. |
| `oklahoma-state-university-center-for-health-sciences-college-of-osteopathic-medicine-tahlequah` | Not found | Only 2025-26 general catalog material located; not promoted to target cycle. |
| `oklahoma-state-university-college-of-osteopathic-medicine` | Not found | Only 2025-26 general catalog material located; not promoted to target cycle. |
| `western-university-of-health-sciences-college-of-osteopathic-medicine-of-the-pacific-north` | Not found | No usable campus-specific current official field captured. |
| `duquesne-university-nasuti-college-of-osteopathic-medicine` | Not found | New program; no values should be borrowed. |
| `indiana-university-of-pennsylvania-college-of-osteopathic-medicine` | Not found | New program; no values should be borrowed. |
| `lake-erie-college-of-osteopathic-medicine` | Not found | No Erie-specific current official field captured in this pass. |

## Exclusions and handling notes

- UNE’s tuition is linked from its official FAQ, but an exact 2026-27 COM amount was not captured; no undergraduate tuition was substituted.
- The TouroCOM amount is usable as published program tuition. Its detailed COA sample is Harlem-specific, so it must not be applied to Middletown.
- Ohio University’s bursar schedule is published for the College of Medicine; the three Heritage sites are given the same published program-wide schedule, with no invented campus breakdown.
- No cycle-labelled admissions deadline was located for records listed “Not found”; payment schedules and test-validity windows are deliberately not relabeled as application deadlines.
