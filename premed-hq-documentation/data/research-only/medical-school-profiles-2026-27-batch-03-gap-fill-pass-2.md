# Batch 3 official-source gap-fill, pass 2

Retrieved: 2026-08-14  
Scope: fresh, non-duplicative recoveries for fields still marked `not-found` in `medical-school-profiles-2026-27-batch-03-figure-level-v2.json`: 2026-27 cost first, then prerequisites, then explicitly cycle-labelled application dates. This is a research packet only; JSON is unchanged.

## Rules applied

- Sources are institution-owned financial-aid or admissions pages only.
- A cost-of-attendance budget is recorded as a budget, not silently relabelled as tuition.
- Current facts already captured in the Batch 3 audit or JSON are not repeated here.
- Dates are entered only when the source expressly labels the 2026-27 application year.

## Fresh recoveries

| Exact dataset id | Field | Newly recovered published value | Status | Official source |
| --- | --- | --- | --- | --- |
| `west-virginia-school-of-osteopathic-medicine` | 2026-27 first-year DO budget | The official D.O. 2026-27 budget lists a first-year maximum of $63,088 in state and $95,888 out of state. This is a total budget/COA figure, not a tuition-only figure, so it must not overwrite the still-unrecovered tuition fields. | Published as COA; not a tuition substitute | [WVSOM education costs](https://www.wvsom.edu/financial-aid/cost) |
| `university-of-arizona-college-of-medicine-phoenix` | 2026-27 application dates | MD primary deadline: November 16, 2026; secondary application and letters deadline: December 1, 2026; interview season: August 2026 through February 2027. | Published | [Arizona College of Medicine – Phoenix application process](https://phoenixmed.arizona.edu/admissions/application-process) |
| `university-of-arizona-college-of-medicine-tucson` | 2026-27 first-year tuition/fees and total budget | Arizona resident: $43,022 estimated tuition/fees and $80,842 total first-year budget. Nonresident: $63,722 estimated tuition/fees and $101,542 total first-year budget. The page labels these as 2026-27, first-year, 11-month estimates. | Published | [Arizona College of Medicine – Tucson financial aid](https://medicine.arizona.edu/internal-resources/student-affairs/financial-aid) |

## Conservative boundaries retained

- WVSOM’s $63,088/$95,888 figures are not placed in an `inState` or `outOfState` tuition field because the official page calls them first-year budget maximums.
- UIWSOM’s 2026-27 tuition page confirms program cost, but that tuition was already present in the dataset; it does not safely establish an application secondary fee or fee-waiver policy.
- No general university tuition schedule was used for a medical-school record.

