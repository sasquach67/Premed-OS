# Batch 1 official-source gap-fill audit

Retrieved: 2026-08-14  
Scope: only fields currently missing from `medical-school-profiles-2026-27-batch-01-figure-level-v2.json`: first-year tuition, prerequisite wording, and deadlines explicitly tied to the 2026-27 application cycle. This packet is evidence only; it does not modify the dataset.

## Rules applied

- Sources are school-owned pages/catalogs only. No aggregators or community sources were used.
- An application date is reported only when the page identifies the relevant entry/cycle. A tuition-payment date is not substituted for an application deadline.
- “Not found” means this targeted official-source audit did not locate a usable, cycle-labelled value. It does not imply the school has no policy.
- No rate metric is recorded.

## Published values recovered

| Exact dataset id | Field | Published value | Status | Official source |
| --- | --- | --- | --- | --- |
| `california-health-sciences-university-college-of-osteopathic-medicine` | Tuition, OMS-I 2026-27 | $70,700 tuition; $2,600 equipment fee; STRF $0. | Published | [CHSU 2026-27 cost of attendance](https://chsu.edu/consumer-information/) |
| `california-health-sciences-university-college-of-osteopathic-medicine` | Prerequisites | CHSU publishes a subject-hours table and states a bachelor’s/equivalent is required before matriculation; all prerequisites must be at an institution accredited by a U.S.-Department-of-Education-recognized agency. | Published; table should be transcribed directly if JSON is later updated | [CHSU COM admissions requirements](https://catalog.chsu.edu/com-admissions-requirements) |
| `rocky-vista-university-college-of-osteopathic-medicine` | Prerequisites | Biology/Zoology 8 semester hours incl. lab; General Chemistry 8 incl. lab; Organic Chemistry 8 incl. lab; Physics 8 incl. lab; English/Literature 6; Biochemistry 3. | Published | [RVUCOM admissions](https://www.rvu.edu/doctor-of-osteopathic-medicine/rvucom/admissions/) |
| `rocky-vista-university-college-of-osteopathic-medicine` | Tuition | $69,736 for 2025-26. | Published but not usable for a 2026-27 snapshot | [RVUCOM admissions](https://www.rvu.edu/doctor-of-osteopathic-medicine/rvucom/admissions/) |
| `des-moines-university-college-of-osteopathic-medicine` | Tuition, 2026-27 | $68,620 annual tuition for years 1-3. | Published | [DMU tuition and fees](https://www.dmu.edu/financial-aid/tuition-and-fees/) |
| `des-moines-university-college-of-osteopathic-medicine` | Prerequisites | Official program page confirms required coursework must be completed before starting; detailed course list is linked but was not extracted in this pass. | Partially published | [DMU DO program](https://www.dmu.edu/do/) |
| `lake-erie-college-of-osteopathic-medicine-bradenton` | Tuition, OMS-I 2026-27 | Florida resident: $42,395; non-resident: $42,750. | Published | [LECOM Bradenton tuition](https://lecom.edu/college-of-osteopathic-medicine/com-tuition-and-fees/com-bradenton-tuition/) |
| `lake-erie-college-of-osteopathic-medicine-bradenton` | Secondary fee | $50 supplementary application fee. | Published | [LECOM Bradenton tuition](https://lecom.edu/college-of-osteopathic-medicine/com-tuition-and-fees/com-bradenton-tuition/) |
| `philadelphia-college-of-osteopathic-medicine-georgia` | Prerequisites | PCOM applies common DO prerequisites to PCOM, PCOM Georgia, and PCOM South Georgia; degree/prerequisite requirements are stated on the common application page. | Published | [PCOM DO requirements](https://www.pcom.edu/do/apply.html) |
| `philadelphia-college-of-osteopathic-medicine-georgia` | 2026-27 application dates | AACOMAS e-submission/complete by Feb. 1, 2027; verified by Feb. 28, 2027; PCOM fee and materials due Mar. 1, 2027. | Published | [PCOM DO requirements](https://www.pcom.edu/do/apply.html) |
| `philadelphia-college-of-osteopathic-medicine-georgia` | Institutional fee | $75 for PCOM Georgia. | Published | [PCOM DO requirements](https://www.pcom.edu/do/apply.html) |
| `philadelphia-college-of-osteopathic-medicine-south-georgia` | Prerequisites | PCOM applies common DO prerequisites to PCOM, PCOM Georgia, and PCOM South Georgia; degree/prerequisite requirements are stated on the common application page. | Published | [PCOM DO requirements](https://www.pcom.edu/do/apply.html) |
| `philadelphia-college-of-osteopathic-medicine-south-georgia` | 2026-27 application dates | AACOMAS e-submission/complete by Feb. 1, 2027; verified by Feb. 28, 2027; PCOM fee and materials due Mar. 1, 2027. | Published | [PCOM DO requirements](https://www.pcom.edu/do/apply.html) |
| `philadelphia-college-of-osteopathic-medicine-south-georgia` | Institutional fee | $75 for PCOM and/or PCOM South Georgia. | Published | [PCOM DO requirements](https://www.pcom.edu/do/apply.html) |

## Targeted official-source results with no usable fill

| Exact dataset id | Missing-area result | Reason / follow-up source |
| --- | --- | --- |
| `edward-via-college-of-osteopathic-medicine-auburn-campus` | Not found | No current official page captured in this pass with all requested values. Recheck VCOM’s campus-specific tuition and admissions pages. |
| `arizona-college-of-osteopathic-medicine-of-midwestern-university` | Not found | No usable 2026-27 cost/deadline page captured. |
| `the-valley-college-of-osteopathic-medicine` | Not found | Newly developing program; do not substitute parent or regional figures. |
| `western-university-of-health-sciences-college-of-osteopathic-medicine-of-the-pacific` | Not found | No usable 2026-27 cost/prerequisite/deadline page captured. |
| `university-of-northern-colorado-college-of-osteopathic-medicine` | Not found | Newly developing program; no figures should be borrowed from another campus. |
| `burrell-college-of-osteopathic-medicine-florida` | Not found | No usable campus-specific current source captured. |
| `lake-erie-college-of-osteopathic-medicine-at-jacksonville-university` | Not found | No campus-specific current tuition/prerequisite/application-deadline page captured. |
| `lincoln-memorial-university-debusk-college-of-osteopathic-medicine-at-orange-park` | Not found | No campus-specific current source captured. |
| `nova-southeastern-university-dr-kiran-c-patel-college-of-osteopathic-medicine-clearwater` | Not found | No campus-specific current source captured. |
| `orlando-college-of-osteopathic-medicine` | Not found | New school; no current cycle-labelled application deadline captured. |
| `illinois-college-of-osteopathic-medicine` | Not found | Keep distinct from Chicago College of Osteopathic Medicine; do not reuse CCOM’s policy. |
| `marian-university-tom-and-julie-wood-college-of-osteopathic-medicine` | Not found | No usable current cost/prerequisite/deadline source captured. |

## Already-present areas checked but not replaced

The following Batch 1 records already had at least one tuition/prerequisite/deadline source in the merged JSON. They were not rewritten in this audit: Alabama COM; Arkansas COM; NYITCOM at Arkansas State; ATSU-SOMA; Touro California; Nova Southeastern KPCOM; Idaho COM; Kansas COM; University of Pikeville KYCOM; VCOM Louisiana; and Meritus.

## Do not promote without a second official check

- RVU’s published tuition is 2025-26, not 2026-27.
- CHSU’s “deadline” pages located in this pass concern enrolled-student tuition payments, not application completion.
- PCOM’s common application page is explicit that each location has separate evaluation; it is nevertheless the official shared source for PCOM Georgia and PCOM South Georgia prerequisite and deadline rules.
