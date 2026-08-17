# Timeline

**Renamed Aug 2026 (Andy).** Was "Timeline & Tasks". **The code already agreed**: the route is `/timeline` and the page is `Timeline.tsx`. There has never been a tasks route.

**Status:** **Scope, ownership, and design RULED (Aug 2026). The tab is designed and mocked; the scaffold sections below are still unwritten.** Two passes narrowed it — tasks left, then deadlines left — and what remains is the subject it should have had all along. **Do not spec against the scaffold headings below until the rulings above are read.** Build is blocked on **S7** (`deferred.md`), the `TaskItem` split.

**Filename stays `11-timeline-tasks.md`** so the twelve inbound links keep resolving; the tab is called Timeline.

## The ruling that renamed it (Andy, Aug 2026)

*"Tasks is already its own section in Overview. I feel like that's the only place where it should show up anyway, so why is that a part of Timeline all of a sudden?"*

**Tasks leave this tab entirely.** Andy: *"I don't think it laying in the Timeline makes a lot of sense."*

**Both the entity and the surface move to Overview.** An earlier draft split them, with Timeline owning the model and Overview owning the screen. **That split had no purpose** and only existed because the tab name implied it.

| | Owner |
|---|---|
| **The `Task` entity** | **Overview** |
| **The task surface** | **Overview**, `TaskWorkspace`: Now / Soon / Done, star-only prioritization, inline quick-add (`03-overview.md` §6.4) |
| **The expanded view** | **Overview**, at `/overview/tasks` |

**Why Overview and not here:** general to-dos are the one record type no pillar owns. They are not clinical, not academic, not application-specific. **Overview is where they already live and where a student already works them.** Making a different tab the technical owner was bookkeeping nobody benefited from.

### The expand is a sub-route under Overview, not a peek and not a tab

Andy: *"why can't it just be, in the expand arrow, not a center peek but open another tab? In the backslash it'll be like Overview\Tasks, so that Tasks lays inside Overview."*

- **An expand arrow on the widget** opens **`/overview/tasks`**, full screen.
- **The URL states the ownership.** Tasks are inside Overview, and the address bar says so.
- **Precedent exists:** `/academics/classes/:courseId` is already a sub-route under Academics for the same reason.
- **Not a `CenterPeek`.** A peek is for one record; this is a full list.
- **Not a sidebar entry.** It is not a destination you navigate to cold; it is Overview's widget with room.

**It is one list rendered at two sizes, not two implementations.** Same shared component, same store, same rules, exactly as `InlineAddRow` is shared across every logging door (`03-clinical.md` §5b). **If the expanded view ever grows behavior the widget lacks, that is the defect**, not the feature.

**What the expansion adds, and all it adds:** room for filtering and searching a long list. **`Done` remains the archive** (§6.4), and Settings holds the global one, so *"find what I did four months ago"* was already answered before this existed.

---

## The second ruling: deadlines leave too (Andy, Aug 2026)

**Deadlines are owned by whatever the date is attached to.** Andy: *"deadlines should be owned by where it already lies. It already lies in Academics, specifically in the assignment section."*

**This costs nothing, because a cross-cutting deadline surface already exists and it was never this tab.** The **Attention bell** (`00-product-shell.md` §7.5) aggregates dates from every owner. Timeline was a *second* aggregator with no unique job.

| Deadline | Owner | Where it surfaces |
|---|---|---|
| Assignment due date | **Academics** (`courseId` required, `D3-assignments.md`) | Attention bell |
| Exam / test date | **Academics** · **MCAT** | Attention bell, Plan |
| Abstract window, conference date | **Research** (`ResearchOutput.deadline`, `06-research.md` §4) | Attention bell |
| Letter request follow-up | **Letters** | Attention bell |
| AMCAS / secondary dates | **School List** · the cycle model | Attention bell, and as **roadmap-node context** |

**A cycle date may appear on a roadmap node as context** — *"AMCAS opens May 1"* inside the node that talks about submitting. **That is the node quoting a date it does not own**, the same way a pillar quotes an hour total it did not compute.

---

## What this tab is actually for (RULED Aug 2026)

**A four-year quest log.** Andy: *"The Timeline is supposed to be an ultimate roadmap throughout the entire four years of what I should be doing in general — what the process is. It is supposed to be a bigger-picture, long-term sort of thing."*

**The scope test that excludes deadlines:** *"It really isn't necessary to put small things like exam dates, because that's all stuff within a year, even within a semester. That's a very, very small amount of time compared to the scope you're getting from that four-year roadmap."* **If it resolves inside one term, it is not a Timeline object.**

### The game structure

