# Research: feature catalog

**Companion to `tabs/06-research.md` (the spec).** **Where they conflict, the spec wins.**

**Built Aug 2026.** Research was the last pillar with no catalog and no board. **The spec was never thin** — 151 lines, seven pillar-specific rules, and the output-pipeline-not-hours inversion, which is the sharpest single call in any pillar file. **What it never had was the big-swings pass**, and `RS-BIG-1` had been sitting in `07-campus-layer-board.md` §5 being called *"the most important single feature in this document"* with no home.

> ### ⚠️ NAMESPACE — `U-n` vs `RO-n`. Read this before citing any code in this file.
>
> **`U-1`–`U-12` are the UNIVERSAL RULES in `general.md`.** They are app-wide and they are not features.
>
> **Research's `Outputs` features were originally numbered `U-1`–`U-12` too. That was a straight collision** — `U-7` meant both *"no non-events"* and *"venue directory"* **in the same document.** **Renamed to `RO-1`–`RO-12` (Research Output) Aug 2026.**
>
> **⚠️ Any prompt, brief, or transcript written before this rename may say `U-7` and mean the venue directory.** **Check which document it is citing.**
>
> **Prefix key for this file:** `RO-` Outputs · `P-` Projects · `N-` Lab notes · `B-` Literature · `D-` Discover · `R-` Wave 0 findings · `RS-` big swings · `U-` **universal rules, elsewhere.**

## How to read the columns

**`St` — where each thing actually stands.**

| | |
|---|---|
| **`live`** | **In the shipped code** — `ExperiencePillar.tsx` (shared builder) + Research config + `ResearchWorkspace` |
| **`spec`** | Written into `06-research.md` |
| **`board`** | Ruled here, not yet in the spec. The migration backlog |
| **`open`** | **Needs Andy** |
| **`cut`** | Rejected. Kept so it is not re-proposed |

**`AI`** — `○` deterministic · `◑` better with AI · `◐` degrades gracefully · `●` requires an LLM.

**`Surface`** — `Projects` · `Outputs` · `Lab notes` · **`Reflections`** · **`Discover`** · `Profile` · `shell` · `none`. **`Discover` RETURNED Aug 2026** — see §7b-x. *(It was pulled mid-session and the pull is preserved in Wave 3-0; **the empty-state placement it produced survives the reversal**.)*

**Entity- and ledger-tab rows carry `(list)`, `(panel)`, or `(page)`** per `05` §2c. Applied Aug 2026 — **`Outputs`: 1 list · 6 panel · 4 page** · **`Projects`: 1 list · 3 panel · 3 page.**

> ### ✅ Sub-tab set RULED Aug 2026 — `RS-31` and `RS-o3` both closed
>
> **`Projects` · `Outputs` · `Lab notes` · `Reflections`.** **Four, and the only pillar with two writing surfaces.**
>
> | Slot | Clinical | Volunteering | Shadowing | Extracurriculars | **Research** |
> |---|---|---|---|---|---|
> | **The relationship** | Sites | Orgs | Physicians | Organizations | **`Projects`** |
> | **The ledger** | Shifts | Events | Visits | Initiatives | **`Outputs`** |
> | **The writing** | Reflections | Reflections | Reflections | Reflections | **`Lab notes` + `Reflections`** |
> | **Not yours yet** | — | — | — | Discover | **`Discover`** (§7b-x) |
>
> **Two writing surfaces, deliberately** (`RS-o3`). **A lab note is operational** — *"the experiment, decision, result, or blocker,"* five seconds. **A reflection is meaning.** **`RM-2`'s conversation against a five-second bench log would be absurd**, and §9 already says the reflective material exists: *"lab notes and setbacks are unusually good essay material."*
>
> **⚠️ `Discover` RETURNED** (§7b-x, Andy, Aug 2026) — **venues to present and research grants.** **Five sub-tabs, not four.** **Wave 3-0's move of the four discovery features to `Projects` is NOT fully undone:** the lab directory goes to `Discover`, but **`Projects` still empty-states into it** rather than saying *"add your first project."*

---

## Wave 0 · THE REFRAME (Andy, Aug 2026) — from lived experience, and it moves the whole pillar

**Everything below Wave 0 was written by inference. This was written from Andy's actual year-long research project** — a black-garlic-extract study with DPPH antioxidant assays — **and it corrects the pillar's purpose, its data model, and what its hardest problem is.**

### 0a · What this tab is FOR

> *"It's supposed to be an interface for keeping track of your current research projects… you're tied to one lab, or maybe two, but normally just one lab throughout your entire undergrad. You're working through different projects, but it's basically a hub."*
>
> *"It's different than extracurriculars where you're trying to find opportunity. It assumes that you have one early on and that you stick with it. It's a longer-term commitment."*
>
> *"It's more of a class-centered hub thing instead of finding prospective research opportunities. That is perhaps a feature, but that's not really the main point."*
>
> *"I'm trying to organize research roles and experiences and get that set: targets, research paper, charts, presentations. **It's really meant to help along your research process.**"*

| | Extracurriculars | **Research** |
|---|---|---|
| **Shape** | **Breadth.** Many orgs, and finding new ones is half the job | **Depth. One lab, maybe two, for four years** |
| **The tab's job** | Track what you are part of + discover more | **A working hub for the projects you have** |
| **Discovery** | `Discover` is a first-class sub-tab | ***"Perhaps a feature. Not the main point."*** |

> **⚠️ Partly re-reversed by §7b-x** — `RS-BIG-1` moves to `Discover`, though the empty-state behaviour below still stands.
>
> **⚠️ This demotes `RS-BIG-1`.** The lab directory was called *"the most important single feature in this document"* — **but that was in `07-campus-layer-board.md`, judging opportunity ACCESS across the whole app.** **It is not what this tab is for.** **Wave 3-0's placement — the directory as the empty state, collapsing once you have a project — turns out to be exactly right, and now for the stated reason rather than by accident.**

**The comparison that fits is Academics' Class Hub, not ECs' Organizations.** **You have one lab the way you have one course, and the tab exists to help you do the work.**

### 0b · The data model is wrong — the DPPH case

> *"I ran the DPPH samples on my black garlic extract, and I tested different types of samples. There are a bunch of different trials, and there was really no way to put it in an organized fashion. **It was hard to find when the last time I did a specific extract was**, because I had so many types of extracts that **I didn't know what the DPPH results were the last time I did that particular sample.**"*
>
> *"When I was trying to standardize my experiment, I made sure there weren't any confounding variables because I suspected there was one — there was a big significance in the data that was being unexplained. **I didn't know what the previous result was, and maybe I'm misremembering.**"*

**`LabNote` is a flat dated entry. That is the Google-Doc structure that failed, rebuilt in an app.**

**The real unit is a measurement, and it has three axes:**

| | Example |
|---|---|
| **Method / assay** | DPPH |
| **Sample / condition** | black garlic extract, type B |
| **Trial** | run 3, on a date, with a value |

> **The question the model must answer is *"show me every DPPH run on extract type B, in order, with values."*** **A dated list cannot answer it. A three-axis record answers it trivially.**

**And the reason it matters is not tidiness — it is validity.** **He suspected a confounding variable and could not check, because he could not retrieve the prior conditions.** **Being unable to compare run 3 against runs 1 and 2 is a scientific failure, not an admin one.**

### 0c · The hardest problem is retrieval, and he wants an assistant for it

> *"I documented everything, but it was really hard to go back and recall… it was a hassle to go back and look at previous material **instead of having it be handed to me.**"*
>
> *"I just needed an AI or intelligence to tell me something. Upon me addressing it — 'oh, I had this sample, I want to obtain information' — **I want the AI to help me go look and fetch it.**"*
>
> *"**Throughout the entire app**, I'd like to use an AI to fetch things that I'm looking for because I kind of wanted to have **that Jarvis feeling**, where it's like my personal assistant. That's what makes it smart as well."*

