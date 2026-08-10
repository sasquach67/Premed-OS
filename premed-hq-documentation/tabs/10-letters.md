# Letters of Recommendation

**Status:** SPECCED (Aug 2026). 30 rows on the board, 28 ruled. `LT-4`/`LT-5` cut on primary source.
**Catalog:** `tabs/10-letters-feature-catalog.md` (30 rows).
**Body assembled from Batches 1–5** — those sections remain below as the record of *why*; where the body and a batch disagree, **the batch wins and the body is stale.**
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

**Letters is not a tracker. It is the three years before the ask.**

> **Andy, Aug 2026:** *"The backbone of a recommender is that you guys have formed a relationship over time… It needs help with the backend stuff — leading up to asking your recommender for a letter."*

A letter tracker is four rows and a status column, and a student who opens one in their final spring has already lost. **The thing that produces a good letter is three years of a professor knowing who you are**, and nothing in HQ held that. This tab holds it.

**The tracker still exists** — `asked → agreed → submitted`, the packet, the deadline — but it is the last few weeks of a multi-year surface, and it does not render until it is real (`LT-29`).

## Primary users and stages

**The tab is two different products at two stages, and `LT-29` is what separates them.**

| Stage | What it is |
|---|---|
| **First year → junior** | **A people tab.** Instructors appear automatically from the course list. What they teach, what they work on, what to raise with them, when you last spoke. **No letter machinery renders at all.** |
| **Application year** | The letter layer appears on records that already carry three years of history: requests, the packet, lead time, waiver. |

**A first-year has no recommenders and six instructors.** That is the whole design.

## Core entities

| Entity | Notes |
|---|---|
| **`Person`** | **One record, wherever they were met.** Created automatically for every course instructor (`LT-17`). Carries `lastContactAt` and a **running notes field** — *not* a dated event log (`LT-23` cut). |
| **`LetterRequest`** | **Child of a `Person`, and the only thing that carries status** (`LT-13`). `asked → agreed → submitted`, its own dates, its own cycle, its own waiver flag. **A person with zero requests is simply a person** — that is what makes mentors free. |

**No third entity.** No `Mentor` type, no `OfficeHoursVisit`, no `Dossier` record — the dossier is a *view* of a person plus outbound links.

**`ProfessorModel`** (`01` §3.3) already carries `personId` + `courseId`. **Letters reads that link; it does not create a second one.**

> **⚠️ Blocking inconsistency in Academics, not here.** `ClassWorkspace` holds `instructor` as a plain field while `ProfessorModel` holds `personId`. **Two representations of one human, and `LT-17` cannot be built on both.** Fix belongs in the Academics chunk that touches `ClassWorkspace`.

## Core views

1. **People — the aggregate door.** Every person from every pillar. **`one record, two doors`, fourth instance** (after Clinical V5, Volunteering, Shadowing, all for reflections). The pillar shows its scoped view; this shows all of them. **A filter, never a copy.**
2. **The person record.** Courses they taught you, your grade, shared projects, your notes, last contact, links out to their work, and — when the phase gate opens — their requests.
3. **Requests.** Only after `LT-29`. Three states, the packet, the deadline.

**No dashboard. No pipeline board. No counts of letters "secured."**

## Main workflows

- **Instructors arrive on their own.** Add a course, the person exists. No action.
- **Prepare for a conversation.** Open the person, follow the links, read their work, paste a line into notes. `LT-21` connects it to your own record: *a subject to raise, never a line to recite.*
- **Have the conversation.** The topic rides Academics' existing office-hours nudge (`LT-30`). Checking it off bumps `lastContactAt` and appends to their notes. **There is no "log a visit" surface and there must not be one.**
- **Ask.** `LT-9`'s lead time, sourced to HPA: formal request in the spring, earlier for early-deadline programmes, **and ask before you graduate even if you are taking a gap year.**
- **Hand over the packet** (`LT-1`). CV lines, personal statement (**`ready` only**), what you did with this person, deadline, route. **Download or copy. HQ never sends.**
- **Send an update on `agreed`** (`LT-11`). Once, dismissible, reuses the packet.
- **Mark submitted.** One line about a thank-you. **Never a task.**

## Smart features

All deterministic. **The tab has exactly one LLM dependency, `LT-21`, and it degrades to showing the two records side by side.**

| # | Feature | Note |
|---|---|---|
| `LT-18` | **Two-time instructors surface** | Free — one person, two `courseId`s. **The best signal in the pool** |
| `LT-19` | **Coverage as a plain shape** | HPA's own guidance: one science professor, one humanities-or-social-science professor, one of your choosing. **States the shape. Never scores the file** |
| `LT-26` | **Contact staleness** | Reads as information about a relationship, **never a nag about a person** |
| `LT-9` | **Ask lead time** | Category B, sourced and dated. **Never a countdown** |
| `LT-11` | **Update before they write** | Fires once, on `asked → agreed` |
| `LT-2` | **Writer-reminder fact list** | **Facts, never prose.** Deterministic |

