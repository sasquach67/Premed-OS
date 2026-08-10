# Essays & Story Bank: feature catalog

**Companion to `tabs/09-essays-story-bank.md`.** **76 features across Waves 0–6.** **This catalog is ahead of the spec — unusual, and it happened because five pillars have been writing obligations into this tab for months without it existing.**

**Column key:** see `HANDOFF-2026-08.md` §3.

---

## Wave 0 · What already points here — collected before anything new is proposed

**Nothing below is a new idea.** **Every row is an obligation another spec already wrote against this tab.** **Collected by grep across all docs, Aug 2026.**

### 0a · The governing pattern — `one record, two doors` (V5)

**Ruled in `03-clinical-views-board.md` V5 and repeated in all five experience pillars:**

> **Story Bank is the AGGREGATE door. A pillar's `Reflections` is the scoped door. THE SAME RECORDS. A filter, never a copy.**

**Shadowing's acceptance criteria already state how this gets verified:** *"verified by grep for a second store, not by inspection."*

**⚠️ This is the single hardest constraint on the tab and it must be honoured before any feature is designed.** **A Story Bank that copies reflections in is wrong, and it will silently drift the moment a student edits one side.**

### 0b · ⚠️ THE CONTRADICTION — and it must be resolved first

**Two ideas are in the docs and they cannot both be true as written:**

| Says | Where |
|---|---|
| **Story Bank is a FILTER over all reflections. Never a copy** | `03-clinical-views-board.md` V5 · `05-shadowing.md` §132, §197, §297 · `07-extracurriculars.md` §237 · `04-volunteering.md` §103 |
| **A reflection is SENT to Story Bank as a deliberate act** — `sentToStoryBank` is a field, *"send a reflection to the Story Bank"* is a workflow, and **an "unlinked reflection" nudge fires when it has not happened** | `05-shadowing.md` §55, §142 · `04-volunteering.md` §127, §145 · `03-clinical-feature-catalog.md` #46, #47 · `06-research-feature-catalog.md` #16 |

**If Story Bank is a filter over the same records, there is nothing to send. If sending is real, there are two states and the nudge implies the unsent ones are somewhere Story Bank is not.**

#### ✅ RESOLVED Aug 2026 (Andy) — NEITHER. The flag is CUT and the gate does not exist.

> *"If it's a transfer, then that assumes that it's gone from the reflection section, and **I don't want that to be the case.**"*
>
> *"**Every aspect, all of my reflections, should somehow make it to Story Bank in some way — no matter how insignificant** that event may be or the reflection for that event may be. I think it still should be used or utilized to some extent. **Reflections are just the way to house it, and it's the primary input, but eventually it all goes through Story Bank for the AI to go through.**"*

**Two statements, and together they remove the question.** **Nothing leaves `Reflections`, AND everything reaches Story Bank. If both hold, there is nothing to flag.**

| | |
|---|---|
| **`Reflections`** | **The INPUT surface.** Pillar-scoped, where you write |
| **Story Bank** | **Where all of it lands and is read.** The aggregate door |
| **Between them** | **Nothing. No gate, no action, no flag** |

##### ⚠️ CUT — and this reaches four pillars. Grep step performed.

| Cut | Where it currently lives |
|---|---|
| **`sentToStoryBank`** as a field | `05-shadowing.md` §55 |
| ***"Send a reflection to the Story Bank"*** as a workflow/action | `05-shadowing.md` §142 · `04-volunteering.md` §127 · `07-extracurriculars.md` §312 |
| **The "unlinked reflection" nudge** | `03-clinical-feature-catalog.md` #46 · `04-volunteering.md` §145 · `06-research-feature-catalog.md` #16 |
| **#47 "Story Bank routing"** as a per-shift action | `03-clinical-feature-catalog.md` #47 |
| **`Reflections → Story Bank` `Smooth Button`** | `04-volunteering.md` §183 |

**⚠️ An "unlinked reflection" can no longer exist, so the nudge has nothing to fire on.** **Do not re-add it under another name.**

**What this costs, stated honestly:** **the student loses the ability to mark a reflection as strong material.** **That was never asked for and `U-9` argues against it** (nothing scored, nothing ranked). **If a highlight mechanism is ever wanted, it is a NEW feature with its own justification — not a revival of this one.**

**What it gains:** **`RM-6` backfill and Andy's *"no matter how insignificant"* both work by default.** **The bank cannot have a blind spot, which matters because the AI reads the whole bank** (Wave 1d) **and a gate would silently starve it.**

### 0c · What the tab OWNS (shell §2.2, already ruled)

**Stories · the personal statement · secondary essays · linked docs.** **References only: experiences as source material, schools for secondaries.**

### 0d · Metrics, already constrained

**Draft status per essay · secondaries completed / total · word counts vs limits.** **⚠️ The do-not-generalize anchor is already written: narrative and draft metrics ONLY. Never hours. Never scores.**

### 0e · The inbound obligations, by pillar

| From | What it owes this tab |
|---|---|
| **Clinical** | *"Every shift is essay fuel."* #45/#45a unpack threads · #47 routing · #46 unlinked nudge |
| **Volunteering** | Service reflections + population/cause → **"why I serve"** material · **#45b synthesis output as its own tagged item — *"essay material, not a dashboard metric"*** |
| **Shadowing** | One reflection per visit, **required in spirit** · `patientMomentFlag` |
| **Extracurriculars** | **Second-largest essay source after Clinical** · initiative outcomes · **`E-16` — the 700-char AMCAS description assembled from three years of recorded initiatives** |
| **Research** | **`F-6` the setback prompt** — *"what didn't work, and what did you do about it?"* · **`F-4` an anomaly resolving** · lab notes and setbacks as *"unusually good essay material"* |
| **All five** | **`RM-6` backfill — and backfill NEVER carries a marker.** A student arriving with two unreflected years is the normal case |
| **Timeline** | Uses the same `one record, two doors` pattern (§125) — **keep them consistent** |
| **Profile/CV** | Constrained by the same V5 ruling (`03-clinical-views-board.md` §66) |

### 0f · Still open, inherited

**`03-clinical-views-board.md` §97:** **whether #45b's synthesis output — a CROSS-experience thread, distinct from a single-shift unpack — appears in both doors or only in Story Bank.**

