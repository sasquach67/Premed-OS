# Essays & Story Bank

> **Governed by:** `specifications/00-product-shell.md`, `01-shared-interface-patterns.md`, `04-visual-craft-standards.md`, `general.md`, `architecture/04-admissions-framework.md`. **Companion catalog: `tabs/09-essays-story-bank-feature-catalog.md`** — **76 features, Waves 0–6.**

**Status:** Designed (August 2026). **Was a stub until this pass.**
**Sidebar group:** Application · **Spec type:** domain tab
**Repo:** not yet built. **No mockup exists** — `BUILD-MANIFEST.md` blocks it.

## Ownership (shell §2.2)

- **Owns:** Themes, the theme→prompt index, core pieces, essay records, drafts, talking-point suggestions.
- **References only:** Reflections (**the same records — see §2**), experiences, People, School List, Profile/CV.

---

## 1. Purpose — WIDENED Aug 2026

**So you do not lose what you thought.** **Essays are the payoff, not the point.**

> **⚠️ This section used to say only *"retrieval against a blank page."* Wave 6 widened it.** **The tab now also holds a JOURNAL** — thoughts about a life, most of which will never become an essay. **`§6`.**
>
> **⚠️ The tab's NAME now undersells it.** ***"Essays & Story Bank"* does not describe a place you keep a diary.** **Not renamed; flagged.**

### 1a · The essay problem

**Retrieval against a blank page.**

> **Andy, Aug 2026:** *"Most students, when they're writing an essay, get the feeling of **'Dude, I have no idea what to write about.'** HQ can jog your memory, recall your past reflections, and use that as potential talking points."*
>
> *"If you do these experiences and you don't keep track of them, when it comes to essay time you're like 'I have no idea what to write.' **You're going to have to use more brainpower trying to remember your past experiences and trying to relive it for the first time. If you've written it down already, you can already experience it again.**"*

**The failure this prevents is specific and near-universal: the experience you are describing happened three years ago and is now a summary of a summary.** **You reconstruct instead of remember, and reconstructed material reads thin because it is thin.**

**⚠️ This retroactively raises the value of `RM-1` across all five pillars.** **The reflection triggers are the deposit side of this account.** **It is also the one thing Andy says he regrets about his own volunteering** (`04-volunteering-feature-catalog.md` §0d): *"the other thing I regret is not reflecting on it."*

## 2. ⚠️ The hardest constraint — `one record, two doors`, and there is no gate

**Ruled in `03-clinical-views-board.md` V5, repeated in all five pillars:**

> **Story Bank is the AGGREGATE door. A pillar's `Reflections` is the SCOPED door. THE SAME RECORDS. A filter, never a copy.**

**RULED Aug 2026 (Andy): there is also no transfer, no flag, and no gate between them.**

> *"If it's a transfer, that assumes it's gone from the reflection section, and **I don't want that.**"* · *"**Every one of my reflections should make it to Story Bank — no matter how insignificant.** Reflections are the way to house it, the primary input, but **eventually it all goes through Story Bank for the AI to go through.**"*

| | |
|---|---|
| **`Reflections`** | **The INPUT surface.** Pillar-scoped, where you write |
| **Story Bank** | **Where all of it lands and is read** |
| **Between them** | **Nothing** |

**⚠️ CUT from four pillars as a consequence** — `sentToStoryBank`, *"send to Story Bank"* as an action, the unlinked-reflection nudge, Clinical #47 routing, Volunteering's `Smooth Button`. **An unlinked reflection can no longer exist. Do not re-add the nudge under another name.**

**Verify by grep for a second store, not by inspection** (`05-shadowing.md` §297).

## 3. ⭐ The structure — index by THEME, not by prompt

**The old design organised by prompt — *"name a time when you…"* — and prompts are effectively infinite.** Andy: *"it could really be **an infinite list of drop-downs, which nobody wants to click through.**"*

### Back-check (`CLAUDE.md` workflow rule) — the established method agrees

| Finding | Source |
|---|---|
| Secondary prompts collapse into recurring buckets — commonly five, up to twelve; **about seven cover the overwhelming majority** | Shemmassian · InGenius Prep · GradPilot · MedSchoolCoach |
| The recommended artifact is a **"core content bank": 6–10 core experiences mapped to those buckets** | GradPilot |
| Each gets a **short and a long version** | GradPilot |
| **Same experience, different framing** answers different prompts | Shemmassian |
| The core draft is **400–600 words and explicitly not a finished essay** | GradPilot |

**⚠️ SOURCING NOTE.** *"Story bank"* appears in premed advising writing but **is not a standardised term of art**; the better-sourced name is *"core content bank."* **The PRACTICE is solidly established; an earlier draft overstated the naming claim and this corrects it.**