## Visualizations

**None, deliberately.** There is nothing here a chart answers that a list does not. **A letters-collected count, a coverage bar, or a readiness ring would all violate `U-9`** — and HPA states outright that *"quality is weighed more heavily than quantity."*

## Cross-tab relationships

| Tab | Relationship |
|---|---|
| **Academics** ⭐ | **Both directions** (`LT-30`). Instructors and `ProfessorModel` in; office-hours checkboxes bump `lastContactAt` and append notes out |
| **Profile/CV** | Supplies CV lines for the packet, `ready` only |
| **Story Bank** | Supplies the personal statement, **`ready` only** — the first load-bearing use of `draft \| ready` outside that tab |
| **Clinical · Shadowing · Research · Volunteering** | Supply people. **Same records, filtered — never copies** |
| **Atlas** | Coffee-chat capture (`02` §5) attaches to the `Person` and is `lastContactAt`'s second trigger |

## Inspector design

Person: identity · how you know them (courses, projects) · **their work, as links** · your notes · last contact · requests (phase-gated). Quick actions: open their page, add a note, start a request.

**The dossier is this inspector, not a separate surface.**

## Empty, loading, and error states

**Empty is an invitation, never a wall of zeros.** A first-year lands on a populated list — that is the point of `LT-17`. **A student with no courses yet sees one line about adding a class, not an empty recommender table.**

**No empty state anywhere says a file is incomplete or a person is missing.**

## Mobile behavior

Full parity. The person record is the primary surface and reads as a single column. **Notes must be a plain `textarea`** so system dictation works (`integration-map` tier 1).

## Admissions-aware reasoning

**Sourced to UNC's own Office of Health Professions Advising** (`hpa.unc.edu`, mod. 2024-06-17):

- **There is no pre-medical committee at UNC.** Individual faculty letters only.
- Two or three minimum, six maximum, and **quality over quantity**.
- **Ask while you are still in their class** — HPA's words, and independent validation of `LT-17`.
- HPA itself links out to AMCAS Letter Writer and Interfolio. **`U-12` cede confirmed by the institution.**

## Do Not Generalize From Other Tabs

- **Follow-up cadence is Letters-only.** Do not generalize the reminder rhythm to any other tab.
- **Do not add status to the `Person`.** It lives on the request, and that is what makes a mentor free.
- **Do not build an event log**, a visit counter, or a relationship score.
- **Do not let HQ write the ask.** Facts, never prose.
- **Do not store the letter.** Ever. HQ records *that* you waived, never the document.

## Acceptance criteria

- [ ] **Grep proves one `Person` store.** Pillar views are filters; no copies.
- [ ] Adding a course creates the instructor `Person` with **no user action**.
- [ ] **A `Person` carries no status field.** Status exists only on `LetterRequest`.
- [ ] Two requests to the same person in different cycles both persist.
- [ ] **No `declined` or `no response` state exists anywhere** (`U-7`).
- [ ] **Before the phase gate opens, zero letter machinery renders** — absent, not disabled.
- [ ] `LT-30` works both ways, and **checking a question fires no reflection prompt**.
- [ ] **No "log a visit" surface exists.**
- [ ] The packet offers a personal statement **only when `status: ready`**.
- [ ] `LT-2` outputs a fact list; **no drafted prose is ever produced.**
- [ ] **HQ never sends anything.** Download and clipboard only.
- [ ] Nothing is scored, counted toward a target, or shown as a bar or percentage.
- [ ] The dossier contains **their work and their teaching only** — grep for any personal-life field.
- [ ] Works with no API key: `LT-21` degrades, everything else is deterministic.

## Open decisions

1. **⚠️ `LT-21`'s input.** Ruled to operate on material the student pastes in, because `LT-20` links out rather than fetching. **This resolved a conflict between two of Andy's own answers rather than implementing either literally — needs his confirm.**
2. **The tab's name.** It is called Letters and now holds all your people. **Same problem the handoff records for Story Bank.** Decide the two renames together.
3. **`LT-4`/`LT-5` return** if a second institution is ever supported — and **`LT-29`'s phase gate must be re-checked against a committee deadline**, which lands before the cycle.

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
| **LT-1** | **⭐ Assemble the packet** | ◑ | **✅ RULED BUILD (Batch 2).** CV lines from Profile/CV · personal statement · **the dates and specifics of what you did WITH THIS PERSON** · deadline · submission route. **The `RO-3` / `E-16` pattern, third instance: HQ assembles and hands over** (`U-10`) |
| **LT-2** | **The writer-reminder FACT LIST** (renamed — "reminder paragraph" misread as a reminder for the student) | ○ | **✅ RULED BUILD (Batch 2) — facts only, no prose. Deterministic, not `●`.** *"Dr. Okonkwo supervised you Jan 2024–May 2025; you ran the DPPH assays and presented at the departmental symposium."* **⚠️ THE PASTE TEST applies** (`09` §5) — **facts and dates, never a drafted email** |
| **LT-3** | **HQ never sends it** | — | **✅ RULED (Batch 2) — download + clipboard, no mailto.** Guard. Copy to clipboard or open the mail client prefilled. **Same as `RS-BIG-3` cold emails** |

