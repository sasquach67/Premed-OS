# UNC Campus Health, insurance, and care navigation: safe routing rules

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** First-party UNC Campus Health/CAPS routes. This is a navigation and evidence-boundary packet—not medical advice, diagnosis, treatment direction, coverage determination, or an availability/cost guarantee.

## Safety-first routing

If a situation appears life-threatening or is an immediate medical/mental-health emergency, use **911** or an emergency department. Atlas must not attempt to triage symptoms in place of emergency care. For urgent but non-life-threatening needs, UNC’s [urgent-needs page](https://campushealth.unc.edu/urgent-needs/) is the current owner route: it publishes daytime/night contact and after-hours nurse-advice information, but actual wait time, same-day availability, and the appropriate setting must be determined live by Campus Care/the clinician. 

| Student need | Official owner route | What Atlas can safely say | Must not say |
|---|---|---|---|
| Routine physical/mental-health appointment | [Campus Care appointments](https://campushealth.unc.edu/about-us/appointments/) | Check current online/phone scheduling instructions and prepare the relevant insurance/medication information. | A clinician, time, modality, diagnosis, or treatment will be available. |
| Urgent, non-life-threatening concern | [Urgent needs](https://campushealth.unc.edu/urgent-needs/) | Use Campus Care’s current triage/contact instructions; after-hours guidance may route to UNC Nurse Connect. | “Wait at home,” “go to X,” or a clinical judgment based on a chat. |
| Urgent emotional/mental-health concern | [CAPS](https://caps.unc.edu/) | CAPS publishes urgent and 24/7 contact routes; 988 is a separate crisis route. | That a specific service is appropriate, confidential in every circumstance, or immediately available. |
| Insurance charge/waiver question | [Mandatory insurance hard-waiver process](https://campushealth.unc.edu/charges-insurance/mandatory-student-health-insurance-hard-waiver-process/) | Eligible students must satisfy current enroll-or-waive rules; check the live semester deadline and own coverage. | That a waiver will be approved or coverage/cost is sufficient. |
| Prescription or refill question | [Campus Health Pharmacy](https://campushealth.unc.edu/services/pharmacy/) | Use the owner’s current fill/refill/transfer instructions and ask pharmacy/insurer about cost or coverage. | That a drug will be prescribed, in stock, covered, or ready. |
| Immunization record/compliance | [Immunizations](https://campushealth.unc.edu/services/immunizations/) | Submit through the currently published process; check ConnectCarolina To Do items. | That a past record satisfies the present requirement or deadline. |
| Formal academic/residential accommodation | [UNC accessibility accommodations](https://compliance.unc.edu/) | A clinician may provide care/documentation, while the accommodations office owns an individualized decision. | That Campus Care or CAPS automatically grants an accommodation. |

## How the care system is framed

### Routine care

[Campus Care Services](https://campushealth.unc.edu/services/) is the current service hub. The [appointments route](https://campushealth.unc.edu/about-us/appointments/) publishes in-person and virtual appointment information, online/phone scheduling, check-in preparation, and cancellation/rescheduling instructions. A virtual visit can require later in-person follow-up; Atlas should not present virtual care as a universal substitute.

The [who-can-use-Campus-Health-and-CAPS page](https://campushealth.unc.edu/about-us/who-can-use-campus-health-and-caps/) is the eligibility owner. It distinguishes students/postdocs paying the term Health Fee from circumstances such as part-time or distance enrollment, and it distinguishes pharmacy access. Use the live owner page for a particular student; enrollment status and fees are not enough to infer all services or cost.

### Urgent and crisis routing

UNC publishes Campus Care 24/7 contact/after-hours advice through its [services hub](https://campushealth.unc.edu/services/) and [urgent-needs page](https://campushealth.unc.edu/urgent-needs/). Its published structure differentiates life-threatening emergencies (911), regular-hours nurse advice/appointment questions, and after-hours nurse connection. That is routing information, **not** a symptom rulebook.

[CAPS](https://caps.unc.edu/) separately publishes urgent mental-health contact and business-hour initial-visit information. Atlas should surface those owner routes beside—not in place of—911/ED for immediate danger. Never turn a generic concern, a self-description, or an LLM inference into a diagnosis or safety determination.

### Insurance and charges

The [hard-waiver process](https://campushealth.unc.edu/charges-insurance/mandatory-student-health-insurance-hard-waiver-process/) says eligible students must have coverage and must complete the current enrollment or online-waiver process by the relevant semester deadline. The page currently shows a fall and spring deadline; dates and eligibility can change, so Atlas should display **“check live deadline”** rather than preserve a static calendar reminder from this packet.

[Using insurance at Campus Health](https://campushealth.unc.edu/charges-insurance/using-insurance-campus-health/) is the route for card/claims workflow. It cautions that charges outside the Health Fee can go to the primary insurer and that coverage is plan-specific. It also notes that an explanation of benefits is ordinarily sent to the policyholder and may disclose basic service/billing information. Atlas should proactively point a student with privacy/coverage concerns to their insurer and Campus Care—not promise confidentiality from a policyholder or estimate their bill.

### Pharmacy, immunization, and records

The [Campus Health Pharmacy](https://campushealth.unc.edu/services/pharmacy/) page owns current pharmacy, refill, and medication-pickup guidance. A clinician’s prescription process, pharmacy inventory, insurance adjudication, and prescription eligibility are all separate dynamic decisions.

The [immunizations page](https://campushealth.unc.edu/services/immunizations/) says new/transfer students must submit required state immunization documentation through the published process and directs students to ConnectCarolina To Do items. It lists term timing and consequences for noncompliance, but Atlas must refresh those requirements rather than repeat old dates or decide whether an individual record qualifies.

UNC says Campus Care records/services are HIPAA-covered from **August 1, 2026**; do not repeat earlier FERPA-era assumptions as current privacy guidance. The [patient-privacy page](https://campushealth.unc.edu/about-us/patient-privacy/) and [release-of-information route](https://campushealth.unc.edu/services/release-information/) own current consent and record-access processes. Care-team communication with faculty/others generally needs the relevant written authorization; specific legal exceptions/process questions belong to the current owner, not Atlas.

## Scenario playbook

| Situation | Best next action | Information to prepare | Boundary |
|---|---|---|---|
| Need a nonurgent appointment | Check Campus Care’s appointment instructions; use its current scheduling channel. | Availability, insurance card, medications/allergies as the office requests. | Atlas does not select a service, clinician, or treatment. |
| Unsure whether a concern is urgent | Follow the official urgent-needs route or emergency route if immediate danger. | Exact current symptoms/timeline should go to a clinician/dispatcher, not Atlas. | Do not delay emergency care for app navigation. |
| Need a refill/prescription transfer | Use pharmacy’s current workflow; contact prescriber/pharmacy. | Prescription name, prescriber, preferred pharmacy, insurance as requested. | No promise of refill, transfer, availability, or price. |
| Insurance fee appeared on bill | Read live waiver/enrollment page and current student-account/insurer details. | Enrollment status, current coverage evidence, current deadline. | No waiver/eligibility/cost decision from general guidance. |
| Needs academic flexibility because of a health issue | Seek care as needed; use formal accommodation/absence owners for academic decisions. | Current policy, requested documentation/authorization, course context. | Care contact does not itself excuse absence or grant accommodation. |
| Wants to access/release records | Use current release-of-information route and appropriate portal. | Date range, recipient, record type, authorization requirements. | No assumption all historical records are in one system. |

## Product rules for Atlas

1. **Safety dominates convenience.** Put 911/official urgent routes before routine appointment links when the student indicates immediate danger.
2. **Route, do not diagnose.** Do not evaluate symptoms, recommend medication, interpret test results, set treatment urgency, or replace a clinician.
3. **Separate care, insurance, records, and accommodations.** They have different owners, privacy rules, and decisions.
4. **Treat all capacity, cost, coverage, and hours as live state.** Use `dynamic_check_required`; do not claim same-day care, a specific bill, insurance approval, prescription fill, or wait time.
5. **Protect sensitive data.** Do not collect diagnoses, detailed symptoms, insurance/member identifiers, medication lists, or record files merely to route a student.
6. **Version privacy facts.** The August 2026 HIPAA transition means older Campus Health privacy claims should be labeled historical or removed from current product logic.

## Minimal record contract

```text
StudentCareRoute
  owner: Campus Care | CAPS | pharmacy | insurer | accessibility office | emergency services
  source_url
  source_checked_at
  route_kind: routine_care | urgent_navigation | crisis_navigation | insurance | pharmacy | records | accommodation
  status: dynamic_check_required | individual_decision | privacy_sensitive
  claims_not_supported: [diagnosis, treatment, coverage_guaranteed, appointment_guaranteed, confidentiality_guaranteed]
```

## Source register and refresh rules

1. [Campus Care services](https://campushealth.unc.edu/services/) · [appointments](https://campushealth.unc.edu/about-us/appointments/) · [eligibility](https://campushealth.unc.edu/about-us/who-can-use-campus-health-and-caps/) — current service/appointment owner routes.
2. [Urgent needs](https://campushealth.unc.edu/urgent-needs/) · [CAPS](https://caps.unc.edu/) — urgent/crisis routing owners; check live hours/instructions.
3. [Mandatory insurance hard-waiver process](https://campushealth.unc.edu/charges-insurance/mandatory-student-health-insurance-hard-waiver-process/) · [using insurance](https://campushealth.unc.edu/charges-insurance/using-insurance-campus-health/) — current insurance workflow owners; refresh each semester.
4. [Campus Health Pharmacy](https://campushealth.unc.edu/services/pharmacy/) · [immunizations](https://campushealth.unc.edu/services/immunizations/) — dynamic pharmacy/compliance routes.
5. [Patient privacy](https://campushealth.unc.edu/about-us/patient-privacy/) · [release of information](https://campushealth.unc.edu/services/release-information/) — current records/privacy owner routes.
6. [UNC accommodations](https://compliance.unc.edu/) — separate formal-access owner.

## Evidence limits

- This packet does not identify a medical condition, assess an emergency, select treatment, or promise clinical results.
- It does not verify insurance eligibility/coverage/cost, appointment availability, pharmacy inventory, immunization compliance, or accommodation outcome.
- It is a current-route snapshot only. Health services, insurance rules, deadlines, hours, and privacy processes should be rechecked at the moment they matter.