**My read: only in Story Bank.** **A cross-experience thread has no single pillar to be scoped to.** **Putting it in a pillar door would mean picking one arbitrarily, or showing it in all five, which is a copy.** ⚠️ **Needs Andy.**

---

## Wave 0-U12 · The incumbent check — and it fires

**Applied per `general.md` `U-12` and `implementation/U-12-incumbent-audit.md`.**

**§6 of that audit cleared Story Bank as having no incumbent. That was right about the BANK and wrong about the ESSAYS**, and this tab is called `Essays & Story Bank`.

| | Incumbent | Outcome |
|---|---|---|
| **The Story Bank** — reflections accumulated over four years, tagged, searchable, linked to experiences | **None. Nothing does this** | **BUILD** |
| **⚠️ Essay DRAFTING** — writing prose, revisions, comments, version history | **Google Docs · Word.** Free, universal, **and where every applicant already writes** | **CEDE** |

### ⚠️ REVISED Aug 2026 — the original cede was DRAWN TOO WIDE. Correcting it rather than quietly moving it.

> **Andy:** *"I think the actual spaces where you think you would be **typing up your final draft** and whatnot **should be stored in Story Bank**, and that should be in a specific place as well."*

**The first draft of this section said HQ stores no prose. Two of its three arguments do not survive scrutiny.**

| Original argument | Verdict |
|---|---|
| ~~`S0` — drafts blow the localStorage quota~~ | **❌ WRONG. Do the arithmetic:** personal statement (~5,300 chars) + 15 activity descriptions (700 each) + 3 most-meaningful (1,325 each) + ~30 secondaries (~2,000 each) ≈ **130KB of plain text against a 5–10MB budget.** **Not a quota problem. This was asserted, not calculated** |
| ~~Advisors comment on drafts, so HQ cannot participate~~ | **⚠️ PARTLY. It kills COLLABORATION, not STORAGE.** **Two different claims were merged into one** |
| Rich text, revisions, comments, track changes | **✅ STANDS** |

#### The corrected line — HQ holds the TEXT, cedes the COLLABORATION

| HQ | Google Docs |
|---|---|
| **A plain-text drafting space, next to your material** (`SB-31`) | **Comments · tracked changes · three people in one doc · version history** |
| `SB-4` core pieces | The round trip with an advisor, a friend, a paid reader |

**⚠️ STILL FORBIDDEN: rich-text editor · revision history · comment threads · collaborative editing · track changes.** **A `textarea` is not a word processor. `SB-28` copy-to-clipboard is the bridge out.**

**Why this is the right line rather than a concession:** **Andy's whole thesis is retrieval against a blank page.** **A drafting space in a different application from the material defeats it** — the student is back to remembering instead of reading.

### What HQ keeps

**The material, the status, and the link.** **Which essays exist · which school each secondary belongs to · prompt text · word limit · draft status · due date · a link out to the doc · and the Story Bank material feeding it.**

**`E-16` survives and is the payoff** — **assemble the source material and hand it over.** **`U-10`: HQ assembles, the student writes.** **The same ruling as `RO-3`.**

**⚠️ Word count vs limit is listed as a metric in the stub and it is now in tension with the cede** — **HQ cannot count words in a document it does not hold.** **Either the student enters the count, or the metric goes.** **NEEDS ANDY.**

---

## Wave 1 · ⭐ THE REFRAME (Andy, Aug 2026) — the tab is restructured completely

> *"I feel like Story Bank should somehow make use of that… **This is where AI can help the most: it compiles all of your past responses and reflections over the years and helps shape it into a prompt.**"*
>
> *"Most students, when they're writing an essay, typically get the feeling of, **'Dude, I have no idea what to write about.'** HQ can jog your memory, recall your past reflections, and use that as potential talking points."*
>
> *"If you do these experiences and you don't keep track of them, when it comes to essay time you're like 'I have no idea what to write.' **You're going to have to use more brainpower trying to remember your past experiences and trying to relive it for the first time. If you've written it down already, you can already experience it again.**"*
>
> *"**We're going to restructure Story Bank completely.** The current layout is kind of limited, and it only has things like 'name a time where you blank'… **it could really be like an infinite list of drop-downs, which nobody wants to click through.** This is going to be a really dense, **encyclopedia-style** thing where, **instead of information, it has your thoughts.**"*

### 1a · What the tab is actually FOR

**Not storage. Retrieval against a blank page.**

**The failure it prevents is specific and every applicant hits it:** **you sit down to write, and the experience you are supposed to describe happened three years ago and is now a summary of a summary.** **You reconstruct it instead of remembering it, and reconstructed material reads thin because it is thin.**

**Andy's framing is the whole product thesis: *"you can already experience it again."*** **A contemporaneous reflection is not a note about the event — it is the event, preserved at full resolution.**

**⚠️ This retroactively raises the value of `RM-1` across all five pillars.** **The triggers are not a nice-to-have — they are the deposit side of this account.** **It is also exactly what Andy said he regrets about his own volunteering** (`04-volunteering-feature-catalog.md` §0d).

### 1b · ⭐ THE INVERSION — index by THEME, not by prompt. This is the restructure.

**Andy's objection to the current design is that it organises by PROMPT** — *"name a time where you blank"* — **and prompts are effectively infinite.** **An accordion of them is unusable and nobody clicks through it.**

#### Back-check (`CLAUDE.md` workflow rule) — the established method agrees, and it is not close

**Pre-health advising has a name for this and HQ was doing the opposite:**

| Finding | Source |
|---|---|
| **Secondary prompts collapse into a small number of recurring buckets. Commonly five, up to twelve — and about SEVEN categories cover the overwhelming majority** | Shemmassian · InGenius Prep · GradPilot |
| **The recommended artifact is a "core content bank": 6–10 core experiences mapped to those buckets** | GradPilot |
| **Each core piece gets a SHORT and a LONG version to match character limits** | GradPilot |
| **The same experience answers different prompts by changing FRAMING and TAKEAWAY, not the events** — one free-clinic interpreter story serves both *"describe a challenge"* and *"diversity/adversity"* | Shemmassian |
| **The core draft is 400–600 words and is explicitly NOT a finished essay** — it is cut and customised per school | GradPilot |

