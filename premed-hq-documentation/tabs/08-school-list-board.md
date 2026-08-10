# School List — comprehensive board

**Status:** BOARD (Aug 2026). **§1 governing ruling + §6 closed. `SL-23` Phase 1 specced. 31 rows.** **Wave 4 (`SL-24`–`SL-31`) is UNRULED.** Waves 0–3 still need a line-by-line batch pass.
**Spec it feeds:** `tabs/08-school-list.md`
**Method:** `HANDOFF-2026-08.md` §2.

---

## 0. What binds before anything is proposed

| | |
|---|---|
| **`U-12` §4** | **CEDE the data, keep the list.** MSAR is `$28`/yr and carries figures straight from the MCAT, AMCAS, and admissions offices |
| **`U-9`** | **Nothing scored, ranked, or compared** — not against a bar, not against other students |
| **`00-product-vision`** | *"Pretend to predict admissions outcomes with certainty"* is a **stated non-goal** |
| **`U-8`** | State a fact; never instruct |

---

## 1. ⭐ RULED Aug 2026 — the governing decision, and it resolves a three-way conflict

**Andy brought MedTrack/MedCoach screenshots: a 227-school browsable database, medians, acceptance rates, tuition, "how you stack up," computed reach/target/safety, and an "Application readiness 25%" bar.**

**He also said, unprompted: *"this is pretty AI and data heavy so be careful."* He was right.**

### The conflict, stated plainly

Three answers were given and **they could not all be true at once:**

| Answer | Problem |
|---|---|
| **HQ does not hold school data** (ruling held) | ✅ consistent with `U-12` §4 |
| **Show your GPA against their median** | ❌ requires holding the median |
| **HQ suggests reach/target/safety** | ❌ requires it too, **and** a computed tier is an admissions prediction |

### ✅ THE RESOLUTION — the student enters the numbers, for their own list only

**For each school the student adds, they type four fields: median MCAT · median GPA · in-state % · class size.** They have MSAR open; they are applying anyway. **A 20-school list is a few minutes, once.**

**Every objection in the `U-12` audit dissolves, and it is worth being precise about why:**

| Original objection | Why it no longer applies |
|---|---|
| *"MSAR's data is licensed. Republishing it is not HQ's to do."* | **HQ publishes nothing.** The student uses data they paid for, on their own device, for themselves. **HQ is a calculator, not a publisher** |
| *"Any hand-maintained copy is stale within a year."* | **There is no copy to maintain.** The student entered it this cycle from the current source — **current by construction**, and this was the stronger of the two objections |
| *"A student who applies off a wrong median has been actively harmed."* | The number is theirs, from the authoritative source, entered this cycle |

**What HQ still must NOT build, and this is unchanged:**

- ~~No browsable database of all schools.~~ **AMENDED by §1b — Explore mode ships on the roster.**
- **No shipped NUMBERS.** No medians, no acceptance rates, no bundled admissions figures. **The roster carries names and locations only.**
- **No acceptance rates or tuition** unless the student types them — and see `SL-9` on whether they should.

> **⚠️ THE LINE, and it is the whole ruling in one sentence:** **HQ may compute on numbers the student gave it. It may not go and get them.**

### The tier suggestion, constrained

**Reach / target / safety may be SUGGESTED, and the student overrides.** But because predicting admissions is a stated non-goal:

- **It shows its arithmetic.** *"MCAT 6 below their median · GPA 0.05 above"* → suggests `reach`.
- **It never expresses a probability.** No percentage, no odds, no "chance."
- **The student's tag always wins** and is never silently recomputed.

### ⚠️ Explicitly rejected from the inspiration

**"Application readiness — 25%"** with a progress bar. **`U-9`, unambiguously.** A single number summarising a whole application is exactly the invented composite the rule exists to prevent, and it would be the most-screenshotted, most-anxiety-producing element in the product.


### ⚠️ CORRECTION Aug 2026 — one of the two original objections was overstated

**Andy asked directly: *"what forbids a database?"* The honest answer is nothing external. `U-12` §4 does, and it is a decision rather than a constraint.**

**Re-examining its two reasons:**