## L-b · ⚠️ The committee letter — a probable hole

**Many schools run a prehealth committee letter process with its own deadlines, forms, and internal interviews.** **UNC likely has one and nothing in HQ mentions it.**

| # | | Lean |
|---|---|---|
| ~~**LT-4**~~ | ~~Committee letter as a first-class record~~ | **✅ CUT — CONFIRMED. UNC has no pre-medical committee** (`hpa.unc.edu`, primary source). Returns only if a second institution is supported |
| ~~**LT-5**~~ | ~~Its deadlines are earlier than AMCAS~~ | **✅ CUT with `LT-4`.** No committee at UNC means no earlier deadline, which also closes the `LT-29` phase-gate hole |

---

## ✅ RESOLVED Aug 2026 — the committee letter. `LT-4` / `LT-5` are CUT.

**Source: UNC's own Office of Health Professions Advising**, `hpa.unc.edu/admissions-process/recommendation-letters/`, page last modified **2024-06-17**. **Primary source, top of `reference-sources.md`'s order.** Verbatim:

> **"If you are asked to submit a Committee Letter, there is no pre-medical committee at the University of North Carolina at Chapel Hill.** There are no other 'officials' to write letters. Letters are written by faculty who have had a first-hand opportunity to evaluate the student's skills and abilities. You must get to know some faculty who have taught you so that they can write letters of recommendation when you apply to professional schools."

**`LT-4` and `LT-5` are CUT.** **Research ask #12 is CLOSED** — the sourcing list drops from twelve to eleven.

**⚠️ It returns the moment a second institution is supported.** HQ is UNC-only (`01` §12); most peer institutions **do** run a committee, and its deadline precedes the cycle. **Recorded so the cut is not mistaken for "committee letters do not matter."**

**⚠️ And the `LT-29` phase-gate hole is closed with it.** The worry was that a committee deadline would land before the gate opens. **At UNC there is no such deadline.** If a second institution is ever added, **re-check the gate first.**

### ⭐ The same page validates the reframe, and sharpens four rulings

**This is the most useful thing the check produced, and it was not the question being asked.**

| What HPA says | What it does to the spec |
|---|---|
| *"It is best to begin this process as early as possible, and **ideally while you are still in class with or working with your potential recommender**"* | **⭐ Direct external validation of `LT-17`** — a professor record starting at *"I am in their class,"* not *"I need a letter."* **The reframe was inferred; this is UNC's own advising office saying it.** |
| Recommends **one science professor · one humanities or social science professor · one of your choosing** | **`LT-19`'s coverage shape is now SOURCED to UNC's own office**, not "common guidance." Rewrite the copy to cite HPA. **Note it is *humanities or social science*, not simply "non-science"** — the current wording is looser than the source |
| Also suggests **a research mentor, thesis advisor, internship supervisor, or a health professional you shadowed** | **Validates `LT-27`.** The people who write letters are the people already in the other pillars — **exactly the aggregate-door argument** |
| *"two or three minimum, six maximum… **quality is weighed more heavily than quantity.** Increasing the amount does not necessarily increase the strength"* | **Backs the `LT-8` cut.** A count is not a strength, from the source. **A letters-collected counter would contradict the advising office** |
| *"make this formal request… **during the spring**"* and **ask before you graduate even if taking a gap year** | **`LT-9` gets a real anchor** — spring of the application year, earlier for early-deadline programs. **Category B, sourced and dated** |
| *"if you wait too long, your best recommenders might **have to turn down your request**"* | The real cost of late asking, in the source's words. **Usable in `LT-9`'s copy. Still never a countdown** (`U-9`) |
| Links out to **AMCAS Letter Writer and Interfolio** | **HPA itself cedes delivery.** `U-12` §4 confirmed by the institution |

### ⚠️ A note on how this was found, worth keeping

**The first pass dismissed a consulting blog as low-confidence and recorded the finding as unverified.** Andy: *"don't immediately discredit it, please do ur research."* **He was right and the blog was accurate.**

