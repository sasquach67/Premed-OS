# School List

**Status:** **SPECCED for the ruled scope (Aug 2026).** The governing boundary (`§1`), the two modes (`§1b`), `SL-16`, `SL-21`, `SL-22`, `SL-23` phase 1, **all of Wave 4**, **all of Wave 0**, and **all of Wave 1** are migrated here as binding behaviour. **⭐ ALL 31 ROWS RULED — Waves 0–4 CLOSED (Batches 1–7), open decisions C, D, E CLOSED, and `§1` AMENDED (`§1a`), Aug 2026.** The spec is complete. **What remains is data and build, not speccing** — see `## Open decisions` and `## Known code drift`.
**⚠️ The shipped app contradicts ruled behaviour in five places** — see `## Known code drift`. **One is a `U-7` violation live in the product.**
**Board:** `tabs/08-school-list-board.md` — the decision trail, 31 rows. **Source material, not spec.** Where this file and the board disagree on a *ruled* item, this file is the spec and the board is the record of why.
**Catalog:** none yet.
**Sidebar group:** Application · **Spec type:** domain tab
**Depends on:** `general.md` (`U-1`–`U-13`), `architecture/04-admissions-framework.md`, `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `specifications/04-visual-craft-standards.md`, `data/med-schools.json`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Schools on the student's list, list tiers, per-school requirements the student entered, per-school cycle status, the AMCAS/AACOMAS/TMDSAS and secondary dates attached to those schools
- **References only:** Essays and secondary prompts (owned by Essays & Story Bank), applicant stats (owned by Academics / Profile / MCAT), letter writers (owned by Letters)

## Primary metrics (from architecture/04 — domain-appropriate only)

- School count and tier balance as the student tagged it (reach / target / likely)
- Per-school requirements and prerequisites **the student entered**
- Mission and fit in the student's own words — transparent components, never a black-box score

> **Do-not-generalize anchor:** tier balance is School-List-only. **Do not invent an admissions-odds score, a chance-of-acceptance figure, or an application-readiness score** (`04` guardrails · `U-9` · `00-product-vision` non-goal). No other tab inherits the tier vocabulary.

---

## Purpose

**MSAR tells you about schools. Premed OS tracks YOUR application to them. There is no overlap, and that sentence is the whole tab.**

The student already pays for the authoritative data. What nothing holds is the other half: which schools are on the list, **why each one is on it in their own words**, what they have to do for each, and where each application actually stands. That is what this tab is for.

**It is also the tab most likely to drift into something harmful**, because every plausible addition — a median beside your score, a computed tier, a readiness bar — converts a record into a verdict. `§2` is the boundary that prevents it and it is binding.

## Primary users and stages

**`SL-21` — the cycle machinery is phase-gated. The tab itself never hides.**

| Stage | What the tab is |
|---|---|
| **First year → junior** | **A curiosity list.** Explore the roster, add a school, write *why it interests me*. **No status, no secondaries, no deadlines, no cost tracking render at all.** |
| **Cycle in range → applicant** | The above **plus** the cycle layer: per-school status, secondary prompts and dates, requirements, cost. |
| **Post-submission** | Same surface. Elapsed-time facts replace nothing; see `§7`. |

**Why the tab stays visible when Letters' equivalent (`LT-29`) goes absent:** Letters had nothing useful to show a first-year *except* people, so the letter layer disappeared entirely. **School List has a genuinely useful early mode** — the reason you were interested at nineteen is the material for *"why this school"* at twenty-two — so only the cycle layer is gated. **Same principle, different application. Do not "fix" the inconsistency by hiding this tab.**

**Gated means ABSENT, not greyed out.** A greyed-out application pipeline shown to a sophomore reframes a curiosity list as a race they are already behind in.

---

## 1. ⚠️ Read this before adding anything: the `U-12` ruling, as amended

**AAMC MSAR is `$28`/year (`$36` for two) and is the only source carrying data directly from the MCAT exam, the AMCAS application, and admissions offices.** It already offers sort, browse, and side-by-side comparison. **`U-12` §4 CEDES that data. Premed OS keeps the list.**

> **⚠️ AMENDMENT (board `§1b`, Aug 2026) — the original ruling said "no medical school database." That is now too wide and reading it literally is a mistake.** The prohibition is on **shipped NUMBERS**, not on a name-and-location directory. A static roster ships (`§3`). Everything below is the ruling as amended; the board carries the full reasoning and the two rejected alternatives.

### What Premed OS must NOT build

- **No shipped admissions-profile numbers of any kind** — no medians, no acceptance rates, no in-state percentages, no class sizes, no bundled admissions figures. **⭐ AMENDED Aug 2026 — see `§1a`.** A **cycle-stamped snapshot of self-published figures** is now permitted. **Bulk ingestion of licensed datasets, fetching, and acceptance rate remain forbidden.**
- **No acceptance rate at all, in any layer** (`SL-9`, ruled — see `§6`).
- **No fetching.** No runtime call to any admissions source, geocoder, portal, or school page. Ever.
- **No admissions-odds score, chance figure, or application-readiness score** — `U-9`, and a stated non-goal in `00-product-vision`.

### Why the ruling rests where it does

The licensing objection was **overstated** and is recorded as such on the board: facts are not copyrightable, and schools publish their own class profiles. **The reason that actually holds is maintenance** — 240 schools × ~15 admissions fields, re-verified annually, forever, by one student in the summers he is taking the MCAT and applying. **Anyone revisiting this must argue against maintenance, not against licensing.**

**⚠️ The honest cost, recorded with eyes open: a student cannot discover a school they had never heard of by its numbers.** MSAR does that. This is a trade, not a free win.

## 1a. ⭐ AMENDMENT — the self-published snapshot (Aug 2026)

> **`§1` is amended, narrowly. Premed OS MAY ship a cycle-stamped static snapshot of figures schools publish about themselves. It still may not assemble MSAR's dataset, and it still may not fetch.**

### What the research established, and why the amendment is this small

A full official-source pass over all 240 schools was run, and a separate bulk-source audit checked whether a published dataset already carried these fields. **Three findings decided the shape:**

1. **Coverage is low and permanently so.** MCAT 55/240, GPA 53/240, **both together 51/240**. Most schools do not publish class statistics at all.
2. **No free bulk source exists for MD schools.** AAMC's free FACTS tables are national aggregates — **Table A-1 is the only per-school table and it carries no MCAT or GPA.** Per-school figures are the MSAR product.
3. **The two usable bulk sources are licence-blocked, not availability-blocked.** MSAR's Advisor Report is individual-use; AACOM's per-college MCAT has no established reuse permission. **IPEDS is public domain but reports at parent-institution grain**, so its tuition and enrolment are not the medical school's.

**`U-12` §4 is therefore confirmed empirically rather than argued.** A mature product does this, the student can get it — **free with AAMC Fee Assistance** — and HQ cannot lawfully rebuild it. `implementation/research-prompts/school-list-u12-admissions-numbers-feasibility.md`.

### ✅ What is now permitted

- **A static, cycle-stamped snapshot of figures a school publishes on its own site**, stored in `data/med-schools.json`.
- **Prefill of the `SL-7` fields from that snapshot**, proposed and confirmed by the student (`§5a`).
- **Every figure carries `stat`, `population`, and its cycle**, or it does not ship. **A mean in a field named median is `U-13`'s failure and is forbidden.**
- **A screening threshold is a separate field** and never renders as a class figure.

### ❌ What remains forbidden — unchanged

- **No bulk ingestion of MSAR, AACOM, or any licensed dataset.** The blocker is the licence, not the effort.
- **No fetching. Ever.** `§2`'s line is untouched — the snapshot is built offline and committed.
- **⚠️ No acceptance rate, in any layer.** `SL-9` cut it on **anxiety** grounds, not maintenance. **This amendment does not touch it and must not be read as touching it.**
- **No admissions-odds score, chance figure, or readiness score.** `U-9`.

### ⚠️ Prerequisites — permitted on a DIFFERENT rationale, stated separately

**Prereqs were never blocked by maintenance. They were blocked by correctness:** no AMCAS / AACOMAS / TMDSAS prerequisite-equivalency standard exists, and school policies on labs, AP, community college, online coursework, and recency all differ (`§7b`, `SL-26`).

- **✅ Permitted: a school's published requirement text, in the school's own wording**, as a record of what the page says.
- **❌ Forbidden, permanently: any claim that a course satisfies, meets, or fulfils a requirement.** **`SL-26` is unchanged. Grep must still prove no such string exists.**

**Recorded because it is the likeliest future error:** a reader who sees medians permitted may assume every blocked field was blocked for the same reason. **It was not.**

### Refresh posture — decided, not assumed

**The snapshot is stale by design and says so.** `meta.cycle` and `meta.retrievedAt` already exist; **any surface showing a figure carries the cycle**, so an old number reads as *"2026–27 figure"* rather than as current fact.

**⚠️ Deadlines are the exception and do not get this latitude.** A year-old median is a mild inaccuracy; **a year-old deadline is a missed application.** A deadline renders only with a confirmed cycle label, or not at all (`§7d`).

### What would reopen this

**A licensed or public per-school source appearing** — AACOM granting reuse, or AAMC publishing per-school figures freely. **Not "we looked harder."** The 22% ceiling is the market's shape, not a research failure.

---

## 2. ⭐ The data-trust model — three layers, and the line between them is the spec

> **THE LINE, and it is the whole ruling in one sentence:**
> **Premed OS may compute on numbers the student gave it. It may not go and get them.**

| Layer | What it is | Source | Maintenance cost |
|---|---|---|---|
| **A · Directory facts** | Name, city, state, MD/DO, public/private, region, application service, accreditation status | **Shipped** — `data/med-schools.json`, primary-sourced (LCME, AACOM, TMDSAS) | **None.** These facts effectively never change |
| **B · Student-entered numbers** | Median MCAT · median GPA · in-state % · class size · tuition · requirements · deadlines · secondary prompts | **Typed by the student**, from the source they already pay for, this cycle. **⭐ May be PREFILLED from a cycle-stamped snapshot where one exists (`§5a`) — the student still confirms, and the value carries its `stat`, `population`, and cycle** | **None to Premed OS.** Current by construction |
| **C · Derived** | Arithmetic over Layer B and the student's own record | **Computed locally**, inputs always shown | n/a |

### The claim test (`U-13`, and it is checkable)

| Allowed — a fact or an arithmetic result | Forbidden — a judgement or a prediction |
|---|---|
| *"MCAT 523 · their median 520 · +3"* | *"You are competitive here"* · any percentage or odds |
| *"12 schools: 3 reach, 7 target, 2 safety"* — a count of **the student's own tags** | *"Your list is unbalanced"* |
| *"Primary submitted 94 days ago"* | *"Ghosted"* · *"rejected"* (`U-7` — see `§7`) |
| *"You entered these numbers on 2026-08-11"* | *"These numbers are out of date"* stated as a warning about their application |

**Corollary, already locked in `general.md` `U-13`:** arithmetic on numbers the student supplied is a **fact**; it becomes a judgement the moment it is expressed as a probability, a verdict, or a composite.

### Layer B is optional and the tab works without it

**A list with zero numbers entered is a complete, correct product.** The numbers unlock the Layer C arithmetic and nothing else. **Never gate list creation, school addition, status, or secondaries on a number being present** (`U-8` — Premed OS may decline to assert; it may not withhold a capability or gate the student out of finishing something).

**Insufficient data → dormant with a reason, never a zero and never an empty chart** (`U-5`).

---

## 3. Two modes — Explore and Track

> **Andy, Aug 2026:** *"i do want to be able to separate EXPLORING SCHOOLS as in researching them, and then adding one to my list and keeping track of the actual application… so i can keep up with their deadlines and requirements"*

| Mode | Record set | Editable | Gated? |
|---|---|---|---|
| **Explore** | The shipped roster — 240 entries, Layer A only | **No.** Read-only reference data | No — available at every stage |
| **Track** | The student's own `TrackedSchool` records | Yes, entirely theirs | Tab visible always; **cycle layer gated per `SL-21`** |

### ⚠️ This is NOT `one record, two doors`

**Do not apply that pattern here.** Explore and Track are **two different record sets** — shipped reference data and student-owned records — not one set behind two filters. Adding from Explore **creates** a `TrackedSchool` that references the roster entry by `id`; it does not reveal a hidden one.

`one record, two doors` *does* apply between this tab and Essays — **twice, and the ownership runs opposite ways**: Essays owns the secondary prompts this tab reads (`§8`), and **School List owns the `whyItIsOnMyList` that Essays reads** (`§4a` `SL-2`). Keeping the patterns straight matters, because conflating them is how a second store gets built.

### The roster

- **240 entries: 165 MD + 75 DO.** Grain is **teaching-location / program level** on both sides — the entries a student actually selects on AMCAS / AACOMAS / TMDSAS.
- **Verified row-by-row against primary sources** (LCME accredited-programs table; AACOM College Directory), not by matching totals. **⚠️ Any future "verified against source" claim in this repo means row-by-row or it means nothing** — a coincidental matching count hid a 27-school gap once already.
- **Free text is always allowed.** A student may add a school absent from the roster by typing its name (`SL-1`). The roster is an autocomplete, never a whitelist.
- **Admissions-profile fields in the file are `null` by design.** They are not unfinished work. Do not populate them, and do not write code that treats a `null` median as an error state.

### ⭐ Regional campuses — both entries STAY, gated by availability (RULED Aug 2026, Batch 3)

**Sidney Kimmel — Delaware Regional Medical Campus** and **Tufts — Maine Track** are the 2 of 240 entries with no city. **Both stay. The roster count remains 240.**

**The test is the applicant's, not the accreditor's:** *can a student select this option in the current cycle?* **LCME accredits 163 programs; a student does not apply to an accreditation.** The DO side already ships at teaching-location grain for the same reason, so keeping these is consistent rather than an exception.

**⚠️ But the research found they are not the same case, and one of them cannot be selected at all:**

| Entry | Finding | Consequence |
|---|---|---|
| **Tufts — Maine Track** | A track under the **parent program's** accreditation. Real and selectable today | Renders normally, marked as a track of its parent |
| **Sidney Kimmel — Delaware** | **NOT YET OPERATING.** No AMCAS record of a separate designation was found | **Must not be selectable this cycle** |

**Therefore the roster carries an availability field.** A campus that is not yet operating is **visible and unselectable, with the reason stated** — never silently absent, and never selectable-but-broken. `implementation/research-prompts/school-list-regional-campus-grain.md`.

**⚠️ Do not resolve a future case of this by deleting rows.** Deleting changes every count the app displays and silently narrows `SL-22`'s completeness claim. **The packet also warns there may be more regional campuses in this position — if the count grows, that is a roster-grain decision, not a series of one-offs.**

**Do not infer a city from the parent institution.** Neither entry gets a coordinate it does not have; `SL-22` renders a pin only where a location is sourced.

---

## 4. Core entities

- **`School`** — a **read-only roster entry**, shipped. `id` · `name` · `type` (MD/DO) · `control` · `state` · `city?` · `region` · `applicationService` (`AMCAS` | `AACOMAS` | `TMDSAS`) · `accreditationStatus?` · `source` · `fieldSources`. **Never written by the app.**
- **`TrackedSchool`** — the student's record. References `School.id` **or** carries a free-text name. Holds:
  - `whyItIsOnMyList` — **the field MSAR cannot have. The one thing that makes this list yours.**
  - `tier` — the **student's own tag**, always authoritative (`§6`)
  - `enteredNumbers?` — median MCAT · median GPA · in-state % · class size · tuition, plus **`enteredOn`**, their own freshness stamp
  - `requirements?` · `deadlines?` — student-entered, phase 1 only (`§9`)
  - `status?` — cycle layer only (`§7`)
  - `archivedAt?` — **archive, never delete. A school you dropped is a decision worth keeping.**
- **`CycleApplication`** — ⭐ **added by `SL-24b`, Aug 2026.** One record **per application service per cycle**, not per school. `service` (`AMCAS` | `AACOMAS` | `TMDSAS`) · `cycle` · `submittedOn?` · `serviceState?` · plus the service's own document facts. **A student applying to Texas schools and non-Texas schools has two of these.** See `§7a`.
- **`Essay`** — **NOT OWNED HERE.** Owned by Essays & Story Bank (`09` §7): `school?` · `promptText` · `limit` · `limitUnit` · `status` · `dueDate?` · `draft`. This tab is a **second door** onto those records (`§8`).
- **Referenced, never copied:** applicant MCAT and GPA (Academics / MCAT / Profile), residency (`P-33`), letter writers (Letters `Person`).
- **Derived (Layer C):** per-school deltas, tier-tag counts, in-state count, days-since-submission. **All recomputed on read. Nothing derived is stored.**

---

## 4a. ⭐ Wave 0 — the list itself, row by row (RULED Aug 2026, Batch 4)

**These six rows are what makes the list a list.** The envelope was already migrated; this is the row-by-row pass.

### `SL-1` — add a school ✅ BUILD

**Autocomplete against `data/med-schools.json` — names only.** The roster is **an autocomplete, never a whitelist**: free text is always allowed for anything absent, misspelled, newly accredited, or foreign.

| Entry route | What the record gets |
|---|---|
| **Picked from the roster** | References `School.id`. Layer A facts — type, state, city, application service — **render read-only** |
| **Typed free-text** | Carries a name and nothing else. **Layer A facts are DORMANT, not blank and not guessed** |

**⚠️ A free-text school never receives inferred facts.** Premed OS does not guess MD/DO from the name, state from the word "Texas," or application service from either. **The student sets what they know; the rest stays dormant** (`U-5`).

**⚠️ No fetch, ever — not even to validate a name the student typed.** `§1` is absolute on this.

**A duplicate warns; it never blocks.** A student may have a reason for two rows, and blocking an entry to enforce a data model is the tab telling them they are wrong about their own list.

### `SL-2` — why it is on my list ✅ BUILD, and Essays reads it

**Free text, available from day one, never required, never prompted more than once** (`U-1`). **A school is addable with this field empty forever.**

> **⚠️ Never generated, never suggested, never autocompleted.** This is the field MSAR cannot have and the one thing that makes the list the student's. **A proposed sentence here would be Premed OS putting words in a student's mouth about their own motivation.**

**⭐ The Essays handoff (RULED Aug 2026):** **Essays & Story Bank READS `whyItIsOnMyList`; School List OWNS it.** When the student drafts that school's *"why this school,"* the note is visible as material. **One record, two doors** — the same pattern as secondary prompts (`§8`) and Letters' `Person` (`§7b`).

- **Editing it in either place edits the same record.** There is no copy and nothing to drift.
- **It is material, not a draft.** Essays never treats the note as prose to submit.
- **Grep proves one store.** `09` §7 already says School List *"supplies the material for 'why this school'"* and **"never a second school database"** — this is that sentence, specified.

**This is the argument for the tab existing before a cycle does.** The reason you were interested at nineteen is the material at twenty-two, and **it is unrecoverable if it was never written down.**

### `SL-3` — the student's own tier tag ✅ BUILD

**Already binding in `§6`: the tag is the record.** Never computed silently, never recomputed after the student sets it, never overridden.

**Row-level additions:** the default is **`undecided`**, which is a real state and not a guess. **No school is required to carry a tier**, and a list of twelve untagged schools is a valid list.

### `SL-4` — MD / DO / other ✅ BUILD

**Layer A for roster entries — read-only, from the file.** Student-set for free-text entries. **`other` exists** for foreign and non-listed programs.

**⚠️ Never inferred from a school's name.** *"College of Osteopathic Medicine"* is a naming convention, not a data source — and the roster already carries the verified value for all 240.

### `SL-5` — state, and the in-state flag ⭐ RULED, with the blank case specified

**State is Layer A for roster entries, student-set for free-text.** **In-state is Layer C — derived on read from state + residency (`P-33`), never stored.** Change residency in Profile and every flag and count recomputes; nothing needs migrating.

**⭐ When residency is blank — and it is blank for every new user:**

- **The in-state flag and the in-state count go DORMANT.** They do not render as `0`, as "out-of-state," or as an empty chip. `U-5`.
- **The dormant state states its reason and teaches**, in one line: *"In-state status needs your residency — it materially changes a list."* **A dormant field that explains itself is worth more than a hidden one.**
- **It links to the Profile field.** One route, no re-entry here — **`P-33` is Profile's record and this tab does not hold a second copy.**
- **It never nags.** No prompt, no badge, no attention-budget spend.

> **⚠️ The reasoning, recorded because it justifies the calm posture (Andy, Aug 2026):** *"no one who has a blank slate will even be old enough to apply at that point."* **A blank residency almost always means a first- or second-year who is years from an application.** There is nothing urgent to resolve, so the correct behaviour is to inform and wait — **not to chase the field.**

**⚠️ Blank is never treated as out-of-state.** That states something false about every school on the list, which is `U-13` — a claim wearing a fact's clothes.

**`SL-14`'s in-state count inherits this dormancy.** It is already ruled and shipping; **it must not render a count while residency is unset.**

### `SL-6` — archive, never delete ✅ BUILD

**`archivedAt` on the `TrackedSchool`. The record is never destroyed.** *"A school you dropped is a decision worth keeping."*

- **An archived school leaves the active list and every count it feeds** — tier balance, in-state, list size.
- **It stays retrievable**, with its `whyItIsOnMyList` intact. **The reason you dropped a school is itself material.**
- **Grep proves no destructive path.** No delete, no remove, no clear.

> **⚠️ LIVE CODE CONFLICT, Aug 2026.** `src/pages/Schools.tsx` ships a `Remove` row action, and `01` §4c listed `Remove` until it was corrected in Batch 3. **The shipped code contradicts this ruling today** — see `## Known code drift`.

