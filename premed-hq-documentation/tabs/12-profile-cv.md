# Profile / CV

**Status:** ✅ SPECCED and FULLY RULED (Aug 2026). Board: `tabs/12-profile-cv-board.md` — **47 rows across Batches 1–5, nothing open.**
**Three questions ruled by Andy** — renders a real CV · no public profile · the writing desk opens over this tab.
**Rows I ruled myself are marked `[claude]`** and are the ones to re-read first.
**Sidebar group:** Profile · **Spec type:** domain tab
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Profile fields, auto-generated CV, resume doc
- **References only:** All experiences (read-only aggregation)

## Primary metrics (from architecture/04 — domain-appropriate only)

- Profile completeness
- CV section coverage
- Application-ready state

> **Do-not-generalize anchor:** Profile/CV is a read-only aggregation of experiences; never a second editing surface for records owned elsewhere.

---

## Purpose

**Four years of records become a document you can hand someone.**

Everything in HQ is entered once, in the pillar that owns it. This tab is where it **comes back out** — as a CV, as the fifteen AMCAS activity slots, as a packet for a letter writer. **It creates almost nothing of its own.**

**The test it has to pass:** a student in their application spring should not open Word.

## Primary users and stages

| Stage | What renders |
|---|---|
| **First year → sophomore** | A CV that is mostly education and a couple of experiences. **No AMCAS slots** — fifteen empty boxes three years early is a wall, not a workspace |
| **Junior** | The CV fills. Slots appear as the cycle comes into range |
| **Application year** | Slots, descriptions, most-meaningful, export |

**Phase-gated on `P-29`** (cycle + graduation year), the same field that gates the rest of the app.

## Core entities

**This tab owns two things and references everything else.**

| Entity | Owned? | Notes |
|---|---|---|
| **`ProfileFields`** | ✅ owns | Cycle year, graduation year, institution, **state residency**, languages **with proficiency** (`P-46`), **AMCAS photo** (`P-45`). **Small, and `P-29` is the highest-leverage field in the product.** ⚠️ **No demographics, no income, no parental education — `P-35` CUT** |
| **`ActivitySlot`** | ✅ owns | One of ≤15. Holds AMCAS experience type, dates, `mostMeaningful`, `anticipatedHours`, and **`recordIds[]` — many-to-one** |
| **Every experience, course, credential** | ✗ references | Read-only aggregation. **Never a second editing surface** |
| **The 700 / 1,325-char text** | ✗ references | **Story Bank's record, `status: draft \| ready`.** One store |

**⚠️ `ActivitySlot` is not an experience.** It is a **grouping** of experiences with AMCAS's own metadata on it. Three years at one hospital across two roles is **one slot, three records.** Modelling a slot as an experience makes `P-18` impossible.

## Core views

1. **The CV.** Fixed section order: Education · Experience · Research · Publications & Presentations · Honors · Certifications · Skills & Languages. Per-line include/exclude, drag to reorder within a section.
2. **Activities.** The fifteen slots, phase-gated. What is mapped, what is unassigned, character counts, verifiers.
3. **Profile.** The small field set.

**No dashboard, no completeness ring, no readiness read.**

## Main workflows

- **Nothing is entered here first.** The CV assembles itself from the pillars.
- **Curate.** Include/exclude lines, reorder, add a **single-line** manual entry for what HQ does not track (a job, a hobby). **One CV — variants are cut**, so every other surface reads from one object.
- **Group into slots.** Drag records in, or accept a **grouping suggestion** (`P-29b`: same org, adjacent dates). Set AMCAS type and dates. **Anticipated hours are their own field and never merge with logged hours.**
- **Write the description.** Click the slot → **Story Bank's writing desk opens over this tab**, material beside it. **Same component, second entry point** (Q3).
- **Publish, one at a time.** `draft → ready`. **No publish-all** — a bulk flip makes publishing feel automatic, and the packet would then hand a professor something the student never finished. **`ready` is what the letter packet may include.**
- **Export.** PDF, DOCX, plain text, JSON. Plus the AMCAS-shaped preview.
- **Hand over the packet** (`P-39`). ⚠️ **The SAME assembler `LT-1` uses** — `RO-3` · `E-16` · `LT-1` · `P-39` are four callers of one component, not four builders. Letters passes what you did with one person; this passes the full record.