**The lesson is not "trust consulting blogs."** It is that **`reference-sources.md`'s order is about which source to GO CHECK, not about which claim to believe.** A low-trust source pointing at a checkable fact is a lead. **Dismissing it left a real answer sitting one fetch away, and left an eleven-item research list carrying a twelfth entry that did not need to exist.**

## L-c · Coverage — what the file needs

| # | | AI | Lean |
|---|---|---|---|
| **LT-6** | **Requirements per school** | — | **✅ CEDE CONFIRMED (Batch 4).** ⚠️ CEDE — MSAR holds this** (audit §4). **HQ shows what YOU have; it does not republish requirements** |
| ~~**LT-7**~~ | ~~What you have vs. what a typical file wants~~ | — | **MERGED INTO `LT-19` (Batch 4).** Two science faculty, one non-science, plus PI/clinical is common guidance. **`U-8`/`U-9` — states the gap, never scores the file, never says it is insufficient** |
| **LT-8** | **A letter-strength score** | — | **CUT. `U-9`.** ⚠️ **Note: the existing spec has *"how strong"* as a field — that is the STUDENT'S OWN judgement, self-entered, and stays. HQ must never compute one** |

## L-d · Timing and the relationship

| # | | AI | Lean |
|---|---|---|---|
| **LT-9** | **Ask lead time** | ○ | **✅ RULED BUILD (Batch 4) — now SOURCED to HPA: formal request in the spring, earlier for early-deadline programs, and ask before you graduate even if taking a gap year.** Common guidance is 4–6 weeks. **Category B, sourced** |
| ~~**LT-10**~~ | ~~Contact staleness~~ | — | **MERGED INTO `LT-26` (Batch 4) — same feature twice.** Already exists in Research (`06` §7) — *"no contact in 4 months; letter strength tracks contact."* **Generalise it here** |
| **LT-11** | **Send an update before they write** | ○ | **✅ RULED BUILD (Batch 4) — prompts once on `agreed`.** A writer working from two-year-old information writes a two-year-old letter |
| **LT-12** | **Thank-you note** | ○ | **✅ RULED (Batch 3) — ONE LINE on submit, never a task, never tracked** |

## L-e · Status, and the `U-7` problem

| # | | Lean |
|---|---|---|
| **LT-13** | **Asked → agreed → submitted** | **✅ RULED BUILD (Batch 3) — on a `LetterRequest` record, not on the person.** **Three states, and that is the whole pipeline** |
| **LT-14** | **"Declined" / "no response"** | **⚠️ CUT — `U-7`, no non-events.** **The same ruling as `S-36` and `RS-BIG-2`: no reply is not a rejection and is never counted as one.** **If they said no, you remove the row** |
| **LT-15** | **Waiver recorded** | **✅ RULED BUILD (Batch 3) — on the request.** Minimal. **HQ records THAT you waived, never the letter.** **The waiver is a fact about you; the letter is not yours** |
| **LT-16** | **Chase / nag a writer** | **CUT.** **HQ does not manage a professor's obligations, and a student cannot chase a letter writer without cost** |

## L-f · The `U-12` boundary, restated because it will be tested

**⚠️ FORBIDDEN: letter delivery · letter storage · receiving anything from a writer · a FERPA workflow.**

**`localStorage` on a student's laptop is the wrong place for a document the student is not permitted to read.** **Interfolio and the AAMC portal move the file. HQ is the three years before that.**

---

## ✅ RULED Aug 2026 — BATCH 1: the pool, coverage, and what a person record holds

**Three rulings, and the grep step changed two of them.**

### 1. `LT-17` — instructors enter automatically, from every course ✅ BUILD

**Andy: automatic.** A `Person` exists for an instructor **from the moment the course does**. A first-year opens Letters and sees six people, not an empty tab.

**⭐ THE GREP FOUND THIS IS CHEAPER THAN THE BOARD CLAIMED.** `01-academics.md:54` already specifies **`ProfessorModel` with a `personId` (the instructor)** and a `courseId`. **The instructor-as-Person concept already exists in the docs.** Letters is not inventing a link; it is reading one that was specced for a different purpose.

> **⚠️ INCONSISTENCY TO CLOSE, found by the same grep.** `ClassWorkspace` (`01` §38) holds **`instructor` as a plain field**, while `ProfessorModel` (§54) holds **`personId`**. **Those are two representations of the same human.** `LT-17` cannot be built on both. **`ClassWorkspace.instructor` must resolve to the same `Person`** — this is a `01-academics.md` correction, not a Letters one, and it belongs in the Academics chunk that touches `ClassWorkspace`.

**`LT-18` (two-time instructors) follows for free** — same person, two `courseId`s. Deterministic, no new data.

### 2. `LT-19` — coverage as a plain shape ✅ BUILD

*"Common guidance is two science faculty and one non-science. Your instructors: 5 science, 1 non-science."*