**⚠️ SOURCING CORRECTION (Andy asked, Aug 2026).** **An earlier draft of this section claimed the advising world calls this artifact a "story bank." That was stated with more authority than the sources support.**

**The phrase appears in premed advising writing** — describing the practice of collecting memorable moments rather than only hours — **but it is not a standardised term of art the way "spaced repetition" is.** **The better-sourced term is "core content bank"** (GradPilot).

**What IS solidly established, across multiple independent advising sources, is the PRACTICE**: theme buckets · 6–10 reusable core experiences · short and long versions · same story, different framing. **The structural finding stands. The naming claim was overstated and is corrected here rather than quietly removed.**

#### The consequence for the structure

> **Prompts are infinite. Themes are about seven. INDEX BY THEME.**

**Every secondary prompt maps onto a theme, and a theme maps onto several of your experiences. That is the many-to-many the tab must model** — **not a list of questions with a text box under each.**

### 1c · The encyclopedia shape

**Andy: *"a really dense, encyclopedia-style thing where, instead of information, it has your thoughts."***

**Read that literally.** **An encyclopedia is dense, browsable, cross-referenced, and you enter it at any point — you do not click through it in order.** **That is the opposite of an accordion.**

| # | Feature | AI | St | Notes |
|---|---|---|---|---|
| **SB-1** | **Theme is the top-level index** | ○ | `open` | **~7 buckets, sourced and cited** — values · setback and growth · community contribution · identity and inequity · why medicine · challenge and conflict · leadership. **Category B, from advising sources, not invented** |
| **SB-2** | **A theme page shows YOUR material for it** | ○ | `open` | Every reflection, lab note, initiative outcome, and setback that touches this theme. **Dense — many short entries visible at once, not one per screen** |
| **SB-3** | **One experience appears under many themes** | ○ | `open` | **Many-to-many, by ruling.** **The interpreter example: same events, different framing.** ⚠️ **`one record, two doors` extends here — an entry under three themes is ONE record shown three times, never three copies** |
| **SB-4** | **Core pieces — 6–10, short and long** | ○ | `open` | The sourced artifact. **A plain-text module, ~400–600 words, explicitly NOT a finished essay** |
| **SB-5** | **Prompt → theme → your material** | ◑ | `open` | **Paste a school's prompt. HQ says which theme it is and shows what you already have.** **The infinite list becomes a lookup instead of a menu** |
| **SB-6** | **Thin-theme notice** | ○ | `open` | *"You have nothing under 'setback and growth.'"* **⚠️ `U-8` and `U-9`: states the gap, never scores the bank, never says a theme is required** |

### 1d · The AI — TWO TIERS, and this is how it survives `U-2` and `U-10`

**Andy: *"this is where AI can help the most"* and *"the AI should do an ACTIVE job of trying to shape all of your reflections into eventual talking points."***

**⚠️ Taken literally that is `●` requires-an-LLM on the app's most important surface, which `U-2` forbids** (*no base capture path depends on a key*) **and `U-10` resists** (*manual first, AI invoked never assumed*).

**It does not have to be. The two halves have different requirements:**

| | | AI |
|---|---|---|
| **RETRIEVAL** — *"here is everything you wrote that touches this theme"* | **Deterministic.** Tags, entities, dates, substring. **`RM-3` search already exists** | **`○` — always works, no key** |
| **SYNTHESIS** — *"these three moments are the same idea; here are talking points"* | **Needs an LLM. This is the part Andy is describing** | **`◐` — degrades to retrieval** |

#### ✅ CONFIRMED by Andy Aug 2026 — suggestions only, dismissible, and it never touches your work

> *"Are you saying that it should be something like dismissible, maybe, like only suggestions, and **it doesn't actually affect or alter any of your work**… because it's supposed to be **a tool to help and not to do all the work for you**?"*

**Yes. Written as a hard rule:**

| | |
|---|---|
| **The AI READS the bank** | Every reflection, no gate (§0b) |
| **It PROPOSES** | *"These three moments might be the same idea. Here are talking points."* |
| **It NEVER writes to a reflection** | **No edit, no rewrite, no summary replacing the original, no auto-tagging that changes a record** |
| **Every suggestion is dismissible** | `U-1` — states its cause, dismissible, once per cycle |
| **Suggestions are their own layer** | **Generated on demand, discardable, and losing them all costs the student nothing** |

**⚠️ THE LINE: HQ produces TALKING POINTS. HQ does not write the essay.** **`U-10`, and the same ruling as `RO-3` and `E-16` — HQ assembles and hands over.** **A student who submits HQ's prose has been failed by the product.**

### 1e · What this does to the `U-12` cede — a boundary correction

**Wave 0-U12 ceded drafting to Google Docs. That stands and this does not reopen it — but the line moves slightly and needs stating:**

| HQ holds | Google Docs holds |
|---|---|
| **Reflections · themes · talking points · `SB-4` core pieces as PLAIN TEXT** | **The per-school essay being drafted, revised, and commented on** |
| ~40KB for ten core pieces — **not an `S0` problem** | Version history, an advisor's comments, a paid reader's edits |

**A plain `textarea` holding a 600-word reusable module is not a word processor.** **The cede was about revision, comments, and collaboration — all of which happen where the advisor is, and the advisor is not in HQ.**

### 1f · Guards carried in

- **`U-9` — nothing is scored.** **No story strength, no theme coverage percentage, no readiness read.** **`SB-6` states a gap and stops.**
- **`U-7` — no non-events.** **Not a record of essays you did not write.**
- **`RM-6` — backfill never carries a marker.** **A student arriving with two unreflected years is the NORMAL case for this tab**, not the edge case.
- **`U-1` — every notice states its cause and is dismissible.**

---

## Wave 2 · The comprehensive sweep — every feature, then cut in the open

**Over-generated per the standing method. Rows marked `open` need Andy.**

### 2a · The atom and the index

