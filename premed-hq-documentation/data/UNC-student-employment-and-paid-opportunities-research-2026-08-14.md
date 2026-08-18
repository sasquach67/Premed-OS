# UNC student employment and paid opportunities: safe routing rules

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Current, first-party UNC sources. This is a wayfinding packet, not a mirror of job listings or an employment-eligibility determination.

## Decision in one screen

Atlas may point a current UNC student to **Handshake** for current student-facing jobs, internships, career events, and applications; to the **Office of Scholarships and Student Aid** for Federal Work-Study eligibility; and to **University Career Services (UCS)** for search strategy and application materials. It must not present an old JobX/"IRIS" reference as a current system, copy a dynamic listing into a permanent catalog, or imply that a job is open, clinical, schedule-compatible, paid, or available to a particular student.

The key distinction is:

| Student need | Owner route | What Atlas can say |
|---|---|---|
| "I need a current campus or local role" | [UNC Handshake](https://careers.unc.edu/students/handshake/) | Sign in with the UNC account and inspect the live listing, employer, hours, pay, application deadline, and requirements. |
| "Can work-study fund this role?" | [Federal Work-Study at UNC](https://studentaid.unc.edu/types-of-aid/work-study/) | Work-study is financial aid with eligibility and a remaining-award constraint; confirm it in the student's current aid record and with the hiring unit. |
| "I need help finding/applying for work" | [University Career Services](https://careers.unc.edu/) | UCS is the campus career-routing and preparation owner; current appointment/event availability must be checked live. |
| "I am an international student" | [International Student and Scholar Services](https://isss.unc.edu/) | Employment authorization is status- and circumstance-specific. Use ISSS before accepting or beginning work; do not infer authorization from a job listing. |
| "I want paid undergraduate research" | [Office for Undergraduate Research opportunities](https://our.unc.edu/find/opportunities/) | Use the live owner database and its filters; a research profile or lab page is not a current opening. |

## What the systems mean — and do not mean

### Handshake

UNC identifies Handshake as its online career-management platform for students to search jobs/internships and register for career events. It is the correct live-search route for opportunities, not a durable dataset for Atlas. Individual postings change, may be restricted to authenticated users, and must be read as published by the employer at the time of application. [UNC Handshake](https://careers.unc.edu/students/handshake/) · [UCS recruiting policies](https://careers.unc.edu/wp-content/uploads/2023/05/UCS-RECRUITING-POLICIES-PROCEDURES-FOR-Fall-2023_SPRING-2024-_UPDATED_May_15_2023.pdf)

UCS’s employer-facing policy shows that postings undergo institutional review and may include part-time, temporary/seasonal, internship, on-campus non-work-study, volunteer, and fellowship opportunities. That policy is useful provenance for the platform’s role; it is **not** proof that a particular posting is vetted for fit, still open, or appropriate for every student. [UCS recruiting policies](https://careers.unc.edu/wp-content/uploads/2023/05/UCS-RECRUITING-POLICIES-PROCEDURES-FOR-Fall-2023_SPRING-2024-_UPDATED_May_15_2023.pdf)

### Federal Work-Study

Federal Work-Study is need-based financial aid, not a job assignment or a general wage subsidy. UNC’s aid office directs students to review their own award and then locate/apply for an eligible position. A department must still choose to hire the student, the role must qualify, and a student cannot exceed the available award/conditions. Recheck the current aid page and the student’s aid record before relying on this route. [UNC Federal Work-Study](https://studentaid.unc.edu/types-of-aid/work-study/)

### Current-system correction

Older UNC material and prior corpus notes refer to **JobX** and sometimes “IRIS.” This pass found no current official UNC student-facing employment system under either name. Do not route users to them or build new product logic on that terminology. Use the current official Handshake, aid-office, department, and OUR routes above unless UNC publishes a replacement.

## Scenario playbook

| Situation | First action | Verify before acting | Never infer |
|---|---|---|---|
| Need a flexible campus job | Search Handshake live; filter only as the platform allows. | Employer, role duties, weekly hours, location, pay, deadline, and onboarding. | That “part-time” means schedule-compatible or that a position is currently hiring. |
| Awarded work-study | Confirm the current award in the student’s aid record; ask the hiring unit whether it can hire work-study students. | Award balance, eligibility period, role funding mechanism, start date. | That the award automatically creates a job or that every campus job accepts it. |
| Need resume/interview help | Use UCS’s current advising/workshop route. | Appointment availability and the office’s current instructions. | That advice guarantees an interview or offer. |
| Looking for research pay | Search the live OUR database plus owner-run program pages. | Whether the listing is paid, credit-bearing, volunteer, work-study eligible, term-specific, and still active. | That a faculty profile or lab name has an opening. |
| International/F-1 status concern | Contact ISSS before beginning employment or accepting a role. | Authorization category and timeline for that individual. | That on-campus, unpaid, remote, or short-term work is automatically allowed. |
| Wants a clinical job | Use the employer’s current job page and verify duties/credential requirements. | Role scope, certification, background checks, shift demands, and employer status. | That a role is clinical merely from its title, or that it supplies patient contact. |

## Product rules

1. **Store links, not scraped openings.** An Atlas “opportunity” card should be a time-bounded pointer to the owner’s live page with `source_checked_at`, not a copied posting.
2. **Separate opportunity from eligibility.** `listed_in_handshake`, `work_study_eligible`, `student_is_eligible`, and `hiring_decision` are distinct fields. The first may be observable; the others require protected/current context or employer action.
3. **Show exact source status.** Use “Check live listing” rather than “Apply now” unless the owner page was just checked and the product has an authorized integration.
4. **Preserve factual role details only.** If an employer states hours, credentials, location, pay, or term, preserve it with retrieval date and source. Do not synthesize a pre-med value score.
5. **Protect private aid and immigration information.** Atlas may route a user to the relevant UNC office but should not collect/retain award details or immigration documents for this purpose.

## Minimal record contract

```text
OpportunityRoute
  owner: Handshake | UNC aid office | OUR | department | employer | ISSS | UCS
  source_url
  source_checked_at
  route_kind: live_listing | eligibility | advising | program_information
  status: dynamic_check_required | authenticated | term_specific | current_when_checked
  constraints: [eligibility_unknown, capacity_unknown, schedule_unknown, ...]
  claims_not_supported: [opening_guaranteed, fit_guaranteed, clinical_credit, ...]
```

## Source register and refresh rules

1. [UNC Handshake](https://careers.unc.edu/students/handshake/) — student access and live search route. Retrieve at use time.
2. [UNC Federal Work-Study](https://studentaid.unc.edu/types-of-aid/work-study/) — aid/eligibility owner. Recheck each aid year and against the student’s current record.
3. [University Career Services](https://careers.unc.edu/) — advising and current events. Recheck appointment/event availability live.
4. [UNC International Student and Scholar Services](https://isss.unc.edu/) — authorization routing. Treat guidance as individualized and current-policy dependent.
5. [UNC Office for Undergraduate Research opportunities](https://our.unc.edu/find/opportunities/) — research-opportunity owner. Its live listings and filters are time-sensitive; follow its reuse boundary.
6. [UCS employer recruiting policies](https://careers.unc.edu/wp-content/uploads/2023/05/UCS-RECRUITING-POLICIES-PROCEDURES-FOR-Fall-2023_SPRING-2024-_UPDATED_May_15_2023.pdf) — platform/provenance context, retrieved 2026-08-14. Historical policy document; do not treat its particular operational details as current without rechecking.

## Evidence limits

- This packet does not identify any current job opening, work-study award, wage, schedule, or department hiring practice.
- It does not replace a student’s aid record, ISSS determination, background/onboarding review, or an employer’s decision.
- The strongest student-facing interface is authenticated and dynamic, which is precisely why Atlas should send the student to the owner rather than reproduce a stale directory.