### The seven themes (Category B, sourced)

**Why medicine · Challenge & adversity · Community contribution · Identity & perspective · Leadership & teamwork · Why this school · Anything else**

**⚠️ *"Why this school"* is the odd one out.** **The other six index YOUR material; that one indexes the SCHOOL.** **It cannot be answered from reflections** — its material comes from School List. **Keep it as a theme; mark the different source.**

### ⭐ Prompts return, NESTED under themes (Andy, Aug 2026)

> *"It should have **all the basic prompts there** and give us direction on what to write, because **if it's like a bank, that's nice, but it needs to have prompts there, just like the old Story Bank format.**"*

**The old format's flaw was the accordion, not the prompts. An earlier draft of this spec discarded both.**

| | |
|---|---|
| **Old** | Prompts at top level. Infinite |
| **Rejected middle** | Themes only, no prompts. Bounded but directionless — **a filing cabinet** |
| **✅ Ruled** | **Themes at the top, ~4 common prompts under each.** Seven doors, a handful behind each |

**Works with no school list, no application year, and no API key** — which matters because **most users are years from applying.**

## 4. The three surfaces

| # | Surface | | Why it is not `Reflections` |
|---|---|---|---|
| **1** | **The bank** | Theme rail with counts + material, **newest first** | Aggregates all five pillars |
| **2** | **Essays** | Records: school · **prompt text** · limit · status · due · count | **`Reflections` has no prompts, limits, or deadlines** |
| **3** | **The writing desk** | **Prompt + your material + the draft, one frame** | **No analogue anywhere in HQ** |

**⭐ Surface 3 is the tab's reason to exist. It is the only place a QUESTION, the MATERIAL, and a DRAFT sit together — the blank-page problem solved as a layout.**

**The material rail on the desk is the BANK, FILTERED. A third door on the same records.**

### The default view

**Newest first, theme rail beside it. NOT theme-grouped.**

- **Never empty, never wrong.** **A first-year with four entries sees four entries.** Theme-grouped, they see **seven buckets with five blank** — the worst possible read on a page whose job is showing you that you have material (`01` §8: a friendly one-liner, never a blank void).
- **Recency is the natural read** for something you wrote last week.
- **The rail carries counts**, so `SB-6`'s thin-theme signal never has to fire as a notice. **⚠️ Counts, NOT scores (`U-9`)** — *"Challenge · 6"* is a fact; *"Challenge · strong"* is a judgement.
- **One override:** arriving via a pasted prompt lands you on that theme, pre-filtered.

**Nothing is stage-dependent. A first-year and an applicant want the same first screen for different reasons.**

## 6. ⭐ The journal — orphan entries, and they may outnumber everything else

> **Andy, Aug 2026:** *"It's kind of like **diary entries, but it's kind of a brain dump.**… It could be something medicine-related, or **it could just be about life.**"*
>
> *"**Some things make a thought that's potentially life-changing. If they don't document it, they just forget it the next day, so it's kind of useless.**"*

**Same thesis as §1a, shorter timescale.** **An experience three years old becomes a summary of a summary; a thought not written down is gone by tomorrow.**

### What it is

**A dated, untyped text entry with NO parent record.** **Captured from a box on Overview** (`SB-64` — recorded in `specifications/03-overview.md`) **and landing in the bank immediately: no inbox, no triage, no required theme.**

**⚠️ An orphan has no pillar door. It exists ONLY in the bank.** **This is the first record type that breaks the two-door symmetry — flag it before someone "fixes" it.**

### ⚠️ `U-12` — BUILD the entry, never the journal app

| | |
|---|---|
| **Incumbent** | **Day One · Apple Journal · Notes.** Free, mature, already installed |
| **Why HQ still builds** | **None of them can put a 2am thought about your grandfather NEXT TO your clinical reflections and retrieve both under *Why medicine*** |

**⚠️ FORBIDDEN BY NAME: streaks · daily prompts · photos · weather · location stamps · mood tracking · "on this day" · calendar heatmaps · encryption UI.** **The streak dies on `U-9` independently; the rest die on `U-12`.**

### Capture obeys the dictation ruling

**Andy's workflow is Voice Memos → paste.** **HQ builds no voice capture and no transcription** (`implementation/integration-map.md` §1). **This confirms the ruling rather than breaking it.**

### ⚠️ Most entries are never used, and that is correct

**No "unused thought" nudge** (`U-7`, `U-9`). **A journal whose entries feel like unfinished tasks is a bad journal.**