**Capture was never the problem. He captured everything.** **Every retrieval feature currently in this catalog — `RM-3` search, `L-2` link-to-output — assumes the student remembers what to search for, and he explicitly did not.**

**This is app-wide and it is not Atlas.** **Atlas is RAG over an external premed corpus; this is retrieval over the student's OWN records.** **Different source, different trust model, same interface.** **It needs its own treatment and does not exist anywhere in the docs.**

### 0d · Two corrections to things I guessed wrong

| I proposed | What actually happened |
|---|---|
| **Literature "mapped out"** — I read this as a structured map and was about to spec one | ***"I literally just dumped all the papers I could onto a Google Doc"*** — headings and a summary each. **No mind map, no interconnection.** **Do not build a graph. Build a list with summaries** |
| **Losing track of incubations** | **Never happened.** *"I planned it the day before, and it was meant to span that entire class period."* **The waiting itself was fine** |

**But the waiting produced a different want:**

> *"There were a couple of things that I could have done more while waiting, because **most of it was just messing around**… I could have been a lot more productive in the meantime — **not only with the research project itself but just to stay busy, like maybe catch up on a few assignments.**"*

**Dead time inside a lab session is a real, recurring, cross-pillar gap** — and HQ already holds everything needed to fill it.

### 0e · Outputs descend from each other — the lineage finding

> *"The first piece of original work was my **proposal** — study steps, instructions, protocols I got from other research articles. Then I did a **presentation** on that. Once I did my first iteration of trials I did **a presentation there**, explaining my findings. At the end of fall I did a **final presentation**. I did a **final paper**, basically an article, and **a lot of that information was from my proposal**."*
>
> *"My presentation was based off of my paper that I'd written before… **It's not like I was making anything from scratch, but I kind of was at the same time**, because initially I was taking information from other papers, my papers, and my research itself. It just kept going from there."*

**Six artifacts in one year, and every one after the first was assembled from the ones before it.**

**The spec models `ResearchOutput` as a flat list with a status each. That is as wrong as `LabNote` was** — it captures that a paper exists and loses the fact that it came from the proposal.

| # | Feature | Surface | AI | St | |
|---|---|---|---|---|---|
| **R-1** | **`derivedFrom[]` — outputs carry lineage** | Outputs (panel) | ○ | `open` | The paper descends from the proposal, the data, and the literature |
| **R-2** | **`proposal` is a missing output type** | Outputs (panel) | ○ | `open` | **The first original work a student produces, and the enum has no word for it** |
| **R-3** | **The data surface is blocks, not one table** | Projects (panel) | ○ | `open` | *"It doesn't always have to be a table"* |
| **R-4** | **Hand me the sources** | Outputs (page) | ◑ | `open` | **The whole point of the pillar** |

**`R-2`:** the current enum is `poster · abstract · oral presentation · manuscript · publication · preprint · thesis · protocol/IRB`. **No `proposal`** — and it is *"the first piece of original work I did."* **A student's first real output is invisible to the model.**

**`R-3`:** *"It doesn't really always have to be a table. It can be any sort of figure to input information — a bunch of scientific info is being put, not all of that would be in a table."* **Separate tables per assay, confirmed** (DPPH is one, total phenolic is another) — **but the surface is a canvas of typed blocks**: a table where a table fits, an image for a gel, a chart, freeform text. **Do not build one grid and force everything into it.**

**`R-4` — and this is the pillar's payoff.** When the student starts the final paper, **HQ hands them the proposal, the two prior presentations, every DPPH run, and the literature summaries** — instead of them hunting through Drive.

> **This is `E-16`'s pattern, one level up.** **ECs assembles a 700-character AMCAS description from real material. Research assembles a paper from real material.** **Same mechanism, and the Research case is the more valuable one because the student is doing it four times a year rather than once at application.**
>
> **`U-10` still governs:** **HQ assembles and hands over. The student writes.** **It never drafts the paper.**

### 0f · A protocol is a record, not a paragraph — and paraphrasing it silently changes it

> *"Anything in my proposal was **processed through the specific proposal and put into my own words. It wasn't actually verbatim** what the instructions were… **which may have changed some things with the protocol itself.**"*
>
> *"**I didn't always really trust myself**, so I would always go back to the paper itself and just read what they had… **If I were to do it again, I would rather just take from the paper itself.**"*

**He wrote a protocol into his proposal in his own words, then could not trust his own version, so he re-read the source paper every single time.** **The paraphrase was a liability he had to route around for a year.**

| # | Feature | Surface | AI | St | |
|---|---|---|---|---|---|
| **R-5** | **`Protocol` is a first-class record** | Projects (panel) | ○ | `open` | Reused across trials, has a source, gets amended, needed at the bench |
| **R-6** | **Source text and your version are separate fields** | Projects (panel) | ○ | `open` | **The paraphrase never overwrites the original** |

**`R-5`:** a protocol is **not text inside a proposal.** It is used across dozens of trials, it carries a citation, it changes over time, and **it is the thing you have open while you work.** Burying it in a document is why he had to hunt for it.

**`R-6`:** the record holds **the source citation and quoted method** alongside **the student's working version**, side by side, never merged.

> **This is `S-10`'s rule, arrived at independently.** Shadowing already ruled that an imported physician bio and the student's own notes **stay separate fields** — *"different things and must not merge."* **Same principle, and here the stakes are methodological rather than cosmetic:** a merged paraphrase is a protocol nobody can verify.
>
> **`U-10` applies too — paste, never fetch.** The student copies the method in; HQ does not crawl the paper.

### 0g · Nothing recorded what changed, or why — the decision log

> *"Between the first trials and the final paper, **the study did change**. I noted it through my presentations, but **it obviously wasn't written in that explicitly**… it may have been implicitly mentioned in my discussion."*
>
> *"That was kind of **just something that was always in my head**. **There is nothing really on paper to track that a change had happened with the experiment and why.**"*

**This is the largest gap in the pillar and it came from the question that almost was not asked.**

| # | Feature | Surface | AI | St | |
|---|---|---|---|---|---|
| **R-7** | **The decision log** | Projects (panel) | ○ | `open` | **What changed in the study, and why** |

**A dated entry, two fields: what changed · why.** *"Dropped the 60-minute incubation condition — inconsistent across replicates and it was not answering the question."* · *"Added extract type G after the September literature turned up a comparable prep."*

- **`○` deterministic. It is a text record**, not an inference.
- **It is not a reflection.** `RM-2`'s conversation is about meaning; **this is a factual record of a methodological decision.** Different surface, different purpose, and merging them would lose both.
- **Never nagged. Never counted.** No *"you have not logged a decision this month."* **`U-8`, `U-9`.**

**Why it earns its place — three payoffs, and the first is the one nobody builds for:**

| | |
|---|---|
| **Scientific integrity** | He suspected a confounding variable and *"didn't know what the previous result was."* **A decision log is the audit trail that makes a change checkable instead of remembered** |
| **The interview** | ***"Tell me about a time your project changed direction"* is a standard research interview question**, and the honest answer lives in exactly this record. **He had it only in his head** |
| **The paper** | The discussion section is largely about what changed and why. **He wrote it implicitly from memory** |

> **This is the clearest case in the whole project of *capture at the moment, retrieve at the moment of need*.** **The change is obvious the day it happens and gone within a month.**

### 0h · The reuse sweep — what Research borrows, and from where

