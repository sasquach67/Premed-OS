# Clinical — feature catalog

**Companion to `tabs/03-clinical.md` and `tabs/03-clinical-board.md`.** That spec is law; this is the readable index of **what exists in code today** versus **what could exist**.

**Verified against `src/pages/ExperiencePillar.tsx`, `src/lib/types.ts`, and `src/lib/intelligence/` on 1 Aug 2026** — by reading the code, not the spec. Several things the spec describes as specced turn out to be placeholder UI, and those are marked honestly below.

---

## Part 1 — Currently implemented

### A. Real and working

| # | Feature | Where | Notes |
|---|---|---|---|
| 1 | **Experience list + entity catalog** | `ExperienceEntityCatalog` | Master list of clinical sites/roles |
| 2 | **Entity workspace** (center-peek equivalent) | `ExperienceEntityWorkspace`, `ApprovedEntityWorkspace` | Per-site detail |
| 3 | **Shift log — add / edit / remove** | `LogList`, `SimpleLog`, `InlineAddRow` | The core loop works |
| 4 | **Hours and sites view** | `HoursAndSitesView` | Totals by site |
| 5 | **Weekly hours card** | `WeeklyHoursCard` | Recent cadence |
| 6 | **Expandable entry rows** | `ExpandableEntryRow` | Shared component, correct reuse |
| 7 | **Contact card** | `ContactCard` | Shared with Letters |
| 8 | **Verifier data model** | `types.ts` — `verifierName/Id/Role/Email/Phone` | **Fields exist; no capture workflow uses them** |
| 9 | **Pace projection engine** | `intelligence/derived.ts` → `paceProjection()` | Real function: remaining, weeksToGoal, projectedDate, met |
| 10 | **Goals targets per pillar** | `types.ts` → `Goals.clinical` | User-set number (see gap G3) |
| 11 | **Insight strip** | `PillarInsightStrip`, `InsightCard` | Renders per-pillar reads |
| 12 | **Primary-care open loop** | `ExperiencePillar.tsx:1373` | Regex over text — crude but real |
| 13 | **Data-health + dedup warnings** | `intelligence/dataHealth.ts`, `dedup.ts` | App-wide, applies here |

### B. Placeholder UI — looks built, isn't

| # | Feature | What's actually there |
|---|---|---|
| 14 | **Certifications block** | **Hardcoded array** `['BLS / CPR', 'HIPAA', 'Site onboarding']` with a fake status where index 0 shows "Current" and the rest show "Add expiry". **No expiry dates, no CE hours, no renewal logic, no persistence.** The spec's §2.5 cert tracker does not exist. |
| 15 | **Skills observed / performed** | **Hardcoded array** of 6 skill strings, highlighted by `index < Math.min(3, entity.rows.length)`. **Decorative — there are no observed/performed counts anywhere.** The spec's §2.6 does not exist. |
| 16 | **Category-specific insight** | Canned string per category (`"…can anchor patient-contact stories if reflections stay current."`) — not derived from the record |

### C. Specced but **not built at all**

| # | Feature | Spec § | Status |
|---|---|---|---|
| 17 | **Clinical classifier** ("does this count?") | §2.1, §7 | **No code exists.** Grep for classifier logic returns nothing in this pillar. The single most distinctive feature of the tab. |
| 18 | **Paid vs volunteer tagging** | §2.2 | **Not modelled.** No field in `types.ts`. AMCAS export will be miscategorised. |
| 19 | **Certification renewal / CE alerts** | §7 | Not built (see 14) |
| 20 | **Stale-exposure alert** | §7 | Not built |
| 21 | **Missing-verification nudge** | §7 | Not built, though the fields exist |
| 22 | **Unlinked-reflection nudge** | §7 | Not built |
| 23 | **Hours-over-time chart** | §8 | Not built |
| 24 | **Setting mix chart** | §8 | Not built (was optional anyway) |

**Summary: 13 real, 3 placeholder, 8 missing.** The loop that works is *log a shift and see hours by site.* Everything that makes Clinical a first-class pillar rather than an hours tracker is unbuilt.

---

## Part 2 — The full inventory, numbered 1 to 54

**One numbering scheme.** An earlier pass had two (a 54-item chat list and a P1–P25 file list) and they collided. This is the canonical one. Status: **✅ built · ▨ placeholder · ○ not built · ✎ designed, not built**

## How to read the columns

**`Surface`** uses a fixed vocabulary, never prose, so *"what lives on Shifts?"* is answerable by filtering. The three sub-tabs are ruled in `03-clinical-views-board.md` §3 and specced in `03-clinical.md` §5:

`Sites` (incl. the Credentials section) · `Shifts` · `Reflections` · `unpack flow` (full screen, outside tab chrome) · `prep panel` (phase-gated, on Sites) · `shell` · `Overview` · `Profile/CV` · `none` (a rule, invariant, or engine behavior with no surface)

**Every `Sites` row now carries `(list)`, `(panel)`, or `(page)`** — required by `05-experience-pillar.md` §2c. **`Sites` absorbed 33 of this catalog's rows and a bare label could mean card content, a detail-panel module, or a nudge firing on the surface.** Applied Aug 2026: **3 `(list)` · 22 `(panel)` · 9 `(page)`.**

