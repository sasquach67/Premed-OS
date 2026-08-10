# Research

> **Governed by:** `specifications/05-experience-pillar.md` for the SHARED FRAME ONLY (`05` makes no per-pillar claims; this file is the source of truth for its own domain). This file is the **domain depth** for Research: the function, entities, smart features, and admissions reasoning unique to scholarly work. The shared frame (compact stat strip, experience list as hero, center-peek inspector) comes from `05`.

**Status:** Designed (August 2026)
**Sidebar group:** Experiences · **Spec type:** domain tab
**Repo:** `sasquach67/Premed-HQ` — `src/pages/ExperiencePillar.tsx` (shared builder), Research config + `ResearchWorkspace`
**Depends on:** `specifications/00-product-shell.md`, `01-shared-interface-patterns.md`, `04-visual-craft-standards.md`, `05-experience-pillar.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Research experiences (labs/projects), the **output pipeline** (posters, abstracts, presentations, manuscripts, publications), lab-notebook entries, authorship records.
- **References only:** People (PIs, grad-student mentors, collaborators), organizations (labs, institutions, conferences), Story Bank, Profile/CV, Letters (PI as the strongest recommender), Timeline (external deadlines).

---

## 1. Purpose

Turn time in a lab into **concrete, dated, citable lines** — what the project was, what the student actually did, what came out of it, and where each output stands. Research is the pillar where effort and evidence diverge most violently: two years of pipetting with nothing recorded produces one weak activity entry, while the same two years with tracked outputs produces a poster, an abstract, a presentation, and a PI who can describe specific contributions. This page exists so the second outcome is the default.

## 2. What makes Research unique (do not generalize)

Seven things live *only* on this pillar:

1. **It is output-shaped, not hour-shaped.** Hours are the weakest signal in the entire experience section here — "1,200 hours in a lab" says almost nothing, while "second author on a poster at ACS Spring" says a great deal. **The output pipeline is the hero and hours are a secondary field.** This inverts every other numeric pillar and is the single most important rule on the page.
2. **Authorship position is a tracked, negotiated fact.** Expectations must be discussed early and are almost never revisited until a manuscript is being submitted, at which point the student discovers they are not on it. HQ tracks **expected vs confirmed authorship per output**, and prompts the conversation while it is still cheap to have.
3. **Outputs have external, immovable deadlines.** Abstract submission windows and conference dates are set by other institutions and do not move. These are the only experience-pillar deadlines that behave like exam dates. **Research owns them** — the date lives on `ResearchOutput.deadline` (§4) and surfaces in the **Attention bell**. *(Revised Aug 2026: these used to be described as belonging "on the Timeline." Timeline is now the four-year roadmap only, and a submission window is a term-scoped date.)*
4. **Independence is the real progression, and it is describable.** *Washing glassware → running a protocol → designing an experiment → interpreting and writing.* Adcoms and interviewers probe exactly this. The page captures **role progression within one project**, not just a job title, because "research assistant for two years" hides whether anything changed.
5. **Research type changes what "output" even means.** Wet lab, dry/computational, clinical research, and social-science research have different cadences and artifacts — a clinical project may produce a chart review and an IRB protocol before any poster. **Type is captured and the output vocabulary adapts**; a single hard-coded poster-and-paper pipeline misrepresents most non-wet-lab work.
6. **The PI is usually the strongest letter in the file**, and the relationship is long, sparse, and easy to let go cold. Meeting cadence and open asks are tracked because a PI who has not heard from a student in eight months writes a thin letter.
7. **The arc outlives the semester.** Projects routinely span years and gap years, so the record must be **longitudinal from day one** — the same structural rule Academics locks in `01` §6.9. A term-scoped research record is worthless by application time.

## 2a. What this tab is FOR — from lived experience (Andy, Aug 2026)

**Everything above §2a was written by inference. This was written from a real year-long project** — black garlic extract, DPPH antioxidant assays — **and it sharpens the pillar's purpose.**

> *"It's supposed to be an interface for keeping track of your current research projects… you're tied to one lab, or maybe two, but normally just one lab throughout your entire undergrad… **it's basically a hub.**"*
>
> *"It's different than extracurriculars where you're trying to find opportunity. **It assumes that you have one early on and that you stick with it.**"*

| | Extracurriculars | **Research** |
|---|---|---|
| Shape | **Breadth.** Many orgs; finding new ones is half the job | **Depth. One lab, maybe two, for four years** |
| The tab's job | Track what you are part of + discover more | **A working hub for the projects you have** |
| Discovery | First-class | ***"Perhaps a feature. Not the main point."*** |

**The comparison that fits is Academics' Class Hub, not ECs' Organizations.** **You have one lab the way you have one course, and the tab exists to help you do the work.**

**⚠️ This ranks `Discover` below `Projects` in importance without removing it.** **`Discover` exists (§5-0) and serves students who have no lab yet — but the pillar is not built around them.**

### The retrieval problem, which is the pillar's hardest

> *"I documented everything, but it was really hard to go back and recall… it was a hassle to go back and look at previous material **instead of having it be handed to me.**"*

**Capture was never the problem. He captured everything.** **Retrieval was.** **He suspected a confounding variable and could not check, because he could not find the prior conditions** — **a scientific failure, not an admin one.**

**This is why `N-10` survives the `U-12` cut** (*"show me every DPPH run on extract B, in order"*) **and why the assistant is a second mode of search rather than a new surface** (`U-11`).

## 3. Primary users and stages

- **Seeking a position:** has no lab yet. Needs the ask tracked — who was emailed, when, and what came back — because this stage is mostly rejection and students lose the thread.
- **Early in a lab:** doing low-independence work. Needs role progression and the authorship conversation prompted.
- **Productive:** has outputs in flight. Needs the pipeline, deadlines, and status.
- **Application year:** needs outputs formatted for AMCAS, the PI converted into a letter, and the contribution described accurately.

## 4. Core entities

- **`ResearchExperience`** — lab/project: `title`, `piId`, `institution`, `researchType` (`wet-lab | computational | clinical | social-science | other`), `startDate`, `endDate?`, `status`, `hours` (secondary), `roleProgression[]`, `description`.
- **`ResearchOutput`** — the pipeline record: `type` (`poster | abstract | oral presentation | manuscript | publication | preprint | thesis | protocol/IRB`), `title`, `venue`, `deadline?`, `submittedDate?`, `status` (`planned | drafting | submitted | accepted | presented | published | rejected`), **`authorshipExpected`**, **`authorshipConfirmed`**, `citation?`, `link?`, **`derivedFrom[]`** (`RO-2` — the paper descends from the proposal, the data, the literature), **`internalDeadline?`** (`RO-6` — the PI's date, not the venue's), **`coAuthors[]`** (shared `Person`), **`feedbackReceived[]`** (`RO-10`, dated).
  **`type` gains `proposal`** (`RO-1`) — the first original work most students produce and the enum had no word for it.
- **`LabNote`** — dated entry: **the decision, result, anomaly, or blocker.** Feeds both the record and the Story Bank. **⚠️ REVISED Aug 2026 (`U-12`): this is NOT a bench record.** **No trial/replicate/condition structure, no raw measurements, no photos** — UNC licenses LabArchives to undergraduates free and HQ does not rebuild it worse. Carries **`elnLink?`** and a handful of summary values (`N-11`).
- **`ResearchDecision`** — **NEW Aug 2026 (`R-7`).** `date`, `whatChanged`, `why`, `significant: boolean`. Andy: *"there is nothing really on paper to track that a change had happened with the experiment and why."* **The one thing an ELN does badly and the reason `Lab notes` survives at all.**
- **`Paper`** — **NEW Aug 2026 (`B-1`).** Citation string · link · **the student's summary in their own words** · `zoteroKey?`. **`ShelfItem` reused from MCAT's Bookshelf.** **⚠️ Not a citation manager — see §14.**
- **`Presentation`** — **NEW Aug 2026 (`RO-12`).** An occasion on which an output was shown: `outputId`, `venue`, `date`. **One poster at three venues is one `ResearchOutput` and three `Presentation`s.** AMCAS asks for both and the old schema could only answer one.
- **`PIRelationship`** — a `Person` record plus `meetingCadence`, `lastContact`, `openAsks[]`, `letterStatus`. **Shared with Letters — never forked.**
- **Derived:** independence level, output counts by status, next external deadline, contact recency.

## 5. Core views (master–detail — inherits the shared frame)

### 5-0. Sub-tabs — RULED Aug 2026 (closes `RS-31`)

**`Projects · Outputs · Lab notes · Reflections · Discover`. Five — the most of any pillar, and every addition is argued.**

| Slot | Other pillars | **Research** | Why |
|---|---|---|---|
| The relationship | Sites / Orgs / Physicians | **`Projects`** | Standard |
| The ledger | Shifts / Events / Visits | **`Outputs`** | **The pillar's inversion — the ledger is artifacts, not hours** |
| The writing | Reflections | **`Lab notes` + `Reflections`** | **Two, deliberately.** A bench log is operational and five seconds; **running `RM-2`'s conversation against it would be absurd** |
| Discovery | ECs only → **now all five** | **`Discover`** | **Venues, grants, labs, events** |

**A project opens as a full page, not a panel** — the Academics Class Hub pattern, reused (also the ECs Org Hub). **Never fork the component.**

- **Stat strip (variable metrics only):** active projects · **outputs** · next deadline · last PI contact. **Hours are not in the strip** — they do not change often enough and are not the signal.
- **Research outputs is the hero** — project/output · type · venue · deadline · status. **Already built** (`ExperiencePillar.tsx`), and correctly framed there as *"translate time in the lab into concrete lines for a CV and application."*
- **Lab notebook** as the working surface, with `Meetings with PI` beside it — the shipped `ResearchWorkspace` already carries authorship expectations as a standing agenda item, which is the right instinct and should be preserved.
- **Center-peek inspector** per project: role progression, outputs, PI, recent notes, one primary action.

## 6. Main workflows

- **Log a lab note in under 5 seconds** — date plus one line. The prompt is specific: *"the experiment, decision, result, or output."*
- **Create an output and move it along the pipeline** — status transitions are one tap and dated, so the record is a history rather than a current state.
- **Record the authorship conversation** — expected position, date discussed, confirmed position.
- **Track the ask** (pre-position) — lab, professor, date emailed, response.
- **Convert the PI into a letter request** — deep-link prefill only.
- **Export outputs** in AMCAS-appropriate shape, publications listed separately from the activity entry.

## 7. Smart features (rules-based, explainable — `architecture/02`, `general.md`)

- **Output-gap detection** — sustained time with nothing in the pipeline: *"14 months in the Okonkwo lab, no output recorded. Is there a poster or abstract you could target?"* The pillar's highest-value nudge, and the one that changes outcomes.
- **Authorship conversation prompt** — fires once a project passes a meaningful duration with no authorship record: *"You haven't recorded an authorship expectation for this project. It's a much easier conversation now than at submission."*
- **Authorship drift** — expected and confirmed disagree; surfaces plainly without editorializing.
- **External deadline surfacing** — abstract windows and conference dates flow to **the Attention bell**; these are hard dates and are treated as such. **Research keeps the record** (Aug 2026); no other tab stores a copy.
- **PI contact staleness** — a long-running project with no logged meeting: *"No recorded contact with Dr. Okonkwo in 4 months. Letter strength tracks contact."*
- **Independence stagnation** — role unchanged over a long arc: *"Your role has read 'research assistant' for 18 months. If that's changed, say how — interviewers ask."* Descriptive, never scolding.
- **Type-mismatch catch** — a computational project being nudged toward wet-lab outputs; the vocabulary adapts instead.
- **Unlinked note** — a lab note with essay material not yet sent to the Story Bank.
- **What is next on this project** (`R-9`) — **the one-question hero pattern from MCAT #34.** Answers *"what should I do right now?"* **with a reason**: *"DPPH run 4 on extract C is the only trial without a replicate."* **States the gap; never instructs** (`U-8`).
- **Last time I ran this** (`N-10`) — **deterministic, a filter and not an AI.** Operates over `N-11`'s summary values. **The literal question from §2a.**
- **Unused literature** (`B-4`) — *"14 papers. 4 are cited in something you wrote."* **At draft time, once. A count, never a judgement.**
- **Hand me the sources** (`RO-3`) — at drafting time, **assemble the notes, decisions, and papers this output descends from** (`derivedFrom[]`). **`U-10` governs: HQ assembles and hands over. The student writes. It never drafts the paper.**
- **Never** surface hour goals, pace projections toward an hour target, streaks, or recency-staleness on *hours*. Research gaps are normal; output gaps are the real signal.

## 8. Visualizations

- **Output pipeline by status** (compact) — planned → drafting → submitted → accepted → presented/published.
- **Project timeline** (small, bounded height, `01` §5c) — the arc, with outputs as markers on it. This is the one place a longitudinal view earns space.
- **No cumulative-hours chart** and **no productivity score.** Output counts are small integers; a chart of them is noise, and a blended score would be invented.

## 8a. Components used (feature → library component)

| Feature | Component |
|---|---|
| Stat strip | `PillarShell` banner + `BannerStat` |
| Output pipeline table | `TrackerTable` (solid rows — `04` §0c) |
| Lab notebook | `ExpandableEntryRow` + `InlineAddRow` |
| PI / collaborators | `ContactCard` (shared with Letters) |
| Deadlines | A field on `ResearchOutput`, surfaced via the **Attention bell** — never a second calendar (`01` §6.9), never a Timeline record (Aug 2026) |
| Gap / authorship notices | Shared intelligence panel (same component as Overview Smart next actions) |
| Teaching copy | `MascotNote` — `teaching` and `empty` variants |
| Empty states | `MascotNote` empty variant + first action |

## 9. Cross-tab relationships

- **Letters** — the PI is typically the strongest recommender; conversion is a deep-link prefill only.
- **Timeline** — **no deadline relationship** (revised Aug 2026). The only tie is that *"first publication"* is an **achievement** Timeline reads from this pillar (`11-timeline-tasks.md` § Achievements). Deadlines go to the Attention bell; HQ reads calendars for context and writes only its own dates.
- **Story Bank** — lab notes and setbacks are unusually good essay material; research failure is a recurring interview topic.
- **Profile/CV** — outputs export as citations, separate from the activity entry.
- **Academics** — a thesis or research-for-credit course is a *course* in Academics and a *project* here; the two link, and **hours never double-count**.
- **Overview** — contributes outputs and next deadline, never an hours figure.

## 10. Inspector design (center peek — `01` §2/§3)

Peek on a project: title, PI, type, duration, current role, output counts by status, next deadline, and one primary action (`Add a lab note`). Expand for role progression, the full output list, notes, and the authorship record.

## 11. Empty, loading, error states (`01` §8, `04` §9)

- **No lab yet:** the empty state is about **the search**, not the work — one action, *"Track a lab you're reaching out to."* Most students meet this page before they have a position, and an empty state assuming otherwise is useless to them.
- **Project with no outputs:** *"No outputs yet — most projects don't have one for a while."* Explicitly not framed as failure.
- **Dormant features say why:** independence stagnation stays invisible until the arc is long enough to mean anything.

## 12. Mobile behavior

Lab-note capture is the mobile-critical flow — one screen, standard `input`/`textarea` so dictation works. Pipeline management is desktop-shaped and may be read-only on mobile.

## 13. Admissions-aware reasoning (`architecture/04`)

- **Outputs and described contribution** carry the weight; hours do not, and HQ never implies they do.
- **Publication is not required** for a strong application and the copy never implies it is — a poster and a well-described role is a complete research story for most applicants.
- **Independence and the ability to explain the project** are what interviews test.
- **Claims are phrased by their evidence** (`01` §6.14): output records are observed facts; "your role has grown" is hedged, because only the student knows what they actually did.

## 14. Do Not Generalize From Other Tabs

- **Do not center hours.** Explicitly rejected — the output pipeline is the hero.
- **Do not import Clinical's recency-staleness on activity.** A quiet stretch in a lab is normal; the meaningful staleness here is **PI contact** and **output movement**.
- **Do not import Volunteering's cause-throughline logic.** Coherence across projects is not expected or desirable.
- **Do not import Shadowing's sufficiency call.** There is no "enough research" bar to declare.
- **Do not invent a productivity or independence score.** Both would be fabricated composites (`01` §6.12).
- **⚠️ Do not build an electronic lab notebook.** **`U-12`.** **UNC licenses LabArchives to undergraduates at no cost.** **No trials, replicates, conditions, raw values, or photo blocks** — two locked constraints agree independently: the **≤5-second logging rule** and the **localStorage quota (`S0`)**. **HQ points out (`N-11`); it does not store.**
- **⚠️ Do not build a citation manager.** **`U-12` again, opposite ruling, and the difference matters.** **A minimal `Paper` record IS kept** — `B-3`/`B-4`/`B-5` need something to point at, and a citation string is neither a quota nor a five-second problem. **But never: bibliography formatting, citation styles, BibTeX/RIS *export*, or stored PDFs.** **The moment HQ formats one bibliography it owes every style forever.**
- **⚠️ Do not sync two-way with anything.** **HQ reads; HQ never writes back.** No backend means no conflict resolution. Applies to Zotero, LabArchives, and anything proposed later.

## 15. Acceptance criteria

- [ ] The **output pipeline is the hero surface**; hours appear as a secondary field and **not** in the stat strip.
- [ ] **No hour goal, pace projection, cumulative-hours chart, productivity score, or streak** exists on this pillar.
- [ ] **Authorship expected vs confirmed** is recorded per output, and the conversation prompt fires once at a meaningful duration.
- [ ] **Output vocabulary adapts to `researchType`** — a computational or clinical project is never nudged toward wet-lab artifacts.
- [ ] External deadlines live on `ResearchOutput` and surface via the **Attention bell**; **no Timeline record and no second calendar** is created anywhere.
- [ ] The schema is **longitudinal, not term-scoped**, from day one.
- [ ] Research-for-credit links to its Academics course and **hours never double-count**.
- [ ] The PI is a shared `Person` record; letter conversion is a **deep-link prefill only**.
- [ ] The no-lab-yet empty state is about **the search**, and the no-output state is **not framed as failure**.
- [ ] **`Lab notes` contains no trial, replicate, condition, raw-value, or photo field** (`U-12`), and offers **one dismissible pointer to LabArchives, never repeated** (`N-12`).
- [ ] **Literature keeps a `Paper` record but formats no bibliography, exports no BibTeX/RIS, and stores no PDFs.**
- [ ] **No integration writes back to an external system.**
- [ ] **A poster shown at three venues produces one `ResearchOutput` and three `Presentation`s** (`RO-12`).
- [ ] **`Discover` records nothing about pursuing an opportunity** beyond whatever open decision 5 rules.
- [ ] Works fully with no AI key — every feature above is deterministic.

## 16. Open decisions

1. ~~Whether `protocol/IRB` and `thesis` are first-class output types.~~ **RULED Aug 2026: first-class.** Otherwise clinical and social-science students face an empty pipeline that misrepresents real work — **which directly contradicts §2.5**, the rule that output vocabulary adapts to `researchType`.
2. ~~Whether role progression is a structured ladder or free-text.~~ **RULED Aug 2026: dated free-text with an optional level.** A fixed ladder does not fit computational or clinical work.
3. ~~Whether rejected outputs stay visible.~~ **RULED Aug 2026: yes, collapsed.** Rejection is normal, it is frequently good interview material, and **hiding it teaches the wrong lesson.**
4. ~~**`RS-31` — the sub-tab set.**~~ **RULED Aug 2026 — see §5-0.** `Projects · Outputs · Lab notes · Reflections · Discover`. **`Discover` was pulled mid-month and restored** once venues and grants were identified; the reversal is preserved in `05-experience-pillar.md` §2a-ii.

### Still open

5. **The `saved` flag on `Discover`.** **`Discover` is a resource, not a tracker — no application pipeline** (`05` §2a-ii). **That guard was written for clubs and events, which you attend. Venues, grants, and lab positions you APPLY to.** Three options recorded in `05` §2a-ii; **lean: a single `saved` flag and nothing more.** **Blocks all five pillars, not just this one.**
6. **`B-7c` — the Zotero API tier.** **Architecturally confirmed** (Web API v3 supports CORS, read-only user key, no backend needed). **Unruled whether it is worth the setup friction over `B-7b`, the pasted export.**
7. **NPPES CORS** — `SD-3` in Shadowing depends on it and it is documented-but-unverified. **Not a Research blocker; listed because the same sourcing pass covers it.**

## 17. The big swings (Aug 2026 — all four greenlit)

**Full treatment in `06-research-feature-catalog.md` Wave 3.** Summarised here because they are the largest additions this pillar has taken.

- **`RS-BIG-1` · The lab directory.** Who takes undergraduates, what they work on, whether they are recruiting. **Category A, sourced, never scraped.** *"Students find labs through friends, which means students without the right friends do not find labs."* **The recruiting field carries its own date — a stale "recruiting" is worse than no field.**
- **`RS-BIG-2` · The ask, tracked.** Lab · professor · date emailed · response · follow-up due. **The stage most premeds are in, for the longest, with the least help**, and §11 already calls it this pillar's real empty state. **No reply is not a rejection and is never counted as one** — no rejection count, no response rate. **Blocked on nothing; build this first.**
- **`RS-BIG-3` · Cold email templates.** Category B, sourced, cited. **HQ never sends anything** — copy to clipboard or open the mail client prefilled.
- **`RS-BIG-4` · Research events into `Discover`.** **Reuses `EV-1` wholesale** (`07-campus-layer-board.md` §2d). One more consumer, typed to research. **Never a second event system.**

---

## 18. Board migration — Aug 2026

**`06-research-feature-catalog.md` was built and ruled in full this month.** This section records what moved into this spec so the two files do not drift.

| Wave | What it settled |
|---|---|
| **0** | **The reframe** (§2a) — a working hub, not a discovery surface. The DPPH case. Retrieval as the hard problem. **The decision log (`R-7`) and output lineage (`RO-2`) were the only two genuinely new mechanisms**; nine of eleven had existing patterns in the repo |
| **3** | **`RS-BIG-1`–`RS-BIG-4`**, greenlit (§17) |
| **7a** | **`Projects`** — `P-1`–`P-10` build. **`P-11` cut** (lab meetings absorbed into `RO-10`). **Collaboration/workspaces cut** — Andy: *"not everyone uses HQ"*, plus the localStorage-first architecture |
| **7b** | **`Outputs`** — `RO-1`–`RO-12` build. **`RO-9` folded into `RO-7`**: if the venue directory carries the venue, it carries its word counts and poster dimensions |
| **7b-x** | **`Discover` restored** — venues, grants, events, labs |
| **7c** | **`Lab notes`** — **`U-12` created here.** `N-1`–`N-4`, `N-8` cut. `N-11`, `N-12` added |
| **7d** | **Literature** — `B-1`–`B-6` build, `B-7` Zotero in three tiers, **and the boundary written as a table** |
| **7e** | **`Reflections`** — `F-1`–`F-9`. **`F-4` (an anomaly resolves) and `F-6` (the setback prompt) are the pillar's distinctive contributions to `RM-1`** |

### ⚠️ Two naming hazards for whoever reads this next

**`U-n` collision.** **Research's `Outputs` features were originally `U-1`–`U-12`, colliding with the universal rules in `general.md`.** **Renamed `RO-1`–`RO-12`.** **Anything written before Aug 2026 saying `U-7` may mean the venue directory.**

**`Discover` reversals.** **Three positions in one month** — ECs-only, then ECs+Research, then universal to all five. **`05-experience-pillar.md` §2a-ii holds all three in order. Read the top of that section, not the middle.**

### Content-blocked, not code-blocked

**`D-1` venues · `D-2` grants · `D-4` labs (`RS-BIG-1`) — plus `SD-1`, `C-BIG-1`, `V-BIG-1` in other pillars.** **These are sourcing passes, not engineering.** **UNC's Office for Undergraduate Research already publishes an opportunities database (`our.unc.edu/find/opportunities/`) — `U-12` says check it before hand-building `D-4`.**
