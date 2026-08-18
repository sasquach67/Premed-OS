# UNC money, financial aid, and payment: owner-route boundaries

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC financial owners. This is wayfinding, not financial, tax, legal, investment, borrowing, or affordability advice.

## Decision in one screen

Atlas can direct a student to the right current owner for a bill, payment, aid record, FAFSA/aid question, scholarship search, work-study, emergency support, or study-abroad funding. It must not calculate affordability, predict an award, recommend a loan, quote a historic payment deadline, or collect sensitive financial records.

| Student need | Official owner route | Safe action | Atlas must not claim |
|---|---|---|---|
| Understand a current bill/payment due date | [Student Accounts and University Receivables](https://cashier.unc.edu/) and authenticated student account | Check the current bill, term, payment instructions, and deadline in the owner system. | A past date/amount applies, a payment is posted, or a late fee/hold outcome. |
| Ask about aid, FAFSA, verification, grants, loans, scholarships | [Office of Scholarships and Student Aid](https://studentaid.unc.edu/) | Use the current aid-year process and the student’s authenticated record. | Eligibility, award amount, loan recommendation, verification outcome, or appeal result. |
| Look for UNC scholarships | [UNC Scholarships and Student Aid](https://studentaid.unc.edu/) | Follow the current scholarship/search/application owner route. | That an award is open, renewable, sufficient, or a match for the student. |
| Use Federal Work-Study | [UNC Work-Study](https://studentaid.unc.edu/types-of-aid/work-study/) plus [Handshake](https://careers.unc.edu/students/handshake/) | Confirm current aid award, then inspect live eligible positions and hiring terms. | That a work-study award creates a job or that a job accepts it. |
| Unexpected expense/basic-needs financial issue | [Student Emergency Fund](https://dos.unc.edu/student-support/student-emergency-fund/) and [Basic Needs Support](https://dos.unc.edu/student-support/basic-needs-support/) | Use current owner criteria/contact route. | Grant amount, approval, timing, repayment, or coverage. |
| Study abroad financing question | [UNC Study Abroad](https://studyabroad.unc.edu/) and financial-aid owner | Check the specific program’s current cost/funding/approval routes. | That aid transfers, a program is affordable, or funding will be available. |

## Separate the financial facts

The following should never be collapsed:

- **Bill/balance/payment status** — Student Accounts/authenticated account.
- **Aid eligibility/award** — financial-aid owner and student’s current record.
- **Scholarship opportunity** — owner-published opportunity, distinct from award decision.
- **Work-study** — a financial-aid mechanism, distinct from a job offer/hiring decision.
- **Emergency support** — capacity/criteria-dependent support, distinct from routine financial aid.
- **Study-abroad costs/funding** — program-specific and approval-dependent, distinct from ordinary term billing.

Atlas should render the relevant route plus a “check current owner record” instruction, not manufacture a combined affordability score.

## Privacy and advice boundary

Do not collect or retain tax returns, FAFSA fields, financial-aid award letters, banking details, loan account information, Social Security numbers, scholarship essays, family financial context, or immigration documents as corpus data. If a student wants personal planning support, it belongs in private user-controlled data with clear consent—not in the shared evidence corpus.

The product may explain that an owner controls a process; it must not tell a student whether to borrow, how much they can afford, how to file taxes, or how an aid decision will resolve.

## Product rules

1. **No evergreen payment dates or amounts.** Billing and aid cycles change; use live owner links.
2. **No award prediction.** Eligibility and amounts are institution/process-specific.
3. **No false work-study equivalence.** Award, eligible job, application, and hire are separate facts.
4. **Emergency funds are not guaranteed.** Present as a confidential/dignified owner route, with current criteria checked live.
5. **Study-abroad funding remains program-specific.** Do not combine generic aid advice with a particular program’s cost/eligibility.
6. **No financial verdicts.** Avoid “affordable,” “worth it,” or “you should take loans” claims.

## Minimal data contract

```text
FinancialRoute
  owner: Student_Accounts | Financial_Aid | scholarships | work_study | Dean_of_Students | Study_Abroad
  source_url
  source_checked_at
  route_kind: bill | aid_process | scholarship | job_mechanism | emergency_support | program_funding
  privacy_level: sensitive
  current_check_required: true
  claims_not_supported: [award_prediction, affordability, loan_advice, payment_confirmation]
```

## Source register and refresh rules

1. [UNC Student Accounts and University Receivables](https://cashier.unc.edu/) — bills/payment owner; live account controls individual status.
2. [UNC Scholarships and Student Aid](https://studentaid.unc.edu/) — current aid/scholarship owner; recheck each aid year.
3. [UNC Work-Study](https://studentaid.unc.edu/types-of-aid/work-study/) — current work-study mechanism owner.
4. [UNC Handshake](https://careers.unc.edu/students/handshake/) — live employment listings, not a guarantee of eligible funding/hire.
5. [Dean of Students Emergency Fund](https://dos.unc.edu/student-support/student-emergency-fund/) and [Basic Needs Support](https://dos.unc.edu/student-support/basic-needs-support/) — current support routes.
6. [UNC Study Abroad](https://studyabroad.unc.edu/) — program/funding route; current program information controls.

## Evidence limits

- This packet gives no individual billing deadline, balance, award, scholarship amount, work-study position, loan recommendation, or study-abroad affordability conclusion.
- All amounts, dates, availability, and eligibility are current-owner facts and must be checked live.