## 6a · ⚠️⚠️ SAFETY — the sharpest problem in the product

**Pillars hold sensitive material SCATTERED. Story Bank CONCENTRATES it — and the journal changes the order of the risk.**

**Clinical reflections may contain patient detail, which the PHI ban addresses. A journal contains the student's own private life** — family, mental health, relationships, things they would never put in an application. **And synthesis reads the whole bank on every call.**

- **`SB-73` · Per-entry *keep local, never send*. NOT optional.** **The student must be able to write something HQ will never transmit.** **Default OFF — everything is sendable unless they say otherwise.**
- **`SB-75` · Warn plainly before the first AI call**, naming the journal explicitly rather than saying "your data." **`U-8` — states it, does not block.**
- **`SB-74` · The panel states what it read** (`SB-36`).
- **⚠️ `SB-76` OPEN — export is all-or-nothing today** and ships the journal with everything else. **Needs a scope choice.**

### ⚠️ `SB-73` LOOKS LIKE THE CUT GATE. IT IS NOT.

| | `sentToStoryBank` (CUT) | **`SB-73`** |
|---|---|---|
| **Asks** | *"Is this good essay material?"* | ***"Should this ever leave my device?"*** |
| **Verdict** | **A judgement of worth. `U-9`. And it starved the AI of context** | **A privacy boundary. Nothing in HQ's rules argues against it** |

**Both are booleans on a reflection. If a future reader collapses them, the gate is back.**

## 5. The AI — two tiers, and it never touches your work

> **Andy:** *"Are you saying it should be **dismissible, only suggestions**, and **it doesn't actually affect or alter any of your work**… **a tool to help and not to do all the work for you**?"* — **Yes.**

| | | AI |
|---|---|---|
| **RETRIEVAL** | *"Everything you wrote touching this theme"* | **`○` — always works, no key** |
| **SYNTHESIS** | Talking points · cross-experience threads · **the arc** | **`◐` — degrades to retrieval** |

- **The AI reads the whole bank. No gate** (§2).
- **It never writes to a reflection** — no edit, no rewrite, no summary replacing an original, no auto-tagging that changes a record.
- **Suggestions are their own layer:** generated on demand, dismissible (`U-1`), **and losing them all costs the student nothing.**

### ⭐ The arc — direction, not prose

> **Andy:** *"**I feel like I need a direction in which to write.** It suggests a place to start, suggests in between, and how to end."*

**HQ may say: *"Start where run 4 came back wrong. The middle is what you did with no record to check against. End with what changed in how you work."*** **A shape, built from the student's own material.**

### ⭐ Every suggestion cites its source — `SB-35`, and it is a hard rule

**An LLM reading 24 reflections can propose a beat that is in none of them — a plausible memory the student does not have, which they then put in an application.** **The citation line is the only mechanism that catches this.**

- **Every suggestion line carries the entry title and date it came from, clickable through to the record.**
- **A line that cannot cite a source is not shown.** **No citation → dropped.**
- **The panel states its read scope** — *"read 3 of your 24 entries"* — so the student knows what was considered.
- **The panel states plainly that nothing was written into the draft.** Standing text, not a one-time tooltip.

**⚠️ Distinct from Atlas** (`U-11`): **Atlas cites an external corpus and can be wrong about the world. This cites the student's own words and can be wrong about the student. The second is worse**, and it is the highest-consequence failure this product can have.

### ⭐ THE PASTE TEST — the guard that makes the arc safe to build

> ***If HQ's output could be pasted into the draft unchanged and be part of the essay, it crossed the line.***

**Written as a test, not a principle, because *"be helpful but don't write it"* is not checkable and this is.**

| | Paste test | |
|---|---|---|
| Talking points | **Fails naturally** | Not essay sentences |
| The arc | **Fails naturally** | Instructions *about* the essay |
| **A paragraph** | **PASSES — therefore forbidden** | **HQ never produces one** |

**`U-10` states the principle; the paste test operationalises it.**

## 6. `U-12` — what HQ cedes, and one correction

**Full audit: `implementation/U-12-incumbent-audit.md`.**

| | Incumbent | Outcome |
|---|---|---|
| **The bank** | None | **BUILD** |
| **Essay collaboration** | **Google Docs** | **CEDE** |

**⚠️ An earlier version of this ruling was drawn too wide and is corrected here rather than quietly moved.** **It claimed `S0` forbade storing drafts. The arithmetic does not support that:** personal statement (~5,300 chars) + 15 activity descriptions + 3 most-meaningful + ~30 secondaries ≈ **130KB against a 5–10MB budget.** **And the advisor argument kills COLLABORATION, not STORAGE — two claims that were merged into one.**

