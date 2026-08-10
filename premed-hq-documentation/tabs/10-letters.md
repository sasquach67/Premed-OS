# Letters of Recommendation

**Status:** Stub — seeded outline (structure + anchors in place; full spec TBD).
**Sidebar group:** Application · **Spec type:** domain tab
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Recommenders, letter requests, status and follow-ups
- **References only:** People, courses, experiences

## Primary metrics (from architecture/04 — domain-appropriate only)

- Recommender category and relationship
- Eligibility, request date, deadline, status
- Supporting materials, school assignment

> **Do-not-generalize anchor:** Letter follow-up cadence is Letters-only; do not generalize the reminder cadence to other tabs.

---

## Purpose

Define the exact user outcome this tab supports.

## Primary users and stages

Which user stages rely on this tab and how needs change over time.

## Core entities

Records that belong here and the universal entities they reference.

## Core views

Purpose-built views, not a copied dashboard.

## Main workflows

Creation, editing, review, planning, export, archive.

## Smart features

Tab-specific rules, alerts, derived properties, recommendations, automations (per `architecture/02`).

## Visualizations

Charts/structures and the user question each one answers.

## Cross-tab relationships

Which tabs consume or contribute data.

## Inspector design

Object-inspector sections and quick actions (pattern: `specifications/01-shared-interface-patterns.md`).

## Empty, loading, and error states

First-use guidance and recovery.

## Mobile behavior

How the tab stays fully usable on small screens.

## Admissions-aware reasoning

What matters here from a pre-med and application perspective.

## Do Not Generalize From Other Tabs

Letter follow-up cadence is Letters-only; do not generalize the reminder cadence to other tabs.

## Acceptance criteria

Measurable implementation criteria (TBD).

## Open decisions

Unresolved design/product questions (TBD).

---

## ⚠️ `U-12` ruling + a SPEC-STALENESS WARNING — Aug 2026

**Full pass: `implementation/U-12-incumbent-audit.md` §3.**

### The staleness warning, first, because it may change this file

**For the 2026 entering cycle and beyond, AAMC launched a Letter Writer Portal that lets applicants send letter requests directly from inside the AMCAS application.** **This file predates that.** **Anything here describing HQ as the place a letter request originates must be re-read against it** — **the request may now start in AMCAS, and HQ's job shifts to tracking rather than initiating.**

**⚠️ Verify the portal's current scope before the next Letters pass.** It was identified by search, not by reading AAMC's own documentation end to end.

### The ruling — CEDE delivery, keep the relationship

**Interfolio Dossier is free to request and store letters, `$59.99` to deliver (50 deliveries), and is a preferred AMCAS service.**

**⚠️ HQ MUST NOT BUILD: letter delivery · letter storage · a waiver or FERPA workflow · anything that RECEIVES a letter from a writer.**

**Confidentiality is the entire product on that side, and HQ has no standing to hold a confidential letter.** **`localStorage` on a student's laptop is the wrong place for a document the student is not permitted to read** — and under HQ's own architecture that is exactly where it would land.

**What HQ keeps, and no incumbent does any of it:** **the four-year relationship that produces the letter.** Who, how strong, last contact, what they were sent, whether the ask went out, and the **deep-link prefill.** **`PIRelationship` and `ContactCard`, shared with Research — never forked.**

**Interfolio and AAMC move the file at the end. HQ is the three years before that.**

---

## ✅ RULED Aug 2026 — Letters KEEPS its own tab

> **Andy:** *"Will letters be its own tab or no?"*

**Yes. `10-letters.md` stands, sidebar group Application.**

### ⚠️ The honest tension, recorded because it may return

**The `U-12` cede made this tab thin.** **Delivery, storage, and the waiver/FERPA workflow all went to Interfolio and the AAMC Letter Writer Portal.** **What remains — who · how strong · last contact · was the ask sent — looks like a VIEW over `Person` records rather than a destination.**

### Why it survives anyway

