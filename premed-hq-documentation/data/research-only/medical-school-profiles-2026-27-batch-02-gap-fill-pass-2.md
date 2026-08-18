# Batch 2 official-source gap-fill, pass 2

Retrieved: 2026-08-14  
Scope: a second, non-duplicative search of only fields still marked `not-found` in `medical-school-profiles-2026-27-batch-02-figure-level-v2.json`: first-year tuition/COA and secondary fee first, then prerequisites, then explicitly cycle-labelled 2026-27 application dates. This packet is research-only and does not modify JSON.

## Rules applied

- Sources below are institution-owned admissions, catalog, or financial-aid pages only.
- Tuition due dates, academic calendars, and testing windows are not treated as application deadlines.
- A value is recorded only where the source labels the program and the relevant academic/application cycle.
- Where two official pages conflict, the conflict is retained instead of selecting a deadline.

## Fresh recoveries

| Exact dataset id | Field | Newly recovered published value | Status | Official source |
| --- | --- | --- | --- | --- |
| `lake-erie-college-of-osteopathic-medicine-elmira` | 2026-27 first-year tuition and secondary fee | OMS1 tuition is $44,875 for both New York residents and nonresidents. The LECOM supplementary application fee is $50. The page additionally lists a $500 curriculum fee, $500 technology fee, $300 board-prep fee, and $50 mandatory student-government fee. | Published | [LECOM Elmira tuition and fees](https://lecom.edu/college-of-osteopathic-medicine/com-tuition-and-fees/com-elmira-tuition/) |
| `campbell-university-jerry-m-wallace-school-of-osteopathic-medicine` | 2026-27 first-year COA / tuition / fees | First-year tuition: $61,180; fees: $2,210; displayed first-year total COA: $98,361. The page labels the table “26/27 Academic Year.” | Published | [Campbell CUSOM cost of attendance](https://medicine.campbell.edu/admissions/tuition-financial-aid/cost-of-attendance/) |
| `campbell-university-jerry-m-wallace-school-of-osteopathic-medicine` | Secondary fee and waiver | The secondary requires a $50 application fee; AACOMAS fee waivers are accepted. The source does not attach this fee statement to a named cycle, so it is suitable for the currently missing fee field but not as a cycle-specific deadline. | Published; cycle label unstated | [Campbell DO admissions](https://medicine.campbell.edu/admissions/osteopathic-medicine-admissions/) |
| `new-york-institute-of-technology-college-of-osteopathic-medicine` | 2026-27 secondary fee | Supplemental application fee: $80. | Published | [NYITCOM tuition and fees, 2026-27 catalog](https://catalog.nyit.edu/medicine/financial/tuition_and_fees/) |
| `new-york-institute-of-technology-college-of-osteopathic-medicine` | 2026-27 application-cycle dates | The 2026-27 catalog lists AACOMAS processing beginning May 4, 2026; AACOMAS application deadline March 1, 2027; supplemental deadline March 22, 2027. | Published, but see conflict below | [NYITCOM application procedure, 2026-27 catalog](https://catalog.nyit.edu/medicine/admissions/application_procedure/) |

## Official-source conflict requiring a conservative hold

| Exact dataset id | Field | Evidence | Handling |
| --- | --- | --- | --- |
| `new-york-institute-of-technology-college-of-osteopathic-medicine` | 2026-27 supplemental deadline | The official 2026-27 catalog says March 22, 2027, while the active official 2026-27 supplemental-application portal says March 16, 2027. | Do not choose one deadline for the dataset without direct confirmation from NYITCOM admissions. Preserve both source records and keep the deadline unresolved. [Catalog](https://catalog.nyit.edu/medicine/admissions/application_procedure/) · [Supplemental portal](https://guru.nyit.edu/Admissions/SupplementalApplication.aspx) |

## Remaining conservative boundaries

- This pass did not assign Campbell’s standing March 15 secondary rule to the 2026-27 dataset because the admissions page does not explicitly identify the cycle.
- This pass did not promote LECOM’s academic-calendar dates into application deadlines.
- No general university or undergraduate tuition figures were used for any COM record.

