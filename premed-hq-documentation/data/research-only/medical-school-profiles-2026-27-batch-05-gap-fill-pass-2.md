# Batch 5 official-source gap-fill, pass 2

Retrieved: 2026-08-14  
Scope: fresh official findings only for fields that remain `not-found` in `medical-school-profiles-2026-27-batch-05-figure-level-v2.json`: cost, prerequisites, then explicitly 2026-27-labelled admission dates. This packet does not modify JSON.

## Rules applied

- Institution-owned admissions and financial-aid pages only.
- Existing Batch 5 audit values are not repeated.
- A standing rule without an explicit cycle is not relabelled as a 2026-27 deadline.

## Fresh recoveries

| Exact dataset id | Field | Newly recovered published value | Status | Official source |
| --- | --- | --- | --- | --- |
| `oakland-university-william-beaumont-school-of-medicine` | 2026-27 tuition | Tuition is $63,636 for the 2026-27 year, with no in-state/out-of-state difference. The school says there are no additional charges for health insurance, technology, parking, or recreation-center access. | Published | [OUWB admissions FAQ](https://www.oakland.edu/medicine/admissions/frequently-asked-questions/index) |
| `wayne-state-university-school-of-medicine` | Secondary fee | Eligible applicants invited to the secondary application pay a non-refundable $100 application fee. The page does not name an application cycle, so it supports the fee field only—not a cycle-labelled deadline. | Published; cycle label unstated | [Wayne State MD secondary application](https://www.med.wayne.edu/admissions/becoming-an-md/portal) |

## Conservative boundaries retained

- The Michigan State College of Human Medicine admissions page identifies a “2027 Admission Cycle” but presents recurring month/day milestones without calendar years. Those are not promoted to 2026-27 deadline fields.
- No generic graduate or undergraduate Michigan State budget is used as an MD-program cost.
- OUWB’s $63,636 is the published annual tuition figure; the source does not split it into separate resident and nonresident values because it expressly says the amount is the same.