| | |
|---|---|
| **People is a DIRECTORY. Letters is a PIPELINE** | A contact card holds a person. **It does not hold a four-year relationship with an ask attached, dates, and statuses** |
| **It spans five pillars and no pillar owns it** | **Your PI, your ED supervisor, and your org advisor are three tabs and ONE letter file.** Scoping it to any pillar is arbitrary |
| **Application year concentrates it** | It becomes a cluster of dates and statuses at exactly the moment it matters most |

### ⚠️ Watch item

**This is now the thinnest tab in HQ.** **If the pipeline turns out to be four fields in practice, folding it into Profile/CV is a legitimate option** — **but that is a decision to make after a mockup, not from a spec.** **Recorded so the question is not treated as closed forever.**

---

# THE BRAINSTORM — over-generated, Aug 2026. Nothing ruled; leans marked.

**Standing method: generate liberally, cut in the open. Expect half of this to die.**

## L-a · ⭐ The one I'd build first — the writer's packet

**A writer says yes and then asks *"send me your stuff."*** **Right now the student scrambles: CV, personal statement, a reminder of what they actually did together, the deadline, and where to submit.**

| # | Feature | AI | Lean |
|---|---|---|---|
| **LT-1** | **⭐ Assemble the packet** | ◑ | **STRONG BUILD.** CV lines from Profile/CV · personal statement · **the dates and specifics of what you did WITH THIS PERSON** · deadline · submission route. **The `RO-3` / `E-16` pattern, third instance: HQ assembles and hands over** (`U-10`) |
| **LT-2** | **The reminder paragraph** | ● | **Build.** *"Dr. Okonkwo supervised you Jan 2024–May 2025; you ran the DPPH assays and presented at the departmental symposium."* **⚠️ THE PASTE TEST applies** (`09` §5) — **facts and dates, never a drafted email** |
| **LT-3** | **HQ never sends it** | — | **Guard.** Copy to clipboard or open the mail client prefilled. **Same as `RS-BIG-3` cold emails** |

## L-b · ⚠️ The committee letter — a probable hole

**Many schools run a prehealth committee letter process with its own deadlines, forms, and internal interviews.** **UNC likely has one and nothing in HQ mentions it.**

| # | | Lean |
|---|---|---|
| **LT-4** | **Committee letter as a first-class record** | **⚠️ LIKELY BUILD — but UNVERIFIED.** **Do not spec until UNC's actual process is confirmed.** **Research ask #12** |
| **LT-5** | **Its deadlines are earlier than AMCAS** | **If `LT-4` holds, this is the whole point** — students miss the committee window and lose the letter entirely |

## L-c · Coverage — what the file needs

| # | | AI | Lean |
|---|---|---|---|
| **LT-6** | **Requirements per school** | ○ | **⚠️ CEDE — MSAR holds this** (audit §4). **HQ shows what YOU have; it does not republish requirements** |
| **LT-7** | **What you have vs. what a typical file wants** | ○ | **Weak build.** Two science faculty, one non-science, plus PI/clinical is common guidance. **`U-8`/`U-9` — states the gap, never scores the file, never says it is insufficient** |
| **LT-8** | **A letter-strength score** | — | **CUT. `U-9`.** ⚠️ **Note: the existing spec has *"how strong"* as a field — that is the STUDENT'S OWN judgement, self-entered, and stays. HQ must never compute one** |

## L-d · Timing and the relationship

| # | | AI | Lean |
|---|---|---|---|
| **LT-9** | **Ask lead time** | ○ | **Build.** Common guidance is 4–6 weeks. **Category B, sourced** |
| **LT-10** | **Contact staleness** | ○ | **Already exists in Research** (`06` §7) — *"no contact in 4 months; letter strength tracks contact."* **Generalise it here** |
| **LT-11** | **Send an update before they write** | ○ | **Build.** A writer working from two-year-old information writes a two-year-old letter |
| **LT-12** | **Thank-you note** | ○ | **Weak build.** Real etiquette, but it is a task. **⚠️ Risks turning a relationship into a checklist** |

## L-e · Status, and the `U-7` problem

