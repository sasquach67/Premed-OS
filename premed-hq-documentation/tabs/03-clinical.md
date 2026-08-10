# Clinical

> **Governed by:** `specifications/05-experience-pillar.md` for the SHARED FRAME ONLY (`05` makes no per-pillar claims; this file is the source of truth for its own domain). This file is the **domain depth** for Clinical: the function, entities, smart features, and admissions reasoning that are unique to clinical experience. The shared frame (compact stat strip on top, experience list as the hero, center-peek inspector) comes from `05`; everything below is what makes this page *Clinical*, not a generic tracker.

**Status:** Designed (July 2026)
**Sidebar group:** Experiences · **Spec type:** domain tab
**Repo:** `sasquach67/Premed-OS` — `src/pages/ExperiencePillar.tsx` (shared builder), Clinical config
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `specifications/04-visual-craft-standards.md`, `specifications/05-experience-pillar.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Clinical experiences, shift/hour logs, per-shift reflections.
- **References only:** People (supervisors/verifiers), organizations (sites), Tasks, Story Bank (reflections flow there), Profile/CV (auto-aggregation), Letters (supervisors as recommenders).

---

## 1. Purpose

Give a pre-med one honest, always-current picture of their **clinical exposure**: how many patient-contact hours they have, whether those hours are *recent and sustained*, whether each activity actually **counts as clinical**, and enough captured detail (setting, role, supervisor, patient moments) that the application and the personal statement write themselves later. Clinical hours are the single most-scrutinized experience category in admissions and the #1 source of "why medicine" material — this page exists so neither is ever reconstructed from memory at deadline time.

## 2.0 Hour ownership — one record, one pillar (LOCKED Aug 2026 · governs all five Experiences pillars)

**A record belongs to exactly one category, and its hours count once, there.** This is stated here because Clinical is the pillar the others are defined against, but it binds Volunteering, Shadowing, Research, and Extracurriculars equally.

**The model already enforces it.** `ExperienceEntry.category` is a single value and `hourTotals()` sums `totals[e.category] += e.hours`. Double-counting is not currently possible. This section exists so the next feature does not break it.

- **Cross-links are references, never copies.** A service club that also produces patient contact *links* to the other record. It does not hold its own hours. This is where the rule breaks first.
- **Moving a record reassigns; it never duplicates.** Sessions, hours, and reflections travel intact. One pillar's total falls by exactly what another's gains.
- **The three collisions to guard:** Extracurriculars ↔ Volunteering (a service club), Clinical ↔ Volunteering (hospital volunteering), Research ↔ Academics (research for credit, where the course and the project are both real records).
- **Where it is visible:** exactly one place, the attribution line on an expanded Overview row (`03-overview.md` §6.5) — *"64h come from Carolina Health Access, counted here, once."* An invariant that needs a dashboard is one you do not trust, so there is **no hour-allocation screen, no reconciliation panel, and no pie chart** anywhere.

## 2. What makes Clinical unique (do not generalize)

Six things live *only* on this pillar. They are the reason Clinical is a first-class page, not a config row:

1. **The mis-filing catch** (reduced Aug 2026 — was "the classification problem"). The community heuristic is "close enough to smell the patient": scribing, CNA/MA, EMT, ED/hospice/clinic volunteering, phlebotomy = clinical; front-desk, fundraising, hospital wayfinding, most shadowing (its own pillar), and research = **not** clinical. **HQ does not classify every experience.** An EMT, scribe, or MA already knows what they do, so a verdict on add confirms what the student could have told it and costs a step every time. The genuine confusion — *which job should I take* — happens months before anything is logged, so a classifier running at logging time arrives after the decision it would have helped with. What remains is narrower and honestly named:
   - **Clear role → silent.** No classification row renders at all.
   - **Unrecognised role → two questions, once.** *Do you work directly with patients?* and *Are you responsible for them, or observing?* Asked once per role, then never again. Guessing from words in a job title is how a classifier gets "cardiac rehab aide" wrong.
   - **Middle answers (`Sometimes` / `Assisting`) → tagged, not interrogated.** A judgment call is saved with the sensible default and **the student is not asked at add time**. It surfaces once, later, in the pre-cycle export review, when they have context and are already checking the application.
   - **Likely mis-file → one inline line plus the offer to move it.** Front desk is the single most common thing pre-meds miscount as clinical. `Keep it here` is remembered per experience and never fires again.
   - **All of this is inline, never a modal.** It does not block, it costs no attention budget (`01` §6.11), and inaction defaults to keeping the record where the student put it. (Overlaps Volunteering; owned here.)
2. **Paid vs. volunteer clinical — stored, inferred, and hidden** (revised Aug 2026). AMCAS files clinical work under two categories that are *both* clinical: *Paid Employment – Medical/Clinical* and *Community Service/Volunteer – Medical/Clinical*. The field is therefore **required in the data model** or the export lands in the wrong category. But it is **never a chip the student manages**: HQ infers it from the role and surfaces it in **exactly one place, the AMCAS export preview**, where it is editable. No paid/volunteer control appears anywhere in normal logging. See `03-clinical-board.md` §7a for the full category mapping.
3. **Recency & continuity as first-class signals.** Adcoms read *when* and *how steadily*, not just the total. A current, sustained role beats a freshman-year burst of the same hours. Because logging is **shift-based** (dated entries), the page can surface a **stale-exposure alert against the student's own cadence** (§7, not a fixed number), an hours-over-time chart, and a **pace projection** (`8.2 hrs/wk → ≈812 by Jun 2027 · clears your 750 target`). No other numeric pillar leans on recency this hard.
4. **Every shift is essay fuel.** Each shift can carry a reflection built from **chosen prompts, freeform text, or an optional AI-assisted brain-dump pass** (§7d, #45/#45a) that flows to the Story Bank. Clinical produces more personal-statement material than any other activity; the page is built to capture it in the moment, not invent it later.
5. **Certification tracking** (revised Aug 2026). Clinical roles (EMT, CNA, BLS/ACLS, phlebotomy) run on **live credentials with expiry dates**, and no other pillar has something that expires. HQ tracks **name and expiry** and warns ahead of renewal. Three limits, all deliberate:
   - **Certs are type-to-create**, exactly like roles. The student types "NC EMT-Basic" once and it is saved and suggested afterwards. HQ does **not** own a credential taxonomy — state names vary and a fixed list goes stale. The three hardcoded entries currently in `ExperiencePillar.tsx` are **deleted, not implemented**.
   - **Continuing education is tracked against the real standard, not an invented one.** NREMT's National Continued Competency Program requires **40 credits for EMT recertification** across three components (national · local/state · individual) on a two-year cycle, under the 2025 NCCP model. HQ holds that requirement as **Category A reference data** (sourced, dated, per credential and jurisdiction), lets the student log progress **optionally**, and **never computes or infers credits**. The UI states that NREMT and the state office hold the authoritative record. Where HQ has no sourced requirement for a credential, it shows name and expiry only and **says nothing about CE** rather than inventing a target.
   - **A lapsing credential has no effect on anything else.** The pace projection continues unchanged, the role is untouched, and logged hours are untouched. **The nudge is a reminder and nothing more.** Students renew; modelling the failure would be both wrong and insulting. If someone genuinely stops working, the **stale-exposure alert** catches it from logged shifts, which is the honest signal.

6. **What you actually do here** (rewritten Aug 2026 — was "Skills, observed vs. performed"). **The observed/performed counter is cut.** *"180 vitals"* only exists if someone logs each instance, and nobody will; it is false precision on a pillar whose whole job is honest capture. What is true is *"I did vitals routinely"* versus *"I watched once"*, and that fits in a sentence. In its place: **one optional free-text line on the role**, in the student's own words. The two moments this is ever used — writing the 700-character AMCAS description, and answering *"what did you actually do?"* in an interview — are both served by prose. The six hardcoded skill chips currently in `ExperiencePillar.tsx` should be **deleted, not implemented**.

## 3. Primary users and stages

- **Early (freshman/soph):** getting a first clinical role; needs the classifier ("does this count?") and low-friction logging so the habit sticks.
- **Mid (soph/junior):** accumulating hours across one or two roles (e.g., EMT job + ED volunteering); needs recency/continuity nudges and reflection capture.
- **Application year:** needs a clean, verified, correctly-categorized export (hours, dates, supervisor contacts, paid/volunteer) and a bank of reflections to mine for essays.
- **Andy specifically:** clinical is EMT-centered — recurring shift work, patient contacts per shift, skills used. Shift-based logging matches how he already thinks about the work.

## 4. Core entities

- **Clinical Experience** ("job / site", owned): title (e.g. "Orange County EMS — MEDIC"), **organization/site (referenced entity — shared/canonical across students, §7e)**, role (EMT-Basic, Scribe PRN…), **type = paid | volunteer** (§2.2), setting (ED / inpatient / outpatient / clinic / hospice / EMS / other), cadence label ("12-hour Saturdays," "2 shifts/mo"), patient-contact flag, start date, status = active | past, supervisor/**AMCAS verifier** (referenced Person + title + email + phone), verification status, classification result (counts / ambiguous / likely-not, with reason). Derived: hours-here, shift count, hrs/wk, streak.
- **Shift** (owned, belongs to an Experience): date, hours, a free note that can carry **structured call counts** (e.g. `trauma ×2 · code ×1 · transfers ×3 · psych ×1 · routine ×5`), optional **patient-contact count** (#52, minor, optional, off by default), **numerics extracted from the reflection text** (§7d/§7e), optional reflection. Sum of shifts = the experience's hours; sum across experiences = the headline total.
- **Certification** (owned, belongs to an Experience or the profile): name (NC EMT-Basic, AHA BLS Provider, NIMS ICS-100/200), expiry date (or "no expiry"), CE hours required vs. done, renewal-due lead date, status = current | renew-soon | done.
- ~~Skill~~ — **does not exist as an entity (R1).** Replaced by one optional free-text line, owned by the Experience (§2.6).
- **Reflection** (owned, may attach to a Shift or Experience): free text → surfaced in Essays/Story Bank as source material.

## 5. Structure: three flat sub-tabs (RULED Aug 2026)

**`Sites` · `Shifts` · `Reflections`.** Flat, on the MCAT model, with **no mode switch above them**: Academics needs Daily/Planning because it has two genuinely different jobs, and Clinical has one. Per `01` §4b-i that means **level 2 only**, underline tabs, no glass pill. Full reasoning in `03-clinical-views-board.md` §3.

**Two candidates were ruled *down* rather than in**, and both decisions matter more than the tabs themselves:

- **No `Credentials` tab.** It is a **section on `Sites`** (§5a). Only three features ever attached to it (#20, #21, #22), which is the evidence that settled it (Andy: *"most people probably have four certs, it's not really necessary to put in the entire tab"*).
- **No `Application` tab.** The export preview moves to **Profile/CV**, because the AMCAS 15-entry cap is application-wide and no pillar-scoped surface can render it. Clinical keeps a **phase-gated prep panel** on `Sites` (§5a). See views board V3.

**Mockup for all three:** `mockups/04-clinical/clinical-subtabs.html`.

**The guard on this whole structure:** `Sites` stays the default landing, and **logging never gains a click** at any door. If a sub-tab ever starts absorbing steps from the ≤5-second loop (`CLAUDE.md`), that is the signal this went too far.

### 5a. Sites: the default landing (master-detail, matches the current build)

- **Headline strip (compact, per `05` §3 / `04` §6):** one slim line, e.g. `376 clinical hours · 2 sites · 1 cert renewal due`, with a right-aligned **pace projection** `8.2 hrs/wk → ≈812 by Jun 2027 · clears your 750 target`. No big stat boxes, no ring. Cert-renewal-due surfaces here in amber when a credential is approaching expiry. **One nudge at a time** (§7g, #56).
- **Site cards row = the hero.** Each **job / site** is a card: name + role, cadence ("12-hour Saturdays"), total hours (right), recency ("last shift 3 days ago"), active-dot. The selected card is outlined. Ends with a dashed **"+ add job / site"** ghost card.
- **Selected-site detail panel** (below the row): site title, `role · Active · date range · N shifts`, and the site's total as the one allowed big number (**`312 HOURS HERE`**, a page's single primary metric may go large per `04` §6). Inline **AMCAS verifier** line (name · title · email · phone · hrs/wk · streak). The panel then splits into:
  - **Shift log.** Reverse-chronological dated shifts with hours + structured call notes (`trauma ×2 · code ×1 · transfers ×3`); a **fast-add row** at the bottom (date=today, hours, "shift + calls" note, **＋ Log**). **Each row also carries the unpacking marker** (§7d, #45a) until that shift is unpacked or deferred. This is the site-scoped view of the same records `Shifts` shows across all sites.
  - **What you actually do here.** **One optional free-text line** in the student's own words (§2.6). No observed/performed counts, no skill chips, no grid (R1).
- **Credentials section (#71).** Everything with an expiry, **grouped by site**, with a **"Not tied to a site"** group at the bottom for profile-level credentials like BLS. That group is the entire reason this was a defect rather than a preference: §4 allows a Certification to belong to *"an Experience **or the profile**"*, and before this there was nowhere for the second case to render. Each cert shows name, expiry, status action ("Renew by Jan 2027" / "Current"), and **CE progress only where a sourced requirement exists** (§2.5, §7). Silent about CE otherwise rather than inventing a target.
- **Pre-cycle prep panel (phase-gated, #48).** Invisible outside the application window. When the cycle approaches it surfaces Clinical's own export-readiness work: unresolved judgment calls (#13), missing verifiers (§7c), 700-character descriptions, the completed/anticipated split, and repeated-range merging **within clinical records**. It deep-links to Profile/CV for the cross-pillar picture it cannot show. Precedent: `02-mcat.md` §3.11's Test Day panel.
- **Recency/continuity** is expressed through the projection + streak + hours-per-week rather than a separate chart on this surface. The chart lives on `Shifts` (§5b).

### 5b. Shifts: every shift, across every site (#63 to #67)

**The question this exists to answer:** *"what did I actually do in March?"* Unanswerable before, because the shift log lived inside one site's panel and a student working two jobs could only ever see half of it.

- **Month grouping with subtotals.** `MARCH 2026 · 31.0 h` above each group. The subtotal is what makes the answer readable at a glance instead of requiring the student to add rows up (#63).
- **Two filters plus one segmented control** (#64, #65), all solid form controls per `01` §4b-i:
  - **Site**: all sites, or one.
  - **Period**: a date range.
  - **All / Active roles / Ended**: this is **V6's archive case, absorbed as a filter**. Ended roles are a view of the ledger, not a separate destination, which is why Clinical has no Archive surface.
- **Inline edit in place** (#66). Correct hours or a date on the row itself. Spotting `80 h` in a ledger and being sent back to the right site to fix it is the specific thing this prevents.
- **Logging works here too** (#67). **Reversed Aug 2026** (Andy): *"users should have the freedom to add shifts from the shift logger as well, and as well as sites."* The objection had been that two add rows means two code paths that drift, which is an implementation concern solved by both surfaces rendering the **same `InlineAddRow`**, and it was already moot because #10 puts quick-log on Overview. **The guards live in the component, not the page**, so the >24 h check (#59) and overnight-dating rule (#60) are enforced identically at every door. The only real difference here is one extra field: a **site picker**, defaulted to where you logged last.
- **Estimated backfill blocks** render hatched, carry **no unpacking marker ever**, and are excluded from pace, the median-gap baseline, the monthly bars, and the >24 h guard, while still counting toward totals and the export (#9, #61).
- **The hours-over-time chart lives here** (#34): monthly bars by default, running total on request, segmented switcher (§8, R8).

### 5c. Reflections: the clinical-scoped door (#68 to #70)

**One record, two doors** (views board V5). Story Bank (`09-essays-story-bank.md`) is the aggregate door across all pillars; this is the clinical-scoped one. **There is exactly one set of records.** This view is a filter over the same data, never a copy, never a separate store. Editing in one place changes the other because they are the same record.

- **Two independent filters** (#68), and they must stay two controls:
  - **Site**: all sites, or one.
  - **State**: All / Unpacked / Not yet / Skipped.
  
  Andy: *"filter between... and then filter between unfinished and unpacked."* These are different axes; a single combined dropdown would force every site-and-state pair into one list.
- **Browse and worklist at once.** The state filter is what makes this a worklist: it gives the #45a marker a home beyond the individual shift row, so *"what have I not reflected on?"* is answerable in one place.
- **Synthesis threads render distinctly** (#69). A #45b cross-experience synthesis is tinted, rule-marked, and tagged (`Synthesis · 14 reflections`) so it never reads as just another shift note. Per V5: both doors, visually distinct.
- **The outstanding count lives on the page**, in the filter bar (*"14 threads · 9 shifts not yet unpacked"*), and **never as a badge on the tab label** (#70). A badge would follow the student around the app; the count waits where they went to look.
- **No sorting by quality.** Nothing ranks threads by length, depth, or how "reflective" they are. That would be a verdict, which this pillar does not issue.

## 6. Main workflows

- **Add clinical experience:** Quick Add (shell §7.4) prefilled to Clinical → name, site, role, paid/volunteer, setting → **classifier runs**, shows counts / ambiguous / likely-not with a one-line why → save.
- **Log a shift (the core loop):** open experience → add shift → date (today) + hours → optional patient count + note → save in ~5 seconds. Headline + recency recalc immediately (optimistic, `04` §7).
- **Reflect:** pick a prompt chip and/or write freeform on a shift (§7d, #45) → resolve that shift's unpacking marker by opening the full-screen deep pass or explicitly deferring it (§7d, #45a) → periodically, open the cross-experience synthesis pass when offered (§7d, #45b) → optionally "send to Story Bank."
- **Capture a verifier:** type-to-create with preset reuse, never at add time; batched at term rollover and pre-cycle (§7c). Letters requests remain a separate, student-initiated action from the captured contact.
- **Review & export:** application-year view of all clinical, correctly split paid/volunteer with dates + contacts, ready for AMCAS entry and CV aggregation.
- **Archive:** end/close an experience without deleting its hours or reflections.

## 7. Smart features (rules-based, explainable — `architecture/02`, `general.md`)

Only the ones that fit clinical; each states its reason:

- **Mis-filing catch (§2.1)** — not a classifier. Silent on clear roles; two questions once for an unrecognised role; one inline line plus a move offer when a role reads as non-clinical. Inline, never modal, never blocking.
- **Route to Volunteering** — offered when the catch fires. `Move` carries **sessions, hours, and reflections intact**; the clinical total falls by exactly what the service total gains (§2.0). `Keep it here` is remembered per experience. **Never auto-moves** (permission-first; mirrors Volunteering §7 resolved #3).
- **Route from Shadowing** — the same mechanism reversed, triggered when a shadowing record answers `Responsible` or `Assisting` rather than `Observing`. **The copy is inverted because the stakes are:** shadowing hours never count as clinical, so a student in this position has been *undercounting* themselves. It reads as good news, not as a correction.
- **Judgment calls, deferred** — a middle answer is saved with the sensible default and **tagged silently**. The student is never asked at add time. All tagged records surface **once**, together, in the pre-cycle export review.
- **Pace projection** — from hrs/wk + time to target date, project the total ("≈812 by Jun 2027") and state whether it **clears the target** (green) or falls short (amber, with the weekly pace needed to catch up).
- **Certification renewal reminder** — *"NC EMT-Basic expires Mar 31 2027 · renew by Jan 2027"*; escalates as expiry nears. Shows CE progress **only** where a sourced requirement exists (§2.5); silent otherwise. A lapsing or lapsed credential is a reminder only: it does **not** touch the role, the pace projection, or logged hours.
- **Stale-exposure alert** (threshold LOCKED Aug 2026) — the one thing that notices a student stopped, since R6 removed the lapsed-cert coupling.
  - **The threshold is derived from their own cadence, never fixed.** `N` = **3× the median gap between that experience's shifts**, **floored at 2 weeks**, **capped at 12**. A fixed number cannot serve both someone working three shifts a week and a monthly volunteer, and any single value either fires every winter break or stays silent through a summer they actually stopped.
  - **It re-baselines automatically.** A student whose department cuts their hours sees their median gap widen, so the threshold widens with it. This is the same reason streaks are rejected on this pillar (`03-clinical-board.md` §5): never punish someone for a schedule an employer controls.
  - **Silent under 4 logged shifts** — there is no median yet, and guessing one would nag a student who just started.
  - **Fires per experience, not per pillar.** Someone can be active at one site and stale at another; a pillar-level alert would hide that.
  - **Copy states the fact and their own pattern. No verdict, no claim about adcoms:** *"No shifts logged at Carolina ED since March 2. Your usual gap is about 2 weeks."* The earlier draft asserted that adcoms value recent exposure; nothing sourced supports it and it imports exactly the anxiety this pillar rejects.
  - **Suppressible per experience**, and suppression is remembered.
  - **Redundancy is intentional and bounded.** Recency is already visible in two places, the `last shift 3 days ago` line on the site card (§5) and an empty bar in the monthly chart (§8). The alert exists only for the student who has stopped opening the tab at all. It never repeats a fact the page is already showing to someone who is looking at it.
- **Missing verification** — active clinical experience with no AMCAS verifier contact captured. Full capture workflow, batching, and the pre-cycle re-check are §7c.
- **Unlinked reflection** — a shift note (or a #45a thread) that hasn't been sent to the Story Bank.
- **Paid/volunteer nudge** — untagged experience → prompt to tag (drives correct export).
- **Never** surface a research- or leadership-style metric here; hours, recency, credentials, and skills are the clinical signals.

## 7a. The hour target — suggested from your own rate, never from a benchmark (LOCKED Aug 2026)

Clinical is the only Experiences pillar with a target at all (§6 governing note), so the number has to be defensible. **No sourced figure for "expected" clinical hours has been verified** — see `03-clinical-board.md` §8. Rather than wait on that, the target is informed from inside the app.

**Day one forces nothing, but it may ask.** Cold start presents one action, *add your first experience*, and the log works fine forever with no target set. **What day one does not do is invent a total from zero data.** That fiction is what this whole section exists to prevent.

**A capacity question is a different thing from an invented total, and it can be asked immediately.** *"How many hours a week do you think you could commit?"* is not a measurement, it is the student's own honest estimate, the same kind of number `WeeklyCapacity` already asks for elsewhere in the shell (`00-product-shell` §11b). Answering it is optional and skippable, and the field still starts empty either way (§ rules below). This is the second row of the table immediately below, **"what you say you can sustain,"** made concrete: it was always one of the two valid sources, not something that waits for logged history.

**Once real shifts exist, HQ can suggest from observed rate instead of asked capacity**, and that suggestion is the stronger of the two because it is measured rather than guessed. Either source produces the same honest arithmetic below; neither is pre-filled.

### Two ways in, one field

| You set | HQ derives | Suggested from |
|---|---|---|
| **Hours per week** | the total | your observed rate, or what you say you can sustain |
| **Total hours** | the weekly rate needed | nothing — you typed it |

**Either direction is valid and both are always visible.** Change the weekly figure and the total moves; type a total and HQ shows the weekly rate it implies. The student sees the arithmetic, so the number is never a black box:

```
5 hrs/week  ×  ~40 weeks/year  ×  2.5 years to your application
= about 500 hours
```

### Rules

- **Weekly is the suggested path** because it is the question a person can actually answer. *"One shift a week"* is knowable; *"my total goal is 600"* is not.
- **Two sources, ranked by how sure they are.** Before real shifts exist, the only honest source is **stated capacity**: *"how many hours a week do you think you could commit?"* Once shifts exist, HQ prefers **observed rate**, *"you've averaged 5.2 hrs/week over the last two months. Make that the plan?"*, because a measurement beats a guess. A student can always override either with their own number.
- **`WeeklyCapacity` sanity-checks it** (`00-product-shell` §11b). A weekly figure larger than the hours actually free after class, MCAT blocks, and shifts is flagged **before** the target is set, not discovered by failing against it.
- **Runway comes from the profile** (`applicationCycle` / `matriculationTarget`). Change the application year and the total moves.
- **Nothing is pre-filled.** HQ suggests in copy; the field starts empty. A default number becomes the standard in the student's mind regardless of the caption, which is exactly what C3 forbids.
- **Whatever is set is labelled `Your target`**, never `the target`, everywhere it appears.
- **A target remains optional forever.** With none set, the projection still describes rate and total honestly (*"8.2 hrs/wk · 486 hours · 14 months sustained"*) and no pace judgment is shown.
- **When a student's own target is met, HQ says so once and stops projecting against it — and says nothing more.** *"You've passed the 250 you set."* **REWRITTEN Aug 2026.** This line used to read *"HQ may say the target is met and stop… 'you have enough of this, go do something else' is a legitimate and useful thing to say,"* citing **Shadowing's precedent** — and that precedent has been deleted. Andy: *"why are you trying to put caps? Targets are not necessarily caps."*
  - **The distinction: HQ may report that a number the student chose has been reached. It may never suggest they are done, or that their time is better spent elsewhere.** The first is arithmetic about their own goal; the second is a verdict about their life.
  - **Passing a target changes nothing else.** No feature switches off, no nudge is permanently suppressed, logging continues exactly as before.

> **Where "the AMCAS export preview" lives (RULED Aug 2026).** This file refers to it in several places as the single home for paid/volunteer (§2 point 2), the scope checklist (#27), judgment calls (§7), the anticipated-hours suggestion (§7b), and the setting-mix line (#36). **That surface is owned by Profile/CV, not Clinical** (`03-clinical-views-board.md` V3): the 15-entry cap is application-wide, so no pillar-scoped surface can render it. **Clinical keeps prep only**, as a phase-gated panel on `Sites`. Every reference below still holds; the surface is simply not in this tab.

## 7b. AMCAS Work & Activities structure (VERIFIED Aug 2026 · Category A)

**Source:** *2027 Work and Activities Guide for Applicants*, AAMC, fetched from `students-residents.aamc.org/media/13376/download` on 3 Aug 2026. **Cycle-dated. Re-verify each application year** (`implementation/data-refresh.md`). Everything below is from the official guide, not from a consulting site.

**What the application actually asks for, per entry:**

| Field | Rule |
|---|---|
| Entries | **15 maximum** for the whole application, across every pillar |
| Description | **700 characters** |
| Most meaningful | **Up to 3.** Required to name at least one if there are 2+ entries. **+1325 characters** each |
| Dates | Start and end, month and year |
| Hours | Total, per date range |
| **Repeated** | Yes/no flag, plus **up to 3 additional date ranges**, each carrying its own hours. **Four ranges maximum per entry.** **RE-VERIFIED Aug 2026 — this line was always correct.** A search summary saying *"three date intervals"* was read as a contradiction and flagged; it was counting **additional** ranges, which is what this line already says. **1 primary + 3 additional = 4 total. Do not re-open.** |
| **Completed vs Anticipated** | **Two separate sections.** Completed cannot hold a future date. Anticipated starts the current month or later and ends no later than **August of the matriculating year** |

**Anticipated is unavailable** for Honors/Awards, Conferences, Publications, Presentations. **An anticipated experience can never be most meaningful.** Reapplicants get the prior cycle rolled into Completed and must re-split it.

### What this changes in HQ

**1. Anticipated hours are not in the model.** Logged shifts are `Completed` by definition. A student with an ongoing role submits completed-to-date **plus a projected figure through August of the matriculating year**, and HQ has nowhere to hold the second number.

The pace projection (§7) already computes exactly this. **The export preview (#48) should offer it as a suggestion, never write it silently**, and it is bounded by the same August ceiling AMCAS enforces. It stays a suggestion because anticipated hours are a promise the student is making to schools, not a calculation HQ is entitled to make for them.

**2. A repeated experience is ONE entry, not several.** Two summers at the same site is one AMCAS entry with two date ranges. If the export emits two records, the student burns two of fifteen slots for no reason. **The export preview must group by organization and role and offer to merge**, up to the four-range limit. Beyond four ranges they have to consolidate, and HQ should say so rather than truncate.

**3. The 15-entry cap is a real constraint HQ does not model.** It is application-wide, so Clinical competes with Volunteering, Shadowing, Research, and Extracurriculars for the same fifteen slots. A student with 22 records has to cut or combine. **That decision belongs in the export preview with the full cross-pillar count visible**, not in their head the week of submission. It is the one place HQ can see the whole picture and the student cannot.

### Still unverified

**The contact/verifier fields.** This guide covers hours entry only and does not enumerate them. Contact name, organization, and location are **secondary-sourced, not confirmed** (`implementation/deferred.md` R-3). HQ currently stores `verifierName`, `verifierId`, `verifierRole`, `verifierEmail`, `verifierPhone`, which **exceeds** what secondary sources describe. **Capturing more than the application asks for is the correct default** (Andy, Aug 2026): an unused field costs nothing, and a missing one is unrecoverable once the student has lost touch with the person.

## 7c. Verifier capture: type-to-create, batched, never at add time (SPECCED Aug 2026 · #38, #39, #40, #41)

**Same mechanism as role and certification typeahead (§2 point 1, §2.5), applied to people.** The student types a verifier's name once. It is saved and offered as a **preset** on every other experience at the same site, the way "NC EMT-Basic" is offered again once typed. No separate contacts screen, no re-entry.

**Never prompted at add time.** Adding an experience is already a multi-field form (§6); stacking a "who can verify you" question on top of it is exactly the friction §2.1's mis-filing catch was written to avoid. The verifier question waits until the relationship is real.

**Two batched triggers, same review screen, different stakes:**

- **Term rollover (#38/#39, merged).** HQ already knows the current term from the profile. At rollover, one dismissible card lists every active experience missing a verifier: *"3 experiences have no one who could confirm them for AMCAS."* One screen, all of them, the same person-picker `EntityLinkCombobox` used elsewhere. Skip any of them; it returns next term.
- **Pre-cycle re-check (#40).** Fires once, when the application year opens. Higher stakes, different copy: not "add a contact" but *"you last confirmed this contact over 18 months ago. Still reachable?"* People change jobs; this is the last checkpoint before the export.

**Supervisor change (#41) is not a separate feature.** A verifier is its own field, not an alias for "current supervisor," so replacing one is just editing the field. Folded in rather than built twice.

**Future: pattern detection, not built now.** Once enough shifts exist at a site with a repeat verifier already on file, HQ can eventually recognize the pattern and pre-fill the suggestion rather than asking again, the same trajectory the app already takes elsewhere (deterministic first, a recognition layer on top once there is real data to recognize). **Not scoped for this pass.** Recorded so the typeahead is built in a way that does not block it later. Adding it is a `deferred.md` candidate, not a Wave 6 commitment.

## 7d. Reflection: chosen prompts, a tracked deep-unpack pass, and a cross-experience synthesis pass (REVISED Aug 2026 · #45, #45a, #45b)

**The most important feature on this tab** (Andy, Aug 2026). Clinical produces more personal-statement material than any other pillar (§2 point 4); this is the machinery that actually captures it instead of leaving it to be reconstructed cold at essay-writing time.

### #45: the quick note (inline, structural, never tracked)

**C4 is reversed.** The board originally called for a *rotating* prompt, deterministic, no AI, on the theory that specificity beats a blank field. Andy's correction: **rotation removes agency at exactly the moment a student needs it.** A shift that was mostly paperwork has no "patient moment" to report; forcing that prompt produces a worse note than letting the student pick one that fits what actually happened.

**So the prompt is chosen, not assigned.** A small catalog (a patient moment, something that confused you, something the team did well, and a few more in the same register) sits as **selectable chips**, not a single field. The student picks the one that fits, or several. Below it sits **one more field for anything that didn't fit**: a miscellaneous line for the thing that mattered but wasn't the prompt's shape.

A shift can be logged with a prompt, freeform text, both, or neither. **This is the lightweight path and it does not set or clear the unpacking marker below.** It is a note, not an exchange. The ≤5-second logging rule (`CLAUDE.md`) still governs the base case of just date + hours.

### #45a: the deep unpack (major, tracked, full screen)

**Every shift gets a marker, no exceptions for short ones.** *"Doesn't matter how short the shift is, there's always something to reflect on"* (Andy). This is not a subtle inviting line; it is a **visible button**, present on every shift at the moment it's logged and **persisting as a status on that shift's row in the reverse-chronological shift log** (§5) until it is resolved.

**Two things clear the marker, and only two.**

1. **Unpacking it**, by reaching the minimum below.
2. **Explicitly deferring it.** A real decision, not silence. *"users can choose to defer it if they truly don't want to do it, which takes away the marker"* (Andy).

**Whichever happens, it is permanent.** The marker never reappears for that shift once resolved either way, the same shape as the mis-filing catch's "Keep it here" (§2.1): a one-time decision that sticks, not a recurring nag. Logging into this pillar can mean several shifts a week; a marker that kept coming back would turn a good feature into the thing students dread opening the tab for.

**The flow itself is full screen**, matching the precedent already set by `AcademicRecallSession.tsx` for focused, unhurried work: it opens to a blank box, *"What happened? Write whatever comes to mind,"* no prompt chips here, this is the open-air path, not the structured one.

**The AI reads the brain dump and asks a follow-up grounded in what was actually written**, not a template question. The student answers. It continues.

**Minimum to count as unpacked: 2 to 3 exchanges.** Around the second or third, the AI explicitly checks in, *"anything else you want to add?"* If no, it closes there: *"Saved to your Clinical reflections."* **If yes, it continues, no ceiling.** The minimum is a floor, never a cap; depth past it is entirely the student's call. This is a structural bar, not a quality judgment: it is whether the exchange happened, not whether HQ thinks the reflection was good enough. Grading it would contradict the pillar's stance everywhere else, no verdicts, only facts (§7 stale-exposure's own rule, restated here).

**Applies to every individually dated shift**, whether logged the day it happened or entered late with a past date. A specific date means a specific occurrence, and the student can reflect on it from memory as best they can. **It does not apply to the single aggregate block created by bulk backfill** (Wave 1, #9): that block is an undifferentiated lump sum with no one occurrence behind it, so there is nothing specific to unpack.

> **That block is not left blank, though.** It carries no marker and never will,
> but a student may attach writing they already produced during that period and
> unpack *that* instead — §7i, #62. The exclusion above is about markers and
> occurrences, not about the years being unreachable.

**Without an AI provider configured**, the exchange-count minimum cannot be met, so a single substantive freeform entry clears the marker instead. Same provider-agnostic pattern as the MCAT Advisor (`02-mcat.md` §3.4): the marker system stays fully functional, just without the follow-up questions.

**What the AI never does:** it never drafts, completes, or rephrases the student's words, never tells them what the experience meant, never congratulates or inflates significance. It asks. It does not conclude. It also never solicits patient names or identifying details; the standing PHI rule (board §5) has never had to survive a free-text AI surface before, and the prompt itself should say plainly that this isn't a chart note, general terms only.

**The whole thread routes to Story Bank** (§6, #47): brain dump, questions, and answers together, not a cleaned-up summary. More raw material, not a tidier version of the same material.

### #45b: the synthesis pass (new, cross-experience, periodic)

**"The user should jog their memory and look at every experience"** (Andy). This is the one thing in the pillar that ever looks at more than one reflection at once, and it's the actual source of "why medicine" material, since a single shift rarely shows a change, a pattern across fifteen of them does.

**Scope is every clinical experience, not one site.** Where #45a is scoped to a single shift, #45b reads across the student's whole unpacked history in Clinical.

**Cadence matches §7c's existing rhythm** rather than inventing a new one: term rollover or pre-cycle. *"You've written 14 reflections since January. Want to look at them together?"*

**The AI asks about the arc, using the student's own past words as the only evidence**, never inventing a narrative: *"In January you wrote you felt unsure around trauma cases. That hasn't come up in your last few entries. Did something change, or did you just get used to it?"*

**Same rules as #45a govern it:** full screen, asks rather than concludes, no PHI, routes to Story Bank as its own tagged thread (a synthesis, distinct from a single-shift unpack, feeding #49's most-meaningful candidacy).

### Rules governing both #45a and #45b

- **Entirely optional at the level of doing them.** The 5-second log always works with zero AI involvement. What is not optional is the marker's existence for #45a; a shift can be deferred, but it cannot be silently ignored without that being a recorded decision.
- **Provider-agnostic, no-API fallback**, per above.
- **This is the pillar's first AI dependency.** The Universal Rules in the feature catalog said clinical needs no AI key for anything; that line now needs one carve-out, stated there rather than silently made false.

## 7e. Shared org directory and impact numerics (SPECCED Aug 2026 · #52, #54)

### #54: the org directory is the first shared entity in the app

Every other entity in HQ is single-student. This is the first one that's genuinely shared: *"12 other students logged hours at UNC Hospitals ED"* only means something if the underlying organization record is the same one across everyone's data, not twelve separate free-text strings that happen to look similar.

**Resolution happens at entry time, by the student, never after the fact by AI.** This reuses the exact type-to-create-and-preset mechanism already built three times in this pillar (roles §2 point 1, certs §2.5, verifiers §7c), widened from a private list to a shared one. A student typing an org name searches the shared directory first. A close match exists, they pick it. Nothing close exists, they create one, and it's there for the next student who types something similar.

**AI suggests; a person confirms every merge.** If a typed name is close to an existing entry, HQ can ask, *"did you mean UNC Hospitals, Emergency Department?"* The student says yes or no. **AI never merges two entries on its own judgment, silently or after the fact.** A wrong merge would show a confident, wrong number, combining two different organizations into one count, which is worse than the alternative.

**When in doubt, entries stay split.** Two similar-looking org names that were never explicitly matched simply show separate, smaller counts rather than one falsely confident big one. This is R7's rule again, cut or undercount rather than approximate, applied to entity resolution instead of a data source.

**What's shown, and what never is:** an aggregate count on the org, nothing else. No individual student is ever named or made visible to another. **This is not a network or profile feature.** It is explicitly not the LinkedIn-style "click into someone's profile" idea Andy raised and then set aside, which would require Premed OS to become a visible-by-default, multi-user product, a genuinely different undertaking, recorded separately (`implementation/deferred.md`) rather than folded in here.

**This also is not the rejected "comparison to other applicants" feature** (board §5). *"12 students logged hours here"* is a discovery signal about a place, not a comparison of one student's hours against another's. If this ever drifts toward ranking or comparing students against each other, it has crossed into the rejected feature and should stop.

**Clinical is first because it's the deepest pillar; the pattern likely generalizes.** Volunteering, Shadowing, and Research all have their own org/site fields and would get the same shared directory naturally when those tabs are specced. Not built there yet, noted here so it isn't reinvented differently per pillar.

### #52: numerics generalized beyond a single field

The original ask was one field: an optional per-shift patient-contact count, kept minor, off by default, exactly as scoped in `03-clinical-board.md` §7. **The mechanism generalizes further than the one field.** The AI already reading shift notes and brain-dump reflections (§7d) can notice numerics the student mentions in their own words, *"triaged maybe 15 people tonight"*, and offer to tag it, rather than requiring a dedicated form field for every possible number a student might want to capture.

**Patient-contact count is one instance of this, not a separate mechanism.** The general capability, AI-extracted numerics from freeform text the student already wrote, is what should get built; the structured field is the Clinical-specific application of it.

**This is a cross-pillar pattern, not a Clinical-only one, but only Clinical's application is specced now.** Andy's own example, dollars raised at a fundraiser, is an Extracurriculars concept, not a Clinical one, and it happens to line up with an existing open question in `07-extracurriculars.md` §16 #2 (is `reach` a number or free text). That tab gets its own ruling when it's specced; this section only commits Clinical's instance.

## 7f. Return rundown — Clinical's specialization (SPECCED Aug 2026 · #55)

**The pattern is shell-owned** (`specifications/00-product-shell.md` §7.10). The
trigger, the 10-day session-gap threshold, the no-count and no-streak rules, and
the bulk-clear contract are all defined there and are **not restated here**.
This section says only what Clinical contributes.

**Clinical accrues no backlog during an absence.** No shifts happened, nothing
came due, and the hours are exactly where they were left. That makes the useful
content narrow and entirely time-based:

1. **A credential moved.** An expiry passed or entered its renewal window while
   they were away. External deadline, real consequence, cannot be reconstructed.
2. **A verifier aged past the §7c re-check mark.** People change jobs; a
   six-month absence is when that becomes true.
3. **Runway moved and hours did not.** The single most useful thing this pillar
   can say on return, and the only one the student genuinely cannot work out by
   looking at the page: *"You're 6 months nearer to applying. Hours are
   unchanged at 486. Your earlier 8.2/wk would now need to be 11.4 to still
   clear your target."*

**Fact 3 is arithmetic, shown the way §7a shows arithmetic** — openly, with the
components visible. It states the rate, it does not judge it, and it appears
only where the student has actually set a target. **With no target set it is
omitted entirely** rather than reworded, because without a target there is no
honest claim to make about pace.

**What Clinical must never put in the rundown:**

- **Unpacking markers** (§7d, #45a). They are per-shift row status by design and
  aggregating them into a return-time total converts a good feature into the
  backlog §7.10 exists to prevent.
- **Stale-exposure** (§7). It is an activity-gap signal and the rundown is a
  session-gap surface; §7.10 explicitly forbids duplicating pillar-level
  activity alerts. A student returning to the app still sees the amber line on
  the site card where it belongs.
- **Anything that was already true before they left.** Missing verifiers on
  three experiences is a standing condition, not news.

**Returning clears stale-exposure silently.** Logging a shift at a stale site
removes the amber line on save — no acknowledgement, no "welcome back", nothing
to dismiss. A student who left for five weeks and came back does not need the
app to have an opinion about it.

## 7g. Nudge routing — the seven go through Attention, not the page (SPECCED Aug 2026 · #56)

**Each smart feature in §7 is individually restrained. Collectively they are a
wall.** On a single visit all of these can be simultaneously true and eligible:
cert renewal due, stale exposure at one site, three experiences verifier-less
after term rollover, four unlinked reflections, an untagged paid/volunteer
record, judgment calls awaiting review, and a synthesis pass offered. Seven
features each decide correctly and in isolation that they are allowed to render.
The student sees a wall and stops opening the tab.

**No new mechanism.** The shell's Attention model (`00-product-shell.md` §7.5)
already has the three severities and the badging discipline. Clinical's nudges
route into it rather than each rendering independently on the page.

**Ranking rule: by what cannot be recovered later.** Not by urgency, not by age.

| Routes to | Why |
|---|---|
| **Important** — cert expiry, verifier re-check | Externally dated or dependent on a person who may become unreachable. Unrecoverable. |
| **Suggested** — unlinked reflection, paid/volunteer, judgment calls | Recoverable at any time, and all three are swept anyway by the pre-cycle export review (#48). |
| **Stays on the page** — stale exposure | It is scoped to one site and belongs on that site's card, where the fact is legible in context (§7). |

**At most one nudge occupies the headline strip at a time**, the highest-ranked
unrecoverable one. Everything else waits its turn or lives in the bell.
`01` §6.11's attention budget is a per-pillar obligation, not only a per-feature
one, and this is where Clinical meets it.

## 7h. Record integrity at logging time (SPECCED Aug 2026 · #57, #58, #59, #60)

Four small rules, grouped because they share one argument: **each prevents a
loss that cannot be reconstructed later**, which is the same case §4.2-D makes
in Academics for transcript fidelity.

### #57 — a role change forks the record, it does not overwrite it

Editing the role on an existing experience from `ED Volunteer` to `ED Scribe`
silently destroys the fact that 200 hours were volunteer and 150 were scribe.
Both are real AMCAS entries at one organization, and §7b's export grouping is by
**organization and role** — so the merged record exports wrong and the split is
unrecoverable by then.

- On role edit, an **inline line under the field**, never a modal:
  *"You've logged 200 hours as ED Volunteer here. Keep those as their own entry?"*
  → `Split` · `Just fixing the name`.
- **`Split` creates the second record and does nothing to the first.** Concurrent
  roles at one site are the normal case, not the exception — a scribe on
  weekdays and a volunteer on Saturdays are both live. **Do not infer that the
  old role ended.** Closing it is a separate, deliberate edit.
- Existing shifts stay attached to the record they were logged against.
- **Because the loss is unrecoverable, the offer persists on the record** until
  answered either way, the same shape as #45a's marker, rather than fading out.
  `Just fixing the name` is remembered per record and never fires again.

### #58 — dormancy is a projection bug, not a role status

**There is no "end this role" action, and nothing is ever blocked.** Logging
keeps working forever, retroactively, including resuming a role after a
multi-year leave. An end date is an AMCAS date-range field and belongs to the
export preview (#48), not to a status flag the student has to maintain.

What is genuinely wrong today: **the pace projection reads a dormant role as
ongoing weekly capacity**, so a job someone left in March drags `hrs/wk` down
indefinitely and the projection is quietly wrong for every student who has ever
changed jobs.

- Compute the rate from **active cadence**, not all-time elapsed weeks.
- **It must recover.** Someone returning from a six-month leave sees their rate
  climb back as they log, never a permanent penalty for the gap. A calculation
  that punishes an absence is the same mistake as a streak.
- **The student declares nothing.** No status to set, no prompt, no dialog.

### #59 — guard impossible entries, never unusual ones

A mistyped `80` for `8` poisons the pace projection, the headline total, and the
AMCAS export, and it will not be caught three years later.

- **One check:** total hours logged across all sites on a single date exceeding
  24. Shifts carry date and hours but no start/end times, so overlap detection
  is not available and must not be faked.
- Inline under the fast-add row: *"That's 80 hours on Mar 14 — did you mean 8?"*
  → `8` · `80 is right`.
- **It never blocks.** The entry saves either way.
- **Nothing fires for "unusual for you."** A long shift is a fact about the
  student's job, and flagging it is a verdict this pillar does not issue.

### #60 — an overnight shift belongs to its start date

A 7p–7a shift logged at 6am lands on the wrong day. This matters more than it
looks: §7's stale-exposure threshold is derived from **3× the median gap between
shifts**, so for a monthly volunteer a one-day error is nothing, while for
someone working three shifts a week on a two-day median it is a 50% error in the
baseline the whole alert is built on.

- A save between midnight and 09:00 defaults the date to **yesterday**, with
  yesterday's date **visible in the field before save**. Never silent.
- The first time a student corrects it at a site, offer to remember
  *"shifts here run overnight"* for that experience.
- Nothing is inferred without the date being on screen and editable.

## 7i. Bulk backfill's block — what it is excluded from, and what it can carry (SPECCED Aug 2026 · #61, #62)

A student who starts using HQ in junior year enters two years of past hours as
**one estimated block** (#9) rather than 200 individual logs. That block is a
single dated lump with an `estimated` flag, and it is a different kind of object
from a shift. Two consequences, one defensive and one additive.

### #61 — the exclusion list, in one place

**The rule already exists in fragments.** #9 says the block never enters weekly
pace; §7d says it carries no unpacking marker. Two sentences, two files, and
every feature since has had to rediscover the rule or silently get it wrong.

**Every arithmetic surface that treats rows as shifts must exclude
`estimated` blocks. The list, exhaustively:**

| Surface | Why |
|---|---|
| **Weekly pace / `hrs/wk`** (§7) | Already stated in #9. A 400-hour lump would swamp the observed rate. |
| **Stale-exposure median gap** (§7, #33) | The threshold is 3× the median gap *between shifts*. One lump distorts the median the whole alert is built on. |
| **Hours-over-time chart** (§8, #34) | A single 400-hour bar flattens every real month to nothing. The block belongs in the running-total view, not the monthly bars. |
| **Impossible-entry guard** (§7h, #59) | **A 400-hour block trips the >24h check on every backfill.** The guard must skip `estimated` rows entirely. |
| **Unpacking markers** (§7d, #45a) | Already stated. No single occurrence to unpack. |

**It is NOT excluded from** the headline total, the site's hours-here figure, or
the AMCAS export — those are hour counts, and the hours are real. The block is
excluded from *rate and cadence* arithmetic, never from *totals*.

**Rule for anything added later:** a feature that reads shift rows to compute a
rate, a gap, or a per-occurrence value checks this list first. If it belongs on
the list, add it here rather than in the feature's own section.

### #62 — bring your own material

**The problem this fixes.** A junior backfilling two years of EMT hours has
**zero reflection material for the two years most likely to hold their best
"why medicine" content**. §7d correctly refuses to attach markers to the lump,
and then says nothing further, so those years stay blank forever.

**What it is.** At backfill time, **once**, alongside the estimated block:
*"Did you write anything during this period?"* A journal, a notes app, an old
scholarship essay, run reflections written for a class. The student attaches
what they have.

**Rules:**

- **Separate pieces, not one blob.** A student may have three things from that
  period and they are not one document.
- **A rough period, never a specific date.** "Summer 2024" or a month. A date
  would imply a specific occurrence, which is exactly what §7d says the lump
  does not have — but #45b needs *some* temporal anchor to say *"in January you
  wrote…"*, and a month is the honest resolution.
- **Labelled as what it is**, with the same discipline as `estimated` on the
  hours: written at the time, brought in later. **It is never presented as
  though it came from the unpacking flow.**
- **The deep-unpack flow may run over it**, and that is what makes it
  comparable in depth to a real #45a thread: the student wrote it then, the AI
  reads it and asks follow-ups now. Same rules as §7d throughout — it asks,
  never drafts, never concludes, never solicits identifiers. §7d already accepts
  reflecting from memory on a late-entered shift, so this is consistent rather
  than a new allowance.
- **No marker, ever.** The block has none by design and this does not add one.
  Offered once at backfill and never again. **Most students will have nothing
  written**, and the feature has to degrade to silence without implying they
  failed at something.
- **With nothing written**, a student may still write a retrospective now — their
  own words, just late — labelled **written now, about then**, and never
  backdated. **What the AI must not do is reconstruct a period from nothing.**
  That is inventing, and it is the line §7d draws everywhere else.

**PHI exposure is genuinely higher here and this is new.** Every other
reflection surface is written *inside* HQ, where the copy discourages
identifiers while the student types. Imported text arrives already written, and
a real EMT journal will contain patient details. The standing no-PHI rule (§14,
`general.md`) has never had to survive text HQ did not watch being written.

- **The import states it plainly before accepting anything.** It cannot be a
  quiet paste-and-go.
- Whether HQ additionally **scans for obvious identifiers** is open — see §16.4.

**Storage:** imported documents are large and land in a store that already has
no quota handling. See `implementation/long-horizon-durability.md` §D1.

## 8. Visualizations

- **Hours over time**, two views (**R8**, Aug 2026): **monthly bars by default** (rate, consistency, gaps), **running total on request**. A segmented switcher in the panel header toggles them; it is a filter, not a mode, so it is a solid form control per `01` §4b-i. Hover shows both figures in either view. Not a dual-axis combo. Bounded height, `01` §5c. Mockup: `mockups/04-clinical/clinical-hours-chart.html`.
- ~~Optional setting mix~~ — **CUT Aug 2026** (catalog #36). Variety is a minor signal here and Shadowing owns breadth. The mockup survives as reference in `mockups/04-clinical/clinical-hours-chart.html` frame 2 if it is ever revisited.
- **Continuity read (#72, added Aug 2026):** engaged months against gap months across a role's life, sitting **beside** the hours chart, not replacing it. Answers *"did I stay with this?"*, which neither bar heights nor a running total answer. **Presence, not volume**: a 4-hour month and a 40-hour month both read as engaged. Descriptive only, no score and no streak. Silent under three months of history. Estimated blocks excluded (#61). Governed by `05-experience-pillar.md` §2a, which binds all five pillars.
  - **Clinical leads with recency and shows continuity second**, the inverse of Volunteering's emphasis. Both are present on both.
  - **This is a display, never an alert.** #33 stale-exposure remains the only thing that speaks unprompted, and it is unchanged.
- No progress ring dominating the top; no grid of stat squares (`04` §10).

## 8a. Components used (feature → library component)

Explicit traceability (from `implementation/component-inventory.md`); motion from the shared system (`04` §7a). Reuses the experience-pillar builder (`05`).

| Feature | Component(s) |
|---|---|
| Compact headline strip | stat row + **Number Flow** (hours) + pace projection |
| Site cards row (hero) | `Card` + **Glow Hover Cards** + **Expandable Cards** (→ peek) |
| Selected-site detail | `RecordOpenWorkspace` / `ObjectInspector` |
| Certifications (expiry, CE) | **Animated Progress Bar** (CE) + **Animated Tags** (current / renew-soon) |
| Shift log + fast-add | `TrackerTable`/list + InlineAddRow + **Calendar/Date Picker** + `AnimatePresence` |
| Skills, one free-text line (§2.6) | plain text field — **no `SkillRow`, no counts** (R1) |
| Hours over time | **Chart** (monthly bars default, cumulative second view, bounded `01` §5c) + segmented view switcher |
| Classifier result (counts/ambiguous) | non-blocking banner (`Alert Dialog`) + **Animated Tags** |
| Add experience | `CreateExperienceDialog` / shell Quick Add |
| **Verifier capture, type-to-create + preset (§7c)** | Same **Searchable Dropdown** typeahead as roles/certs + `EntityLinkCombobox` (Person) |
| **Verifier batched review (term rollover, pre-cycle)** | `Alert Dialog` (non-blocking list) + `CollectionState` + **Smooth Button** per row |
| Request letter | **Smooth Button** → Letters |
| Inspector / right-click | `CenterPeek` + `ObjectInspector` · **Context Menu** |
| ~~Setting-mix~~ | **cut**, catalog #36 |
| **Reflection prompts, chosen (§7d, #45)** | `Badge` chips (selectable, multi) + `Textarea` (misc line) |
| **Unpacking marker, every shift (§7d, #45a)** | `Badge` / **Notification Badge**, per-row status, not a chat component |
| **Continuity read (§8, #72)** | **Chart** (engaged/gap strip, bounded `01` §5c). Not a heatmap: a heatmap implies intensity, and this measures presence |
| **Deep-unpack flow, full screen (§7d, #45a)** | `FocusModeLayout` + `Management Bar` (session control) + `AI Input` + `Message`/`Message Scroller` (turns) + `Typewriter Text` (streaming) |
| **Synthesis pass, full screen (§7d, #45b)** | Same stack as the deep-unpack flow, reused rather than duplicated |
| **Sub-tab nav (§5)** | **Animated Tabs**, underline only. **No `ModeSwitch`**, no glass pill: level 2 alone (`01` §4b-i) |
| **Shifts ledger + month grouping (§5b, #63)** | `TrackerTable` with grouped rows + subtotal headers |
| **Shifts filters (#64, #65)** | `Select` ×2 (site, period) + segmented `Toggle Group` (all/active/ended) |
| **Inline edit on a ledger row (#66)** | `InlineAddRow` in edit mode + `Animated Input` |
| **Add row, every door (#67)** | **One shared `InlineAddRow`**, used by `Sites`, `Shifts`, and Overview. Guards (#59, #60) live in the component. `Searchable Dropdown` for the site picker |
| **Reflections two-axis filter (#68)** | `Select` (site) + segmented `Toggle Group` (state) |
| **Synthesis thread, rendered distinct (#69)** | `Card` variant + **Animated Tags** |
| Reflections → Story Bank | `Smooth Button` (send/link) |
| Cross-link to another pillar | **EntityLinkCombobox** |
| Stale-exposure / cert-renewal / missing-verifier alerts + severity | Attention bell + **Animated Tags** |
| Archive (restore) | `TrashRecovery` |
| Empty / loading / error | `EmptyState` · **Skeleton** |

## 9. Cross-tab relationships

- **Overview** — total clinical hours → the Clinical domain row.
- **Essays / Story Bank** — reflections flow as source material.
- **Profile / CV** — auto-CV aggregation, correctly split paid/volunteer.
- **Letters** — supervisors become potential recommenders; "request letter" hook.
- **People/orgs** — shared canonical entities (`general.md`); a supervisor is one Person across all pillars, never re-entered.

## 10. Inspector design (center peek · `01` §2/§3)

**Expanded Aug 2026.** The one-line version predated the sub-tabs, the reflection work, and R2, and it contradicted two of them.

**What opens the peek:** a site card on `Sites`, a row on `Shifts`, or a thread in `Reflections`. **Three entry points, two record types**, so the peek must know which it holds.

### For an Experience (a site or role)

Sections: **Overview** (site, role, setting, dates, classifier result) · **Shifts** (that site's log + fast add) · **Reflections** (its threads) · **Verification** (verifier contact, request letter) · **Activity** (history).

**Corrections to the old version:**

- **No paid/volunteer control.** R2 and §2.2 are explicit: the field is **inferred and hidden**, surfacing only in the export preview. *"Tag paid/volunteer"* was listed as a quick action and must not be built.
- **Role edits offer `Split`, never a silent overwrite** (§7h, #57). The peek is where a role gets renamed, so this is where the fork offer appears.

**Quick actions:** log shift · add reflection · request letter · archive.

### For a Shift

Sections: **Detail** (date, hours, site, call notes) · **Reflection** (the quick note and, if it exists, the unpack thread).

- **The unpacking marker's two actions live here** (§7d, #45a): unpack, or defer. Both permanent.
- **Edits obey the same guards as every other door**: >24 h (#59), overnight dating (#60).
- **An estimated backfill block opens read-mostly.** Its hours and rough period are editable, but it carries **no marker and no unpack action** (#9, #61).

### Rules

- **The peek is a view of one record, never a second place to browse.** No filters, no lists of other shifts, no cross-record navigation beyond a single link out.
- **`Reflections` threads open into the full-screen unpack flow**, not the peek. A conversation does not belong in a side panel, and §7d already ruled it full screen.

## 11. Empty, loading, error states (`01` §8, `04` §9)

**Rewritten Aug 2026 for three sub-tabs.** The earlier version described one page, so two of the three surfaces had no empty state at all.

**Governing rule:** an empty surface is **an invitation, not an apology**, and never a wall of zeros. Loading is a **skeleton of the list**, never a full-page spinner. An error says **what happened and the fix, in one sentence**.

**The cold start is a whole-tab state, not a per-tab one.** A student with zero clinical experiences sees **one action** on `Sites`, *"Add your first clinical experience,"* with a one-line *"what counts as clinical?"* helper opening the §2.1 explainer. **`Shifts` and `Reflections` are not shown empty in this state.** Three empty tabs read as a broken app rather than a new one. They appear once a first experience exists.

| Surface | Empty | Why this and not a zero |
|---|---|---|
| **Sites** | *"Add your first clinical experience"* + the what-counts helper. **No target, no projection, no pace** (§7a: day one has no target). | The cold start has exactly one useful action. Everything else is noise until a record exists. |
| **Shifts**, no shifts yet | *"Nothing logged yet. Add a shift from any site, or right here."* Filters render but are **disabled**, not hidden. | Disabled-not-hidden so the student learns the surface has filters. Hiding them makes the tab look like a different page later. |
| **Shifts**, filtered to nothing | *"No shifts at Carolina ED in this range."* Plus a **clear-filters** action. | **This is a filter result, not an empty record set**, and conflating the two is the classic failure: the student thinks their data is gone. |
| **Reflections**, nothing unpacked | *"Nothing unpacked yet. Any shift can be unpacked from its row."* | Names the entry point, since the marker lives on shift rows, not here. |
| **Reflections**, filtered to nothing | *"No skipped reflections at this site."* Plus clear-filters. | Same distinction as above. |
| **Credentials section**, none held | **Renders nothing at all.** No empty card, no "add a credential" prompt. | A hospital volunteer holds zero credentials and always will. An empty section would imply they are missing something they do not need. |
| **Hours chart**, under 2 months | The honest dormant line, *"not enough logged yet to show a trend"* (`01` §6.10-A). | Never an empty chart frame or a flat zero line. |

**Loading:** skeletons matching each surface's own shape. `Sites` skeletons cards; `Shifts` skeletons rows grouped under a month header; `Reflections` skeletons thread blocks. **A card skeleton on the ledger would flash the wrong layout** and feel broken even though it resolves.

**Errors are scoped to the surface that failed.** A failed shift save keeps the ledger visible and reports on the row. **A failed AI call in the unpack flow never discards what the student wrote** (§7d), and says so.

## 12. Mobile behavior

**Rewritten Aug 2026 for three sub-tabs.**

**Shifts are logged on a phone, usually right after a shift**, so mobile is not a degraded desktop here; it is the primary logging context. Thumb-friendly and unchanged: date defaults to today, hours, save.

- **Sub-tab nav** collapses per `01` §5c but **stays visible**. It never becomes a dropdown, because sub-tab switching is how a student reaches the ledger to correct a mis-typed entry, which is a common mobile task.
- **Sites:** cards stack full-width (`01` §5c). The selected-site detail opens as a `SidePeek` sheet rather than pushing the card row off-screen.
- **Shifts:** the ledger drops the hours column into the row's second line rather than horizontal-scrolling. **The two filters collapse into one sheet** behind a single `Filters` control, since two side-by-side `Select`s do not fit. **This is presentation only, not the combined-dropdown that §5c forbids**: they remain two independent controls inside the sheet.
- **The add row goes full-width and one field per line** on mobile, keeping the site picker.
- **Reflections:** same filter-sheet treatment. The **deep-unpack flow is genuinely good on mobile**, because it is a text box and a conversation, and a student is most likely to unpack a shift on the drive home rather than at a desk.
- **Reduced-motion and keyboard-only** hold on every surface (`04` §7a).

## 13. Admissions-aware reasoning (`architecture/04`)

- Clinical exposure is near-required and heavily scrutinized; **recent + sustained** beats a large stale total.
- Paid clinical (EMT, scribe, CNA) counts fully — "volunteer only" is a myth; the paid/volunteer split is for *categorization*, not worth.
- Meaningful **patient contact** is the point; "clinical-adjacent" non-contact roles are weaker and the classifier should say so.
- Reflections matter more than the number at essay time — capture the moment, not just the hour.

## 14. Do Not Generalize From Other Tabs

- Patient-contact, the clinical classifier, and verification specifics are **clinical-only** — do not generalize to Volunteering (different "counts" rules) or force onto Research/ECs.
- **No PHI** — reflections and patient-contact notes must never store identifiable patient information (`general.md` privacy); UI copy actively discourages it. **The one surface where this rule is newly stressed is #62's imported material** (§7i): text written outside HQ, where no copy was discouraging identifiers as it was typed. That import states the rule before accepting anything.
- Shadowing is its own pillar (observation, not hands-on); do not fold it in here.

## 15. Acceptance criteria

- [ ] Master–detail: site-card row (with "+ add job / site" ghost) → selected-site detail panel; the site total is the one big number allowed.
- [ ] Shift-based logging: dated shifts (with structured call notes) roll up to the headline; single-shift add takes ~5s (date=today, hours, note, Log).
- [ ] Every experience tagged paid or volunteer; export splits them per AMCAS activity types.
- [ ] Clinical classifier runs on add, returns counts / ambiguous / likely-not with a reason.
- [ ] Pace projection computes from hrs/wk + target and states clears/short; stale-exposure alert fires from shift dates.
- [ ] Certifications tracked per experience (expiry, CE done/needed, renewal-due); renewal alert surfaces on the headline strip.
- [ ] Skills are **one optional free-text line** (§2.6). No observed/performed counts, no skill chips (R1).
- [ ] **Reflection (§7d):** every shift carries an unpacking marker, cleared only by reaching the 2–3 exchange minimum (AI checks in before closing, no ceiling past it) or by explicit deferral; both permanent. Bulk-backfill's aggregate block is excluded. The AI asks, never drafts. No PHI solicited or stored. The full thread, quick note plus deep-unpack exchange, routes to Story Bank.
- [ ] **Synthesis pass (§7d, #45b):** reads every unpacked reflection across every clinical experience at the §7c cadence, not per site; surfaces pattern/change using the student's own prior words only, never an invented narrative.
- [ ] Headline is a compact strip; site cards are the visual hero (`05` §3, `04` §6/§10) — no big stat boxes/ring beyond the single primary site total.
- [ ] AMCAS verifier captured inline; supervisors are shared People entities; "request letter" hooks Letters.
- [ ] Empty/loading/error, light/dark, desktop/mobile, keyboard-only, reduced-motion all verified.

- [ ] **Hour ownership (§2.0):** one record, one category, hours counted once. **Verified by grep, not inspection** — no pillar sums another pillar's records, and hour aggregation reads `category` only. Cross-links are references; moving reassigns and never duplicates.
- [ ] **Mis-filing catch (§2.1):** renders **nothing** for a recognised clinical role. Two questions appear only for an unrecognised role and only once. A middle answer is **saved silently and never asked about at add time**. Every path is inline, non-blocking, and costs no attention budget.
- [ ] **Routing both ways:** Clinical ↔ Volunteering and Shadowing → Clinical are flag-and-offer only; `Move` preserves sessions and reflections; `Keep it here` is remembered per experience. **No record is ever moved automatically.**
- [ ] **Paid/volunteer (§2.2):** present in the data model, inferred from the role, and surfaced **only** in the AMCAS export preview. **No paid/volunteer control exists in any logging surface.**
- [ ] **Skills (§2.6):** the observed/performed counter does **not** exist, and the six hardcoded skill chips are deleted rather than implemented. One optional free-text line replaces them.
- [ ] **Judgment calls** surface once, in the pre-cycle export review, and never at add time.
- [ ] **Structure (§5):** three flat sub-tabs (`Sites` · `Shifts` · `Reflections`), underline only, **no mode switch and no glass pill**. `Sites` is the default landing. **There is no `Credentials` tab and no `Application` tab.**
- [ ] **Logging works from `Sites`, `Shifts`, and Overview**, all rendering the **same `InlineAddRow`**. The >24 h guard (#59) and overnight-dating rule (#60) are enforced identically at every door because they live in the component, not the page. Adding a shift still completes in ≤5 seconds from any of them.
- [ ] **Shifts (§5b):** groups by month with hour subtotals; site, period, and all/active/ended filters; **the ended filter is the only archive surface** (no separate Archive page); rows edit in place; estimated blocks render hatched, carry no marker, and stay out of pace, the gap baseline, the bars, and the >24 h guard.
- [ ] **Reflections (§5c):** **two independent filter controls** (site, state), never one combined dropdown; serves as browse **and** worklist; synthesis threads are visually distinct from single-shift unpacks; **the outstanding count renders on the page, never as a badge on the tab label**; nothing sorts or ranks threads by quality.
- [ ] **Continuity (§8, #72):** an engaged-vs-gap read renders beside the hours chart, **not instead of it**. It measures presence, not volume. **No score, no streak, no consistency rating.** Silent under three months. Estimated blocks excluded. It never speaks unprompted; #33 remains the only alert.
- [ ] **Credentials (§5a, #71):** renders as a **section on `Sites`**, grouped by site, with a **"Not tied to a site"** group so a profile-level credential has somewhere to exist.
- [ ] **Pre-cycle prep panel (§5a, #48):** phase-gated and invisible outside the application window; holds **only** Clinical's own export-readiness work and deep-links to Profile/CV for the cross-pillar picture, including the 15-entry cap it cannot render.

- [ ] **Return rundown (§7f):** Clinical supplies **at most three facts**, all time-based, each a real change during the absence. Runway-vs-hours appears **only where a target is set** and is omitted entirely otherwise. Unpacking markers and stale-exposure **never** appear in the rundown. Logging a shift at a stale site **clears the amber line silently on save** — no acknowledgement, nothing to dismiss.
- [ ] **Nudge routing (§7g):** the seven smart features route through the shell Attention model with severity; cert expiry and verifier re-check are `important`, unlinked reflection / paid-volunteer / judgment calls are `suggested`, stale-exposure stays on its site card. **At most one nudge occupies the headline strip at a time.**
- [ ] **Role fork (§7h, #57):** a role edit offers `Split` inline and **never closes or alters the original record**. Concurrent roles at one org are supported. The offer **persists until answered**; `Just fixing the name` is remembered per record.
- [ ] **Dormancy (§7h, #58):** pace reads **active cadence**, not elapsed weeks; a returning student's rate **recovers**; there is **no end-role action and no status for the student to maintain**; nothing is ever blocked or removed.
- [ ] **Impossible entries (§7h, #59):** exactly one check — over 24 total hours on one date. Inline, **never blocking**. **No check fires on "unusual for you."**
- [ ] **Overnight (§7h, #60):** a save before 09:00 defaults to yesterday **with the date visible and editable before save**; per-experience overnight preference offered on first correction.
- [ ] **`estimated` exclusions (§7i, #61):** blocks are excluded from weekly pace, the median-gap baseline, the monthly bars, the >24h guard, and unpacking markers — **and included in** the headline total, hours-here, and the AMCAS export. **Verified by grep**, not inspection: every surface computing a rate, gap, or per-occurrence value checks the flag.
- [ ] **Imported material (§7i, #62):** offered **once** at backfill and never again; separate pieces with a **rough period, never a date**; labelled as written-then-imported and **never shown as an unpacking-flow output**; **adds no marker**; degrades to silence when the student has nothing. A retrospective written now is labelled written-now-about-then and never backdated. **The AI never reconstructs a period from nothing.** The PHI rule is stated before any text is accepted.

## 16. Open decisions

1. ~~Whether "patient-contact count" per shift is worth the extra field~~ — **RESOLVED Aug 2026: kept, minor, optional, off by default**, and generalized. Specced in §7e as one instance of AI-extracted numerics from text the student already wrote, rather than a standalone field. Catalog #52.
2. ~~How assertive the classifier is on ambiguous roles~~ — **RESOLVED, implicitly, by the writing itself.** §2.1's mis-filing catch is built end to end as flag-and-suggest, never a soft-gate: "inline, never modal, never blocking" appears in §2 point 1 and again in the §15 acceptance criteria. No soft-gate language survives anywhere in the file. Marked resolved here so it stops reading as undecided.
3. ~~Whether setting-mix visualization earns its place~~ — **RESOLVED: cut**, Aug 2026. Catalog #36, board §4. Mockup kept as reference only.
4. ~~Whether HQ scans imported material for patient identifiers, or only warns~~ — **RESOLVED Aug 2026 (Andy): neither. It redacts.** *"each time a name is brought up, you can just do a redacted [name]... when they paste, I don't want them to, because the process is supposed to be easy for them."*

   **The student is never asked to do anything.** They paste whatever they have. A name that appears becomes `[name]` on the way in. **No warning to read, no cleanup to perform, no flag to dismiss.**

   Both earlier options were worse for the same reason: they moved work onto the student. A warning makes them proofread; a scan makes them arbitrate false positives. **Redaction moves the work to the app, which is where it belongs.**

   **Scope:** applies to #62's imported material and to #45a/#45b's free-text, since both are places a name can arrive. It is not a compliance feature and should not be described as one; it is one small thing the app does quietly so the student does not have to think about it.