**A fact about the course list, `U-8`-sourced.** **It never says the file is insufficient, never scores it, never counts down to a target.** `U-9` is the nearest cliff and this row sits closest to it of anything in the tab — **if it ever grows a bar, a percentage, or the word "need," it has become the thing that was cut as `LT-8`.**

### 3. `LT-23` / `LT-24` — ⚠️ NO EVENT LOG. Person carries a last-contact date and running notes ✅ RULED

> **Andy:** *"what are we logging? thought we were just logging recommenders themselves, and it marks status"*

**The board proposed a dated visit log and it is CUT.** A person record holds:

- **`lastContactAt`** — one date, bumped when you talk to them
- **A running notes field** — grows over time, no structure imposed

**Why the cut is right:** an event log is a record type with no natural trigger, and `RM-1`'s own lesson is that a mechanism nobody triggers is a mechanism that does not exist. **A student does not log leaving office hours the way they log a shift.**

**⭐ AND THE GREP FOUND THE TRIGGER THAT DOES EXIST.** `01-academics.md` already ships **"Questions to ask" checkboxes in the class Notes tab, explicitly tied to office hours** (§373), plus **feature #15, the office-hours nudge** (§1255). **Checking those off is a real moment that already happens in the product.** That is where `lastContactAt` gets bumped — **not from a new logging surface in Letters.**

**Consequences, both recorded so they are not re-proposed:**

| | |
|---|---|
| **`LT-25`** — reflection trigger after a conversation | **CUT.** It hung on a visit event that no longer exists, and the board already flagged it *"risks turning a chat into homework"* |
| **`LT-26`** — contact staleness | **SURVIVES, and now has its date.** Reads as information about a relationship, **never as a nag about a person** |

**What `LT-1`'s packet loses:** per-conversation dates. **What it keeps:** the course, the term, the grade, any shared project, the running notes, and the last-contact date. **That is enough to write a real reminder paragraph** and it costs the student nothing to maintain.

---

## ✅ RULED Aug 2026 — BATCH 2: the packet

**`LT-1` is the tab's reason to exist, and all three rows are now closed.**

### 1. `LT-1` — the packet ✅ BUILD

**Fourth instance of the assemble-and-hand-over pattern** (`RO-3` · `E-16` · `LT-1` · Profile/CV `P-39`). **`U-10` governs: HQ assembles, the student writes.**

**Contents:**

| In the packet | Source |
|---|---|
| **CV lines** | Profile/CV, `ready` only |
| **Personal statement** | Story Bank — **`ready` ONLY. ✅ RULED** |
| **What you did with THIS person** | Course, term, grade, shared project, running notes, `lastContactAt` (Batch 1) |
| **Deadline and submission route** | The letter record |

> **⭐ Why `ready` only, and it is the whole reason the `draft \| ready` boundary was worth building.** **An unfinished personal statement is one click from a professor's inbox otherwise.** The boundary already exists in Story Bank §8; this is its first load-bearing use outside that tab. **A `draft` PS is not offered, not greyed out with a warning, not behind a confirm — it is simply not in the list.**

### 2. `LT-2` — ⚠️ FACTS, NOT PROSE ✅ RULED

> **Andy: the facts, as a list.**

**HQ outputs a fact list. It never writes the paragraph.**

```
CHEM 241 · Fall 2024 · A−
Office hours: 4 visits, last Oct 12
DPPH assays, Jan–May 2025
Departmental symposium, April 2025
```

**The student turns that into a sentence themselves.**

**Why this is the right line, stated because it will be argued with later:** the paste test (`09` §5) was written for **admissions essays**, and an email to a professor is not one — so it was worth deciding deliberately rather than inheriting. **It lands in the same place for a different reason.** A letter request is the first thing a writer reads about you, **a professor who has received three generated asks can tell**, and the cost of being the student whose email reads machine-written is a thin letter. **The facts are the part HQ uniquely has. The sentence is the part that has to be yours.**

**⚠️ Consequence: `LT-2` is now `○` deterministic, not `●`.** It was specced as requiring an LLM. **It requires none** — it is a query over records HQ already holds. **Update the catalog's `AI` column.**

### 3. `LT-3` — handover ✅ BUILD, both paths

> **Andy: both.**

- **Download** — a file you attach yourself. The packet is long; this is the real path.
- **Copy to clipboard** — for pasting the short version into an email.

**`LT-3`'s guard is unchanged and absolute: HQ never sends anything.** Same as `RS-BIG-3` cold emails. **No mailto prefill was ruled in** — it was offered and not chosen; the packet is too long for a mail body and prefilling edges toward HQ sending on the student's behalf.

---

## ✅ RULED Aug 2026 — BATCH 3: who is in this tab, and what state they carry

