# Shadowing: feature catalog

**Companion to `tabs/05-shadowing.md` (the spec) and `tabs/05-shadowing-board.md` (the reasoning).** **Where they conflict, the spec wins.**

**Built Aug 2026.** Shadowing was the last pillar with **no catalog at all** — Clinical had 134 items, this had zero, and the 317-line spec was carrying everything.

## How to read the columns

**`Origin` — the column Andy asked for. This is the one to scan when checking whether the pillar inherited correctly.**

| | |
|---|---|
| **`core`** | **Inherited from Clinical or the shared frame.** Configured here, never reimplemented. Governed by `05-experience-pillar.md` §2b |
| **`own`** | **Shadowing-specific.** The reason this is a first-class pillar and not a config row on Clinical |
| **`core*`** | Inherited **but materially altered** by a Shadowing ruling — read the note |

**`St`** — `live` · `spec` · `board` · `open` · `cut`.
**`AI`** — `○` deterministic · `◑` better with AI · `◐` degrades gracefully · `●` requires an LLM.
**`Surface`** — `Physicians` · `Visits` · `Reflections` · `Profile` · `shell` · `none`.

> ⚠️ **`Discover` was added and REVERSED the same day (Andy): *"it should really just be in ECs."*** **`S-4`'s three sub-tabs stand.** `S-BIG-1` and `S-BIG-3` are homeless — see `05-experience-pillar.md` §2a-ii. **Lean: a page-level section on `Physicians`.** **The resource-not-tracker rule still applies wherever they land** — they record nothing about asking, so `S-36`'s cut holds.

> **The nine universal rules are NOT restated here.** They live in `specifications/05-experience-pillar.md` §2b and govern every row below. **`U-7` (no non-events) and `U-8` (decline to assert, never withhold) both did real work on this pillar** — see `R-S1`.

---

## Part 1 — What is actually built

**`ExperiencePillar.tsx` is 1,432 lines with 27 `category ===` branches; Shadowing is one of four routes through it.**

### A. Real and working

| | |
|---|---|
| The route, the entity list, and the center peek | Shadowing renders through the shared builder |
| **`ShadowingWorkspace`** | A real component (line 357), physician-scoped |
| **Physician as the entity** | `entityFallbackName` → `'New physician'`, label `'Physicians shadowed'`, `UserRound` icon, violet accent |
| Session logging through the shared `addLog` | The 5-second path exists |
| Empty state | *"Add a shadowing session and the physician directory will build itself"* — **already the right copy** |

### B. Placeholder — looks built, is not

| | |
|---|---|
| **`'Specialty read'`** (line 1334) | Renders a **static string**, not a specialty analysis: *"…is useful when you log one clinical decision or workflow insight per visit."* **It looks like intelligence and is a sentence** |
| **`'Add another visit or specialty contrast'`** (line 1383) | Fires on `rows.length < 2`. **A row count, not a breadth read** |
| **Supervisor/contact fallback** (line 1195) | `entry.supervisor \|\| entry.contact \|\| entry.org` — **the §4a collapse is not modelled**; the code still assumes Clinical's separate-slots shape and falls back through it |

### C. Specced, not built at all

**Everything in Waves 1–7 below not marked `live`.** Most importantly: **the specialty coverage table (the hero), `degree`, `practiceEnvironment`, `patientsObserved`, physician bios, the DO-letter gap, and the unpacking marker.**

---

## Wave 1 · The record