**Swept Aug 2026 across Overview, Academics, Class Center, MCAT, and the four other pillars, per Andy's instruction.** **Nine of the eleven Wave 0 features have an existing pattern. Two are genuinely new.**

| Research needs | Reuses | Status of the source |
|---|---|---|
| **The project page** (`0a` — a working hub) | **Academics `ClassHub` + `ClassCenter`** | **Built. 3,630 lines.** Five product views, notes, topics, files, contacts, links, inline editing. **The closest existing thing to what Andy described, and it already works** |
| **Literature library** (`0d`) | **MCAT's `ShelfItem` / Bookshelf** (#38) | Specced. **A "your copy" layer over a resource bank** — access, acquisition, last used. **A paper is a `ShelfItem` with a summary** |
| **Paper links** | **`Preview Link Card`** (`03-overview` §6a) | Built. Already reused for the Shadowing physician bio |
| **Assay tables** (`0b`, `R-3`) | **`TrackerTable`** | Built. **The one table component — never fork it** |
| **Protocol: source vs your version** (`R-6`) | **Shadowing `S-10`'s bio rule** | Specced. *"The imported bio and the student's own notes stay separate fields"* |
| **Retrieval assistant** (`0c`) | **`CommandSearch` + `U-11`** | Built (search). **The assistant is a second mode of it** |
| **Reflections** | **`RM-1`–`RM-6`** | Specced. Inherited whole |
| **Deadlines** | **The Attention bell** | Specced. **Never a second calendar** |
| **Blocks that are not tables** (`R-3`) | **`ClassCenter`'s note/file/topic blocks** | Built |
| **⚠️ The decision log** (`R-7`) | **Nothing. New.** | No pattern anywhere in the app |
| **⚠️ Output lineage** (`R-1`) | **Nothing. New.** | Closest cousin is `E-16`, which assembles but does not record descent |

> **This is the point of the sweep: Research looked like the biggest greenfield build in the project and it is mostly assembly.** **The two genuinely new mechanisms are both small** — a dated two-field log, and a `derivedFrom[]` array.

**Three more features the sweep turned up by analogy, worth proposing:**

| # | Feature | From | |
|---|---|---|---|
| **R-8** | **Unused literature** | Academics **#30** material staleness | *"14 papers in your library. 4 are cited in something you wrote."* **At writing time that is the useful read** — it says what is available and unspent. **Once, at draft time, never as a nag** |
| **R-9** | **What is next on this project** | MCAT **#34** the one-question hero | **Answers *"what should I do right now?"* with a reason.** Directly addresses `0d`'s dead time: *"DPPH run 4 on extract C is the only trial without a replicate."* **`U-8` — it states the gap, never instructs** |
| **R-10** | **Session dead time** | `L-A` + `0d` | *"Incubation runs 40 minutes. You have a CHEM problem set due Thursday."* **Optional, off by default, and it is the one feature here that reaches outside the pillar** |

---

## Wave 1 · The record

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 1 | **Output pipeline as the hero** | Outputs (list) | ○ | `live` | project · type · venue · deadline · status. **Hours are not the hero and not in the stat strip** — the single most important rule on this pillar |
| 2 | **`ResearchWorkspace`** | Projects (panel) | ○ | `live` | Lab notebook plus `Meetings with PI`, **already carrying authorship expectations as a standing agenda item** |
| 3 | **Output types adapt to `researchType`** | Outputs (panel) | ○ | `spec` | `wet-lab · computational · clinical · social-science`. **A clinical project produces a chart review and an IRB protocol before any poster** |
| 4 | **Authorship expected vs confirmed** | Outputs (panel) | ○ | `spec` | Per output. **The conversation is cheap now and impossible at submission** |
| 5 | **Role progression within one project** | Projects (panel) | ○ | `spec` | *Glassware → protocol → designing → interpreting.* **"Research assistant for two years" hides whether anything changed** |
| 6 | **External deadlines on `ResearchOutput`** | Outputs (panel) | ○ | `spec` | Abstract windows and conference dates. **Surfaced via the Attention bell — never a Timeline record, never a second calendar** |
| 7 | **`LabNote`** | Lab notes | ○ | `spec` | Date plus one line, under five seconds. Feeds Story Bank |
| 8 | **`PIRelationship`** | Projects (panel) | ○ | `spec` | `meetingCadence · lastContact · openAsks[] · letterStatus`. **Shared `Person` record with Letters — never forked** |
| 9 | **Longitudinal from day one** | — | ○ | `spec` | Projects span years and gap years. **A term-scoped research record is worthless by application time** |

## Wave 2 · The intelligence that exists

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 10 | **Output-gap detection** | Projects (page) | ○ | `spec` | *"14 months in the Okonkwo lab, no output recorded."* **The pillar's highest-value nudge** |
| 11 | **Authorship conversation prompt** | Outputs (page) | ○ | `spec` | Fires once past a meaningful duration with no authorship record |
| 12 | **Authorship drift** | Outputs (page) | ○ | `spec` | Expected and confirmed disagree. **Stated plainly, never editorialised** |
| 13 | **PI contact staleness** | Projects (page) | ○ | `spec` | *"No recorded contact in 4 months. Letter strength tracks contact"* |
| 14 | **Independence stagnation** | Projects (page) | ○ | `spec` | *"Your role has read 'research assistant' for 18 months."* **Descriptive, never scolding** |
| 15 | **Type-mismatch catch** | Outputs (page) | ○ | `spec` | A computational project is never nudged toward wet-lab artifacts |
| 16 | **Unlinked note** | Lab notes | ○ | `spec` | A lab note with essay material not yet sent to Story Bank |

## Wave 3-0 · RULED Aug 2026 — the lab directory IS this pillar's empty state

> ### ⚠️ PARTLY SUPERSEDED by §7b-x — `Discover` came back (Andy, Aug 2026)
>
> **`RS-BIG-1` and `RS-BIG-4` move to `Discover`.** **What survives, and is the reason this wave was worth writing: `Projects` empty-states into the directory rather than into *"add your first project."*** **The tab is where the content lives; the empty state is how a student with nothing finds it.**

**`Discover` was pulled from every pillar except Extracurriculars** (`05-experience-pillar.md` §2a-ii). **That left `RS-BIG-1` to `RS-BIG-4` without a home**, and `RS-BIG-1` is greenlit and called *"the most important single feature"* in the campus board.

> **They go on `Projects`, and the placement is better than a sub-tab was.**

**§11 already says it:** *"most students meet this page before they have a position."* **A student with zero projects opening Research is not looking for a logging form — they are looking for a way in.** Today the page offers *"add your first project."*

| Feature | Surface | How it renders |
|---|---|---|
| **`RS-BIG-1`** the lab directory | **`Projects (page)`** | **It IS the empty state.** Zero projects → the directory is the page. **Once you have one, it collapses to a section you can reopen** — students join a second lab, and the third-year switching fields needs it as much as the first-year |
| **`RS-BIG-2`** the ask, tracked | **`Projects (list)`** | **Asks sit in the project list as a distinct row shape.** Not a separate tab, not a pipeline — **a lab you have written to is a lab you are pursuing, and it belongs beside the labs you are in** |
| **`RS-BIG-3`** cold email templates | **`Projects (page)`** | Beside the directory. **A resource, not a tracker** |
| **`RS-BIG-4`** research events | **`Projects (page)`** | `EV-1` typed to research, surfaced here |

**Why this beats a `Discover` tab:** a sub-tab a student visits once and never returns to is worse than an empty state that becomes useful. **The directory appears exactly when it is needed and gets out of the way when it is not** — which is what §11's stage analysis already implied and nobody had acted on.

