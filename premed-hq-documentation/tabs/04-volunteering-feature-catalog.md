# Volunteering: feature catalog (a delta, not a copy)

**Companion to `tabs/04-volunteering.md` and `tabs/04-volunteering-board.md`.** The spec wins on any conflict.

## Why this file is short on purpose

**Andy, Aug 2026:** *"You don't have to rewrite the feature list that they have in common. You can just put a placeholder, like 'it's going to have clinical features plus this.'"*

**Retyping ~55 inherited rows would create a second copy that drifts.** The moment Clinical changed a rule, this file would quietly disagree with it, which is exactly the failure that rotted `05-experience-pillar.md`. So this catalog states the **delta** and points at Clinical for the rest.

**Reading order:** `03-clinical-feature-catalog.md` is the base list. Then this file, which says what is removed, what is renamed, and what is added.

**Column meanings, `Surface` and `AI`, are defined in the Clinical catalog** and are identical here.

> ### Brought to the template Aug 2026
>
> **This file was audited against `05-experience-pillar.md` §2c and was missing three things.** The delta structure is **correct and stays** — Andy ruled it, and retyping Clinical's rows would create the second copy that rotted `05`. **What was missing was status, not content.**
>
> - **`Origin`** — `core` (inherited) · `own` (Volunteering-specific) · `core*` (inherited but altered). **This file already expressed it structurally** — §1 is `core`, §2 and §3 are `own` — **so the column is now explicit rather than implied.**
> - **`St`** — `live` · `spec` · `board` · `open` · `cut`. **There was no status column at all**, so nothing here said what was built.
> - **`Part 1`** — what actually exists in code. **Added below.**
>
> **The nine universal rules are NOT restated here.** `05-experience-pillar.md` §2b governs every row. **They were previously at the bottom of the Clinical catalog and have moved.**

---

## Part 0 — What is actually built

**Volunteering is one of four routes through `ExperiencePillar.tsx` (1,432 lines, 27 `category ===` branches).**

### A. Real and working

The route · the org list · the center peek · session logging through the shared `addLog` · the shared empty state. **The frame works; the pillar's own signals do not exist.**

### B. Placeholder — looks built, is not

**Same class of defect as Shadowing's:** the shared builder renders per-category strings and row-count heuristics that read as intelligence. **Anything category-branched in `ExperiencePillar.tsx` should be assumed placeholder until verified.**

### C. Specced, not built at all

**Every W and V row below.** The classifier, direct-vs-indirect, population served, cause areas, the org-optional record shape, the throughline, impact numerics, and one-time-event promotion. **None of it exists.**

---

## 1. The base: Clinical #1 to #72, inherited — `Origin: core`

**Everything in `03-clinical-feature-catalog.md` applies**, with two vocabulary swaps and six removals.

