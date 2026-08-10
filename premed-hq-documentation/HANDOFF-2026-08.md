# Handoff — August 2026

**Read `AGENT-IMPLEMENTATION-GUIDE.md` first. This file is a snapshot, not a spec.** It says what has been done, how it was done, what is next, and what the end goal is. **Where it disagrees with a spec or catalog, they win.**

**⚠️ Do not confuse this with `CLAUDE_CODE_HANDOFF.md` or `READ-ME-FIRST.md` at the repo root. Those are stale and `CLAUDE.md` says to ignore them.** This file is dated in its filename for exactly that reason.

---

## 1. The end goal

**Premed OS is a premed journey dashboard for one student, running locally, that turns four years of scattered effort into an application.** React + TypeScript + Vite + zustand, localStorage-first, GitHub Pages, Supabase magic-link sync as an addition — **signed-out mode must stay fully functional.**

**The finish line for the documentation phase:** every tab has a ruled spec and a feature catalog, every catalog row is `live`, `spec`, `board`, or `cut` — **and nothing is `open`.** Then design, then code.

**The division of labour, standing:** **Claude writes specs, boards, catalogs, mockups, and implementation briefs. Claude does not write app code.** That goes to Codex or Claude Code, gated by `implementation/briefs/BUILD-MANIFEST.md`.

---

## 2. How the work is done — the method that produced the good results

**This is the part worth preserving.** The Research pillar was speccced this way in August 2026 and it was materially better than the pillars done before it.

### The loop

1. **Interview the human about lived experience** — before writing anything. **Research's data model was wrong until Andy described his actual black-garlic/DPPH project.** Inference produces plausible specs; lived experience produces correct ones.
2. **Back-check the method** before proposing a mechanism (`CLAUDE.md` workflow rule). **Check the repo first** — HQ has often already solved it. Then `implementation/reference-sources.md`, which sets the source order.
3. **Apply `U-12`** — if a mature product does this and the student can get it free, HQ does not rebuild it.
4. **Produce a COMPREHENSIVE feature list**, not a good one. Andy: *"it needs to be COMPREHENSIVEEEE."* **Over-generate, then cut in the open with the reason recorded.**
5. **Go through it in batches, one ruling at a time.** Do not advance until the batch is closed. Andy's standing critique: ***"stop trying to move on."***
6. **Grep for what the ruling supersedes** — THE GREP STEP, standing. **A ruling is not closed until the contradicting text elsewhere is struck.**
7. **Assemble the board into the spec.** Catalog and spec must not drift.

### The rules of engagement

- **Explain with the human's own examples**, not abstractions. *"Which runs made panel B"* landed; *"figure-to-data provenance"* did not.
- **Flag disagreement instead of complying silently.** `CLAUDE.md` requires it, and the best calls this session came from it — the `U-12` cut, the Indeed correction, the `SD-4` guard.
- **Record cuts with the reason and the objection.** A cut without a reason gets re-proposed.
- **Own errors precisely.** *"A list nobody can publish"* was wrong because it conflated two lists. **Say which part was wrong, not just that something was.**

---

## 3. Vocabulary — needed to read any catalog

| | |
|---|---|
| **`St`** | `live` (shipped) · `spec` (written into the tab file) · `board` (ruled, not yet migrated) · `open` (needs Andy) · `cut` |
| **`AI`** | `○` deterministic · `◑` better with AI · `◐` degrades gracefully · `●` requires an LLM |
| **`Origin`** | `core` (inherited) · `own` (pillar-specific) · `core*` (inherited but altered) |
| **`Surface`** | entity-tab rows carry `(list)`, `(panel)`, or `(page)` |
| **Category A / B** | A powers deterministic app logic; B is guidance for a human |
| **Two doors, one record set** | Aggregate view + scoped view. **A filter, never a copy** |

**`U-1`–`U-12` are the universal rules in `general.md`.** **`RM-1`–`RM-6` are the shared reflection mechanism** in `05-experience-pillar.md` §2b-ii.

