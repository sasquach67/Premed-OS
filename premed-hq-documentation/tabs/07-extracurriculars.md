# Extracurriculars

> **Governed by:** `specifications/05-experience-pillar.md` for the shared frame, but this pillar **departs from it most** — see §2.1. This file is the domain depth: organizations, roles over time, initiatives, and the leadership reasoning unique to activities.

**Status:** Designed (August 2026)
**Sidebar group:** Experiences · **Spec type:** domain tab
**Repo:** `sasquach67/Premed-OS` — **`src/pages/Extracurriculars.tsx` (~1,077 lines, shipped)** — this pillar does *not* use `ExperiencePillar.tsx`
**Depends on:** `specifications/00-product-shell.md`, `01-shared-interface-patterns.md`, `04-visual-craft-standards.md`, `05-experience-pillar.md`, `architecture/04-admissions-framework.md`, `general.md`

## Ownership (from shell §2.2)

- **Owns (canonical create/edit/archive):** Organizations, roles held within them over time, **initiatives**, per-role reflections, leadership progression.
- **References only:** People (advisors, officers, successors), Story Bank, Profile/CV, Letters, Clinical & Volunteering (cross-link, never double-count).

---

## 2.1 Read the code before designing ⚠

**`Extracurriculars.tsx` is already ~1,077 lines and is the only experience pillar with its own page** rather than a config over `ExperiencePillar.tsx`. It already ships organizations, an org workspace with modes, initiatives, reflections, an approved-ECs summary, entity tabs, open-loop detection (`ecsOpenLoops`), and an application read (`ecsApplicationRead`). **This spec describes what exists plus its gaps — it is not greenfield.** Anyone building here reads the component first; the shared-builder assumption in `05` does not hold for this pillar.

---

## 1. Purpose

Hold the part of a pre-med's life that isn't hours: **what they built, led, and left behind.** Activities are where an application stops sounding like a checklist and starts sounding like a person, and they are the category students most often under-record — a two-year presidency compresses into "member of X club" because nobody wrote down what changed. This page keeps organizations, the roles held inside them over time, and the specific initiatives that came out of those roles.

## 1a. THE REFRAME (Andy, Aug 2026) — this pillar is not a ladder

> *"There is a chance that students will not really progress, and I don't think the best way to frame this is really a progression… If you frame it in terms of a progression sequence or a ladder, people feel like they're gonna climb the corporate ladder in clubs. They think of clubs as completely different — instead of a club, they think of it as a corporation, with there being a corporate ladder they feel like they have to climb."*
>
> *"It should really just be focused on: **being part of the club · contributing to whatever · serving their community · practicing their values · what they value · their desires there.** They should gravitate towards their interest… that's really the purpose of an EC or any club."*

**This overturns §2.2's *"progression is the metric"* and everything downstream of it.** It is the largest single change to this pillar's thesis and **it must be applied everywhere, not just in copy.**

| | Old frame | **New frame** |
|---|---|---|
| **What the pillar measures** | Advancement — *member → officer → president* | **Belonging and contribution** |
| **The card's second line** | The role progression path | **What you actually do there** |
| **A student with no title** | An incomplete record; #11 nudges them | **A complete record.** Being a committed member for four years is a real answer |
| **Where progression goes** | The hero visualisation | **Shown when it happened, never the frame.** A fact about the record, not the point of it |

**Why this is not merely a wording change:**

- **Most students will never hold an officer role**, and a surface built around a ladder tells all of them they are behind. **The pillar's own empty-state discipline (E-6) already says nothing is scored, ranked, or compared — a ladder is a ranking with one axis.**
- **It misdescribes what clubs are.** A student who shows up every week, runs the same event three years running, and never takes a title **has the stronger story**, and the old frame could not represent that as anything but a gap.
- **It sharpens the difference from Clinical and Research.** Those pillars genuinely have progressions — independence in a lab is a real ladder. **This one does not, and copying their shape was the error.**

**What survives unchanged:** roles are still **dated records, multiple per org, never overwritten** (§4). **The history is still the data.** What changes is that the history is evidence of involvement, **not a score of advancement.**

**Consequences to apply on sight:**
- **`E-BIG-2`'s cut is reinforced** — *"the path to a role"* was a ladder feature and it is doubly dead.
- **`O-2` (duration inside the progression path) is withdrawn.** It made the ladder more precise, which is the wrong direction.
- **#12 progression detection survives but changes voice** — it may *observe* an arc where one exists; it must never imply one is expected.
- **§13's *"depth, progression, and what survived are the signals"* → depth, contribution, and what survived.**

## 2. What makes Extracurriculars unique (do not generalize)

Six things live *only* on this pillar:

1. **Hours are the weakest signal here and are never centered.** This is an explicit `04` rule and it is stricter than the equivalent rule on Research. "120 hours in student government" means nothing; "rewrote the funding process, and it's still in use" means everything. **Hours may be stored for AMCAS export but must not be a headline metric, a goal, or a projection.**
2. **The organization and the role are separate records, and roles have a sequence.** *Member → committee chair → VP → President* inside one organization is the whole story, and a flat "role" field destroys it. **Progression is the metric**, and it is only visible if roles are dated records rather than a single string.
3. **Initiatives are first-class.** The thing you *did* — an event, a program, a policy, a fundraiser, a rebuilt process — is a separate entity from the role that let you do it. This is what essays and interviews actually draw on, and it is the field that reliably goes uncaptured. Already modelled in the shipped code; keep it.
4. **Non-medical activities count and are systematically undervalued by students.** Athletics, music, employment, caregiving, and cultural organizations are strong differentiators, and pre-meds routinely omit them believing only medicine-adjacent work counts. **The page must never rank a medicine-adjacent activity above a non-medical one**, and its empty-state copy should say so.
5. **The most-meaningful designation is a real, constrained decision.** AMCAS allows three most-meaningful activities with additional space. **Which three** is one of the highest-leverage choices in the application, it is made late and badly, and no tool helps with it. HQ tracks the designation across all pillars and surfaces the decision early — this pillar owns the surface because it is where the candidates cluster.
6. **Sustainability and succession are the leadership signal.** *Did the thing survive you?* A program still running after handoff is stronger evidence than one that ended when the founder graduated, and it is a question interviewers ask directly. Captured per initiative.

## 3. Primary users and stages

- **Early:** joined several clubs, no roles. Needs breadth-trap awareness without discouragement.
- **Mid:** holds a first real role. Needs initiatives captured while they're happening.
- **Late:** has led something. Needs progression, outcomes, and succession recorded.
- **Application year:** needs the most-meaningful three chosen and the 700-character descriptions drafted from real material.

## 4. Core entities

> **Rewritten Aug 2026** to absorb E-7, E-8, E-10, E-15, E-17, E-18, E-20, E-20b, E-23 from the feature catalog. **`level`'s old enum is superseded** — see the two-axis note below.

- **`Organization`** — `name`, `type` (`academic | service | cultural | athletic | arts | professional | greek | employment | other`), `startDate`, `endDate?`, `status`, `isMedicineAdjacent` (informational only, **never a ranking input**), `advisorId?`, `locationId?` (a building reference — `07-campus-layer-board.md` §3c), **`cadence?`** (E-7), **`electionWindow?`** (E-15), **`capabilityDelta?`** (E-8).
- **`Role`** — dated record inside an organization: `title`, **`level`**, **`roleKind`**, `startDate`, `endDate?`, `responsibilities`, **`teamSize?`**, **`budget?`** (E-23), **`mentored[]` / `mentoredBy[]`** (E-2), **`recruited[]`** (E-11). **Multiple per organization — this is the progression.**
- **`Initiative`** — `orgId`, `roleId?`, `title`, `what changed`, `outcome`, **`survivedHandoff`** (`yes | no | too early | n/a`), `successorId?`, `dates`, **`impactFigures[]`** (E-18), **`wouldDoDifferently?`** (E-14), **`participation`** (`ran · co-ran · part of`). **`reach` is cut** — E-18 absorbs it (§16.2).
- **`Reflection`** — dated note attached to a role or initiative; flows to the Story Bank.
- **Derived:** progression path per org, leadership span, initiative count, most-meaningful candidacy signals, **derived hours** (§4b).

### 4a. `level` and `roleKind` — two axes, not one (E-20, E-20b)

**The shipped enum `member | committee | officer | executive | founder` conflates seniority with how the position was obtained**, and as a result it cannot express a team captain, a drum major, or a cast member — **selected on merit, not elected, and not junior.**

| | Values | What it means |
|---|---|---|
| **`level`** | `participant · contributor · lead · officer · head` | **Pure seniority.** How far up |
| **`roleKind`** | `elected · appointed · hired · selected · volunteer · founding · honorary` | **How you got there.** `selected` is the value the old enum could not express |

- **`founder` leaves `level` entirely** and becomes `roleKind: founding` (E-10). **A founder has no predecessor and no template**, and flattening that into a seniority rung undersells it.
- **This needs a versioned, lossless migration** — `CLAUDE.md` standing rule. Old `executive` → `level: officer`; old `founder` → `level` inferred from `title` with `roleKind: founding`. **Nothing is dropped.**
- **`InfoTip` on every value of both enums** (`01` §4f-i). **Without it, seven `roleKind` values manufacture guesses.**

