# Research packet — School List `SL-26`: prerequisite coverage from Academics

**Question.** Given the academic record HQ holds, what prerequisite coverage can it truthfully derive, what remains unknown, and why is a generic prerequisite assertion unsafe across AMCAS, AACOMAS, and TMDSAS?

**Scope.** Evidence only; this packet makes no product, UI, ownership, or implementation ruling. Official sources accessed 2026-08-11.

## Evidence — what an academic record can establish

| Record fact | Official basis | Boundary of that fact |
|---|---|---|
| A course was attempted at an institution, with its transcript title/number, term, credits, and grade. | [AMCAS Coursework](https://students-residents.aamc.org/how-apply-medical-school-amcas/section-4-amcas-application-coursework) requires all attempted U.S./territorial/Canadian postsecondary coursework, including withdrawals, repeats, failures, future work, and work affected by forgiveness policies; it tells applicants to use official transcripts. [TMDSAS Coursework](https://www.tmdsas.com/application-guide/coursework.html) similarly requires attempted coursework entered as it appears on official transcripts, generally at the original granting institution. | This establishes the entered/transcript record, not that a medical school accepts it for a particular requirement. |
| The originating institution matters, including transfer and community-college work. | [AMCAS Transcripts FAQ](https://students-residents.aamc.org/applying-medical-school/faq/amcas-faq?topic=transcripts) requires an originating-institution transcript even when transfer credit appears at the home school. [AACOM application process](https://www.aacom.org/become-a-doctor/apply-to-medical-school/the-application-process) likewise says transfer credit on another transcript does not substitute for the original transcript. | A home-school course list alone can be incomplete for application-service reporting. |
| An application service can verify entered coursework against official transcript material and apply its own classification/GPA rules. | [AMCAS Verification](https://students-residents.aamc.org/applying-medical-school-amcas/publication-chapters/verification) describes line-by-line comparison and AMCAS-calculated GPA. [AACOMAS Verification](https://help.liaisonedu.com/AACOMAS_Applicant_Help_Center/Submitting_and_Monitoring_Your_AACOMAS_Application/Verification_and_GPA_Calculations_for_AACOMAS/1_What_is_Verification%3F) standardizes coursework, assigns subject categories, converts grades, calculates GPAs, and confirms degrees. [TMDSAS Coursework](https://www.tmdsas.com/application-guide/coursework.html) says TMDSAS reviews/corrects course areas. | Service verification/classification is not a school-specific prerequisite determination. |
| A dated list of student-entered school requirements can be compared to courses the student entered, when the requirement has enough structured detail (for example, required area/hours and stated policy). | This is a direct comparison of two supplied record sets; it does not depend on HQ sourcing admissions figures. The School List board itself identifies this as a record fact, while distinguishing it from a competitiveness judgment ([`08-school-list-board.md` §5b, SL-26](../../tabs/08-school-list-board.md#5b-wave-4--unruled-over-generated-aug-2026-on-what-else-is-worth-considering)). | The comparison is only as complete and current as the student-entered requirement, course data, and explicit mapping evidence. |

## Evidence — why a generic “meets prerequisite” claim is unsafe

- **AMCAS:** Course classification reflects primary course content rather than a universal prerequisite-equivalency system; applicants must use each school’s site or MSAR for school policies. See [AMCAS coursework details](https://students-residents.aamc.org/applying-medical-school-amcas/publication-chapters/coursework-details) and [AMCAS after-submission FAQ](https://students-residents.aamc.org/applying-medical-school/faq/amcas-faq?topic=after-submission).
- **AACOMAS:** Subject categories use transcript titles and department prefixes; AACOMAS does not use a course description or letter to override a plainly listed category. See [AACOMAS subject-category disputes](https://help.liaisonedu.com/AACOMAS_Applicant_Help_Center/Submitting_and_Monitoring_Your_AACOMAS_Application/Verification_and_GPA_Calculations_for_AACOMAS/7_Disputing_and_Correcting_Course_Subjects_and_GPAs). AACOM says school requirements can change and directs applicants to each college site/contact for current requirements ([application process](https://www.aacom.org/become-a-doctor/apply-to-medical-school/the-application-process)).
- **TMDSAS:** Its post-transmission Prescribed Coursework Report identifies deficiencies in listed areas but says that a deficiency does not stop processing, review, or interviewing; it also states that some subjects are not general prerequisites for all schools and tells applicants to check individual programs for additional requirements. AP credit is accepted only under stated transcript conditions, and some partner schools do not accept AP/IB ([TMDSAS Coursework](https://www.tmdsas.com/application-guide/coursework.html)).

## Repository evidence

- `Course` currently holds course code, title, credits, letter grade, status, `inResidence`, freeform `satisfies`, and optional `prereqOf`; it does **not** model originating institution, official-transcript provenance, AP/IB score, transcript-verbatim name distinct from display name, or an authoritative per-school equivalency decision ([`src/lib/types.ts`](../../../src/lib/types.ts)).
- The existing UNC reference dataset offers a **medium-confidence**, typical-UNC-course map for common prerequisite areas, and explicitly says requirements vary by school ([`data/unc-requirements.json`](../../data/unc-requirements.json)). It can support a UNC planning comparison but is not per-program acceptance data.
- The 240-school roster deliberately has no shipped per-school prerequisite data: every record has an empty `prereqs` array, while `prereqNotes` is a generic disclaimer. Its metadata records that prerequisite policies are intentionally empty/student-entered and flags the disclaimer as a placeholder defect ([`data/med-schools.json`](../../data/med-schools.json)).
- The Academics requirements artifact requires transcript-exact prior-credit presentation and labels requirement-set confidence rather than hiding it ([`academics-requirements.md`](../../specifications/mockups/01-academics/academics-requirements.md)).

## Inferences supported by the evidence

1. A truthful derived result can identify record presence/absence or an explicit comparison result: for example, that a course record exists, that no course has been mapped to a student-entered requirement, or that the available mapping is incomplete/uncertain.
2. A truthful result cannot promote an Academics tag, service subject category, or common/UNC course map into a claim that a named school will accept the course, AP/IB/transfer credit, online work, credit-hours total, sequencing, or completion timing.
3. “Planned” and “in-progress” are scheduling facts, not completed/transcript-verified coursework. The official services also distinguish entered coursework from later verification or validation.

## Explicit non-findings

- No source found that creates a single AMCAS/AACOMAS/TMDSAS prerequisite-equivalency standard for all medical schools.
- No source found that lets an application-service course category alone certify a school’s prerequisite fulfillment.
- No verified per-school prerequisite, AP/IB, community-college, online-course, grade, or expiration-policy dataset is currently present in the repository.
- This research does not establish a refresh cadence, schema, status vocabulary, UI wording, or which academic fields should be created or edited.
