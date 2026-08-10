# Shadowing

> **Governed by:** `specifications/05-experience-pillar.md` for the SHARED FRAME ONLY (`05` makes no per-pillar claims; this file is the source of truth for its own domain). This file is the **domain depth** for Shadowing: the function, entities, smart features, and admissions reasoning unique to physician observation. The shared frame (compact stat strip, experience list as hero, center-peek inspector) comes from `05`.

**Status:** Designed (August 2026)
**Sidebar group:** Experiences · **Spec type:** domain tab
**Repo:** `sasquach67/Premed-OS` — `src/pages/ExperiencePillar.tsx` (shared builder), Shadowing config
**Depends on:** `specifications/00-product-shell.md`, `01-shared-interface-patterns.md`, `04-visual-craft-standards.md`, `05-experience-pillar.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Shadowing experiences, per-visit session logs, per-visit reflections, the physician directory derived from them.
- **References only:** People (physicians as `Person` records — shared with Letters), organizations (practices, hospitals), Story Bank (reflections flow there), Profile/CV, Letters (physicians as recommenders), School List (DO-letter requirements).

---

## 1. Purpose

Give a pre-med an accurate, always-current record of **what medicine they have actually watched being practiced** — which specialties, in which settings, with which physicians, and what they understood from it. Shadowing is the experience adcoms use to test whether "why medicine" is informed or imagined, and it is almost always reconstructed from memory two years later. This page exists so the specialty mix, the physician relationships, and the one reflection per visit are captured while they are still true.

## 2. What makes Shadowing unique (do not generalize)

Six things live *only* on this pillar. They are why Shadowing is a first-class page and not a config row on Clinical:

1. **Breadth is the signal, not volume — and HQ never tells you when to stop (REWRITTEN Aug 2026).** Forty hours across five specialties says more than a hundred in one. **What the page leads with is coverage, not a running total.**

   > **The `sufficiency call` is CUT.** Andy, Aug 2026: *"this sufficiency call is probably the most ridiculous thing I've ever seen. Why are you trying to put caps? Targets are not necessarily caps. Why would you ever limit the amount of hours that you do?"*
   >
   > **He is right, and the old §2.1 was the root of it.** It read *"once a student clears a reasonable total with reasonable breadth, HQ says 'this is enough' and stops nudging"* — **a verdict about someone's life, fired on a threshold this file admitted was unsourced** (old §16 #3, `deferred.md` R-10). **It was a cap in a friendly voice.**
   >
   > **And it was flatly wrong for a real student:** someone who loves cardiology and shadows one physician for a hundred hours has built the relationship that produces the best letter they will ever get. *"You're done at 40"* is actively bad advice to that person.

   **What survives, because it was the true part:** shadowing has **diminishing returns in a way clinical work does not** — you are observing, not contributing, so hour 150 teaches less than hour 15 did. **That is an observation the page can reflect by leading with breadth. It is not an instruction, and HQ never issues one.**

   **The distinction that was collapsed, now law:** *HQ not nagging you about breadth once you have breadth* is fine — it is the app being quiet. *HQ declaring you finished* is a judgment nobody asked for. **Only the first is permitted.**
2. **Breadth is the metric, not volume.** The question is *how many distinct specialties*, not how many hours. **Primary care exposure is specifically checked** — a large share of schools weight it, and a record that is entirely surgical subspecialties reads as uninformed about the profession. Coverage, not total, is the headline number.
3. **Shadowing is NOT clinical hours, and the boundary is enforced.** Observation without patient responsibility does not count as clinical experience; AMCAS files it under *Physician Shadowing/Clinical Observation*, separate from clinical employment or volunteering. **A shadowing experience must never contribute to the clinical hour total** (Clinical §2.1's classifier is the mirror of this rule). Students routinely conflate the two and discover the shortfall at application time.
4. **The physician is the record.** Other pillars are organized by organization; shadowing is organized by **person**. A directory of physicians builds itself from visits, carrying specialty, degree, setting, hours observed, last visit, and letter status. This is relationship-shaped data, and it is the pillar most likely to produce a recommender.
5. **MD vs DO is a tracked, consequential field.** Many osteopathic schools expect a letter from a DO, and a student who shadowed only MDs discovers this while writing secondaries. **Degree is captured per physician**, the DO gap is surfaced against the School List, and it is stated as a requirement of specific schools rather than as generic advice.
6. **The capture unit is one reflection, not hours.** *"What did you understand today that you didn't yesterday?"* — one line per visit. Hours are trivially loggable and nearly worthless in an essay; the observed decision, the workflow, the conversation with a family is the material. **A visit with hours and no reflection is treated as incomplete**, and it is the only pillar where that is true.

## 3. Primary users and stages

- **Early (freshman/sophomore):** zero or one physician, usually a family connection. Needs the page to make asking easy and to explain what shadowing even is.
- **Mid (sophomore/junior):** accumulating specialties. Needs the breadth gap named and the primary-care check surfaced.
- **Application year:** needs the record complete, reflections exported to the Story Bank, physicians converted into letter requests.
- **DO applicants:** need the DO-letter requirement tracked explicitly against their School List.

## 4. Core entities

- **`ShadowingExperience`** — `physicianId`, ~~`specialty`~~ **(DELETED Aug 2026, S-18 — specialty belongs to the physician and is never separated from them. Two fields meant the coverage hero could answer "how many specialties" two ways depending on which one was read, and look right either way. Read it from `Physician.specialty`)**, `setting` (`inpatient | outpatient | OR | ED | clinic | telehealth`), **`practiceEnvironment`** (`private practice | hospital system | academic medical center | community clinic | other` — **added Aug 2026, S-15**), **`patientsObserved?`** (multi-select preset list — **S-12**), `startDate`, `endDate?`, `status`, `totalHours` (derived), `notes`.
  - **`practiceEnvironment` is a distinct axis from `setting`.** `setting` is *where care happens*; this is *how the practice is organised* — owned vs employed, autonomy, volume, minutes per patient. **Cardiology in a physician-owned practice and cardiology inside a hospital system are the same specialty, same setting, different jobs**, and a student who has only seen one has seen one version of the work.
  - **`patientsObserved` describes the physician's patients, not the student's contribution** — you are observing, not serving. **Label it `Patients you observed`, never `Population served`**, which is Volunteering's field and means something the student did.
  - **Neither field is ever rendered as a coverage grid or a set to complete** (S-11's rejection applies to both). **A field you fill in.** No *"you have not seen private practice yet."*
- **`ShadowingSession`** — one visit: `date`, `hours`, **`reflection`** (the required-in-spirit field), `proceduresObserved?`, `patientMomentFlag?`, `sentToStoryBank`.
- **`Physician`** — a `Person` record with `degree` (**`MD | DO | MBBS | PA | NP | other`** — PA and NP named rather than bucketed, Aug 2026 S-13, because a free `other` cannot be filtered, counted, or reported on. **No nudge and no move-offer attached: a student shadowing a PA made a choice, and the app records it and says nothing.** A Category A check on how AMCAS treats PA/NP observation is owed **before any copy asserts a filing rule**), **`specialty` — the single source of truth for specialty (S-18, Aug 2026: `ShadowingExperience.specialty` is DELETED. Two fields meant the coverage hero could answer "how many specialties" two different ways depending on which one the code read, and look correct either way. A physician has a specialty; if you shadow a family medicine doctor in the hospital, you shadowed a family medicine doctor — `setting` and `practiceEnvironment` already carry where and how)**, `subspecialty?`, **`practice` (a plain string on this record, NOT a referenced org — §4a)**, `contactPreference`, `letterStatus`, `hoursObserved` (derived), `lastVisit` (derived), **`questionsToAsk?`** (S-17 — two or three lines, *things I want to ask them*, standing on the person so unasked questions survive from one visit to the next), **`bio?` + `bioUrl?` + `bioSource?` + `bioRetrievedAt?`** (S-16, added Aug 2026). **Shared with Letters — never forked. Never shared across students** (§14).
  - **The bio is what makes this a directory worth opening** (S-16). **Physicians are the only entity in this app that come with a published biography** — a faculty page, a practice team page, a university profile. A hospital has no life story; a person does. **Three uses:** preparing for a day you will spend with someone, writing a cold email that references their actual work rather than nothing (the concrete half of S-10), and Andy's own reason — *"so I can read it for fun,"* which is legitimate.
  - **Paste, never crawl.** The student pastes a link or the text; **HQ does not fetch it.** Scraping portals is already banned (`03-clinical-board.md` §5), a static app cannot fetch arbitrary origins anyway, and **auto-crawling a named person's page is a different act from a student saving a page they were reading.** Reuse `Preview Link Card` (`03-overview.md` §6a) — no new component.
  - **`◐` degrades gracefully.** No key: the link and the pasted text. With one: **a 2–3 line summary of what was pasted, and nothing beyond it.**
  - **The imported bio and the student's own notes stay separate fields.** *"Transplant fellowship at Hopkins"* and *"let me hold the retractor"* are different things and must not merge.
  - **Optional forever, and never nudged about.** A physician with no bio is a complete record.
- **Derived:** specialty coverage set, primary-care flag, DO-coverage flag, per-physician recency.

## 4a. The collapse: site, contact, verifier, and recommender are one person (RULED Aug 2026)

**Andy:** *"the 'site' should just be whoever the physician is, and vice versa."*

**This is the pillar's defining structural feature, and it settles three open questions at once.** Clinical keeps these as separate things — a **site** (UNC Hospitals ED), a **supervisor**, an **AMCAS verifier**, and later a **recommender** — occasionally four different records. **Here they are the same person.**

| Clinical slot | Shadowing |
|---|---|
| Site / organization | **The physician** |
| Supervisor | **The physician** |
| AMCAS verifier | **The physician** |
| Potential recommender | **The physician** (§7's letter-conversion prompt) |

**Consequences, all of which reduce work rather than add it:**

- **No separate organization entity.** A practice or hospital name is **an attribute on the `Physician` record**, never a shared canonical org. **`#54`'s shared org directory does not inherit here in any form** (§14).
- **No separate verifier field or entity.** The shared builder's verifier slot **points at the physician record.** Building a second contact model on this pillar is a defect.
- **§7c's batched verifier-capture workflow does not run.** It exists to solve *"you logged 40 shifts and never recorded who can confirm it"* — **impossible here, because you cannot log a visit without naming the physician.** The capture happens at log time.
- **The completeness check survives.** A physician can exist as a name with no email or phone, and the AMCAS entry needs both. **#48's pre-cycle prep panel still flags incomplete physician contact details** — what is cut is *"go find a verifier,"* not *"is this contact usable."*