| Original reason | How strong it actually is |
|---|---|
| *"MSAR's data is licensed. Republishing it is not HQ's to do."* | **WEAKER THAN STATED.** It forbids **copying MSAR**. It does not forbid compiling the same facts independently. **Facts are not copyrightable in US law** — a median MCAT of 520 is a fact, and schools publish their own class profiles. A compilation carries thin protection in selection and arrangement, not in the underlying numbers. **This is what MedTrack means by "sourced from official school pages"** — they are not licensing MSAR. *(Not legal advice; worth a real opinion if it ever becomes load-bearing.)* |
| *"Any hand-maintained copy is stale within a year."* | **THE REAL CONSTRAINT, and it is operational.** 227 schools × ~15 fields, re-verified annually, forever — by one student, in the summers he is taking the MCAT and applying |

**✅ RE-RULED, with the accurate framing: keep the ruling.** Andy chose the student-entered version *after* being told the licensing objection was overstated. **The decision now rests on the reason that actually holds — maintenance — rather than on one that does not.**

**Two options were offered and declined, recorded so they are not re-proposed as novel:**

- **Compile from schools' own public pages**, each field carrying a source URL and check date. Legally defensible; costs an annual re-verification pass.
- **Seed names only** — every US MD and DO school by name, city, state, degree type. Those facts effectively never change, so there is no annual job, and it would buy autocomplete and browse-by-state. **This is the strongest of the rejected options and the most likely to be revisited.**

**⚠️ The honest cost of the ruling, stated plainly:** **a student cannot discover a school they had not heard of.** MSAR does that. **This is a trade, not a free win**, and anyone reading this later should know it was made with eyes open.


## 1b. ⭐ AMENDED Aug 2026 — two modes, and the roster already existed

> **Andy:** *"i do want to be able to separate EXPLORING SCHOOLS as in researching them, and then adding one to my list and keeping track of the actual application… so i can keep up with their deadlines and requirements"*

**This is a real structural requirement and it amends §1.** The tab is **two modes**, not one:

| Mode | Needs | Status |
|---|---|---|
| **Explore** — browse, discover, research a school you have not added | A roster of **all** schools | **Now allowed** — see below |
| **Track** — your list, deadlines, requirements, where each application stands | Only your own entries | Already specced, Waves 0–3 |

### ✅ The seed roster SHIPS. §1's "no shipped dataset" becomes "no shipped NUMBERS."

**Names, cities, states, MD/DO, application service, accreditation status.** **These facts are effectively static** — a school opens every year or two — **so there is no annual maintenance job.** That was the only objection that survived scrutiny, and it does not apply to a roster.

**⭐ AND IT ALREADY EXISTED.** `premed-hq-documentation/data/med-schools.json`, built by an earlier session, **206 entries with `medianGPA`, `medianMCAT` and `acceptanceRate` deliberately `null`** — the same discipline this board re-derived from scratch. **Third time today that checking the repo first found the work already done.**

**Verified against the LCME Accredited Programs table (page updated 2026-07-22) on 2026-08-10.** **Five newly accredited MD programs were missing and have been added**, all at Preliminary status: Arizona State (Shufeldt) · University of Georgia · Methodist University Cape Fear Valley · Alice L. Walton · Belmont (Frist). **Roster is now 163 MD + 48 DO = 211.**


### ⚠️ DATA DEFECT FOUND Aug 2026 — the DO roster is incomplete AND inconsistently grained

**Andy: *"227, 163 MD and 64 DO, correct me if im wrong."* He was right, and checking it found a real problem.**