**`RS-BIG-2` keeps every guard:** no reply is not a rejection, no rejection count, no response rate. **`U-7`.** **The ask row converts to a real project when one lands, and the ask is kept and dated** — that search is real interview material.

## Wave 3 · The big swings (Aug 2026 — all four greenlit)

| # | Feature | Surface | AI | St | |
|---|---|---|---|---|---|
| **RS-BIG-1** | **The lab directory** | Projects (page) | ○ | `board` | **GREENLIT.** Blocked on a research ask |
| **RS-BIG-2** | **The ask, tracked** | Projects (list) | ○ | `board` | **GREENLIT.** Blocked on nothing |
| **RS-BIG-3** | **Cold email templates** | Projects (page) | ◐ | `board` | **GREENLIT** |
| **RS-BIG-4** | **Research events** | Projects (page) | ○ | `board` | **GREENLIT.** Reuses `EV-1` wholesale |

### `RS-BIG-1` — the lab directory

**Who takes undergraduates, what they work on, what they have published recently, and whether they are recruiting now.**

> `07-campus-layer-board.md` §5: ***"Students find labs through friends, which means students without the right friends do not find labs."*** **This is where privilege compounds most in the premed path**, and a curated directory is the closest thing HQ can do to levelling it.

- **Category A** — UNC department pages and faculty listings are published. **Sourced, dated, human-reviewed, `freshness`-tracked. Never scraped** (`03-clinical-board.md` §5).
- **Fields per lab:** PI · department · focus area · **whether they publish an undergraduate application route** · recent output · last verified.
- **`○` deterministic.** A dataset and a filter.
- **The recruiting field is the one that rots fastest** and must carry its own date. **A stale *"recruiting"* is worse than no field** — it sends a student to a closed door and reads as HQ's fault.
- **Recommend by interest and by what the student already does. Never by popularity** — the standing rule from `07` §2b.
- **Link out; do not rebuild.** HQ is the front door and an honest signpost.

**Research ask:** *UNC research labs taking undergraduates, by department — PI, focus area, whether an application route is published, and how often the listing changes.* **Already logged as ask #4 in `07-campus-layer-board.md` §7.**

### `RS-BIG-2` — the ask, tracked

**The stage most premeds are in, for the longest, with the least help — and the pillar's real empty state.** `06-research.md` §11 already knows it: *"most students meet this page before they have a position."*

- **A pre-position record:** lab · professor · date emailed · what you sent · response · follow-up due.
- **It is mostly rejection, and that is the design problem.** Students lose the thread across fifteen emails, then stop.
- **The follow-up date is the feature.** *"You emailed Dr. Okonkwo 12 days ago, no reply. One follow-up is normal."* **Stated once, per ask, never nagged.**
- **No reply is not a rejection and is never recorded as one.** **The non-event rule holds** — HQ counts what happened, never what did not. **No "rejection count", no response rate, no success percentage.** A student who sees *"1 of 15 replied"* stops sending.
- **Converts to a `ResearchExperience` when one lands.** The ask record is kept and dated — **that search is itself worth remembering, and it is real interview material.**
- **`○` deterministic. Blocked on nothing.** This is the one to build first.

### `RS-BIG-3` — cold email templates

**Already ruled for Shadowing** (Andy: *"I'd rather incorporate cold email templates from online"*) — **and it bites harder here.**

- **A cold email to a PI has conventions a first-year cannot guess:** the subject line, naming a specific recent paper, what to attach, how long, when to follow up.
- **Sourced templates, Category B** (`knowledge-sources.md`) — guidance for a human, driving no app logic. **Cited and dated.**
- **HQ never sends anything.** Copy to clipboard, or open the mail client prefilled. **No integration, no tracking pixel, no send button.**
- **`◐`** — the templates are static and work with no key; **an AI pass that adapts one to a specific lab is a bonus, never the path.**

### `RS-BIG-4` — research events into `Discover`

**RA info sessions, lab open houses, department research days.**

**No new engine.** `EV-1` (`07-campus-layer-board.md` §2d) already does flyers, Heel Life feeds, the feasibility call, and bell delivery. **This is one more consumer, typed to research.** **Do not build a second event system.**

## Wave 3b · The reflection mechanism — and Research does not cleanly fit

**`RM-1` to `RM-5` are shared behaviour in `05-experience-pillar.md` §2b-ii.** Every other pillar inherits them straight. **Research is the one place the inheritance is genuinely awkward, and forcing it would be wrong.**

### The problem

**Research's writing surface is `Lab notes`, and a lab note is not a reflection.**

| | |
|---|---|
| **A lab note** | *"The experiment, decision, result, or blocker."* **Logged in under five seconds. Operational.** It is the working record of what happened at the bench |
| **A reflection** | *"What did this mean, what did I learn, what would I do differently."* **Minutes, not seconds. Essay material** |

**`RM-2` — reflection as conversation — makes no sense against a five-second operational log.** HQ responding to *"gel ran too long, redo Monday"* with a probing question is absurd.

**But the spec says reflections exist here anyway.** §9: ***"lab notes and setbacks are unusually good essay material; research failure is a recurring interview topic."*** **So the material is real and has no surface built for it.**

### What inherits cleanly regardless

| # | Applies to | |
|---|---|---|
| **`RM-3`** · search your own writing | **Lab notes** | **Three years of bench notes is the largest text pile in HQ.** Inherits without modification |
| **`RM-5`** · the unpacked headline | **Depends on `RS-o3`** | Vocabulary would be `notes` or `reflections` |
| **`RM-1`** · the moments HQ asks | **Partially** | **The triggers are real and are output-shaped, not session-shaped:** an output changes status · a project ends · an authorship conversation happens. **Never "you logged a lab note, reflect on it"** |
| **`RM-2`** · reflection as conversation | **Only on reflections, never on lab notes** | See `RS-o3` |
| **`RM-4`** · synthesis threads | **Only on reflections** | *"What did three years in this lab teach you?"* is a real question. *"Group your bench notes"* is not |

> ### ✅ `RS-o3` — RULED (Andy, Aug 2026): YES. Five sub-tabs.
>
> **`Projects · Outputs · Lab notes · Reflections · Discover`.** **The most sub-tabs of any pillar, and deliberate.**
>
> - **`Lab notes` stays operational** — the experiment, decision, result, blocker. **Five seconds. No `RM-2`, no conversation, no prompting.** `RM-3` search applies; it will be the largest text pile in HQ.
> - **`Reflections` holds meaning** — what the project taught, the setback, what failure looked like. **`RM-1`, `RM-2`, `RM-4`, `RM-5` all live here.** Feeds Story Bank.
> - **This also settles `RS-31`**, which was the last open structural question on this pillar.
>
> **The stated risk, so it is watched rather than discovered:** **the operational habit is the one that sticks.** A student will log bench notes daily and may never open `Reflections`. **`RM-1`'s triggers are what prevent that** — and here they are output-shaped, not session-shaped: *an output changes status · a project ends · an authorship conversation happens.* **Never *"you logged a lab note, reflect on it."***

> ### `RS-o3` — the original question, retained
>
> **Does Research get a `Reflections` surface separate from `Lab notes`?**
>
> **The case for:** every other pillar has one · the spec already says the material exists and is *"unusually good essay material"* · **`RM-2` and `RM-4` have nowhere to live otherwise** · Story Bank needs the student's own reflective writing and a bench log is not that.
>
> **The case against:** a fifth sub-tab · and the risk that **the reflection surface stays empty while the lab notes fill up**, because the operational habit is the one that sticks.
>
> **My read: yes, and it changes `RS-31`** — the sub-tab set becomes `Projects · Outputs · Lab notes · Reflections · Discover`, which is five. **`04` §0b does not cap sub-tab count** (that was already established for ECs), **but five is the most of any pillar and deserves the question rather than the assumption.**