## 4b. Unpacking is Clinical's mechanism, configured — not a second one (RULED Aug 2026)

**Andy:** *"Shadowing is an unpacking thing. The mechanism should still be the same as Clinical. They should still do the same job in everything."*

§2.6's reflection requirement and Clinical's **#45a unpacking marker** are the same idea arrived at independently. **They merge.** One marker, one set of rules about permanence and deferral, one component.

- **Shadowing's copy survives the merge** — *"what did you understand today that you didn't yesterday?"* is a better prompt than Clinical's generic one. **The wording is configured; the machinery is not forked.**
- **A visit may always be saved without an reflection.** The marker persists on the row until unpacked or deferred; the nudge fires once and never blocks (§7).
- **#45b's cross-experience synthesis matters more here than on any other pillar.** *"What did you learn about medicine across six physicians and five specialties?"* is a better question than any single visit can answer — and it is the question the AMCAS entry actually needs answered.

## 5. Structure: three flat sub-tabs (RULED Aug 2026, S-4)

**`Physicians` · `Visits` · `Reflections`.** Three, flat, underline nav, **no mode switch** — the same shape Clinical and Volunteering use (`03-clinical.md` §5), with this pillar's vocabulary.

| Clinical | Volunteering | **Shadowing** |
|---|---|---|
| Sites | Orgs | **Physicians** |
| Shifts | Sessions | **Visits** |
| Reflections | Reflections | **Reflections** |

