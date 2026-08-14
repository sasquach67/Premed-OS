# Research asks — pasteable batch (Aug 2026)

**Context.** `HANDOFF-2026-08.md` records **eleven open research asks** blocking **seven features**, and says plainly: *"None is an engineering task… This pass is its own project."* The register lives in two places — the HANDOFF summary line and `specifications/07-campus-layer-board.md` §7, which numbers six of them. **The numbering does not fully align across the two files; that is its own small cleanup.**

**What every ask below must return**, per §7 — this is not optional:

> the data itself · **the source URL** · **the date retrieved** · **how often it changes** · **and any access restriction** (auth, rate limits, terms forbidding reuse).

**That last field is load-bearing.** `03-clinical-board.md` §5 bans scraping, and *"a dataset we cannot lawfully use is worse than no dataset."*

**⚠️ Method note, from closing ask #12:** the answer was one fetch away and had been logged as *unverified* because the first hit was a consulting blog. **`reference-sources.md`'s order says which source to GO CHECK, not which claim to disbelieve. A low-trust source pointing at a checkable fact is a lead, not noise.**

**These are all one-institution or one-agency datasets.** None carries the 240-school maintenance problem that sank the admissions-numbers pull.

---

## A. `S-o1` — one question, one source, currently blocking a rule

**Why first: it is a single yes/no from a primary source, and until it is answered `R-S3` holds and Premed OS says nothing.**

> **Paste from here:**
>
> Using **AAMC primary sources only** — the AMCAS Applicant Guide, the Work/Activities instructions, and official AAMC FAQ — answer precisely:
>
> 1. **Does AMCAS's "Physician Shadowing/Clinical Observation" experience type include observation of a physician assistant, nurse practitioner, or other non-physician clinician?** Quote AMCAS's own category definition verbatim.
> 2. **List every AMCAS Work/Activities experience type** with AAMC's exact definition of each.
> 3. **Does AACOMAS or TMDSAS categorise observation differently?** Quote each.
> 4. If AAMC does not address non-physician observation explicitly, **say so** — do not infer an answer from advising blogs.
>
> Return a short table plus verbatim quotes with URLs and access dates. **An explicit "AAMC does not state this" is a valid and useful answer.**

---

## B. Ask #2 — UNC buildings, aliases, and Concept3D IDs

**Priority: `07-campus-layer-board.md` calls this "the single dataset the whole campus layer stands on"** and raised it from important to **blocking**, because event feeds return `location: "Carolina Union"` with **no coordinates** — without an alias map, most events never become map markers at all.

> **Paste from here:**
>
> You are assembling a buildings dataset for the UNC–Chapel Hill campus.
>
> 1. **Every UNC–Chapel Hill campus building**: official full name, common abbreviations, and **known informal aliases** — e.g. "Davis" / "Davis Library" / "Walter Royal Davis Library" should all map to one record. Include latitude/longitude where published.
> 2. **The Concept3D location ID** for each building — the `m/104787`-style value inside a `map.concept3d.com/?id=111` deep link.
> 3. **⚠️ Do not harvest the ID list.** Determine **how it can be obtained lawfully** — `maps@unc.edu` is the published contact. Report the lawful route and any stated terms. **If the only way to get it is scraping, say that and stop.**
> 4. Note UNC's own official campus-map and building-directory URLs, and whether any structured export exists.
>
> Return JSON with one record per building — `officialName`, `abbreviations[]`, `aliases[]`, `lat`, `lng`, `concept3dId`, `source`, `retrievedAt` — plus a top-level note on access restrictions and refresh cadence. **`null` for anything unpublished; do not guess coordinates.**

---

## C. Ask #4 — UNC research labs taking undergraduates

**Priority: called "the highest-value item in this document."** Feeds `RS-BIG-1`, the lab directory.

> **Paste from here:**
>
> Using **official UNC–Chapel Hill department, school, and program pages only** (no LinkedIn, no aggregators):
>
> 1. **UNC research labs that take undergraduate researchers**, by department. Per lab: PI name, department, focus area, lab URL.
> 2. **Whether the lab or department publishes an application route** — a form, an email contact, a stated term-by-term intake, or nothing. **"No published route" is a finding worth recording**, not a row to omit.
> 3. **UNC's central undergraduate-research offices and programs** — office of undergraduate research, work-study research routes, summer programs — with deadlines where published.
> 4. **How often these listings change**, judged from page dates or archive comparison.
> 5. **Any access restriction or terms forbidding reuse.**
>
> Return JSON, one record per lab, with `source` and `retrievedAt` on every row. **Prioritise breadth of departments over depth on any one lab.**

---

## D. Ask #5 — UNC Health volunteer and shadowing programs