> **What the split revealed: the Sites *list* holds three things** — the list itself, hours-by-site, and the weekly cadence card. **Twenty-two live in the detail panel and nine are page-level nudges.** **The "Sites tab is bloated" reading was wrong** — the tab is fine, the *panel* is dense, and a dense panel is correct. **What was actually missing was the vocabulary to say so.**

**`AI`** answers *"does this need an API key?"*

| | Meaning |
|---|---|
| ○ | Deterministic. No AI, ever. |
| ◑ | **Deterministic today, meaningfully better with AI.** Works without a key, but the non-AI version is the crude one. **This is the upgrade list.** |
| ◐ | AI-assisted, **degrades gracefully**. The feature still works without a key, just plainer. |
| ● | **Requires** an LLM. Without a key it does not exist. |

**`St`** is build status, which Clinical tracks and the other catalogs do not, because Part 1 audited the real code: **✅ built · ▨ placeholder · ✎ designed · ○ specced, unbuilt · ✗ cut**

**Components are not duplicated here.** `Surface` is the join: look the surface up in `03-clinical.md` §8a. One source, no drift.

### Wave 1 · The record (1–11)

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 1 | Clinical site list | Sites (list) | ○ | ✅ | Master list of sites/roles with hours each |
| 2 | Site workspace | Sites (panel) | ○ | ✅ | Per-site detail with shift log and blocks |
| 3 | Shift log, add/edit/remove | Sites (panel) | ○ | ✅ | Dated rows, hours, one-line reflection |
| 4 | Hours by site | Sites (list) | ○ | ✅ | *"Carolina ED, 142h across 31 shifts"* |
| 5 | Weekly hours card | Sites (list) | ○ | ✅ | Recent cadence at a glance |
| 6 | Expandable entry rows | Shifts | ○ | ✅ | Shift expands to full note |
| 7 | Under-5-second logging | Sites (panel) | ○ | ✅ | Date, hours, one line, done |
| 8 | Role presets, type-to-create | Sites (panel) | ○ | ✎ | Type it once, saved, suggested next time. **Replaced shift templates** |
| 9 | Bulk backfill | Sites (panel) | ○ | ✎ | Quiet link. One block, flagged `estimated`, never in weekly pace |
| 10 | Quick-log from Overview | Overview | ○ | ○ | Quick-access overlay. Site, date, hours, **reflection** |
| 11 | Mobile dictation | none | ○ | ○ | Nothing built. A prohibition plus two layout rules |

### Wave 2 · Classification (12–19) · **CLOSED**

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 12 | **Mis-filing catch** (was "classifier") | Sites (page) | ◑ | ✎ | Silent on clear roles. §2.1 |
| 13 | Judgment calls | prep panel | ○ | ✎ | Tagged silently, surfaced once pre-cycle. §2.1 |
| 14 | Route to Volunteering | Sites (page) | ○ | ✎ | Move / Keep, sessions intact, never automatic. §7 |
| 15 | Route from Shadowing | Sites (page) | ○ | ○ | Same mechanism, **inverted copy**. §7 |
| 16 | Paid vs volunteer | none | ○ | ✎ | Inferred, hidden, export only. §2.2 |
| 17 | Paid/volunteer breakdown | Profile/CV | ○ | ○ | Export preview only. §2.2 |
| 18 | **Hour ownership** | none | ○ | ✎ | One record, one pillar. §2.0. Visible only as Overview's attribution line |
| 19 | Primary-care loop | Sites (page) | ○ | ✅ | Regex over role text |

### Wave 3 · Credentials (20–24) · clinical-only · **RULED Aug 2026**

**These render as a *section* on `Sites`, not their own sub-tab** (Andy, Aug 2026): *"most people probably have four certs, it's not really necessary to put in the entire tab."* Profile-level certs group under "Not tied to a site", which is what keeps V2's homeless-cert case solved. Mockup: `mockups/04-clinical/clinical-subtabs.html` frame 3.

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 20 | **Certs are type-to-create** | Sites (panel) | ○ | ○ | Type "NC EMT-Basic" once, saved, suggested next time. The hardcoded three are **deleted** |
| 21 | **Real cert tracker** | Sites (panel) | ○ | ○ | Name, expiry, optional note. *"NC EMT-Basic expires Mar 31 2027"* |
| 22 | **CE tracking** | Sites (panel) | ○ | ○ | Sourced requirement, optional logging. *"NREMT NCCP · 40 credits · 2-yr cycle"*. See R5 |
| 23 | Renewal lead-time alert | shell | ○ | ○ | Escalates as expiry nears. Just a reminder. Routes via #56 |
| 24 | ~~Lapsed-cert consequence~~ | none | ○ | ✗ | **CUT, there is no consequence.** See R6 |

### Wave 4 · Skills (25–28) · **CUT, see R1**

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 25 | Skill chips | none | ○ | ✗ | **DELETE**, do not build on |
| 26 | Observed/performed counts | none | ○ | ✗ | **REJECTED**, false precision |
| 27 | "What you actually do here" | Sites (panel) | ○ | ○ | Free-text line (§2.6) **+ sourced scope checklist at writing time**, R1-a |
| 28 | Skills → interview prep | none | ○ | ✗ | Folded into 27 |

