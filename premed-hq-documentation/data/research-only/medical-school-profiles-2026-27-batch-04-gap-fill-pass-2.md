# Batch 4 official-source gap-fill, pass 2

Retrieved: 2026-08-14  
Scope: new recoveries only for fields still marked `not-found` in `medical-school-profiles-2026-27-batch-04-figure-level-v2.json`: 2026-27 tuition/COA, prerequisites, and explicitly labelled application-cycle dates. This packet does not modify JSON.

## Rules applied

- Each source is institution-owned and program-specific.
- A published COA is preserved as COA; it is not relabelled as tuition.
- Existing Batch 4 audit findings are not repeated.
- Dates without an explicit 2026-27 label are not promoted to a cycle-specific field.

## Fresh recoveries

| Exact dataset id | Field | Newly recovered published value | Status | Official source |
| --- | --- | --- | --- | --- |
| `university-of-south-florida-health-morsani-college-of-medicine` | 2026-27 first-year tuition/fees and COA | For Core Year 1, Class of 2030: Florida-resident tuition and fees $33,694, total COA $68,962; non-Florida-resident tuition and fees $60,500, total COA $95,768. The table is expressly labelled 2026-2027. | Published | [USF Morsani MD cost of attendance](https://health.usf.edu/financial-aid/md-program/cost-of-attendance) |
| `university-of-south-florida-health-morsani-college-of-medicine` | 2026-27 application dates and secondary fee | AMCAS deadline January 15, 2027; secondary deadline January 31, 2027; a completed secondary includes a non-refundable $30 application fee. | Published | [USF Morsani MD application process](https://health.usf.edu/medicine/mdprogram/mdadmissions/process) |
| `university-of-colorado-school-of-medicine` | Admissions prerequisite model and fee-waiver policy | Colorado does not publish a fixed course-count prerequisite checklist. It requires applicants to demonstrate competencies in life sciences, social sciences, physics, and mathematics, which may be met through coursework or educational, employment, service, or life experience. The secondary fee is waived for FAP-eligible applicants. | Published; competency-based rather than a normalized course checklist | [Colorado MD admission requirements](https://medschool.cuanschutz.edu/education/md-admissions/requirements) |

## Conservative boundaries retained

- USF’s second source gives dated admissions fields but does not state an interview season, so none is inferred.
- Colorado’s secondary due-by-November-30 wording is not represented as a 2026-27 deadline because the page does not label that rule to a cycle.
- Colorado’s financial-aid page directs students to current Class of 2029 cost material but does not expose numeric MD costs in the reviewed text; no cost figure is added.