## Wave 5 · `Outputs` — the pillar's hero surface, worked (Aug 2026)

**Seven rows, and it is the surface the entire pillar is built around** — *"output-shaped, not hour-shaped."* **Four gaps, and the first two are things the current model cannot represent.**

| # | Feature | Surface | AI | St | |
|---|---|---|---|---|---|
| **O-1** | **A rejected output is resubmitted, not replaced** | Outputs (panel) | ○ | `open` | The model has no way to say *"same work, new venue"* |
| **O-2** | **Co-authors** | Outputs (panel) | ○ | `open` | **An output has other people on it and none are recorded** |
| **O-3** | **The deadline before the deadline** | Outputs (panel) | ○ | `open` | Your PI needs it two weeks before the conference does |
| **O-4** | **Where undergrads actually present** | Outputs (page) | ○ | `open` | Venue is a free-text field a first-year cannot fill |

### `O-1` — resubmission

**`RS-b` ruled rejected outputs stay visible, collapsed, because rejection is normal and good interview material.** **But rejection is rarely the end** — an abstract turned down at a national conference goes to a regional one, usually unchanged.

**Today that means creating a second output**, which double-counts the work and loses the history. **The record should carry its venues in sequence:** *"Rejected at ACS Spring, accepted at Carolina Research Symposium."*

**That sequence is the honest story and it is stronger than hiding the first attempt.**

### `O-2` — co-authors

**Every output has other people on it, and the entity records none of them.** It has `authorshipExpected` and `authorshipConfirmed` — **the student's own position — and no list of who else is on the paper.**

- **Co-authors are `Person` records**, shared with Letters like every other contact. **Never forked.**
- **This is how second letters happen.** The PI writes one; **a postdoc who worked with you daily for two years is often the better writer and nobody records that they exist.**
- **`S-13`'s lesson applies in reverse:** Shadowing collapsed four roles into one person. **Research has one person recorded and four roles' worth of people missing.**

### `O-3` — the deadline before the deadline

**`ResearchOutput.deadline` holds the external date. The one that actually binds is earlier:** your PI wants a draft two weeks out, the department needs institutional sign-off, an IRB amendment takes a month.

- **An internal deadline, student-set, optional.** **HQ never invents one** — `U-8`.
- **It is the date that goes to the bell**, not the conference date. *"Abstract due to the conference 15 March. You said Dr. Okonkwo needs it by the 1st."*
- **`L-A` reads it** — a draft deadline is a real capacity claim.

### `O-4` — where undergrads actually present

**`venue` is free text, and a first-year has no idea what to put in it.** They do not know that UNC runs its own research symposium, that regional conferences accept undergraduate abstracts, or that some journals have undergraduate sections.

- **Category A** — sourced, dated. Venue name · what it accepts · typical window · undergraduate-friendly or not.
- **It pairs with `O-1`:** the resubmission target list is exactly this data.
- **Never a recommendation.** HQ lists venues; **it does not tell a student where to submit.**

## Wave 6 · `Lab notes` and `Reflections` — the two writing surfaces

**Research is the only pillar with two, and `RS-o3` ruled that deliberately** (`06-research-feature-catalog.md` Wave 3b): **a lab note is operational, a reflection is meaning.**

### `Lab notes` — one row today

| # | Feature | Surface | AI | St | |
|---|---|---|---|---|---|
| **L-1** | **`RM-3` search** | Lab notes | ○ | `spec` | **Three years of bench notes is the largest text pile in HQ.** Inherited whole |
| **L-2** | **A note can attach to an output** | Lab notes | ○ | `open` | **The gel that failed became the figure that worked** |
| **L-3** | **A blocker is a note that resolves** | Lab notes | ○ | `open` | *"Waiting on reagents"* is not an observation |

**`L-2`:** the entity has `LabNote` and `ResearchOutput` with no link between them. **At writing time the student needs the notes behind a figure**, and reconstructing which of 400 notes fed which panel is impossible after the fact. **Attach at write time, retrieve at draft time.**

**`L-3`:** *"waiting on reagents,"* *"instrument down,"* *"need IRB amendment"* are a different kind of entry — **they have a resolution and they block work.** A blocker note carries an open/closed state; **an observation does not.** **No nagging, no age alert** — it simply reads as open until the student closes it, and **`RM-1` never prompts reflection on a blocker.**

### `Reflections` — the new surface, zero rows

**`RM-1` to `RM-6` inherit whole from `05-experience-pillar.md` §2b-ii.** **Research's own part is only the triggers and the copy** — and per §2b-ii's reading note, **a low row count here is inheritance working, not a gap.**

| Research's contribution | |
|---|---|
| **Triggers** | An output changes status · a project ends · an authorship conversation happens. **Never *"you logged a lab note, reflect on it"*** — that is `RM-1` firing on an operational log, which `RS-o3` explicitly forbids |
| **Prompt copy** | **Research's honest question is about setbacks.** §9: *"lab notes and setbacks are unusually good essay material; research failure is a recurring interview topic."* **No other pillar's prompt can ask *"what didn't work, and what did you do about it?"*** and mean it |

## Wave 7 · THE COMPREHENSIVE SWEEP — everything, per sub-tab (Aug 2026)

**Andy: *"it needs to be COMPREHENSIVE."*** **Generated in one pass rather than by interview, drawing on the Wave 0 findings, the cross-pillar sweep, and what undergraduate research actually involves.** **Nothing here is ruled. Everything is `open`.**

### 7a · `Projects` — the lab and the work

| # | Feature | Surface | AI | |
|---|---|---|---|---|
| **P-1** ✅ | **Project `status`** — `exploring · active · paused · finished` | list | ○ | **`exploring` is the topic hunt** (`0a`): months before there is a project. **`paused` is the summer**, which is not abandonment |
| **P-2** ✅ | **The question** | panel | ○ | One line. *"Does black garlic extract show higher antioxidant activity than raw?"* **The thing every other record hangs off, and the current entity has no field for it** |
| **P-3** ✅ | **Decision log** (`R-7`) | panel | ○ | What changed · why. **The pillar's strongest feature** |
| **P-4** ✅ | **`Protocol` as a record** (`R-5`, `R-6`) | panel | ○ | Source citation + quoted method + **your working version, separate** |
| **P-5** ✅ | **Protocol amendments** | panel | ○ | A protocol changes mid-study. **Versioned, and a trial records which version it used** — otherwise runs 1 and 7 are silently incomparable |
| **P-6** ✅ | **Data blocks, not one table** (`R-3`) | panel | ○ | `TrackerTable` per assay · image blocks for gels and plates · chart · freeform |
| **P-7** ✅ | **Lab members, not just the PI** | panel | ○ | **You work with a grad student or postdoc daily and the model only knows the PI.** Shared `Person` records. **This is where the second letter comes from** |
| **P-8** ✅ | **Research training and certifications** | panel | ○ | **CITI, IRB, biosafety, animal handling, chemical hygiene.** Real, dated, sometimes expiring — **and `Clinical`'s credential tracker (#20–24) is the exact component.** **Reuse, never fork** |
| **P-9** ✅ | **Lab cadence, hours derived** | panel | ○ | *"Tue/Thu afternoons, 6 hrs/week."* **Hours derived from cadence × span** — **`A″` from Extracurriculars, inherited whole.** Nobody logs a lab session |
| **P-10** ✅ | **Funding — split in two** | panel + page | ○ | **RULED Aug 2026.** **`L-D` is the wrong home — that is money going OUT** (MCAT, AMCAS, secondaries, interviews). **Research funding comes IN.** **The fact you were funded lives on the project** (*"Supported by a SURF award, summer 2026"*) — a CV line and a real AMCAS detail. **The deadline to apply goes where `C-BIG-1`'s windows go** — SURF opens in February and missing it costs a summer, **which is an application-cycle date, not a cost** |
| ~~**P-11**~~ | ~~Lab meeting presentations~~ | — | — | **CUT Aug 2026 — absorbed into `RO-10`.** Most labs run a rotating group meeting and it is the most frequent presenting a student does. **But if every lab meeting becomes a pipeline entry, the pipeline fills with routine internal noise and the poster that mattered is buried.** **A lab meeting is an OCCASION on which you received feedback** — dated, with what was said. **`RO-10` captures the part that improved the work** |
| **P-12** | **What is next on this project** (`R-9`) | page | ◑ | MCAT #34's hero, retargeted. **States the gap, never instructs** |
| **P-13** | **The lab directory** (`RS-BIG-1`) | page | ○ | **The empty state** (Wave 3-0) |
| **P-14** | **The ask, tracked** (`RS-BIG-2`) | list | ○ | Ask rows beside project rows. **No rejection count** |
| **P-15** | **Cold email templates** (`RS-BIG-3`) | page | ◐ | Category B |
| **P-16** | **Research events** (`RS-BIG-4`) | page | ○ | `EV-1`, typed |
| **P-17** | **Session dead time** (`R-10`) | page | ○ | **Off by default.** The one feature reaching outside the pillar |
| **P-18** | **`PlaceLine` on the lab** | panel | ○ | Building · travel · `Open in UNC maps ↗` |