| # | Feature | Surface | AI | St | Notes |
|---|---|---|---|---|---|
| **SB-1** | **Theme is the top-level index** | `Themes (list)` | ○ | `open` | **~7 buckets, SOURCED and cited, Category B** — values · setback and growth · community contribution · identity and inequity · why medicine · challenge and conflict · leadership. **Not invented** |
| **SB-2** | **A theme page shows your material** | `Themes (page)` | ○ | `open` | **Dense — many short entries visible at once.** The encyclopedia read, not one-per-screen |
| **SB-3** | **Many-to-many: one entry, many themes** | — | ○ | `open` | **ONE record shown in three places, never three copies.** `one record, two doors` extends here |
| **SB-4** | **Core pieces — 6–10, short and long** | `Core (page)` | ○ | `open` | Sourced artifact. **Plain text, ~400–600 words, explicitly NOT a finished essay** |
| **SB-5** | **Prompt → theme → your material** | `Themes` | ◑ | `open` | **Paste a school's prompt. HQ names the theme and shows what you have.** **The infinite list becomes a lookup** |
| **SB-6** | **Thin-theme notice** | `Themes` | ○ | `open` | *"Nothing under setback and growth."* **`U-8`/`U-9` — states the gap, never scores, never says a theme is required** |
| **SB-7** | **Manual theme tagging always available** | `Themes` | ○ | `open` | **`U-10`. The student tags. The AI may propose (`SB-14`) and always waits** |
| **SB-8** | **Custom themes** | `Themes` | ○ | `open` | The seven are a starting index, not a cage. **⚠️ Risk: a student who makes twenty themes rebuilds the accordion. Cap or warn?** |

### 2b · Retrieval — the deterministic half, and it must work with no key

| # | Feature | AI | St | Notes |
|---|---|---|---|---|
| **SB-9** | **Full-text search over everything** | ○ | `open` | **`RM-3` inherited.** The largest text pile in HQ once four years accumulate |
| **SB-10** | **By person** | ○ | `open` | *"Everything mentioning Dr. Patel."* **Shared `Person` records make this free** |
| **SB-11** | **By experience** | ○ | `open` | *"Everything from the ED."* **The pillar filter, from the aggregate side** |
| **SB-12** | **Chronological read** | ○ | `open` | **Four years in order.** ⚠️ **Timeline overlap — Timeline is the roadmap, this is the narrative. Confirm they do not collide** |
| **SB-13** | **`U-11` assistant applies here** | ◐ | `open` | *"What did I write about the patient who didn't speak English?"* **The Jarvis case, on its most natural surface** |

### 2c · The suggestion layer — `◐`, and it never touches a record

**Governed by Wave 1d. Every row below is generated on demand, dismissible, and discardable at zero cost.**

| # | Feature | AI | St | Notes |
|---|---|---|---|---|
| **SB-14** | **Propose theme tags** | ◐ | `open` | Reads an entry, suggests buckets. **Student confirms. `U-10`** |
| **SB-15** | **Talking points for a prompt** | ● | `open` | **Andy's core ask.** *"These three moments might be the same idea — here is why."* **Bullets, never prose** |
| **SB-16** | **Cross-experience threads** | ● | `open` | **Closes `03-clinical-views-board.md` §97 — Story Bank ONLY.** A thread spanning three pillars has no single pillar to be scoped to |
| **SB-17** | **"You already wrote this"** | ◐ | `open` | Surfaces a forgotten entry when its theme is opened. **⚠️ `U-3` attention auction — this is a page-level surface, not a nudge. Confirm it does not compete** |
| ~~**SB-18**~~ ✅ | ~~Contradiction / evolution notice~~ | ● | **`cut`, CONFIRMED Aug 2026** | *"Year 1 you wrote X; year 3 you wrote the opposite."* **CUT — `U-9`, and it reads as judgement of the student's growth.** ⚠️ **The one row here that could feel like surveillance of your own mind** |

### 2d · Essays — the records, not the prose

| # | Feature | AI | St | Notes |
|---|---|---|---|---|
| **SB-19** | **An essay is a record** | ○ | `open` | School · prompt text · word/character limit · status · due date · **link out to the doc.** **No prose stored** (Wave 0-U12) |
| **SB-20** | **Secondaries by school** | ○ | `open` | References School List. **Never a second school database** |
| **SB-21** | **Which core piece feeds which essay** | ○ | `open` | **`SB-4` → `SB-19`.** The reuse map, and the reason the core pieces exist |
| **SB-22** ✅ | **Word count** | ○ | `board` | **RESOLVED by the cede revision — HQ holds the text, so HQ counts it.** Live count against `SB-19`'s limit |
| **SB-23** ✅ | **Sample secondaries — EXAMPLES, not a library** | ○ | `board` | **RULED Aug 2026 (Andy):** *"it would be helpful to **get a peek at what secondaries ask and how that differs between schools**… but **it shouldn't really waste energy trying to scrape actual secondaries.**"* **A small representative set as orientation content. Category B, sourced, cited.** **⚠️ NOT a comprehensive per-school library and NOT scraped** — **examples do not rot the way "this year's actual prompt" does, which was the whole objection.** **`SB-5` still handles the real one: paste it** |
| **SB-31** ✅ | **The writing desk** | ○ | `board` | **NEW — Andy's ask.** **A plain-text drafting space beside your material.** One per `SB-19` record. **`textarea`, never rich text** |
| **SB-24** | **The secondary crush** | ○ | `open` | 30 schools in 3 weeks is the documented reality. **Status board + due dates.** **`U-9` — no completion score** |

### 2e · AMCAS — and a boundary that needs stating

| # | Feature | AI | St | Notes |
|---|---|---|---|---|
| **SB-25** | **`E-16` — the 700-char activity description** | ◑ | `open` | **Assembled from three years of recorded material. `U-10`: assemble and hand over** |
| **SB-26** ✅ | **Most-meaningful (3 of 15), 1325 chars** | ◑ | `board` | **RULED Aug 2026 — Andy delegated the call.** ***"You make that decision for me."*** **ONE RECORD, TWO DOORS — the app's existing pattern, third application.** **Profile/CV owns the 15 activities as CV LINES. Story Bank owns the TEXT.** **Same records, never a copy.** **The reason: the 1,325-char most-meaningful is the hardest writing in the application, and writing it in a tab holding none of your material IS the blank-page problem this tab exists to solve** |
| **SB-27** | **Never picks the three** | — | `open` | **`U-9`. HQ may show what material exists per activity. It never ranks them or suggests which are most meaningful** |

### 2f · Handoff out