### 1. `LT-27` — ⭐ mentors are first-class. Letters is the AGGREGATE DOOR for people ✅ BUILD

> **Andy:** *"should i only put letter writers, because there's a lot of influential people that i get to talk to"*

**That question is the answer.** Those people currently have nowhere to live except scattered across whichever pillar they were met in — **and the ones who matter most usually span several.**

**⭐ This is `one record, two doors`, FOURTH instance** — after Clinical V5, Volunteering, and Shadowing, all for reflections. **People work identically:**

- **A `Person` is one record**, wherever they were met.
- **The pillar shows its scoped view** — Research shows your PI, Shadowing shows physicians.
- **Letters is the AGGREGATE door**, the place you see all of them at once.
- **A filter, never a copy. There is exactly one set of records.** Verify by grep for a second store.

**A mentor is not a new entity. A mentor is a person with zero letter requests attached.** That falls straight out of the `LT-13` ruling below and costs nothing.

**`LT-28`'s guard stands and is now structural rather than editorial:** the relationship is the record; the letter is an optional child of it. **The data model can no longer express "person who exists only to write me something."**

> **⚠️ WATCH ITEM — the tab's name.** It is called Letters and now holds more than letters. **This is the same problem the handoff already records for Story Bank** (*"the tab's NAME now undersells it"*). **Not worth blocking on. Worth deciding before launch**, and the two renames should probably be considered together.

**Cross-tab consequence:** Atlas §5's **coffee-chat capture** records conversations with exactly these people. **Those conversations should attach to the `Person`**, which gives `lastContactAt` (Batch 1) a second real trigger alongside Academics' office-hours checkboxes.

### 2. `LT-13` — status lives on a LETTER REQUEST, not on the person ✅ RULED

> **Andy: keep them separate.**

**A `LetterRequest` is its own record**, child of a `Person`, carrying `asked → agreed → submitted` plus its own dates and cycle.

**Three things this buys, and the third is why it matters most:**

1. **Reapplying works.** Ask Dr. Elamin in 2029, apply again in 2030, ask her again — **two requests, two histories.** One status field on the person cannot hold that, and reapplying is common.
2. **`LT-15` waiver attaches to the request**, not the person — you may waive on one and not another.
3. **A mentor carries no status field at all.** Not blank, not `none` — **absent.** A person with zero requests is simply a person. **This is what makes `LT-27` cost nothing.**

**`LT-14` stays cut** (`U-7`): no `declined`, no `no response`. **Three states, and deleting the request is how a no is recorded.**

### 3. `LT-15` — the waiver ✅ BUILD, minimal

**HQ records THAT you waived access, never the letter.** One boolean on the request. **The waiver is a fact about you; the letter is not yours** and never enters HQ.

### 4. `LT-12` — the thank-you: ⚠️ SAID ONCE, NEVER TRACKED ✅ RULED

> **Andy: mention it once, don't track it.**

**When a request is marked `submitted`, the surface states that writers usually appreciate a note. That is the entire feature.**

**No task is created, no reminder fires, nothing is chased, and nothing records whether you did it.** **Being nagged by software to thank a human is worse than forgetting on your own** — and a tracked thank-you is precisely the checklist-ification of a relationship that `LT-22` and `LT-28` exist to prevent.

---

## ✅ RULED Aug 2026 — BATCH 4: the dossier, timing, and two merges

### 1. `LT-20` — the dossier LINKS OUT. HQ never fetches their work ✅ RULED

> **Andy: link out.**

**The dossier holds YOUR side of the relationship. It links to theirs.**

| HQ holds | HQ links to |
|---|---|
| Which of your courses they taught, and when · your grade · shared projects · **your running notes** · `lastContactAt` | Department page · Google Scholar · PubMed |

**Zero fetching, zero caching, zero staleness, zero cost, no integration.** **`U-12` decides it:** Google Scholar and PubMed already do this and do it better. **HQ's layer is that their work sits NEXT TO your relationship record — not that HQ searches.**

**`LT-22` is unchanged and still the hard cut:** their work and their teaching, never the person. **The test stands: would you be comfortable if the professor saw this screen?**

### 2. ⚠️ `LT-21` — the conflict, and how it resolves

**Two of the Batch 4 answers disagree.** `LT-20` says HQ never fetches their work. `LT-21` says keep the opener — **but the opener was specced to read their work.** **With `LT-20` ruled link-out, there is no input.**

**Resolution, and it may be better than the original:** **`LT-21` operates on material the STUDENT brings back.**

- You follow the link, read the abstract, **paste a line or two into the notes field**.
- HQ connects **that** to your own record: *"she works on antibiotic resistance in wastewater; you ran DPPH assays — there's a real question there."*
- **A subject to raise. Never a line to recite.** The paste test holds (`09` §5).