## Smart features

**All deterministic. This tab has no LLM dependency.** `[claude]` marks the ones I ruled rather than Andy.

| # | Feature | Note |
|---|---|---|
| `P-11` | **Consistent date formatting** `[claude]` | The most common CV defect and free to fix |
| `P-24` | **Hours per slot, aggregated** | `U-6`. **Research-for-credit is a course AND a project and counts once** |
| `P-28` | **Unassigned candidates** | *"22 records, 15 slots, these 7 are in none."* **A bare fact.** ⚠️ The row nearest `U-9` — **never ranks them, never flags "thin" ones, never uses hours as a proxy for worth** |
| `P-29b` ⭐ | **Grouping suggestion** | Same org + adjacent dates → *"these two look like one AMCAS entry."* **Suggested, never auto-applied.** Reads org identity, **not importance** — the fact/judgement line |
| `P-41` | **Staleness** `[claude]` | *"Published in March; 14 records changed since."* Fact-shaped, no nag |
| `P-43` | **Citation formatting** | Publications and posters render as citations — authors, venue, year, one style. **Research owns the records; the CV owns the format** |
| `P-44` ⭐ | **Duplicate detection at assembly** | The same experience logged in two pillars would otherwise appear twice. **Volunteering checks at add-time; nothing checked at render** |
| `P-45` | **AMCAS photo** | A slot plus the stated requirements. **A classic week-of-submission scramble** |
| `P-42` ⭐ | **Fee Assistance thresholds** | AAMC FAP waives most of the AMCAS fee and includes free MCAT prep. **Stated as a Category A fact and linked out — no income data stored, nothing computed.** ⚠️ Republished annually; **freshness-tracked** |
| `P-37` | **What is missing** | **Structural incompleteness ONLY** — no verifier, no end date, a slot with no description. **Facts about the FORM.** ⚠️ *"No research listed"* was proposed and **CUT**: that is an opinion about the application |

## Visualizations

**None.** Same reasoning as Letters: nothing here is answered better by a chart than a list, and every candidate — completeness, coverage, readiness — is a `U-9` violation wearing a graph.

## Cross-tab relationships

| Tab | Relationship |
|---|---|
| **All pillars** | Supply every experience, read-only. **Editing happens where the record lives** |
| **Academics** | Courses, credits, AMCAS-shaped GPA (`01` §4.2-D). **Never recalculated here** |
| **Story Bank** ⭐ | Owns all text. **The writing desk opens over this tab** — one component, two doors |
| **Letters** | Consumes CV lines for `LT-1`'s packet, **`ready` only** |
| **MCAT** | Score summary, read-only |
| **School List** | Consumes residency and the numbers |

## Inspector design

**Slot:** mapped records · AMCAS type · dates · hours (aggregated, with the sources listed) · verifier · character counts · most-meaningful toggle. Quick action: **open the writing desk**.

**A `ready` record is read-only here** (`P-4`). The edit affordance opens the desk; it never edits in place.

## Empty, loading, and error states

**Empty is an invitation.** A first-year sees a CV with their courses on it, because Academics already has them — **not an empty page telling them to start building.**

**⚠️ The fifteen slots are the failure case to design for.** Fifteen empty boxes reads as a to-do list you are already behind on. **They do not render until the cycle is in range** (`P-38`), and when they do, they open with the unassigned-candidates list rather than blank rows.

## Mobile behavior

CV renders as a single column and exports identically. **Slot editing is usable but not the intended surface** — the writing desk needs width, and a 700-character description on a phone is a bad time. Say so rather than pretending parity.

## Admissions-aware reasoning

- **AMCAS truncates, it does not round** (`01` §4.2-D). Never display a rounded GPA next to an AMCAS one.
- **Every attempt counts, all institutions.** The export mirrors that.
- **HQ never picks the three most-meaningful** (`SB-27`, `U-9`). It may show what material exists per activity.
- **Anticipated hours are a distinct field** and never merge into logged hours.
- **All of it is an estimate to verify.** This tab produces the document; AMCAS is the authority.

## Do Not Generalize From Other Tabs