| # | Feature | AI | St | Notes |
|---|---|---|---|---|
| **SB-28** | **Copy to clipboard, plain text** | ○ | `open` | **The whole bridge to Google Docs.** Talking points, a core piece, assembled material |
| **SB-29** | **Export the bank** | ○ | `open` | Markdown or plain text. **The student's own words must be portable — a bank you cannot leave with is a trap** |
| **SB-30** | **One-way, always** | — | `spec` | **No write-back to Google Docs.** Inherited from Research's rule |

### 2g · Guards with no surface

| | |
|---|---|
| **Nothing is scored** | `U-9`. **No story strength, no theme coverage %, no essay-readiness read.** **`SB-6` states a gap and stops** |
| **No non-events** | `U-7`. **Not a record of essays you did not write** |
| **Backfill carries no marker** | `RM-6`. **A student arriving with two unreflected years is the NORMAL case here**, not the edge |
| **The AI never writes to a record** | Wave 1d. **No edit, no rewrite, no summary replacing an original** |
| **No word processor** | Wave 0-U12 |
| **Retrieval works with no key** | `U-2`. **§2b is entirely `○`.** Synthesis degrades to retrieval; **the student still gets their memory back** |

---

## Wave 3 · The main page — RULED Aug 2026, and Andy's own objection set it

> *"If anything, it could be the main page, but I'm not too sure yet **because I don't know what most applications are like. I haven't been through them.**"*
>
> *"**Considering that most of the users are probably in their first year**, I feel like that's not necessary."*

**⚠️ That second line decides it, and it argues against putting the writing desk front and centre.**

**Main page is THE BANK — themes and material.** **The writing desk (`SB-31`) is a surface that becomes prominent when there is an application to write, not before.**

| Stage | What the main page leads with |
|---|---|
| **Years 1–3 — most users, most of the time** | **The bank.** Themes, your material, `SB-17`'s *"you already wrote this"*. **There is nothing to draft yet and pretending otherwise is an empty room** |
| **Application year** | **The desk.** Essays, statuses, due dates — **`SB-24`'s 30-schools-in-3-weeks reality** |

**This is stage-adaptive, which `03` §3 already establishes across the app.** **It is not a mode switch and the student never toggles it** — **`01` §8's empty-state rule does the work: a desk with no essays in it shows the bank instead.**

---

## Wave 3b · THE TAB'S SHAPE — three surfaces (RULED Aug 2026, after a mockup)

> **Andy:** *"With the way you're displaying it… **this looks a lot more than just a copy of Reflections. What does it actually look like?**"* · *"Shouldn't it hold a prompt too? It should be like an essay and personal statement thing as well."*

**A fair challenge. The first drawing showed only the bank, which made the tab look like a re-skinned `Reflections`.** **The essays and the desk were in the catalog and had never been drawn.**

| # | Surface | What it is | Why it is not `Reflections` |
|---|---|---|---|
| **1** | **The bank** | Theme rail with counts + material, **newest first** | Aggregate across all five pillars. **`Reflections` is one pillar's slice** |
| **2** | **Essays** | `SB-19` records — school · **prompt text** · limit · status · due · count | **`Reflections` has no prompts, limits, or deadlines** |
| **3** | **The writing desk** | **Prompt + your material + the draft, in one frame** | **This surface has no analogue anywhere in HQ** |

### ⭐ Surface 3 is the tab's reason to exist

**It is the only place where a QUESTION, the MATERIAL, and a DRAFT are in one frame.** **That is the blank-page problem solved as a layout, not as a feature.**

**Three things resolve here that were ruled separately:**

- **`SB-19` carries the prompt text**, which is what makes `SB-5` work — paste it, HQ names the theme, the material rail fills
- **The material rail is the BANK, FILTERED. A third door on the same records** (`0a` V5). **Not a copy. Verify by grep for a second store**
- **The live count (`SB-22`) is only honest because of the cede correction.** **HQ can count it because HQ holds it.** **Before that revision this surface was not buildable**

### The default, ruled

**The bank opens newest-first with the theme rail beside it. Not theme-grouped.**

| | |
|---|---|
| **Never empty, never wrong** | **A first-year with four entries sees four entries.** Theme-grouped, the same student sees **seven buckets with five blank** — the worst possible read on a page whose job is showing you that you have material. **`01` §8: a friendly one-liner, never a blank void** |
| **Recency is the natural read** | You wrote something last week. It should be at the top |
| **The rail does the theme job** | **`SB-6`'s thin-theme signal becomes a count beside a label** — always visible, never has to fire as a notice. **⚠️ Counts, NOT scores (`U-9`): *"Challenge · 6"* is a fact; *"Challenge · strong"* is a judgement** |

**One override: arriving via `SB-5` lands you on that theme, pre-filtered.** **You asked a question; the answer should not be a chronological list.**

**⚠️ This SUPERSEDES the stage-adaptive main page in Wave 3.** **Nothing is stage-dependent now** — **a first-year and an applicant want the same first screen for different reasons**, which is simpler and one less thing to get wrong.

---

## Wave 3c · ⭐ DIRECTION — prompts return, and the AI gives an ARC (Andy, Aug 2026)

> *"**I feel like I need a direction in which to write.** The reason I wanted all of my stuff in Reflections to pass through Story Bank was because I needed the AI to be able to process what was there and **be able to then suggest what to write.**"*
>
> *"It **suggests a place to start, suggests in between, and how to end.** It basically holds your hand throughout the entire process."*
>
> *"It should supposedly **have all the basic prompts there** and give us some direction on what to write, because **if it's like a bank, that's nice, but it needs to kind of have prompts there, just like how the old Story Bank format was.**"*

### ⚠️ CORRECTION — Wave 1b threw out too much

**The old format's flaw was the ACCORDION, not the PROMPTS. Wave 1b discarded both.** **A bank with no prompts is a filing cabinet, and Andy is right that it does not tell you what to write.**

#### The synthesis — prompts NEST under themes

| | |
|---|---|
| **Old format** | **Prompts at the top level.** Effectively infinite, an accordion nobody clicks through |
| **Wave 1b** | **Themes at the top level, no prompts.** Bounded, but gives no direction |
| **✅ Ruled** | **Themes at the top. A handful of common prompts UNDER each.** **Seven doors, four-ish prompts behind each — you enter *Challenge* and see four ways it gets asked** |

