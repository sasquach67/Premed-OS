# UNC Health student access: volunteering, shadowing, employment, training, and research

**Research date:** 2026-08-13  
**Scope:** First-party UNC Health / UNC Hospitals / UNC Wellness pages and UNC Health policy documents only.  
**Purpose:** A source-of-truth packet for Premed OS/Atlas routing. It answers *which route matches the student’s goal*; it does not turn a volunteer placement into clinical employment, a shadow visit into a formal rotation, or a listed opportunity into a guaranteed opening.

## Executive routing rule

| Student wants to… | Route | What it is | What it is **not** |
| --- | --- | --- | --- |
| Serve patients/visitors in a structured unpaid support role | UNC Hospitals undergraduate/graduate volunteer program | Officially enrolled volunteer service, subject to a time commitment, intake, health requirements, and placement capacity | Shadowing, an internship, paid employment, or hands-on patient care |
| Observe a particular clinician/department | UNC Hospitals Shadow Program | A department-sponsored observation visit, capped and compliance-gated | A placement service—Volunteer Services explicitly does not find preceptors or handle clinicals/internships |
| Hold a paid clinical/support job | UNC Health Careers | Employment application to a currently posted role | Volunteer service, observation, a clinical rotation, or a promise that any particular title is open |
| Fulfill an academic clinical rotation / formal training requirement | Student Trainee / affiliation route | A formal program placed under an affiliation agreement | The public shadow process or a general volunteer application |
| Work on a research project | UNC undergraduate-research access routes | A separately sourced lab/research route | A Volunteer Services or Shadow Program placement |

**Product rule:** Store `routeType` separately (`volunteer`, `shadow`, `employment`, `formal_training`, `research`, `EMS`) and never infer a route from the location or a broad phrase such as “hospital experience.”

---

## 1. Undergraduate and graduate volunteer program — Chapel Hill/off-site areas

