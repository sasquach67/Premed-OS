# Clinical — the board before speccing

Companion to `tabs/03-clinical.md`. **Reference index, not spec** — that file wins on any conflict.

**Why Clinical goes first of the five Experiences pillars:** it is the deepest domain, and it owns the boundary the other four are defined against. The *"does this count as clinical?"* ruling cascades into Volunteering (route-to-Clinical), Shadowing (observation is never clinical), and Extracurriculars (a service club that also produces patient contact). Settle it here once.

---

## 1. Surfaces that already exist in the spec

Shared frame from `specifications/05-experience-pillar.md`: compact stat strip → experience list as hero → center-peek inspector.

| Surface | § | Status |
|---|---|---|
| **Experience list** — master/detail over clinical experiences | 5 | specced |
| **Shift log** — dated sessions with hours + one-line reflection | 4, 6 | specced |
| **Classifier** — counts / ambiguous / likely-not, on add and on demand | 7 | specced |
| **Certification tracker** — name + expiry + renewal reminder + **CE against a sourced standard**; no coupling to hours or pace | 2.5, 7 | revised Aug 2026 |
| ~~Skills, observed vs performed~~ — **CUT**, replaced by one free-text line | 2.6 | cut Aug 2026 |
| **Paid vs volunteer tagging** (AMCAS activity-type split) | 2.2 | specced |
| **Pace projection** — hrs/wk → projected total vs target date | 7 | specced |
| **Hour target**, grounded in the student's own capacity or rate, never a benchmark | 7a | LOCKED Aug 2026 |
| **AMCAS Work & Activities structure**: 15-entry cap, repeated ranges, Completed/Anticipated | 7b | VERIFIED Aug 2026, Category A |
| **Verifier capture**: type-to-create + preset, batched at term rollover and pre-cycle | 7c | specced Aug 2026 |
| **Reflection**: chosen prompts (#45), tracked deep-unpack with a marker (#45a), cross-experience synthesis pass (#45b) | 7d | specced Aug 2026, "the most important feature on this tab" (Andy) |
| **Hours over time** chart | 8 | specced |
| **Center-peek inspector** | 10 | specced |

## 1a. Added Aug 2026 — Wave 9, from reviewing all 56 at once

Six items that only surface looking at the whole set rather than one feature at
a time. Three are collisions between features that are each individually correct.

| Surface | § | Status |
|---|---|---|
| **Return rundown** — shell-owned pattern, Clinical supplies three time-based facts | 7f | specced Aug 2026 · **promoted to `00-product-shell.md` §7.10** |
| **Nudge routing** — the seven go through Attention with a severity, one on the strip at a time | 7g | specced Aug 2026 |
| **Role fork** — a role change splits, never overwrites; concurrent roles supported | 7h #57 | specced Aug 2026 |
| **Dormancy** — pace reads active cadence; **no end-role action, nothing blocked** | 7h #58 | specced Aug 2026 |
| **Impossible-entry guard** — >24h/day only, never "unusual for you" | 7h #59 | specced Aug 2026 |
| **Overnight dating** — pre-09:00 saves default to yesterday, visibly | 7h #60 | specced Aug 2026 |
| **`estimated` exclusion list** — one place, because #59 tripped on it | 7i #61 | specced Aug 2026 |
| **Bring your own material** — imported writing gives a backfilled block real depth | 7i #62 | specced Aug 2026 · **new PHI surface, §16.4 open** |

**Three were proposed and dropped**, recorded so they are not re-proposed:

- **An "end this role" action.** It implied taking something away, and nothing
  should be — logging must keep working forever, retroactively, including
  resuming after a multi-year leave. The AMCAS end date it was chasing is an
  export field and belongs to #48. What survived is #58, a calculation fix
  requiring nothing from the student.
- **A "don't resurface this" flag on individual reflections** (Andy: scratched).
- **A minimum-reflection floor on the synthesis pass** (Andy: faded). Its
  underlying risk moved rather than vanished — see the catalog's Wave 9 note.

## 1b. Carried open decision from Wave 9

| # | Decision | Lean | Status |
|---|---|---|---|
| 4 | Does HQ **scan** #62's imported material for patient identifiers, or only **warn**? | Warn — it is what §7i specs and it ships today | **open**, `03-clinical.md` §16.4. Scanning is more protective but a false positive on "Mr. Johnson in bed 4" also fires on a student writing about their own grandfather, and a scan people learn to click through is worse than a warning read once. Decide **before** #62 ships. |

## 2. Smart features (§7) — 7 deterministic, plus reflection's AI layer (§7d)

**Updated Aug 2026: "all deterministic" no longer holds.** §7d's deep-unpack and synthesis passes are genuinely LLM-backed, this pillar's first AI dependency. The original 7 stay deterministic; reflection is the one exception, stated rather than silently made false (same carve-out recorded in the catalog's Universal Rules).

1. Mis-filing catch · 2. Pace projection · 3. Cert renewal reminder · 4. Stale-exposure alert · 5. Verifier capture, now the full §7c workflow, not just a nudge · 6. Unlinked reflection · 7. Paid/volunteer nudge · 8. Reflection unpacking and synthesis (§7d), the AI exception

---

## 3. Brainstormed — PROMOTED, all five now specced

Ordered by how much they change the tab. **Nothing left in this table is open work.**

| # | Thing | Why it matters | Shape |
|---|---|---|---|
| ~~**C1**~~ | ~~The hour-ownership rule, stated once and enforced~~ | **SPECCED.** Four pillars can each plausibly claim the same shift, and every one of them has an hours or counting feature. **One shift belongs to exactly one pillar; cross-links never double-count.** | §2.0 in `03-clinical.md`, referenced by 04/05/07 |
| ~~**C2**~~ | ~~Verifier capture as a first-class workflow~~ | **SPECCED Aug 2026.** Type-to-create with preset reuse, same mechanism as roles and certs. Never at add time; batched at term rollover and again pre-cycle, two triggers on one review screen. Future pattern-detection noted, not built now. See `03-clinical.md` §7c, catalog #38/#39/#40/#41. | §7c |
| ~~**C3**~~ | ~~Hour-goal honesty~~ | **SPECCED, LOCKED Aug 2026.** No sourced benchmark exists (§8 below), so the target is grounded in the student's own stated capacity or observed rate, never a benchmark, always labelled `Your target`, never pre-filled. See `03-clinical.md` §7a, catalog #31. | §7a |
| ~~**C4**~~ | ~~Shift-level reflection prompt that varies~~ | **REVERSED Aug 2026** (Andy): rotation was the wrong mechanism. A shift with no patient moment forced onto that prompt produces a worse note than one where the student picked a prompt that fit. **Replaced by a chosen-prompt catalog (chips) plus a freeform line** (#45), a **major, tracked, full-screen deep-unpack pass** with a 2-3 exchange minimum and no ceiling (#45a), and a **cross-experience synthesis pass** that reads every unpacked reflection at once to surface the arc, not just a moment (#45b). Andy: *"probably the most important feature on this tab."* This pillar's first real AI dependency. See `03-clinical.md` §7d, catalog #45/#45a/#45b. | §7d |
| ~~**C5**~~ | ~~Lapsed-cert consequence~~ **RESOLVED Aug 2026: there is no consequence.** | The old spec claimed a lapsed cert "halts hour accrual". Ruled wrong (Andy): *"why do you think a person wouldn't just renew it?"* The projection assumes the student keeps working and an expiry does not change that, because people renew. Halting it would model a failure that is not going to happen. The nudge is a reminder and nothing more; the two never interact. If someone genuinely stops working, **stale-exposure** catches it from logged shifts. | **cut** — see catalog R6 |

---

## 4. Brainstormed — MINOR ADD-ONS (build, don't headline)

- ~~**Setting mix** as a compact chart~~ — **CUT Aug 2026**, catalog #36. Mocked, judged, and it did not earn the space. Shadowing owns breadth.
- **Shift templates** — a recurring 4-hour Saturday ED shift shouldn't be typed from scratch each week.
- **Bulk backfill** — a student who starts using HQ in junior year needs to enter two years of past hours without 200 individual logs. One estimated block with a clear `estimated` flag.
- **Supervisor change** on a long role — the person who can verify may not be the person who hired you.
- ~~**Export preview**~~ — **MOVED to Profile/CV, Aug 2026** (`03-clinical-views-board.md` V3). The preview and the application-wide 15-entry cap cannot live in a pillar-scoped surface. Clinical retains a **phase-gated prep panel** on `Sites` (judgment calls, missing verifiers, descriptions, completed/anticipated split).
- **Letter-of-rec timing nudge (redirected from #43, Aug 2026)**: not a Clinical feature. Andy: *"a good time to be thinking about who could write your letter of rec... let's try not to formalize it too much."* Belongs as an **informal Overview roadmap milestone**, unscored, no "readiness" computation. Not built this pass; a candidate the next time Overview's roadmap or Letters is touched.

---

## 5. REJECTED — do not build

| Thing | Why not |
|---|---|
| **Streaks on clinical shifts** | Shifts are scheduled by an employer, not chosen daily. A broken streak would punish someone whose department cut hours. The no-streak/no-loss-framing rule is now shell-wide (`00-product-shell.md` §7.10); `01` §6.10-B is its Academics specialization, not its source. **Extends to arithmetic:** #58's pace fix must let a returning student's rate recover, since a calculation that permanently penalises an absence is a streak by another name. |
| **A "clinical readiness score"** | A blended composite of hours, recency, and variety would be invented and uncheckable (`01` §6.12). Show the components. |
| **Comparison to other applicants** | The app has no honest data for it, and importing pre-med comparison anxiety is a stated non-goal (`04-volunteering.md` §7 makes the same argument for the only social feature that avoids it). |
| **Auto-classifying and silently moving records** | Permission-first is standing law. Flag-and-offer only — matches Volunteering's route-to-Clinical ruling. |
| **Patient names, identifiers, or any PHI field** | Not a HIPAA-safe surface and never will be. Reflections are about the student's experience, and the empty-state copy should say so. |
| **Scraping or importing hospital volunteer portals** | No stable interface, and the terms are hostile. Manual entry plus templates is the honest answer. |
| **A second calendar for shifts** | `01` §6.9 is explicit: do not build a calendar, read from one. |
| **A standalone "where your hours live" panel** | Mocked (`mockups/_shared/hours-map.html`) and rejected Aug 2026. Overview already covers it twice: §6.5 "Where I stand" rows and the §6.5a Hours stat tile. Four elements survive and move to the AMCAS export preview (#48, owned by Profile/CV per views-board V3): the cross-link attribution line, AMCAS category per row, expand-to-records, and the judgment-calls review. |

---

## 5b. The AI sweep on every new feature (STANDING, Aug 2026 · applies to every tab)

**Andy, Aug 2026:** *"we're always gonna run that sweep past (the ai sweep, among others) for each thing we're gonna spec."*

**Every feature gets an `AI` marker when it is written, not retroactively.** The four-way scale is defined in each catalog's header:

| | Meaning |
|---|---|
| ○ | Deterministic, and that is the right answer |
| ◑ | **Deterministic today, meaningfully better with AI.** The upgrade list |
| ◐ | AI-assisted, degrades gracefully without a key |
| ● | Requires an LLM |

**The question that separates ○ from ◑:** does this feature have to compare **the meaning of two things**, or only match identifiers and thresholds? Meaning-comparison is ◑ or higher. The Aug 2026 retro-audit found 20 across all three tabs, and every one fit that test.

**◑ is not a promise to build the AI version.** It is a record that the shipped version is the crude one, so nobody later mistakes a keyword match for the intended design.

**Where deterministic is not merely sufficient but correct:** layout, grouping, filtering, and any guard. **A filter that guessed would be a broken filter.** Wave 10 is nine features and found exactly one ◑; that ratio is expected for view mechanics and would be a warning sign for a smart feature.

## 5a. Closing a ruling — the grep step (STANDING, Aug 2026)

**A ruling is not closed until you have searched for the text it supersedes.**

Discovered the hard way. R1 (skills cut) and R8 (monthly bars) were each recorded in three or four places, all of it *new* text: new sections, the catalog, mockup headers. Meanwhile the sentences they killed sat untouched in sections written in July. `03-clinical.md` ended up carrying **two acceptance criteria that contradicted each other**, ten lines apart, and `05-experience-pillar.md` still specced a cut feature months later.

The decision was never forgotten. It was written down every time and never propagated backward.

**So, on every ruling:**

1. Write the ruling where it belongs.
2. **Grep for the thing being killed**, by its own name, across `tabs/`, `specifications/`, and `implementation/`. Every one of these was findable that way.
3. Update or delete each hit. A superseded line stays only if it is explicitly marked superseded.
4. Check the **component tables and acceptance criteria** specifically. They are the two places stale entries hide, because nobody rereads them.

## 6. Governing note

Clinical is the pillar where **hours are the primary signal** — unlike Extracurriculars, where they are the weakest. **CORRECTED Aug 2026:** this paragraph used to call Clinical *"the one Experiences pillar allowed to have a pace projection and a target at all,"* and cited Shadowing's *"correct end state is stop"* as the contrast. **Both claims are dead.** Volunteering kept targets (V-1) and **Shadowing now inherits them too** — Andy: *"targets are not necessarily caps."* **Targets are app-wide and student-set.**

**C3's honesty rule matters more, not less, for being general:** wherever the app renders a projection it has to be defensible, and that is now every pillar rather than one.

---

## 7. Carried open decisions (from `03-clinical.md` §16)

| # | Decision | Lean | Status |
|---|---|---|---|
| 1 | Is per-shift patient-contact count worth the field? | Optional, off by default | **open** — catalog Wave 8 #52 |
| 2 | ~~Classifier assertiveness~~: flag-and-suggest vs soft-gate | Flag-and-suggest; never block | **RESOLVED**, by the writing itself. §2.1 built end to end as flag-and-suggest; no soft-gate language survives anywhere in `03-clinical.md`, including its acceptance criteria |
| 3 | ~~Does setting-mix visualization earn its place?~~ | Cut for launch unless demanded | **RESOLVED: cut**, catalog #36 |

---

## 7a. RESOLVED — AMCAS terminology (Aug 2026)

**Researched against AMCAS's actual categories, not the spec.** Findings that bind:

- **AMCAS has no "clinical experience" category.** There are 19 Work and Activities categories; clinical hours are a **community/adcom concept that schools compute**, not an AMCAS field.
- The correct name for patient-facing hospital volunteering is **`Community Service/Volunteer — Medical/Clinical`**. The category leads with *volunteer*; **Medical/Clinical is the subtype modifier**.
- **AMCAS's primary axis is how you were engaged** — paid employment · community service · shadowing — with medical/clinical as a modifier on the first two. Earlier spec language implying a clinical-first 2×2 was wrong.
- Patient exposure has no category of its own; it is captured through paid employment or community service, whichever fits.
- `Physician Shadowing/Clinical Observation` is its own category regardless of pay — consistent with Shadowing §2.3.
- ⚠ **Count discrepancy:** sources list either 18 or 19 categories, differing on **Health Advocacy**, which appears to be a recent addition. **Verify against the live application before hard-coding the list.** AAMC's own page is bot-protected and could not be fetched.

**Consequence for HQ:** the Clinical tab is a **product choice serving the number students are judged on**, not a mirror of AMCAS structure. Spec language implying otherwise should be corrected. The export mapping is what must be exact:

| HQ record | AMCAS category |
|---|---|
| Clinical + paid | `Paid Employment — Medical/Clinical` |
| Clinical + volunteer | `Community Service/Volunteer — Medical/Clinical` |
| Service (non-clinical) + volunteer | `Community Service/Volunteer — Not Medical/Clinical` |
| Shadowing | `Physician Shadowing/Clinical Observation` |

This confirms **R2** (paid/volunteer must stay in the model) for a firmer reason than originally given.

## 7a-i. RESOLVED — the tab stays named "Volunteering" (Andy, Aug 2026)

A rename to **Service** was proposed on the grounds that "Volunteering" names a *pay axis* while the tab is scoped to *non-clinical community service* — the mismatch that makes "where does my hospital volunteering go?" a confusing question.

**Rejected. The tab keeps its name.** Consequences to accept rather than re-litigate:

- The boundary must be carried by **copy and routing**, not by the label. Route-to-Clinical (Volunteering §7, resolved #3) is doing the work, and it has to be good.
- `Community Service/Volunteer — Medical/Clinical` records live in the **Clinical** tab despite the AMCAS category name leading with *volunteer* (§7a). The export mapping keeps this correct; the UI does not mirror it.
- No sidebar change, no route change, no `Goals.volunteering` key change, **no localStorage migration**.

## 7b. OPEN — classify-not-file (raised Aug 2026, not decided)

Every experience needs exactly two facts — **engagement type** (paid · volunteer · shadowing · research · activity) and **is-it-clinical** (the smell-the-patient test). From those two, both the AMCAS category *and* the clinical-hours total are fully determined.

If experiences were **classified rather than filed**, tabs would become views over one set (`Clinical = clinical:yes`), double-counting would be **structurally impossible** rather than an enforced rule, **C1 would dissolve**, and route-to-Clinical would become unnecessary rather than resolved.

**Not adopted.** It changes ownership semantics in five pillar specs and would reopen a decision Volunteering already marked resolved. Recorded here so the option isn't lost.

## 8. Category A research required

- **Hour targets (blocks C3 / #31)** — whether any sourced figure exists for "expected" clinical hours.
  - **Candidate source:** AAMC **Matriculating Student Questionnaire (MSQ)**, results published as the *MSQ All Schools Summary Report*. **Verified:** the MSQ exists, is AAMC-run, annual, covers all US MD matriculants, and is published in aggregate nationally. **NOT verified:** that it asks for clinical **hours**, or that the report publishes **distributions** (median/quartiles) of them. A secondary consulting source claimed both; the claim was repeated in an earlier pass and is **not evidence**.
  - **The task:** open the MSQ All Schools Summary Report and confirm (a) an hours question exists and (b) a distribution is published. Contact `msq@aamc.org` if the report is not publicly reachable.
  - **If confirmed:** the set-a-target moment may show the real spread, **once**, with two caveats stated in the UI — the data is **self-reported** and covers **matriculants only** (survivorship bias).
  - **If not confirmed:** stay on the fallback below. Do not substitute a community or consulting figure. R7: cut rather than approximate.
  - **Fallback, shippable today and honest:** **no target by default.** The projection describes rate and total with no goal attached (*"8.2 hrs/wk · 486 hours · 14 months sustained"*). A student may set one; it is always labelled **`Your target`**, never `the target`, and HQ never pre-fills it. **A default number would become the standard in the user's mind regardless of the caption** — that is why option "ship a default and remind them to change it" is rejected.
- **AMCAS verifier requirements** — exactly what fields the application asks for, so C2 captures the right ones rather than a guess.
- **Credential standards (R7, standing)** — NREMT NCCP component split · NC EMS state requirements · BLS/ACLS cycle lengths · CNA registry renewal. **Confirmed so far:** EMT NCCP = 40 credits, 3 components, 2-year cycle, 2025 model effective 1 Apr 2025. Nothing else is hard-coded until sourced.
- **The category list itself** — 18 vs 19, turning on whether `Health Advocacy` is live. Must be checked against the actual application before the export mapping ships. See §7a.
- ~~AMCAS category terminology~~ — **RESOLVED, see §7a.**
