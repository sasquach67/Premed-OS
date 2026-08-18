# Batch 4 official-source gap-fill, pass 3

Retrieved: 2026-08-14  
Scope: fresh recoveries only for Batch 4 fields still marked `not-found` after the audit and second pass: school tuition/COA, admission prerequisites, and dates expressly attached to the 2026-27 cycle. This is a research-only packet; JSON is unchanged.

## Rules applied

- Every recovery comes from the program's own financial-aid, student-business, or admissions page.
- Costs retain the official page's label. Tuition, fees, direct expenses, and total COA are not merged into one number.
- This packet does not repeat information already captured in the Batch 4 audit or pass-2 packet.
- A date is recorded only if the official page expressly ties it to the 2026-27 application cycle.

## Fresh recoveries

| Exact dataset id | Field | Newly recovered published value | Status | Official source |
| --- | --- | --- | --- | --- |
| `university-of-central-florida-college-of-medicine` | 2026-27 first-year MD tuition/fees and COA | Florida resident: tuition and fees $29,680; total direct/upfront expenses $29,835; total estimated COA $58,555. Non-Florida resident: tuition and fees $59,251; total direct/upfront expenses $59,406; total estimated COA $88,126. The page separately identifies $28,720 of indirect costs for either residency group. | Published | [UCF MD 2026-27 cost-of-attendance table](https://med.ucf.edu/media/2026/06/COA-Table-for-Website-26.27-2.pdf) |
| `university-of-florida-college-of-medicine` | 2026-27 first-year MD tuition/fees and COA | The 1MD off-campus budget lists resident tuition/fees of $18,565 in fall and $18,565 in spring, with total cost of $32,054 for each of those terms and $7,504 for summer. The corresponding nonresident tuition/fees are $24,695 in fall and $24,695 in spring, with total cost of $38,184 for each of those terms and $7,504 for summer. | Published by term; no annual total is substituted | [UF College of Medicine 2026-27 cost of attendance](https://finaid.med.ufl.edu/costs/medical-students/2026-2027-cost-of-attendance/) |
| `carle-illinois-college-of-medicine` | Prerequisite/competency requirements | Carle Illinois requires at least 9 of 11 competencies by enrollment, 7 at application, and permits plans to enroll in up to 2 remaining competencies. Published science and quantitative competency requirements include: chemistry (3 semesters/equivalent, general and/or organic, with lab), biochemistry (1), biology (2 with lab), advanced biology (1), physics (2 with lab), statistics (1), calculus (2 at least comparable to Calculus II), multivariate calculus (comparable to Calculus III), differential equations, and linear algebra. The school also publishes humanities/social-science competency guidance. Community-college credit is accepted; AP credit is accepted only when followed by higher-level coursework in the same subject. | Published; competency model | [Carle Illinois before you apply](https://medicine.illinois.edu/admissions/before-you-apply) |

## Boundaries retained

- UCF's direct expenses contain its published tuition/fees plus separately shown parking and disability-insurance amounts. Both figures are retained so a later merge can choose the correct schema treatment without guessing.
- UF's page presents the first-year budget by fall, spring, and summer blocks. This packet preserves those published blocks rather than creating a new annual total.
- No new explicit 2026-27 application deadline was recovered in this pass beyond fields already in the Batch 4 materials. General academic calendar dates, non-MD tuition schedules, and undated admissions guidance remain excluded.
- Carle Illinois' currently published application-deadline page is for the 2026 entering class, and its secondary deadline is individualized in the invitation. Neither supports a 2026-27 application-cycle deadline field, so no date is introduced.
