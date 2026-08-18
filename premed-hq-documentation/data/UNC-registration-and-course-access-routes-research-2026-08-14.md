# UNC registration and course access: live-owner routing

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC Registrar, ConnectCarolina, catalog, and advising routes. This is registration wayfinding, not a guarantee of enrollment, graduation progress, permission, or waitlist movement.

## Decision in one screen

Registration is a live, student-specific process. Atlas can direct a student to the correct owner for current enrollment appointments, course search, waitlists, holds, permissions, add/drop, transfer credit, or degree planning. It must not reuse prior-year dates, predict seat movement, or say an enrollment path will work for a particular student.

| Student need | Official owner route | Safe action | Atlas must not claim |
|---|---|---|---|
| Find current enrollment appointment/window | [ConnectCarolina](https://connectcarolina.unc.edu/) and [Registrar](https://registrar.unc.edu/) | Check the authenticated student record/current calendar. | That all students have the same time or a historic date applies. |
| Search for a course/section | ConnectCarolina current course search | Inspect live sections, capacity, restrictions, component pairing, and deadlines. | That a catalog course is currently offered or available. |
| Register, swap, drop, or change a schedule | ConnectCarolina plus current [Registrar calendar](https://registrar.unc.edu/academic-calendar/) | Follow current transaction/calendar instructions before the deadline. | A transaction will succeed, be consequence-free, or meet degree/application requirements. |
| Waitlist/closed/restricted course | Live section details and owning department | Read current section restrictions and department’s published request/permission route if any. | Waitlist movement, a permission number, or an exception. |
| Registration hold or advising issue | Current ConnectCarolina hold details and assigned academic/department advisor | Identify the stated hold owner; contact that owner. | Cause, removal timeframe, or that an unrelated office can clear it. |
| AP/IB/transfer/outside course question | [UNC Credit Evaluation](https://catalog.unc.edu/policies-procedures/credit-evaluation/) and Admissions/academic advisor | Confirm official posted equivalency and individual audit. | That a planned/test credit automatically posts or meets an outside school’s policy. |
| Need degree-plan confirmation | Degree audit + academic/department advisor | Compare current audit to catalog rules and live availability. | A public plan guarantees graduation timing. |

## Source hierarchy

1. **Live student record/ConnectCarolina** — controls individual appointment, holds, current sections, restrictions, capacity, and transaction status. [ConnectCarolina](https://connectcarolina.unc.edu/)
2. **Registrar academic calendar** — controls current published registration/add/drop timing and policy links. [Registrar academic calendar](https://registrar.unc.edu/academic-calendar/)
3. **Current catalog** — controls published course/degree/requisite rules. [UNC Undergraduate Catalog](https://catalog.unc.edu/undergraduate/)
4. **Owning department/advisor** — controls department-specific permission/advising routes and individual academic interpretation.
5. **Target professional program** — controls outside prerequisite acceptance; it is never determined by UNC registration alone.

## Waitlists, permissions, and restrictions

Closed, reserved, instructor-permission, department-restriction, prerequisite, co-requisite, and waitlist situations have different owners and may differ by section. Atlas should reveal the **live section’s stated constraint** and route to its owner. It must never present:

- “You will get off the waitlist.”
- “Email this person for a permission number” without an owner-published current route.
- “Take a different section and it will count the same.”
- “A seat opening means you are eligible.”

An academic advisor can help interpret a plan, but may not control a department’s live section restriction. A department may control a restriction but not a broader degree audit. Keep each routing decision explicit.

## Add/drop and consequences

Add/drop, withdrawal, grading, financial aid, visa/status, and degree-progress implications can be related but are not one rule. Atlas may tell a student to check the Registrar calendar and the relevant owner before making a change. It must not give an outcome prediction, legal/visa/financial-aid conclusion, or a generic “drop it” recommendation.

## Product rules

1. **Never hard-code registration dates.** Render current owner calendar links and, if a date is displayed, retain its source and academic term.
2. **Live section beats catalog.** Catalog shows course rules; ConnectCarolina shows the present enrollment context.
3. **No waitlist prediction.** Waitlist position/seat changes are not evidence of future access.
4. **Separate course access from degree completion.** Enrollment in a course does not itself prove it applies to a requirement.
5. **No automatic override navigation.** Route to the owner named in the live restriction/hold.
6. **Keep protected student information private.** Do not store holds, grades, audit exports, or enrollment history in corpus evidence.

## Minimal data contract

```text
RegistrationRoute
  owner: ConnectCarolina | Registrar | catalog | department | advisor | Credit_Evaluation
  source_url
  source_checked_at
  route_kind: appointment | live_section | schedule_change | hold | permission | credit_evaluation
  current_check_required: true
  claims_not_supported: [seat_guarantee, waitlist_prediction, deadline_guarantee, graduation_confirmation]
```

## Source register and refresh rules

1. [ConnectCarolina](https://connectcarolina.unc.edu/) — authenticated student-specific registration owner; current state only.
2. [UNC Registrar](https://registrar.unc.edu/) and [academic calendar](https://registrar.unc.edu/academic-calendar/) — current term policy/date owner; recheck every term.
3. [UNC Undergraduate Catalog](https://catalog.unc.edu/undergraduate/) — current published curriculum/requisite owner; record edition.
4. [UNC Credit Evaluation](https://catalog.unc.edu/policies-procedures/credit-evaluation/) — current policy source for UNC credit evaluation.

## Evidence limits

- This packet provides no individual registration time, course section, deadline, hold outcome, waitlist forecast, permission decision, or degree-completion determination.
- It does not establish a health-program prerequisite or advise a student to add/drop/withdraw.
