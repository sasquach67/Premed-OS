# Batch 3 official-source gap-fill, pass 3

Retrieved: 2026-08-14  
Scope: new recoveries only for fields still marked `not-found` after Batch 3's first two audits. This packet checks 2026-27 school costs first, then prerequisite requirements and explicitly cycle-labelled dates. It is research-only; no JSON was changed.

## Rules applied

- Sources are institution-owned admissions, student-business, or university-catalog pages.
- A published charge is described by the label used by the school. Components are not added together or silently converted into a different cost field.
- A recommendation is not converted into a prerequisite.
- This pass records only information not already captured in the Batch 3 JSON, audit, or pass-2 packet.

## Fresh recoveries

| Exact dataset id | Field | Newly recovered published value | Status | Official source |
| --- | --- | --- | --- | --- |
| `sam-houston-state-university-college-of-osteopathic-medicine` | 2026-27 annual published charges | The Osteopathic Medical Students schedule lists a **program fee** of $19,950 for Texas residents and $21,950 for nonresidents, plus **statutory tuition** of $6,550 for residents and $19,650 for nonresidents. Insurance is listed separately at $2,333 for each residency group. These are annual listed components; they are not combined here into a substitute total. | Published; component-level | [SHSU graduate and professional tuition schedule](https://catalog.shsu.edu/graduate-and-professional/financial-information/tuition-fees/) |
| `california-university-of-science-and-medicine` | 2026-27 MD tuition and required-school charges | The MD table lists $72,100 annual tuition, $200 registration fee, and $4,500 MD general fee. It lists health insurance separately at $5,771 and labels the table values estimates subject to change. The school does not differentiate resident and nonresident pricing on this table. | Published; one non-residency-specific price | [CUSM 2026-27 tuition and fees](https://www.cusm.edu/student/student-business-services/tuition-and-fees.php) |
| `california-university-of-science-and-medicine` | Prerequisite policy | CUSM states that it **does not have specific course requirements**. It recommends background in biology, chemistry and physics, mathematics, behavioral and social sciences, communication, and laboratory or field experiments. This is a no-required-course policy, not a checklist of mandatory prerequisites. | Published | [CUSM requirements for admission](https://cusm.edu/academics/md/requirements-for-admission/index.php) |
| `california-university-of-science-and-medicine` | Committee-letter policy | If a Pre-Health Advisory Committee letter of evaluation is available, CUSM says it may replace the other-letter requirement. | Published | [CUSM requirements for admission](https://cusm.edu/academics/md/requirements-for-admission/index.php) |

## Boundaries retained

- SHSU's schedule identifies the tuition and program-fee components but does not publish a single field labeled as a total first-year tuition price. The components should not be summed without an explicit dataset policy.
- CUSM's table does not divide the MD price by residency, so it cannot support separate resident and nonresident figures.
- No new 2026-27 application deadline is repeated here: CUSM's timeline had already been captured in the merged Batch 3 record, and no new explicit cycle-labelled deadline was recovered for the other targeted records in this pass.
- No general undergraduate, graduate, or system-wide price was used for a medical-school entry unless the official table explicitly identified osteopathic medical students or the MD program.