| # | Feature | Surface | Origin | AI | St | |
|---|---|---|---|---|---|---|
| S-1 | **Physician directory, self-building from visits** | Physicians (list) | **`own`** | ○ | `live` | Other pillars organise by organisation. **This one organises by person** |
| S-2 | **`ShadowingSession`** — date · hours · reflection | Visits | `core` | ○ | `live` | Clinical's `Shift`, renamed and reshaped |
| S-3 | **`Physician` as a shared `Person`** | Physicians (panel) | `core` | ○ | `spec` | `ContactCard`, **shared with Letters and Clinical — never forked** |
| S-4 | **`degree`** — `MD · DO · MBBS · PA · NP · other` | Physicians (panel) | **`own`** | ○ | `spec` | **PA and NP named, not bucketed** — a free `other` cannot be filtered or counted. **No nudge attached** |
| S-5 | **`specialty` lives on the physician, nowhere else** | Physicians (panel) | **`own`** | ○ | `spec` | **S-18: `ShadowingExperience.specialty` DELETED.** Two fields meant the coverage hero could answer *"how many specialties"* two ways and look right either way |
| S-6 | **`setting`** — inpatient · outpatient · OR · ED · clinic · telehealth | Visits | **`own`** | ○ | `spec` | *Where care happens* |
| S-7 | **`practiceEnvironment`** — private · hospital system · academic · community | Physicians (panel) | **`own`** | ○ | `spec` | **A distinct axis from `setting`.** *How the practice is organised.* **Cardiology in a physician-owned practice and inside a hospital system are the same specialty, different jobs** |
| S-8 | **`patientsObserved`** | Visits | **`own`** | ○ | `spec` | **Label it *Patients you observed*, never *Population served*** — that is Volunteering's field and means something the student **did** |
| S-9 | **`questionsToAsk`** on the physician | Physicians (panel) | **`own`** | ○ | `spec` | Two or three lines. **Stands on the person so unasked questions survive from one visit to the next** |
| S-10 | **Physician bio** — paste a link or the text | Physicians (panel) | **`own`** | ◐ | `spec` | **Physicians are the only entity in HQ that come with a published biography.** A hospital has no life story; a person does |
| S-11 | **Month grouping + subtotals on `Visits`** | Visits | `core` | ○ | `spec` | Clinical #63–71, whole |
| S-12 | **`InlineAddRow`, identical at every door** | all | `core` | ○ | `spec` | `Physicians`, `Visits`, and Overview log the same way |

## Wave 2 · The structural collapse — the pillar's defining feature

| # | Feature | Surface | Origin | AI | St | |
|---|---|---|---|---|---|---|
| S-13 | **Site = contact = verifier = recommender = one person** | Physicians (panel) | **`own`** | ○ | `spec` | **The reason this is not a config row on Clinical.** §4a |
| S-14 | ~~Separate organisation entity~~ | — | `core*` | — | `cut` | **Practice is a string on the physician**, never a shared org. **Clinical #54's org directory does not inherit here in any form** |
| S-15 | ~~Separate verifier field~~ | — | `core*` | — | `cut` | The verifier slot **points at the physician** |
| S-16 | ~~Batched verifier-capture workflow (§7c)~~ | — | `core*` | — | `cut` | It solves *"you logged 40 shifts and never recorded who can confirm it."* **Impossible here — you cannot log a visit without naming the physician** |
| S-17 | **Contact-completeness check survives** | Physicians (panel) | `core` | ○ | `spec` | A physician can be a name with no email; the AMCAS entry needs both. **What was cut is *"go find a verifier,"* not *"is this contact usable"*** |

## Wave 3 · Breadth — the metric, and the fight about it