**Why this is arguably the stronger version:** the student has actually read the thing. **An opener built from a paper you skimmed yourself beats one assembled from a title you never opened**, and it removes any temptation to walk in sounding briefed rather than interested.

**`LT-21` stays `●`** — it is the tab's only LLM dependency. **It must degrade to showing the two records side by side** when there is no key.

> **⚠️ NEEDS ANDY'S CONFIRM.** This resolves a conflict between two of his own answers rather than implementing either literally.

### 3. `LT-11` — prompt on `agreed` ✅ BUILD

> **Andy: prompt when a request hits `agreed`.**

**One prompt, at the one moment it matters.** They said yes; send them current material. **A writer working from two-year-old information writes a two-year-old letter.**

**Fires once per request, on the `asked → agreed` transition. Dismissible. Never repeats.** It reuses `LT-1`'s packet — **no second assembly surface.**

### 4. `LT-9` — ask lead time ✅ BUILD

**Common guidance is 4–6 weeks. Category B, sourced and dated** (`implementation/knowledge-sources.md`). **States the norm; never counts down, never says you are late.**

### 5. ⚠️ TWO MERGES — duplicates the batches exposed

| Row | Ruling |
|---|---|
| **`LT-10`** contact staleness | **MERGED INTO `LT-26`.** They are the same feature written twice in one file. **`LT-26` is canonical** (Batch 1, and it owns `lastContactAt`). **Delete `LT-10` from the catalog rather than shipping two staleness reads.** |
| **`LT-7`** what you have vs. what a file wants | **MERGED INTO `LT-19`.** `LT-19` (Batch 1) already states science / non-science coverage from the course list, and it was the stronger framing. **`LT-7` added only "plus PI/clinical," which folds in as one more category.** **Do not build both** — two coverage reads on one page is how `U-9` gets violated by accident. |

### 6. `LT-6` — requirements per school ✅ CEDE, confirmed

**MSAR holds this** (`U-12` audit §4). **HQ shows what YOU have. It never republishes school requirements**, which change annually and would be stale the moment they were written.

---

## ✅ RULED Aug 2026 — BATCH 5: ⭐ making the tab actually about the relationship

> **Andy:** *"does it push the person to form a relationship with the individual or the potential recommender… the tracker is a small part of it. Most of the work is back in talking to your mentor and forming a relationship."*

**The audit that prompted this, recorded honestly:** after Batches 1–4 the tab's **structure** was relationship-first — a person is the record, the letter is an optional child — **but every feature that actually FIRED was anchored to a letter.** Packet, fact list, lead time, prompt on `agreed`, thank-you on submit. **`LT-21` was the only relationship feature and it was passive**, sitting on a page nobody opens in October of freshman year. **The tab permitted relationship-building. It did not push it.**

**⚠️ And the obvious fix was the wrong one.** This file's own correction already says **the barrier is not motivation** — a nudge saying *"go talk to Dr. Elamin"* fixes a problem the student does not have and gets dismissed. **What they lack is something to say.**

### 1. `LT-29` — ⭐ PHASE GATE: a first-year sees people, not letters ✅ RULED

**Before the application cycle is in range, the letter machinery does not render.** Not greyed out — **absent.**

| Renders early | Does not render until the cycle is near |
|---|---|
| The people · what they teach · what they work on (links) · what to talk about · when you last spoke · your notes | `asked → agreed → submitted` · the packet · lead time · waiver · thank-you · coverage |

**Why absent and not disabled:** a greyed-out letter pipeline in year one still frames every professor as a future signature. **That is the exact instrumentalisation `LT-22` and `LT-28` were written to prevent, reintroduced through the UI.**

**Consequence: for two or three years this tab is a relationship tab, and it teaches relationship-building because it is literally all it offers.** The letter machinery appears once it is real, on a record that by then holds three years of history.

### 2. `LT-30` — ⭐ THE LOOP: Letters ↔ Academics, both directions ✅ BUILD

**Nothing here is a new surface.** Both halves already exist and nobody connected them.

| Exists today | Where |
|---|---|
| **"Questions to ask"** checkboxes, explicitly tied to office hours | `01-academics.md` §373 |
| **Office-hours nudge** — *"N questions saved, office hours tomorrow"* | `01-academics.md` #15 |
| **The person, their work, and what to raise** | Letters `LT-17` / `LT-20` / `LT-21` |

**Outbound — Letters → Academics.** `LT-21`'s topic appears as a **suggested** item in that class's Questions to ask, next to the ones the student wrote. **Suggested, not inserted:** accept or ignore. **Feature #15 then fires on its own**, at the one moment it matters, and the student walks in with something to say.