| # | | Lean |
|---|---|---|
| **LT-13** | **Asked → agreed → submitted** | **Build.** **Three states, and that is the whole pipeline** |
| **LT-14** | **"Declined" / "no response"** | **⚠️ CUT — `U-7`, no non-events.** **The same ruling as `S-36` and `RS-BIG-2`: no reply is not a rejection and is never counted as one.** **If they said no, you remove the row** |
| **LT-15** | **Waiver recorded** | **Build, minimal.** **HQ records THAT you waived, never the letter.** **The waiver is a fact about you; the letter is not yours** |
| **LT-16** | **Chase / nag a writer** | **CUT.** **HQ does not manage a professor's obligations, and a student cannot chase a letter writer without cost** |

## L-f · The `U-12` boundary, restated because it will be tested

**⚠️ FORBIDDEN: letter delivery · letter storage · receiving anything from a writer · a FERPA workflow.**

**`localStorage` on a student's laptop is the wrong place for a document the student is not permitted to read.** **Interfolio and the AAMC portal move the file. HQ is the three years before that.**

## ⚠️ Reading note

**`LT-1` is the tab's reason to exist and everything else is bookkeeping.** **If the packet is not built, this really is four fields and the fold-into-Profile/CV question returns.**

**And `LT-4` is the biggest unknown in the tab — a committee letter process would reshape it, and it is unverified.**

---

# ⭐ THE REFRAME (Andy, Aug 2026) — Letters is not a tracker. It is the years before the ask.

> *"**The backbone of a recommender is that you guys have formed a relationship over time**, so if they could somehow help with that."*
>
> *"While it is an interface where it does show your recommenders, **that's only part of the process of talking to them and meeting them.** I feel like it could maybe **do a background check** and whatnot, **just so you have an idea of what to say when you first try and speak to them** to form that relationship."*
>
> *"**It needs help with the backend stuff… I mean leading up to asking your recommender for a letter.**"*

**This moves the tab's centre of gravity from *"who is writing"* to *"how does someone become willing to write."*** **`LT-1`'s packet is the END of the process. Everything below is the three years before it — and nothing in HQ covered any of it.**

## ⚠️ Two corrections to the framing, before the features

### 1. The barrier is not MOTIVATION. It is not knowing what to say.

**A first-year does not skip office hours because nobody told them to go.** **They skip because they have nothing to open with and do not want to waste a professor's time.**

**⚠️ So a nudge fixes the wrong problem** — and *"you have not spoken to a professor in three weeks"* is a nag about a human relationship, which `U-3` and `U-9` both push against. **Remove the barrier and the going takes care of itself.**

### 2. ⚠️ THE INSTRUMENTALISATION GUARD — write this before building anything here

| | |
|---|---|
| **Legitimate** | **Read a professor's work before office hours so you can have a real conversation.** Normal academic practice, and what any advisor tells you to do |
| **NOT legitimate** | **A dossier compiled to extract a letter from a person** |

**These use the same public information and are distinguished only by framing.** **HQ's copy must sit on the first side, always.**

**And the practical argument matters as much as the ethical one: professors can tell.** **A student who arrives having farmed them gets a thin letter.** **The feature that treats people as targets defeats its own purpose.**

**⚠️ Forbidden by name: a relationship score · a "letter likelihood" · a contact quota · ranking professors by usefulness · anything that makes a person look like a lead in a pipeline.** **`U-9`.**

## LT-g · ⭐ The structural find — Academics already holds your candidate list

**Every class you have taken is in `01-academics`, with the instructor.** **That IS the recommender pool, and nothing connects the two tabs.**

| # | Feature | AI | Lean |
|---|---|---|---|
| **LT-17** | **⭐ A professor record starts at *"I am in their class"*, not *"I need a letter"*** | ○ | **STRONG BUILD.** **The whole reframe in one row.** A `Person` exists from the moment the course does |
| **LT-18** | **Two-time instructors surface automatically** | ○ | **Build — deterministic and free.** **A professor who taught you twice already knows you.** **HQ has this fact and nobody has used it** |
| **LT-19** | **Science / non-science coverage from the course list** | ○ | **Build.** Common guidance wants two science faculty and one non-science. **HQ can see which of your instructors are which.** **`U-8` — states the shape, never says the file is insufficient** |

## LT-h · The background brief — Andy's ask, with the guard attached

