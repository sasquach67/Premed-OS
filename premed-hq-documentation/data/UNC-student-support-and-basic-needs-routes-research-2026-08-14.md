# UNC student support and basic needs: safe routing boundaries

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC resources. This is a routing and safety packet, not medical, mental-health, legal, conduct, or financial advice.

## Safety rule first

If someone faces an **immediate threat to life or safety**, possible overdose, imminent self-harm/violence, or another emergency, Atlas must tell them to call **911** or UNC Police at **919-962-8100**. It must not offer a Care Referral, an online form, or an ordinary appointment as the emergency action. UNC’s Care Referral guidance explicitly says the form does not address emergency situations. [Dean of Students Care Referral](https://dos.unc.edu/student-support/care-referral-form/)

For a person who may be in immediate danger, Atlas should display the emergency instruction first, in plain language, and avoid attempting assessment, diagnosis, or follow-up triage.

## Scenario map

| Situation | Official route | What Atlas can safely say | Important boundary |
|---|---|---|---|
| Immediate safety emergency | **911** or UNC Police **919-962-8100** | Call now; do not wait for an online referral. | Do not attempt to determine whether the situation is "serious enough." |
| Non-emergency concern about a student’s wellbeing | [Dean of Students Care Referral](https://dos.unc.edu/student-support/care-referral-form/) | A route for non-emergency concern/referral and campus support connection. | Not emergency response; outcome/timing is not guaranteed. |
| Needs mental-health support or urgent non-emergency support | [CAPS](https://caps.unc.edu/) / CAPS 24/7 **919-966-3658** | CAPS is UNC’s counseling route; check its live site/phone for current urgent-care and appointment directions. | Atlas cannot diagnose, choose treatment, promise confidentiality details beyond the owner’s policy, or guarantee availability. |
| General medical concern, preventive care, medication, illness | [Campus Health](https://campushealth.unc.edu/) | Use owner scheduling/after-hours instructions. | No symptom diagnosis or urgency determination beyond emergency escalation. |
| Academic impact of illness/crisis | [University Approved Absences](https://dos.unc.edu/student-support/approved-absences/) / Dean of Students | Route to the current process; preserve the student’s own records locally if they choose. | An absence request is not automatic approval and does not replace instructor communication where policy requires it. |
| Food, housing, financial, or other basic-needs difficulty | [Dean of Students Basic Needs Support](https://dos.unc.edu/student-support/basic-needs-support/) | Entry point for individual resource navigation. | Resource availability, funds, and eligibility are dynamic; avoid promises of aid. |
| Sudden emergency expense | [Student Emergency Fund](https://dos.unc.edu/student-support/student-emergency-fund/) | Apply/ask through the owner route and inspect current criteria. | A request is not a guarantee of award, amount, speed, or coverage. |
| Disability, pregnancy, or religious accommodation | [Student/Applicant Accommodations](https://compliance.unc.edu/) | Start the current individualized accommodation process through the owner’s Accommodate route. | Do not promise a particular accommodation, timeline, testing seat, or academic modification. |
| Sexual assault, interpersonal violence, stalking, or harassment | [Violence Prevention and Advocacy Services confidential support](https://vpas.unc.edu/confidential-support/) | VPAS is the confidential-support route for its stated scope; live owner page gives current contact options. | Do not require reporting, investigate facts, or turn the route into legal advice. |
| Wellness coaching / routine transition, balance, relationships, connection | [Student Wellness Coaching](https://studentwellness.unc.edu/programs-and-services/wellness-coaching/) | A nonclinical support and campus-connection route. | The owner says coaching is private but not confidential; never label it as a crisis or therapy service. |
| Substance-use safety / possible overdose | **911** for emergency; [Medical Amnesty information](https://studentwellness.unc.edu/substance-use-services/understanding-medical-amnesty/) for current policy context | Seek emergency help first; read owner policy later. | Do not provide conduct/enforcement predictions or legal assurances. |

## Privacy and confidentiality must be explicit

Atlas should not lump every supportive office under “confidential.” Use only the owner’s current label:

- **VPAS** describes confidential specialist support for students affected by its stated violence/harassment scope. [VPAS](https://vpas.unc.edu/confidential-support/)
- **Wellness Coaching** is private but **not confidential**; its coaches are responsible employees. [Wellness Coaching](https://studentwellness.unc.edu/programs-and-services/wellness-coaching/)
- **Care Referral** is a campus-support process, not confidential counseling or emergency response. [Care Referral](https://dos.unc.edu/student-support/care-referral-form/)
- **CAPS and Campus Health** must be described by their current owner-published privacy and emergency instructions, not by generalized Atlas labels.

Never collect a student’s clinical records, accommodation documents, trauma narrative, immigration status, or aid documentation merely to generate a routing recommendation.

## Product rules

1. **Safety overrides personalization.** An emergency routing card comes before academic planning, calendar, or resource recommendations.
2. **Route, do not diagnose.** Accept a student’s stated need; provide the owner route and essential boundary. Do not infer a condition or level of risk.
3. **No false guarantees.** Support availability, appointments, aid, accommodation, approved absences, and emergency-fund decisions are capacity/eligibility dependent.
4. **Show the source owner and currentness.** Every card carries a live owner link and `source_checked_at`; instructions that depend on current hours/policy must be verified at use.
5. **Keep categories distinct.** Emergency safety, clinical care, counseling, reporting, confidential advocacy, wellness coaching, academic absence, and basic-needs navigation are separate routes.
6. **Escalate safely.** A third-party concern can use Care Referral if non-emergency; imminent risk uses emergency services.

## Minimal data contract

```text
SupportRoute
  need_category: emergency | medical | counseling | advocacy | basic_needs |
                 accommodation | academic_impact | wellness
  owner: UNC unit
  source_url
  source_checked_at
  urgency: emergency_now | urgent_owner_check | routine
  privacy_label: owner_published | not_claimed
  eligibility_or_capacity: unknown | owner_determined
  claims_not_supported: [diagnosis, treatment, award_guarantee, accommodation_guarantee]
```

## Source register and refresh guidance

1. [UNC Dean of Students](https://dos.unc.edu/) — current entry point for student support, care response, basic needs, absence, and emergency-fund routes. Recheck each process live.
2. [CAPS](https://caps.unc.edu/) — current counseling/urgent-support owner. Verify hours, access process, and after-hours information at use time.
3. [Campus Health](https://campushealth.unc.edu/) — current medical-care owner. Verify current scheduling/after-hours instructions at use time.
4. [University Compliance Accommodations](https://compliance.unc.edu/) — current individualized accommodation route. Recheck platform/process requirements each request.
5. [VPAS confidential support](https://vpas.unc.edu/confidential-support/) — scope-specific advocacy route; recheck contact/policy details live.
6. [Student Wellness](https://studentwellness.unc.edu/) — wellness/coaching and substance-safety policy routes. Do not infer current event/service capacity.

## Evidence limits

- The packet does not establish medical urgency, diagnosis, treatment, clinical confidentiality, legal rights, or an individual support outcome.
- Older UNC PDFs can help locate a service but must not replace the current owner page for hours, policies, capacity, or deadlines.
- Atlas should route the student to a real person/official service, not become the decision-maker in a safety, health, conduct, or accommodations matter.