**`Reflections`, not `Reflections`.** The spec already uses the word throughout and it is the better one here: a reflection is what an experience meant to you; **an reflection is what you understood that you did not understand yesterday.** The domain word survives; the component does not fork (§4b).

**Stat strip (variable metrics only, `05` §3 / `04` §6):** one slim line — `184 hrs · 5 specialties · 7 physicians · last visit 12 d ago`. **No progress ring, no stat-square grid** (`04` §10).

**Where target, pace, and the hours chart live (closes the gap the Aug 2026 reversal opened).** They inherit like every pillar (§14), and they follow Clinical's placement exactly: **target in the `Physicians` detail panel, chart on `Visits`.** Nothing about them is Shadowing-specific.

### 5a. Physicians, the default landing

- **Specialty coverage is the hero, ABOVE the directory — and this is a deliberate exception (S-5, RULED Aug 2026).** Every other pillar leads with its entity list. **Here a table leads and the entity list sits beneath it.** *Stated as a choice so nobody "fixes" the inconsistency:* the question this pillar answers is **breadth**, and a list of seven physician cards cannot show breadth — **a specialty × hours × settings table can.** The directory is how you get to a record; the table is what you came to see.
  - Columns: **specialty · hours · share · settings seen · practice environments seen** (S-15). **Never an uncovered-specialty grid** — that is S-11, rejected: a grid of empty cells manufactures an obligation out of a layout choice.
- **Physician directory beneath**, building itself from visits. Each card: **name · degree chip (`MD` `DO` `PA` `NP`) · specialty · practice environment · practice name · hours observed · visit count · last visit · letter status.**
  - **No ask or application pipeline (RULED Aug 2026, S-7 CUT).** Andy: *"it only needs to track positions that I already have, so we can scratch the application and the act of asking a potential physician to shadow."* **This pillar records what you have, not what you are chasing.** No `identified`, no `asked`, no `declined`, no planned visits. **A physician enters the directory when you have shadowed them.**
  - **Letter candidate marker (S-8)** rides here, derived from visit count plus recency with one person. **Derived, never asked** — a student should not have to declare who likes them.