| Count | Source | What it means |
|---|---|---|
| **163 MD** | Our file **and** the MedTrack screenshot agree | ✅ **Program/campus level** — LCME lists branch campuses separately (Arizona Phoenix vs Tucson, USC three campuses), and so do we |
| **48 DO** | Our file | ⚠️ **Mixed grain, and short** |
| **48 colleges · 75 teaching locations** | [AACOM](https://www.aacom.org/become-a-doctor/prepare-for-medical-school/us-colleges-of-osteopathic-medicine), verified 2026-08-10 | The authoritative counts |
| **64 DO** | MedTrack | **Applicant-facing** — the entries you actually select on AACOMAS |

**The defect, precisely:** our file holds **48 DO entries, but only 38 distinct institutions** — because it already splits some branch campuses (VCOM ×4, Touro ×4, LECOM ×2, PCOM ×2, RVU ×2, LMU ×2, NYIT ×2, Burrell ×2, Western U ×2, ATSU ×2). **AACOM says there are 48 colleges. So roughly 10 institutions are simply absent**, and the 48 total was a coincidence that hid it.

**Two things are wrong, not one:**

1. **Missing schools.** ~10 accredited colleges are not in the file at all.
2. **Inconsistent grain.** MD is at program/campus level; DO is a mix of institution and campus. **A student browsing sees an incoherent list**, and any count HQ displays is wrong.

**⚠️ DO NOT FIX THIS FROM MEMORY.** Adding schools from recall into a shipped dataset is exactly the failure this whole ruling was built to prevent. **The authoritative source is AACOM's College Directory PDF**, linked from the page above, plus the COCA accredited-COM list.

**The grain question needs a ruling too:** the roster should be at **applicant-facing granularity** — the entries a student selects on AMCAS/AACOMAS — because that is the unit they apply to and track. **That is what makes MedTrack's 64 the right number rather than 48.**

**Recorded as blocking for Explore mode.** The roster ships when it is complete and consistently grained, not before. **A browse list missing ten schools is worse than no browse list**, because the student cannot tell it is incomplete.

### ⭐ `SL-22` — Map view ✅ BUILD, optional third view

**Andy, Aug 2026: *"optional map view as well."*** Leaflet + OSM, clustered pins, `All schools / My list` toggle.

**Not a new mechanism.** `07-campus-layer-board.md` §2g already ruled **Leaflet, HQ renders its own pins, no iframe.**

**⚠️ It must survive the question that killed three other features** — *"what is this actually for?"* (`O-1`, `R-1`, and the campus surface all died to it).

**It survives, for a reason specific to this tab: geography is an actual admissions variable here.** In-state preference materially changes odds (`SL-5`) · interview travel is a real cost (`SL-19`) · ***"eight schools within driving distance of home"*** is a discovery an alphabetical list never produces. **The student does something different because of it.**

**Locked:** third view, **never the default** · **two pin states only — on your list, not added** · **no tier colouring, no median heat, no size-by-anything** (that is `U-9` arriving through cartography) · clicking a pin adds or opens; **the map is an entry point, not a second detail surface.**

**⚠️ Data requirement:** the roster has city and state, **no coordinates**. **City centroid is sufficient** — nobody needs the building. Geocoded **once, offline**, stored in `med-schools.json`. **Never a runtime geocoding call.**

**⚠️ Blocked by the DO roster defect.** **A map missing ten schools is worse than a list missing them, because absence on a map reads as "there is nothing there."**

### ⭐ `SL-23` — secondary prompts. STAGED, and phase 2 reuses an existing mechanism

**Andy asked how the competitor obtained them. The answer changes the design.**

**They are not synced from any portal — no med school exposes an API, and a prompt is invisible until you are invited to complete a secondary.** MedTrack's own caption says it: *"Collected from public sources for the 2026–2027 cycle. Check them against your secondary portal before submitting."*

**The actual source is applicants posting them** — SDN school-specific threads and r/premed, the day they arrive — then consulting blogs compiling those for SEO. **A minority of schools publish their own.**

**⚠️ This is already ruled** (`09-essays-story-bank.md` Do-Not): **"Do not ship a comprehensive per-school secondary library. Examples only; stale prompts are worse than none."** `SL-23` does not overturn it — it routes around it.

**Phase 1 — the student pastes them in.** A secondary arrives, they are **already in the portal with the prompts on screen**. Paste. Attached to that school, stamped with the cycle. **Zero research, current by construction, ships immediately.**

**Phase 2 — ⭐ students share them, reusing `01` §4.1-M's shareable syllabus parse.** One applicant receives NYU's secondary and pastes it; everyone else applying to NYU imports the prompts, **dated to that cycle, attributed to nobody.**

**Why this is the right mechanism and not a new one:** the shareable parse **already solved this exact privacy shape** — the shared object is the institution's document, never anyone's record, in a store with no join path to personal data. **Prompts are the same class of object as syllabus structure.** It also fixes freshness **structurally rather than by maintenance**: the corpus is refilled every cycle by the people living it.

**⚠️ Phase 2 cannot be in v1.** It needs users. **A beta with five people has no corpus, and the first cycle is empty by definition.** Do not ship an empty shared library and call it a feature.

**Never: compile from SDN or consulting blogs.** `community-lore.md` — **link and summarise, never republish** — and it inherits precisely the staleness MedTrack is disclaiming.

#### ✅ Phase 1 specced Aug 2026 — Andy: *"have users be able to add secondary prompts from the school, it'll have to show them how and a reminder to even paste it in"*

**Two problems, and they are different.** *How* is a UI problem. *Remembering to* is a trigger problem, and the trigger problem is the one that kills features — **`LT-23` was cut for exactly this: a record type with no natural trigger is one nobody fills.**

**⭐ Both are already solved in the repo. Nothing new is built.**

| Piece | What it reuses | Why |
|---|---|---|
| **Where the prompt lands** | **`SB-19`** — Essays' essay record: *school · prompt text · limit · status · due · link out* | **`one record, two doors`, 5th instance.** School List is the **school** door; Essays is the **writing** door. **A filter, never a copy.** This is `SL-17` stated concretely — *"Essays owns the writing"* |
| **Paste the whole block, HQ splits** | **`01` §4.1-M / §1036's paste-a-list pattern** — *"one per line, HQ splits and asks which week"* | A secondary is **not one prompt** — it is three to eight on one portal page. Making the student add them one at a time is the thing that stops them at prompt two |
| **The reminder** | **`SL-16`'s status flip → the Attention bell** (`00-product-shell` §7.5) | **`11-timeline-tasks.md` already ruled it:** School List owns the AMCAS/secondary dates and they surface in the bell. **No new notification channel, no second deadline list** |
| **What comes next** | **`SB-5`** — paste a prompt, HQ names the theme, your material rail fills | The paste is not filing. **It is the doorway into writing**, which is what makes it worth doing at the moment it arrives |

**The trigger, precisely:** the student flips a school to **`secondary received`** (`SL-16`). **That flip is the prompt to paste** — one line, in place, at the moment they are already in the portal with the text on screen. **If they skip it, the school shows `secondary received · no prompts saved` as a FACT** on the row, and the bell carries the school's deadline regardless. **It never nags and it never blocks the status change.**

**Why that trigger and not a timer:** a timed reminder fires when HQ guesses, and HQ cannot know when a secondary arrived. **The student telling HQ it arrived is the only reliable signal in the system**, and they are already telling it.

**Capture the character limit at paste time.** `SB-19` has the field, the portal states it beside each prompt, and **it is never recoverable later** — the student would have to log back in. Same reasoning as the cycle stamp.

**Stamp the cycle on every prompt.** `2026–2027`. Costs nothing now, and **it is the thing that makes Phase 2 possible at all** — an undated prompt corpus is unshareable.

**The "show them how" line, and the constraint on it:** one sentence beside the paste box naming **where the text is** — the school's own secondary portal or the email that linked you there. **Not a tutorial, not a modal, not a first-run tour.**

> **⚠️ `U-8` is about the student's life, not about help text.** *"State a fact; never instruct"* forbids HQ telling someone what to do with their application. **It does not forbid telling them where a button is.** Recorded because a later reader will otherwise flag this line as a violation — the two are different and the distinction should not have to be re-derived.

**Do not:**

- **Do not show `SB-23`'s sample secondaries in the empty state.** Examples beside a named school read as *that school's prompts*. **The one place the library ruling could leak in through the back door.**
- **Do not fetch, guess, or pre-fill.** Nothing arrives in this field that the student did not paste.
- **Do not build a second prompt store.** Grep for one; `SB-19` is the only one.

### Deadlines and requirements — STAGED

> **Andy:** *"you initially enter, but eventually HQ does the work for you (in the long run)"*

**Phase 1 — now.** The student types the deadline, prereqs, and requirements for schools **on their list**. Current by construction, zero maintenance, ships immediately.

**Phase 2 — later, and gated.** HQ carries them for all schools.

**⚠️ Phase 2 does not begin because someone feels like it.** Three conditions, all of them:

1. **A maintainer who is not Andy alone.** This is the annual content job the whole ruling was built to avoid.
2. **A per-field source URL and check date**, rendered to the student.
3. **A staleness rule that fails safe** — an unverified deadline shows as *unverified*, never as a date. **A wrong secondary deadline is the single most harmful error this product could make**, because it is unrecoverable and the student will not discover it until the cycle is over.

**Until all three hold, Phase 1 is the product.**

---

## 2. Wave 0 — the list

| # | Feature | AI | Note |
|---|---|---|---|
| **SL-1** | **Add a school from the roster** | ○ | **AMENDED (§1b): autocomplete against `data/med-schools.json` — names only.** Free text still allowed for anything absent |
| **SL-2** | **Why it is on the list, in the student's words** | ○ | The field MSAR cannot have. **The one thing that makes this list yours** |
| **SL-3** | **Student's own tier tag** | ○ | Always overrides any suggestion |
| **SL-4** | **MD / DO / other** | ○ | |
| **SL-5** | **State, and in-state flag from `P-33`** | ○ | Residency is already in Profile/CV and **materially changes a list** |
| **SL-6** | **Archive rather than delete** | ○ | A school you dropped is a decision worth keeping |

## 3. Wave 1 — the numbers the student enters

| # | Feature | AI | Note |
|---|---|---|---|
| **SL-7** | **Four fields per school** | ○ | Median MCAT · median GPA · in-state % · class size. **Optional — the list works with none of them** |
| **SL-8** | **`enteredOn` date per school** | ○ | **Their own freshness stamp.** Cycle data changes annually |
| **SL-9** | **Tuition and acceptance rate** | ○ | **Probably cut.** Tuition is a cost decision the student makes once; acceptance rate is the number most likely to be read as odds |
| **SL-10** | **"Verify on MSAR" line** | ○ | `U-8`. Stated once, dismissible |

## 4. Wave 2 — what HQ computes from them

| # | Feature | AI | Note |
|---|---|---|---|
| **SL-11** | **Your number vs theirs, as a delta** | ○ | *"MCAT 523 · median 520 · +3."* **Arithmetic, not a verdict** |
| **SL-12** | **Tier suggestion with its arithmetic shown** | ○ | Overridable. **Never a probability** |
| **SL-13** | **List balance** | ○ | *"12 schools: 3 reach, 7 target, 2 safety."* **A count of the student's own tags** — not an opinion about whether the balance is right |
| **SL-14** | **In-state count** | ○ | Deterministic from `SL-5` |
| **SL-15** | **⚠️ A readiness score** | — | **CUT. `U-9`.** See §1 |

## 5. Wave 3 — the cycle

| # | Feature | AI | Note |
|---|---|---|---|
| **SL-16** | **Per-school status** | ○ | Primary submitted · secondary received · secondary submitted · interview · decision. **⚠️ `U-7` applies — check whether "no response" is a state or a non-event, same ruling as `LT-14`** |
| **SL-17** | **Secondary prompts and deadlines** | ○ | ⚠️ **Essays owns the writing.** This holds the deadline only |
| **SL-18** | **Interview dates and logistics** | ○ | |
| **SL-19** | **Cost tracking** | ○ | AMCAS per-school fees plus secondaries add up fast and surprise people. **Links to `P-42` Fee Assistance** |
| **SL-23** | **Secondary prompts** | ○ | **Staged.** P1 student pastes · P2 shared, reusing `01` §4.1-M. **Never compiled from forums** |
| **SL-22** | **Map view** | ○ | **Optional third view.** Reuses `07` §2g Leaflet. Two pin states only. **Needs city coords** — see §1b |
| **SL-20** | **Send-date discipline** | ○ | Rolling admissions is real; **"submitted in August" is a fact worth surfacing** |

## 5a-i. ✅ STATIC PASS DONE — Aug 2026. Roster is 240, and the count was hiding two gaps

**The audit in §5a below is what the file looked like BEFORE this pass. Kept, because the lesson in it is the point.**

| | Before | After |
|---|---|---|
| **Total** | 211 | **240** |
| **MD** | 163 | **165** |
| **DO** | 48 | **75** ✅ **equals AACOM's own count of teaching locations exactly** |
| **`city`** | **5/211** | **238/240** |
| **TMDSAS** | 11 | **14** ✅ equals TMDSAS's own member list exactly |

### ⚠️ THE LESSON, and it is the same one twice

**The board said the MD side was ✅ verified because 163 matched 163.** **Matching by COUNT is not verification.** Assigning row-by-row inside each state found **161 real matches, 2 accredited programs absent, and 2 extra campus entries.** **The totals cancelled out.**

> **That is precisely the DO `48` error — a coincidental total that hid a real gap — and it had already been caught once on the other half of the same file.** **Any future "verified against source" claim in this repo means row-by-row or it means nothing.**

**Absent MD programs, now added** (LCME, page updated 2026-07-22): **Charles R. Drew University College of Medicine** (Los Angeles, Provisional) · **Nova Southeastern Dr. Kiran C. Patel College of Allopathic Medicine** (Fort Lauderdale, Full).

**The DO gap was far worse than the board's estimate of "~10 colleges."** **27 of AACOM's 75 teaching locations were absent**, and roughly half were **whole institutions never represented at all** — including **Ohio University Heritage College of Osteopathic Medicine**, one of the oldest and largest DO schools in the country, along with Duquesne, Xavier, D'Youville, Noorda, Meritus, Incarnate Word, and Indiana University of Pennsylvania. **All 27 added from the [AACOM College Directory PDF](https://www.aacom.org/docs/default-source/become-doctor/us-com-directory.pdf), fetched 2026-08-10.**

**Grain is now consistent: teaching-location level on both sides**, which is what §1b's *applicant-facing* ruling asked for.

**The 3 NC medians are nulled**, and the values are preserved in `meta.removedPartialData` rather than deleted.

**⚠️ One thing left open, deliberately:** **2 MD entries have no city because no directory lists one** — Sidney Kimmel's Delaware Regional Campus and Tufts' Maine Track. **LCME does not accredit either separately.** Keep them (a student can select those tracks) or drop them (LCME lists 163 programs)? **Recorded in `knownDefects`; it changes any count HQ displays, so it is not resolved by quietly deleting two rows.**

**✅ `SL-22` is unblocked** — 238 of 240 now have a city to geocode.

---

## 5a. ⭐ What the roster ACTUALLY holds — audited Aug 2026

**Andy: *"has your research been done for school list then? all that you can get? what's there?"* Audited every field across all 211 entries rather than trusting the schema.**

| Fill | Fields |
|---|---|
| **211/211 — real** | `name` · `type` (MD/DO) · `control` (public/private) · `state` · `region` · **`applicationService`** · `source` · `confidence` · `profileStatus` |
| **211/211 — ⚠️ PLACEHOLDER** | **`prereqNotes` — 211 filled, 2 distinct strings.** A verification disclaimer, not per-school content. **It reads as populated in any fill-rate check, which is what makes it worse than a null** |
| **Barely there** | **`city` 5** · `medianGPA` 3 · `medianMCAT` 3 · `inStateFriendly` 3 · `mission` 12 · `accreditationStatus` 5 |
| **Zero** | `acceptanceRate` · `prereqs` · `deadlines.primary` · `deadlines.secondaryTypical` · `deadlines.interviewSeason` · `admissionsTests.PREview` · `admissionsTests.CASPer` |

**So the roster is a DIRECTORY, and an honest one.** Name, degree, control, state, service. **That is enough for Explore-by-name and filter-by-state and nothing else** — which is exactly what §1 ruled, so this is the ruling working rather than failing.

**⚠️ Two things the audit caught that the board had wrong:**

1. **`city` is 5/211, and those 5 are the ones added on 2026-08-10.** The original 206 have **state only.** **`SL-22` says *"the roster has city and state, no coordinates"* — that premise is false**, and §1b's *"names, cities, states"* is false too. **A map cannot be built from state.**
2. **The 3 entries with medians are all North Carolina schools** — Campbell, Brody, Wake Forest. **A partial NC pass someone abandoned.** ⚠️ **Three filled rows out of 211 is worse than zero**: it makes the field look live, and a student seeing a median on Wake Forest and a blank on Duke reads the blank as *"no minimum"* rather than *"we don't know."* **Either finish it or null it — and §1 already says null it.**

### The answer to *"all that you can get?"* — no, and the remaining work splits in two

| | Fields | Get it? |
|---|---|---|
| **STATIC — no annual cost** | **`city`** · the **TMDSAS** correction · the **~10 missing DO colleges** · official names | **✅ YES. This is finishable work with an end.** All three are in primary directories already cited in `meta`, and **none of them change** |
| **ANNUAL — rots every cycle** | medians · deadlines · prereqs · PREview/CASPer · acceptance rate | **❌ NO, by ruling.** §1 — student-entered. **Obtaining them was never the blocker; KEEPING them is** |

> **⚠️ These two piles get conflated constantly, and the file's nulls are why** — a blank `city` and a blank `medianMCAT` look identical in the JSON and are completely different decisions. **One is unfinished work. The other is the product design.**

---

## 5b. Wave 4 — ⚠️ UNRULED. Over-generated Aug 2026 on *"what else is worth considering"*

**Every row below is a real gap found by reading the cycle end-to-end against what the board already holds. `SL-24` and `SL-25` are the two that would be actual defects if shipped without.**

| # | Feature | AI | Note |
|---|---|---|---|
| **SL-24** ⭐ | **Application service as a first-class field — AMCAS · AACOMAS · TMDSAS** | ○ | **STRONGEST ROW IN THE WAVE, and currently a silent bug.** The board says *"AMCAS per-school fees"* (`SL-19`) and *"submitted in August"* (`SL-20`) **as if there were one application.** **There are three, and TMDSAS is not a variant of AMCAS** — separate portal, **different essay set, earlier deadlines, and its own [Match](https://www.tmdsas.com/application-guide/after-submitting.html#match)** for Texas residents, which is a mechanism no other school has. **A Texas school on an AMCAS timeline is a missed cycle.** ⚠️ **The roster already carries `applicationService`, populated on all 211** — 152 AMCAS · 48 AACOMAS · 11 TMDSAS. **This is surfacing a field that exists, not adding data.** **⚠️ AND THE CHECK FOUND A DEFECT — see below** |
| **SL-25** ⭐ | **Situational-judgement requirement — AAMC PREview / CASPer** | ○ | **The tripwire nobody sees coming.** **[70+ schools](https://students-residents.aamc.org/aamc-preview/participating-schools) accept PREview for the 2026 cycle**, in three tiers — **require · recommend · accept** — and a *requiring* school **may not mark your application complete until the score arrives.** **[TMDSAS requires CASPer](https://www.tmdsas.com/application-guide/after-submitting.html#casper) separately.** ⚠️ **`admissionsTests: { PREview, CASPer }` ALREADY EXISTS on all 211 entries — and is `null` on all 211.** The schema author meant to ship it and nothing was ever populated. **That is a live conflict with §1**: participation changes annually, which is the maintenance trap. **Either populate with per-field source + check date, or delete the keys and make it student-entered. Null on 211 is the one option that is definitely wrong.** ⚠️ **`require / recommend / accept` — three states, so a boolean is the wrong shape** |
| **SL-26** ⭐ | **Prereq coverage, read from Academics** | ○ | **HQ already holds the transcript.** The student types a school's prereqs once (`SL-17` phase 1); HQ matches against courses taken. ⚠️ **`U-13` is the whole design: *"BIOC 430 satisfies biochemistry · no stats course on your record"* is a FACT about the record. *"You are not competitive for this school"* is a judgement.** **`one record, two doors` again — Academics owns the course, this is a filtered read.** **⚠️ Depends on the course→requirement catalog, which `briefs/README.md` lists as not yet written** |
| **SL-27** | **Letters routing per school** | ○ | How many each accepts, which of your writers go where. ⚠️ **`LT-6` ceded per-school letter requirements to MSAR** — but that cede was about **shipping** them. **The student typing them for their own list is §1's ruling exactly**, so this is consistent rather than a reversal. **Reads Letters' `Person` records; stores no second copy** |
| **SL-28** | **Days since the secondary arrived** | ○ | **`SL-16`'s ruling already permits this shape** — *"submitted 94 days ago"* is a fact, *"ghosted"* is a verdict. **The two-week secondary turnaround is real applicant practice, not an HQ opinion** — needs a primary source before any number is stated, or it states no number at all |
| **SL-29** | **The cycle as an object — re-applicant carry-over** | ○ | `SL-6` archives a **school**. **It cannot archive a CYCLE.** A reapplicant keeps their list and starts the statuses over — and **`LT-13` already put status on the request rather than the person for this exact reason.** ⚠️ **Probably cut from v1** — real, but it is the second cycle's problem and a first-year does not have one |
| **SL-30** | **Post-interview: update letter, waitlist, decision** | ○ | Where an acceptance and a waitlist actually land. **Overlaps `SL-16` heavily — likely folded in rather than built** |
| **SL-31** | **Export the list** | ○ | For the advisor conversation, and for typing into AMCAS's school-selection screen. **Reuses `P-13`'s exporter; builds nothing new.** Weakest row here |

### ⚠️ DATA DEFECT #2, found Aug 2026 — three schools are on the wrong application service

**Reconciled our roster against the [TMDSAS member list](https://www.tmdsas.com/about/TMDSAS_schools.html) — the primary source, published by the application service itself, fetched 2026-08-10.**

**TMDSAS lists 14 medical schools. Our file codes 11. The three missing reconcile the count exactly:**

| School | Roster says | Should be |
|---|---|---|
| **Baylor College of Medicine** | `AMCAS` | **`TMDSAS`** |
| **Sam Houston State University College of Osteopathic Medicine** | `AACOMAS` | **`TMDSAS`** |
| **UNT Health Fort Worth · Texas College of Osteopathic Medicine** | `AACOMAS` | **`TMDSAS`** |

**⭐ The two DO schools are the sharpest case in the whole roster.** **Texas public osteopathic programs apply through TMDSAS, not AACOMAS** — **no student would guess that**, and nothing else in HQ would tell them. **This is precisely the failure `SL-24` exists to prevent, sitting in the shipped file right now.**

**TCU Burnett is correctly `AMCAS`** — TMDSAS does not list it. ✅ Checked, not assumed.

**Also found:** name drift — roster has *"Texas A&M University School of Medicine"*; the official name is **"Texas A&M University Naresh K. Vashisht College of Medicine."**

**Recorded in `data/med-schools.json` → `meta.knownDefects`, with the source and the do-not.** ⚠️ **The data is NOT changed** — same discipline as the DO roster defect. **A defect record is not a fix**, and shipped data does not get edited in passing.

**Deliberately NOT proposed, so they are not re-raised as novel:**

- **AAMC traffic rules** (Choose Your Medical School, plea/CIR narrowing dates). **Nationally uniform, so the maintenance objection barely applies** — but they are **authored calendar content, which `11-timeline-tasks.md` owns.** **Timeline's job, not this tab's.**
- **Interview prep** — Story Bank territory, and a second one here forks it.
- **A school's median vs the applicant pool's median.** `U-9`, arriving one step removed.

## 6. ✅ RULED — the three open items `[claude]`

**Andy: *"not sure."* Ruled with reasoning; overrule freely.**

### `SL-9` — SPLIT. Tuition builds, acceptance rate is CUT

**Tuition BUILDS.** It is a real decision input — **NYU being free changes a list**, and tuition plus `P-42` Fee Assistance is a cost picture nobody assembles anywhere else.

**Acceptance rate is CUT.** It is **the number most likely to be read as your odds**, it is the least actionable figure on the page, and it is precisely what the inspiration put in giant type beside a percentage. **A 2.1% next to your name is anxiety with no action attached.**

### `SL-16` — `U-7` holds, but the mechanism differs from Letters

**In Letters, a professor who never replies is a row you delete.** With a school you cannot: you paid, you applied, and the cycle simply ends quietly.

**So: no `rejected` state, no `no response` state.** **But DO show elapsed time since submission as a fact** — *"submitted 94 days ago"* is true and useful. ***"Ghosted"* is a verdict on a non-event**, which is what `U-7` forbids.

### ⭐ `SL-21` (new) — phase gate, same shape as `LT-29`, one difference

**The tab does NOT hide.** A first-year has a real use for it: **schools I am curious about**, with `SL-2`'s *why it is on my list* in their own words. **That works from day one and it is worth writing down early** — the reason you were interested at nineteen is the material for *"why this school"* at twenty-two.

**What hides until the cycle is in range** is the **cycle machinery**: per-school status, secondaries, interview dates, deadlines, cost tracking.

**Why the difference from `LT-29`, stated because the two will be compared:** Letters had nothing useful to show early *except* people, so the letter layer went absent entirely. **School List has a genuinely useful early mode**, so the tab stays and only the cycle layer is gated. **Same principle — do not show someone a pipeline three years before they are in it — different application.**

## 7. Still open

**Wave 4 (`SL-24`–`SL-31`) — eight rows, unruled.** `SL-24` and `SL-25` are the two worth ruling first; both are cheap and both prevent a real cycle failure.

**Waves 0–3 still need the line-by-line batch pass.** The governing decisions are closed, but the individual rows were never ruled one at a time the way Letters and Profile/CV were.

**Closed:** the four fields being optional is answered by `SL-21` — the list works with no numbers at all, and the numbers are what unlock `SL-11`–`SL-14`.