**⚠️ Naming hazard: Research's `Outputs` features were originally `U-1`–`U-12`, colliding with the universal rules. Renamed `RO-1`–`RO-12` in Aug 2026. Anything older saying `U-7` may mean the venue directory.**

---

## 4. Where things stand

### Pillars

| Tab | Spec | Catalog | Comprehensive sweep | Lived-experience pass | `U-12` audit |
|---|---|---|---|---|---|
| **Academics** | ✅ | ✅ | ✅ | — | ✅ |
| **MCAT** | ✅ | ✅ | ✅ | — | ✅ |
| **Clinical** | ✅ | ✅ | ✅ | — | ✅ |
| **Volunteering** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Shadowing** | ✅ | ✅ | ✅ | — | ✅ |
| **Extracurriculars** | ✅ | ✅ | ✅ | — | ✅ |
| **Research** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Overview** | ✅ | — | — | — | — |
| **Campus layer** | board only | — | — | — | — |
| **Story Bank** | ✅ | ✅ | ✅ | — | ✅ |
| **Letters** | ✅ | ✅ **30 rows, 0 open** | ✅ | — | ✅ |
| **Profile/CV** | ✅ **SPECCED Aug 2026** | board ruled (43 rows, 0 open) | ✅ | — | ✅ |
| **School List · Timeline · Settings · Help** | **scaffold** | ❌ | ❌ | — | ⚠️ partial |

### Cross-cutting, settled August 2026

- **`Discover` is universal — five of five.** ECs (clubs, events, map) · Research (venues, grants, labs) · Clinical (paid roles, programme windows, cert pathways) · Volunteering (non-clinical service orgs) · Shadowing (programmes, specialty coverage, NPPES providers). **Three recorded positions in one month — read the TOP of `05` §2a-ii, not the middle.**
- **`U-12` created** — use the incumbent; HQ is the layer above it.
- **The reflection mechanism `RM-1`–`RM-6`** propagated to all five experience pillars.
- **No dictation boxes anywhere.** Wispr Flow is a redirect, not a feature.
- **The universal rules live in `general.md`**, after two wrong homes.
- **The map:** Leaflet + Stadia, HQ renders its own pins. No iframe. No campus surface.

---

## 5. What is next, in order

### ✅ NOTHING IS BLOCKED. Every pillar ruling is closed.

**The `saved` flag RULED Aug 2026 — option (b), one boolean, nothing more** (`05` §2a-ii). **`saved` records INTEREST, never PURSUIT.** **Forbidden by name: applied · rejected · waiting · date applied · follow-up due · response rate · rejection count · any status enum.** **Adding one re-opens `S-36` and `U-7`.**

### ✅ STORY BANK DONE — Aug 2026

**`09-essays-story-bank.md` went from stub to full spec; the catalog holds 76 features, Waves 0–6.**

**⭐ THE JOURNAL (Wave 6) is the largest single addition of the session.** **Andy: *"diary entries, but kind of a brain dump… it could just be about life."*** **The tab's purpose widened from *"retrieval against a blank page"* to *"so you do not lose what you thought."*** **Capture box added to `specifications/03-overview.md` (cross-tab).** **⚠️ The tab's NAME now undersells it.**

**⚠️ AND IT CREATED THE PRODUCT'S SHARPEST SAFETY PROBLEM.** **A life journal concentrated in one store, read whole on every AI call.** **`SB-73` per-entry *keep local, never send* is not optional.**

**The five decisions worth carrying:**

- **No gate between `Reflections` and Story Bank.** **One store, no flag, no transfer.** **Cut `sentToStoryBank` and the unlinked-reflection nudge from four pillars**
- **Index by THEME, not prompt** — ~7 sourced buckets; **prompts nest under them** rather than sitting at top level
- **Three surfaces: bank · essays · the writing desk.** **The desk is the tab's reason to exist** — prompt, material, and draft in one frame
- **⭐ THE PASTE TEST** — *if HQ's output could be pasted into the draft unchanged and be part of the essay, it crossed the line.* **`U-10` made checkable**
- **The `U-12` cede was corrected** — HQ holds plain-text drafts (the `S0` claim was asserted, not calculated); it cedes only collaboration