- **Target lives in the selected-physician detail panel**, per Clinical's placement. Hours-here as the one allowed big number (`04` §6).
- **Detail panel splits into:** the visit log with its fast-add row (site-scoped view of the same records `Visits` shows), contact completeness for the AMCAS entry (§4a), and the reflection list for that physician.
- **Empty state:** *"Add a visit and the directory builds itself."* **One action, and no implied hour target** (§15).

### 5b. Visits, every visit across every physician

- **Reverse-chronological, month-grouped**, inheriting Clinical's `Shifts` mechanics whole (#63–71): month headers with subtotals, inline edit, and **the shared `InlineAddRow`** — so logging works identically here, on `Physicians`, and from Overview.
- **No upcoming section, and no planned visits (S-7 CUT, Aug 2026).** Every row is a visit that happened. **A date you want to remember is a task, and tasks are Overview's** — this pillar does not grow a second scheduling surface.
- **Two independent filters, never one combined control** (the same axes Clinical's Reflections uses): **who** (all physicians, or one) and **state** (all · reflection written · not yet · deferred).
- **Every row carries the unpacking marker** (§4b) until its reflection is written or deferred.
- **The hours chart lives here**, matching Clinical (`03-clinical.md` §5b). Monthly bars plus running total.
- **`proceduresObserved` stays inside the reflection text — RULED Aug 2026 (old §16 #2).** Structuring it invites exactly the skills tracking R1 cut from Clinical, and **that argument already won once.** A row shows date · physician · specialty · hours · marker, and nothing about what was performed.

### 5c. Reflections, the shadowing-scoped door

- **One record set, two doors.** Story Bank is the aggregate view; this is the pillar-scoped one. **A filter, never a copy** (`03-clinical-views-board.md` V5).
- **Two filters**, matching `Visits`: **who** (all physicians, or one) and **state** (all · unpacked · deferred · not yet).
- **#45b synthesis threads appear here, visually distinct from single-visit unpacks.** They matter more on this pillar than any other: *"what did you learn about medicine across six physicians and five specialties?"* is a better question than any one visit can answer, **and it is the question the AMCAS entry actually needs answered.**
- **No sorting by quality.** No "most reflective," no length ranking, no score on a thread.

## 6. Main workflows

- **Log a visit in under 5 seconds** — physician, date, hours, reflection. Physician autocompletes from the directory; a new name creates the `Person` inline.
- **Add a physician without a visit** (a planned or pending contact), so the ask itself is trackable.
- **Convert a physician into a letter request** — one action, deep-links to Letters with the relationship prefilled (`CLAUDE.md`: Letters structure unchanged, prefill only).
- **Send an reflection to the Story Bank** — one action per session.
- **Archive a physician relationship** — close it without deleting visits or reflections. **(Replaces "close the record — mark shadowing sufficient", cut Aug 2026: there is no "sufficient" state to mark.)**

## 7. Smart features (rules-based, explainable — `architecture/02`, `general.md`)

- ~~**Sufficiency call**~~ — **CUT Aug 2026 (§2.1).** It announced *"this is a complete shadowing record; you can stop"* and then permanently switched off breadth nudging, **on an unsourced threshold.** No verdict, no announcement, no permanent state change, **and no feature is ever disabled by a number HQ decided.**
- **Breadth nudge (what replaces it).** Fires when coverage is thin — *"all 32 hours are in one specialty."* **It simply does not fire once coverage is not thin.** That is the whole mechanism: **HQ going quiet, never HQ declaring you done.** Dismissible, once per cycle, and it competes in the attention auction like everything else.
  - **This also removes R-10 as a blocker.** You need a sourced number to *assert a standard*; you do not need one to decide when to *stop saying something*.
- **Specialty breadth gap** — names what's missing and why it matters: *"All four of your physicians are surgical. Schools read a record with no primary care as narrow."*
- **Primary-care check** — a specific, separately-surfaced flag, not folded into breadth.
- **DO-letter gap** — fires **only when the School List contains osteopathic schools**, and names them: *"3 of your schools expect a letter from a DO. All 6 of your physicians are MDs."* Dormant otherwise — never generic advice.
- **Missing reflection** — a visit logged with hours and nothing else: *"You logged 4 hours with Dr. Osei and nothing about it. What did you see?"* Fires once, dismissible, never blocks the log.
- **Misfiled-as-clinical catch** — a shadowing record describing hands-on responsibility is probably clinical; flag-and-offer to move, **never auto-move** (mirrors Volunteering §7 and Clinical's classifier).
- **Letter-conversion prompt** — a physician with sustained hours and a warm record: *"You've shadowed Dr. Reyes 18 hours across 6 months. That's a letter relationship."*
- **Stale-ask nudge** — a physician contacted but never scheduled, 3+ weeks on.
- **Certifications and skills counts stay out.** Those are Clinical's and mean nothing for an observer. **Streaks stay out app-wide** (`03-clinical-board.md` §5). **Hours themselves are fine** — see §14, revised Aug 2026.

## 8. Visualizations

- **Specialty coverage** (the hero table's share bars) — breadth at a glance.
- **Hours per specialty** (compact, bounded height, `01` §5c) — only where it earns space.
- **The hours chart (#34) inherits like every other pillar (REVERSED Aug 2026).** It was excluded on the grounds that it *"encourages the accumulation this pillar exists to discourage"* — **and the pillar no longer exists to discourage anything.**
- **Specialty coverage stays the hero.** That is a statement about *what leads the page*, not a ban on showing hours. **Breadth is the more useful read here; volume is still the student's to see and set a target against.**

## 8a. Components used (feature → library component)

**Rewritten Aug 2026** for the three sub-tabs and the rulings above. **Nothing here is a Shadowing-only component** — every row is a shared component configured, which is the point (`05` §1: one builder, not five pages).

| Feature | Component |
|---|---|
| Banner + stat strip | `PillarShell` banner + `BannerStat` |
| **Sub-tab nav** (`Physicians · Visits · Reflections`) | Underline tabs per `01` §4b-i. **No glass, no pill row** (`04` §0c) |
| Specialty exposure table (the hero) | `TrackerTable` — solid rows, no glass |
| Physician directory | `ContactCard`, **shared with Letters and Clinical — never forked** |
| **Physician bio** (S-16) | `Preview Link Card` (already exists for Quick Capture, `03-overview` §6a) + `Textarea`. **No new component** |
| **Questions to ask** (S-17) | `Textarea` on the physician record |
| Visit logging, every door | **`InlineAddRow`** — identical on `Physicians`, `Visits`, and Overview. Guards live in the component |
| Visit history | `ExpandableEntryRow` |
| **Unpacking marker** | `Badge` on the row — **Clinical's #45a configured, not reimplemented** (§4b). Never a chat component |
| **Unpack + synthesis flow** | Clinical's full-screen flow (#45a/#45b), shared |
| **Two filters** on `Visits` and `Reflections` | Two solid form controls per `01` §4b-i. **Never one combined dropdown** |
| Month grouping + subtotals | Inherited from Clinical `Shifts` (#63–71) |
| **Hours chart** | Inherited (#34) — lives on `Visits`, matching Clinical |
| **Target + pace projection** | Inherited whole from `03-clinical.md` §7a — **student-set, never pre-filled** |
| Breadth gap notice | Shared intelligence panel (same component as Overview Smart next actions). **Not a "sufficiency" notice — that is cut** (§2.1) |
| Letter candidate marker (S-8) | `Badge` on the physician card, derived |
| Record peek | `CenterPeek` + `ObjectInspector` (§10) |
| Teaching copy | `MascotNote` — `empty` and `teaching` variants (`01` §4f) |
| Empty states | `MascotNote` empty variant + first action |
| Loading / error | `Skeleton` (Shimmer) · `CollectionState` · `AppErrorBoundary` |

## 9. Cross-tab relationships

- **Letters** — **the strongest tie any pillar has.** A physician you shadowed repeatedly is often the best recommender a student will get, and **the record already holds the relationship**: visit count, recency, hours, and your own notes. Conversion is a **deep-link prefill only** (`CLAUDE.md`: Letters structure unchanged). **S-8's letter candidate is derived here and surfaced here**, never asked.
- **Clinical** — **a hard boundary in both directions.** Shadowing hours never enter the clinical total (§15, grep-verified). The misfile classifier routes records that landed in the wrong pillar, **flag-and-offer, never auto-move**, preserving visits and reflections on the move.
- **Story Bank** — **reflections are the same records, filtered** (§5c). Story Bank is the aggregate door, `Reflections` is the pillar-scoped one. **Never a copy.**
- **School List** — supplies the **DO-letter requirement** and any per-school shadowing expectations. **The dependency runs one way:** School List tells Shadowing what a school wants; Shadowing never tells School List a student is ready.
- **Profile/CV** — auto-aggregates into **`Physician Shadowing/Clinical Observation`**, and owns the application-wide 15-entry cap (`03-clinical-views-board.md` V3). **No pillar-scoped surface can render that cap**, so Shadowing's prep panel deep-links out for the cross-pillar picture.
- **Overview** — contributes **specialties covered** and hours. **HQ never contributes a "shadowing is sufficient" signal**, because no such state exists (§2.1).
- **Sauce** — the cold-email material lives there, not here (board S-10). This pillar links out; it does not compose.

## 10. Inspector design (center peek — `01` §2/§3)

**Written Aug 2026 for three sub-tabs.** Opens from a physician card on `Physicians`, a row on `Visits`, or a thread in `Reflections`: **three entry points, two record types.**

### For a Physician

Sections: **Who they are** (name, degree, specialty, subspecialty, practice, practice environment, patients observed) · **Bio** (S-16) · **Questions to ask** (S-17) · **Visits** (log + fast add) · **Reflections** (their threads) · **Letters** (status, candidate marker) · **Activity**.

- **Quick actions:** log a visit, add a question, paste a bio, request a letter, archive.
- **The bio section renders its source and retrieval date**, and is plainly separated from the student's own notes — *"transplant fellowship at Hopkins"* and *"let me hold the retractor"* never merge (§4).
- **Questions to ask persist across visits.** Unanswered ones stay; there is no per-visit list to throw away.
- **No verification section.** The physician *is* the verifier (§4a) — a separate field would be the same person twice. **What renders instead is contact completeness**, since the AMCAS entry needs an email or phone.
- **Nothing about asking, applying, or scheduling** (S-7 cut, §5a).

### For a Visit

Sections: **Detail** (date, hours, physician, setting) · **Reflection** (the entry, and the unpack thread if one exists).

- **The unpacking marker's two actions live here**: unpack, or defer. **Both permanent** (§4b).
- Edits obey the shared guards (>24h, #59).
- **No `proceduresObserved` field** (§5b) — what was performed lives inside the reflection text or nowhere.

### Rules

- **One record, never a second place to browse.** No filters, no lists of other visits.
- **Threads open into the full-screen unpack flow**, not the peek.
- **A physician peek never shows another student's data.** No counts, no "others also shadowed here" (§14).

## 11. Empty, loading, error states (`01` §8, `04` §9)

**Written Aug 2026 for three sub-tabs.** Empty is **an invitation, not an apology**. Loading is a skeleton of each surface's own shape. Errors say what happened and the fix in one sentence, scoped to the surface that failed.

**Cold start is a whole-tab state.** A student with zero physicians sees **one action** on `Physicians`: *"Add the first physician you shadowed"*, plus a one-line *"what counts as shadowing, versus clinical?"* helper. **`Visits` and `Reflections` do not render empty in this state** — three empty tabs read as a broken app rather than a new one.

| Surface | Empty | Why |
|---|---|---|
| **Physicians**, cold start | One action plus the what-counts helper. **No hour figure, no target, no "typical" number.** | **Day one must not imply an amount.** The old copy here named *"40–50 hours"* as a normal target — that was the sufficiency thinking (§2.1) and it is cut |
| **Specialty coverage**, under 2 specialties | The honest dormant line (`01` §6.10-A) | A coverage table with one row is a fragment, not a read. **Never an uncovered-specialty grid** (S-11) |
| **Physician with no visits** | *"No visits logged yet"* beside `Log a visit` | **Not an error.** A physician can exist before the record fills |
| **Visits**, none logged | *"Nothing logged yet. Add a visit from any physician, or right here."* Filters render **disabled, not hidden** | So the student learns the surface has filters |
| **Visits**, filtered to nothing | *"No visits with Dr. Reyes in this range."* Plus clear-filters | **A filter result is not an empty record set**, and conflating them makes a student think their data vanished |
| **Reflections**, nothing unpacked | *"Nothing unpacked yet. Any visit can be unpacked from its row."* | Names the entry point, since the marker lives on visit rows |
| **Bio**, none saved | **Renders nothing at all** | S-16 is optional forever and never nudged about. An empty bio slot would imply an obligation |
| **DO-letter check** | **Renders nothing** until osteopathic schools exist on the School List | `01` §6.10-A: a dormant feature is absent, not empty |

## 12. Mobile behavior

**Written Aug 2026 for three sub-tabs.** A visit ends and the student walks out of a building — **mobile is the primary capture context**, not a degraded desktop.

- **Sub-tab nav** collapses per `01` §5c but **stays visible**, never becoming a dropdown.
- **Physicians:** the coverage table scrolls horizontally with the specialty column pinned; cards stack full-width beneath it; the detail panel opens as a `SidePeek` sheet.
- **Visits:** the ledger drops hours to a second line rather than horizontal-scrolling. **The two filters collapse into one sheet** behind a single `Filters` control — **presentation only**, not the combined dropdown §5b forbids. They remain two independent controls inside the sheet.
- **Reflections:** threads open full-screen. The unpack flow is **the one place a modal stack is acceptable**, because it is the whole task.
- **Logging a visit completes in one screen, no modal stack**, and the 5-second rule holds on a phone.
- **Text fields stay standard `input`/`textarea`** so system dictation works untouched. **An reflection is most often spoken in a parking lot**, and a custom editor that breaks dictation would cost more than it adds.
- **The bio renders as a collapsed card on mobile**, expanding on tap — it is reading material, not something to scroll past on the way to logging.

## 13. Admissions-aware reasoning (`architecture/04`)

- **Breadth is the signal that carries weight**, and the page leads with it. **HQ never states an amount that is enough** — no threshold, no "typical," no sufficiency (§2.1). **A student's own target is theirs to set** (§14).
- **Shadowing does not substitute for clinical experience** and is never counted toward it. This is the single most consequential boundary on the pillar, and it is grep-verified (§15).
- **DO applicants carry a distinct, checkable requirement** — a letter from a DO. **Dormant unless the School List contains osteopathic schools**, and it names them when it fires.
- **PA and NP observation is recorded honestly and filed separately** (§4, S-13). **HQ asserts no rule about how AMCAS treats it** until that is sourced.
- **Depth and breadth pull in opposite directions, and both are legitimate** (S-8). Breadth is what the application reads; **repeated visits with one physician are what produce a letter.** The page shows both and ranks neither.
- **Claims are phrased by their evidence** (`01` §6.14): coverage is observed and stated plainly. **Whether a relationship is "letter-ready" is hedged**, because only the student knows its warmth — HQ can see six visits, not whether she liked you.

## 14. Do Not Generalize From Other Tabs

- **Do not import Clinical's recency-staleness warning.** A three-month gap in shadowing is normal and not a problem.
- **Targets and pace projection INHERIT here, exactly as on every other pillar (REVERSED Aug 2026).** They were excluded because *"this pillar's correct end state is stop"* — **a premise Andy rejected**: *"targets are not necessarily caps."* `03-clinical.md` §7a's whole apparatus applies unchanged: **no target on day one, suggested from stated capacity or observed rate, always labelled `Your target`, never pre-filled, optional forever.** A student who wants a shadowing target sets one.
- **Streaks stay out** — but app-wide (`03-clinical-board.md` §5), not for a Shadowing-specific reason.
- **HQ still never states a required amount.** Inheriting a *student-set* target is the opposite of asserting a standard. **The ban is on HQ having an opinion about how much is enough, not on the student having one.**
- **Do not organize by organization.** The physician is the record.
- **Do not inherit `#54`, the shared cross-user organization directory — in any form** (RULED Aug 2026). It earns its place on Clinical because students **genuinely share sites**: a hundred pre-meds cycle through UNC Hospitals ED, so *"12 students logged hours here"* is real signal and the merge saves real typing. **Shadowing is 1-on-1 by construction** — mentors vary per student, so the overlap that makes a shared directory useful barely exists. Andy: *"let's try not to pull in a database of common mentors because that's just not necessary."* **The result would be a privacy risk on a named private individual in exchange for almost no value.** This is not a close call, and it is written here because #54 inherits everywhere else and someone will generalize it for consistency.
- **Never render a cross-user count about a person.** No *"8 students have shadowed Dr. Reyes."* A hospital is an institution; a physician is a person who never opted into anything.
- **The physician bio is never shared, suggested, or merged across students** (S-16). One student's saved page is their private note, not a seed for a directory. **And it is never a discovery surface** — you can only hold a bio for someone already in your own directory. The moment it becomes searchable across doctors you have not contacted, it is a different product with a different privacy story.
- **Do not build a second contact or verifier model** (§4a). The physician record fills the site, supervisor, verifier, and recommender slots. **Do not run §7c's batched verifier-capture workflow** — there is nobody to go find later.
- **Do not build a second unpacking mechanism** (§4b). #45a is configured with Shadowing's wording, not reimplemented.
- **Do not treat a specialty as a "cause."** Volunteering's throughline logic doesn't apply — breadth is the goal, not coherence.

## 15. Acceptance criteria

- [ ] Shadowing hours **never** contribute to the clinical total anywhere in the app — verified by grep, not inspection.
- [ ] **No sufficiency call, "you can stop" copy, or `sufficient` state exists anywhere on this pillar** — verified by grep. **No feature is ever permanently disabled by a threshold HQ chose.**
- [ ] **Targets, pace projection, and the hours chart behave exactly as on Clinical and Volunteering** — student-set, never pre-filled, optional forever. **Verified by diff against `03-clinical.md` §7a, not by inspection.**
- [ ] **HQ never states a required or sufficient amount of shadowing**, in any copy, at any point.
- [ ] The **breadth nudge fires on thin coverage and simply stops firing when coverage is not thin** — no announcement on the transition.
- [ ] **Three flat sub-tabs — `Physicians` · `Visits` · `Reflections`** — underline nav, no mode switch, matching Clinical and Volunteering.
- [ ] **Specialty coverage leads `Physicians`, above the directory**, and **no uncovered-specialty grid exists anywhere** (S-11).
- [ ] **Logging works identically from `Physicians`, `Visits`, and Overview** — one shared `InlineAddRow`, guards inside the component. **5-second loop preserved at every door.**
- [ ] **No planned visits, ask pipeline, or `declined` state exists anywhere on this pillar** — every visit row is one that happened. Verified by grep.
- [ ] **`specialty` exists on `Physician` only.** `ShadowingExperience` has no specialty field, so the coverage hero has exactly one possible answer (S-18).
- [ ] **Two independent filters on both `Visits` and `Reflections`** — who, and state — **never one combined dropdown.**
- [ ] **`proceduresObserved` has no structured field**; a visit row never shows what was performed.
- [ ] **`Reflections` is a filtered view of the same records Story Bank aggregates** — verified by grep for a second store, not by inspection.
- [ ] **The target renders in the `Physicians` detail panel and the hours chart on `Visits`**, matching Clinical's placement exactly.
- [ ] Specialty coverage — not total hours — is the headline metric, and **primary care is checked separately**.
- [ ] The **DO-letter gap is dormant** unless the School List contains osteopathic schools, and names them when it fires.
- [ ] Every physician is a shared `Person` record — no forked contact model; letter conversion is a **deep-link prefill only**.
- [ ] **No cross-user aggregation about a physician exists anywhere** — no student counts, no shared directory, no merge suggestions across accounts. **Verified by grep, not inspection.**
- [ ] **No separate organization entity and no verifier entity exist on this pillar** (§4a). A practice name is an attribute on the physician; the verifier slot points at the physician record.
- [ ] **§7c's batched verifier-capture workflow does not run here**, but #48's pre-cycle panel still flags physicians missing email or phone.
- [ ] The unpacking marker is **Clinical's #45a component configured with Shadowing's copy** — one implementation, verified by grep for a second one.
- [ ] A visit may always be saved without an reflection; the nudge fires once and never blocks.
- [ ] Misfiled clinical/shadowing records are **flagged and offered**, never auto-moved; moving preserves sessions and reflections.
- [ ] Empty state presents **one** action and never implies a large hour target.
- [ ] Works fully with no AI key — every feature above is deterministic.

## 16. Open decisions

1. ~~Whether a "planned visit" is a distinct status or a zero-hour session~~ — **CLOSED Aug 2026: neither exists.** An earlier ruling replaced it with an ask-and-wait chain reused from `LetterEntry`; **Andy then cut the whole idea.** *"It only needs to track positions that I already have, so we can scratch the application and the act of asking a potential physician to shadow."* **No pipeline, no planned visits, no `declined`.** A date you want to remember is a task, and tasks are Overview's. **Side effect: Shadowing is no longer blocked on D7 #3** — the ask chain was the only thing here that needed Letters wired to `Person`.
2. ~~Whether `proceduresObserved` earns a structured field~~ — **RULED Aug 2026: it stays inside the reflection text** (§5b). Structuring it invites exactly the skills tracking R1 cut from Clinical, **and that argument already won once.**
3. ~~Where the sufficiency bar sits~~ — **DISSOLVED, not resolved (Andy, Aug 2026).** The question only existed because the sufficiency call did. **With the call cut, there is no bar to place**, and `deferred.md` **R-10 closes without ever needing its research.** A blocker that disappears because the feature it blocked was wrong is the cheapest kind to close.
4. **RESOLVED (Andy, Aug 2026): virtual / telehealth shadowing counts.** *"Uncommon and not typically done, but can still be done as an option."* `telehealth` stays in `setting`; **no warning, no separate total, no asterisk on the hours.** Nearly became a research blocker; the ruling closed it.
5. **PARKED (Andy, Aug 2026): cold-email help.** *"I'd rather incorporate cold email templates from online and done by other people, but AI-assisted is acceptable. I'll talk more about this."* **Sourced from real people, never invented in HQ's voice.** Open: whether composing happens inside HQ, and how far the LLM may adapt a template. **Do not design unprompted** (board §7a, S-10).
