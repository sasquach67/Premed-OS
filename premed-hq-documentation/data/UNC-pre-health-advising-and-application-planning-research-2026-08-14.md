# UNC pre-health advising and application planning: ownership boundaries

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC, AAMC, AACOMAS, and TMDSAS owner material. This is a routing/provenance packet, not admissions advice, a school-list recommendation, or a prediction of acceptance.

## Decision in one screen

UNC Health Professions Advising (HPA) is the correct **UNC advising route** for students exploring and preparing for health-profession programs. It is not the owner of every target school’s prerequisites, letter policy, deadline, or application decision. Atlas must use a layered record:

1. **UNC/HPA** for campus-specific advising and process support;
2. the applicable **application service** for the mechanics of that service; and
3. the **target program** for requirements, deadlines, and admissions decisions.

Never use a general pre-med recommendation, an application-service label, or an HPA page to claim an individual school will accept a course, letter, activity, or applicant.

## Scenario map

| Student need | Official first route | Safe Atlas behavior | Requires another owner check |
|---|---|---|
| Explore health-profession paths or begin planning | [UNC Health Professions Advising](https://careers.unc.edu/students/pre-health/) | Route to current HPA access/appointment/program information. | Chosen profession, target programs, and individual academic plan. |
| Verify a UNC academic plan | Current degree audit, academic advisor, catalog, and HPA | Keep degree/major rules separate from pre-health planning. | Live course availability and target school prerequisites. |
| Understand AMCAS mechanics | [2027 AMCAS Applicant Guide](https://students-residents.aamc.org/applying-medical-school-amcas/publication/2027-amcas-applicant-guide) | Link the current cycle guide and store the cycle/year. | Each MD program’s own requirements/deadlines. |
| Understand DO application mechanics | [AACOMAS applicant help](https://help.liaisonedu.com/AACOMAS_Applicant_Help_Center) | Direct to the current owner guide. | Each osteopathic program’s requirements/deadlines. |
| Understand Texas public medical/dental application mechanics | [TMDSAS application guide](https://www.tmdsas.com/application-guide/) | Direct to the current owner guide. | Each program’s requirements/deadlines. |
| Plan letters | HPA for UNC process questions; [AMCAS letters guidance](https://students-residents.aamc.org/how-apply-medical-school-amcas/section-6-amcas-application-letters-evaluation) for AMCAS mechanics | Store author, service, entry type, and deadlines separately. | Whether a target school accepts/needs a particular type or number of letters. |
| Ask whether UNC provides a committee letter/packet | Current HPA materials or direct HPA confirmation | Display only an explicitly current UNC-provided policy. | Do not infer one from AMCAS’s generic committee-letter support. |

## Application-service rules that Atlas must keep distinct

### AMCAS

AMCAS has its own current applicant guide and Letter Service. It recognizes individual letters, letter packets, and committee letters as application entries, but that does **not** establish that UNC currently supplies a committee letter or packet. AMCAS says applicants must research individual medical schools’ letter requirements; schools can set different expectations. [2027 AMCAS Applicant Guide](https://students-residents.aamc.org/media/11616/download) · [AMCAS letters](https://students-residents.aamc.org/how-apply-medical-school-amcas/section-6-amcas-application-letters-evaluation)

AMCAS mechanics and admissions expectations are also separate: a letter can be submitted/processed according to service rules while still not satisfy a particular program’s stated requirements. Atlas should never call a letter “complete” without a school-specific check.

### AACOMAS and TMDSAS

AACOMAS and TMDSAS are different owner systems with different categories, workflows, and participating programs. A rule or category from AMCAS should not be copied into them. For any application-service recommendation, store `service`, `cycle`, `source_url`, and `target_program` as separate facts.

## UNC planning rules

- **Pre-health is not a UNC major.** UNC students select an undergraduate degree program and integrate any relevant prerequisite work into their plan. The current catalog/degree audit owns UNC graduation requirements. [UNC academic resources catalog](https://catalog.unc.edu/resources/academic-research/)
- **HPA is an advising path, not a universal prerequisite authority.** It can help students navigate planning, but each school/program controls its own admissions requirements.
- **HPA availability and programming are live.** Appointments, workshops, cohort programs, letter processes, and cycle calendars should be checked on current owner pages—not inferred from an old guide or a peer account.
- **Do not turn a UNC resource into an outcome claim.** Advising access does not prove an applicant is ready, competitive, or eligible to apply.

## Letter handling: safe product language

Use this wording style:

> **Plan letters early, but verify per school.** HPA can clarify UNC’s current process. Your application service controls submission mechanics, while each medical program controls what it requires and by when.

Do not say:

- “You need exactly X letters.”
- “UNC will send a committee letter.”
- “Your letters are complete for every school.”
- “A letter from this person will be strong.”

For AMCAS specifically, the current guide says applicants may submit the primary application before letters arrive, and schools may have their own letter deadlines and formatting requirements. That is a **cycle-specific mechanics fact**, not advice to delay letters or a universal timing rule. [2027 AMCAS Applicant Guide](https://students-residents.aamc.org/media/11616/download)

## Product rules

1. **Every recommendation has an owner.** Label it `UNC/HPA`, `application service`, or `target program`; do not merge them.
2. **Store current-cycle dates at the source, never as evergreen content.** Cycle-opening, processing, and deadline pages change.
3. **Use unresolved status where policy is absent.** If a public HPA page does not currently publish a committee/packet policy, render “confirm with HPA”—not “none” or “yes.”
4. **Preserve user data privately.** Draft essays, letter-author contacts, evaluation waivers, application IDs, transcripts, and school lists need private handling; they are not corpus evidence.
5. **Separate mechanics from judgment.** A service’s ability to accept an item is not an admissions endorsement; a school’s stated requirement is not an odds estimate.

## Minimal data contract

```text
ApplicationPlanningFact
  owner: UNC_HPA | AMCAS | AACOMAS | TMDSAS | target_program
  cycle
  source_url
  source_checked_at
  topic: advising | prerequisite | letter | transcript | application | deadline
  status: published_rule | owner_confirmation_needed | user_progress
  applies_to: program_or_service
  claims_not_supported: [admission_odds, universal_requirement, application_readiness]
```

## Evidence limits and refresh rules

- Recheck HPA’s live site before showing access, programming, or letter-process information.
- Recheck the relevant application-service guide each cycle.
- Recheck every target program’s official admissions page during the application year.
- This packet does not establish a target program list, admissions probability, exact letter count, committee-letter availability, MCAT timeline, or application deadline.