---

## 5. Core views

**Default view: table** (`01` §5 — structured records use `TrackerTable`). Views share the standard filter → sort → group → render order, selection and bulk bar, empty/loading/error states, and click-to-peek.

| # | View | Notes |
|---|---|---|
| **1** | **My list (table)** — default | Track mode. One row per `TrackedSchool` |
| **2** | **Explore (table)** | The roster. Filter by state, MD/DO, application service. **Search by name.** No numeric filters exist because no numbers ship |
| **3** | **Map** — `SL-22`, optional, **never the default** | See below |

### `SL-22` — the map, and the locks on it

**It survives the question that killed three other features** (*"what is this actually for?"* — `O-1`, `R-1`, the campus surface) **for a reason specific to this tab: geography is an actual admissions variable here.** In-state preference materially changes a list, interview travel is a real cost, and *"eight schools within driving distance of home"* is a discovery an alphabetical list never produces. **The student does something different because of it.**

**Locked:**

- **Third view, never the default.**
- **Two pin states only — on your list, not added.**
- **No tier colouring, no median heat, no size-by-anything.** That is `U-9` arriving through cartography.
- **Clicking a pin adds the school or opens its record.** The map is an entry point, not a second detail surface.
- **Leaflet, Premed OS renders its own pins, no iframe** — reuses `07-campus-layer-board.md` §2g. **Not a new mechanism.**
- **City centroid is sufficient.** Nobody needs the building.
- **⚠️ Geocoded once, offline, stored in `data/med-schools.json`. Never a runtime geocoding call** — that would breach `§2`'s no-fetch line.