Andy: *"Like in those video games where a quest is 'locked' — you can obviously still access it, but it's grayed out. You click on it and it's like, oh, you're clicking on a mission. It's a to-do list where you can do this before you move on to the next."*

| Property | Rule |
|---|---|
| **Sequenced** | Nodes have an intended order, and the order is visible |
| **Soft-locked, never gated** | Future nodes render **de-emphasized but fully openable**. Andy: *"you can obviously still access them."* **HQ cannot know a student is not ready, so it must never assert it.** No node is ever disabled, hidden, or blocked |
| **Deep, not a label** | Andy: *"Each point should have a lot of information in it."* A node is a **screen**, not a row: what this phase is, the concrete steps, and the heads-up |
| **Guidance is the payload, and it is factual** | Andy: *"not only these actual steps, but these reminders and heads-up, get-you-in-the-right-mindset type things."* **The framing is content, not decoration** — a node that lists steps and says nothing about the phase has failed. **But it is stated as fact, never as advice** (§ below): *"letters must arrive before verification,"* not *"don't leave letters late."* |
| **Atlas-fed** | Andy: *"it will be informed by information in Atlas soon."* Same phased posture as `03-overview.md` §6.7 — a sensible general default ships first, Atlas grounds it later |

**The purpose is guidance, not tracking.** Andy: *"The grand purpose is not really to track deadlines, but to help guide you through your premed journey."* **Every other tab in the app records what you did. This one tells you what the process is.** That is why it is the only tab whose content is largely authored rather than derived.

### Node contents: two kinds, and only one of them flows (RULED Aug 2026)

Andy: *"whatever the checkbox thing that is listed in the timeline automatically gets moved to the Soon task section. Only the things that are actionable. It doesn't include things like 'keep in mind this' and reminders."*

**Expanding a node reveals a checklist. Every item on it is typed, at authoring time, as one of two things:**

| Type | What it is | Where it lives |
|---|---|---|
| **`step`** | Actionable. *"Identify 4 recommenders."* Something you can finish. | **Both** — inside the node, **and automatically in Overview → Soon** |
| **`note`** | **A stated fact about the process.** *"Letters must be received before AMCAS verifies your application."* Nothing to finish. | **The node only.** Never in a task list |

**The typing is authored, not inferred.** A node's content is written (or Atlas-derived) with each item already marked. **No classifier, no AI, no heuristic on the wording** — this is a `○` deterministic feature, and it must stay one. Guessing which items are actionable would put roadmap boilerplate in a student's to-do list on a bad guess.

**The litmus is the same one §6.7 uses for nodes themselves:** if you cannot check it off at a point in time, it is a `note`.

#### Notes state facts. They do not give advice. (RULED Aug 2026)

Andy: *"'note' should be stated facts, not just a tip. 'Most people underestimate…' is a tip, not a 'be aware' or 'heads up' thing. These notes should be more direct."*

**The earlier example in this file was wrong and has been replaced.** *"Most people underestimate how long letter writers take"* is soft, unsourced, and unfalsifiable — it is exactly the register this tab must avoid, because **the whole value of the roadmap is that it tells you how the process actually works.** Advice dressed as guidance is what a student can already get from a forum.

| Write this | Not this |
|---|---|
| *"Letters must be received before AMCAS verifies your application."* | *"Don't leave your letters to the last minute."* |
| *"Secondaries arrive within days of verification, often all at once."* | *"Secondary season can feel overwhelming."* |
| *"AMCAS opens in early May. Submission opens later that month."* | *"Try to be ready by spring."* |

**The test:** *could this be wrong?* **A fact can be checked and corrected. A tip cannot**, which is why it does not belong here.

**Andy's earlier ask still holds** — nodes carry *"reminders and heads-up, get-you-in-the-right-mindset type things."* **The two are not in conflict: a direct statement of how the process works produces the right mindset better than advice does.** *"Secondaries arrive all at once, within days"* prepares a student more usefully than *"secondary season is intense."*

**Correction (Aug 2026): an earlier version of this line called notes "a Category A obligation." That was wrong**, and it misread `implementation/knowledge-sources.md`. **The A/B split is about what CONSUMES the data, not how reliable it is:**

- **Category A** is app reference data that **powers deterministic logic** — `data/*.json`, read by the requirement audit and School List. The file says plainly: *"This is NOT Atlas."*
- **Category B** is Atlas knowledge that **guides a human decision and drives no app logic.**

**A node's `note` is read by a person and computes nothing, so it is Category B.** The one exception is a **cycle date** — `data/cycle-dates.json` is Category A and is listed as powering *"Timeline, roadmap"* — so a node quoting *"AMCAS opens early May"* is quoting a Category A dataset it does not own.