### 7a-x · Collaboration — CUT (Andy, Aug 2026)

> *"I think you should be able to add people to workspaces and send them invites, just like Notion… everyone can see the same product and you can work towards it… **Because not everyone uses HQ**, we can talk about it. **I'm planning to just scratch it, but shared person records are good.**"*

**Cut, and Andy's own objection is the reason: *"not everyone uses HQ."*** **The PI will not sign up. Neither will the grad student. A shared workspace with one member is just a workspace.**

**Architecturally it is a different product.** HQ is **localStorage-first on static hosting with no backend** (`CLAUDE.md`), and **`deferred.md` N-1 already rules the cross-user layer out.** Real-time multi-user editing needs accounts per workspace, permission models, and conflict resolution.

**What survives, and it was already true: shared `Person` records.** One `Person` across Letters, Clinical, Shadowing, and Research, **never re-entered.** `P-7`'s lab members use exactly this. **The "everyone is in the record" feeling with none of the machinery.**

**If a lighter version is ever wanted: export, or a read-only share link. Never collaborative editing.**

### 7b · `Outputs` — the pipeline

| # | Feature | Surface | AI | |
|---|---|---|---|---|
| **RO-1** ✅ | **`proposal` as a type** (`R-2`) | panel | ○ | **The first original work, and the enum has no word for it** |
| **RO-2** ✅ | **`derivedFrom[]`** (`R-1`) | panel | ○ | The paper descends from the proposal, the data, the literature |
| **RO-3** ✅ | **Hand me the sources** (`R-4`) | page | ◑ | **The payoff.** `E-16`'s pattern, one level up |
| **RO-4** ✅ | **Resubmission, not replacement** (`O-1`) | panel | ○ | Venues in sequence on one record |
| **RO-5** ✅ | **Co-authors** (`O-2`) | panel | ○ | Shared `Person`. **The second-letter path** |
| **RO-6** ✅ | **The deadline before the deadline** (`O-3`) | panel | ○ | Your PI's date, not the conference's. **The one that goes to the bell** |
| **RO-7** ✅ | **Venue directory** (`O-4`) | page | ○ | Category A. Undergraduate-friendly or not |
| **RO-8** ✅ | **Figures link to data** | panel | ○ | **A figure comes from specific runs.** At revision time *"which data made panel B"* is unanswerable today |
| ~~**RO-9**~~ | ~~Hard limits as their own field~~ | — | — | **FOLDED INTO `RO-7` (Andy, Aug 2026):** *"It would be in that tracker… in the event that you are interested in a venue and you decide to look at their requirements. **It already has the information in.**"* **Correct — if the directory carries the venue, it carries its limits.** Word counts, poster dimensions, and talk lengths **arrive with the venue record rather than being typed in by hand** |
| **RO-10** ✅ | **Feedback received** | panel | ○ | What the PI said on the draft. **Dated, kept, and it is the record of how the work improved** |
| **RO-11** ✅ | **Dry run — with feedback** | panel | ◐ | **RULED Aug 2026, and expanded.** Andy: *"it's useful to practice and to get feedback from the AI in terms of presenting when you're actually doing it."* **Two tiers: paste your script or slide text → feedback on content, structure, and length (`◐`, works with a key, degrades to a plain dated record). Recording the talk itself is transcription, the same class as the recall-session mic** (allowed, `integration-map` §1) **but a real dependency — see the open note below** |
| **RO-12** ✅ | **Presented-at, separate from produced** | panel | ○ | **One poster shown at three venues is one output and three presentations.** AMCAS wants both |

### 7b-x · `Discover` RETURNS to Research (Andy, Aug 2026)

> *"If you're talking about events and stuff, then I would be open to learning more about **opportunities to present research and possible scholarships and research grants** that I could get… **I also think we could bring back the Discover tab just for that reason.**"*

**Reversed. Research gets `Discover` after all** — and the reason is new content rather than a change of mind. **When `Discover` was pulled, Research's outward-facing material was one item (the lab directory). It is now four**, and the biggest two did not exist yet.

| What `Discover` holds here | |
|---|---|
| **Places to present** (`RO-7`) | Venue name · what it accepts · window · undergrad-friendly · **and its hard limits** (`RO-9` folded in) |
| **Grants and scholarships** | **NEW, Andy's ask.** SURF, departmental awards, travel grants for conferences. **Dated windows — this is `P-10`'s other half** |
| **Research events** (`RS-BIG-4`) | `EV-1`, typed to research |
| **The lab directory** (`RS-BIG-1`) | Moves here from `Projects (page)` |

**Wave 3-0's empty-state insight still holds and is not wasted:** **a student with zero projects still sees the directory first** — `Projects` empty-states into a pointer at `Discover` rather than *"add your first project."* **The tab is where the content lives; the empty state is where it is surfaced.**

**Sub-tab set is now five: `Projects · Outputs · Lab notes · Reflections · Discover`.** **The most of any pillar, and both additions are earned** — two writing surfaces because a bench log is not a reflection, and `Discover` because venues and grants are real, dated, and unfindable.

**`Discover` keeps every guard from `05-experience-pillar.md` §2a-ii:** **a resource, not a tracker.** **`U-7` no rejection count, no application pipeline** — it lists what exists and records nothing about pursuing it.

#### The `Discover` rows

| # | Feature | Surface | AI | St | Notes |
|---|---|---|---|---|---|
| **D-1** ✅ | **Venue directory** (`RO-7`) | `Discover (list)` | ○ | `board` | Name · accepts (abstract/poster/talk) · window · undergrad-friendly · **its hard limits, `RO-9` folded in.** **A `PlaceLine` if it has a location** |
| **D-2** ✅ | **Grants and scholarships** | `Discover (list)` | ○ | `board` | **Andy's ask.** SURF, departmental awards, travel grants. **Dated windows.** **This is `P-10`'s missing half** — `P-10` records funding you HAVE; `D-2` lists funding that EXISTS |
| **D-3** ✅ | **Research events** | `Discover (list)` | ○ | `board` | `RS-BIG-4` · `EV-1` typed to research. Journal clubs, symposia, info sessions |
| **D-4** ✅ | **Lab directory** | `Discover (list)` | ○ | `board` | `RS-BIG-1`, moved here from `Projects (page)`. **Still the empty state for `Projects`** |
| **D-5** | **One-tap from `Discover` to a record** | `Discover` | ○ | `open` | The `Discover → Organizations` bridge in `07-campus-layer-board.md` §2h, typed to research: **venue → a planned `Output`; lab → a `Project`.** **The only write path out of `Discover`** |