### ✅ SCAFFOLDS — constraints written in, Aug 2026 (end of session)

**None of these are specced. All now carry the constraints that were already ruled elsewhere, so the next pass starts from something.**

| Tab | What is written in |
|---|---|
| **Letters** | **⭐ REFRAMED — see below.** **Own tab CONFIRMED** (with a watch item — it is the thinnest tab in HQ post-cede). **Plus a full brainstorm: `LT-1`–`LT-16`, four cuts.** **⭐ `LT-1` the writer's packet is the tab's reason to exist** — the `RO-3`/`E-16` assemble-and-hand-over pattern, third instance. **⚠️ `LT-4` COMMITTEE LETTER is a probable hole and is UNVERIFIED** |
| **Profile/CV** | The `draft \| ready` boundary · the AMCAS activities split (CV lines here, text in Story Bank) · `U-6` hours · V5 |
| **Timeline** | **No narrative view** — Story Bank's date sort is a SORT not a VIEW; two time axes would collide. `F-9` first-pub achievement. No deadline ownership |
| **Settings** | **Now a SAFETY surface, not a preferences page** — `SB-73` keep-local, the first-call warning, `SB-76` export scope (open) |
| **Help** | **Collects all seven `U-12` pointers** (Anki, LabArchives, Zotero, Interfolio, MSAR, UNC OUR, Wispr Flow) with the `U-8` guard. **Help ≠ Atlas** |

### ⭐ LETTERS WAS REFRAMED — late in the session, and it is the biggest change to that tab

> **Andy:** *"**The backbone of a recommender is that you guys have formed a relationship over time.**… That's only part of the process of talking to them and meeting them… **It needs help with the backend stuff — leading up to asking your recommender for a letter.**"*

**Letters is no longer a tracker. It is the three years BEFORE the ask.** **`LT-1`'s packet is the END of the process; `LT-17`–`LT-28` are everything before it.**

**Four things worth carrying:**

- **⭐ `LT-17` — a professor record starts at *"I am in their class,"* not *"I need a letter."*** **Academics already holds every course and instructor. That IS the recommender pool and nothing connected them.** **Costs a foreign key; changes who the tab is for. A first-year goes from zero recommenders to six instructors**
- **`LT-18` — two-time instructors surface automatically.** Deterministic, free, and **the best signal in the pool**
- **⭐ `LT-20` THE DOSSIER — build it, and call it that** (Andy ruled the name). **⚠️ SCOPE IS THE WHOLE GUARD: their WORK and their TEACHING. Never the person.** **No social media, no personal details, no third-party opinions.** **The test: *would you be comfortable if the professor saw this screen?*** — checkable, same shape as the paste test
- **`LT-27` — a MENTOR is a relationship with no letter attached.** **A tab that only holds future recommenders teaches the student to see people as instruments.** **The guard belongs in the data model, not just the copy**

**⚠️ Two corrections recorded in the tab:** **the barrier is NOT motivation** — first-years skip office hours because they do not know what to say, so a nudge fixes the wrong thing. **And `LT-14` "declined / no response" is CUT** — `U-7`, same ruling as `S-36`.

**⚠️ This closes the fold-into-Profile/CV question.** **Profile/CV holds finished artifacts; none of the above is an artifact.**

### ✅ LETTERS IS DONE — Aug 2026. Spec + catalog both written.

**30 rows, 28 ruled.** `LT-4`/`LT-5` cut on primary source (no committee at UNC). **Two new rows came out of the last batch and they are the tab's spine:**

- **⭐ `LT-29` — the phase gate.** Before the cycle is near, **the letter machinery does not render at all.** Not greyed out, ABSENT. A first-year sees people, what they work on, what to say, and when they last spoke. **A greyed-out pipeline still frames every professor as a future signature**, which is the instrumentalisation `LT-22`/`LT-28` exist to prevent, reintroduced through the UI. **For two or three years this is a relationship tab, and it teaches relationship-building because it is all it offers.**
- **⭐ `LT-30` — the loop, both directions.** Letters sends a topic into Academics' existing "Questions to ask"; **checking it off bumps `lastContactAt` and appends to the person's notes.** No new surface, no new notification — it rides feature #15's existing trigger. **The relationship history builds itself from something the student was already doing.**