| # | Feature | Surface | Origin | AI | St | |
|---|---|---|---|---|---|---|
| S-18 | **Specialty coverage table is the hero, ABOVE the directory** | Physicians (page) | **`own`** | ○ | `spec` | **A deliberate exception to every other pillar.** Stated as a choice so nobody "fixes" it: **seven physician cards cannot show breadth; a specialty × hours × settings table can** |
| S-19 | **Breadth nudge** | Physicians (page) | **`own`** | ○ | `spec` | *"All 32 hours are in one specialty."* **It simply stops firing once coverage is not thin. That is the whole mechanism** |
| S-20 | **Primary-care check** | Physicians (page) | **`own`** | ○ | `spec` | **Separately surfaced, never folded into breadth.** A record that is entirely surgical subspecialties reads as uninformed |
| S-21 | **DO-letter gap** | Physicians (page) | **`own`** | ○ | `spec` | **Fires only when the School List holds osteopathic schools, and names them.** Dormant otherwise — **never generic advice** |
| S-22 | ~~Sufficiency call~~ | — | **`own`** | — | `cut` | See `R-S1`. **The largest cut in this pillar's history** |
| S-23 | ~~Uncovered-specialty grid~~ | — | **`own`** | — | `cut` | **S-11 rejected.** A grid of empty cells **manufactures an obligation out of a layout choice** |

## Wave 4 · Reflection

