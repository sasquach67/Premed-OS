# Research prompts — School List open data gaps (Aug 2026)

**What this file is.** Six pasteable deep-research prompts, one per open data gap in School List. Each produces a **research packet — evidence, not a ruling.** Nothing returned here may be promoted into a product decision or into `data/med-schools.json` without an explicit ruling, per `tabs/08-school-list.md` §1.

**House rules every prompt below inherits** (from `implementation/reference-sources.md` §1 and `§5`):

- **Primary sources first** — the application service itself (AAMC / AACOM / TMDSAS), the school's own admissions page, or the accreditor (LCME / COCA). Consulting blogs and forums are **orientation only, never a citation.**
- **Every fact carries its URL and an access date.** A fact without a source is not a finding.
- **Mark uncertainty explicitly** — `confidence: low` plus a note beats a confident guess.
- **Report non-findings.** "No official source states this" is a real and useful result. Do not fill the gap with a plausible number.
- **Never republish forum or consulting-blog text.** `implementation/research-prompts/community-lore.md` — link and summarise, never copy.

**Priority order, if you only run some of them:** `3` (blocks the `SL-21` phase gate, which blocks the whole cycle layer) → `2` (blocks `SL-28`) → `6` (blocks `SL-26`) → `5` (blocks a roster count the app displays) → `4` (blocks a schema decision) → `1` (decides whether a deferred feature ever returns).

---

## 1. Secondary prompt corpus — is a maintainable source possible at all?

**Gap.** `SL-23` phase 1 ships (student pastes the prompt when the secondary arrives). Phase 2 — a per-school prompt corpus — is explicitly not v1, and `09` already ruled *"examples only; stale prompts are worse than none."* **This prompt does not ask for the prompts. It asks whether a version of phase 2 could ever be maintained honestly.** If the answer is no, the deferral becomes a cut and stops being revisited.

> **Paste from here:**
>
> You are a research analyst evaluating whether a medical-school secondary-essay prompt corpus can be maintained accurately by a very small team. **Do not compile or reproduce any actual prompt text.** I am evaluating feasibility and data hygiene, not collecting prompts.
>
> Answer these, each with primary-source citations and access dates:
>
> 1. **Do medical schools publish their own secondary prompts publicly and in advance**, on their own admissions sites, or is the prompt normally first seen inside the applicant's portal after an invitation? Give named examples of schools in each category with URLs. Roughly what share of schools publish in advance?
> 2. **How much do prompts actually change between cycles?** Find any source — school-published, service-published, or academic — that quantifies year-over-year change. If none exists, say so plainly rather than estimating.
> 3. **What does each third-party aggregator state about its own currency and method?** Cover Med School Insiders, Shemmassian, BeMo, MedCoach, and GradPilot. Quote their exact freshness language, note whether any marks prompts per-cycle at the entry level, and note whether any carries a "verify with the school" disclaimer.
> 4. **Terms of service.** For each aggregator above, quote the ToS language governing reuse or redistribution of their compiled content.
> 5. **Is there any official or school-consortium source** — AAMC, AACOM, TMDSAS, or a school association — that publishes secondary prompts in a structured, licensable form?
>
> **Deliver:** a table of findings with sources; then a plain verdict on whether a corpus could be kept accurate by one person doing an annual pass, with the specific maintenance cost that verdict rests on. **State your confidence and what would change your answer.**

> **⚠️ Reading the result:** the maintenance argument is the one that decides this, not the licensing one — same as `U-12` §4. If the answer to (1) is "mostly portal-only," phase 2 is dead regardless of what the aggregators do.

---

## 2. `SL-28` — the secondary turnaround window

**Gap.** `SL-28` would show *"secondary received 9 days ago"* on a school row. The board says the two-week turnaround norm is "real applicant practice, not an HQ opinion" — but **no primary source is cited anywhere in the docs.** Without one, the feature ships the elapsed count and states no target at all.

> **Paste from here:**
>
> You are a research analyst. I need to know whether any **primary source** supports a recommended turnaround time for returning a medical school secondary application.
>
> 1. **Do any medical schools state a turnaround expectation in writing** — on their admissions site, in the secondary invitation itself, or in published FAQ? Find named examples with URLs and quote the exact language. Note whether any state a hard deadline versus a recommendation.
> 2. **Do AAMC, AACOM, or TMDSAS publish any guidance** on secondary turnaround timing?
> 3. **Do university pre-health advising offices** (which are institutional sources, not consultants) publish a recommended window? Quote them and note the range across offices.
> 4. **Where does the widely-repeated "two weeks" figure originate?** Trace it as far back as you can. If it traces only to consulting blogs and forums, say that explicitly.
> 5. **Is there evidence that submission timing affects outcomes** under rolling admissions — any published study, school statement, or admissions-office data? Distinguish "schools say earlier is better" from "data shows earlier is better."
>
> **Deliver:** the findings with sources, then a direct answer to: *is there a defensible number, or is the honest output an elapsed count with no target?* **If there is no defensible number, say so — that is the useful answer, not a failure.**