**Data state:** 238 of 240 entries have a city. **The 2 without one are ruled** — `§3`, regional campuses. **⚠️ No `lat`/`lng` field exists yet. `SL-22` cannot render a pin until the offline geocode pass runs.**

---

## 5a. ⭐ Wave 1 — the numbers, and where they come from (RULED Aug 2026, Batch 5)

### ⚠️ The finding that settled this, and it was not what either option assumed

**An official-source pass over all 240 schools was run in Aug 2026.** Coverage, from the schools' own pages:

| Field | Published | |
|---|---:|---|
| MCAT | **55 / 240** | 22% |
| GPA | **53 / 240** | 22% |
| **Both, which `SL-11`'s delta needs** | **51 / 240** | **21%** |
| Class size | 50 / 240 | 20% |
| Tuition | 42 / 240 | 17% |
| **In-state percentage** | **5 / 240** | **2%** |

> **⭐ Shipping and typing were never alternatives. At 21%, four schools in five would still be blank.** So `SL-7` survives regardless of what `§1` decides — **a shipped value can prefill the field; it can never replace it.**
>
> **This also confirms `U-12` §4 empirically rather than by argument.** MSAR holds these figures because AAMC collects them from admissions offices directly. **Most schools simply do not publish them**, which is exactly why HQ cannot assemble the same dataset by looking harder. `implementation/research-prompts/school-list-u12-admissions-numbers-feasibility.md`.

### `SL-7` — the four fields ✅ BUILD, student-entered, optionally prefilled

**All four stay** — median MCAT · median GPA · in-state % · class size. **Every one optional; a list with none of them is a complete product** (`§2`).

**Where a sourced value exists, it PREFILLS and the student confirms.** It is never silently applied — `U-10` propose-and-wait, the same mechanism already ruled for `SL-26`'s course mapping and `SL-21`'s gate.

> **✅ GATE LIFTED — `§1a`, Aug 2026.** The prefill half is permitted, from a **cycle-stamped snapshot of self-published figures only**. **Every prefilled value carries `stat`, `population`, and its cycle, or it does not ship.**
>
> **This ruling is written now because the shape does not depend on that decision** — at 21% coverage the field is student-entered either way, and the `stat` / `population` / cycle requirements below apply to any sourced value whenever one is permitted. **Build the field; leave the prefill wire unconnected.**
>
> **The amendment needs three separate sentences, because the fields are blocked for different reasons:**
> 1. **Medians, GPA, class size, tuition** — blocked on *maintenance*. A cycle-stamped static snapshot answers that.
> 2. **Prerequisites** — blocked on *correctness*. No cross-service equivalency standard exists (`SL-26`), so they may ship as *"what the school's page says"* and never as a satisfies-claim. **A staleness amendment does not cover this.**
> 3. **Acceptance rate** — **stays cut**, `SL-9`, on anxiety grounds. **No amendment about staleness touches it.**

**⚠️ A prefilled value carries what it actually is, or it does not ship at all:**

- **`stat`** — median · mean · range · percentile band. **Schools publish different statistics and rarely label them.** A mean displayed in a field called "median" is `U-13`'s failure exactly: a fact-shaped claim that is false.
- **`population`** — matriculants · accepted · applicants · **unstated**. `unstated` is a real value and the most common one.
- **The cycle it describes.**

**⚠️ A minimum threshold is NOT a central tendency.** Some schools publish a screening cutoff rather than a class figure. *"Minimum 500 for secondary review"* and *"average 500"* mean opposite things. **They are separate fields and must never merge.**

**In-state percentage is effectively unpublishable — 5 of 240.** The field stays because a student with the number should have somewhere to put it, **but nothing prefills it and no feature may depend on it.** Anything reading it renders dormant with a reason (`U-5`).

### `SL-8` — `enteredOn` ✅ BUILD, and it now does more than it used to

**Two kinds of value will sit in one list**, so every number states which it is:

| Provenance | Stamp | Reads as |
|---|---|---|
| **The student typed it** | `enteredOn` | *"you entered this on 2026-08-14"* |
| **Prefilled from a snapshot** | the file's `cycle` + `retrievedAt` | *"2026–27 figure"* |

**⚠️ A student edit converts the record.** Overwriting a prefilled value makes it theirs — `enteredOn` is set and the snapshot stamp is dropped. **The two stamps never coexist on one value.**

**Nothing warns that a number is old.** *"You entered these on 2026-08-11"* is allowed; *"these numbers are out of date"* is a verdict about the student's application (`§2`'s claim test). **The stamp is the whole feature. The student draws the conclusion.**

### `SL-10` — "Verify on MSAR" ✅ BUILD, and the coverage data justifies it

**One line, stated once, dismissible** (`U-1`, `U-8`).

**This is not a courtesy.** For **79% of schools Premed OS has no figure at all**, and MSAR carries data direct from the MCAT exam, the AMCAS application, and admissions offices. **It is free with AAMC Fee Assistance**, which `U-12` §4's second clause makes decisive: a mature product does it, the student can get it, HQ does not rebuild it.

**Do not** repeat it per school, per field, or per session. **Do not** phrase it as a warning about the student's data.

---

## 6. Tiers and the Layer C arithmetic

### The student's tag is the record

**`tier` is the student's judgement.** It is never computed silently, never recomputed after they set it, and never overridden.

### The suggestion, constrained

Premed OS **may** suggest reach / target / safety **only when the student has entered that school's numbers**, and only under all three constraints:

1. **It shows its arithmetic.** *"MCAT 6 below their median · GPA 0.05 above"* → suggests `reach`. The inputs are visible at the point the suggestion is made.
2. **It never expresses a probability.** No percentage, no odds, no "chance," no confidence figure, no colour ramp standing in for one.
3. **The student's tag always wins** and is never silently replaced.

### Ruled arithmetic

| | Behaviour |
|---|---|
| **Delta** | *"MCAT 523 · median 520 · +3."* Subtraction, displayed with both operands. **Never a verdict** |
| **List balance** | *"12 schools: 3 reach, 7 target, 2 safety."* **A count of the student's own tags** — not an opinion about whether that balance is right |
| **In-state count** | Deterministic from state + residency (`P-33`) |

## 6a. ⭐ Wave 2 — the arithmetic, row by row (RULED Aug 2026, Batch 6)

### ⚠️ Read this before `SL-11`: dormant is the NORMAL state here

**`SL-11`'s delta needs both a median and a GPA. Only 51 of 240 schools publish both** (`§5a`), and the MD half of that gap is permanent — AAMC sells those figures as MSAR and most schools never publish them.

**So for a typical list, the delta is available on roughly one row in five, and typing is the only way it ever appears on the rest.**

> **The question that had to be answered first: is a feature that is dormant on four rows out of five worth building at all?**
>
> **Ruled: yes, and narrowly.** **The delta is the only reason typing a number pays off.** Cut it and `SL-7` becomes data entry with no return, which kills the Layer B story entirely. **But it ships as a per-row fact that appears where its inputs exist — never as a list-level feature that looks broken when four rows are blank.**

### `SL-11` — your number vs theirs ✅ BUILD, per row, dormant by default

**`"MCAT 523 · median 520 · +3"` — subtraction, both operands shown.**

- **Renders only where the student has entered that school's number AND has their own.** No inputs, no row. **No placeholder, no dash, no "add your numbers" nag.**
- **Both operands always visible.** A bare `+3` is a claim; `523 · 520 · +3` is arithmetic the student can check.
- **⚠️ Never aggregated.** No average delta, no "your list averages −2." **That is a composite, and `U-9` forbids it.**
- **⚠️ The delta carries the same `stat` caveat as its input** (`§5a`). A delta against a **mean** is not a delta against a **median**, and a delta against a **screening threshold** is not a delta at all. **Where `stat` is unknown, show the two numbers and no delta.**