### Wave 5 · Recency & pace (29–36)

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 29 | Pace projection engine | none | ○ | ✅ | `paceProjection()` |
| 30 | Goals target per pillar | none | ○ | ✅ | `Goals.clinical` |
| 31 | **Target, suggested from your own rate** | Sites (panel) | ○ | ○ | Weekly-first or total-first, both linked. No target on day one. §7a |
| 32 | Pace line | Sites (panel) | ○ | ○ | *"8.2 hrs/wk → ≈812 by Jun 2027 · clears your target"* |
| 33 | **Stale-exposure alert** | Sites (page) | ○ | ✎ | **3× median gap, floor 2 weeks, cap 12.** Silent under 4 shifts. Per experience. No adcom claim. §7 |
| 34 | **Hours chart, two views** | Shifts | ○ | ○ | Monthly bars by default, running total on request. Segmented switcher. See R8 |
| 35 | ~~Gap narrative~~ | none | ○ | ✗ | **DEMOTED** into #34. An empty bar already shows it. See R8 |
| 36 | ~~Setting mix~~ | none | ○ | ✗ | **CUT Aug 2026.** Shadowing owns breadth. Mockup kept as reference in `clinical-hours-chart.html` frame 2 |

### Wave 6 · Relationships & verification (37–43)

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 37 | Verifier data model | none | ○ | ✅ | Fields exist in `types.ts` |
| 38 | **Verifier capture, type-to-create + preset** | Sites (panel) | ○ | ○ | Same mechanism as role/cert typeahead. Never at add time. §7c |
| 39 | Missing-verification nudge | Sites (panel) | ○ | ○ | **Merged with 38** into one term-rollover batched review, not a separate nudge |
| 40 | Pre-cycle verifier re-check | prep panel | ○ | ○ | *"Confirmed 18+ months ago, still reachable?"* Same review screen, different trigger. §7c |
| 41 | Supervisor change | Sites (panel) | ○ | ○ | **Folded into 38.** A verifier is its own field, not an alias |
| 42 | Shared contact card | Sites (panel) | ○ | ✅ | Same `Person` record as Letters |
| ~~43~~ | ~~Letter-readiness read~~ | none | ○ | ✗ | **CUT from Clinical, Aug 2026.** Redirected as an informal Overview roadmap milestone, unscored. See board §4 |

### Wave 7 · Reflection & application (44–51)

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 44 | Per-shift reflection field | Sites (panel) | ○ | ✅ | One line per shift |
| 45 | **Reflection prompts, chosen not rotated** | Sites (panel) | ○ | ○ | Selectable chips + a freeform line. **Does not set or clear the unpacking marker.** §7d |
| 45a | **Deep unpack, tracked, full screen** ⭐ | unpack flow | ● | ○ | **The tab's most important feature (Andy).** Every shift gets a marker; cleared only by unpacking (2–3 exchange minimum, then uncapped) or explicit deferral, both permanent. §7d |
| 45b | **Synthesis pass, cross-experience** | unpack flow | ● | ○ | Reads every unpacked reflection across every clinical experience. The only surface showing the arc rather than a moment. Primary source for #49. §7d |
| 46 | Unlinked-reflection nudge | shell | ○ | ○ | Not yet sent to Story Bank. Routes via #56 |
| 47 | Story Bank routing | Reflections | ◑ | ○ | One action per shift. **One record, two doors** (views-board V5) |
| 48 | **AMCAS export preview** | Profile/CV | ○ | ○ | **SPLIT Aug 2026** (views-board V3). Preview, 15-entry cap, and most-meaningful move to Profile/CV. **Clinical keeps prep only**, on the `prep panel` |
| 49 | Most-meaningful candidacy | Profile/CV | ○ | ○ | Cross-pillar |
| 50 | Insight strip | Sites (page) | ○ | ✅ | Renders per-pillar reads |
| 51 | Category insight copy | Sites (page) | ◑ | ▨ | Canned string, not derived |

### Wave 8 · Closed (52–54)

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 52 | **Patient-contact count, generalized to extracted numerics** | Sites (page) | ◐ | ○ | Minor, optional, off by default. The AI already reading reflections can offer to tag any numeric the student mentions. §7e |
| ~~53~~ | ~~Shift-mood / burnout signal~~ | none | ○ | ✗ | **CUT Aug 2026** (Andy): *"AI can't really predict or sense any of that, it should be an objective agent."* |
| 54 | **Shared org directory, aggregate only** | Sites (page) | ◐ | ○ | *"12 students logged hours here."* Entry-time resolution, **a person confirms every merge**, never silent. Org-level only. §7e |

### Wave 9 · Continuity and record integrity (55–62) · added Aug 2026