### 4b. Hours are derived from cadence, never logged per session (A′, A″)

**Nobody logs a one-hour club meeting.** Every other pillar captures a repetitive atomic event; **this pillar has none** (§5's asymmetry note), so a session log here would be a field that stays empty.

- **`cadence` × span is the input** (E-7) — *"two meetings a week plus an event a month, for three years."* **Hours are computed from it, overridable at any time.**
- **One-off spikes are added separately** — a 30-hour conference weekend is not the cadence and does not distort it.
- **Hours are stored for AMCAS and never centered** (A′). **Not in the stat strip. Not a goal, not a projection, not a chart.** Weekly commitment is **answered on request, never pushed**; the only proactive moment is pre-cycle.
- **Targets are available and default off.** Free-reign principle — **HQ never suggests a number, and it never withholds the capability either.**

### 4c. Impact in the student's own units (E-18)

`impactFigures[]` is `number + unit + what` — *"$4,200 raised"*, *"63 patients served"*, *"9 volunteers trained."*

**Never summed. Never compared across initiatives or students. Never charted.** A dollar raised and a patient served are not the same quantity, and any aggregate over them is an invented composite (`01` §6.12).

### 4d. Repeated activities and multiple date ranges (E-17)

**AMCAS allows one primary date range plus up to 3 additional — four maximum** (`03-clinical.md`, verified). **This is most common in Extracurriculars specifically**: a club you were in freshman year, left, and rejoined as an officer.

**Stored as real dated ranges, exported as AMCAS `Repeated`.** **Never collapsed into one span** — the gap is part of the story.

## 5-0. THE ORG HUB (RULED Andy, Aug 2026) — four sub-tabs AND a club page

> *"I feel like it should be like how the class page functions in academics. When you click it, it should open initiatives, not as a tab, but as a full page, and everything should be in there."*
>
> *"Since there was a ledger thing, I think we should still keep initiatives in extracurriculars where it's the ledger, because that makes sense and it follows the structure as well."*

**Both are true. `E-31`'s four sub-tabs stand, and clicking a club opens a full page.**

### Why they do not conflict

**Academics already does exactly this.** `Assignments` is a top-level tab in Daily **and** a view inside Class Hub. **Same records, two doors** — the pattern this app uses everywhere (Story Bank and pillar reflections, Clinical's shifts on both `Sites` and `Shifts`).

| Door | Question it answers |
|---|---|
| **`Initiatives` sub-tab** | *"Everything I've done, across every club."* **The ledger** — and the one every other pillar has, which is why it stays |
| **The Org Hub** | *"What did I do at MEDLIFE?"* |

**Neither is a copy. One filter, one record set.**

### The Org Hub — three views

**Click a club, get a full page:**

| View | What is in it |
|---|---|
| **Overview** | **The comprehensive one.** What the club is · what you do there · cadence (`E-7`) · span · **roles over time**, with `roleKind`, budget and team size, mentorship both directions, who you recruited · advisor · election window (`E-15`) · `PlaceLine` · the AMCAS description (`E-16`) |
| **Initiatives** | What you did at this club — **the club-scoped view of the same records the `Initiatives` sub-tab aggregates** |
| **Reflections** | Scoped to this club, same two-doors relationship |

**Roles fold into Overview rather than getting their own view.** **Most students hold one role per club**, and a whole view for it makes the normal case look like a gap. **It also keeps `§1a` intact — the role is a fact in the overview, not a section you are meant to fill.**

**`EcsOrgWorkspace` already exists in the code** and is the right bones. **This is an expansion, not a new component.**

### Naming, ruled

**`Initiatives` keeps its name.** *"What you did"* was proposed and rejected: **every other slot in the cross-pillar chart is a noun** — Sites, Shifts, Physicians, Visits, Outputs — **and a verb phrase breaks the scheme.**

## 5. Structure: four flat sub-tabs (RULED Aug 2026, E-31 — plus the Org Hub, §5-0)

**`Organizations` · `Initiatives` · `Reflections` · `Discover`.** Flat, underline nav, no mode switch — **the same `01` §4b-i treatment every pillar uses.**

**Why four and not three.** `04` §0b's standardization rule is about **format** — *"every table uses the same component, every page shares the same header format."* **It says nothing about how many sub-tabs a page has.** Clinical, Volunteering, and Shadowing landed on three because those three pillars genuinely have three questions. **Reading that coincidence as a rule was an error** (Andy: *"the thing that is stopping you shouldn't be the amount of tabs… if it enhances, just add it"*). **What must stay consistent is the treatment, not the count.**

### The parallel, stated so the structure is legible

| Functional slot | Clinical | Volunteering | Shadowing | **Extracurriculars** |
|---|---|---|---|---|
| **The relationship** — browse and manage what you are part of | Sites | Organizations | Physicians | **Organizations** |
| **The flat cross-entity ledger** — everything you did, in one filterable list | Shifts | **Events** | Visits | **Initiatives** |
| **The writing** | Reflections | Reflections | **Reflections** | **Reflections** |
| **What you are NOT part of yet** | — | — | — | **Discover** |

**Two things this table makes obvious:**

1. **`Reflections` is not a new feature — it is a surface this pillar should already have had.** ECs has reflections as a data type (§4) and no home for them; they are buried inside the org workspace while every other pillar gives them a tab.
2. **`Discover` is the genuine addition**, and it is the only sub-tab in any pillar that shows records the student does not own.

### The asymmetry that changes the design — initiatives are not sessions

**They occupy the same functional slot and behave nothing alike.**

| | Shifts / Sessions / Visits | **Initiatives** |
|---|---|---|
| **Volume over four years** | Hundreds | **Ten to twenty** |
| **Effort per entry** | Seconds | **Minutes — it has an outcome, a reach, a handoff** |
| **Grouping** | By month | **By org or by academic year.** Month grouping is meaningless for something that ran a semester |

> **Consequence: the 5-second logging rule does not apply to this pillar.**
>
> Every other pillar needs a fast-add row because it captures a repetitive atomic event. **ECs has no such event.** You add an org once, a role once a year, an initiative when one happens. **Low frequency, high value per entry** — so the add flow can afford to ask more, and **an `InlineAddRow` optimised for speed would be solving a problem this pillar does not have.**

### 5a-0. `commitment` — one field that answers three questions (RULED Aug 2026)

**Andy raised two things separately and they turn out to be the same field.**

**The interest-meeting problem, in his words:**

> *"First semester, first year, a lot of pre-meds will be joining a lot of interest clubs or interest meetings for a lot of clubs. They'll find out the club is not really for them, so they're not gonna join… it does check in with you after, like, 'Do you plan to commit to this club?' You can either choose yes or no. If you say no, then it just removes it, and if it says yes, then it keeps the club."*

**And the active-versus-past problem:**

> *"I should ask, after a bit of inactivity, if they should move it into past… but I hope most pre-meds stay with their club as long as they can. I don't see there being a lot of past clubs, so maybe we can just leave it."*

**One enum, three states:**

| `commitment` | What it means | How it renders |
|---|---|---|
| **`provisional`** | **You went to an interest meeting. You have not decided.** Created automatically when an `EV-1` event you accepted was an interest meeting | **Visually distinct and quiet.** Excluded from every count and from AMCAS export |
| **`active`** | You are in it | Normal |
| **`past`** | You were in it | **Same list, dimmed.** No separate section |

**This amends `EV-3`.** The earlier ruling said accepting an event creates **no** org record and the follow-up creates one. **Andy's version is better and it is the one to build: the record is created provisionally, and the follow-up either keeps it or deletes it.** The reason it is better: **during the undecided window the club is in your list**, so a first-year can write a note about the meeting they just left. **Nothing to reconstruct later.**

- **The check-in fires days after the meeting, once.** *"Do you plan to commit to MEDLIFE?"* **Yes → `active`. No → deleted outright, not archived.**
- **No is a deletion, not a record.** **The non-event rule** — a club you decided against is not part of your record and HQ keeps no trace of it.
- **Ignoring the check-in leaves it `provisional`**, and a `provisional` record older than one term is dropped silently. **September's twelve interest meetings do not become a permanent list of twelve clubs.**

**On active-versus-past: one list, no split.** Andy's read is right — **premeds who stay are the common case, and designing a two-section layout for the uncommon one is over-engineering.** Past records dim in place, in chronological order. **Revisit only if real usage shows long tails.**

**Sort: chronological.** **Not by commitment, not by depth** — `E-6` bans ranking, and *"most involved first"* is a ranking with extra steps. **Andy's "maybe evolve into most-commitment later" is recorded as a possible future, deliberately not built now.**

### 5a. `Organizations` — the default landing

- **Hero: the organization cards, each showing its role progression inline** as a compact path rather than one current title. **Progression is the metric** (§2.2), so the hero is the thing that displays it.
- **Stat strip:** organizations · **highest role held** · initiatives · years of sustained involvement. **No hours** (Standard A′).
- **Each card:** org · type · role progression path · cadence (E-7) · years · advisor · medicine-adjacent chip (**informational, never ordering**).
- **Selected-org detail panel:** roles over time · **mentorship on each role** (E-2) · initiatives at this org · **what the org could do when you left** (E-8) · budget and team size (E-23) · reflections · advisor.
- **List / map toggle** (see §5e).

### 5b. `Initiatives` — the flat cross-org ledger

- **Every initiative across every organization**, which is why it is a peer view rather than something you drill through an org to reach. **Already shipped as `InitiativesView`.**
- **Grouped by academic year by default**, with a group-by-org toggle.
- **Each row:** title · org · what changed · **impact figure in your own units** (E-18) · `survivedHandoff` · dates · **your role in it** (ran / co-ran / part of).
- **Two independent filters:** **which org** and **state** (`survived · too early · ended · ongoing`). Never one combined control.
- **`What you'd do differently` (E-14) lives on the row**, offered beside a completed initiative and silent otherwise.

### 5c. `Reflections` — the surface this pillar was missing

- **One record set, two doors.** Story Bank aggregates; this is the pillar-scoped view. **A filter, never a copy.**
- **Two filters:** which org, and state (`unpacked · deferred · not yet`).
- **The prompt chips ask about people, not impact** (E-3) — *"who were these people to you?"* **#45's chips configured, not a second reflection system.**

#### A reflection is a conversation, not a text box (`R-3`, RULED Aug 2026)

> Andy: *"The AI should try to encourage a response. Types up a response, AI responds, provokes more thought and response, and so forth. So no, two sentences are NOT a complete reflection — but a few lines of expression or a fleshed-out point or two (even though word count may not be sufficient) is what defines it as sufficient."*

- **The loop:** the student writes → **HQ responds to what they actually wrote** → that provokes more → they write again. **Not a form, not prompt-and-store.**
- **Sufficiency is shape, not length.** A few lines of real expression, or a fleshed-out point or two. **Never a word count, never a progress bar, never a completeness meter.** A long reflection that says nothing is not sufficient; four honest lines are.
- **The student ends it whenever they want.** HQ never withholds *done*, never asks again unprompted, **never marks a reflection incomplete.** The conversation is an offer.
- **HQ's side is never recorded** — *"HQ's provoking is not recorded. It only helps student."* **Re-open a reflection a year later and you see only what you wrote.** This keeps `09-essays-story-bank.md`'s boundary intact by construction, stops the drafter quoting HQ back at the student, and keeps the store small while **S0** is open.
- **`●` requires an LLM. Degradation is designed:** with no key the surface falls back to E-3's chips and a plain box. **Worse, not broken.**

#### The moments HQ asks (`R-2`)

**Nothing in HQ currently asks for a reflection, ever** — the tab exists and waits. Four moments already in the data: **an initiative marked complete** (memory freshest, pairs with E-14) · **a role ending** · **a year boundary** (E-12 lands here) · **an event you accepted and attended** (pairs with `EV-3`). **Once each, dismissible, never repeated.**

#### Search across your own writing (`R-4`)

**One search field beside the existing filters.** Plain substring match over reflection bodies; results render as the same `ExpandableEntryRow` with the match highlighted. **`○` — no index, no embeddings, no service.** It is **the same search Story Bank uses, scoped narrower.** Semantic search is deferred to Atlas and not required: **sixty reflections and a text box beats sixty reflections and no text box.**

#### Synthesis threads (`R-5`, #45b)

Several reflections the student groups themselves under one idea, shown here **visually distinct** from single reflections. **Student-made, never auto-clustered** — an app deciding which of your memories belong together is the "deciding for the user" failure in its purest form.

#### Writing input (`R-6`)

**Plain `<textarea>`. No mic, no rich text, no custom editor** — full rule and the Wispr Flow pointer live in `implementation/integration-map.md` §1. **Not restated here.**

### 5d. `Discover` — the only surface showing what you do not own

- **The UNC organization directory** (E-1) — **the full registered list, not a curated subset.** Category A, with a prominent link out to Heel Life for anything not carried.
- **Recommendations by interest** (E-2b) — *"three orgs match what you already do."* **Never by popularity among premeds**, which would push every applicant into the same clubs and destroy the differentiation this pillar exists to show.
- **Campus events from the flyer pipeline** (`07-campus-layer-board.md` §3a), filtered to organizations and opportunities.
- **List / map toggle** (§5e).
- **Adding from here creates a real org record** on `Organizations`, prefilled from the directory.

### 5e. The map is the `where` on an event — not a surface, not a sub-tab

**RE-RULED Aug 2026** (`07-campus-layer-board.md` §2d). **The earlier "list / map view toggle, same component as the Overview map" is superseded — there is no Overview map.** Andy: *"while it is nice to see, I just don't know the practical use of it… this should be more of a feature just for extracurriculars."*

- **The map is one building, marked, on an event or an org.** Plus `Open in UNC maps ↗`, which deep-links to Concept3D (`id=111#!m/<locationId>`) and hands wayfinding back to UNC. **HQ never draws a base map, never ships a tile provider, never rebuilds directions.**
- **`Discover` gains event prospecting (`EV-1`), which is the real feature here** — HQ finds an event, checks whether you can physically get to it, and hands you what you need to show up. **§5g.**
- **`Organizations` keeps no map at all.** You know where your own orgs meet.

### 5g. `EV-1` — event prospecting, and it is the largest feature in this pillar

**Full reasoning: `07-campus-layer-board.md` §2d.** Summarised here because it lives on `Discover`.

**HQ finds an event, works out whether you can actually get to it, and gives you what you need to show up.**

> *"MEDLIFE interest meeting — Thursday 6:30, Union 3411. Nothing scheduled. Your last thing ends 5:15 in Caudill, seven minutes away. Add it?"*

- **Sources:** flyers the student photographs (`●` vision) · **Heel Life's public RSS/iCal feeds** (no key, no approval) · the curated opportunities dataset.
- **The feasibility call is deterministic** — `○`, no LLM. It reads the class schedule and the student's locations. **It reads Academics; it never owns it.** **Scope is non-academic** (Andy: *"anything other than academics"*).
- **Copy law: `Nothing scheduled`, never `You're free`.** An empty evening is not an available one, and the difference is whether HQ describes your calendar or decides what your time is for.
- **Delivered through the existing bell** with accept / decline inline. **Never a blocking modal, never a second notification system.**
- **Accept does the logistics in one tap:** the schedule entry, **the travel time held before it**, the building marked, and the how-to-get-involved link preserved.
- **Decline records nothing.** The non-event rule.
- **Accept does not create an org record.** **One follow-up, days later — *"Did you join MEDLIFE?"* — creates it, prefilled from the directory (E-1). Once, never repeated.** This is the only path from `Discover` into `Organizations` that HQ initiates.

## 5f. Core views (superseded detail, retained)

- **Stat strip (variable metrics only):** organizations · **highest role held** · initiatives · years of sustained involvement. **No hours in the strip.**
- **Organizations** as the primary list, each showing its role progression inline as a compact path rather than a single current title.
- **Initiatives** as a peer view — already shipped as `InitiativesView`. This is deliberate: initiatives are the essay material and must be reachable without drilling through an org.
- **Center-peek inspector** per organization: roles over time, initiatives, advisor, reflections, one primary action.

## 6. Main workflows

- **Add an organization**, then add roles to it over time — never editing one role string in place, which destroys the history.
- **Log an initiative while it's happening**, with what changed and who it reached.
- **Record a handoff** — successor and whether it survived, revisitable later since "too early" resolves into an answer.
- **Designate most-meaningful** (max 3 app-wide, enforced across pillars).
- **Send a reflection to the Story Bank.**
- **Cross-link to Clinical/Volunteering** where a club also produces service hours — link, never duplicate.

## 7. Smart features (rules-based, explainable — `architecture/02`, `general.md`)

- **Depth-over-breadth read** — many organizations, no roles: *"You're in 6 organizations and hold a role in none. One officer position is worth more than four memberships."* Stated once, never repeated, never scolding.
- **Progression detection** — surfaces the arc when it exists: *"Member → Treasurer → President over 3 years at Carolina Health Access. Name this in your application."*
- **Uncaptured-initiative prompt** — an officer role with no initiatives recorded: *"You've been VP for 8 months with nothing logged. What have you actually changed?"*
- **Succession follow-up** — an initiative marked *too early* revisits after a suitable interval, and after graduation asks whether it survived.
- **Most-meaningful advisor** — surfaces the three-slot decision **early**, listing candidates from *all* pillars with the evidence behind each. **Presents a comparison, never a recommendation** — this is the student's judgment and HQ does not have the taste for it.
- **Non-medical value note** — fires once when a student has recorded only medicine-adjacent activities: *"Your record is entirely medicine-related. Athletics, music, work, and family responsibility are real differentiators."*
- **Double-count catch** — a service club also logged in Volunteering: offer a cross-link, **never auto-merge** (mirrors Volunteering §7).
- **Thin-description catch** — a role with a title and nothing else, surfaced while memory is fresh rather than at deadline.
- **Year in review** (E-12) — one optional retrospective per academic year, offered at the year boundary. **Never a report card:** no score, no year-on-year comparison, no *"less than last year."* `◐` — better with AI, fully usable without it.
- **Election timing** (E-15) — per-org, student-entered, optional. *"Nominations at Carolina Health Access usually open in March."* **Miss the spring window and you miss the year**, and no premed tool models this. **HQ never guesses a date it was not told.**
- **Descriptions drafted from real material** (E-16) — at application time, the 700-character AMCAS description is **assembled from three years of recorded initiatives, impact figures, and reflections.** `◑`. **HQ assembles; the student writes.** This is the payoff for everything logged above, and it only works because Story Bank holds the student's own words (`09-essays-story-bank.md`).
- **Progression by academic year** (E-5) — *"First-year member · Sophomore committee chair · Junior VP · Senior president."* **Store dates, display years** — students think in years, AMCAS wants dates.
- **Never** surface hour goals, hour projections, streaks, recency-staleness, or certifications here. All belong to other pillars and all would mislead.

### 7a. The register — this pillar reads as personal, not as a ledger (E-6)

**A rule with no surface, governing all of them.**

- **The stat strip does not lead with counts.** Highest role held before organizations.
- **Empty states name non-medical examples first** — a job, a team, an instrument — because the omission problem starts at the empty state.
- **Nothing is ever scored, ranked, or compared.** No leadership score, no impact score, no comparison against other students.
- **Record the learning, not the failure** (B). *"What I'd change"* is growth; *"I lost"* is a scar the app made you keep.
- **HQ does not track non-events.** **App-wide, and rejected twice** — shadowing asks (S-7), lost elections (E-9). **Reflection attaches to things that happened, never to their absence.** This is what makes `EV-1`'s silent decline correct rather than a gap.

### 7b. People, both directions (E-2, E-11, E-3)

**The largest gap in the app: no pillar models reciprocity.**

- **Mentorship lives on the `Role`**, in both directions — people you mentored, people who mentored you. **A premed is mentored for two years and then mentors for two, and only the second half looks like leadership in every existing tool.**
- **The team you built** (E-11) — who you recruited or appointed. *"I found the person who replaced me"* is a different claim from *"I mentored someone"*, and succession planning is a leadership signal interviewers ask about directly.
- **Reflection prompts ask about people, not impact** (E-3) — *"who were these people to you?"* **#45's chips configured, never a second reflection system.**

### 7c. Honors, awards, and recognitions (E-19)

**Attaches to whatever earned it** — an org, a role, an initiative, a course, a lab. **Profile/CV aggregates; no pillar owns a separate awards list.**

- Fields: `name`, `date`, `issuer`, **`selectivity?`** — *"12 of 200"*, which is the field that makes an award legible to someone who has never heard of it.
- **Never scored, never ranked against other students' awards.**

## 8. Visualizations

- **Role progression path** per organization — a compact horizontal sequence with dates. The one visualization that genuinely earns its place, because progression is the metric.
- **Involvement span** (small, bounded height) — sustained vs scattered across the record.
- **No hours chart of any kind.** No leadership score, no impact score — both would be invented composites (`01` §6.12).

## 8a. Components used (feature → library component)

| Feature | Component |
|---|---|
| Stat strip | `PillarShell` banner + `BannerStat` |
| Organizations list | `TrackerTable` / existing `OrganizationsView` |
| Org workspace | existing `EcsOrgWorkspace` + `WorkspaceModule` |
| Role progression | compact path (new — no existing component; do not fork `TrackerTable`) |
| Initiatives | existing `InitiativesView` |
| Reflections | `ExpandableEntryRow` + `InlineAddRow` |
| Advisors | `ContactCard` (shared with Letters) |
| Intelligence | Shared panel — same component as Overview Smart next actions |
| Teaching copy | `MascotNote` — `teaching` and `empty` variants |

## 9. Cross-tab relationships

- **Volunteering / Clinical** — cross-link where a club produces service or patient contact; **hours live in exactly one pillar**.
- **Story Bank** — reflections and initiative outcomes flow out; this pillar is the second-largest essay source after Clinical.
- **Profile/CV** — exports as AMCAS activity entries with the correct type per organization.
- **Letters** — advisors and supervisors as recommenders; deep-link prefill only.
- **Overview** — contributes highest role and initiative count, never an hours figure.
- **Timeline** — election cycles and handoff dates where the student sets them.

## 10. Inspector design (center peek — `01` §2/§3)

Peek on an organization: name, type, span, **role progression path**, initiative count, advisor, most recent reflection, one primary action (`Add an initiative`). Expand for full roles, initiatives, and reflections.

## 11. Empty, loading, error states (`01` §8, `04` §9)

- **Zero organizations:** one action — *"Add your first organization"* — with a `MascotNote` that explicitly includes non-medical examples (a job, a team, an instrument), because the omission problem starts here.
- **Organization with no roles:** *"Member"* is a valid, complete state and is never flagged as incomplete.
- **Initiative marked "too early":** shown as pending, not missing.
- **Dormant features say why:** progression detection renders nothing until a second role exists.

## 12. Mobile behavior

Reflection capture is the mobile-critical flow. Org and role management is desktop-shaped. Standard `input`/`textarea` throughout so dictation works.

## 13. Admissions-aware reasoning (`architecture/04`)

- **Depth, progression, and what survived** are the signals. Counts of memberships are not.
- **Non-medical activities are never ranked below medicine-adjacent ones** anywhere in the app.
- **The most-meaningful three** is presented as a comparison with evidence, never as a recommendation.
- **Claims are phrased by their evidence** (`01` §6.14): dated roles and recorded initiatives are observed; "this is a strong leadership story" is hedged or omitted entirely.

## 14. Do Not Generalize From Other Tabs

- **Never center hours** — the strictest version of this rule in the app.
- **Do not import Clinical's recency-staleness or certification tracking.**
- **Do not import Shadowing's sufficiency call** — there is no "enough activities" bar.
- **Do not collapse roles into one field** to match the other pillars' simpler shape. The sequence *is* the data.
- **Do not use `ExperiencePillar.tsx`.** This pillar has its own page for good reason (§2.1).

## 15. Acceptance criteria

- [ ] **No hours goal, hours projection, hours chart, or hours stat** anywhere on this pillar — verified by grep, not inspection.
- [ ] **Roles are dated records with multiple per organization**; editing a role never overwrites history.
- [ ] The **role progression path** renders wherever an organization has more than one role.
- [ ] **Initiatives are a first-class entity** reachable as a peer view, not only through an org.
- [ ] **`survivedHandoff` is captured** and "too early" resolves via follow-up rather than staying indefinite.
- [ ] The **most-meaningful cap of 3 is enforced app-wide** across all pillars, and the surface **compares without recommending**.
- [ ] **Medicine-adjacent status never affects ordering, ranking, or emphasis** anywhere.
- [ ] Club-and-service overlap is **cross-linked, never duplicated**; hours live in exactly one pillar.
- [ ] Empty state names **non-medical examples explicitly**.
- [ ] **`level` and `roleKind` are separate fields**, and the old five-value enum is gone via a **versioned, lossless migration** — no record loses its history.
- [ ] **`InfoTip` renders on every value** of both enums.
- [ ] **Hours are derived from cadence**, overridable, and appear **nowhere in the stat strip** — verified by grep.
- [ ] **Impact figures are never summed, averaged, or charted.**
- [ ] **Up to four date ranges per activity** (1 primary + 3 additional), never collapsed.
- [ ] **Mentorship records both directions** and lives on the `Role`, not the org.
- [ ] **Honors attach to the record that earned them**; ECs holds no separate awards list.
- [ ] **`EV-1` declines record nothing** — no skipped-event count exists anywhere.
- [ ] **`EV-1` says `Nothing scheduled`** and the string `You're free` appears nowhere — verified by grep.
- [ ] **Accepting an event creates no organization record**; only the `EV-3` follow-up does.
- [ ] Works fully with no AI key — **every feature above is deterministic except E-12 (`◐`), E-16 (`◑`), E-2b (`◐`), and flyer extraction (`●`), all of which degrade to manual entry.**

## 16. Open decisions

1. ~~Whether employment belongs here or earns its own pillar.~~ **RULED (Andy, Aug 2026): here, as an organization type.** *"I already said employment was an EC so it's an org."* **The AMCAS export splits paid employment out; the UI keeps it together.** A separate tab for one activity type was never worth it.
2. ~~Whether `reach` is a number or free text.~~ **DISSOLVED Aug 2026 — `reach` is CUT, not decided.** **E-18 `impactFigures[]` already does this job with the unit unlocked.** `reach` is the same field with the unit hardcoded to *"people"*, which is strictly worse: initiatives are also measured in dollars, meals, shifts covered, and volunteers trained. **Two fields for one job is a defect** (`04` §0b, one component per job — the same logic applies to data). **`"200 students reached"` is an impact figure.** Removed from the `Initiative` entity; **needs a migration that folds any existing `reach` value into `impactFigures[]` as `{n, "people", "reached"}`** rather than dropping it.
3. ~~Whether the most-meaningful comparison surface lives here or on Profile/CV.~~ **RULED Aug 2026: Profile/CV, inside the AMCAS export preview** (catalog E-e; already determined by `03-clinical-views-board.md` **V3**). **The 15-entry cap is application-wide and the most-meaningful cap of 3 has exactly the same shape** — you are on Profile/CV looking at all 15 entries from every pillar, ticking three, and the comparison appears inline in that list. **Extracurriculars deep-links and owns nothing.** *(The earlier lean toward "here" is superseded.)*