> **⚠️ Reading the result:** if this comes back sourced only to consultants, `SL-28` ships the count and stays silent on what's good. That is a fine outcome and consistent with `U-7` and `U-13`.

---

## 3. Cycle calendar — the `SL-21` phase gate (highest priority)

**Gap.** `SL-21` gates the entire cycle layer on the cycle being "in range," and **what puts it in range is unspecified.** Ruling it needs the real calendar for all three services. AAMC's own applying page does not state the cycle calendar in a citable form, and the TMDSAS timeline PDF currently serves a prior cycle's dates — so this needs a careful pass rather than a quick lookup.

> **Paste from here:**
>
> You are a research analyst building a precise calendar of the U.S. medical school application cycle. Use **only** AAMC, AACOM/AACOMAS, and TMDSAS official sources. Cite every date with a URL and access date.
>
> For **each** of AMCAS, AACOMAS, and TMDSAS, for the most recent cycle with published dates, find:
>
> 1. The date the application **opens for data entry**.
> 2. The date applicants may **begin submitting**.
> 3. The date the service **begins transmitting** verified applications to schools.
> 4. **Verification turnaround** during peak season, as the service states it.
> 5. The **earliest and latest school deadlines** the service publishes, and where the full deadline list lives.
> 6. For TMDSAS only: the **ranking deadline and Match result date**, and the stated consequence of missing the ranking deadline.
>
> Then answer:
>
> 7. **How stable are these dates across cycles?** Compare at least three consecutive cycles per service. Are the opening dates fixed calendar dates, fixed weekdays, or genuinely variable? **This determines whether an app can derive them or must look them up each year — say which.**
> 8. **Is there an official machine-readable feed** (JSON, CSV, ICS) for any of these dates, or is it HTML only?
>
> **Deliver:** one table per service, plus a short note on stability and on whether a small app could safely hard-code a derivation rule. **Flag any date you could not confirm from the service itself.**

> **⚠️ Reading the result:** question 7 is the one that matters. If opening dates are stable to within a week, the phase gate can derive itself from onboarding's expected cycle and never needs maintenance. If they float, the gate needs the student's own switch as the primary signal, with the derived date only as a prompt.

---

## 4. `SL-25` — PREview / CASPer, and the null-on-240 schema question

**Gap.** `admissionsTests: { PREview, CASPer }` exists on all 240 roster entries and is **null on all 240.** The feature is deferred; the spec's own line is *"null on 240 is the one option that is definitely wrong."* This decides whether the keys are deleted or populated.

> **Paste from here:**
>
> You are a research analyst. I need the current shape of situational-judgement test requirements in U.S. medical school admissions.
>
> 1. **AAMC PREview** — find the official participating-school list. How many schools participate for the current cycle? **What distinct requirement levels does AAMC define** (for example require / recommend / accept), and what does each mean in AAMC's own words?
> 2. **CASPer / Acuity Insights** — find the official participating-program list for U.S. MD and DO schools. How many programs, and does it use requirement tiers?
> 3. **TMDSAS** — confirm from TMDSAS whether it requires CASPer, for which applicant types, and by what deadline.
> 4. **Churn.** Compare the current participating lists against the two prior cycles. **How many schools joined or left each year?** Give the actual numbers.
> 5. **Completeness coupling** — does a requiring school treat the application as incomplete until the score arrives? Quote official language.
> 6. **Machine-readable access** — is either participating list available as anything other than an HTML page?
>
> **Deliver:** the counts and tiers with sources, plus the year-over-year churn numbers. Then answer directly: **how much would this dataset change annually**, and is it maintainable by one person doing a single annual pass?

> **⚠️ Reading the result:** question 4 is the decider. High churn means the keys get deleted and the field becomes student-entered — participation changing annually is precisely the maintenance trap `§1` exists to avoid.

---

## 5. Open decision C — the two roster entries with no city