**⚠️ This does NOT reopen `SB-23`.** **Generic, recurring prompts SHIP (Category B, sourced). School-specific secondaries are still PASTED** (`SB-5`). **The distinction is that a common prompt is stable across years and a school's exact wording is not.**

**And it works before a school list exists**, which matters because **most users are years from applying** — Andy's own point.

| # | Feature | AI | St | Notes |
|---|---|---|---|---|
| **SB-32** ✅ | **Common prompts, nested under themes** | ○ | `board` | ~4 per theme. **Sourced and cited, Category B.** **Writable against with no school list, no application year, no AI key** |
| **SB-33** ✅ | **The arc — start, middle, end** | ● | `board` | **Andy's core ask.** *"Start where run 4 came back wrong. The middle is what you did with no record to check. End with what changed in how you work."* **A SHAPE built from the student's own material** |
| **SB-34** ✅ | **Direction with no key** | ○ | `board` | **`U-2`.** With no LLM the student still gets: **the prompt (`SB-32`), the theme, and their own retrieved material.** **Degraded, not broken** |

### ⭐ THE PASTE TEST — the guard that makes `SB-33` safe to build

> ***If HQ's output could be pasted into the draft unchanged and be part of the essay, it crossed the line.***

**Written as a test rather than a principle because *"be helpful but don't write it"* is not checkable and this is.**

| Output | Paste test | |
|---|---|---|
| Talking points (`SB-15`) | **Fails naturally** | Not essay sentences |
| An arc (`SB-33`) | **Fails naturally** | Instructions about the essay, not of it |
| **A paragraph** | **PASSES — therefore forbidden** | **This is the thing HQ never produces** |

**`U-10` states the principle; the paste test operationalises it.** **A student who submits HQ's prose has been failed by the product** — and now that failure is detectable by whoever builds and reviews it.

### ⭐ `SB-35` · EVERY SUGGESTION CITES ITS SOURCE — found Aug 2026 by drawing it

**⚠️ A real gap in the comprehensive sweep. `SB-15` and `SB-33` were specced without saying where a suggestion came from.** **Found only when the panel was mocked up** — which is an argument for drawing things earlier.

**Why it is not cosmetic:** **an LLM reading 24 reflections and proposing a narrative can produce a beat that is in NONE of them.** **A plausible-sounding memory the student does not actually have, which they then write about in a medical school application.** **Without a citation line there is no way to catch it. With one, the student clicks through and checks.**

| # | Feature | AI | St | Notes |
|---|---|---|---|---|
| **SB-35** ✅ | **Every suggestion line cites the reflection it came from** | ● | `board` | **Entry title + date, clickable through to the record.** **A line that cannot cite a source is not shown** |
| **SB-36** ✅ | **State the read scope** | ○ | `board` | *"Read 3 of your 24 entries."* **The student knows what was and was not considered** — and it is the tell when the bank is thinner than they assumed |
| **SB-37** ✅ | **Say plainly that nothing was written** | ○ | `board` | **A standing line on the panel, not a one-time tooltip.** *"Nothing above has been written into your draft."* **The paste test made visible to the person it protects** |

**⚠️ `SB-35` is a HARD RULE, not a display preference.** **No citation → the line is dropped.** **This is the only mechanism in the tab that catches fabrication, and fabrication here is the highest-consequence failure the product can have** — **it is not a wrong number on a dashboard, it is a false claim in an application.**

**Related but distinct from Atlas** (`U-11`): **Atlas cites an external corpus and can be wrong about the world. This cites the student's own words and can be wrong about the student.** **The second is worse.**

### ⚠️ SOURCING FLAG — `SB-33` is NOT yet sourced

**The seven themes are sourced. A start/middle/end scaffold is not.** **Writing one from my own judgement would be shipping an opinion as guidance**, and this catalog already carries one correction for overstating a sourcing claim (Wave 1b).

**`SB-33` is Category B PENDING SOURCING.** **Do not build the scaffold's content until the essay-structure pass is done** — same content pass as `SB-23` and `SB-32`. **The mechanism can be specced; the advice cannot be invented.**

---

## Wave 4 · Still open

1. **`SB-8`** — cap or warn on custom themes? **Twenty themes rebuilds the accordion you rejected.** **⚠️ Also unresolved: are themes a FIXED sourced list, an AI-detected set, or both?** Andy's phrasing (*"generated themes that the AI has picked up on"*) suggests he may want detection rather than a fixed seven
2. **`SB-12`** — does the chronological read collide with Timeline?
3. ~~**`SB-18`**~~ — **CUT CONFIRMED Aug 2026.** **The only row that could read as surveillance of your own mind, and `U-9` forbids judging the student.** **Do not re-propose**

---

# Wave 5 · THE BRAINSTORM — ✅ RULED Aug 2026

> **Andy: *"everything else i like."*** **Read as: every lean below is adopted as written.** **Builds build, cuts stay cut, guards are binding.** **`SB-38` is superseded and expanded by Wave 6.**

**Per the standing method: generate liberally, then cut in the open.** **Expect half of this to die.** **My lean is marked on every row; none of it is a ruling.**

## 5a · The gap that bothers me most — a thought with no parent

**Every reflection in HQ hangs off something: a shift, a visit, a project, an initiative.** **But the best "why medicine" material often has no parent record.** A conversation with your mother. Something you noticed about yourself. A patient you were not assigned to.

| # | Feature | AI | Lean |
|---|---|---|---|
| **SB-38** | **Orphan entries — write straight into the bank, no pillar** | ○ | **STRONG BUILD.** **The bank currently cannot hold a thought that is not attached to an activity, and those are disproportionately the good ones** |
| **SB-39** | **Adopt an orphan later** | ○ | **Build.** You write it loose, and months later attach it to the experience it turned out to be about |
| **SB-40** | **Orphans still obey `one record, two doors`** | — | **Guard.** **An orphan has no pillar door — it exists ONLY in the bank.** ⚠️ **This is the first record type that breaks the two-door symmetry. Flag it before someone "fixes" it** |

## 5b · Reuse — the thing that actually goes wrong in secondary season

**Documented reality: ~30 schools in ~3 weeks, with heavy reuse.** **Reuse is correct practice; the failure modes are specific.**