**Inbound — Academics → Letters.** Checking a question off **bumps `lastContactAt`** on the person and **appends what was discussed to their running notes** (`LT-24`).

**Why both directions is the whole point:** the relationship history **builds itself from something the student was already doing.** Nothing is typed twice, and the packet three years later reads *"4 office-hours visits · discussed DPPH radical stability and her wastewater work"* — **written by a student who never once opened this tab to do it.**

> **⚠️ This is now `lastContactAt`'s PRIMARY trigger** (Batch 1 named it; this specifies it). Atlas §5's coffee-chat capture is the second. **There is still no manual "log a visit" surface, and there must not be one** — `LT-23` stays cut.

**Guards, because this feature can rot in two specific ways:**

- **The suggested question is never auto-accepted**, never pre-checked, and never fires its own notification. **It rides feature #15's existing trigger and adds no new interruption** (`§6.11` attention budget).
- **Checking a box must not open a reflection prompt.** `LT-25` was cut for this exact reason. **A two-minute conversation is not homework.**

---

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
| **LT-17** | **⭐ A professor record starts at *"I am in their class"*, not *"I need a letter"*** | ○ | **✅ RULED BUILD (Batch 1) — automatic.** **The whole reframe in one row.** A `Person` exists from the moment the course does |
| **LT-18** | **Two-time instructors surface automatically** | ○ | **✅ RULED BUILD (Batch 1) — free, follows from `LT-17`.** **A professor who taught you twice already knows you.** **HQ has this fact and nobody has used it** |
| **LT-19** | **Science / humanities-or-social-science coverage from the course list** | ○ | **✅ RULED BUILD (Batch 1) — plain shape only. SOURCED to HPA (one science professor · one humanities/social science professor · one of your choosing). ⚠️ Not simply "non-science" — tighten the copy.** Common guidance wants two science faculty and one non-science. **HQ can see which of your instructors are which.** **`U-8` — states the shape, never says the file is insufficient** |

## LT-h · The background brief — Andy's ask, with the guard attached

| # | Feature | AI | Lean |
|---|---|---|---|
| **LT-20** | **THE DOSSIER — what they actually work on** | ○ | **✅ RULED (Batch 4) — LINKS OUT, never fetches. Deterministic, not `◑`.** Department page · research interests · courses taught · recent work. **All public.** **⚠️ For research faculty, PubMed E-utilities is free and keyless — but it is `U-12` territory: Google Scholar exists. HQ's layer is that it sits NEXT TO your relationship record, not that it searches better** |
| **LT-21** | **Something to open with** | ● | **✅ RULED BUILD (Batch 4) — operates on material the STUDENT pastes in, since `LT-20` does not fetch. ⚠️ Needs confirm.** *"She works on antibiotic resistance in wastewater; you ran DPPH assays. There is a real question there."* **⚠️ THE PASTE TEST applies** (`09` §5): **a subject to raise, never a scripted line to recite** |
| **LT-22** | **⚠️ Anything about the PERSON rather than their WORK** | — | **CUT, hard.** **No personal details, no social media, no "what they like."** **The line is: their published work and their teaching. Nothing else** |

## LT-i · Office hours as the unit

**`RM-1` proved that a mechanism only works if something triggers it. The same applies here.**

| # | Feature | AI | Lean |
|---|---|---|---|
| ~~**LT-23**~~ | ~~An office-hours visit is a loggable event~~ | — | **CUT (Batch 1).** No event log. **`lastContactAt` on the person instead**, bumped from Academics' existing office-hours checkboxes |
| **LT-24** | **What you talked about** | ○ | **BUILD, as a running notes field on the person** (Batch 1). Not per-visit records |
| ~~**LT-25**~~ | ~~A reflection trigger after a real conversation~~ | — | **CUT (Batch 1).** It hung on the visit event that `LT-23` no longer creates, and it turns a chat into homework |
| **LT-26** | **Contact-staleness, generalised from Research** | ○ | **BUILD (Batch 1), and it now has its date.** `06` §7 already has it. **⚠️ Must read as information, never as a nag about a person** |

## LT-j · Mentors — wider than letters

**Andy said *"mentors"* before he said *"recommenders."* They are not the same thing and the docs have no concept of the first.**

| # | | Lean |
|---|---|---|
| **LT-27** | **A mentor is a relationship with no letter attached** | **✅ RULED BUILD (Batch 3) — Letters is the aggregate door for people, `one record, two doors` 4th instance.** **Not every important person writes you a letter, and a tab that only holds future recommenders teaches the student to see people as instruments** — the exact failure `LT-22` guards against |
| **LT-28** | **A mentor may become a recommender. Never the reverse framing** | **✅ RULED (Batch 3) — now STRUCTURAL: the letter is an optional child of the person.** Guard. **The relationship is the thing; the letter is a possible by-product** |

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