### `SL-12` — tier suggestion ✅ BUILD, constrained, already bounded by `§6`

**Premed OS may suggest reach / target / safety only under `§6`'s three existing constraints** — shows its arithmetic, never expresses a probability, and the student's tag always wins.

**Row-level additions:**

- **It fires once per school, on the numbers being entered.** **Never re-fires, never nags, never re-suggests after an override** (`U-1`).
- **⚠️ A suggestion is never the initial value.** `SL-3` ruled `undecided` the default. **A suggestion the student never actively accepted must not become their tag by inaction.**
- **Dormant wherever `SL-11` is dormant.** Same inputs, same silence.

### `SL-13` — list balance ✅ BUILD, as a count and nothing more

**`"12 schools: 3 reach, 7 target, 2 safety."`**

- **A count of the student's own tags.** Nothing else on the page is more purely descriptive.
- **⚠️ Never an opinion about the balance.** No "your list is reach-heavy," no recommended ratio, no colour signalling a shortfall. **`U-9`, and it is the most tempting violation in this tab** — every competitor ships exactly that verdict.
- **`undecided` is counted and shown**, not hidden. A student with twelve untagged schools sees `12 undecided`, which is true.
- **Renders from tags alone**, so it works with zero numbers entered — **unlike everything else in this section.**

### `SL-14` — in-state count ✅ BUILD, inheriting Batch 4's constraint

**Deterministic from state + residency (`P-33`). Recomputed on read, never stored.**

**⚠️ Dormant while residency is unset** — ruled in `§4a` `SL-5`. **It does not render `0 in-state`; it states that residency is needed and links to Profile.** A zero would be a false fact about the student's list.

### ~~`SL-15`~~ — CUT, and it stays cut

**An application-readiness score or progress bar. `U-9`.** Recorded in `§6`'s rejected list. **The whole of Wave 2 is arithmetic whose operands stay visible; `SL-15` is the opposite — one number standing in for everything, with its inputs hidden.**

---

### ⚠️ Explicitly rejected — do not reintroduce under another name

- **`SL-15` — an application-readiness score or progress bar. CUT, `U-9`.** A single number summarising a whole application is exactly the invented composite the rule exists to prevent, and it would be the most-screenshotted, most-anxiety-producing element in the product.
- **Acceptance rate (`SL-9`, ruled).** It is the number most likely to be read as *your* odds, it is the least actionable figure on the page, and a 2.1% next to your name is anxiety with no action attached.
- **A school's median against the applicant *pool's* median.** `U-9`, one step removed.

### ✅ `SL-9` — tuition BUILDS, as a student-entered planning input

**NYU being free changes a list.** Tuition plus `P-42` Fee Assistance is a cost picture nobody assembles anywhere else. It is Layer B: **typed by the student, never shipped, never fetched.**

### ⭐ "Add to compare" — STRUCK. The list itself is the comparison. (RULED Aug 2026, Batch 3)

**`specifications/01-shared-interface-patterns.md` §4c listed "Add to compare" as a School List row action. It is struck** — resolution 1 of the three the open decision named.

**Two separate findings, and both point the same way.**

**1. What was left to compare is not what MSAR compares.** `§1` ships no admissions numbers, so a compare surface here could only hold Layer A (service, state, MD/DO), Layer C (in-state, tier counts, prereq coverage), and whatever Layer B the student typed. **MSAR compares admissions data; this would compare cost and logistics.** A different feature wearing the same word.

> **⚠️ Recorded so it is not re-argued: `U-9` does NOT forbid this.** Its three clauses — *"not against a bar, not against other students, not against the student's own past"* — all concern **the student**. Arranging schools does not score the applicant. **The earlier conservative reading conflated the two; the constraint that actually binds is `§1`'s ban on shipped numbers.**

**2. A table is the wrong shape, and that is the deciding reason.** MSAR's table works because **MSAR's data is complete and uniform for every school.** Layer B is sparse by construction — a student types tuition for four schools out of twelve. **A grid renders that sparseness as rows of blank cells, and every blank reads as the student's failure to do homework.** `U-5` already governs this: insufficient data goes dormant with a reason, never an empty chart. **A comparison table over sparse student-entered data is an empty chart with extra steps.**

**What ships instead: sort, group, and filter on the list that already exists.** Group by application service, sort by tuition, filter to in-state. **Same information, no second surface, nothing empty.**

**⚠️ A row-level "Add to compare" is the tell.** It implies a separate compare *destination*, and that destination is the MSAR-shaped thing `§1` cedes. **The row menu is `Move tier · Mark applied · Archive`.**

> **⚠️ A second defect was found in the same row while striking this.** `01` §4c read `Remove`, but `§4` of this spec is explicit: **"archive, never delete. A school you dropped is a decision worth keeping."** **Corrected to `Archive` in the same edit** — recorded here because it was not part of the open decision and a later reader will otherwise wonder where it came from.

**Three questions, three shapes — do not collapse them into one "compare" feature:**

| The question | What answers it | Shape |
|---|---|---|
| *"Is my list balanced?"* | `SL-13` tier counts, `SL-14` in-state count | A count or small bar |
| *"What can I afford?"* | `SL-9` tuition + `P-42` fees | Sorted rows — money compares as length |
| *"What do I owe each school, and when?"* | Cycle-layer status, deadlines | **The list, sorted by date** |

---

## 7. The cycle layer (gated) — status, and the `U-7` problem

**Everything in this section renders only when the cycle is in range** (`SL-21`).

### ⭐ `SL-21` — what puts a cycle "in range" (RULED Aug 2026, Batch 3)

> **The student throws the switch. Premed OS proposes and waits. It never flips itself.**

**The gate is an explicit application-mode state the student controls.** It is available at all times — including earlier than Premed OS would suggest — because **`U-8` permits declining to assert and forbids withholding a capability.** A student further ahead than the calendar assumes is never gated out.

**Premed OS proposes once, in the autumn before the cycle opens** — roughly eight months ahead, derived from the expected application year collected at onboarding. *"Cycles usually open in early May — turn on cycle tracking?"* **The student answers; nothing changes until they do.** This is `U-10`'s propose-and-wait, the same mechanism already ruled for `SL-26`'s course mapping.

**⚠️ The proposal is derived from the YEAR ALONE. No service date is stored, computed, or displayed by this gate.**

| Rejected | Why |
|---|---|
| **A pure student switch with no prompt** | A student who never flips it never sees deadlines — **silent failure on the one surface where a miss is unrecoverable** |
| **A date formula that activates application mode** | The packet found AMCAS opened **May 6 / May 1 / May 5** across three official cycles, and only **two** cycles of published history exist for AACOMAS and TMDSAS. **A derivation rule would be an inference presented as a calendar** |
| **Deriving from onboarding without confirmation** | Gap years are the norm. The expected cycle a first-year enters goes stale constantly |

**Why autumn and not January:** the work the cycle layer supports — building the list, tiering, lining up letter writers — happens in the spring *before* applications open. **Letter writers asked in April are asked late.**

**⚠️ If Premed OS ever displays an actual service date, that is a different feature with a different rule:** it needs a freshness-labelled annual lookup, never a formula. `implementation/research-prompts/school-list-sl-21-cycle-calendar.md`. **The TMDSAS rank-preference deadline is explicitly unsuitable for approximation** — missing it withdraws the applicant from every medical school (`SL-24c`).

## 7a. ⭐ `SL-24` — the application service, and the primary is not per-school (RULED Aug 2026)

### `SL-24` — `applicationService` is first-class ✅ BUILD

**Every tracked school carries `AMCAS` | `AACOMAS` | `TMDSAS`.** The roster already holds it on all 240 entries — 153 AMCAS · 73 AACOMAS · 14 TMDSAS. **This surfaces a field that exists; it adds no data and creates no maintenance.**

**Why it is not cosmetic:** **Sam Houston State COM and UNT Health Fort Worth TCOM are osteopathic schools that apply through TMDSAS, not AACOMAS.** **No student would guess that, and nothing else in Premed OS would tell them.** A Texas school run on an AMCAS timeline is a missed cycle.

### ⭐ `SL-24b` — the primary is a SERVICE-LEVEL object. This amends `SL-16`.

> **You fill out one AMCAS application. You submit it once. AMCAS sends it to twelve schools.**

**Putting `primary submitted` on each school makes the student record one action twelve times**, and leaves nowhere to put the facts that are true of the application rather than of a school — *"AMCAS is holding this until your transcript arrives."* That is one fact about one application, not twelve facts about twelve schools.

| Lives on `CycleApplication` (per service) | Lives on the school |
|---|---|
| Primary submitted date · service processing state · document holds (transcripts, verification) | **Secondary received · secondary submitted · interview · decision** |

**The test:** *did the student do this once, or once per school?* Once → the service record. Once per school → the school record.

**⚠️ The case that forces it:** a student applying to Texas **and** elsewhere has **two primaries** — different deadlines, different document rules (TMDSAS asks for transcripts only when it wants them; AMCAS waits on them before processing). **The per-school model cannot represent that at all** — it renders two rows with the same status label meaning two different things.

**Cost, recorded honestly:** this is a second entity in a tab that had one, and it edits a `SL-16` ruling that was already closed. **It is far cheaper now than after a student has twelve live applications in it** — that migration would land mid-cycle, which is the worst possible time.

**Do NOT render the three services' own state vocabularies verbatim.** AMCAS says *Ready for Review*; AACOMAS says *Verified*; TMDSAS says neither. **Three vocabularies on one screen is three mental models for a student applying to two services.** Keep one plain set in the UI and store the service's source state underneath.

### `SL-24c` — ⏸ TMDSAS Match: DEFERRED with `SL-18`

**TMDSAS runs a Match for eligible Texas residents who have interviewed and rank their schools. An applicant who misses the ranking deadline is withdrawn from every medical school.**

**Deferred, not cut** — Match sits *after* interviews, and interview logistics are already deferred (`§6b`). **The research is done and cited on the board; nothing needs re-deriving when it returns.** ⚠️ **When it does, note the failure mode is total and unrecoverable**, which is an argument for carrying the ranking deadline in the Attention bell even before the ranking UI exists.

---

### `SL-16` — per-school status