| # | Feature | AI | Lean |
|---|---|---|---|
| **SB-41** | **⭐ School-name mismatch check** | ○ | **STRONG BUILD, and it is deterministic.** **You pasted the Duke essay into Emory and left "Duke" in it.** **This is the single most common catastrophic secondary error and a substring match catches it.** **Cheap, certain, saves an application** |
| **SB-42** | **Same story twice to one school** | ○ | **Build.** Reusing across schools is fine. **Using the same story for two prompts at the SAME school is not**, and nobody tracks it |
| **SB-43** | **Reuse map — which core piece went where** | ○ | **Build.** `SB-21` extended: see one story's footprint across the whole cycle |
| **SB-44** | **Short and long variants of one core piece** | ○ | **Build — sourced** (GradPilot). 250-char and 600-word versions of the same material |
| **SB-45** | **"This prompt resembles one you answered"** | ◑ | **Build.** Emory's challenge prompt vs Duke's. **Points at the draft; never auto-fills it** |

## 5c · Interview prep — an adjacent use nobody has claimed

**⚠️ *"Tell me about a time when…"* IS an interview question.** **The bank is interview preparation material and no tab in HQ owns interviews.**

| # | Feature | AI | Lean |
|---|---|---|---|
| **SB-46** | **The bank as interview prep** | ○ | **Build — it is free.** Same themes, same material, different output. **No new data model** |
| **SB-47** | **A dedicated interview tab** | — | **CUT, and say why now.** **A whole surface for a use the bank already serves.** **If interviews ever need their own tab it is because of logistics — dates, formats, thank-you notes — not material** |
| **SB-48** | **MMI / ethical-scenario practice** | ● | **CUT. `U-12` — this is a coaching product, not a bank feature**, and HQ has no basis to judge an ethics answer |

## 5d · Grounding the draft against the record

| # | Feature | AI | Lean |
|---|---|---|---|
| **SB-49** | **Your draft claims something your record does not show** | ● | **⚠️ SPLIT LEAN.** *"You wrote 'three years in the ED'; your record shows 14 months."* **Catching a factual overstatement before it reaches an application is valuable and it edges on judging the student.** **Narrow it to DATES AND NUMBERS ONLY, never to characterisation** |
| **SB-50** | **What is in your material and not in the draft** | ◐ | **Build.** *"You wrote about the interpreter moment in your reflection and it is not in this essay."* **Retrieval, not critique** |
| **SB-51** | **Quality / strength feedback on prose** | ● | **CUT. `U-9`, and it fails the paste test's spirit** — line edits are writing. **The advisor does this and HQ ceded it** |
| **SB-52** | **Cliché detection** | ● | **CUT.** **Same reason, plus it would flag the honest version of a common story.** *"I want to help people"* is a cliché and is also true |

## 5e · Time, and the fact that four years change a person

| # | Feature | AI | Lean |
|---|---|---|---|
| **SB-53** | **Lock a submitted essay** | ○ | **Build.** Read-only once submitted. **You will want to know exactly what you sent when the interview asks about it** |
| **SB-54** | **An entry's age is shown** | ○ | **Build, free.** *"Written 3 years ago"* is context, not judgement |
| **SB-55** | **Re-read prompt on an old entry** | ◐ | **Weak build.** **⚠️ Close to `SB-18`, which was cut.** **The distinction: this invites the student to reconsider; `SB-18` told them they had contradicted themselves.** **The first is an invitation, the second is a verdict** |

## 5f · ⚠️ SAFETY — the risk that concentrates HERE

**Clinical reflections may contain patient detail. `03-clinical-board.md` §5 bans PHI app-wide.** **But the pillars hold it scattered and STORY BANK AGGREGATES IT.** **The bank is the highest-concentration point for sensitive material in the entire product**, and no row currently says so.

| # | Feature | AI | Lean |
|---|---|---|---|
| **SB-56** | **⭐ State the concentration risk in the spec** | — | **MUST.** **A guard, not a feature.** **Export, sync, and any AI call sends the whole bank — the blast radius is different here than in a pillar** |
| **SB-57** | **Warn before the first AI call leaves the device** | ○ | **Build.** **Once, plainly: your reflections are sent to the model provider.** **`U-8` — states it, does not block** |
| **SB-58** | **PHI reminder at write time, not read time** | ○ | **Build — but it belongs in the PILLARS**, not here. **The fix is at capture; by the time it is in the bank it is too late** |
| **SB-59** | **Redaction pass before export** | ● | **CUT — dangerous.** **An AI redactor that misses one identifier is worse than no redactor**, because the student trusts it |

## 5g · Smaller things

| # | | AI | Lean |
|---|---|---|---|
| **SB-60** | **Pin a handful of entries** | ○ | **Weak.** ⚠️ **This is the `sentToStoryBank` flag returning under a new name. Watch it** |
| **SB-61** | **Print / one-page material sheet for an advisor meeting** | ○ | **Build.** Advisors ask *"what have you got?"* and there is no way to hand it over |
| **SB-62** | **Word-frequency or theme drift chart** | ○ | **CUT.** **A graphic vocabulary violation and it scores nothing useful** |
| **SB-63** | **Import old reflections from a doc** | ◑ | **Build.** **`RM-6` backfill's practical form** — most students arrive with something already written somewhere |

---

## ⚠️ Reading note on Wave 5

**Three rows above are the same idea wearing different clothes and should be watched together: `SB-60` (pin), the cut `sentToStoryBank`, and any future "highlight."** **The gate keeps trying to come back.**

**And two rows are stronger than anything in Waves 1–3:** **`SB-38`** (orphan entries — the bank cannot currently hold the best "why medicine" material) and **`SB-41`** (school-name mismatch — deterministic, cheap, prevents the single most common catastrophic secondary error). **Neither was found by the "comprehensive" sweep.**

---

# Wave 6 · ⭐ THE JOURNAL — ✅ RULED Aug 2026. Orphan entries are bigger than orphan entries

> *"I have this thing where it's kind of like **diary entries, but it's kind of a brain dump.** Any time I have an input in **Overview**, we can actually put it in, and it should sync to Story Bank."*
>
> *"**Every time I have a thought, I just open Voice Memos and voice my thoughts.** It could be something medicine-related, or **it could just be about life.**"*
>
> *"It's important to journal these thoughts because it's always nice to express them and put them on paper. **It can kind of be life-changing if you look back at that, because some things make a thought that's potentially life-changing. If they don't document it, they just forget it the next day, so it's kind of useless.**"*