**Gap.** **Sidney Kimmel — Delaware Regional Medical Campus** and **Tufts — Maine Track** are the only 2 of 240 roster entries with no city, because no directory lists one. Keeping or dropping them changes any school count the app displays and gates `SL-22`'s map completeness claim. Recorded in `data/med-schools.json` → `meta.knownDefects`.

> **Paste from here:**
>
> You are a research analyst resolving how two regional medical school campuses should be counted and located.
>
> **Subject A:** Sidney Kimmel Medical College at Thomas Jefferson University — Delaware Regional Medical Campus (sometimes "Delaware Track").
> **Subject B:** Tufts University School of Medicine — Maine Track (with Maine Medical Center).
>
> For each, using the school's own site, the LCME directory, and AAMC sources:
>
> 1. **Is it a separately accredited program, or a track within the parent school's accreditation?** Cite LCME directly.
> 2. **Does an applicant select it separately in AMCAS**, or apply to the parent school and choose the track later? This is the decisive question — cite AMCAS or the school's own admissions page.
> 3. **Where are students physically located**, and for how much of the curriculum? Give a city if any source states one.
> 4. **Does AAMC's own school directory list it as a distinct entry?**
> 5. **Are there other U.S. regional campuses in the same situation?** List any you find — if there are more, the roster has a systematic grain problem rather than two one-offs.
>
> **Deliver:** a short verdict per campus on whether an applicant experiences it as a selectable option, plus any citable city. **Flag anything no source states — do not infer a city from the parent school's location.**

> **⚠️ Reading the result:** question 5 is the one that could change the answer. Two exceptions is a data note; a dozen is a grain decision about the whole roster. **Do not resolve this by quietly deleting rows** — it changes displayed counts.

---

## 6. `SL-26` — the course-to-requirement catalog

**Gap.** `SL-26` (prerequisite coverage) is ruled and buildable, but **depends on a course→requirement catalog that `briefs/README.md` lists as not yet written.** `SL-26`'s ruling is strict: Premed OS reports which requirements have a course *mapped* and which do not. It never claims a course *satisfies* anything. This research defines the vocabulary, not the judgements.

> **Paste from here:**
>
> You are a research analyst defining a controlled vocabulary of undergraduate prerequisite categories used by U.S. medical schools. **I am not asking which courses satisfy which requirements** — I need the category names and how much they vary.
>
> 1. **What prerequisite categories appear across U.S. medical schools?** Build the list from a sample of at least 25 schools' own published requirement pages, spanning MD and DO and multiple states. Cite each school.
> 2. **For each category, record the variation:** how schools name it, whether a lab component is specified, and whether hours or semesters are stated. Show the range, not a consensus.
> 3. **How do the three application services classify coursework** for their own GPA calculations — AMCAS, AACOMAS, TMDSAS subject categories? **Confirm explicitly whether any service states its categories may be used to determine whether a school's prerequisite is met.** Quote the language, including any statement telling applicants to check with schools directly.
> 4. **Policy axes that vary by school:** AP credit, IB credit, community college coursework, online coursework, recency limits, and pass/fail. For each, show the range across your sample with citations.
> 5. **Is there any published standard or crosswalk** mapping course categories to prerequisite fulfilment across schools? If none exists, state that as a finding.
>
> **Deliver:** a proposed controlled vocabulary of prerequisite category names with a variation note per category, plus the service-classification findings verbatim. **Explicitly confirm or refute that no cross-school equivalency standard exists.**

> **⚠️ Reading the result:** question 5 confirming "no standard exists" is what keeps `SL-26` honest. The output feeds the *category names a student picks from* when typing a school's requirements — it must never become a table asserting that a course satisfies a requirement.

---

## Not researched, deliberately

| Item | Why not |
|---|---|
| **Per-school admissions numbers** — medians, acceptance rates, class size | `§1` cedes these to MSAR. Not a gap; a ruling |
| **Per-school letter requirements** | `SL-27` ruled these **student-entered**. `LT-6`'s cede to MSAR was about shipping them |
| **Per-school deadlines and fees** | Cycle data, re-verified annually, forever. `§1`'s maintenance argument applies directly |
| **`prereqNotes` and `admissionsTests` cleanup** | Housekeeping, not research — see Open decisions F |

---

**After any packet returns:** save it as `implementation/research-prompts/school-list-<row>-<topic>.md` following the format of `school-list-sl-24-application-services.md` — findings table, primary-source evidence with access dates, evidence-backed implications marked as **non-binding**, and an explicit non-findings section. **Then rule the row separately.** A packet is never a ruling.
