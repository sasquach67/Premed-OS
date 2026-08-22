# Atlas · Campus resources — decisions

**Status:** PROPOSED · design only, not cleared to build
**Source:** `atlas-campus-resources.html`
**Corpus:** `Atlas/atlas-research-corpus/research/UNC-P1-Assignment-to-Support-Router-01.md`; `premed-hq-documentation/data/UNC-academic-course-support-routes-research-2026-08-13.md`; `premed-hq-documentation/data/UNC-libraries-research-tech-and-study-access-routes-research-2026-08-14.md`

## What this draws

An Atlas destination that turns a student’s immediate block into a precise,
official outbound route. It is not an all-campus catalog, a booking product, or
a recommendation engine. The first release covers the highest-confidence
academic routes and presents broader campus collections as directories to
explore.

It has three genuine treatments:

| Variant | Treatment | Appearance | Behaviour |
|---|---|---|---|
| **A · Route by need** | The selected default | Narrow left-side need chooser; two solid route cards at a time; a warm owner/boundary note closes the result. | Select a block such as space, concepts, writing, sources, or planning. Every card opens the owner’s live page. |
| **B · Browse directories** | Directory argument | A three-column directory index with four named official routes in each collection and a local filter. | Opens a named owner route, while making no claim that an appointment, listing, room, program, or eligibility is currently available. |
| **C · Use a course** | Contextual course argument | One course selector followed by a horizontal owner ladder: course team, current peer support, study-process support. | Makes the authority order explicit. It can configure course code/title later but must never infer a live tutor or office-hour slot. |

## Behaviour rules

- The user begins with **the kind of help needed**, not a search across raw
  campus names.
- Every route is an owner-verified outbound link. Dynamic facts—room access,
  reservation status, staffing, eligibility, current course coverage,
  appointment availability, hours, and costs—remain at the destination.
- The router always distinguishes **course authority** from support:
  instructor/TA owns prompt meaning, permitted tools, deadlines, grading and
  policy; tutoring/coaching can support learning but cannot grant an extension,
  certify an answer, or change a grade.
- Study-space requests begin at the UNC Libraries space directory. The app says
  “check this space’s live page,” never “reserve this room.”
- Course-aware cards are conditional routes. A listed Biology, Chemistry, Math,
  or Physics support program is never shown as universally available for all
  sections or terms.
- The directory treatment names owner-verified routes for wellbeing/basic needs,
  opportunities/careers, service/community, money/logistics, and spaces/research.
  It has no generic “browse” dead ends; every named item opens its current owner
  page and remains subject to that page’s live rules.
- No in-app booking, no imported live availability, no ranking, no opaque
  recommendation score, and no vendor/marketplace links merely because students
  commonly use them.

## Initial verified routes represented

- UNC Libraries space directory; library research consultations and research
  support.
- Learning Center Peer Tutoring, Academic Coaching, and STEM resources.
- Biology tutoring / Bio Peer Mentoring route (section and course dependent).
- Writing Center.
- UNC Advising and Student Success.
- Odum Institute is a method/data-help route, not an assignment-answer route.
- Basic Needs Support, Student Emergency Fund, Heels Care Network, Student
  Wellness, OUR, University Career Services, Handshake, CCPS, GivePulse,
  Student Aid, Work-Study, and UNC Transit are directory routes with their
  individual owner and eligibility boundaries intact.

## Appearance rules

- Atlas gets its own blue, layered banner; all directory cards are **solid with
  depth**. No glass outside the banner context.
- A uses intentionally few cards because the user already narrowed the need.
  B uses labelled folders so “more directories” remains readable instead of
  becoming an undifferentiated resource wall.
- The yellow left rule is a boundary, not an alert: it explains what the linked
  office owns and what it cannot promise.
- All cards show the same quiet “Open current route” handoff. It directs the
  user without pretending the action occurred inside Premed OS.

## Before implementation

This is an Atlas / campus-resource surface. `BUILD-MANIFEST.md` currently says
Atlas and campus prospecting have no mockup and no build authorization. Andy
must select a treatment and add a `Build? = YES` manifest row before any `src/`
work begins. The implementation brief must also name the durable dataset and
refresh policy for each route; the mockup alone is not permission to hardcode a
long-lived directory.