**What survives from the original point, and it is a house style rather than a category rule:** a note **states a fact and carries where it came from**. That is `knowledge-sources.md`'s build pattern applied — *"every record carries its own `source` URL + `retrievedAt`"* — not a trust tier.

**Atlas grounds these later.** Andy: *"Atlas can help down the line."* Same phased posture as the roadmap itself — **v1 ships a small set of notes that are known-true and plainly worded; Atlas replaces them with sourced, citable ones** once wired. **Fewer notes is the correct v1 outcome.** Per standing rule **R7, cut rather than approximate**: a node with two verified facts is better than one with six confident-sounding sentences.

### Steps flow to Overview automatically — one record, two doors

Andy's reason: *"if we can interconnect those and make them communicate, that would prevent us from having to go back and forth, because the timeline is on the bottom of the tab."* **The roadmap panel sits at the bottom of Overview (§6.7), so a step you can only reach by scrolling down and expanding a node is a step you will not do.**

**This is the `one record, two doors` pattern**, already used for Story Bank and pillar reflections. **It is not a second owner and not a copy:**

- **The step's record belongs to Timeline.** Overview reads it.
- **Ticking it in either place ticks it in both.** There is one state.
- **It renders in Overview's task list as a step**, visually distinguishable from a general to-do, and carries a link back to its node.
- **Overview's task list is therefore a union** — its own `Task` records plus the in-scope node steps. **A union computed at read time. Never a write into `tasks`.**

**Scope: only the current node's steps flow.** *(Lean, needs confirming.)* Roughly 25 nodes × ~5 steps is ~125 items, most of them years out. **`Soon` is a horizon, and a step from junior year is not soon by any definition.** Flooding the widget would bury the four things that actually matter this week, which is the opposite of what this ruling is for. The current node, possibly the next one, and nothing further.

**A step cannot be deleted from Overview.** *(Lean, needs confirming.)* It is the roadmap's record, and deleting it there would silently damage the node. **Complete it, or dismiss it** — dismissing hides it from Overview and leaves the node intact. **Delete is not offered on a step row.**

### A milestone's optional implementation task is not a `step` (ruled Aug 17, 2026)

A student may create **one separate linked Overview implementation task** from a
Timeline milestone. It is concrete work the student chooses to take on; it is
not authored roadmap guidance and must never be retyped as a `step`. It lives
in Overview's normal `Task` collection, has no inferred due date, priority,
schedule, or completion state, and its completion never completes the
milestone. The milestone retains the one link after that task is completed,
archived, or moved to Trash so recovery remains possible; v1 offers neither an
unlink nor a second task from the same milestone. This is the explicit
exception to the one-record rule above; that rule still governs all authored
Timeline steps.

### Copy law: "not yet," never "behind"

**The one real risk in the game metaphor.** A game locks a quest because it authored the world. HQ did not author the student's life, and its user is an anxious premed looking at three years of grayed-out nodes.

- **Future state reads `Not yet`, `Coming up`, or `Ahead`** — never `Locked`, `Unavailable`, or anything implying permission.
- **No node is ever late, missed, or failed.** A node's target date is *pacing*, and `03-overview.md` §6.7 already sets that pacing **deliberately early**, so being past one is the normal case, not a failure.
- This inherits `01` §6.10's honest-state rule and the app-wide ban on readiness scores (`03-clinical-board.md` §5).

---

## The approved mockup (Andy, Aug 2026)

> **`specifications/mockups/11-timeline/timeline-spine.html`** — two frames: the four-year spine, and a node opened to its steps and notes.
>
> **DRAFT. Layout approved, design not settled** (Andy, Aug 2026): *"not quite approved and ready for the mockup lab, but the layout is fine — wouldn't commit it to the lab yet cuz it's still got design flaws."* **The skeleton is settled and should not be redesigned; the visual treatment of it is not.** Six known flaws are listed in the file's header block. **Do not promote to the mockup lab until they close.**
>
> Same standing contract as every other mockup: **it is law for layout, density, and feel; this file is law for behavior, data, and rules.** Do not copy its markup — rebuild from the real library components.

**Four things it locks:**