**Sourcing is the whole cost.** **`D-1` and `D-2` are content, not code** — a hand-built, cited, dated list, the same shape as Volunteering's org list. **Neither is buildable until someone does the research pass**, which is now a sixth item on the stacked research-agent asks.

### 7c · `Lab notes` — RULED Aug 2026: HQ is not the notebook

> ### ✅ Option (a). **`N-1`–`N-4` and `N-8` CUT. `U-12` created from this decision.**
>
> Andy: *"Sounds good, because I said before that if there are actual developers behind a product and actually use their product, instead of me trying to create one from scratch."*
>
> **`UNC-CH holds an enterprise LabArchives licence covering undergraduates at no cost.`** **The trial log as specced was a worse ELN.** Full reasoning and the three-part test: **`general.md` `U-12`.**
>
> **Two locked constraints agreed independently:** the **≤5-second logging rule** (`CLAUDE.md`) — **trial + replicates + conditions + raw and processed is a bench data-entry form, not a five-second flow** — and **the localStorage quota** (`S0`), which is not a photos-only problem.
>
> **Rejected (c), the split.** **It sounds like the reasonable middle and it is the worst option:** the full build cost plus a mode switch, **and the fallback path is the one nobody tests.**

**What `Lab notes` IS: decisions, blockers, anomalies, and the line out to the work.** **Operational, five seconds, and the part no ELN does.**

| # | Feature | Surface | AI | St | Notes |
|---|---|---|---|---|---|
| **N-5** ✅ | **Anomaly flag** | `Lab notes (list)` | ○ | `board` | *"Unexplained significance."* **A run marked odd, with a note. A judgement, not a measurement** — which is exactly why it stays in HQ and not the ELN |
| **N-6** ✅ | **Blocker notes resolve** (`L-3`) | `Lab notes (list)` | ○ | `board` | *"Waiting on reagents."* Open until closed. **No age nag** |
| **N-7** ✅ | **Note → output link** (`L-2`) | `Lab notes (panel)` | ○ | `board` | Attach at write time, retrieve at draft time |
| **N-9** ✅ | **`RM-3` search** | `Lab notes` | ○ | `board` | **Smaller than it was — the trial data is gone — but still the pile you cannot scroll** |
| **N-10** ✅ | **Last time I ran this** | `Lab notes (list)` | ○ | `board` | ⚠️ **SURVIVES THE CUT, and it is the most important row here.** *"Show me every DPPH run on extract B, in order."* **`RO-12` says use the incumbent; it does not say pretend the incumbent is good at everything, and generic ELN search genuinely underserves this.** **Operates over whatever `N-11` captures — a handful of summary values, not a dataset** |
| **N-11** | **The pointer out** | `Lab notes (panel)` | ○ | `open` | **NEW, and `U-12`'s other half.** **A note may carry a link to the ELN entry, plus the two or three summary numbers worth having in HQ.** **The connective tissue — without it the cut just loses data instead of relocating it.** **`Preview Link Card`, `B-2`'s paste-never-fetch** |
| **N-12** | **Nudge to the ELN, once** | `Lab notes` | ○ | `open` | **A student writing bench detail into HQ is using the wrong tool.** **One dismissible pointer to LabArchives, never repeated.** **`RO-8` — it says the tool exists; it does not say to use it** |
| ~~**N-1**~~ | ~~`Trial` as the unit~~ | — | — | **`cut`** | **`U-12`.** **`0b`'s finding is NOT cut** — the three axes are correct and they describe how an ELN should be used, **not a table HQ owns** |
| ~~**N-2**~~ | ~~Replicates first-class~~ | — | — | **`cut`** | **`U-12`.** `n=3` is an ELN's job |
| ~~**N-3**~~ | ~~Conditions travel with the measurement~~ | — | — | **`cut`** | **`U-12`.** **The confounder problem is real and LabArchives solves it** |
| ~~**N-4**~~ | ~~Raw and processed both kept~~ | — | — | **`cut`** | **`U-12`** |
| ~~**N-8**~~ | ~~Photo blocks~~ | — | — | **`cut`** | **`U-12` + `S0`. Was already blocked on quota. Two reasons, same answer** |

> **⚠️ Wave 0 is NOT invalidated — read it as diagnosis, not as a build order.**
>
> **`0b`'s three axes, `0c`'s retrieval problem, and the confounder he could not chase are all still true.** **What changed is who solves them.** **`0b` now reads as *"here is why a Google Doc failed and an ELN would not have"*** — which is a finding worth keeping, and **the reason `N-10` and `N-11` exist at all.**

### 7d · Literature — RULED Aug 2026. Keep the record, refuse the citation manager, integrate with Zotero.

**`0d`: *"I literally just dumped all the papers I could onto a Google Doc"*** with headings and a summary each. **No mind map. Do not build a graph.**

> #### `U-12` fires here too — and lands DIFFERENTLY than it did on `Lab notes`. The difference is the point.
>
> **UNC students get Zotero free and Sciwheel free through the Libraries.** **EndNote is not site-licensed (~$108).** **Tests 1 and 2 pass: a mature product exists and the student can get it at no cost.**
>
> **But `U-12`'s third clause reverses the outcome.** **You cannot answer *"which of my outputs cited this paper"* without a paper record inside HQ.** **`B-3`, `B-4`, and `B-5` are the layer above, and the layer needs something to point at.**
>
> **And the two constraints that killed `N-1`–`N-4` do not fire.** **A citation string is small — twenty of them is not an `S0` problem.** **Pasting a DOI IS a five-second flow.** **Raw absorbance across hundreds of runs was neither.**
>
> **This is why `U-12` is a test and not a ban.** **Same rule, same category of incumbent, opposite ruling — because the cost profile and the dependency are different.**

#### ⚠️ The boundary — write this into the spec, not just the catalog

| HQ does | HQ NEVER does |
|---|---|
| Citation string · link · **your summary in your words** | **Format a bibliography.** BibTeX/RIS **export**, citation styles |
| `B-3` cited-in | **Store the PDF** — `S0`, the same call as `N-8` |
| `B-4` unused literature | **Auto-fetch metadata from a DOI** — `U-10` |
| `B-5` protocol provenance | **Write back to Zotero** |

**The drift risk is specific: the moment HQ formats one bibliography it owes the student every citation style forever.** **That is the line, and it is why `export` is forbidden while `import` is not.**

| # | Feature | AI | St | Notes |
|---|---|---|---|---|
| **B-1** ✅ | **A paper is a record** | ○ | `board` | Citation · link · **your summary in your words.** **`ShelfItem` from MCAT's Bookshelf, reused.** **Minimal by ruling — see the boundary table** |
| **B-2** ✅ | **Paste, never fetch** | ○ | `board` | `U-10`. `Preview Link Card` for the link |
| **B-3** ✅ | **Cited-in** | ○ | `board` | Which of your outputs used it. **The inverse of `RO-2`.** **The reason `B-1` exists at all** |
| **B-4** ✅ | **Unused literature** (`R-8`) | ○ | `board` | *"14 papers. 4 are cited in something you wrote."* **At draft time, once.** **`U-7`/`U-9` — a count, never a judgement** |
| **B-5** ✅ | **Protocols come from papers** | ○ | `board` | `P-4`'s source field points here |
| **B-6** | **The pointer out** | ○ | `open` | **NEW — the `N-11` pattern, applied for consistency.** A paper record may carry its Zotero/Sciwheel link |