| # | Feature | AI | Lean |
|---|---|---|---|
| **LT-20** | **What they actually work on** | ◑ | **Build.** Department page · research interests · courses taught · recent work. **All public.** **⚠️ For research faculty, PubMed E-utilities is free and keyless — but it is `U-12` territory: Google Scholar exists. HQ's layer is that it sits NEXT TO your relationship record, not that it searches better** |
| **LT-21** | **Something to open with** | ● | **Build — and this is the row Andy actually asked for.** *"She works on antibiotic resistance in wastewater; you ran DPPH assays. There is a real question there."* **⚠️ THE PASTE TEST applies** (`09` §5): **a subject to raise, never a scripted line to recite** |
| **LT-22** | **⚠️ Anything about the PERSON rather than their WORK** | — | **CUT, hard.** **No personal details, no social media, no "what they like."** **The line is: their published work and their teaching. Nothing else** |

## LT-i · Office hours as the unit

**`RM-1` proved that a mechanism only works if something triggers it. The same applies here.**

| # | Feature | AI | Lean |
|---|---|---|---|
| **LT-23** | **An office-hours visit is a loggable event** | ○ | **Build. ≤5 seconds.** **The atom of relationship-building, and HQ currently has no record type for it** |
| **LT-24** | **What you talked about** | ○ | **Build.** **This is what `LT-1`'s packet needs three years later** — *"you discussed X in her office in October"* |
| **LT-25** | **A reflection trigger after a real conversation** | ◐ | **Weak build.** `RM-1`, extended. **⚠️ Risk: turns a chat into homework** |
| **LT-26** | **Contact-staleness, generalised from Research** | ○ | **Build, quietly.** `06` §7 already has it. **⚠️ Must read as information, never as a nag about a person** |

## LT-j · Mentors — wider than letters

**Andy said *"mentors"* before he said *"recommenders."* They are not the same thing and the docs have no concept of the first.**

| # | | Lean |
|---|---|---|
| **LT-27** | **A mentor is a relationship with no letter attached** | **BUILD, and it may be the most important row here.** **Not every important person writes you a letter, and a tab that only holds future recommenders teaches the student to see people as instruments** — the exact failure `LT-22` guards against |
| **LT-28** | **A mentor may become a recommender. Never the reverse framing** | **Guard.** **The relationship is the thing; the letter is a possible by-product** |

## ⚠️ Reading note

**This reframe makes Letters one of the more interesting tabs rather than the thinnest.** **The fold-into-Profile/CV question is now closed** — **Profile/CV holds finished artifacts; none of the above is an artifact.**

**`LT-17` is the cheapest and highest-leverage row: it costs a foreign key to Academics and it changes who the tab is for.** **A first-year has no recommenders and six instructors.**

---

## ✅ RULED Aug 2026 — THE DOSSIER. Build it, and call it that.

> **Andy:** *"ok i think a dossier is good"*

**An earlier draft of this file used *"dossier"* as the pejorative — the bad version of `LT-20`. Andy reclaimed it, and he is right to.** **The word was never the problem.**

### What the guard was actually about — and it stands unchanged

**SCOPE, not naming.**

| ✅ In the dossier | ❌ Never |
|---|---|
| **What they research** · recent work · what they teach · which of your courses they taught · **your own history with them** (`LT-23`/`LT-24` office-hours log) | **Anything about the PERSON.** No social media, no personal life, no "what they're like," no third-party opinions, no rate-my-professor |

**`LT-22` is unchanged and remains a hard cut.**

### Why the scope line is the whole feature, not a caveat

**A dossier of someone's WORK is preparation. Any advisor tells you to read a professor's paper before office hours** — the student who does is taking them seriously.

**A dossier of someone's PERSON is surveillance**, and it also **fails on its own terms: professors can tell.** **A student who arrives having researched them as a target gets a thin letter.**

**⚠️ The practical test for whoever builds this: would you be comfortable if the professor saw this screen?** **Their own publications and syllabus — yes, obviously. Anything else — no.** **That is the boundary, and it is checkable.**

**Renaming `LT-20` → THE DOSSIER. `LT-21` (something to open with) is generated FROM it and still obeys the paste test: a subject to raise, never a line to recite.**