**Where these came from:** reviewing all 56 at once rather than one at a time. Every one is a gap that only shows up looking at the set, and three are collisions between features that are individually correct.

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 55 | **Return rundown, Clinical's supply** | shell | ○ | ○ | Shell-owned (§7.10). Clinical supplies at most three *time-based* facts. **Never** unpacking markers, **never** stale-exposure. §7f |
| 56 | **Nudge routing through Attention** | shell | ○ | ○ | The seven stop rendering independently; they route into the shell severity model, ranked by **what cannot be recovered later**. One nudge on the headline at a time. §7g |
| 57 | **Role change forks the record** | Sites (panel) | ○ | ○ | `ED Volunteer` → `ED Scribe` offers `Split` inline. **The original is never closed or altered.** §7h |
| 58 | **Dormancy is a projection fix, not a status** | none | ○ | ○ | **No end-role action, nothing blocked.** Pace reads *active cadence*, so a job left in March stops dragging `hrs/wk` down forever. §7h |
| 59 | **Impossible-entry guard** | Sites (panel) | ○ | ○ | Over 24 total hours on one date only. Inline, never blocks. **Nothing fires for "unusual for you"**, that is a verdict. §7h |
| 60 | **Overnight shifts date to their start** | Sites (panel) | ○ | ○ | A save before 09:00 defaults to yesterday, editable before save. Matters because #33 keys off the median gap. §7h |
| 61 | **`estimated` exclusion list, in one place** | none | ○ | ○ | Not a feature, a fix. Excluded from pace, median-gap, bars, the >24h guard, and markers; **included in** totals and the export. **#59 tripped on it.** §7i |
| 62 | **Bring your own material for a backfilled block** | Sites (panel) | ◑ | ○ | *"Did you write anything during this period?"* A rough period not a date, labelled written-then-imported, **no marker ever**. Fixes two blank years. §7i |

### Wave 10 · Sub-tab mechanics (63–71) · added Aug 2026

**Where these came from:** building `mockups/04-clinical/clinical-subtabs.html`. None is a new capability. They are how the three surfaces behave, and they existed only as HTML until now, which meant an implementer would have had to infer them from a picture.

**Structure they belong to:** three flat sub-tabs, `Sites` · `Shifts` · `Reflections` (`03-clinical-views-board.md` §3).

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 63 | **Month grouping with subtotals** | Shifts | ○ | ○ | `MARCH 2026 · 31.0 h` above each group. This is what makes *"what did I actually do in March"* answerable at a glance rather than by adding rows up |
| 64 | **Site and period filters** | Shifts | ○ | ○ | Two `Select`s: all sites or one, and a date range. Solid form controls per `01` §4b-i |
| 65 | **Active / ended segmented filter** | Shifts | ○ | ○ | **This is V6's archive case**, absorbed as a filter rather than built as a separate destination. Ended roles are a view of the ledger, not another page |
| 66 | **Inline edit in place** | Shifts | ○ | ○ | Correct hours or a date on the row itself. Spotting `80 h` and being sent back to the right site to fix it is the thing this prevents. **Creating still uses the shared add row** |
| 67 | **Site picker on the add row** | Shifts | ◑ | ○ | The one field Sites does not need, because Sites already knows the site. **Defaults to your most recent.** ◑ because a smarter default is real: someone who works Saturdays at the ED should not re-pick it every Saturday |
| 68 | **Two-axis reflection filter** | Reflections | ○ | ○ | Site **and** state, as two separate controls. *"filter between... and then filter between unfinished and unpacked"* (Andy). **Never one combined dropdown**, which would force every site-and-state pair into a single list |
| 69 | **Synthesis rendered distinctly** | Reflections | ○ | ○ | A #45b thread is tinted, rule-marked, and tagged `Synthesis · 14 reflections`, so it never reads as just another shift note. Per V5: both doors, visually distinct |
| 70 | **Outstanding count on the page** | Reflections | ○ | ○ | *"14 threads · 9 shifts not yet unpacked"* in the filter bar. **Never a badge on the tab label**, which would follow you around the app instead of waiting where you went to look |
| 71 | **Credentials grouped, incl. untied** | Sites (panel) | ○ | ○ | Grouped by site, with **"Not tied to a site"** at the bottom for profile-level credentials. That group is the whole reason **V2** was a defect rather than a preference |
| 72 | **Continuity read** | Shifts | ○ | ○ | **Added Aug 2026** from a cross-pillar ruling (`05` §2a). Engaged months vs gap months, beside the hours chart. **Presence, not volume.** Answers *"did I stay with this?"*, which hour heights and running totals both miss. Descriptive, no score, silent under 3 months. Clinical leads with recency and shows this second |

**The AI sweep on this wave found one ◑, #67.** Everything else here is layout, grouping, and filtering, where deterministic is not merely sufficient but correct: a filter that guessed would be a broken filter.

**Two Wave 9 candidates were considered and dropped, recorded so they are not re-proposed:** a *"don't resurface this"* flag on individual reflections (scratched, Andy), and a **minimum-reflection floor on the synthesis pass** (faded, Andy). The floor's underlying risk did not disappear, it moved: #62's imported retrospective material is the input where #45b is most tempted to find an arc that isn't there, because tone across imported sources is inconsistent in a way dated reflections are not.

---

## Totals

**74 features (72 canonical + 45a + 45b).** By build status: 13 built · 3 placeholder · 4 designed · 4 cut · 50 specced-unbuilt.

By AI dependency:

| | Count | Which |
|---|---|---|
| ○ deterministic and sufficient | 65 | All seven §7 smart features, the pace engine, every guard, and all sub-tab layout and filtering |
| ◑ **better with AI** | 5 | #12 mis-filing catch · #47 Story Bank routing · #51 category insight · #62 imported material · #67 add-row site default |
| ◐ degrades gracefully | 2 | #52 extracted numerics · #54 org-merge suggestions |
| ● requires an LLM | 2 | **#45a deep unpack · #45b synthesis pass** |

**Only the reflection pair hard-requires a key**, and neither is in the base logging path, so the ≤5-second loop never depends on AI.