| Ruling | Why it is here and not left to inference |
|---|---|
| **Vertical spine** | A deliberate exception. **Overview's compact spine stays horizontal and locked** (`03-overview.md` §6.7). Four years at this depth does not fit a horizontal rhythm, and vertical lets a node be a card with room instead of a label. **Two jobs, two axes — do not "fix" the inconsistency.** |
| **`--cat-timeline: #4fa3a8`** | The tab had no accent token. `src/index.css` carries gpa, mcat, shadow, volunteer, activities, clinical, research, letters — and no timeline. **This one must be added.** An addition to the design system, not a change to it, and **the only thing on this page that touches a `MUST-NOT-CHANGE` file** (`CLAUDE.md`), so it needs flagging in the build prompt. |
| **Achievements are not cards** | Prescribed nodes get card chrome and point forward at a pacing date; **an achievement is a compact inline row with a hollow marker, at the date it actually happened.** The contrast is the point — it is what makes the spine personal rather than a shared syllabus. |
| **No progress headline** | **There is deliberately no "3 of 11 milestones", no percentage, no completion ring.** It is the obvious thing to add and it is wrong here: it converts *where am I* into *how far behind am I*, which is the one thing this tab must not do. **Do not add one.** |

**Copy the mockup makes concrete:** the date chip reads **`Pacing · Sep 2026`**, never `Due`. Future nodes carry **`Not yet`**. Since §6.7 sets pacing deliberately early, **most students will be past several nodes at any moment**, and rendering that as overdue would be both wrong and cruel.

---

## Achievements: yes, and here is the argument for it

Andy: *"I think this is a great spot to put milestones and achievements, what do you think? I'm taking a lot of game inspiration for this."*

**Agreed, and the reason is stronger than "it fits the theme."**

**The four-year roadmap is generic.** It derives from Profile fields (`track`, `startTerm`, `matriculationTarget`) and Atlas, which means **two students on the same track see nearly the same timeline.** A quest log that is identical for everyone is a syllabus. **Achievements are the only thing that makes the timeline yours** — they are the part no template could have predicted.

So the timeline holds **two node types on one spine**:

| | **Roadmap node** | **Achievement** |
|---|---|---|
| Origin | **Prescribed.** Authored/Atlas-derived, same for everyone on a track | **Earned.** Derived from a real record you created |
| Direction | **Ahead.** What the process asks next | **Behind.** What actually happened |
| Placement | At its **pacing target** date | At the **date it actually happened** |
| State | not yet → current → met | exists or does not |
| Content | steps, heads-up, mindset | the record it came from, one line, a link |

**Reading the spine left to right is then the whole journey**: what you did, where you are, what is coming. **That is a better tab than either half alone**, and it is the version worth building.

### The rule that keeps it from becoming a badge economy

**Every achievement is the naming of a record that already exists. HQ never invents a thing to chase.**

`CLAUDE.md` already fixes the whitelist: *"Celebrations only on real milestones (goal hit, letter submitted, first pub, cert renewed)."* Achievements read from that same set.

- **Sourced:** first publication · certification earned · letter submitted · MCAT taken · primary submitted · a stated goal met · a role crossing real longevity.
- **Never:** streaks, logins, hour thresholds invented by HQ, "completionist" badges, anything with a tier or a point value, anything comparing the student to other students (`03-clinical-board.md` §5, standing).
- **The test:** *would this achievement exist if HQ had not thought of it?* **If HQ invented the thing to be earned, cut it.** An hour threshold nobody set is a slot machine; a target the student set and hit is an accomplishment.

### Open: what determines the current node

**Deliberately not decided here.** Two candidates, and the difference matters:

1. **Date-derived** from Profile pacing. Simple, and works from day one — but a student who is behind sees a current node they cannot reach, which is exactly the failure mode the copy law is protecting against.
2. **Evidence-derived** from what is actually recorded. Honest, and never punishes — but many nodes have no derivable evidence (*"get in the right mindset about the cycle"* has no record to check).

**Lean: evidence where it exists, date as context everywhere else, and neither one ever renders as a judgment.** Needs a pass when this tab is specced properly.