**⚠️ AMENDED by `SL-24b` — `primary submitted` moves to `CycleApplication`.**

**States on the school:** `secondary received` · `secondary submitted` · `interview` · `decision`.

### ⚠️ No `rejected`. No `no response`. No `waiting`. No status enum implying a non-event.

**`U-7` — Premed OS does not track non-events.** With a professor who never replies you delete the row; **with a school you cannot — you paid, you applied, and the cycle simply ends quietly.**

**So the mechanism differs from Letters:** show **elapsed time since a submission as a fact**. *"Primary submitted 94 days ago"* is true, useful, and disputable with evidence. ***"Ghosted"* is a verdict on a non-event.** Same data, different claim (`U-13`).

### Deadlines surface in the Attention bell, and nowhere else

**School List owns the AMCAS / AACOMAS / TMDSAS and secondary dates attached to its schools** (shell §2.2; `11-timeline-tasks.md` confirms the routing). **They surface in the Attention bell** (shell §7.5) with severity, competing in the standard attention auction (`U-3`).

**⚠️ No second deadline list, here or anywhere.** Timeline does not hold them; this tab does not build a calendar.

## 7b. `SL-26` and `SL-27` — reading Academics and Letters (RULED Aug 2026)

**Both are filtered reads of records another tab owns. Neither stores a second copy.**

### `SL-26` — prerequisite coverage ✅ BUILD, as record presence only

**The student types a school's prereqs (`SL-17` phase 1) and maps their own courses to them.** Premed OS reports which requirements have a course mapped and which do not.

