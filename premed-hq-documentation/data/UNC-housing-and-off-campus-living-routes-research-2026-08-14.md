# UNC housing and off-campus living: routing and decision boundaries

**Research date:** 2026-08-14 (America/New_York)  
**Scope:** Official UNC owners and UNC-linked housing resources. This is a navigation packet, not real-estate, legal, safety, tenancy, or financial advice.

## Decision in one screen

Atlas can help a student choose the right **owner route** for on-campus housing, off-campus discovery, a roommate concern, or a lease question. It cannot promise a particular building, room, roommate, listing, rent, landlord outcome, reassignment, accommodation, or lease result. Housing availability and terms are live, individual, and time-sensitive.

| Need | Official route | Safe next action | Atlas must not infer |
|---|---|---|---|
| Apply for or view on-campus housing | [Carolina Housing](https://housing.unc.edu/) → current MyHousing route | Follow the current application/assignment instructions in the authenticated portal. | That a particular hall/room/roommate is available or assigned. |
| Need off-campus listings or roommates | [UNC Off-Campus Housing Search](https://offcampushousing.unc.edu/) | Create/use the current UNC-linked account and inspect each current listing directly. | That a listing is accurate, affordable, safe, open, university-vetted, or suitable. |
| Need help navigating off-campus living | [Off-Campus Student Life](https://offcampus.unc.edu/) | Use current education/advising/resources; identify budget, commute, lease, and roommate questions. | That the office can choose a property or resolve a private-landlord dispute. |
| Considering a lease | [Carolina Student Legal Services](https://dos.unc.edu/student-support/student-legal-services/) and OCSL materials | Read the exact lease; ask the owner legal-service route about current access before signing. | Legal advice from Atlas, a lease’s enforceability, or landlord behavior. |
| On-campus roommate conflict or possible room change | Carolina Housing / current Residence Life or Community Director route | Use the current housing contact/process; document only what the owner asks for. | That a reassignment is automatic, immediate, or available. |
| Housing disability/pregnancy/religious accommodation | [Student/Applicant Accommodations](https://compliance.unc.edu/) plus Housing’s current process | Begin the individualized accommodation process early and consult current housing instructions. | A single-room assignment, timing, or any specific accommodation. |
| Urgent safety issue | **911** or UNC Police **919-962-8100** | Seek emergency assistance first. | That a housing portal/request is an emergency channel. |

## On-campus housing: what the public rules establish

The current Carolina Housing site and MyHousing portal are the owner sources for application, contract, assignment, and move-in information. On-campus housing is governed by the **current** contract and related housing standards—not older PDFs, past housing calendars, or an Atlas summary. A prior-year contract can identify the kind of issues that housing controls (eligibility, assignments, payment, changes), but it cannot supply current deadlines or enforceable terms. [Carolina Housing](https://housing.unc.edu/) · [MyHousing](https://unc.starrezhousing.com/StarRezPortalX)

The safest product wording is: **“Check your current MyHousing status and the applicable housing contract.”** Do not convert historical lottery/application/assignment dates into an upcoming-cycle prediction.

## Off-campus housing: discovery is not endorsement

UNC’s Off-Campus Student Life provides education, advising, and resources for students living off campus. Its UNC-linked housing search is the official discovery route for current listings and roommate search. Treat a listing as the poster’s current representation, not as a fact verified by Atlas or a guarantee by UNC. [Off-Campus Student Life](https://offcampus.unc.edu/) · [Off-Campus Housing Search](https://offcampushousing.unc.edu/)

Before signing, a student should inspect the property and exact lease, confirm practical constraints directly with the owner/landlord, and use the legal-service route for questions about the agreement. Atlas may provide a checklist of questions but must not decide legal rights, habitability, security-deposit liability, joint-and-several responsibility, or a dispute outcome.

## Roommates and conflicts

For **off-campus** roommates, OCSL publishes planning templates that can help students discuss rent, utilities, guests, cleaning, and communication. They are planning tools—not legal rulings or a substitute for the lease. [OCSL roommate agreement](https://offcampus.unc.edu/wp-content/uploads/2022/05/Roommate_Agreement.pdf)

For **on-campus** roommate conflict, the current Housing/Residence Life process controls. Do not promote a historical contract’s reassignment dates or conditions as current. If there is an immediate safety risk, use emergency channels; otherwise route to the current Housing/Community Director process and state that availability/outcome is owner-determined.

## Product rules

1. **No rent, safety, or availability score from public listings.** A building or neighborhood page is a discovery pointer, not a recommendation score.
2. **Source every live claim.** Store `source_checked_at`, listing/portal URL, and owner. Suppress stale listing cards rather than showing them as open.
3. **No lease interpretation.** Atlas may say “read the lease and consult current Student Legal Services access,” never “you can break this lease” or “you are protected.”
4. **Housing accommodation is individualized.** Keep accommodation request, housing assignment, and medical documentation out of normal Atlas research/profile data.
5. **Separate normal conflict from immediate danger.** A roommate disagreement goes to housing/OCSL/legal routes; emergency danger goes to 911/UNC Police.
6. **No landlord or hall reputation synthesis from owner routes.** Lived-experience evidence belongs in the separate corpus and must remain contextual, dated, and distinct from policy.

## Minimal data contract

```text
HousingRoute
  owner: Carolina Housing | MyHousing | OCSL | Student Legal Services | Accommodations
  source_url
  source_checked_at
  route_kind: application | live_listing | education | conflict | legal_information | accommodation
  user_context_needed: [on_campus_status, term, lease_stage, urgency]
  availability: dynamic | owner_determined
  claims_not_supported: [room_guarantee, rent_claim, safety_claim, legal_conclusion]
```

## Source register and refresh rules

1. [Carolina Housing](https://housing.unc.edu/) — housing/contract owner. Recheck each cycle and before any application/assignment action.
2. [MyHousing Portal](https://unc.starrezhousing.com/StarRezPortalX) — authenticated live status/application surface; do not reproduce private status or application data.
3. [Off-Campus Student Life](https://offcampus.unc.edu/) — current education/advising owner for off-campus living.
4. [UNC Off-Campus Housing Search](https://offcampushousing.unc.edu/) — dynamic listings/roommate discovery. Do not scrape or cache as a permanent directory.
5. [Student Legal Services](https://dos.unc.edu/student-support/student-legal-services/) — current owner route for eligibility/access to student legal support. Verify scope and appointment availability live.
6. [University Compliance accommodations](https://compliance.unc.edu/) — individualized-accommodation owner. Verify current process before guidance.

## Evidence limits

- This packet does not state a current housing deadline, building availability, price, neighborhood safety level, landlord quality, contract interpretation, or roommate outcome.
- UNC-linked listing discovery is not a product endorsement or a warranty. Verify the current listing and property directly.
- Do not use an older housing contract or PDF to make a live promise; current contract and portal terms control.
