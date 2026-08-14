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

---

## Aug. 2026 extension — 25-school official-source vocabulary audit

**Purpose.** The earlier packet established the boundary. This extension supplies the requested minimum 25-school sample for naming a controlled vocabulary. It records category language and variation; it does **not** create an equivalency crosswalk, claim a student's course fulfills a school requirement, or authorize importing per-school policy into the app.

**Accessed:** 2026-08-13. **Coverage:** 13 MD programs and 12 DO programs, across multiple regions. Pages are linked to the owning school. The ECU bulletin is historical and is included only for category variation, never as a current policy source.

| # | School / program | What its official page contributes to the vocabulary |
|---:|---|---|
| 1 | [Tufts MD](https://medicine.tufts.edu/admissions-financial-aid/admission-program/doctor-medicine/premedical-course-requirements) | Mixes named coursework with competencies; statistics can be a course, other coursework, or research; laboratory competency can come from coursework or employment. |
| 2 | [University of Houston MD](https://www.uh.edu/medicine/admissions/admissions-requirements/index-migrated-old.php) | Explicit credit-hour and lab requirements for biology, advanced biology, general/organic chemistry, biochemistry, physics, statistics, and composition. |
| 3 | [University of Florida MD](https://admissions.med.ufl.edu/admission-requirements/regular-admission-requirements/) | Science-major foundational courses with labs; permits named higher-level substitutions at committee discretion. |
| 4 | [Duquesne DO](https://www.duq.edu/academics/colleges-and-schools/college-of-osteopathic-medicine/do-program/admissions.php) | A DO-program course/credit/lab frame. |
| 5 | [California Health Sciences University DO](https://osteopathic.chsu.edu/admissions/) | Biology, chemistry, physics, English, behavioral science; AP policy and a 10-year science-course recency condition. |
| 6 | [Kentucky MD](https://medicine.uky.edu/sites/meded/you-apply) | “Critical writing, synthesis, and oral presentation” rather than a rigid English prefix; statistics is recommended. |
| 7 | [Yale MD](https://medicine.yale.edu/md-program/admissions/requirements/) | Standard named sciences with labs; accepts advanced course substitution, online/community-college coursework under stated conditions, and transcripted AP credit. |
| 8 | [Northwestern MD](https://www.feinberg.northwestern.edu/admissions/how-to-apply/requirements.html) | Yearlong science-and-lab sequences; “Organic Chemistry/Biochemistry (or equivalent)” and recommended writing/statistics/social science. |
| 9 | [Nevada Reno MD](https://med.unr.edu/education/medical-education/md-admissions-process/prerequisites-requirements) | Semester-credit model, upper-division biology condition, psychology **or** sociology, and explicit grade/AP/IB/community-college conditions. |
| 10 | [UAB MD](https://www.uab.edu/medicine/home/admissions/selection-criteria) | Current MD admissions-selection source; used to test that online-course treatment varies by institution. |
| 11 | [Northern Colorado DO](https://www.unco.edu/osteopathic-medicine/admission/requirements/) | Behavioral/social science and English composition appear as named required categories alongside lab sciences. |
| 12 | [Oklahoma MD](https://catalog.ouhsc.edu/medicine/handbook/md-program-admissions/) | Adds genetics/cellular/molecular biology choice and a broad psychology/sociology/philosophy/humanities bucket. |
| 13 | [PCOM DO](https://catalog.pcom.edu/admissions/pa-do/) | Uses combined chemistry credits with organic and biochemistry minima; specifies lab credit and transcripted AP/IB treatment. |
| 14 | [West Virginia SOM DO](https://www-web.wvsom.edu/admissions/do/application-requirements) | Uses a flexible lab-total requirement, rather than one lab attached to every named science. |
| 15 | [UAMS MD](https://medicine.uams.edu/admissions/apply/) | Requires genetics within biology and adds statistics and social science as named categories. |
| 16 | [University of New England DO](https://www.une.edu/com/admissions/criteria-procedures) | English/humanities bucket; labs required in some sciences but not biochemistry; accepts specified online coursework. |
| 17 | [Des Moines University DO](https://www.dmu.edu/do/admission-requirements/) | Credit-hour categories, grade floor, and a contrary AP/pass-fail policy. |
| 18 | [D'Youville DO](https://www.dyu.edu/academics/degrees-programs/osteopathic-medicine-do) | Mathematics/computer science and behavioral science; biochemistry can substitute for organic chemistry II. |
| 19 | [Rowan-Virtua DO](https://som.rowan.edu/education/admissions/apply.html) | Mathematics, behavioral sciences, English and a recommended advanced-science block beside lab science sequences. |
| 20 | [Campbell DO](https://medicine.campbell.edu/admissions/osteopathic-medicine-admissions/) | Writing-intensive course may substitute for English; biochemistry may replace part of organic chemistry; accredited online coursework accepted. |
| 21 | [Burrell DO](https://burrell.edu/prospective-students/admission-requirements/) | Credit policy, AP/IB provenance condition, and science-elective examples. |
| 22 | [WesternU COMP DO catalog](https://www.westernu.edu/media/registrar/2023-2024-catalog-comp-1.pdf) | DO credit-hour/laboratory model and an institutional CASPer condition; older catalog, used only as published category evidence. |
| 23 | [Arizona Tucson MD](https://www.medicine.arizona.edu/education/degree-programs/md-program/admissions) | Competency-like human physiology/biochemistry/genetics frame, upper-division sciences, writing, behavioral science, statistics; says labs are not prerequisites. |
| 24 | [New Mexico MD](https://hsc.unm.edu/medicine/education/md/admissions/apply/prerequisite-courses.html) | Human-based biology condition, content expectations for biochemistry, online-course cap, and explicit AP/IB/CLEP terms. |
| 25 | [East Carolina / Brody MD bulletin](https://medicine.ecu.edu/admissions/wp-content/pv-uploads/sites/242/2021/02/bulletin-2020.pdf) | **Historic bulletin only**: provides a school-published example of biology/zoology, chemistry, organic chemistry, physics, and writing-intensive requirements. It is excluded from any current-policy claim. |

### Proposed controlled vocabulary — category names only

| Category a student may select when entering a school requirement | Variation shown by the audit |
|---|---|
| **Biological sciences** | General biology, zoology, human biology, or a total biology-credit requirement; some schools require upper-division, genetics, cell, or molecular biology within/alongside it. |
| **General / inorganic chemistry** | One or two terms, often with lab; a few schools allow a named advanced substitution. |
| **Organic chemistry** | One or two terms, often with lab; some programs allow biochemistry to replace one term. |
| **Biochemistry** | Required, recommended, or part of a combined chemistry block; lab expectation varies and course content/level can be specified. |
| **Physics** | One or two terms or a credit total; lab may be required, recommended, or not separately required. |
| **Laboratory component** | A requirement attached to a particular subject, an aggregate lab-credit total, a competency, or absent as a separately stated requirement. It must be recorded as a condition, not inferred from a lecture title. |
| **Statistics / quantitative reasoning** | Statistics, biostatistics, mathematics, computer science, research experience, or a competency; required at some schools and recommended at others. |
| **Writing / English / communication** | English composition/literature, writing-intensive work, or broader critical writing/oral-presentation competency. |
| **Behavioral and social sciences** | Psychology, sociology, anthropology, behavioral science, or a broader humanities/social-science bucket. |
| **Humanities / ethics / language** | A named humanities category, English/humanities combination, a broad liberal-arts expectation, or recommendation only. |
| **Advanced science elective** | Genetics, molecular/cell biology, anatomy, physiology, microbiology, immunology, neuroscience, or an institution-defined advanced-science pool. |

### Policy axes: the audit's actual range

| Axis | Documented range in the sample |
|---|---|
| **AP / IB / CLEP** | Accepted if transcripted at Kentucky, Yale, UNR, CHSU, PCOM, UNE, Arizona, and UNM; Tufts restricts AP for some subjects; DMU does not accept AP; credit/score/provenance conditions differ. |
| **Community college** | Explicitly accepted with conditions at Yale and UNR; considered in Northwestern's holistic review; Tufts does not prohibit it. Schools differ on expected rigor and whether they state a restriction. |
| **Online work** | Accepted/allowed with conditions at Tufts, Northwestern, Campbell, and UNE; UNM caps post-pandemic online prerequisite lectures; other pages do not establish a comparable policy. |
| **Recency** | No expiration policy at Tufts or Northwestern; CHSU may require science repeated after ten years; this is not a universal “science expires after X years” field. |
| **Grade model** | Several programs state C/C- thresholds or letter-grade conditions, while their exact threshold and pass/fail exceptions differ. |

### Service classifications are not prerequisite equivalencies

The application services classify or verify coursework for their own purposes. The earlier sections of this packet already document AMCAS, AACOMAS, and TMDSAS service rules. The school sample above reinforces their boundary: school policies vary in subject content, lab, credit quantity, source institution, grading, and substitutions. **No service page or cross-school standard found in this research says that a service's subject category determines whether a named school's prerequisite is met.**

## Evidence-backed implications — non-binding

1. A controlled vocabulary may support the student when they record a school's own published requirement: it should store a **category plus the school's entered terms/credits/lab note and source/cycle**, not a course-to-school equivalency verdict.
2. The truthful derived relationship is **mapped / no mapped course / incomplete record**, never “satisfies.” A mapping says what the student associated; it does not claim the program will accept it.
3. AP/IB, online, community-college, grade, and recency policies belong to the student's entered school requirement or source note—not to a permanent global category default.

## Extension non-findings

- The audit found no national crosswalk or standardized equivalency decision across the 25 official school sources.
- It does not claim this is a statistically representative survey of all U.S. MD/DO programs, nor does it establish a refresh schedule.
- It does not authorize a per-school requirement dataset, a “meets requirement” indicator, or any implementation change.