| ✅ Allowed — a fact about the record | ❌ Forbidden — a claim about the school |
|---|---|
| *"Statistics — nothing mapped."* | *"BIOC 430 satisfies Duke's biochemistry requirement."* |
| *"BIOC 430 → biochemistry"* (**the student's own mapping**) | *"You meet Duke's prerequisites."* |
| *"CHEM 262 is in progress"* — a scheduling fact | Treating planned or in-progress work as completed coursework |

> **⚠️ THE REASON, and it is sourced rather than cautious: there is no AMCAS / AACOMAS / TMDSAS prerequisite-equivalency standard.** All three services classify coursework for **their own GPA arithmetic**, and all three tell applicants to check each school directly. **A service category cannot certify a school's requirement**, and school policies on lab hours, AP and IB credit, community-college work, online courses, and recency all differ. `implementation/research-prompts/school-list-sl-26-prerequisite-coverage.md`.

**The cost of the narrow version is almost nothing.** *"Nothing mapped to statistics"* is the useful output, and the student can dispute it by looking. *"Satisfies"* is a claim nobody can back, and if the school disagrees the student finds out after applying — unrecoverable.

**`U-10` applies to the mapping:** Premed OS may **propose** a course→requirement match and waits. It never files one silently.

**Do not:**
- **Do not read `data/med-schools.json` for prerequisites.** Every `prereqs` array is empty by design (`§1`), and `prereqNotes` is a disclaimer, not content.
- **Do not promote `data/unc-requirements.json` into an acceptance claim.** It is medium-confidence, typical-UNC, and says so. It can support a **UNC planning** comparison; it is not per-program acceptance data.
- **Do not infer a school's policy from an Academics tag or a service subject category.**

**⚠️ Depends on the course→requirement catalog**, which `briefs/README.md` lists as not yet written.

### `SL-27` — letters routing ✅ BUILD, service-aware

**The three services genuinely differ, and one cross-service routing field would be false for two of them.**

| Service | What the student can actually do | What Premed OS shows |
|---|---|---|
| **AMCAS** | **Real per-school assignment.** Up to 10 letter entries, each designated to chosen schools — the cap exists *for* targeting | **Per-school letter assignment**, reading Letters' `Person` records |
| **TMDSAS** | **Nothing. Assignment is impossible** — every letter submitted through TMDSAS is available to **every** school selected | **No assignment UI.** One stated fact: *"all TMDSAS letters go to every TMDSAS school on your list"* |
| **AACOMAS** | **No documented per-program assignment exists.** Routes vary and some schools accept letters directly | **Requirements only.** No assignment claim |

**Per school, the student may record what that school says it requires:** quantity, writer roles or relationships, packet policy, direct-vs-service route, deadline. **All student-entered.** `LT-6` ceded per-school letter requirements to MSAR — **that cede was about SHIPPING them.** A student typing them for their own list is `§1`'s ruling exactly, so this is consistent rather than a reversal.

**⚠️ Never infer "complete" from letter receipt.** TMDSAS demonstrates why: **the same pending optional letter may block completeness at one school and not another**, and each school decides whether to accept a late letter. **Receipt is a fact; completeness is the school's judgement and Premed OS does not hold it.**

**Reads Letters' `Person` records. Stores no second copy. Grep for one.**

---

## 7c. ⭐ Wave 4 close — `SL-28`, `SL-29`, `SL-31` (RULED Aug 2026, Batch 3)

### `SL-28` — days since the secondary arrived ✅ BUILD, as elapsed time with no target

**The row shows the measured fact and nothing else:** *"Secondary received 9 days ago."*

**⚠️ Premed OS states no turnaround target, ever.** The research pass found **no AAMC, AACOM, or TMDSAS window, no school-published expectation, and no outcome study.** The widely-repeated "two weeks" traces only to consulting blogs. `implementation/research-prompts/school-list-sl-28-secondary-turnaround.md`.

| ✅ Allowed | ❌ Forbidden |
|---|---|
| *"Secondary received 9 days ago"* — elapsed time as a dated fact | Any generic target, recommended window, or "typical" figure |
| **A countdown to a deadline THE STUDENT ENTERED** — a fact about their own record | A lateness verdict, a colour ramp standing in for one, or a probability claim |

**A student who has entered no deadline sees no countdown.** A false-precision countdown against a number Premed OS guessed is worse than the plain elapsed count.

**⚠️ This is `SL-16`'s ruling applied unchanged:** *"submitted 94 days ago"* is a fact; *"ghosted"* is a verdict (`U-7`, `U-13`).

### `SL-29` — the cycle as an object ⏸ CUT FROM v1, with one carry-over obligation

**Roughly a third of applicants apply twice, and `SL-6` archives a school but cannot archive a CYCLE.** A reapplicant keeps their list and starts the statuses over.

**Cut, because a first-year does not have a second cycle** and the beta population is first- and second-years. **This is the second cycle's problem.**

> **⚠️ THE OBLIGATION, and it is the whole ruling: the data model must not BLOCK this later.** Cycle-scoped facts — per-school status, `CycleApplication`, secondary state — **carry a cycle stamp from day one**, even though nothing reads it in v1. **`LT-13` already put status on the request rather than the person for exactly this reason.** A stamp costs nothing now; retrofitting one costs a migration mid-cycle.

### `SL-31` — export the list ✅ BUILD, reusing `P-13`

**Two real uses:** the advisor conversation, and typing the list into the application service's school-selection screen by hand.

**Builds nothing new. Reuses `P-13`'s exporter.** If `P-13` gains a format, this gains it too. **Do not write a second exporter; grep for one.**

**Exports what the student has** — their own entries, tags, notes, and status. **It does not export shipped roster data as though it were their research.**

---

## 7d. ⭐ Wave 3 close — `SL-17`, `SL-19`, `SL-20` (RULED Aug 2026, Batch 7)

### `SL-17` — secondary prompts and deadlines ✅ BUILD, deadline only

**⚠️ Essays owns the writing. This tab holds the deadline.**

- **The prompt text lives on the `Essay` record**, owned by Essays & Story Bank (`§8`). This tab is the school door onto it — **a filter, never a copy.**
- **What this tab owns is the school's secondary deadline**, student-entered, cycle-stamped.
- **The deadline surfaces in the Attention bell and nowhere else** (`§7`). **No second deadline list. Grep proves it.**
- **`SL-28`'s countdown runs against this** and only this (`§7c`) — a deadline the student entered, never a generic target.

### `SL-19` — cost tracking ✅ BUILD, as a sum of student-entered costs

**Application costs accumulate invisibly and surprise people.** Primary service fee, per-school secondary fees, and score-report costs are separate charges arriving over months.

| ✅ Allowed | ❌ Forbidden |
|---|---|
| A running total of costs **the student entered** | A shipped fee schedule — `§1`, cycle data that rots |
| Per-service and per-school breakdown | Any suggestion about how many schools to apply to |
| A link to `P-42` **Fee Assistance** | Calling a list expensive, or comparing spend to anyone |

**⚠️ `SL-24` amends this row.** The board wrote *"AMCAS per-school fees"* as though there were one application. **There are three services with different fee structures, so cost groups by `CycleApplication`** (`§7a`) — a student applying to Texas and elsewhere has two primaries and two fee streams.

**⭐ `P-42` Fee Assistance is the reason this row earns its place.** AAMC's programme waives or reduces real costs and **many eligible students never apply for it.** Surfacing the cost picture beside the waiver link is a fact that changes an outcome. **State that it exists; never assess whether the student qualifies.**

### `SL-20` — send-date discipline ✅ BUILD, as a dated fact

**Rolling admissions is real, which is why *"submitted in August"* is worth surfacing.**

- **The submission date renders as a plain dated fact**, attached to the `CycleApplication` (`§7a`), not to each school.
- **⚠️ It is a fact, never a verdict.** *"Primary submitted August 12"* is allowed. *"You submitted late"* is not — that is `U-13`, and `SL-16`'s ruling already governs the shape.
- **⚠️ No target send date, no "apply early" nudge, no colour ramp standing in for one.** The `SL-28` research pass established that **no primary source supports a recommended timing window**, and the same finding binds here: **schools say earlier is better; nobody has shown that a given date changes an outcome.**
- **The student sees when they submitted. They draw the conclusion.**

---

## 8. `SL-23` phase 1 — secondary prompts

**Two problems, and they are different. *How* is a UI problem. *Remembering to* is a trigger problem — and the trigger problem is the one that kills features.** `LT-23` was cut for exactly this: a record type with no natural trigger is one nobody fills.

**⭐ Both are already solved in the repo. Nothing new is built.**

| Piece | What it reuses |
|---|---|
| **Where the prompt lands** | **The `Essay` record** (`09` §7) — `school` · `promptText` · `limit` · `status` · `dueDate` · link out. **School List is the SCHOOL door; Essays is the WRITING door. A filter, never a copy** |
| **Paste the whole block** | **`01` §4.1-M's paste-a-list pattern** — one per line, Premed OS splits. A secondary is **three to eight prompts on one portal page**; making the student add them one at a time is what stops them at prompt two |
| **The reminder** | **The `secondary received` status flip → the Attention bell.** No new notification channel |
| **What comes next** | **`SB-5`** — paste a prompt, the theme is named, the material rail fills. **The paste is not filing; it is the doorway into writing** |

### The trigger, precisely

**The student flips a school to `secondary received`. That flip is the prompt to paste** — one line, in place, at the moment they are already in the portal with the text on screen.

**If they skip it, the school shows `secondary received · no prompts saved` as a FACT on the row**, and the bell carries the school's deadline regardless. **It never nags and it never blocks the status change.**

**Why that trigger and not a timer:** a timed reminder fires when Premed OS guesses, and Premed OS cannot know when a secondary arrived. **The student telling it the secondary arrived is the only reliable signal in the system**, and they are already telling it.

### Capture at paste time, because it is not recoverable later

- **The character limit.** `Essay.limit` has the field, the portal states it beside each prompt, and recovering it later means logging back in.
- **The cycle stamp** — `2026–2027`. Costs nothing now, and it is the only thing that makes a future shared corpus possible at all.

### The "show them how" line

**One sentence beside the paste box naming where the text is** — the school's own secondary portal, or the email that linked them there. **Not a tutorial, not a modal, not a first-run tour.**

> **⚠️ `U-8` is about the student's life, not about help text.** *"State a fact; never instruct"* forbids telling someone what to do with their application. **It does not forbid telling them where a button is.** Recorded because a later reader will otherwise flag this line as a violation.

### Do not

- **Do not ship a comprehensive per-school secondary library.** Already ruled in `09` — *examples only; stale prompts are worse than none.* Phase 1 routes around that ruling; it does not overturn it.
- **Do not show `SB-23`'s sample secondaries in this tab's empty state.** Examples displayed beside a named school read as *that school's prompts*. **This is the one place the library ruling could leak back in through the back door.**
- **Do not compile prompts from SDN, r/premed, or consulting blogs.** `community-lore.md` — link and summarise, never republish.
- **Do not fetch, guess, or pre-fill.** Nothing arrives in this field that the student did not paste.
- **Do not build a second prompt store. Grep for one; `Essay` is the only one.**

**Phase 2 (students share prompts, reusing `01` §4.1-M's shareable parse) is NOT v1.** It needs users, and the first cycle is empty by definition. **Do not ship an empty shared library and call it a feature.**

---

## 9. Main workflows

| Workflow | Behaviour |
|---|---|
| **Explore the roster** | Search by name; filter by state, MD/DO, application service. **No numeric filters — no numbers ship** |
| **Add a school** | From the roster (autocomplete on `School.name`) or as free text. Creates a `TrackedSchool` |
| **Say why** | `whyItIsOnMyList`, free text, available from day one. **Never required, never prompted more than once** (`U-1`) |
| **Tag a tier** | Student sets it. A suggestion may appear only under `§6`'s three constraints |
| **Enter the numbers** | Optional, per school, stamped `enteredOn`. **Never gates anything** |
| **Enter requirements and deadlines** | **Phase 1 only: the student types them, for schools on their list.** Current by construction, zero maintenance |
| **Advance the cycle** | Set status (`§7`). The `secondary received` flip offers the prompt paste (`§8`) |
| **Archive** | Never delete. Archived schools stay readable and are excluded from counts |

### ⚠️ Requirements and deadlines — phase 2 is gated, and the gate is not a mood

Carrying deadlines and requirements for **all** schools requires **all three** of:

1. **A maintainer who is not Andy alone.** This is the annual content job the whole ruling exists to avoid.
2. **A per-field source URL and check date, rendered to the student.**
3. **A staleness rule that fails safe** — an unverified deadline shows as *unverified*, **never as a date.**

> **A wrong secondary deadline is the single most harmful error this product could make**, because it is unrecoverable and the student will not discover it until the cycle is over.

**Until all three hold, phase 1 is the product.**

---

## 10. Inspector design

Standard object inspector per `01` §3 — **the five core sections are mandatory and this tab configures their fields, it does not drop any.**

| Section | Configured as |
|---|---|
| **Overview / Details** | Directory facts (read-only, Layer A) · `whyItIsOnMyList` · tier · entered numbers with `enteredOn` · tuition |
| **Relations** | Secondary essays (opens the `Essay` peek — the Essays door) · letter writers routed here (`SL-27`, ruled — **AMCAS only**; `§7b`) · linked tasks |
| **Files** | Attachments and links the student added |
| **Activity** | Recent changes to this record |
| **Actions** | Open in Explore · archive · export (`SL-31`, ruled — reuses `P-13`; `§7c`) |
| *Notes* (on demand) | Freeform |
| *Data quality* (on demand) | Missing-field warnings only, each stating its cause (`U-1`). **Never a completeness score** (`U-9`) |

**Open pattern is the shell centre-peek** (`01` §2), expand-to-page and split available. Mobile is the sheet (`01` §2.4).

---

## 11. Empty, loading, and error states

- **Explore, first visit:** the roster is present and immediately usable. There is no empty state for shipped reference data.
- **My list, empty:** one line explaining what belongs here and the single first action — *add a school.* **Never a blank void** (`01` §8). **Do not show sample secondaries, sample schools, or a "typical list" here.**
- **Numbers not entered:** the delta and tier-suggestion surfaces are **dormant with a stated reason**, not zeroed and not an empty chart (`U-5`).
- **Cycle layer, pre-gate:** **absent.** Not disabled, not greyed, not a locked-state teaser.
- **Roster load failure:** the tab still functions in Track mode against existing records; Explore shows a retry. **A roster failure must never block list editing** — everything the student owns is local.
- **Route-level:** shell-standard skeleton, never a blank flash (shell §11).

## 12. Mobile behavior

- Table views become card lists; filters collapse (shell §9, `general.md` → Responsive).
- Record open is a **full-height sheet**, not a peek.
- Adding a school and pasting prompts are **full-screen sheets with sticky actions** — prompt paste is a multi-line entry and must not sit in a cramped popover.
- The map is available on mobile but remains the third view and never the default.
- Every context-menu item is also reachable from the row's visible overflow control (`01` §4c) — right-click is unavailable on touch.

## 13. Privacy and data handling

- **All Layer B data is the student's, stored locally**, scoped to the authenticated user like every other record (`general.md` → Per-user ownership), and covered by the standard export and deletion controls.
- **No outbound request from this tab. Ever.** Not to MSAR, not to a school page, not to a geocoder, not to an application portal. **`§2`'s line is also the network boundary.**
- **The roster ships with the app.** Reading it is a local file read.
- **Where the school list joins an AI call**, the standard permission-first contract applies: propose → confirm → act, never a silent edit (`general.md`).

## 14. Accessibility

Per shell §10 and `general.md` → Accessibility. Tab-specific:

- **Tier is never conveyed by colour alone** — pair with a text label. This matters more here than anywhere, because a colour-only tier reads as a severity scale.
- **Map pins carry accessible names**, and the map is never the only path to any school — the table reaches all 240.
- **Deltas are announced with both operands**, not as a bare signed number.
- Contrast ≥ 4.5:1 for every status tint in both themes.

---

## Cross-tab relationships

| Tab | Direction |
|---|---|
| **Essays & Story Bank** | **Owns `Essay` and all secondary prompt text** — this tab is the school door. **⭐ Traffic runs BOTH ways: Essays reads `whyItIsOnMyList`, which School List owns** (`§4a` `SL-2`). **Never a second school database there; never a second prompt store here; never a copy of the note in either** |
| **Academics** | Supplies courses and GPA. **`SL-26` RULED (`§7b`) — coverage reports mapped/unmapped ONLY. Never a claim that a course satisfies a requirement** |
| **MCAT** | Supplies the student's own score for `§6`'s delta |
| **Profile / CV** | Supplies residency (`P-33`) for the in-state count; `P-42` Fee Assistance links from tuition |
| **Letters** | Supplies writer `Person` records. **`LT-6` ceded per-school *letter requirements* to MSAR; `SL-27` RULED (`§7b`) — per-school assignment renders for AMCAS only** |
| **Timeline** | Takes application-cycle milestones as **roadmap-node context**. **Timeline holds no deadlines and no copy of them** |
| **Overview / Attention bell** | The only cross-cutting deadline surface (shell §7.5) |
| **Help** | Collects the `U-12` pointers, including MSAR, under the `U-8` guard |

## Admissions-aware reasoning

- **The tab is admissions-aware and admissions-silent.** It knows what a cycle looks like; it says nothing about how yours will go.
- **Geography is a real variable** — in-state preference and interview travel — which is why `SL-22` exists and why the in-state count is a legitimate fact.
- **Rolling admissions is real**, which is why *"submitted in August"* is a fact worth surfacing (`SL-20`, ruled — `§7d`).
- **The student's own reasons are the durable asset.** `whyItIsOnMyList` written at nineteen is the material for *"why this school"* at twenty-two. That is the argument for the tab existing before the cycle does.

## Do Not Generalize From Other Tabs

- **Tier balance is School-List-only.** No other tab gets a reach/target/safety vocabulary.
- **Do not invent an admissions-odds score, chance figure, or readiness score** — here or by importing this tab's arithmetic elsewhere.
- **Do not treat Explore/Track as `one record, two doors`** (`§3`).
- **Do not apply `LT-29`'s absent-tab gate to this tab** (`SL-21`).
- **Do not build a school comparison table** — ceded to MSAR (`§1`). **"Add to compare" was struck from `01` §4c, Aug 2026 (`§6`).** Sort, group, and filter the existing list instead; **a separate compare destination is the MSAR-shaped thing `§1` cedes.**
- **Do not populate the `null` admissions fields in `data/med-schools.json`.** They are the ruling, not a gap.

---

## Acceptance criteria

**Ruled scope only.** Unruled rows are deliberately absent from this list.

**The boundary**

- [ ] **Grep proves no shipped admissions-profile numbers.** `medianGPA`, `medianMCAT`, `acceptanceRate`, `inStateFriendly` are `null` on all 240 roster entries and nothing reads them as data.
- [ ] **Grep proves no outbound request originates in this tab** — no fetch to MSAR, a school page, a portal, or a geocoder.
- [ ] **No acceptance rate exists anywhere in the tab**, in any layer, entered or shipped.
- [ ] **No score, percentage, odds, probability, or progress bar summarising an application or a school** appears anywhere in the tab.
- [ ] Every derived figure renders **with its inputs visible**.
- [ ] Entering zero numbers leaves the list fully usable — school creation, status, and secondaries all work.

**Modes and roster**

- [ ] Explore lists all 240 roster entries, searchable by name and filterable by state, MD/DO, and application service.
- [ ] **No numeric filter or sort exists in Explore.**
- [ ] A school absent from the roster can be added as free text.
- [ ] Adding from Explore creates a `TrackedSchool`; the roster entry is never mutated.

**Tiers**

- [ ] A student-set `tier` is never recomputed or overridden by the app.
- [ ] A tier suggestion appears only when that school's numbers were entered, shows its arithmetic, and expresses no probability.
- [ ] List balance renders as a **count of the student's own tags**.

**The cycle layer**

- [ ] Before the gate, **no status, secondary, deadline, or cost element renders at all** — verified by DOM absence, not by disabled state.
- [ ] The tab and the interest list remain fully usable before the gate.
- [ ] **No `rejected`, `no response`, `waiting`, or equivalent status exists.**
- [ ] Every tracked school shows its application service; the value matches the roster and is never inferred from MD/DO or state.
- [ ] **`primary submitted` does not exist as a per-school status.** It lives on a `CycleApplication`, one per service per cycle.
- [ ] A student with both a Texas and a non-Texas school has **two** `CycleApplication` records, independently dated.
- [ ] No service's own state vocabulary (`Ready for Review`, `Verified`, …) is rendered verbatim in the UI.

**Reading Academics and Letters (`SL-26`, `SL-27`)**

- [ ] Prerequisite coverage reports mapped/unmapped **only**. **Grep proves no string asserting a school accepts, satisfies, or fulfils anything.**
- [ ] A course→requirement mapping is made or confirmed by the student, never filed silently.
- [ ] Planned and in-progress courses are visibly distinct from completed coursework.
- [ ] **Nothing reads `prereqs` or `prereqNotes` from `data/med-schools.json`.**
- [ ] Per-school letter assignment renders **only** for AMCAS schools.
- [ ] A TMDSAS school shows the all-schools fact and **no assignment control**.
- [ ] **No letter or requirement state is labelled complete by inference from receipt.**
- [ ] **Grep proves one `Person` store.** Letters owns it; this tab reads it.
- [ ] Elapsed time since a submission renders as a dated fact with no verdict language.
- [ ] Application-cycle deadlines surface **only** in the Attention bell; **grep proves no second deadline list in this tab**.

**Batch 3 — the gate, the compare strike, the roster grain, and Wave 4's close**

- [ ] **The cycle layer never activates on its own.** Only an explicit student action turns application mode on.
- [ ] The autumn proposal is derived from the expected **year** alone. **Grep proves no stored, computed, or displayed service date anywhere in this tab.**
- [ ] The application-mode switch is reachable **before** Premed OS proposes it — a student ahead of the calendar is never gated out.
- [ ] **"Add to compare" appears nowhere** — verified by grep, in this tab and in `01` §4c.
- [ ] **No compare surface, table, or side-by-side view exists.** Sort / group / filter act on the existing list only.
- [ ] A sparse Layer B field renders dormant with a reason, **never as an empty cell in a grid**.
- [ ] **The roster is 240.** Both regional-campus entries are present.
- [ ] A campus that is not yet operating is **visible and unselectable with the reason stated** — not hidden, not selectable.
- [ ] **No entry receives a city inferred from its parent institution.**
- [ ] `SL-28` renders elapsed time only. **Grep proves no generic turnaround target, recommended window, or "typical" figure.**
- [ ] A countdown renders **only** against a deadline the student entered.
- [ ] **Every cycle-scoped record carries a cycle stamp**, including in v1 where nothing reads it (`SL-29`).
- [ ] Export reuses `P-13`. **Grep proves one exporter.**
- [ ] Export contains the student's own entries and never re-exports shipped roster data as their research.

**Batch 4 — Wave 0, the list itself**

- [ ] A free-text school renders Layer A fields **dormant**, never blank-as-fact and never inferred. **Grep proves no name-based inference of type, state, or service.**
- [ ] A duplicate entry **warns and still saves**.
- [ ] **Nothing fetches to validate a typed school name.**
- [ ] `whyItIsOnMyList` is **never generated, suggested, or autocompleted** — verified by grep against the AI surfaces.
- [ ] A school saves with `whyItIsOnMyList` empty, and is never prompted for it more than once.
- [ ] **Essays reads `whyItIsOnMyList` from the same record School List owns.** Editing in either surface shows in the other. **Grep proves one store.**
- [ ] Default tier is `undecided`; **a list of untagged schools is valid and renders no warning.**
- [ ] **With residency unset, the in-state flag and `SL-14`'s count do not render** — replaced by one line stating the reason and linking to Profile.
- [ ] **Blank residency is never treated as out-of-state.**
- [ ] Changing residency in Profile recomputes every flag and count with **no stored value migrated**.
- [ ] The unset-residency state **never nags** — no prompt, no badge, no attention-budget spend.
- [ ] Archiving removes a school from the active list and every count; **the record and its note survive**. **Grep proves no destructive delete path.**

**Batch 5 — Wave 1, the numbers**

- [ ] All four `SL-7` fields exist and are optional; **a list with none of them renders complete and warns about nothing.**
- [ ] Prefill reads **only** from the cycle-stamped snapshot `§1a` permits. **Grep proves nothing fetches, and nothing reads a licensed dataset.**
- [ ] A prefilled value is **proposed, never silently applied** — the student confirms it.
- [ ] **Every prefilled number carries `stat`, `population`, and its cycle.** **Grep proves no bare figure ships without them.**
- [ ] **A mean never renders in a field labelled median.** Where `stat` is absent, the value renders unlabelled or not at all.
- [ ] **A screening threshold is a separate field from a class figure** and the two never merge.
- [ ] **Nothing prefills in-state percentage**, and no feature depends on it — anything reading it goes dormant with a reason.
- [ ] A student-entered value carries `enteredOn`; a prefilled one carries the snapshot's cycle. **The two stamps never appear on the same value.**
- [ ] Editing a prefilled value sets `enteredOn` and **drops the snapshot stamp**.
- [ ] **No staleness warning exists at any age.** Grep proves no "out of date," "outdated," or equivalent string near an entered number.
- [ ] `SL-10`'s MSAR line renders **once, dismissible** — not per school, per field, or per session — and is never phrased as a warning about the student's data.

**Batch 6 — Wave 2, the arithmetic**

- [ ] `SL-11` renders **only on rows where both operands exist**. **No placeholder, no dash, no prompt to add numbers.**
- [ ] **Both operands are always visible beside the delta.** A bare signed number never renders alone.
- [ ] **No aggregate delta anywhere** — no list average, no summary figure. **Grep proves it** (`U-9`).
- [ ] **No delta renders where the source `stat` is unknown**, or where the figure is a screening threshold rather than a central tendency.
- [ ] `SL-12` fires **once per school, on entry**, never re-fires, and **never becomes the tag without an explicit accept**. Default stays `undecided`.
- [ ] `SL-13` counts tags only, **renders with zero numbers entered**, and shows `undecided` rather than hiding it.
- [ ] **`SL-13` states no opinion about balance** — no recommended ratio, no shortfall colour. **The most tempting `U-9` violation in the tab.**
- [ ] `SL-14` is **dormant while residency is unset** and never renders `0 in-state`.
- [ ] **No readiness score, progress bar, or composite exists** (`SL-15`, cut).

**Batch 7 — Wave 3 close**

- [ ] `SL-17` holds the **deadline only**; prompt text lives on the `Essay` record. **Grep proves one prompt store.**
- [ ] Secondary deadlines surface **only in the Attention bell**. **Grep proves no second deadline list.**
- [ ] `SL-19` totals **student-entered costs only**. **Grep proves no shipped fee schedule.**
- [ ] Costs group by `CycleApplication`, so a two-service applicant sees two fee streams.
- [ ] **`P-42` Fee Assistance is linked as a fact**; Premed OS never assesses eligibility.
- [ ] **No suggestion about how many schools to apply to exists anywhere.**
- [ ] `SL-20` renders the submission date as a **dated fact on the `CycleApplication`**, not per school.
- [ ] **No target send date, "apply early" nudge, or lateness signal exists** — no primary source supports one (`SL-28` research).

**Secondary prompts (`SL-23` phase 1)**

- [ ] Flipping a school to `secondary received` offers the prompt paste in place, and **never blocks the status change**.
- [ ] Pasting a multi-line block creates one `Essay` per prompt.
- [ ] Each prompt captures its character limit and cycle stamp at paste time.
- [ ] **Grep proves one prompt store.** No second copy in School List.
- [ ] Prompts opened here and in Essays are the same records — editing one shows in the other.
- [ ] **No sample or example secondary prompt appears anywhere in this tab.**
- [ ] Nothing populates a prompt field that the student did not paste.

**Map (`SL-22`)**

- [ ] The map is a third view and is never the default.
- [ ] Exactly two pin states: on your list, not added.
- [ ] No tier colouring, median heat, or size-by-anything.
- [ ] **Coordinates are read from the shipped file. Grep proves no runtime geocoding call.**
- [ ] Every school reachable on the map is also reachable in the table.

**Shared patterns**

- [ ] Inspector carries all five core sections (`01` §3).
- [ ] Every context-menu item has a visible equivalent (`01` §4c).
- [ ] Empty, loading, error, light/dark, mobile, keyboard, and reduced-motion states all pass `04` §11.

---

## Known code drift — the shipped app contradicts ruled behaviour

**Found Aug 2026 by reading `src/` against this spec. Recorded here, not fixed here.**

> **⚠️ `BUILD-MANIFEST.md` clears only Overview and Academics. School List is not `YES`, so none of the below may be built without Andy changing that row.** It is listed so the drift is known, not so it gets built quietly.

| Drift | Where | Rule it breaks |
|---|---|---|
| **`rejected` ships as a selectable status** | `src/pages/Schools.tsx` status options | **`U-7`, and `§7`'s "No `rejected`. No `no response`. No `waiting`."** This is a locked universal rule and the violation is in the product today |
| **`Remove` instead of archive** | `Schools.tsx` row action | **`SL-6`** (`§4a`). Corrected in `01` §4c Aug 2026; the code still does it |
| **`applied` as a per-school status** | `Schools.tsx` status options | **`SL-24b`** (`§7a`) — the primary is service-level. The current model records one AMCAS submission twelve times |
| **No `applicationService` anywhere** | `SchoolEntry` in `src/lib/types.ts` | **`SL-24`** (`§7a`) — first-class, and the roster already carries it on all 240 |
| **The app never reads `data/med-schools.json`** | No import in `src/` | **`SL-1`** (`§4a`) — the roster autocomplete has no data behind it |

**The cheap half is deletion, not construction:** removing `rejected`, renaming `Remove` → `Archive`. **The structural half — `CycleApplication`, `applicationService`, reading the roster — is a real build and should wait for Waves 1–3 to close.**

---

## Open decisions

**Nothing below is ruled. Do not implement any of it, and do not let it into acceptance criteria.**

### ✅ A · Waves 0–4 — ROW-BY-ROW PASS COMPLETE (Aug 2026)

**Every row on the board is now ruled, deferred, or cut.**

| Wave | Rows | Batch | Landed |
|---|---|---|---|
| **0** — the list | `SL-1`–`SL-6` | 4 | `§4a` |
| **1** — the numbers | `SL-7`, `SL-8`, `SL-10` (`SL-9` earlier) | 5 | `§5a`, `§6` |
| **2** — the arithmetic | `SL-11`–`SL-14` · `SL-15` **CUT** | 6 | `§6a` |
| **3** — the cycle | `SL-16`, `SL-21`, `SL-22`, `SL-23` earlier · `SL-17`, `SL-19`, `SL-20` | 7 | `§7`, `§7d`, `§5`, `§8` |
| **4** | `SL-24`–`SL-31` | 1–3 | `§7a`, `§7b`, `§7c` |
| **Deferred, visible** | `SL-18`, `SL-25`, `SL-30`, `SL-24c` | — | `§6b` |

> **⚠️ Ruled is not built. Three things still block, and none of them is a ruling:**
>
> | Blocker | What it holds up | Who moves it |
> |---|---|---|
> | **The geocode pass has not run** — no `lat`/`lng` field exists | **`SL-22` cannot render a single pin.** Ruled, locked, and inert | One paste — `PASTE-geocode-238-cities.md` |
> | **The course→requirement catalog is not written** | `SL-26` prerequisite coverage | A research pass |
> | **`BUILD-MANIFEST.md` does not clear School List** | **Everything.** Nothing here is buildable | **Andy — one row** |
>
> **`§1` is no longer a blocker.** It was amended Aug 2026 (`§1a`) and `SL-7`'s prefill is permitted.

### B · ⭐ Wave 4 — CLOSED (Aug 2026)

**All eight rows are ruled or deferred. Nothing in Wave 4 is open.**

| Batch | Rows | Where it landed |
|---|---|---|
| **1** | `SL-24` · `SL-24b` · `SL-24c` ⏸ | `§7a` |
| **2** | `SL-26` · `SL-27` | `§7b` |
| **3** | `SL-28` · `SL-29` CUT · `SL-31` | `§7c` |
| **Deferred** | `SL-25` ⏸ · `SL-30` ⏸ | `§6b`, with `SL-18` |

**⚠️ Packets remain evidence, not rulings.** Their "implications" sections are explicitly non-binding. **A future reader must not promote one into a product decision without an explicit ruling** — that rule survives Wave 4's close.

### ⭐ C, D, E — CLOSED (Aug 2026, Batch 3)

| Was | Ruling | Where it landed |
|---|---|---|
| **C** · the two regional-campus entries | **Both stay; roster remains 240.** An availability field gates the not-yet-operating campus | `§3` |
| **D** · "Add to compare" precedence conflict | **Struck from `01` §4c.** The list itself is the comparison — sort, group, filter | `§6` |
| **E** · the `SL-21` phase-gate trigger | **Student-thrown switch; autumn proposal derived from the year alone; no stored service dates** | `§7` |

**Two things worth carrying forward from how these closed:**

- **`U-9` does not forbid arranging schools.** Its clauses concern the student, not the list. **The conservative reading that produced open decision D conflated the two** — the binding constraint was always `§1`'s ban on shipped numbers. Recorded so it is not re-derived a third time.
- **The Delaware campus is not yet operating**, which no earlier draft knew. **C was not a filing question; one of the two rows could not be selected at all.**

### F · Data follow-ups — partially applied Aug 2026

**⚠️ `data/med-schools.json` HAS now been modified.** Two items below were applied on 2026-08-13; the rest stand.

| Item | State |
|---|---|
| **✅ `prereqNotes`** | **APPLIED.** The disclaimer moved to `meta.prereqDisclaimer` (stated once, not 240 times) and every entry's `prereqNotes` is now `null`. **It previously reported 240/240 in any fill-rate check while holding no per-school information** — the emptiest field in the file was the only one reading as full |
| **✅ `meta.fieldCoverage`** | **ADDED.** Real per-field counts, so a later audit reads the true number rather than inferring one. At the time of writing: `medianMCAT 0` · `medianGPA 0` · `acceptanceRate 0` · `prereqs 0` · `deadlines 0` · `admissionsTests 0` · `mission 12` · `inStateFriendly 3` · **`control 211`** · `city 238` |
| **⚠️ `control` — NEW, found Aug 2026** | **Null on 29 of 240** — 27 DO and 2 MD, mostly newer colleges and branch campuses. **A "public schools only" filter silently returns 211**, and nothing tells the student the other 29 were dropped rather than excluded. Directory-level and cheap; prompt written |
| **`admissionsTests: { PREview, CASPer }`** | **Null on all 240.** `SL-25` is deferred, and **deferring the feature is a reason to remove the keys, not to leave them.** ⚠️ **The `SL-25` packet sharpens this: AAMC defines FOUR PREview requirement levels, so a boolean was never the right shape** — and *"a current `null` has no applicant meaning; it must not render as 'not required'."* **Null on 240 is still the one option that is definitely wrong.** Needs a ruling before the schema ships |
| **⚠️ Board / dataset drift** | The board's DATA DEFECT #2 says the TMDSAS corrections were *"recorded, not applied."* **They have since been applied** — `meta.corrections` dated 2026-08-10, and the file now holds 14 TMDSAS entries. **The board text is stale.** Left as-is per the do-not-edit-the-board instruction; noted here so the next reader does not re-apply a fix |
| **⚠️ Stale board figures** | Board `SL-24` cites "populated on all 211 — 152 AMCAS · 48 AACOMAS · 11 TMDSAS." **Actual: 240 entries — 153 AMCAS · 73 AACOMAS · 14 TMDSAS.** The board predates the 211 → 240 expansion in its own §5a-i |

---

## Source / disposition ledger

| Board section | Disposition | Where it landed |
|---|---|---|
| §0 What binds | **Migrated** | `§1`, `§2`, Do Not Generalize |
| §1 Governing ruling + correction | **Migrated as binding** | `§1`, `§2`, `§6` |
| §1b Two modes + roster ships | **Migrated as binding** | `§3` |
| §1b DO roster defect | **Resolved** — roster is 240 at consistent grain | `§3` (noted as closed) |
| §1b `SL-22` map | **Migrated as binding** | `§5` |
| §1b `SL-23` phase 1 | **Migrated as binding** | `§8` |
| §1b `SL-23` phase 2 | **Deferred, visible** | `§8` |
| §1b Deadlines/requirements staging | **Migrated as binding** | `§9` |
| §2 Wave 0 (`SL-1`–`SL-6`) | ✅ **RULED Aug 2026 — Batch 4** | `§4a` |
| §3 Wave 1 (`SL-7`–`SL-10`) | ✅ **RULED Aug 2026 — Batch 5.** `SL-9` ruled earlier | `§5a`, `§6` |
| §4 Wave 2 (`SL-11`–`SL-14`) | ✅ **RULED Aug 2026 — Batch 6.** `SL-15` **CUT** | `§6a` |
| §5 Wave 3 (`SL-16`–`SL-20`, `SL-22`, `SL-23`) | ✅ **RULED — `SL-16`/`SL-21`/`SL-22`/`SL-23` earlier; `SL-17`/`SL-19`/`SL-20` Batch 7; `SL-18` deferred** | `§7`, `§7d` |
| §5a / §5a-i Roster audit + static pass | **Migrated as data facts** | `§3`, Open decisions F |
| §5a Regional-campus grain | ✅ **RULED Aug 2026 — Batch 3.** Both stay; availability-gated | `§3` |
| §5b Wave 4 · `SL-24` | ✅ **RULED Aug 2026 — Batch 1** | `§7a` |
| §5b Wave 4 · `SL-26`, `SL-27` | ✅ **RULED Aug 2026 — Batch 2** | `§7b` |
| §5b Wave 4 · `SL-28`, `SL-29`, `SL-31` | ✅ **RULED Aug 2026 — Batch 3.** `SL-29` **CUT from v1**, carry-over obligation recorded | `§7c` |
| §5b Data defect #2 (TMDSAS) | **Applied in dataset; board text stale** | Open decisions F |
| §6 `SL-9` split | **Migrated as binding** | `§6` |
| §6 `SL-16` `U-7` mechanism | **Migrated as binding** | `§7` |
| §6 `SL-21` phase gate | **Migrated as binding; trigger RULED Aug 2026 — Batch 3** | Primary users and stages, `§7`, `§11` |
| §6b Deferred (`SL-18`, `SL-25`, `SL-30`) | **Deferred, visible** | `§6b` · Open decisions F |
| §7 Still open | ✅ **RESOLVED — every row now ruled, deferred, or cut** | `§4a`, `§5a`, `§6a`, `§7d` |
| `01` §4c "Add to compare" | ✅ **STRUCK Aug 2026 — Batch 3.** Edit applied to `01` §4c | `§6` |
| Stub's `U-12` / MSAR ruling | **Migrated, with the `§1b` amendment stated** | `§1` |

**Deferred and still visible, not silently dropped:** `SL-18` (interview dates and logistics) · `SL-25` (PREview / CASPer) · `SL-30` (post-interview: update letter, waitlist, decision). **`SL-18` and `SL-30` are one surface split across two rows — design them together when they return.** The research behind all three is done and cited on the board; nothing needs re-deriving.
