# Research packet — School List `SL-24`: application services

**Question.** What official service mechanics require a first-class per-school application-service field in a v1 School List tracker?

**Scope.** AMCAS (AAMC), AACOMAS (AACOM / its official Liaison applicant help center), and TMDSAS only. This is evidence for a later product ruling, not a product ruling itself.  
**Accessed:** 2026-08-11

## Findings

| Service | Official fact | Tracker-relevant consequence (inference, not a ruling) |
|---|---|---|
| **AMCAS** | AMCAS begins processing only after the application is submitted and required transcripts arrive. It verifies entered coursework against official transcripts; its published lifecycle includes Waiting for Transcripts, Ready for Review, Under Review, Returned, and Processing Complete. AAMC says busy-season verification can take about eight weeks. | A bare `submitted` state cannot truthfully say whether the primary is blocked on transcripts, queued, returned, or complete. Those are service-primary states, not school decision states. |
| **AACOMAS** | AACOMAS accepts a submission before all materials arrive, but starts verification only once the application is complete. Its official applicant help lists In Progress, Received, Complete, Verified, and Undelivered; verification may take up to 10 business days. AACOMAS then transmits the verified application to selected programs, which can have extra requirements. | AACOMAS has its own state vocabulary and a distinct completeness gate. Mapping it silently to AMCAS wording would conflate different facts. School-specific secondary/requirement work remains separate from the central-service state. |
| **TMDSAS** | TMDSAS is the standardized first-year application for participating Texas public medical schools. After submission, TMDSAS processes and transmits the selected-school application; its current guide says missing letters and scores do not delay primary processing and advises applicants to send transcripts only when TMDSAS requests them. TMDSAS also runs a Match for eligible Texas-resident medical applicants who have interviewed and rank their schools; applicants who miss the ranking deadline are withdrawn from all medical schools. | TMDSAS cannot safely be treated as AMCAS with a different name. Its primary-document timing is different, and eligible applicants have a service-level rank-preference/Match workflow after interviews that a generic per-school decision timeline would omit. |

## Primary-source evidence

### AMCAS — AAMC

- [Monitoring Your Application](https://students-residents.aamc.org/how-apply-medical-school-amcas/monitoring-your-application) — after certification/submission and receipt of required transcripts, AMCAS enters the processing queue; staff verify coursework; busy-season verification can take about eight weeks. Accessed 2026-08-11.
- [AMCAS FAQs: after submission](https://students-residents.aamc.org/applying-medical-school/faq/amcas-faq?topic=after-submission) — official application-status definitions, including transcript wait, review, return, and processing-complete states. Accessed 2026-08-11.
- [AMCAS Submission and Deadlines](https://students-residents.aamc.org/applying-medical-school-amcas/publication-chapters/amcas-submission-and-deadlines) — submission can precede letters; letters are not required for AMCAS verification. Accessed 2026-08-11.
- [AMCAS participating medical schools and deadlines](https://students-residents.aamc.org/applying-medical-school-amcas/amcas-program-participating-medical-schools-and-deadlines) — official service directory for validating AMCAS participation and program deadlines. Accessed 2026-08-11.

### AACOMAS — AACOM / official applicant help center

- [AACOM application instructions](https://www.aacom.org/become-a-doctor/apply-to-medical-school/application-instructions) — one central application is verified before transmission to selected programs. Accessed 2026-08-11.
- [Submitting and completing your AACOMAS application](https://help.liaisonedu.com/AACOMAS_Applicant_Help_Center/Submitting_and_Monitoring_Your_AACOMAS_Application/Before_and_After_You_Submit_Your_AACOMAS_Application/1_Submitting_and_Completing_Your_Application) — submission before completion, completeness gate before verification, and verification timing. Accessed 2026-08-11.
- [Check your AACOMAS notifications and status](https://help.liaisonedu.com/AACOMAS_Applicant_Help_Center/Submitting_and_Monitoring_Your_AACOMAS_Application/Before_and_After_You_Submit_Your_AACOMAS_Application/2_Check_Your_AACOMAS_Notifications_and_Status) — status vocabulary, including Undelivered and Verified. Accessed 2026-08-11.
- [AACOM application process](https://www.aacom.org/become-a-doctor/apply-to-medical-school/the-application-process) — AACOMAS is the centralized application service for U.S. osteopathic medical schools and sends applications to designated programs. Accessed 2026-08-11.

### TMDSAS

- [About the TMDSAS application](https://www.tmdsas.com/explore/about-application.html) — TMDSAS is the standardized application for first-year entering classes at participating Texas public medical schools. Accessed 2026-08-11.
- [Next steps after submitting](https://www.tmdsas.com/application-guide/after-submitting.html) — processing/transmission, document timing, transcript-request policy, and Match eligibility/rank-preference mechanics. Accessed 2026-08-11.
- [TMDSAS deadlines](https://www.tmdsas.com/apply-now/deadlines.html) — current cycle-specific dates, including Match milestones; these dates should be treated as cycle data, not permanent constants. Accessed 2026-08-11.
- [TMDSAS schools](https://www.tmdsas.com/about/TMDSAS_schools.html) — participating-school directory, useful for validating per-school TMDSAS assignment. Accessed 2026-08-11.

## Evidence-backed implications to carry into the `SL-24` ruling

These are recommendations derived from the facts above, not settled product decisions:

1. Preserve the existing `applicationService` value on every roster and tracked-school record (`AMCAS`, `AACOMAS`, or `TMDSAS`); validate it against an official participating-school list or school admissions page rather than infer it from MD/DO or Texas location. TMDSAS documents limited AMCAS exceptions for some joint-degree applicants.
2. Model the primary application as a **service-level** workflow and distinguish it from per-school outcomes. One AMCAS/AACOMAS/TMDSAS application can involve several schools, while secondary, interview, and decision events remain school-specific.
3. If v1 shows a primary state, use service-specific labels or a transparent mapping with the source state retained. A single generic `submitted`/`verified` timeline otherwise misstates material document and processing stages.
4. Treat TMDSAS rank preference and Match as a conditional service-level workflow for eligible applicants, rather than forcing it into each school’s generic post-interview status. The exact dates are cycle-specific.

## Explicit non-findings

- This packet does **not** recommend shipping current deadlines, fees, admissions metrics, school requirements, or test requirements; they change by cycle and are outside `SL-24`.
- This packet does **not** decide the School List UI, status names, notification behavior, or Timeline ownership.
