# School List

**Status:** **SPECCED for the ruled scope (Aug 2026).** The governing boundary (`§1`), the two modes (`§1b`), `SL-9`, `SL-16`, `SL-21`, `SL-22`, and `SL-23` phase 1 are migrated here as binding behaviour. **Waves 0–3 have not had their row-by-row ruling pass and Wave 4 (`SL-24`–`SL-31`) is unruled** — see `## Open decisions`.
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

- **No shipped admissions-profile numbers of any kind** — no medians, no acceptance rates, no in-state percentages, no class sizes, no bundled admissions figures.
- **No acceptance rate at all, in any layer** (`SL-9`, ruled — see `§6`).
- **No fetching.** No runtime call to any admissions source, geocoder, portal, or school page. Ever.
- **No admissions-odds score, chance figure, or application-readiness score** — `U-9`, and a stated non-goal in `00-product-vision`.

### Why the ruling rests where it does

The licensing objection was **overstated** and is recorded as such on the board: facts are not copyrightable, and schools publish their own class profiles. **The reason that actually holds is maintenance** — 240 schools × ~15 admissions fields, re-verified annually, forever, by one student in the summers he is taking the MCAT and applying. **Anyone revisiting this must argue against maintenance, not against licensing.**

**⚠️ The honest cost, recorded with eyes open: a student cannot discover a school they had never heard of by its numbers.** MSAR does that. This is a trade, not a free win.

---

## 2. ⭐ The data-trust model — three layers, and the line between them is the spec

> **THE LINE, and it is the whole ruling in one sentence:**
> **Premed OS may compute on numbers the student gave it. It may not go and get them.**

| Layer | What it is | Source | Maintenance cost |
|---|---|---|---|
| **A · Directory facts** | Name, city, state, MD/DO, public/private, region, application service, accreditation status | **Shipped** — `data/med-schools.json`, primary-sourced (LCME, AACOM, TMDSAS) | **None.** These facts effectively never change |
| **B · Student-entered numbers** | Median MCAT · median GPA · in-state % · class size · tuition · requirements · deadlines · secondary prompts | **Typed by the student**, from the source they already pay for, this cycle | **None to Premed OS.** Current by construction |
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

`one record, two doors` *does* apply between this tab and Essays for secondary prompts (`§8`). Keeping the two patterns straight matters, because conflating them is how a second store gets built.

### The roster

- **240 entries: 165 MD + 75 DO.** Grain is **teaching-location / program level** on both sides — the entries a student actually selects on AMCAS / AACOMAS / TMDSAS.
- **Verified row-by-row against primary sources** (LCME accredited-programs table; AACOM College Directory), not by matching totals. **⚠️ Any future "verified against source" claim in this repo means row-by-row or it means nothing** — a coincidental matching count hid a 27-school gap once already.
- **Free text is always allowed.** A student may add a school absent from the roster by typing its name (`SL-1`). The roster is an autocomplete, never a whitelist.
- **Admissions-profile fields in the file are `null` by design.** They are not unfinished work. Do not populate them, and do not write code that treats a `null` median as an error state.

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
- **`Essay`** — **NOT OWNED HERE.** Owned by Essays & Story Bank (`09` §7): `school?` · `promptText` · `limit` · `limitUnit` · `status` · `dueDate?` · `draft`. This tab is a **second door** onto those records (`§8`).
- **Referenced, never copied:** applicant MCAT and GPA (Academics / MCAT / Profile), residency (`P-33`), letter writers (Letters `Person`).
- **Derived (Layer C):** per-school deltas, tier-tag counts, in-state count, days-since-submission. **All recomputed on read. Nothing derived is stored.**

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

**Data state:** 238 of 240 entries have a city. **The 2 without one are an open ruling** (`## Open decisions`).

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

### ⚠️ Explicitly rejected — do not reintroduce under another name

- **`SL-15` — an application-readiness score or progress bar. CUT, `U-9`.** A single number summarising a whole application is exactly the invented composite the rule exists to prevent, and it would be the most-screenshotted, most-anxiety-producing element in the product.
- **Acceptance rate (`SL-9`, ruled).** It is the number most likely to be read as *your* odds, it is the least actionable figure on the page, and a 2.1% next to your name is anxiety with no action attached.
- **A school's median against the applicant *pool's* median.** `U-9`, one step removed.

### ✅ `SL-9` — tuition BUILDS, as a student-entered planning input

**NYU being free changes a list.** Tuition plus `P-42` Fee Assistance is a cost picture nobody assembles anywhere else. It is Layer B: **typed by the student, never shipped, never fetched.**

---

## 7. The cycle layer (gated) — status, and the `U-7` problem

**Everything in this section renders only when the cycle is in range** (`SL-21`).

### `SL-16` — per-school status

**States:** `primary submitted` · `secondary received` · `secondary submitted` · `interview` · `decision`.

### ⚠️ No `rejected`. No `no response`. No `waiting`. No status enum implying a non-event.

**`U-7` — Premed OS does not track non-events.** With a professor who never replies you delete the row; **with a school you cannot — you paid, you applied, and the cycle simply ends quietly.**