## 6a · What this actually is

**`SB-38` was specced as *"essay material with no parent record."* Andy has described something larger: a JOURNAL.** **Not premed material that happens to be unattached — thoughts about a life, most of which will never become an essay.**

**And the thesis is the tab's own thesis, widened:** **`§1` says a three-year-old experience becomes a summary of a summary. Andy is saying a thought not written down is gone by tomorrow.** **Same failure, shorter timescale, higher stakes** — *"potentially life-changing… so it's kind of useless."*

**⚠️ This changes what the bank IS.** **It was an aggregate of activity reflections. It is now an aggregate of activity reflections AND a life journal**, and the second may be larger than the first.

## 6b · `U-12` — it fires, and BUILD survives narrowly

| | |
|---|---|
| **Incumbent** | **Day One · Apple Journal · Notes.** Mature, free, already on the phone |
| **Test 1 and 2** | **Both pass** |
| **Test 3 — what the incumbent lacks** | **None of them can place a 2am thought about your grandfather NEXT TO your clinical reflections and retrieve both under *Why medicine*.** **That is the layer above, and it is the whole product** |

### ⚠️ THE LINE — build the ENTRY, not the JOURNAL APP

**Forbidden, by name, because each is a step toward competing with Day One and losing:** **streaks · daily prompts · photos · weather · location auto-stamp · mood tracking · "on this day" · a calendar heatmap · encryption UI.**

**`U-9` independently kills the streak.** **The rest die on `U-12`.**

**What HQ builds is one untyped, dated text entry that lands in the same store as everything else.**

## 6c · Capture — Overview, and the dictation ruling holds

| # | Feature | Surface | AI | Lean |
|---|---|---|---|---|
| **SB-64** | **⭐ A capture box on Overview** | `Overview` | ○ | **STRONG BUILD.** Andy's ask. **⚠️ Cross-tab: this ADDS a feature to `03-overview`, which is already specced. Record it there** |
| **SB-65** | **It lands in the bank immediately** | — | ○ | **Build.** **No inbox, no triage, no "file this later."** **A triage step is the gate returning** |
| **SB-66** | **Untyped by default** | — | ○ | **Build.** **No theme required, no pillar required, no title required.** **A capture that asks questions is a capture nobody uses** |
| **SB-67** | **Paste a voice transcript** | — | ○ | **Build.** **Andy's real workflow is Voice Memos → paste.** **⚠️ This CONFIRMS the dictation ruling rather than breaking it: HQ builds no voice capture and no transcription** (`integration-map` §1). **Apple Voice Memos transcribes natively; the paste is one step** |
| **SB-68** | **≤5 seconds, and it is the strictest instance in the app** | — | ○ | **Guard.** **A thought you have to file is a thought you do not record.** **The bar is Voice Memos: open, talk, done** |

## 6d · Retrieval — journal entries are first-class in the bank

| # | Feature | AI | Lean |
|---|---|---|---|
| **SB-69** | **Journal entries are themeable like anything else** | ◐ | **Build.** *"Why medicine"* will be disproportionately journal-sourced |
| **SB-70** | **Most of them are never used, and that is correct** | — | **Guard.** **`U-9`, `U-7`.** **No "unused thought" nudge. No prompt to do something with it.** **A journal whose entries feel like unfinished tasks is a bad journal** |
| **SB-71** | **The look-back read** | ○ | **Build.** Andy: *"it can kind of be life-changing if you look back at that."* **Plain chronological sort (`SB-12`) already does it — no new surface** |
| **SB-72** | **A separate "Journal" sub-tab** | — | **⚠️ LEAN CUT.** **The bank already holds them and filtering by source is one control.** **A fourth surface for a filter is the mistake `SB-12` avoided.** ⚠️ **But this is the row I am least sure about — a life journal sitting inside an essay tool may feel wrong to a user, and that is a design question a mockup answers better than a catalog** |

## 6e · ⚠️⚠️ SAFETY — this is now the sharpest problem in the product

**`SB-56` flagged that Story Bank concentrates sensitive material. A life journal changes the ORDER of that risk.**

**Clinical reflections may contain patient detail, which the PHI ban addresses. A journal contains the student's own private life** — family, mental health, relationships, things they would never put in an application and may never show anyone. **And under Wave 1d the AI reads the whole bank on every synthesis call.**

| # | Feature | AI | Lean |
|---|---|---|---|
| **SB-73** | **⭐ Per-entry *keep local, never send*** | ○ | **BUILD, and it is not optional.** **The student must be able to write something HQ will never transmit** |
| **SB-74** | **The AI states what it read** | ○ | **Build — `SB-36` already does this and now matters much more** |
| **SB-75** | **Warn plainly before the first call** | ○ | **Build — `SB-57`, escalated.** **Name the journal explicitly, not just "your data"** |
| **SB-76** | **Export is all-or-nothing today** | — | **⚠️ OPEN.** **`SB-29` export ships the journal with everything else.** **Needs a scope choice** |

### ⚠️ `SB-73` LOOKS LIKE THE GATE. IT IS NOT. Recorded so nobody conflates them.

| | `sentToStoryBank` (CUT) | **`SB-73` keep-local** |
|---|---|---|
| **What it asked** | *"Is this good essay material?"* | ***"Should this ever leave my device?"*** |
| **Why it died / lives** | **A judgement of worth. `U-9`. And it starved the AI of context Andy wanted it to have** | **A privacy boundary. Nothing in HQ's rules argues against it** |
| **Default** | — | **OFF. Everything is sendable unless the student says otherwise** |

**Both are booleans on a reflection, which is exactly why the distinction has to be written down.** **If a future reader collapses them, the gate is back.**

---

## ⚠️ What Wave 6 does to the rest of the tab

- **`§1` Purpose needs widening.** **The tab is no longer only about essays.** **It is about not losing what you thought** — and essays are the payoff, not the point.
- **`03-overview.md` gains `SB-64`.** **Cross-tab change to a specced file.**
- **`SB-56` is upgraded** from a flag to a first-order design constraint.
- **The name may be wrong.** ***"Essays & Story Bank"* does not describe a place you keep a diary.** **Not proposing a rename — flagging that the label now undersells the tab.**
