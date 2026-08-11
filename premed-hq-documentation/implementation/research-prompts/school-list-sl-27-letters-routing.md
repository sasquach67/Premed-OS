# Research packet — School List `SL-27`: letters routing per school

**Question.** What do the three primary-application services actually do with letters, where can an applicant choose recipient schools, and which requirements can only be recorded for the student's own list?

**Scope.** Current official AMCAS (AAMC), AACOMAS (AACOM / Liaison's official applicant help), and TMDSAS guidance, plus the existing School List board. This is evidence for a later product ruling, **not** a product ruling.

**Accessed:** 2026-08-11

## Facts established by primary sources

| Service | Service-level delivery mechanics | Applicant control / per-school boundary |
|---|---|---|
| **AMCAS** | The AMCAS Letter Service accepts letters and distributes them electronically to participating schools. A letter author sends to AMCAS rather than separately to each school. | The applicant creates letter entries and designates which schools receive each letter. A letter is sent only once the application is processed, the letter is received, and the applicant has assigned it to the relevant school(s). AMCAS permits up to 10 letter entries, specifically so applicants can target letters to particular schools. |
| **AACOMAS** | Evaluators submit electronically through Liaison Letters; AACOMAS sends an applicant's application and supplemental materials to the colleges the applicant designates. AACOM additionally says letters may instead be submitted directly to schools through routes each school specifies. | The applicant chooses evaluators in AACOMAS, but the official applicant guidance does **not** establish a per-program recipient-assignment interface comparable to AMCAS. It instead directs applicants to research every program's requirements and notes that programs may have strict, differing guidelines. |
| **TMDSAS** | Evaluators or advisors submit letters to TMDSAS; after TMDSAS receives and approves a letter, schools normally obtain access almost immediately. | There is **no** school-by-school letter targeting: TMDSAS explicitly says all letters submitted through it are available to every school the applicant is applying to. For medical applicants, TMDSAS centrally requires one committee packet **or** three individual letters, with one optional extra letter; individual schools can still decide whether a pending optional letter makes an application complete and whether to accept late letters. |

### AMCAS

- [Letters of Evaluation](https://students-residents.aamc.org/applying-medical-school-amcas/publication-chapters/letters-evaluation) states that most medical schools use AMCAS to accept, collect, and transmit letters; a received, assigned letter is automatically submitted after the application is processed. It also states the 10-letter cap and says the cap enables targeted letters for specific schools.
- [Section 6: Letters of Evaluation](https://students-residents.aamc.org/how-apply-medical-school-amcas/section-6-amcas-application-letters-evaluation) says applicants enter writers and indicate which schools should receive each letter; designations can be made after medical-school designations are entered.
- [AMCAS Letter Service](https://students-residents.aamc.org/applying-medical-school-amcas/amcas-letter-service) says participating schools receive letters through the service and directs applicants to each admissions website for a school's letter requirements. Participation is subject to change.
- [AMCAS submission and deadlines](https://students-residents.aamc.org/applying-medical-school-amcas/publication-chapters/amcas-submission-and-deadlines) says every medical school determines its own deadline and that received letters are sent to the applicant's designated schools as they arrive.

### AACOMAS

- [AACOMAS Evaluations](https://help.liaisonedu.com/AACOMAS_Applicant_Help_Center/Filling_Out_Your_AACOMAS_Application/Supporting_Information/1_Evaluations) says evaluators, not applicants, submit evaluations through Liaison Letters; applicants may enter at most 10 evaluations. It tells applicants to determine each program's evaluator-role and relationship requirements because many programs have strict guidelines and completed evaluations may not be removable or replaceable.
- [AACOM application process](https://www.aacom.org/become-a-doctor/apply-to-medical-school/the-application-process) says AACOMAS sends the application and supplemental materials to colleges the applicant designates. It separately says letters can be sent through AACOMAS or directly to schools by alternative services identified by the school, and that guidelines vary by school.
- [AACOM admissions requirements](https://www.aacom.org/become-a-doctor/apply-to-medical-school/admissions-requirements) likewise says all osteopathic schools require letters, but the route and requirements vary by school and should be checked with each college.

### TMDSAS

- [Letters of Evaluation](https://www.tmdsas.com/application-guide/letters-of-evaluation.html) documents evaluator/committee-packet submission, the medical-applicant baseline of a committee packet or three individual letters plus an optional extra letter, processing, and the explicit rule that letters cannot be sent to only one school: all TMDSAS letters become available to every selected school.
- The same TMDSAS guide says some schools review after the required three letters while others wait for every listed placeholder, including an optional letter; applicants must contact the school for its policy. It also says individual schools decide whether to accept late letters.
- [TMDSAS explore: Letters of Evaluation](https://www.tmdsas.com/explore/letters-evaluation.html) independently confirms that letters do not delay application processing and lists TMDSAS's central content/form requirements (letterhead, contact information, signature, applicant name, date, and English).

## Existing-project evidence

- The [School List board](../../tabs/08-school-list-board.md) identifies `SL-27` as “Letters routing per school,” says it should read Letters' `Person` records without storing a second copy, and records that `LT-6` ceded **shipping** school requirements to MSAR. The board also notes that a student entering requirements for their own list is compatible with the governing no-HQ-research rule. This is internal product context, not external evidence.

## Evidence-backed product inferences — not rulings

1. “Route this writer to this school” has different truthful meanings by service. AMCAS supports the actual applicant-selected mapping; TMDSAS explicitly does not. A single cross-service mapping field would need to preserve that difference rather than imply TMDSAS can withhold a letter from one selected school.
2. The canonical person/writer record can be shared with School List, but service submission information (for example, a central-service evaluator entry, receipt/approval, or committee packet) is not the same fact as a School List writer-person record.
3. The student may need to record, per school, what that school says it requires or accepts: quantity, required writer roles/relationships, packet policy, direct-vs-service route, deadline, and whether optional/pending materials block completeness. These facts vary by institution and can change by cycle.
4. A “complete” indication must not be inferred simply from letter receipt. TMDSAS explicitly demonstrates the distinction: the same pending optional letter may block completeness at one school but not another.

## Explicit non-findings and limits

- This research found **no official AACOMAS applicant documentation** establishing a school-by-school evaluation-assignment action analogous to AMCAS's letter designation. It should not be asserted without application-level verification or a current official AACOMAS source.
- No central service source supports HQ shipping a durable, authoritative roster-wide table of each institution's letter count, writer-role, packet, route, deadline, or completeness policy. AAMC and AACOM direct applicants to individual school requirements; TMDSAS confirms that school policies can differ even when TMDSAS centrally receives the letters.
- This packet does not decide whether to build a routing UI, define statuses, sync application portals, fetch school requirements, or define how the existing Letters tab models writers and requests.
- The cited central service limits and current procedures are cycle-sensitive. They are useful behavioral constraints, not immutable product constants.