- **Read-only aggregation.** Never a second editing surface for records owned elsewhere.
- **Do not build a word processor.** Fixed layout, no rich text, no templates, no fonts.
- **Do not add a public profile** (Q2 — cut, with conditions for reopening).
- **Do not score, rank, or percentage anything.**
- **Do not re-sum hours.** Aggregate what the pillars computed.
- **Do not copy Story Bank text into this tab.** One store.
- **⚠️ Do not add demographic, income, or parental-education fields** (`P-35` cut). The app has no use for them and they are the one category that cannot be un-leaked.
- **Do not build a sensitive free-text field here.** The disadvantaged narrative lives in Story Bank, which has `SB-73`'s keep-local flag. This tab does not.
- **⚠️ Do not store institutional-action disclosures** (`P-49` cut). Most consequential field in the application, answered on AMCAS, nothing gained by holding it.
- **Do not build CV version history** (`P-47` cut). The dated export is the snapshot.
- **Do not order the fifteen slots for the student** (`P-48` cut). Suggesting an order is ranking.

## Acceptance criteria

- [ ] **Grep proves no second text store** and **no second editor** — the desk is one component.
- [ ] CV assembles with **zero manual entry** from a populated workspace.
- [ ] Export produces PDF, DOCX, plain text and JSON; **plain text survives a paste into a plain textarea.**
- [ ] **Excluding a line never deletes a record.**
- [ ] A slot maps **many records to one activity**, and its hours equal the pillar total with **no double-count** — verify with a research-for-credit course.
- [ ] **≤3 most-meaningful, student-set. HQ never suggests which.**
- [ ] **Before the cycle is in range, zero AMCAS slots render.**
- [ ] Nothing displays a score, percentage, bar, or ring.
- [ ] A `ready` record is **read-only here**; the edit affordance opens the desk.
- [ ] The letter packet can only take a **`ready`** personal statement.
- [ ] Works fully signed out and with no API key.

## Open decisions

1. **`P-9` manual lines.** Ruled single-line-only, and **that constraint is the crack a word processor grows out of.** Worth re-checking the first time someone tries to paste a paragraph in.
2. **`P-42` Fee Assistance thresholds are freshness-tracked.** Republished annually. **A stale threshold telling a student they do not qualify is worse than no feature.**

---

## ⚠️ CONSTRAINTS ALREADY RULED — Aug 2026. Read before speccing.

**Nothing below was decided in this tab. All of it arrived from elsewhere and binds.**

### 1. ⭐ The `draft | ready` boundary (Andy, Aug 2026)

> *"I think the profile CV should own the **completed stories or the fully fleshed-out stories that I'm ready to 'publish.'**"*

| | |
|---|---|
| **Story Bank** | **Where writing happens.** Unfinished text, drafts, material |
| **Profile/CV** | **What is FINISHED.** Only `status: ready` |

**⚠️ ONE RECORD WITH A STATE, NOT TWO RECORDS.** **`one record, two doors` — third application** (`03-clinical-views-board.md` V5). **Verify by grep for a second store.**

**Consequence: *"publish"* becomes a real action** rather than a vague handoff. **The student decides when something is done.**

### 2. AMCAS activities — the ownership split

**Profile/CV owns the 15 activities as CV LINES. Story Bank owns the TEXT** (`09` §8, `SB-26`).

**Reason: the 1,325-char most-meaningful is the hardest writing in the application, and writing it in a tab holding none of your material is the blank-page problem this app exists to solve.**

**⚠️ HQ NEVER picks the three most-meaningful** (`SB-27`, `U-9`). **It may show what material exists per activity. It never ranks them.**

### 3. Hours (`U-6`)

**Hours live in exactly one pillar. Profile/CV AGGREGATES and never double-counts.** **Research-for-credit is a course in Academics AND a project in Research — one hours figure** (`06` §9).

### 4. Constrained by V5

**`03-clinical-views-board.md` §66 already says this tab is constrained the same way Story Bank is.** **That was written before either existed. It still binds.**

### 5. `U-12` — no incumbent, BUILD

**Generic CV builders overlap only in output FORMAT, not in the four-year accumulation that feeds it** (`implementation/U-12-incumbent-audit.md` §6).

### ⚠️ Open

1. **Does Profile/CV render a printable CV, or only assemble the lines?** **A CV builder edges toward the word-processor cede.**
2. **Is there a public-facing profile?** **`05-public-and-account.md` may already answer this.**