**So the mechanism differs from Letters:** show **elapsed time since a submission as a fact**. *"Primary submitted 94 days ago"* is true, useful, and disputable with evidence. ***"Ghosted"* is a verdict on a non-event.** Same data, different claim (`U-13`).

### Deadlines surface in the Attention bell, and nowhere else

**School List owns the AMCAS / AACOMAS / TMDSAS and secondary dates attached to its schools** (shell §2.2; `11-timeline-tasks.md` confirms the routing). **They surface in the Attention bell** (shell §7.5) with severity, competing in the standard attention auction (`U-3`).

**⚠️ No second deadline list, here or anywhere.** Timeline does not hold them; this tab does not build a calendar.

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
| **Relations** | Secondary essays (opens the `Essay` peek — the Essays door) · letter writers routed here (**pending `SL-27`**) · linked tasks |
| **Files** | Attachments and links the student added |
| **Activity** | Recent changes to this record |
| **Actions** | Open in Explore · archive · export (**pending `SL-31`**) |
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
| **Essays & Story Bank** | **Owns `Essay` and all secondary prompt text.** This tab is the school door. **Never a second school database there; never a second prompt store here** |
| **Academics** | Supplies courses and GPA for any student-entered requirement comparison. **`SL-26` is UNRULED — no comparison ships yet** |
| **MCAT** | Supplies the student's own score for `§6`'s delta |
| **Profile / CV** | Supplies residency (`P-33`) for the in-state count; `P-42` Fee Assistance links from tuition |
| **Letters** | Supplies writer `Person` records. **`LT-6` ceded per-school *letter requirements* to MSAR; `SL-27` is UNRULED** |
| **Timeline** | Takes application-cycle milestones as **roadmap-node context**. **Timeline holds no deadlines and no copy of them** |
| **Overview / Attention bell** | The only cross-cutting deadline surface (shell §7.5) |
| **Help** | Collects the `U-12` pointers, including MSAR, under the `U-8` guard |

## Admissions-aware reasoning

- **The tab is admissions-aware and admissions-silent.** It knows what a cycle looks like; it says nothing about how yours will go.
- **Geography is a real variable** — in-state preference and interview travel — which is why `SL-22` exists and why the in-state count is a legitimate fact.
- **Rolling admissions is real**, which is why *"submitted in August"* is a fact worth surfacing (`SL-20`, pending its row ruling).
- **The student's own reasons are the durable asset.** `whyItIsOnMyList` written at nineteen is the material for *"why this school"* at twenty-two. That is the argument for the tab existing before the cycle does.

## Do Not Generalize From Other Tabs

- **Tier balance is School-List-only.** No other tab gets a reach/target/safety vocabulary.
- **Do not invent an admissions-odds score, chance figure, or readiness score** — here or by importing this tab's arithmetic elsewhere.
- **Do not treat Explore/Track as `one record, two doors`** (`§3`).
- **Do not apply `LT-29`'s absent-tab gate to this tab** (`SL-21`).
- **Do not build a school comparison table** — ceded to MSAR (`§1`). **⚠️ See `## Open decisions` — `01` §4c currently lists "Add to compare" and that conflict is unresolved.**
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
- [ ] Elapsed time since a submission renders as a dated fact with no verdict language.
- [ ] Application-cycle deadlines surface **only** in the Attention bell; **grep proves no second deadline list in this tab**.

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

## Open decisions

**Nothing below is ruled. Do not implement any of it, and do not let it into acceptance criteria.**

### A · Waves 0–3 — the row-by-row ruling pass

The governing decisions are closed, but rows **`SL-1`–`SL-8`, `SL-10`–`SL-14`, `SL-17`, `SL-19`, `SL-20`** were never ruled one at a time the way Letters and Profile/CV were. This spec captures the **envelope** those rows sit inside; it does not rule them. → `tabs/08-school-list-board.md` §2–§5.

### B · Wave 4 — `SL-24`–`SL-31`, unruled

| Row | Question | Research |
|---|---|---|
| **`SL-24`** | Application service as a first-class field. **The board calls this the strongest row and a live silent bug** — the tab currently talks about "AMCAS fees" and "submitted in August" as if there were one application. TMDSAS has different document timing and a post-interview **Match** with a ranking deadline that withdraws you from every school if missed. | ✅ `implementation/research-prompts/school-list-sl-24-application-services.md` |
| **`SL-26`** | Prerequisite coverage read from Academics. **The packet's finding is the constraint:** no AMCAS/AACOMAS/TMDSAS prerequisite-equivalency standard exists, and a service course category cannot certify a school's requirement. A record-presence fact may be truthful; an acceptance claim is not. | ✅ `.../school-list-sl-26-prerequisite-coverage.md` |
| **`SL-27`** | Letters routing per school. **AMCAS supports real per-school letter designation; TMDSAS explicitly does not** — every TMDSAS letter goes to every selected school. No official AACOMAS per-program assignment was found. A single cross-service field would misstate two of the three. | ✅ `.../school-list-sl-27-letters-routing.md` |
| **`SL-28`** | Days since the secondary arrived. Shape is permitted by `SL-16`; **needs a primary source before any turnaround number is stated, or it states none.** | ❌ |
| **`SL-29`** | The cycle as an object — re-applicant carry-over. **Probably cut from v1**; a first-year has no second cycle. | ❌ |
| **`SL-31`** | Export the list. Reuses `P-13`'s exporter; builds nothing new. **Weakest row in the wave.** | ❌ |