**Renames:** `Site` → **Org** · `Shift` → **Event**. Sub-tabs are **`Orgs` · `Events` · `Reflections`** — same nav, same mechanics (#63 to #71).

> ⚠️ **`Discover` was added and REVERSED the same day (Andy): *"it should really just be in ECs."*** **Three sub-tabs stand.** **`V-BIG-1` is homeless** — see `05-experience-pillar.md` §2a-ii. **Lean: a page-level discovery section on `Orgs`.**

**Removed, six, each with its reason in `04-volunteering-board.md` §2:**

| Not inherited | One-line reason |
|---|---|
| #20 to #24, credentials | Nothing in service work expires |
| #16, #17, paid vs volunteer | Every record here is volunteer by definition |
| #19, primary-care loop | Clinical-only |
| #52, patient-contact count | Patient contact is the definition of clinical; if it applies, the record belongs elsewhere |
| #33, stale-exposure **alert** | Excludes the nudge only. **Continuity is still displayed** (`05` §2a) |
| #60, overnight dating | Sessions are daytime; harmless but pointless |

**Everything else inherits**, including the whole reflection system (#44 to #51, and #45a/#45b especially), verifier capture (#37 to #43), record integrity (#55 to #62), the hours chart and continuity read (#34, #72), and the target and pace line (#29 to #32).

---

## 2. Volunteering's own

**W1 to W7 already exist in `04-volunteering.md` §2 and §7.** Listed here for completeness; they are not new.

| # | Feature | Surface | Origin | AI | St | Note |
|---|---|---|---|---|---|---|
| W1 | Route-to-Clinical, the inverse classifier | Orgs (page) | **`own`** | ◑ | `spec` | **Two conditions, both required**: direct contact **and** a medical context. Contact alone never fires it (board §4c). **The mirror of Clinical's classifier — the mechanism is `core`, the direction is `own`** |
| W2 | Direct vs indirect service | Orgs (panel) | **`own`** | ○ | `spec` | Both count; direct usually reads stronger |
| W3 | Population / need served | Orgs (panel) | **`own`** | ○ | `spec` | Preset list + free-text other, multi-select. **Shadowing's `patientsObserved` is deliberately NOT this** — that field describes the physician's patients, this describes people the student served |
| W4 | Cause area + group-by-cause toggle | Orgs (panel) | **`own`** | ○ | `spec` | Flat list default; cause chips ride on every card |
| W5 | Longevity in the headline | Orgs (list) | `core*` | ○ | `spec` | **The three reads are inherited; which one LEADS is this pillar's call.** Clinical leads with hours, this leads with longevity. **Recency is still shown** (`05` §2a) |
| W6 | Recurring role vs one-time event | Orgs (list) | **`own`** | ○ | `spec` | Powers the consistency read |
| ~~W7~~ | ~~Cross-link to Extracurriculars~~ | Orgs (panel) | **`own`** | ○ | `cut` | **CUT to a duplicate check** (board §4g). One record lives in one pillar, so there was never a double-count to prevent. What remains: *"You already have this club in Extracurriculars. Same thing, or separate?"* **No link is created either way** |

---

## 3. New, added Aug 2026

Full reasoning in `04-volunteering-board.md` §4d to §4f.

**Every row below is `Origin: own` and `St: spec` unless marked otherwise. None of it is built.**

| # | Feature | Surface | AI | What it does | What you see |
|---|---|---|---|---|---|
| V-7 | **The org is optional** | Orgs (panel) | ◑ | The record shape assumed an organization, a supervisor, and a verifier. Caregiving, interpreting for family, and self-started efforts have none. **Org and verifier become optional and the record is still complete** | No "missing" state, no amber chip. **§7c's verifier capture never fires on a record with no org.** Board §4e |
| V-8 | **What you bring** | Orgs (panel) | ◑ | Teaching, a language, music, coaching, carpentry. **Identity, not competency scoring** | One free-text line, same shape as `03-clinical.md` §2.6. **Hard dependency for V-10** |
| V-9 | **Shared background with those served** | Orgs (panel) | ○ | Optional, self-declared, **never inferred, never a credential** | A first-gen student tutoring first-gen kids has a different story than an outsider |
| V-10 | **The throughline you did not name** | Reflections | ● | Derives the **archetype** of each activity from what the student wrote, then finds what they keep choosing across unrelated causes | *"Across three unrelated settings, you kept ending up teaching someone."* **Proposes, never assigns.** Silent when there is nothing there. Board §4f |
| V-11 | **Impact numerics** | Orgs (page) | ◐ | Clinical's #52 generalized: the AI reading reflections offers to tag countable outcomes | *"we served about 120 meals"*, *"raised $4k"*. **Not a leaderboard** |
| V-12 | **One-time events are first-class** | **`Events`** ⚠ | ○ | **No longer only a copy rule** (Aug 2026, board §4h). Events render as **rows in one panel**, standing commitments as cards; the panel carries its own hours total at card weight | **No "only one day" language anywhere.** A blood drive is not a failed commitment. `longest N mo` reads across standing only |
| V-14 | **Event promotion, "you came back"** | **`Events`** ⚠ | ○ | A `one-time event` gaining a **second session** offers to become a standing commitment. Two sessions is the whole test — no AI, no threshold. Offer, never auto-move; **no negative branch** | *"You came back to the Turkey Trot — want to track this as a standing commitment? It keeps both sessions and starts showing longevity."* |
| V-13 | **Cause presets reach past health** | Orgs (panel) | ○ | Environment, animals, arts, literacy, disaster relief, faith, civic work, coaching, elder companionship | **A pre-med at an animal shelter is not off-mission** |

---

## 4. Totals

**Clinical's 74 minus 6 removed, plus 6 surviving W items, plus 7 new = about 81 features.**

**Approximate on purpose.** Precise counting would mean enumerating inherited rows here, which is the copy this file exists to avoid. **For an exact list, read the Clinical catalog and apply §1's removals.**

By AI dependency, **counting only what is new or changed here**:

| | Which |
|---|---|
| ● requires an LLM | **V-10**, plus #45a and #45b inherited |
| ◑ better with AI | **W1** (route-to-Clinical), **V-7**, **V-8** |
| ◐ degrades gracefully | **V-11** |
| ○ deterministic | W2 to W6, V-9, V-12, V-13, and every inherited ○ |

---

## 3-E. `Events` — the ledger, which had zero features of its own (Aug 2026)

**The S12 audit found this surface empty.** It inherits Clinical's `Shifts` mechanics (#63–71) — month grouping, subtotals, inline edit, the hours chart — **and that inheritance is correct and stays.** But **`Events` is the surface where this pillar's central distinction lives**, standing commitment versus one-day event, **and nobody had designed it.**

**Two rows moved here from `Orgs` where they were misfiled** (`V-12`, `V-14`). **Three more added below.**

| # | Feature | Origin | AI | St | What it does · what you see |
|---|---|---|---|---|---|
| **VE-1** | **`participation` on every event** | `core*` | ○ | `spec` | **`organised · helped run · attended`.** **An inheritance gap:** Extracurriculars already has this on `Initiative` (`ran · co-ran · part of`) **and it matters more here.** Running a blood drive is leadership evidence; attending one is service hours. **Without the field the difference is invisible**, and the student writing their AMCAS entry two years later cannot recover it |
| **VE-2** | **Annual recurrence — the third shape** | **`own`** | ○ | `spec` | **Neither `standing` nor `one-day` describes the Turkey Trot you have run four years straight.** Today that renders as **four disconnected one-day rows** and reads as four scattered events — **the exact opposite of what it is.** An event marked recurring links its instances: *"4th year · 4 events · 26 hrs."* **`V-14`'s promotion offer gains a third destination** |
| **VE-3** | **Per-event impact figures** | `core*` | ◐ | `spec` | **`V-11` scoped to the day.** *"Served about 200 meals."* A one-day event has its own countable outcome and **`V-11` currently only lives at org level**, where a single day's number has nowhere to go. **Never summed across events, never charted** (`U-9`) |
| **V-12** | **One-time events are first-class** | **`own`** | ○ | `spec` | Events as rows in one panel, standing commitments as cards; **the panel carries its own hours total at card weight.** **No "only one day" language anywhere** — a blood drive is not a failed commitment |
| **V-14** | **Event promotion — "you came back"** | **`own`** | ○ | `spec` | A second session on a one-time event offers to make it standing. **Two sessions is the whole test** — no AI, no threshold. **Offer, never auto-move, no negative branch** |

### Considered and cut — recorded so they are not re-proposed

| | Why not |
|---|---|
| ~~**Campaign grouping**~~ — a season of related events (Relay for Life, a November food-drive push) rendered as one block | **Grouping is cosmetic and changes no decision.** Month grouping already collects them, and `VE-2` handles the case that actually matters — the same event repeating across years. **Fails the *"what is this for"* test** that killed `O-1` |
| ~~**Who you went with**~~ — logging the club you attended with | **Nice to know, changes nothing.** And it half-recreates the cross-pillar link that `W7` was already cut down to a duplicate check. **If it ever matters it is a line in the reflection, not a field** |

### The open question this surface still has

**Does `Events` need a third filter?** Clinical's two axes are **org · state**, inherited here. **But this pillar's defining split — standing versus event versus annual — has no control**, and with `VE-2` there are now three shapes in one list. **Either a third filter, or the panel/card layout in `V-12` carries it visually and no filter is needed.** **My read: the layout carries it** — `V-12` already separates cards from rows, and a filter would duplicate what the eye does. **Flagged rather than assumed.**

## 3a. The reflection mechanism — inherited from `05` §2b-ii, four rows owed

**`RM-1` to `RM-4` are shared behaviour and are NOT retyped here.** This pillar's writing surface had **one** feature, which the S12 audit called out. **All four now inherit.**

| # | Inherits | Volunteering's own part |
|---|---|---|
| **`RM-1`** · the moments HQ asks | `05` §2b-ii | **Triggers:** a service event finishes · a standing commitment ends · **a one-time event gains a second session** (pairs with `V-14`) |
| **`RM-2`** · reflection as conversation | `05` §2b-ii | **Prompt copy is this pillar's.** Service reflection is about the people served — **the closest existing prompt is ECs' E-3 chips, and V-9's shared-background field is the sharpest thing to ask about** |
| **`RM-3`** · search your own writing | `05` §2b-ii | Nothing pillar-specific |
| **`RM-4`** · synthesis threads | `05` §2b-ii | **`V-10` FOLDS INTO THIS (RULED Aug 2026).** See below |
| **`RM-5`** · the unpacked headline | `05` §2b-ii | *"11 threads · 6 events not yet unpacked"* in the filter bar |

### `V-10` folds into `RM-4` — RULED Aug 2026

**They were the same surface twice.** `RM-4` is the student grouping their own reflections under an idea; **`V-10` is a machine proposing one.** Two features, one job.

> **`V-10` is now a SUGGESTION inside `RM-4`, not a feature of its own.** The student builds threads. **HQ may occasionally propose a grouping they had not seen** — *"across three unrelated settings, you kept ending up teaching someone"* — **which they accept, edit, or ignore.**

**This preserves both halves of what mattered:**

- **`RM-4`'s rule survives intact** — *student-made, never auto-clustered.* **A proposal the student must accept is not auto-clustering.**
- **`V-10`'s actual insight survives** — it existed to find **the throughline the student did NOT pick**, as opposed to `W4` which groups by the cause they chose deliberately. **That is still what the suggestion does.**
- **One component, one surface.** A student never sees the same idea presented twice by two different mechanisms.

**`V-10`'s row below is retained for its reasoning and its `●` marker, but it no longer describes a standalone feature.** **Its dependency on `V-8` (what you bring) is unchanged** — the archetype read needs that input either way.

## 3-B. The big swings — this pillar never had one (Aug 2026)

**Everything above improves the record of service a student already does.** **Nothing helps them find service, or keep it.**

**And the campus board's §5 list gave Volunteering nothing at all** — Academics got two, MCAT one, Clinical one, Research one, Shadowing one, Extracurriculars one. **Volunteering was skipped, and nobody noticed until this audit.**

| # | Feature | Origin | AI | St | |
|---|---|---|---|---|---|
| **V-BIG-1** ✅ | **Service that is not a health club** | **`own`** | ○ | `board` | **CLOSED Aug 2026 — `Discover` went universal** (`05-experience-pillar.md` §2a-ii). **Volunteering gets a `Discover` sub-tab and this is its content:** Orange County service orgs, food security, tutoring, shelters — **the non-clinical service a premed is told to have and cannot find.** **Hand-built, cited, dated list. Content, not code** |
| **V-BIG-2** | **The commitment you can actually keep** | `core*` | ○ | `open` | **The pillar's own thesis, enforced before the fact** |

### `V-BIG-1` — service that is not a health club

**`V-13` already rules that cause presets reach past health** — environment, animals, arts, literacy, disaster relief, faith, civic work, coaching, elder companionship — **and states that a premed at an animal shelter is not off-mission.**

**But there is no discovery.** A student who wants to volunteer somewhere that is not a pre-health club has **no route in the app**, and the pillar's own principle says those places count.

- **Sourced, curated, linked out. Never scraped.**
- **Chapel Hill and Orange County community organisations**, not just campus ones — **which distinguishes it from `E-1`'s 1,278 student orgs.** TABLE, the food bank, the literacy council, the animal shelter, hospice.
- **Recommend by cause interest, never by popularity among premeds** — the standing rule. **Here it matters most**: popularity-ranking service opportunities would funnel every applicant into the same three, which is the precise opposite of what this pillar reads for.
- **Overlaps `EV-1`** for one-day events; **this is the standing-commitment half.**

### `V-BIG-2` — the commitment you can actually keep

**This pillar's thesis is longevity** — *"18 months weekly beats five scattered one-day events with the same hours"* (§2.4). **And HQ currently has no way to help a student pick one they will still be doing in 18 months.**

> **The classic failure is not motivation.** A student commits to a Saturday-morning shift across town, does it four times, and stops — **because it was never keepable, and nothing said so.** `08-logistics-board.md` already names this: *"a student quits a volunteering role because the bus takes 40 minutes each way, and no tracker ever told them that was the problem."*

- **Fires at the moment of committing to a standing role**, not after. **`L-A` and `L-B` already compute everything needed** — nothing scheduled, travel, the real weekly cost including the journey.
- ***"Saturdays 9–12, and it's 35 minutes each way. That's about 4½ hours of your Saturday, every week, for as long as you keep it."*** **A statement, not a warning.** **`U-8`** — HQ states the true cost and never says whether to take it.
- **`core*`** — the engine is `L-A`/`L-B` inherited whole. **What is `own` is firing it at commitment time on a recurring role**, which no other pillar needs: a shift is one day, a visit is one day, **a standing service commitment is a promise about every week for a year.**
- **It is also the honest counterweight to `V-BIG-1`.** Surfacing more opportunities without this would just help students over-commit faster.

> **Both `open`.** **`V-BIG-1` needs a research ask** — *Chapel Hill and Orange County community service organisations accepting student volunteers, by cause area, with contact routes* — **which is new and not covered by the six already logged.** **`V-BIG-2` needs nothing but a decision**; the engines exist.

## 4a. Inheritance audit — the answer to *"did Clinical carry over?"*

| | |
|---|---|
| **`core`** — inherited whole, never restated | **~66** (Clinical's 72 minus the six removals in §1) |
| **`core*`** — inherited but altered | **2** — W5 (longevity leads instead of hours) and the six §1 removals, each traceable to one reason |
| **`own`** — Volunteering-specific | **13** — W1–W6 plus V-7 to V-14 |

**The six removals are the interesting part, because each is a clean reason rather than an oversight:** nothing in service work expires (credentials) · every record here is volunteer by definition (paid/unpaid) · patient contact **is** the definition of clinical, so if it applies the record belongs elsewhere · sessions are daytime.

**And one row was kept where a lazier read would have cut it: #33's continuity.** **The stale-exposure *alert* is removed; the continuity *read* stays.** Removing the nudge is not the same as removing the information — **the same distinction `R-S1` made on Shadowing and `U-8` now makes app-wide.**

## 5. Rejected, recorded so they are not re-proposed

**Carried from Clinical** (`03-clinical-board.md` §5): streaks · readiness scores · comparison to other applicants · silent auto-classification · any PHI field · scraping org portals · a second calendar.

**Volunteering's own:**

- **No cause-diversity score.** A student devoted to one cause for four years has a **better** record than one who sampled six. Scoring breadth would invert the pillar's thesis.
- **No "find opportunities near you" search.** Needs a live external listings source that would rot invisibly.
- **No cause quiz.** Manufactured interests read manufactured. Causes come from what the student logs (V-10).
- **No service-hours benchmark.** Same reason as C3: no sourced figure exists.
- **No cross-pillar link for a shared club.** Cut with W7. See board §4g.

---

## Wave 0 · From lived experience (Andy, Aug 2026)

**The same pass that re-founded Research.** **Shorter, because it mostly CONFIRMED the spec** — which is itself a finding worth recording, since the Research pass overturned three things.

### 0a · Discovery is real, and it is the same shape as Research's

> *"**A friend put me on.** Also, I just asked around, really. **I looked online to see what kind of stores or organizations in my area** were available, and then **I just pulled up and asked them.**"*

**`V-BIG-1` is CONFIRMED and its framing was right.** **Compare `RS-BIG-1`'s justification verbatim — *"students find labs through friends, which means students without the right friends do not find labs."*** **Volunteering works identically, and Andy found his through a friend.**

**Three behaviours in one sentence, and HQ only serves the third today:**

| What he did | HQ's answer |
|---|---|
| A friend put him on | **Nothing, and nothing is right** — HQ cannot manufacture a friend |
| Asked around | **Nothing, correctly** |
| **Looked online for orgs in his area, then showed up in person** | **This is `Discover` exactly**, and it is the reason the universal ruling is right |

**⚠️ Note *"stores or organizations."*** **Not a curated premed volunteering list — ordinary local places.** **`D`-rows for Volunteering must include the unglamorous ones**, and **`PlaceLine` matters more here than anywhere** because he physically walked in.

### 0b · The standing-vs-events split is CONFIRMED

> *"It does match. There are a few things that I did, like a one-time thing… **I cleaned a closet once** for an organization, and then there's another organization… that **I basically did throughout the entire summer.**"*

**Both halves attested from one person's real record.** **`VE-1`–`VE-3` stand as written.** **No change.**

### 0c · Hours came from a spreadsheet — and `U-12` does NOT fire

> *"I track my hours using a spreadsheet."*

**A spreadsheet is not an incumbent product with developers behind it.** **`U-12`'s test returns *build*.** **This is the clearest case in the app of HQ replacing something genuinely worse**, and it is the pillar where hours carry the most weight.

**⚠️ It also sets the bar: whatever HQ does must beat a spreadsheet on speed.** **A spreadsheet row takes about five seconds. So does the ≤5-second rule.** **There is no margin.**

### 0d · THE REGRET — and it is the strongest validation of `RM-1` anywhere

> *"The other thing I regret is **not reflecting on it.**"*

**Said unprompted, about a real experience, after the fact.** **This is the reflection mechanism's entire thesis stated by the user in retrospect** — **the reflection does not get written unless something asks for it at the time.**

- **`RM-1` triggers are not a nice-to-have on this pillar.** **They are the fix for the one thing he regrets.**
- **`RM-6` backfill matters more than assumed** — a student arriving with a year of unreflected service is the normal case, not the edge case.
- **⚠️ And it must fire on ONE-OFF events too.** **The closet clean-out is exactly the kind of thing that vanishes** — small, unrepeated, and gone from memory by application time.

### 0e · What did NOT come up

**No mention of hour verification, sign-off, or a supervisor confirming totals.** **He tracked his own hours in his own spreadsheet and that was the whole system.** **Do not build a verification workflow on an assumption nobody has voiced.**