---
**Sidebar group:** Application · **Spec type:** domain tab
**Depends on:** `specifications/00-product-shell.md`, `specifications/01-shared-interface-patterns.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (revised Aug 2026 — supersedes shell §2.2's row)

- **Owns (canonical create/edit/archive):** **roadmap nodes** (the four-year quest set), **node state**, and **achievements** (§ below).
- **Does NOT own:** **tasks** (Overview) · **deadlines** (each owner) · **assignments** (Academics) · **the deep knowledge graph** (Atlas).
- **References only:** every record type, as evidence a node is met and as achievement sources.

## Primary metrics

- **Where you are on the roadmap** — which node is current, what is behind it
- **What this phase asks of you** — the node's own content
- **What you have actually done** — achievements, placed in real time

> **Do-not-generalize anchor (revised Aug 2026):** this tab owns **the roadmap and nothing else**. **Tasks are Overview's**, entity and surface both. **Deadlines belong to whatever they are attached to** — Academics for assignments, Research for submission windows, Letters for follow-ups — and aggregate in the **Attention bell**, never here. **No tab builds a second deadline list.** The deep knowledge graph is Atlas's: here the roadmap is a time-ordered quest line, not a graph canvas.

---

## Purpose

> **RULED (Andy, Aug 2026) — the sentence that defines this tab:**
>
> ***"Timeline's job frankly is development, so it can watch as you become a member and then grab some leadership positions. Timeline aids development in all sectors."***

**Timeline is the development spine, not a deadline list.** It watches an arc form — member → committee → officer, first shift → hundred hours, first lab meeting → first poster — **across every sector, not just the application calendar.**

**Three consequences that settle things already argued elsewhere:**

- **Deadlines are not here** and the earlier narrowing was right. **A deadline is a date something is due; a milestone is a stage you reached.** Timeline holds the second kind.
- **Cross-pillar development arcs belong here rather than in the pillar.** **`E-BIG-4` (election windows across all your orgs) was cut from Extracurriculars for exactly this reason** — a role progression is a development arc, and a second cross-org deadline view inside a pillar would fork Timeline.
- **It is the only surface that sees a student's whole trajectory**, which is why achievements ride the same spine at their real dates rather than living in a trophy case.

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

- **This tab owns the roadmap and nothing else** (Aug 2026). **Tasks are Overview's**, entity and surface both, and no task view lives under `/timeline`.
- **Deadlines belong to their owner.** Assignments are Academics' (`D3-assignments.md`), submission windows are Research's (`06-research.md` §4), follow-ups are Letters'. **They aggregate in the Attention bell** (shell §7.5), not here. **No second deadline list, anywhere.**
- **Nothing that resolves inside one term is a Timeline object.** The scope is four years.
- **No node is ever locked, disabled, late, or failed.** Future nodes are de-emphasized and fully openable.
- **Achievements are earned, never assigned.** No badge is invented to be pursued; every one is the naming of something already recorded (§ Achievements).
- **A node's `note` states a fact, never gives advice.** *"Letters must arrive before verification"*, not *"don't leave letters late."* **If it cannot be wrong, it does not belong.** It carries its source and date. **It is Category B** — read by a person, driving no app logic — **and calling it Category A was an error**, corrected above.
- **The deep knowledge graph is Atlas's.** Here the roadmap is a time-ordered quest line, not a graph canvas.

## Acceptance criteria

Measurable implementation criteria (TBD).

## Open decisions

Unresolved design/product questions (TBD).

---

## ⚠️ CONSTRAINTS ADDED Aug 2026 — from the Story Bank and Research passes

### 1. ⭐ Timeline does NOT get a narrative view

**`09` §8 ruled it:** **sorting Story Bank by date is a SORT, not a VIEW.**

**Reason: two vertical time axes in one app is a real confusion.** **Timeline is the four-year ROADMAP — forward-looking, plans and milestones.** **Reflections are dense and backward-looking; dropping hundreds onto a roadmap would swamp it.**

**⚠️ Do not add a reflections layer to Timeline. Do not add a roadmap to Story Bank.**

### 2. Achievements — Research supplies one

**`F-9`: first output ACCEPTED, once, ever.** **Not per-output, not per-project.** **`CLAUDE.md` names *"first pub"* as one of four real celebration milestones and no Research row had claimed it until Aug 2026.**

**⚠️ The mascot is illustration-only and must not be a ram** (`05-public-and-account.md` §6.1).

### 3. No deadline ownership

**Research keeps its own external deadlines on `ResearchOutput`; they surface via the Attention bell** (`06` §7). **Timeline stores no copy. HQ reads calendars for context and writes only its own dates.**

### 4. `one record, two doors` applies here too

**§125 already uses the pattern. Keep it consistent with `09` §2 — and note that after Aug 2026 there is NO GATE in the Story Bank instance.** **If Timeline ever adds one, the two instances have diverged.**

---

## ⚠️ INHERITED Aug 2026 — transcript requests (`P-50`, from Profile/CV)

**Ruled into this tab, not Profile/CV.** *"Profile/CV holds records, not errands."*

**AMCAS requires an official transcript from EVERY institution attended** — including dual-enrolment and summer courses at another school. **Requesting them late is a genuine cycle-killer, and nobody warns first-timers about it.**

**It is a dated task with a deadline**, which is what this tab's roadmap nodes are for.

**⚠️ This must actually land here.** A feature moved between tabs is a feature that evaporates in the handoff unless someone writes it down on the receiving side — which is what this section is.