**⚠️ The three packets are evidence, not rulings.** Their "implications" sections are explicitly non-binding. **Do not promote one into a product decision without an explicit ruling.**

### C · The two regional-campus roster entries

**Sidney Kimmel — Delaware Regional Medical Campus** and **Tufts — Maine Track** are the only 2 of 240 entries with no city, because no directory lists one. **LCME does not accredit or list either separately.** Keep them (applicant-facing: a student can select those tracks, consistent with the DO side's teaching-location grain) or drop them (accreditation grain: LCME lists 163 programs)?

**⚠️ Do not resolve this by quietly deleting two rows. It changes any count the app displays**, and it gates `SL-22`'s completeness claim. Recorded in `data/med-schools.json` → `meta.knownDefects`.

### D · ⚠️ Precedence conflict — "Add to compare"

**`specifications/01-shared-interface-patterns.md` §4c lists "Add to compare" as a confirmed School List row context-menu item.** **The `U-12` ruling in `§1` forbids a school comparison table** — MSAR already compares up to ten schools side by side.

`specifications/` outranks `tabs/`, but `§1` derives from `general.md`'s `U-12`, which outranks both. **This spec takes the conservative reading and ships no compare feature.** Three possible resolutions, none taken:

1. Strike "Add to compare" from `01` §4c.
2. Allow comparison **of the student's own entered numbers across their own list only** — arguably inside `§2`'s line, since the app would compute on numbers the student gave it.
3. Rule it explicitly out of scope for v1 and leave `01` §4c stale with a note.

**Needs Andy's direction.**

### E · The phase-gate trigger (`SL-21`)

**What puts the cycle "in range" is not specified.** Onboarding collects an expected application cycle (`general.md` → New-user onboarding), which is the obvious input, but **the lead time is unruled** — does the cycle layer appear twelve months out, at the start of the application year, or on an explicit "I'm applying" switch? An explicit student-thrown switch is the option most consistent with `U-8`, but that is an argument, not a ruling.

### F · Data follow-ups — recorded, deliberately NOT fixed

**Documentation-only pass. `data/med-schools.json` was not modified.**

| Item | State |
|---|---|
| **`admissionsTests: { PREview, CASPer }`** | **Null on all 240.** `SL-25` is deferred, and **deferring the feature is a reason to remove the keys, not to leave them.** Populating conflicts with `§1`; participation changes annually. **Null on 240 is the one option that is definitely wrong.** Needs a ruling before the schema ships |
| **`prereqNotes`** | **Filled on every entry with one of two disclaimer strings** — a placeholder that reads as populated in any fill-rate check. Either populate per school or move the disclaimer to `meta` |
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
| §2 Wave 0 (`SL-1`–`SL-6`) | **Envelope migrated; rows OPEN** | `§4`, `§9` · Open decisions A |
| §3 Wave 1 (`SL-7`–`SL-10`) | **Envelope migrated; `SL-9` ruled; rows OPEN** | `§2`, `§6` · Open decisions A |
| §4 Wave 2 (`SL-11`–`SL-14`) | **Envelope migrated; rows OPEN.** `SL-15` **CUT** | `§6` · Open decisions A |
| §5 Wave 3 (`SL-16`–`SL-20`, `SL-22`, `SL-23`) | **`SL-16` ruled and migrated; `SL-18` deferred; rest OPEN** | `§7` · Open decisions A |
| §5a / §5a-i Roster audit + static pass | **Migrated as data facts** | `§3`, Open decisions C and F |
| §5b Wave 4 (`SL-24`–`SL-31`) | **OPEN — unruled** | Open decisions B |
| §5b Data defect #2 (TMDSAS) | **Applied in dataset; board text stale** | Open decisions F |
| §6 `SL-9` split | **Migrated as binding** | `§6` |
| §6 `SL-16` `U-7` mechanism | **Migrated as binding** | `§7` |
| §6 `SL-21` phase gate | **Migrated as binding** | Primary users and stages, `§7`, `§11` |
| §6b Deferred (`SL-18`, `SL-25`, `SL-30`) | **Deferred, visible** | Open decisions B and F |
| §7 Still open | **Carried forward** | Open decisions A and B |
| Stub's `U-12` / MSAR ruling | **Migrated, with the `§1b` amendment stated** | `§1` |

**Deferred and still visible, not silently dropped:** `SL-18` (interview dates and logistics) · `SL-25` (PREview / CASPer) · `SL-30` (post-interview: update letter, waitlist, decision). **`SL-18` and `SL-30` are one surface split across two rows — design them together when they return.** The research behind all three is done and cited on the board; nothing needs re-deriving.