| # | Feature | Surface | Origin | AI | St | |
|---|---|---|---|---|---|---|
| S-24 | **Unpacking marker** | Visits | `core` | ○ | `spec` | **Clinical #45a configured, not reimplemented.** §4b: *"the mechanism should still be the same as Clinical"* |
| S-25 | **The prompt: *"what did you understand today that you didn't yesterday?"*** | Reflections | **`own`** | ○ | `spec` | **Copy survives the merge; machinery does not fork.** Better than Clinical's generic prompt |
| S-26 | **Synthesis threads (#45b)** | Reflections | `core*` | ◐ | `spec` | **Matters more here than on any pillar.** *"What did you learn across six physicians and five specialties?"* — **the question the AMCAS entry actually needs answered** |
| S-27 | **Missing-reflection nudge** | Visits | `core` | ○ | `spec` | *"You logged 4 hours with Dr. Osei and nothing about it."* **Once, dismissible, never blocks the log** |
| S-28 | **Two filters — who · state** | Visits, Reflections | `core` | ○ | `spec` | **Never one combined control** |
| S-29 | **One record set, two doors** | Reflections | `core` | ○ | `spec` | Story Bank aggregates; this filters. **Never a copy** |
| S-30 | ~~Structured `proceduresObserved`~~ | — | `core*` | — | `cut` | **Stays inside the reflection text.** Structuring it invites the skills tracking Clinical's `R1` cut — **that argument already won once** |

## Wave 4b · The reflection mechanism — inherited from `05` §2b-ii

**`RM-1` to `RM-4` are shared behaviour, not retyped here.** The S12 audit found this surface at three features while Extracurriculars had six. **All four now inherit.**

| # | Inherits | Shadowing's own part |
|---|---|---|
| **`RM-1`** · the moments HQ asks | `05` §2b-ii | **A visit ends — the strongest trigger in the app**, because §2.6 already treats a visit with hours and no reflection as incomplete. **This pillar should have had `RM-1` before any other** |
| **`RM-2`** · reflection as conversation | `05` §2b-ii | **`S-25`'s prompt is the best in HQ** — *"what did you understand today that you didn't yesterday?"* **It benefits most from a second turn, because the honest answer to that question is usually one line that wants pulling on** |
| **`RM-3`** · search your own writing | `05` §2b-ii | Filters here are **who · state**; search is a third control, not a replacement |
| **`RM-4`** · synthesis threads | `05` §2b-ii | **Already specced as mattering most here** (`S-26`) and was thinner than ECs. **`S-26` is now this row** — do not build both |
| **`RM-5`** · the unpacked headline | `05` §2b-ii | *"9 threads · 4 visits not yet unpacked"* in the filter bar. **Vocabulary is `visits`** |

## Wave 5 · Relationships and the application

| # | Feature | Surface | Origin | AI | St | |
|---|---|---|---|---|---|---|
| S-31 | **Letter-candidate marker** | Physicians (list) | **`own`** | ○ | `spec` | Derived from visit count plus recency. **Derived, never asked — a student should not have to declare who likes them** |
| S-32 | **Letter-conversion prompt** | Physicians (page) | `core` | ○ | `spec` | *"18 hours across 6 months. That's a letter relationship."* **Deep-link prefill only** |
| S-33 | **Misfiled-as-clinical catch** | Visits | `core` | ○ | `spec` | **Flag-and-offer, never auto-move.** Preserves visits and reflections on the move |
| S-34 | **Pre-cycle prep panel (#48)** | Physicians (panel) | `core` | ○ | `spec` | Flags incomplete physician contact details |
| S-35 | **Most-meaningful candidacy** | Profile | `core` | ○ | `spec` | **Profile/CV owns the app-wide 15-entry cap.** This pillar deep-links out |
| S-36 | ~~Ask / application pipeline~~ | — | **`own`** | — | `cut` | **S-7 CUT.** Andy: *"it only needs to track positions that I already have."* No `identified`, no `asked`, no `declined`, no planned visits. **`U-7`** |
| S-37 | ~~Stale-ask nudge~~ | — | **`own`** | — | `cut` | **Dies with S-36** — it guarded a pipeline that no longer exists |

## Wave 6 · Inherited whole, listed so nobody rebuilds them

| # | Feature | Surface | Origin | AI | St | |
|---|---|---|---|---|---|---|
| S-38 | **Hours chart** (#34) | Visits | `core` | ○ | `spec` | **REVERSED Aug 2026.** Excluded on the grounds it *"encourages the accumulation this pillar exists to discourage"* — **the pillar no longer exists to discourage anything** |
| S-39 | **Target + pace projection** | Physicians (panel) | `core` | ○ | `spec` | **Student-set, never pre-filled.** `U-8` |
| S-40 | **The three reads — hours, recency, continuity** | all | `core` | ○ | `spec` | `05` §2a, locked across five pillars |
| S-41 | **Stat strip** — `184 hrs · 5 specialties · 7 physicians · last visit 12 d` | shell | `core` | ○ | `spec` | One slim line. **No ring, no stat-square grid** |
| S-42 | ~~Certifications, skills counts, streaks~~ | — | `core*` | — | `cut` | **Clinical's, and meaningless for an observer.** Streaks are banned app-wide |

## Wave 6b · The big swings — this pillar never had one (Aug 2026)

**Waves 1–6 are the record and its intelligence. None of them changes what a student can DO** — they improve what happens after someone already has a physician to shadow.

**And the hardest part of shadowing is getting the first one.** §3 already says the early-stage student *"needs the page to make asking easy,"* and **`S-36` cut the ask pipeline** — correctly, since tracking rejections is a non-event. **But cutting the tracker did not solve the problem; it removed the only thing pointed at it.**

| # | Feature | Surface | Origin | AI | St | |
|---|---|---|---|---|---|---|
| **S-BIG-1** | **Programs, not people** | Physicians (page)? | **`own`** | ○ | `open` | **Migrated from `07-campus-layer-board.md` §5, where it had been sitting unassigned** |
| **S-BIG-2** | **What to actually do on the day** | Physicians (panel) | **`own`** | ○ | `open` | **The unwritten etiquette nobody tells a first-year** |
| **S-BIG-3** | **The cold email, as a resource** | Physicians (page)? | **`own`** | ◐ | `open` | Greenlit for Research as `RS-BIG-3`. **The same need exists here** |

### `S-BIG-1` — programs, not people

**UNC Health and area practices run structured shadowing programs with applications and windows.**

> **`S-3` rules out a physician directory permanently — students seeing other students' physicians.** **This is the opposite: institutions publishing their own programs.** **The distinction was already established and this respects it exactly.**

- **Category A** — sourced, dated, `freshness`-tracked. Application windows are the field that rots.
- **A program is not a `Physician` record.** It enters the directory only when the student actually shadows someone through it.
- **This is the answer to *"I have no connections."*** A student with a physician parent does not need it; **everyone else does**, and that is the same levelling argument as `RS-BIG-1`.

### `S-BIG-2` — what to actually do on the day

**A first shadowing day has conventions nobody writes down**, and a student who gets them wrong does not get invited back:

what to wear · whether to bring anything · **what HIPAA actually means for an observer** · whether to ask questions during or after · where to stand · **what to do if a patient declines your presence** · whether to write notes in the room.

- **`○` deterministic. Category B** (`knowledge-sources.md`) — **guidance for a human, driving no app logic.** Sourced and cited.
- **Shown once, before the first logged visit, and available thereafter on the physician panel.** **Never repeated** — a fourth-year does not need it.
- **This is *"a logistical guide, not a tracker"* applied to the pillar where the stakes per mistake are highest.** **`S-9`'s `questionsToAsk` is the student's half; this is the part they cannot write themselves.**

### `S-BIG-3` — the cold email, as a resource

**`S-36` cut the ask *pipeline*. A template is not a pipeline** — it is a document, it tracks nothing, and it records no rejection.

- Sourced templates, **Category B**, cited and dated.
- **HQ never sends anything.** Copy to clipboard, or open the mail client prefilled.
- **The shadowing ask has different conventions than the research one** — shorter, no paper to reference, and usually routed through an office rather than the physician directly. **Not the same template as `RS-BIG-3`.**

> **All three are `open`.** `S-BIG-1` needs research ask #5 (UNC Health volunteer and shadowing programs, already logged). **`S-BIG-2` and `S-BIG-3` need a sourcing pass and nothing else.**
>
> ### ⚠️ REVERSED (Andy, Aug 2026): no `Discover` here.
>
> **`Physicians · Visits · Reflections` stands.** Where `S-BIG-1` and `S-BIG-3` live is open — `05-experience-pillar.md` §2a-ii.

## Wave 7 · Boundaries

| # | Rule | Origin | St | |
|---|---|---|---|---|
| S-43 | **Shadowing hours NEVER enter the clinical total** | **`own`** | `spec` | AMCAS files it separately. **Grep-verified in acceptance.** Students conflate the two and find the shortfall at application time |
| S-44 | **Never shared across students** | `core` | `spec` | `deferred.md` **N-1**, and `05-shadowing-board.md` **S-3** rules a physician directory out permanently |
| S-45 | **Paste, never crawl** | **`own`** | `spec` | **Auto-crawling a named person's page is a different act from a student saving a page they were reading** |
| S-46 | **The DO dependency runs one way** | **`own`** | `spec` | School List tells Shadowing what a school wants. **Shadowing never tells School List a student is ready** |

---

## Rulings that override the rows above

### `R-S1` · The sufficiency call is CUT — and it is why `U-8` exists

> Andy, Aug 2026: *"this sufficiency call is probably the most ridiculous thing I've ever seen. Why are you trying to put caps? Targets are not necessarily caps. Why would you ever limit the amount of hours that you do?"*

**The old rule announced *"this is a complete shadowing record; you can stop"* and then permanently disabled breadth nudging — on a threshold the spec itself admitted was unsourced.** It was a cap in a friendly voice.

**And it was wrong for a real student:** someone who loves cardiology and shadows one physician for a hundred hours **has built the relationship that produces the best letter they will ever get.** *"You're done at 40"* is actively bad advice to that person.

**What survived, because it was the true part:** shadowing has **diminishing returns in a way clinical work does not** — you are observing, not contributing. **That is an observation the page reflects by leading with breadth. It is not an instruction.**

**The distinction, now law app-wide as `U-8`:** *HQ going quiet once you have breadth* is fine. *HQ declaring you finished* is a judgment nobody asked for. **Only the first is permitted.**

### `R-S2` · Unpacking is Clinical's mechanism configured, not a second one

> Andy: *"Shadowing is an unpacking thing. The mechanism should still be the same as Clinical."*

**§2.6's reflection requirement and Clinical's #45a are the same idea arrived at independently. They merge.** One marker, one set of deferral rules, one component. **The wording is configured; the machinery is not forked.**

### `R-S3` · A PA or NP is recorded and nothing is said

**No nudge, no move-offer.** A student shadowing a PA made a choice. **A Category A check on how AMCAS treats PA/NP observation is owed before any copy asserts a filing rule** — and until then HQ asserts nothing.

---

## Open — needs Andy

| # | | |
|---|---|---|
| **S-o1** | **Does AMCAS count PA/NP observation as Physician Shadowing?** **Category A research ask.** Until answered, `R-S3` holds and HQ says nothing |
| ~~**S-o2**~~ | **RULED Aug 2026: remove the placeholders now.** *"Specialty read"* (line 1334) renders a **static sentence** and *"Add another visit or specialty contrast"* (line 1383) fires on a **row count** — both read as intelligence and are neither. **A static string pretending to be analysis is worse than an honest empty state**, and leaving them means a conformance sweep counts them as built. **Replace with the real empty state (`01` §8, `04` §9). This is app-wide, not Shadowing-only** — `ExperiencePillar.tsx` has 27 category branches and the same defect class runs through Volunteering and Research. **See `S13`** |

---

## Inheritance audit — the answer to *"did Clinical carry over?"*

| | Count |
|---|---|
| **`core`** — inherited, configured | **19** |
| **`own`** — Shadowing-specific | **21** |
| **`core*`** — inherited but materially altered, mostly by the §4a collapse | **6** |

**The split is roughly even, and that is the correct shape.** **Every `core*` row traces to one ruling** — the site/contact/verifier collapse (§4a) — which is exactly what a pillar-specific structural difference *should* do to inherited features. **Nothing was dropped by accident**; the four cuts in Wave 2 are all consequences of that single collapse, and each reduces work rather than adding it.

---

## `Discover` — ADDED Aug 2026, and it reverses a same-month "no"

**Full ruling: `specifications/05-experience-pillar.md` §2a-ii.** **Shadowing was the one pillar held out of the universal `Discover`. Andy reversed it the same day.**

> *"It MIGHT be possible — gets your location and looks at possible people that you can contact, or provide any hospital/clinical directories. It's possible……."*

**The error being corrected:** I claimed a Shadowing `Discover` would be *"a list nobody can publish."* **Two lists were being conflated.** **Who practices near you is published by CMS. Who accepts shadows is published by nobody.** **`S-36` cut the second and it stays cut.**

| # | Feature | Surface | AI | St | Notes |
|---|---|---|---|---|---|
| **SD-1** | **Structured shadowing programmes** | `Discover (list)` | ○ | `open` | **The highest-value tier.** UNC Health and most systems run them; **dated applications a first-year has never heard of.** **Source in the same pass as `C-BIG-1`** |
| **SD-2** | **Specialty coverage directory** | `Discover (list)` | ○ | `open` | **Answers the question the student actually has** — *"I have only shadowed primary care."* Filter by specialty |
| **SD-3** | **Nearby providers** | `Discover (list)` | ○ | `open` | **NPPES / NPI Registry**, `npiregistry.cms.hhs.gov`. Free, public, documented no-key. **`PlaceLine` applies** |
| **SD-4** | **No send button, no template auto-fill** | — | — | `spec` | **A guard, not a feature.** **HQ reduces friction; that is the risk.** **The student writes the email** (`U-10`) |
| ~~**SD-5**~~ | ~~Who accepts shadows~~ | — | — | **`cut`** | **`S-36`, still cut. No source exists.** **Do not re-propose** |

**⚠️ NPPES is documented, not verified** — blocked from the sandbox at time of writing. **Confirm no-key access AND CORS headers before speccing.** **A static bundle calls it from the browser or not at all.**

**Sub-tabs are now four: `Physicians · Visits · Reflections · Discover`.**