**Current status when checked:** the **Academic Year 2026–27 Chapel Hill/off-site application is closed because it reached maximum capacity.** This is a status fact for 2026-08-13, not a prediction about the next cycle. [Official undergraduate/graduate page](https://www.uncmedicalcenter.org/uncmc/support/volunteer-services/ug-volunteers-/)

### Who it is for

- Degree-seeking undergraduate or graduate students; students **do not have to attend UNC–Chapel Hill**.
- Must have completed **two semesters of college/university before volunteering**.
- The service owner calls the work “meaningful and educational volunteer opportunities” aligned with clinical and non-clinical department needs. That wording does **not** authorize a claim of patient care, shadowing, clinical training, or employment.

### Published 2026 time commitments

| Program | Commitment | Published application window/status |
| --- | --- | --- |
| Summer 2026 | Entire May–August program; two 3-hour shifts/week; at least 22 shifts and 65 hours | March 16–31, **or until maximum capacity** |
| Academic Year 2026–27 | Both fall and spring; at least 25 hours and 13 shifts **per semester** | July 1–14, **or until maximum capacity**; page now says closed/reached capacity |

For the 2026–27 academic-year program, the published service dates are Fall **August 24–November 29** and Spring **January 6–April 27**. All dates, windows, and commitment rules are cycle-specific and must be rechecked against the owner page before display.

### Intake/onboarding route

1. Read the official [Volunteer Areas](https://www.uncmedicalcenter.org/uncmc/support/volunteer-services/opportunities/) page.
2. Use the application link **only when the owner page shows an open window**.
3. The application allows an interview for a desired area, but the page says a first-choice placement is **not guaranteed**.
4. After application, complete the owner’s intake path and provide health/TB documentation as required. UNC Health warns this can take several weeks.
5. Do not describe a student as an active UNC Health volunteer until Volunteer Services has officially accepted/enrolled them. UNC Health’s non-employed-learner policy makes acceptance/enrollment a condition before performing volunteer tasks.

### What a volunteer may be routed toward

The official areas page lists examples such as wayfinding, patient/visitor support, patient rounding, clerical support, stock/supply work, and certain rehabilitation-support tasks. It also says it cannot guarantee a listed area is open. Several named postings were explicitly closed on the page when retrieved (for example, Oncology Volunteer Navigator, Cuddle & Play, Hospital School Tutor, and Hillsborough Oncology).

**Safe Atlas wording:** “Listed volunteer area; availability must be confirmed by Volunteer Services.”  
**Unsafe wording:** “Open clinical volunteer position,” “shadowing in [department],” or “direct patient-care placement,” unless the official owner page itself says that.

### Location boundary

The Volunteer Services home page covers UNC Hospitals in Chapel Hill, Hillsborough, Youth Behavioral Hospital in Butner, Chatham Hospital, and surrounding clinics/off-site areas. Hillsborough is an alternate UNC Hospitals campus; a student who already applied to Chapel Hill should tell the coordinator their site preference instead of submitting a second application.

### Source and refresh facts

| Official source | URL | Retrieved | What it establishes | Change cadence / reuse boundary |
| --- | --- | --- | --- | --- |
| Undergraduate/graduate volunteers | [UNC Hospitals](https://www.uncmedicalcenter.org/uncmc/support/volunteer-services/ug-volunteers-/) | 2026-08-13 | Eligibility, cycle dates, commitment, current “closed/reached max capacity” status, process | Living owner page. Recheck before every cycle and before showing availability. Link and brief factual routing are appropriate; do not copy its full opportunity list into an unsourced permanent catalog. |
| Volunteer Services home | [UNC Hospitals](https://www.uncmedicalcenter.org/uncmc/support/volunteer-services/) | 2026-08-13 | Scope, student categories, contact | Living owner page; recheck annually/when an intake window changes. |
| Volunteer Areas | [UNC Hospitals](https://www.uncmedicalcenter.org/uncmc/support/volunteer-services/opportunities/) | 2026-08-13 | Activity descriptions, availability cues, explicitly closed areas | Living owner page; treat every area/status/hours field as volatile. Store source URL and retrieval date; do not state an area is available unless the page does. |
| Hillsborough volunteers | [UNC Hospitals](https://www.uncmedicalcenter.org/uncmc/support/volunteer-services/hillsborough-hospital-volunteers/) | 2026-08-13 | Campus relationship and no-duplicate-application instruction | Living owner page; recheck each application cycle. |
| Mandatory annual training policy | [UNC Health PDF](https://www.unchealth.org/pdfs/patient-forms/pdf-system-2025-Non-Employee-Policy.pdf) | 2026-08-13 | Volunteer definition; acceptance/enrollment; non-employed learner classification | Policy PDF effective/revised 2025-02 and marked next review 2026-02. Useful policy evidence but its review date has passed; do not assume no change—recheck for an updated policy before operational use. Copyrighted material: quote minimally and link. |

---

## 2. UNC Hospitals Shadow Program — actual public pathway

**Finding:** UNC Hospitals does publish a current Shadow Program page for **UNC Medical Center–Chapel Hill, UNC Hillsborough Campus, and UNC Health clinics in Chapel Hill/Hillsborough**. It is a real route, but it is **not a matching service**: the observer must first identify a preceptor/department, and the preceptor submits the request.

### Entry conditions and scope

- Observation only: the public page says the program does **not** take requests for clinicals or internships.
- At least **18 years old**.
- Maximum **8 days total per calendar year**.
- Not permitted if the shadow visitor is the preceptor’s family member/relative.
- Limits apply across departments, not eight days per department.
- The published office cannot process UNC affiliate hospitals or clinics outside its listed Chapel Hill/Hillsborough footprint (examples given: UNC REX, UNC Health Johnston, UNC Health Wayne). Those owners may have different processes; students must contact them directly.
- The page temporarily says no new requests are processed **August 15–20** because of undergraduate-volunteer onboarding. Treat that as a recurring-but-unconfirmed blackout until rechecked.

### Who initiates the request

1. Student identifies a preceptor/department.
2. **Preceptor**, not the student, submits the official Shadow Visitor Request Form at least **one business week (Monday–Friday)** before the requested date.
3. The student receives confirmation/next steps, completes the required category-specific compliance documentation, and submits it on time.
4. Volunteer Services reviews materials, then issues the shadow badge only after requirements are satisfied.

The page says requests under one week are not processed, review can take up to five days, and shadow badges are generally available about three business days after complete documents are received and verified. These are planning buffers, **not guarantees**.

### Requirements vary by visitor category

| Visitor category | Owner-page requirements stated | Do not infer |
| --- | --- | --- |
| NC/out-of-state U.S. shadow visitor | Compliance module + documentation specified by confirmation email; page says submit attestation/influenza documents at least seven days in advance | That every health record requirement is identical for all visits—follow the live confirmation email |
| International clinician/student | Immunizations/TB testing + compliance modules; official documentation/translation requirements; no relative may complete the verification form | That this route applies to domestic undergraduates |
| Current UNC Health employee/current volunteer | Email the Shadow Program after a request is submitted; even active volunteers use a shadow badge for observing | That an employee/volunteer badge by itself authorizes shadowing |
| Prospective UNC Hospitals employee offered a shadow visit | Compliance modules only under the public page’s stated exception | That the exception is a general pre-med route—owner page describes it as tied to an employment process |

### Policy boundary

UNC Health’s 2025 non-employed-learner policy defines a shadow as an individual **not** under a formal affiliation agreement who observes UNC Health workforce members under continuous sponsoring-department supervision. A shadow may not perform patient care and may only observe.

The public Shadow Program page is more current operational guidance than the 2022 “Shadow Students or Visitors” policy copy. The older policy is still useful for underlying safeguards (sponsoring department, registration, HIPAA/immunization/badge conditions), but it is marked for review in 2025. When the pages differ in practical details, route users to the 2026 public Shadow Program page and ask the owner to resolve anything unclear.

### Current-source table

| Official source | URL | Retrieved | What it establishes | Change cadence / reuse boundary |
| --- | --- | --- | --- | --- |
| Shadow Program | [UNC Hospitals](https://www.uncmedicalcenter.org/uncmc/support/volunteer-services/shadowing/) | 2026-08-13 | Current operational route, footprint, age cap, 8-day cap, preceptor-led request, category-specific onboarding, contacts, temporary blackout | Living owner page. Recheck before advising action and each planned visit. Link/routing only; do not cache personal forms or health documents. |
| Shadow Students or Visitors policy | [UNC Medical Center PDF](https://www.med.unc.edu/ortho/wp-content/uploads/sites/406/2024/03/Shadow-Students-or-Visitors-Policy-Oct-2022.pdf) | 2026-08-13 | 8-day maximum, sponsored/escorted observation, observation-only, privacy/immunization/badge principles | Copy effective 2022-10; next review shown as 2025-10. Treat it as supporting policy, not current workflow if it conflicts with owner page. Copyrighted—minimal quote/link only. |
| Mandatory training policy | [UNC Health PDF](https://www.unchealth.org/pdfs/patient-forms/pdf-system-2025-Non-Employee-Policy.pdf) | 2026-08-13 | Current 2025 definition of shadow vs. formal student vs. volunteer; annual compliance framework | Policy says next review 2026-02; refresh before making a firm compliance claim. |

---

## 3. Employment, formal training, research, EMS — intentionally separate lanes

### Paid UNC Health work

The official [UNC Health Careers portal](https://jobs.unchealthcare.org/) is the only current owner source in this packet for paid roles. It lists a dynamic job search, job families, and online application process. **This packet does not declare any particular MA, CNA, EMT, sitter/observer, scribe, technician, or clinical-research role open**, because those postings change and eligibility is role-specific.

Use a live posting’s job ID, facility, work assignment, required credentials, and date checked before Atlas shows an opening. A volunteer or shadow record must never be converted to employment status.

### Formal clinical training / rotations

UNC Health defines a student/student trainee as someone enrolled in a formal program or employed by an organization that has an affiliation agreement (or similar written agreement) and has placed the student at UNC Health to fulfill that program’s requirements. This is distinct from an observer. **The Shadow Program explicitly does not process clinicals/internships.**

Therefore, for credit-bearing placements, advise the student to start with their program’s clinical coordinator—not Volunteer Services and not an individual preceptor form.

### Undergraduate research

Research is out of scope for this specific packet and stays routed to [UNC undergraduate-research access research](UNC-undergraduate-research-access-research-2026-08-13.md). Research work is not shadowing, volunteering, or clinical training by default; classify based on actual role and affiliation.

### EMS

No EMS employment/training program is claimed here. UNC Health’s hospital volunteer and observer pages are not evidence of EMT education, EMS credentialing, or a student EMS position. Keep EMS as its own future source packet.

### Narrow additional UNC Health route: UNC Wellness internship

UNC Wellness at Meadowmont publishes a **clinical exercise/medical fitness internship**, not a hospital shadow program. It is unpaid, six to twelve weeks, minimum five hours/week, gives priority to students needing credit, and says only two students are selected each semester. Its listed application deadlines are February 15 (summer), May 15 (fall), and October 15 (spring). This is an official, narrow route for students interested in medical fitness—not a general clinical placement and not evidence of hospital patient care.

Source: [UNC Wellness employment/internship page](https://uncwellness.com/about-us/employment/) (retrieved 2026-08-13; living page—recheck dates/capacity before using).

---

## 4. Data model / display guidance

### Store

```ts
type UNCHealthOpportunity = {
  routeType: 'volunteer' | 'shadow' | 'employment' | 'formal_training' | 'research' | 'ems'
  owner: 'UNC Hospitals Volunteer Services' | 'UNC Health Careers' | string
  locationScope: string[]
  status: 'open' | 'closed' | 'capacity_reached' | 'listed_no_opening_guarantee' | 'unknown'
  statusCheckedAt: string
  eligibility: string[]
  commitments: string[]
  onboardingRoute: string[]
  sourceUrl: string
  sourceRetrievedAt: string
  sourceCadence: 'living_page' | 'annual_cycle' | 'policy'
  accessBoundary: string
}
```

### Student-facing routes (plain language)

- **“I want to volunteer at UNC Hospitals.”** → Show whether the current student window is open/closed; show two-semester eligibility and full commitment before an application link.
- **“I want to shadow at UNC Health.”** → Start with “Find a clinician/department who agrees to host you.” Then explain that the *preceptor* submits the request; do not make the student hunt for a nonexistent self-service placement application.
- **“I need clinical hours / a paid job.”** → Send to current UNC Health Careers results and present credentials/shift/role requirements only from each live posting.
- **“I need an academic rotation.”** → Route to the student’s program coordinator and affiliation process.

### Do not display or infer

- “Volunteer = clinical hours.” Categorization depends on duties and the application service; that is outside this owner-page evidence.
- “Volunteer = shadowing.” UNC’s own public pages separate them.
- “Shadowing = hands-on clinical experience.” UNC says shadow visitors only observe.
- “Listed volunteer area = opening.” The official page explicitly says it cannot guarantee openings; some listed areas are marked closed.
- “UNC student required.” The undergraduate/graduate page says the student need not attend UNC–Chapel Hill.
- “Any UNC Health location uses this shadow process.” The owner page expressly limits its approval footprint.

---

## 5. Gaps deliberately left open

1. **Future student-volunteer dates after 2026–27:** not yet published in the reviewed current cycle. Do not invent recurring dates from one cycle.
2. **Specific hourly patient-contact intensity:** official role descriptions are not a measurement of contact time. Preserve role description; do not rate it as “clinical enough.”
3. **Individual paid role availability:** use the live Careers portal; no static list belongs in Atlas.
4. **Current policy revision after displayed next-review dates:** request an updated policy copy if a compliance decision relies on it.
5. **EMS/CNA/MA/clinical-research employment pathways:** need separate source packets with credential/licensure and dynamic-posting evidence.