#### `B-7` · Zotero integration — three tiers (Andy asked directly, Aug 2026)

> *"Ok but is Zotero integrated?"*

**Yes, and it is architecturally real rather than aspirational.** **Zotero Web API v3 supports CORS** — **their own web library is a JavaScript SPA calling it from the browser** — with **read-only access via a user-created API key.** **No backend and no proxy, which is the whole constraint HQ operates under.**

| Tier | Setup | AI | St | |
|---|---|---|---|---|
| **`B-7a`** | **None** | ○ | `board` | **Paste a DOI or citation.** **The default, and `U-10` requires it stay sufficient on its own** |
| **`B-7b`** | **None** | ○ | `open` | **Paste an export** — CSL JSON / BibTeX / RIS. **Bulk import, no key, no network, works offline.** **The best value-to-cost ratio of the three** |
| **`B-7c`** | **API key + user ID** | ◐ | `open` | **Live read of the library.** **Same pattern as the LLM key already in HQ.** Degrades to `B-7a`/`B-7b` |

**⚠️ One-way, always. HQ reads Zotero; HQ never writes to it.** **Two-way sync needs conflict resolution and there is no backend to resolve in.**

**⚠️ Integration does not move the boundary.** **Importing a library does not make HQ a citation manager** — no bibliography formatting, no PDFs. **Import supplies the record; `B-3`/`B-4`/`B-5` remain the only reason it exists.**

> **⚠️ ASYMMETRY — do not assume the two `U-12` cases resolve the same way.**
>
> | | Incumbent | Integration |
> |---|---|---|
> | **Literature** | Zotero / Sciwheel | **User-key API with CORS. `B-7c` is buildable** |
> | **Lab notes** | LabArchives | **Institution-gated API, not user-key.** **`N-11` stays a pasted link. There is no `N-11c`** |

### 7e · `Reflections` — RULED Aug 2026

**`RM-1`–`RM-6` inherited whole.** **Per `05` §2c's reading note, a short list on an inheriting surface is not a gap** — the mechanism is shared and this section records only **what Research supplies to it that no other pillar can.**

#### The triggers Research contributes to `RM-1`

| # | Trigger | AI | St | Notes |
|---|---|---|---|---|
| **F-1** ✅ | **An output changes status** | ◐ | `board` | Submitted · accepted · **rejected.** **Rejection is the highest-value reflection moment in the pillar and the one a student will not write unprompted** |
| **F-2** ✅ | **A project ends** | ◐ | `board` | The standard end-of-relationship trigger, inherited |
| **F-3** ✅ | **An authorship conversation happens** | ◐ | `board` | `RO-5`. **Often the first professional negotiation a premed has** |
| **F-4** | **An anomaly resolves** (`N-5`) | ◐ | `open` | **NEW.** **You flagged a run as odd and later found out why.** **That is the closest thing to a real scientific narrative a student will produce**, and it is currently captured nowhere |
| **F-5** | **A decision is logged** (`R-7`) | ◐ | `open` | **NEW, and use sparingly.** **Not every method change deserves a reflection.** **⚠️ Trigger only on a decision the student marks significant — otherwise `RM-1` fires constantly and the mechanism gets ignored** |

#### The prompt no other pillar can honestly ask

> ***"What didn't work, and what did you do about it?"***

**§9 already says it — *"lab notes and setbacks are unusually good essay material."*** **Every other pillar's reflection is about people or meaning. Research's is about failure**, and failure is the one thing an admissions essay cannot fake.

| # | | AI | St | Notes |
|---|---|---|---|---|
| **F-6** ✅ | **The setback prompt** | ● | `board` | **Research-only.** **`RM-2` conversation, seeded from `N-5` anomalies and `R-7` decisions** — HQ can name the specific thing that went wrong instead of asking in the abstract |
| **F-7** | **Negative results are results** | ○ | `open` | **NEW.** **A student whose project produced nothing publishable thinks they have nothing to write about, and they are wrong.** **A one-time note at project end, `U-8` — it states this; it does not coach** |
| **F-8** ✅ | **Backfill to Story Bank** | ○ | `board` | `RM-6` — **backfill never carries a marker.** Blocked on Story Bank, like every other pillar |

#### Celebration

**`CLAUDE.md` names *"first pub"* as one of four real milestones.** **That is a Research event and no Research row claimed it.** **`F-9`** — **first output accepted, once, ever.** **Not per-output, not per-project.** ⚠️ **The mascot is illustration-only and must not be a ram** (`05` §6.1).

### 7f · Rules with no surface

| | |
|---|---|
| **No human-subject data, ever** | **Clinical research involves people. HQ holds no PHI** — no participant identifiers, no raw subject data, no consent forms. **`03-clinical-board.md` §5 already bans PHI app-wide; it matters most here** and no current Research row says so |
| **Hours are derived, never logged** | `A″`, inherited. **And never the hero** — this pillar is output-shaped |
| **Research gaps are normal** | The meaningful staleness is **PI contact** and **output movement**, never activity |
| **Nothing is scored** | `U-9`. No productivity read, no output-per-month |
| **`U-10` governs the whole pillar** | **The student types into the table. AI parses when asked.** The strongest instance of this rule anywhere |
| **`U-12` governs the pillar's EDGES** | **HQ is not the ELN and not the citation manager.** **`Lab notes` points out (`N-11`); Literature may import one-way (`B-7`).** **Anything that starts to look like bench data entry or bibliography formatting is out of scope by rule, not by preference** |
| **No two-way sync with anything** | **HQ reads. HQ does not write back.** **No backend, therefore no conflict resolution.** Applies to Zotero, LabArchives, and anything proposed later |

---

## Wave 4 · Rules with no surface

| # | Rule | AI | St | |
|---|---|---|---|---|
| — | **Output-shaped, not hour-shaped** | ○ | `spec` | **No hour goal, pace projection, cumulative-hours chart, productivity score, or streak.** Verified by grep |
| — | **Publication is not required** | ○ | `spec` | *"A poster and a well-described role is a complete research story for most applicants."* **The copy never implies otherwise** |
| — | **Research gaps are normal** | ○ | `spec` | **The meaningful staleness here is PI contact and output movement**, never activity |
| — | **Rejected outputs stay visible** | ○ | `spec` | See `RS-b` below. **Rejection is normal and is good interview material** |
| — | **Text entry is a plain `textarea`** | ○ | `spec` | **No mic, no rich text.** `implementation/integration-map.md` §1 — not restated per pillar |
| — | **`PlaceLine` on lab records** | ○ | `board` | Building · travel · `Open in UNC maps ↗`. `07-campus-layer-board.md` §2e |

---

## Open — needs Andy

| # | | |
|---|---|---|
| **RS-31** | **The sub-tab set.** `Projects · Outputs · Lab notes · Discover` — **`Discover` is confirmed, the other three names are proposed.** See the table at the top |
| ~~**RS-a**~~ | **RULED: `protocol/IRB` and `thesis` are first-class output types.** Otherwise clinical and social-science students face an empty pipeline that misrepresents real work — which contradicts Wave 1 #3 |
| ~~**RS-b**~~ | **RULED: rejected outputs stay visible, collapsed.** Rejection is normal, it is frequently good interview material, and **hiding it teaches the wrong lesson** |
| ~~**RS-c**~~ | **RULED: role progression is dated free-text with an optional level.** A fixed ladder does not fit computational or clinical work |
| **RS-x** | **Does the spec absorb this catalog?** Six items sit at `board`. **My read: yes, same as ECs — or it rots** |