**One ask, two features:** `C-BIG-1` (clinical) and `S-BIG-1` (shadowing). `S-BIG-1`'s whole point is that it's **institutions publishing their own programs**, which is the opposite of the physician directory `S-3` bans permanently.

> **Paste from here:**
>
> Using **UNC Health, UNC Hospitals, and UNC School of Medicine official pages only**:
>
> 1. **Every structured volunteer program** open to undergraduates: name, setting, time commitment, eligibility, application route, and **application windows or deadlines**.
> 2. **Every structured shadowing or clinical-observation program**, same fields.
> 3. **Required onboarding** — background check, immunisation, HIPAA training, TB test — and typical lead time from application to first shift.
> 4. **Whether each program is currently open, closed, or waitlisted**, with the date you observed that.
> 5. **Area non-UNC options** if officially published — Orange County and Chapel Hill health systems.
>
> **⚠️ Application windows are the field that rots** — stamp every date with its source and retrieval date. Return JSON with a `freshness` block noting how often each page appears to change.

---

## E. `data/cycle-dates.json` — mostly already answered

**Category A, `knowledge-sources.md` backlog item 4, powers Timeline and the roadmap. `11-timeline-tasks.md` already treats it as the Category A source a node quotes when it says *"AMCAS opens early May."***

**⚠️ Do not re-research this from scratch.** `implementation/research-prompts/school-list-sl-21-cycle-calendar.md` already establishes the AMCAS / AACOMAS / TMDSAS opening, submission, transmission, and TMDSAS Match dates with primary sources. **This is a conversion job, not a research job:** turn that packet into JSON with `cycle`, `service`, `event`, `date`, `source`, `retrievedAt`, plus a `freshness` block.

**Two things the packet establishes that must survive into the file:**

- **Dates move year to year** — AMCAS opened May 6 / May 1 / May 5 across three cycles. **The file holds observed dates for a stated cycle; it never implies a derivation rule.**
- **The TMDSAS rank-preference deadline carries a total, unrecoverable consequence** — miss it and TMDSAS withdraws the applicant from every medical school. Flag it in the data, not just the UI.

---

## F. `data/unc-courses.json` — and the catalog it unblocks

**Category A, backlog item 4. `briefs/README.md` lists the course→requirement catalog as "not yet written," and `SL-26` prerequisite coverage is blocked on exactly that.**

> **Paste from here:**
>
> Using **`catalog.unc.edu` only** — the official UNC–Chapel Hill course catalog:
>
> 1. **Every undergraduate course**: subject code, number, title, credit hours, catalog description, stated prerequisites and corequisites, and any stated grade minimum.
> 2. **The catalog year** the listing belongs to, on every record.
> 3. **Course attributes** where the catalog states them — IDEAs Focus Capacity tags, lab designation, honours.
> 4. **Report the total course count first**, before returning records, so I can decide batching.
>
> **⚠️ Prerequisites are the point of this dataset — capture the catalog's own wording, including "or equivalent," "or permission of instructor," and choice-of logic. Do not normalise those into a flat code list; that is what produces false completions.**
>
> Return JSON with `source` and `retrievedAt` per record. **Do step 4 and stop** — I will choose the batch.

---

## Still open, not prompted here

| Ask | Note |
|---|---|
| **#1 Chapel Hill Transit** | Needs GTFS-feed existence checked first — headways matter as much as routes |
| **#3 UNC syllabus publication** | Feeds `A-BIG-1`; the question is whether a central archive exists at all |
| **#6 UNC student organizations** | **Target the real scale — 1,200+, not a curated 150** |
| **EMT / CNA / PCT pathways (NC)** | `C-BIG-3`. Steps, sequence, duration, cost, local enrolment routes |
| **Orange County service orgs** | `V-BIG-1`. New ask, not covered by the others |
| **UNC student-org registration process** | `E-BIG-3`. The only `open` item in the extracurriculars pillar |
| **NPPES CORS** | Listed in the HANDOFF register |
| **`SB-32` / `SB-23` / `SB-33`** | Essays content backlog. **`SB-33`'s arc scaffold is explicitly "unsourced — do not invent it"** |
| **UNC Handshake access model** | Unverified. **Indeed is already ruled out** — Publisher Program closed 2022, API deprecated 2024. Fallback is a hand-built cited list |
| **Clinical role published scopes** | Roles without a verified published scope get the free-text field and **no checklist at all**, per R7 |

**⚠️ Register hygiene:** the HANDOFF names eleven asks in prose; campus board §7 numbers six in a table. **Reconciling those into one numbered register would take ten minutes and would stop the next reader re-deriving the list** — which is what this file just did.