**Also settled:** status lives on a `LetterRequest`, not the person — which is what makes **`LT-27` mentors free** (a mentor is a person with zero requests). **No event log** (`LT-23` cut): one `lastContactAt` + running notes. **`LT-2` is facts, never prose**, and dropped from `●` to `○`. **The dossier links out; it never fetches** (`LT-20`, `○` not `◑`).

**⚠️ Two things still open:** `LT-21`'s input (a conflict between two of Andy's own answers, resolved by me, **needs his confirm**), and the tab's NAME — it holds all your people now. **Decide that rename alongside Story Bank's.**

### ✅ PROFILE / CV IS DONE — Aug 2026. Board fully ruled across four batches.

**43 rows, nothing open.** **Two rows emerged during the batches and neither was on the original board:**

- **⭐ `P-29b` grouping suggestions** — same org + adjacent dates → *"these two look like one AMCAS entry."* **Without it a student hand-maps 22 records into 15 slots and goes back to a spreadsheet.**
- **⭐ `P-42` Fee Assistance** — the AAMC programme waives most of the AMCAS fee and includes free MCAT prep. **HQ states the thresholds and links out; it stores NO income data.** Andy's *"it's good information"* instinct, pointed at a mechanism that holds nothing.

**The three rulings that shaped the tab:** it **renders and exports a real CV** (the word-processor cede was about collaboration, not printing your own data) · **no public profile** (the need is met by the PDF, and it is the one thing that cannot be un-leaked) · **the writing desk opens OVER this tab** (one editor, two entry points).

**Cut:** publish-all · CV variants · one-page mode · **all demographics and income** · advisor summary. **Moved:** disadvantaged narrative → Story Bank, which already has `SB-73`'s keep-local flag.

**⚠️ `P-39` is not a new packet builder.** `RO-3` · `E-16` · `LT-1` · `P-39` are **four callers of ONE assembler.** Verify by grep — two builders is how they drift.

**⚠️ The two rows most likely to rot are `P-28` and `P-37`**, because the useful-sounding version of each crosses `U-9`. **Structural incompleteness is a fact about the form; a content gap is a judgement about the application.**

### → NEXT: School List, then Timeline · Settings · Help.

**Profile/CV still needs its feature catalog** (43 rows) — same gap Letters had. Mechanical, no decisions.

### ⚠️ Research asks now number ELEVEN — ⭐ #12 CLOSED Aug 2026

**UNC labs · buildings + Concept3D IDs · org registration · UNC Health programmes · EMT/CNA pathways · Orange County service orgs · UNC Health shadowing · NPPES CORS · the seven themes' prompts · the school secondary sample · the arc scaffold.**

**⭐ ~~UNC's prehealth COMMITTEE LETTER process~~ — CLOSED.** **UNC has NO pre-medical committee** (`hpa.unc.edu/admissions-process/recommendation-letters/`, primary source, mod. 2024-06-17). **`LT-4`/`LT-5` CUT.** The same page also **sourced `LT-19`'s coverage shape, anchored `LT-9`'s timing, and independently validated `LT-17` and `LT-27`** — see `tabs/10-letters.md`.

**None is an engineering task. Seven features are blocked on them. This pass is its own project.**

**⚠️ Method note from closing #12:** the answer was **one fetch away** and had been recorded as *unverified* because the first hit was a consulting blog. **`reference-sources.md`'s order says which source to GO CHECK, not which claim to disbelieve.** A low-trust source pointing at a checkable fact is a lead, not noise.

**Letters carries a staleness warning (AAMC Letter Writer Portal). Profile/CV inherits the `draft | ready` boundary from Story Bank §8.**

### ✅ BOTH SWEEPS DONE — Aug 2026

**A · The `U-12` audit is complete: `implementation/U-12-incumbent-audit.md`.** Every pillar tested. **Four cedes (Anki, Canvas, Interfolio/AAMC, MSAR), one BRIDGE (Zotero), four pillars cleared to build.** **It added a fourth clause to `U-12` — reachability — and the CEDE/BRIDGE/DUPLICATE-MINIMAL vocabulary.**