| HQ holds | Google Docs holds |
|---|---|
| **Plain-text drafts, next to the material** | Comments · tracked changes · version history · three people in one doc |

**⚠️ STILL FORBIDDEN: rich-text editor · revision history · comment threads · collaborative editing · track changes · bibliography-style formatting.** **A `textarea` is not a word processor. Copy-to-clipboard is the bridge out.**

## 7. Core entities

- **`Theme`** — one of seven (Category B, sourced) plus custom. Carries `prompts[]` (`SB-32`).
- **`Reflection`** — **NOT OWNED HERE.** Owned by its pillar; **this tab is a second door** (§2).
- **`CorePiece`** — 6–10 reusable modules, short + long, plain text, ~400–600 words.
- **`Essay`** — `school?` · `promptText` · `limit` · `limitUnit` · `status` · `dueDate?` · `draft` · `link?` · `derivedFrom[]` (which core pieces feed it).
- **`Suggestion`** — ephemeral. Talking points, threads, arcs. **Never persisted as authoritative; discardable at zero cost.**
- **Derived:** theme counts, character/word count vs limit, thin themes.

## 8. Cross-tab

- **All five pillars** — reflections flow in as the same records. **No gate.**
- **Profile/CV** — **owns the 15 AMCAS activities as CV LINES; Story Bank owns the TEXT.** **`one record, two doors`, third application.** **Andy's rule: Profile/CV holds what is *"fully fleshed out and ready to publish."*** **One record, `status: draft | ready`. Not a copy.**
- **School List** — supplies schools for secondaries and the material for *"why this school."* **Never a second school database.**
- **Timeline** — **no chronological view here.** Sorting the bank by date is a **SORT, not a VIEW** — **two vertical time axes in one app is a real confusion, and dropping hundreds of reflections onto a four-year roadmap would swamp it.**

## 9. Do Not Generalize

- **Do not build a word processor** (§6).
- **Do not copy reflections into this tab** (§2).
- **Do not re-add a "send to Story Bank" action or an unlinked-reflection nudge.**
- **Do not score anything** — `U-9`. **No story strength, no theme coverage percentage, no essay-readiness read.**
- **Do not let HQ write prose** — the paste test (§5).
- **Do not ship a comprehensive per-school secondary library.** **Examples only; stale prompts are worse than none.**
- **Do not pick the three most-meaningful.** HQ may show what material exists per activity. **It never ranks them.**

## 10. Acceptance criteria

- [ ] **Grep proves one reflection store.** No second copy anywhere.
- [ ] **No `sentToStoryBank` field and no unlinked-reflection nudge exists in any pillar.**
- [ ] **The bank opens newest-first** with a theme rail showing **counts, not judgements**.
- [ ] **Each theme carries common prompts**, and they are usable with no school list and no API key.
- [ ] **The writing desk shows prompt, material, and draft in one frame**, with a live count.
- [ ] **No rich text, revision history, comments, or collaborative editing exists.**
- [ ] **Every AI output fails the paste test.** No generated paragraph is ever offered.
- [ ] **Every suggestion line cites a real reflection**, clickable. **A line with no source is not rendered.**
- [ ] **The suggestion panel states its read scope and states that nothing was written to the draft.**
- [ ] **Nothing in the tab is scored, ranked, or expressed as a percentage.**
- [ ] **Retrieval works fully with no API key**; synthesis degrades to retrieval.
- [ ] **A thought can be captured from Overview in under five seconds with no theme, pillar, or title required, and it appears in the bank immediately** — no inbox, no triage.
- [ ] **No streak, daily prompt, mood field, photo, or "on this day" exists anywhere in the tab.**
- [ ] **Per-entry `keep local` exists and is honoured by every AI call and every sync path.**
- [ ] **Export produces the student's own words in plain text.** **A bank you cannot leave with is a trap.**

## 11. Open decisions

1. **`SB-8`** — cap or warn on custom themes? **Twenty themes rebuilds the accordion.**
2. **`SB-18`** — **CUT** (contradiction/evolution notice). *"Year 1 you wrote X; year 3 the opposite."* **The only proposed row that could read as surveillance of your own mind, and `U-9` forbids judging the student.** **Confirmed cut Aug 2026.**

## 12. ⚠️ Content-blocked, not code-blocked

**Three sourcing passes gate real content here** — the seven themes' **prompts** (`SB-32`), the **sample secondaries** across a T10/T20/T50 spread (`SB-23`), and the **arc scaffold** (`SB-33`, currently **unsourced — do not invent it**).

**These join the standing content backlog, now eleven items.** **At some point that pass is its own project.**