**#51 is the one to fix first.** It is a **canned string** today, marked ▨ placeholder in the build audit, so it is the only feature in the tab that is both unfinished *and* would be genuinely good with AI rather than merely better. **#12 is the interesting one**: §2.1 deliberately designed the mis-filing catch to avoid needing judgment, asking two questions instead of classifying. ◑ records that a smarter version exists **without reopening that ruling**, which stands.

By surface, **`Sites` holds 29 of 64** now that Credentials folded into it as a section. That is expected: it is the master-detail hero and the default landing.

**The Surface column did its job here.** Credentials drew only 3 features, the views board had flagged it as the likeliest panel-not-tab candidate, and the count confirmed it before anything was built. `Shifts` (2) and `Reflections` (1) stay thin on purpose, because **they are containers for records rather than features**: a ledger's value is its rows, not its widgets.

**The whole catalog is specced, with one exception.** Every remaining ○ waits on implementation rather than a decision, **except #62**, which carries one open ruling: whether HQ scans imported material for patient identifiers or only warns (`03-clinical.md` §16.4). **Decide before #62 ships, not after.**

## Part 2b — Rulings (Andy, Aug 2026) — these override the rows above

### R1 · Skill tracking is CUT to one free-text line ✂

The observed/performed **count** is false precision. *"180 vitals"* only exists if someone logs each instance, and nobody will. What is actually true is *"I did vitals routinely"* vs *"I watched once"* — one sentence. The only two moments this data is ever used are writing the 700-character AMCAS description and answering *"what did you actually do?"* in an interview; both are served by prose, not a counter. A skill grid is engagement theatre on a pillar whose whole job is honest capture.

- **#26 (observed/performed counts) — REJECTED.**
- **#25's six hardcoded skill chips — DELETE**, do not build on them.
- **Replacement:** one optional free-text field on the role, *"What you actually do here"*, feeding the AMCAS description.
- ⚠ **`03-clinical.md` §2.6 must be rewritten** — it currently lists observed-vs-performed as one of six clinical-unique headline features. It is not one.

### R2 · Paid/volunteer is INFERRED and hidden, not user-managed

The objection was that Clinical and Volunteering are already separate tabs, so the field is redundant. **They split on patient contact, not on pay** — AMCAS files clinical work under two categories that are *both* clinical: *Paid Employment — Medical/Clinical* and *Community Service/Volunteer — Medical/Clinical*. A hospice volunteer and an EMT are both Clinical-tab records exporting to different places, so the tab structure does not encode it.

**But the UI objection stands.** Resolution:

- The field **stays in the data model** (#16 remains) — export correctness depends on it.
- It is **inferred from the role**, never presented as a chip the student sets.
- It surfaces in **exactly one place: the AMCAS export preview** (#48, owned by Profile/CV per views-board V3), where it is editable.
- No paid/volunteer control appears anywhere in normal logging.

### R3 · Presets are USER-DEFINED (Notion-style), not a fixed catalog

The mocked 9-card grid is **rejected**: someone who will never be a phlebotomist scrolls past it forever, and HQ would own a curated role taxonomy that goes stale.

**Type-to-create instead.** You type your role once, it is saved, and it is in the dropdown next time — the Notion select-property model.

- **Free text is the primary path.** Any string is valid and is remembered.
- **Suggestions appear as you type**, so a brand-new user with an empty dropdown still gets help: typing `EM` offers `EMT` with what HQ knows about it.
- An unrecognised role simply saves and is learned — **no dead end, no "other" bucket.**
- Known roles still carry their seeded classifier verdict and inferred pay type (R2); unknown roles carry nothing and ask nothing.
- ⚠ **`clinical-role-presets.html` Frame 1 needs re-mocking** — the card grid is superseded by the type-to-create field.

---

### R4 · Wave 2 is closed (Aug 2026)

All of #12 through #19 are decided and written into `03-clinical.md`:

| # | Outcome | Spec |
|---|---|---|
| 12 | Reduced to a **mis-filing catch**; silent on clear roles | §2.1 |
| 13 | **Deferred** — tagged silently, surfaced once in the pre-cycle review | §2.1, §7 |
| 14 | Route to Volunteering, sessions intact, never automatic | §7 |
| 15 | Route from Shadowing, **inverted copy** (it is good news) | §7 |
| 16/17 | Paid/volunteer **inferred and hidden**, export preview only | §2.2 |
| 18 | **Hour ownership** stated normatively with a grep-checkable criterion | §2.0 |
| 19 | Primary-care loop — already built | — |

**Mockups:** `04-clinical/clinical-role-typeahead.html` (12, 13, 14) · `03-overview/overview-where-i-stand-expandable.html` (18 made visible).
**Still undrawn:** 15, which is 14's component with different copy.

---

### R1-a · One narrow version of skills returns, as a RECALL AID (revised Aug 2026)

R1's cut of the observed/performed counter **stands**. What changed is a fact it rested on: the original argument was that any skill list would be **invented**. After R7, that is no longer true. Scope of practice is published — NHTSA maintains a National EMS Scope of Practice Model and states publish their own, so what an EMT may legally do is a documented list.

**What comes back, and only this:** a **sourced scope checklist shown once, at writing time**, inside the AMCAS export preview (#48). **Mockup:** `mockups/04-clinical/clinical-scope-recall.html`.

- **It lives in the export preview and nowhere else.** Not the pillar page, not the shift log, not the site workspace, not Overview.
- **Once per role.** Tick, seed the draft, the list closes. Reopenable on demand from the description field, never pushed again.
- **Checkboxes, never counts.** No observed/performed, no frequency, no per-shift tracking.
- **Nothing preselected.** HQ does not know what you did. An empty set is a valid answer.
- **It seeds, it does not write.** Ticked items become an editable comma list. No generated prose.
- **Free text (#27) stays the primary path.** The checklist is an optional assist for a blank box.
- **Dormant where unsourced.** A role with no verified published scope gets the free-text field alone and **no list at all**, per R7. A confidently wrong scope list is worse than a blank field, because a student might put it in their application.

**Why this is not the tracker that was killed:** that one asked the student to maintain counts across two years so a number could exist. This asks one question, once, at the only moment the answer has value.

### R5 · CE tracking REINSTATED, held as sourced reference (#22) — revised Aug 2026

**The original cut was wrong on the facts.** It rested on "CE is not a standardized unit." It is. NREMT's **National Continued Competency Program** requires **40 credits** for EMT recertification across three defined components (national · local/state · individual), on a two-year cycle, and the 2025 NCCP model has been in effect since 1 Apr 2025. State requirements sit alongside it and differ by jurisdiction.

**Andy's standing instruction (Aug 2026):** *"if CE is required and known standardized unit of measurement for EMTs then yeah by all means — in fact i encourage staying in tune with current standard protocol for all medical positions."* See R7.

**What survives from the original objection:** NREMT's portal is the source of truth and a hand-maintained copy drifts. That governs *how* HQ holds it, not *whether*.

**Revised design:**

- **The requirement is Category A reference data** — sourced, dated, per credential and per jurisdiction, refreshed on the same cadence as other Category A sets (`implementation/data-refresh.md`). *"EMT · NREMT NCCP · 40 credits · 2-year cycle."*
- **Progress is optional and user-entered.** HQ never computes, infers, or estimates credits.
- **HQ states who is authoritative**, in the UI, at the point of use: NREMT and your state office hold the real record.
- **Nothing is blocked or halted** by CE progress. R6 still stands in full.
- **Dormant when unknown.** A credential HQ has no sourced requirement for shows name and expiry only, and says nothing about CE rather than inventing a target.

### R6 · There is no lapsed-cert consequence (#24)

**Ruled by Andy, Aug 2026:** *"why do you think a person wouldn't just renew it?"*

Correct, and it removes the feature. The pace projection assumes the student keeps working, and **an expiring credential does not change that assumption**, because the overwhelming default is that people renew. Halting the projection would model a failure that is not going to happen.

- **The projection continues unchanged** when a cert nears or passes expiry.
- **The cert nudge is a reminder and nothing more.** It does not touch the role, the projection, or hours already logged.
- **The two never interact.** No coupling exists anywhere in the code or the copy.
- ✅ **`03-clinical.md` §2.5 corrected** (Aug 2026) — the "stops the hours" claim is deleted, along with CE progress in §5.
- **What still covers the real case:** if the student actually stops working, **#33 stale-exposure** catches it, driven by logged shifts rather than a credential date. That is the honest signal.

### R7 · Stay current with real credential and scope standards (STANDING · applies to every pillar)

**Andy, Aug 2026:** *"i encourage staying in tune with current standard protocol for all medical positions."*

Where a real credentialing body publishes a standard, **HQ uses the real thing rather than a plausible-sounding approximation.** This binds beyond CE:

- **Credential requirements** — NREMT NCCP for EMT/AEMT/Paramedic, state EMS office rules, BLS/ACLS cycles, CNA registry renewals, phlebotomy certifications. Sourced, dated, jurisdiction-aware.
- **Role and scope language** — what an EMT, MA, scribe, CNA, or PCT may actually do differs by state and by certifying body. HQ's copy must not describe a scope of practice the student does not have.
- **All of it is Category A**: sourced, dated, freshness-tracked, and **cut rather than approximated** when it cannot be verified. A confidently wrong credential requirement is worse than a blank field.
- **Never a substitute for the authority.** HQ points at NREMT or the state office; it does not present itself as the record.

⚠ **Open research** flowing from this rule: NREMT NCCP component split · NC EMS state requirements · BLS/ACLS cycle lengths · CNA registry renewal rules. None are hard-coded until sourced.

### R8 · The hours chart is bars, not a line — and it absorbs #35

**#34 is NOT the GPA chart.** The GPA tile uses a term-by-term trend line, which is right for GPA because a GPA is a **level** that moves both directions. **Cumulative hours only go up.** A cumulative line has the same shape whether the student worked every week or stopped for two months and then crammed, so it praises them regardless. It is not information.

Clinical's signals are **recency and steadiness** (§2.3), so the **default** is **hours per month, as bars**: even bars mean sustained, spiky means bursty, an empty bar means you stopped. Estimated backfill blocks render hatched and separate because they never feed weekly pace.

**Cumulative is a second view, not a reject** (revised Aug 2026, Andy): *"the user could benefit from two different views. hours per month being the default, but if the user wants to see total hours, what do they do?"* The flattery problem was about cumulative being **first**, not about it existing. Nobody is misled by a chart they asked for, and *"when did I cross 250?"* is a real question when writing dates into an application.

- **A segmented switcher in the panel header** toggles Monthly / Total. It is a **filter, not a mode**, so per `01` §4b-i it is a solid form control — the same component as the Assignments Agenda/Weekly/Calendar switcher, **not** a glass mode pill.
- **Hover shows both numbers in either view** (*"31h in March · 284h total by then"*), so nobody switches just to read one figure.
- **Not a dual-axis combo chart.** Two scales in one frame is a known way to mislead; the reader picks whichever crossing looks meaningful.

Also excluded from this chart: no goal line or target band (a target is optional, §7a, and drawing one turns description into a scoreboard), no trend overlay or moving average, no projection — #32 says the forward-looking part in words. Axis starts at zero.

**#35 gap narrative is DEMOTED (Andy, Aug 2026):** *"gap narratives are not realistic. nobody using premed hq is just gonna have a gap all of a sudden."* Right. It was going to be a feature that noticed a break and wrote a sentence about it. **The empty bar already does that**, with no machinery, and only when there is something to see. It becomes a note on #34, not a standalone feature.

**#36 setting mix — mocked so it can be judged on sight** (`mockups/04-clinical/clinical-hours-chart.html` Frame 2). **Lean cut.** Nobody judges setting variety; Shadowing owns breadth as a real metric; it restates the site list one screen away; and it invites bucket-filling toward a balance nobody asked for. The one real use is at **writing time** ("EMS, inpatient, ED and clinic" is a sentence worth having), which means it belongs as one line in the export preview rather than a panel on the pillar.

---

## Part 2c — The big swings, added Aug 2026

**134 rows and not one of them helps a student get a clinical position.** **Every wave above improves what happens after someone already has one** — the record, the classification, credentials, recency, verification, reflection.

**And `C-BIG-1` had been sitting in `07-campus-layer-board.md` §5 unassigned**, the same way `R-BIG-1` sat there until it was moved into Research this week.

| # | Feature | Surface | AI | St | |
|---|---|---|---|---|---|
| **C-BIG-1** | **The application cycles nobody publishes together** | Sites (page)? | ○ | `open` | **Migrated from the campus board** |
| **C-BIG-2** | **How to get the first clinical job** | Sites (page)? | ○ | `open` | Scribe · EMT · CNA · PCT |
| **C-BIG-3** | **The credential *pathway*, not just the credential** | Sites (panel) | ○ | `open` | **The gap Waves 3 leaves open** |

### `C-BIG-1` — the application cycles nobody publishes together

**Hospital volunteer programs, scribe cohorts, and EMT courses all have windows that open and close. Missing one costs a semester**, and they are published in a dozen unrelated places, never together.

- **Category A**, sourced and dated. **The window dates are what rot** and carry their own `freshness`.
- **Surfaced before they open, not when they close.** **`U-3`** — competes in the attention auction.
- **Pairs with `S-BIG-1`**, which sources the shadowing half of the same institutions. **One research ask covers both** (#5).

### `C-BIG-2` — how to get the first clinical job

**Scribe, EMT, CNA, and patient-care tech are the highest-value clinical roles a premed can hold**, and they are posted across hospital career pages, staffing agencies, and campus boards with nothing collecting them.

- **Curated listings, linked out. Never scraped** (`03-clinical-board.md` §5).
- **This is the pillar's real empty state.** A student opening Clinical with zero sites is not looking for a logging form — **they are looking for a way in**, and the page currently offers *"add your first site."*
- **Same shape as `RS-BIG-2`** (Research's ask tracker) **but without the tracker** — `U-7` and the `S-36` precedent mean HQ lists opportunities and records nothing about applying.

### `C-BIG-3` — the credential pathway, not just the credential

**Wave 3 tracks credentials a student already holds. Nothing tells them how to get one.**

**To work as an EMT you need a course, then the NREMT exam, then state licensure — a sequence with real durations and costs.** CNA needs a state-approved program. **A student who wants clinical hours often does not know these paths exist, how long they take, or what they cost.**

- **`○` deterministic.** Sourced steps, durations, approximate costs, and where to enrol locally. **Category A.**
- **It is the natural extension of a section that already exists** — Clinical owns credentials, and it currently owns only the half that comes after.
- **It ties into `L-D`** (finances) and **`L-A`** (a 120-hour EMT course is a real capacity claim, not a plan).
- **Never a recommendation.** **HQ never says a student should become an EMT** — `U-8`. It says what the path is if they want it.

> **All three are `open`.** **`C-BIG-1` and `C-BIG-2` need research ask #5** (already logged); **`C-BIG-3` needs a new one** — *NC EMT / CNA / PCT certification pathways: steps, sequence, duration, approximate cost, and local enrolment routes.*
>
> ### ✅ RE-REVERSED (Andy, Aug 2026): Clinical DOES get `Discover`. Four sub-tabs.
>
> > *"Maybe that could also be a thing for clinical, where you look for jobs and volunteering opportunities. **Maybe Discover could actually be its own tab through all of them.**"*
>
> **`Sites · Shifts · Reflections · Discover`.** **`C-BIG-1` and `C-BIG-2` are no longer homeless — this is their home**, and the *"page-level discovery section on `Sites`"* lean below is **withdrawn**: it was a workaround for a tab that did not exist, and it would have buried the content one level too deep.
>
> **What Clinical's `Discover` lists:** **paid clinical roles** — scribe, EMT, CNA, PCT, medical assistant — **plus hospital volunteer program windows** (`C-BIG-1`'s dated application cycles) and **the certification pathways** (`C-BIG-3`).
>
> **Two guards carried in from `05` §2a-ii, both binding:**
> - **`U-8` still applies with force.** **HQ never says a student should become an EMT.** **`Discover` says what exists and when it opens. It does not advise.**
> - **⚠️ The tracker question is OPEN and it bites hardest here.** **Paid roles are applied to, not attended.** `05` §2a-ii records three options and my lean (a single `saved` flag, no pipeline). **Unruled — do not build the applied/rejected columns.**
>
> **⚠️ Sourcing: `05` §2a-ii records that Indeed has no usable API** (Publisher Program closed 2022, API deprecated 2024). **UNC Handshake is the likelier source and its access model is unverified — a research ask.** **The fallback is a hand-built cited list.**
>
> *(Superseded text, kept as the record: `03-clinical-views-board.md` §3's three tabs were held on Andy's earlier* "it should really just be in ECs." *That ruling was right for its moment — there was no content for a Clinical `Discover` at the time.)*

---

## Part 3 — Ruled out (from the board, restated)

Streaks on shifts · a blended "clinical readiness score" · comparison to other applicants · silent auto-classification · **any PHI or patient-identifier field** · scraping hospital volunteer portals · a second calendar.

---

## The reflection mechanism — Clinical invented the parts and never named the whole

> **Added Aug 2026 after the S12 audit.** **This pillar is the odd case: it built the pieces and never assembled them.** `#45a` (the unpacking marker), `#45b` (synthesis threads), and `#70` (the outstanding count) were all invented here — **and three more pieces were never built anywhere until Extracurriculars needed them.**
>
> **`05-experience-pillar.md` §2b-ii is now the canonical mechanism** and this pillar inherits it like every other. **It is not retyped here.**

| # | Status here | Clinical's own part |
|---|---|---|
| **`RM-1`** · the moments HQ asks | **OWED** | **Nothing in Clinical asks for a reflection.** `#45a` marks a shift as unpacked; **nothing fires the prompt.** Triggers available and unused: **a shift ends · a role ends · a credential renews** |
| **`RM-2`** · reflection as conversation | **OWED** | Clinical's prompt is the generic one. **`R-S2` on Shadowing already ruled that copy is configured and machinery is shared** — the machinery is this |
| **`RM-3`** · search your own writing | **OWED** | **Clinical will hold more reflections than any pillar in the app and has no way to find one.** The sharpest instance of this gap |
| **`RM-4`** · synthesis threads | **HAS IT** — this is `#45b` | Invented here. **`05` §2b-ii is now the shared definition; `#45b` is the Clinical instance** |
| **`RM-5`** · the unpacked headline | **HAS IT** — this is `#70` | ***"14 threads · 9 shifts not yet unpacked"* in the filter bar, never a badge.** **Promoted Aug 2026 to the app-wide standard** — every pillar's writing surface now carries this line in its own vocabulary |

### Clinical's `RM-1` trigger list

**Supplied here; the mechanism is `05` §2b-ii.**

| Trigger | Note |
|---|---|
| **A shift ends** | **The default and highest-volume trigger.** Subject to the attention auction like everything else — **a student logging four shifts a week is not prompted four times** |
| **A role ends** | The arc closed. **Pairs with the scope-recall aid** |
| **A credential renews or lapses** | **A real moment of reflection nobody uses** — renewing an EMT cert is a marker of a year of work |
| **NEVER on an estimated backfill block** | **`RM-6`.** No marker, no trigger, ever |

**Prompt copy stays Clinical's existing chips (#45).** **`R-S2` already ruled that copy is configured per pillar and machinery is not forked.**

**The lesson worth keeping:** **`#70` was the right answer for five pillars and sat in one file for months.** A feature invented on the pillar that needed it first is not a pillar-specific feature — **and nothing in the process caught that until an asymmetry audit did.**

## Universal rules applying to every row above

> ⚠️ **MOVED Aug 2026 → `specifications/05-experience-pillar.md` §2b, and expanded from six rules to nine.**
>
> **A rule governing seven pillars cannot live inside one of them.** §2b is now the canonical home and every catalog references it. **The list below is retained verbatim so this file still reads standalone, but §2b is authoritative** — it adds `U-7` (no non-events), `U-8` (decline to assert, never withhold), and `U-9` (nothing scored or ranked), all of which were established elsewhere and were never written down here.
>
> **`R7` stays in this file** — it is a standing instruction that happens to have been written here, and §2b points at it rather than moving it.

- Each smart feature **states its cause** and is dismissible; none fires more than once per cycle.
- All seven §7 smart features are **deterministic** — none of them needs an AI key. **One exception exists outside that list**: #45a's reflection deepening is genuinely LLM-backed, provider-agnostic per `02-mcat.md` §3.4, with a no-API fallback that keeps the prompt catalog and freeform field fully working. It is optional and never in the base logging path, so its absence never blocks a shift from being logged.
- Every nudge competes in the **3-per-week attention auction** (`01` §6.11), **and routes through the shell Attention model with a severity** rather than rendering independently on the page (#56, §7g). The auction is per-feature; §7g is the per-pillar obligation that the auction alone does not enforce.
- Probabilistic outputs render as **intervals, never point estimates** (`01` §6.12).
- Insufficient data → **dormant with a reason**, never a zero or an empty chart (`01` §6.10-A).
- Hours live in **exactly one pillar**; cross-links never double-count.