**Two specs were updated as a result:** `01-academics.md` (no Canvas sync, ever — the client secret cannot ship in a static bundle), `10-letters.md` (**⚠️ carries a staleness warning: the AAMC Letter Writer Portal is new for the 2026 cycle and this file predates it**), and `08-school-list.md` (cede MSAR's data).

**`mcat-section-aware-drills.html` resolved: it STANDS.** **Not a flashcard system** — the queue is fed only by the student's own missed questions, tagged by cause, and the drill is *generated from* the miss. **The line is narrow: ship or import one content deck and the ruling is void.**

**B · The lived-experience pass ran on Volunteering** (`04-volunteering-feature-catalog.md` Wave 0). **Andy has first-hand depth only there, so only there.** **Unlike Research it mostly CONFIRMED the spec**, which is itself the finding.

**Three things came out of it:**
- **`V-BIG-1` confirmed, and it is the same shape as `RS-BIG-1`** — *"a friend put me on."* **Students without the right friends do not find the thing.**
- **`U-12` returns *build* on hours.** **The incumbent was a spreadsheet.** **⚠️ But that sets the bar — a spreadsheet row is ~5 seconds and so is the rule. No margin.**
- **⚠️ The strongest validation of `RM-1` anywhere:** *"the other thing I regret is **not reflecting on it.**"* **Said unprompted, in retrospect, about real experience.** **And it must fire on one-off events too — the closet clean-out is exactly what vanishes by application time.**

### Then — the scaffolds

**Story Bank first, and it is blocking.** **`F-8`, `E-16`, most-meaningful, the writing assistant, and every reflection specced this session all terminate in it.** Then Profile/CV, Letters, School List, Timeline touches, Settings, Help.

### Standing — content, not code

**Eight sourcing asks are stacked and none is an engineering task:** UNC labs (**check `our.unc.edu/find/opportunities/` first — `U-12`**) · buildings with aliases + Concept3D IDs · org registration · UNC Health programmes · EMT/CNA pathways · Orange County service orgs · **UNC Health shadowing programmes** · **NPPES CORS verification**.

**`D-1`, `D-2`, `D-4`, `SD-1`, `SD-3`, `C-BIG-1`, `V-BIG-1` are all content-blocked.** **At some point this is its own project.**

---

## 6. Standing corrections — mistakes already made, do not repeat

| | |
|---|---|
| **Do not move a ruled structure** to accommodate an unapproved feature | The `Discover`-universal over-generalisation |
| **A count is a symptom, not a diagnosis** | `S12` Gap 3 called the entity tab bloated from row counts; the split disproved it |
| **A low row-count on an inheriting surface is not a gap** | Asking each pillar to invent its own reflection features was the wrong question |
| **Three features died to the same question** — *"what is this actually for?"* | The map surface, `R-1`, `O-1`. **All were reflective views.** Ask it early |
| **"Tabs without catalogs" ≠ "tabs never specced"** | Six of seven scaffolds were never specced at all |
| **Do not read the stale locations as spec** | Root `rules/`, `spec/`, `CLAUDE_CODE_HANDOFF.md`, `READ-ME-FIRST.md`, `REVISIONS-ROUND-1.md`, nested `premedos/` |

---

## 7. The build gate

**`implementation/briefs/BUILD-MANIFEST.md` is the only authority on what may be implemented. Default `NO`. Only Andy flips a row.**

**A mockup's own `APPROVED` header is not permission to build** — approving a drawing and changing the app are two decisions and the folder cannot tell them apart.

**Currently cleared:** Overview + all of Academics & GPA (12 rows) + both public-layer mockups. **Cleared to BUILD is not cleared to PUBLISH** — the age floor, governing law, and the trademark/domain check are still open.

**No mockup exists for:** Extracurriculars · Shadowing · Research · Volunteering · Letters · Story Bank · School List · Timeline · Profile/CV · Help · Settings · Atlas. **Those are design jobs before they are code jobs.**
