# Batch 8 official-source gap-fill, pass 2

Retrieved: 2026-08-14  
Scope: fresh official-source recovery only for Batch 8 fields remaining `not-found`: 2026-27 tuition/COA, prerequisites, and explicitly labelled application-cycle dates. JSON is unchanged.

## Rules applied

- Institution-owned MD financial-aid and admissions pages only.
- Existing Batch 8 audit findings are not repeated.
- Distinguish no required prerequisite courses from merely recommended courses.

## Fresh recoveries

| Exact dataset id | Field | Newly recovered published value | Status | Official source |
| --- | --- | --- | --- | --- |
| `university-of-virginia-school-of-medicine` | 2026-27 first-year tuition/fees and total COA | For Med 1 in Charlottesville, tuition and fees are $56,700 in state and $71,046 out of state. The stated 10-month total COA is $88,454 for Virginia residents and $102,800 for nonresidents. | Published | [UVA MD costs](https://med.virginia.edu/md-program/financial-aid/financing-costs/) |
| `university-of-virginia-school-of-medicine` | Prerequisite policy and dates | UVA states no prerequisite courses and no science or humanities requirement; it recommends Cell Biology, Biochemistry, Human Behavior, and Statistics. The page lists interviews beginning September 8, 2026 and a November 1 primary deadline; however, it does not title the full schedule as a 2026-27 cycle, so dates should remain source-qualified before loading into cycle-labelled fields. | Published; dates not cycle-titled | [UVA MD admissions process](https://med.virginia.edu/md-program/admissions/admissions-to-uva-school-of-medicine/) |
| `vanderbilt-university-school-of-medicine` | 2026-27 application dates | For the 2026-2027 admissions cycle: AMCAS submission May 30–November 1; secondary due by November 15; virtual interviews September–February; latest MCAT September 2026. | Published | [Vanderbilt MD admissions process](https://medschool.vanderbilt.edu/md/admissions/process/) |

## Conservative boundaries retained

- UVA’s primary date is published on a current admissions page but the schedule lacks a formal cycle heading; it is not presented as a resolved 2026-27 deadline record.
- Vanderbilt’s timing is cycle-labelled, but no cost value from its cost page is transcribed because the retrieved excerpt did not expose the relevant numeric table.
- No non-MD program rates were used.

