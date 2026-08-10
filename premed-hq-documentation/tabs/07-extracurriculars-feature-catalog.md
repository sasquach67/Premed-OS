# Extracurriculars: feature catalog

**Companion to `tabs/07-extracurriculars.md` (the spec) and `tabs/07-extracurriculars-board.md` (the reasoning).** **Where they conflict, the spec wins.**

**Built Aug 2026** because the board reached 592 lines of accumulated conversation and stopped being readable. **Nothing here is a new decision** — this is the same content, sorted.

## How to read the columns

**`St` — where each thing actually stands. This is the column to scan.**

| | |
|---|---|
| **`live`** | **In the shipped code.** `Extracurriculars.tsx` is ~1,077 lines and already runs |
| **`spec`** | Written into `07-extracurriculars.md` |
| **`board`** | **Ruled on the board, not yet in the spec.** The migration backlog |
| **`open`** | **Needs Andy** |
| **`cut`** | Rejected. Kept so it is not re-proposed |

**`AI`** — `○` deterministic · `◑` better with AI · `◐` degrades gracefully · `●` requires an LLM.

**`Surface`** uses a fixed vocabulary: `Organizations` · `Initiatives` · `Reflections` · `Discover` · `Profile` · `Overview` · `shell` · `none` (a rule with no surface).

> ### ✅ SETTLED Aug 2026 — four sub-tabs AND an Org Hub. Both.
>
> **`Organizations · Initiatives · Reflections · Discover`** at the top level — **`E-31` stands.** Andy: *"we should still keep initiatives… where it's the ledger, because that makes sense and it follows the structure."* **Every pillar has a ledger tab; this is ECs'.**
>
> **AND clicking a club opens a full Org Hub page** with that club's initiatives inside it — Andy: *"like how the class page functions in academics."*
>
> **These are not in conflict. Academics already does both:** `Assignments` is a top-level tab *and* a view inside Class Hub. **Same records, two doors** — the cross-club ledger for *"everything I've done,"* the club page for *"what I did at MEDLIFE."* Full reasoning: `07-extracurriculars.md` §5-0.

**Entity-tab rows carry `(list)`, `(panel)`, or `(page)`** — required by `05-experience-pillar.md` §2c. **A row saying only `Organizations` could be card content, a detail-panel module, or a nudge that fires on the surface, and a mockup cannot be drawn from that.** Applied Aug 2026: **2 `(list)` · 17 `(panel)` · 8 `(page)`.**

> **What the split immediately revealed: only two of 27 things live on the card.** The org list itself, and the most-meaningful marker. **Everything else is panel or page** — which is the recorded answer to *"the card carries seven things, what survives the squint test?"* **Almost nothing does, and that matches the `§1a` minimalist ruling rather than fighting it.**

> ✅ **Sub-tab set RULED Aug 2026 (E-31): `Organizations` · `Initiatives` · `Reflections` · `Discover`.** **Held after a same-day round trip — see the settled note above.**
>
> **Two candidates were raised and folded rather than built.** **`People`** — Andy pushed on it and no distinct *functionality* survived the question; mentorship lives on the `Role` and advisors on the `Org`, both inside the Organizations detail panel. **`Map`** — **folded twice.** First to a list/map toggle, then **removed entirely** (`07-campus-layer-board.md` §2d, §2e): the map is a **`PlaceLine`** — one line on a record, canonical building name · travel · `Open in UNC maps ↗`. **No map surface exists in any pillar.**
>
> **`Reflections` is not new** — it is the surface this pillar should always have had, and the only pillar missing one. **`Discover` is the genuine addition**, and the only sub-tab in any pillar showing records the student does not own. Full treatment: `07-extracurriculars.md` §5.

---

## Wave 1 · The record — what exists today

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 1 | **Organizations list** | Organizations (list) | ○ | `live` | The primary list; each org showing its role progression inline rather than one current title |
| 2 | **Org workspace** | Organizations (panel) | ○ | `live` | `EcsOrgWorkspace` + `WorkspaceModule` — roles, initiatives, reflections in one place |
| 3 | **Roles as dated records** | Organizations (panel) | ○ | `live` | **Multiple per org. Editing one never overwrites history** — the sequence *is* the data |
| 4 | **Role progression path** | Organizations (panel) | ○ | `live` | `Member → Treasurer → President` as a compact path. **The one visualisation that genuinely earns its place** |
| 5 | **Initiatives as a first-class entity** | Initiatives | ○ | `live` | A peer view, reachable without drilling through an org. **This is the essay material** |
| 6 | **`survivedHandoff`** | Initiatives | ○ | `live` | `yes · no · too early · n/a`. *Did the thing outlive you* |
| 7 | **Reflections** | Reflections | ○ | `live` | Dated notes on a role or initiative; flow to Story Bank. **The data exists today; the surface does not** — currently buried in the org workspace |
| 8 | **Advisors as contacts** | Organizations (panel) | ○ | `spec` | `ContactCard`, shared with Letters — never forked |
| 9 | **Most-meaningful designation** | Organizations (list) | ○ | `spec` | Max 3, **enforced app-wide across all five pillars** |
| 10 | **Involvement span** | Organizations (panel) | ○ | `spec` | Sustained vs scattered, bounded height |

## Wave 2 · The intelligence that exists

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| 11 | **Depth-over-breadth read** | Organizations (page) | ○ | `spec` | *"You're in 6 organizations and hold a role in none."* **Once, never repeated, never scolding** |
| 12 | **Progression detection** | Organizations (page) | ○ | `spec` | *"Member → Treasurer → President over 3 years. Name this in your application"* |
| 13 | **Uncaptured-initiative prompt** | Organizations (page) | ○ | `spec` | *"You've been VP for 8 months with nothing logged"* |
| 14 | **Succession follow-up** | Initiatives | ○ | `spec` | *"too early"* revisits later and resolves |
| 15 | **Most-meaningful advisor** | Profile | ○ | `spec` | Candidates from **all** pillars with evidence. **Compares, never recommends** |
| 16 | **Non-medical value note** | Organizations (page) | ○ | `spec` | Fires once when a record is entirely medicine-adjacent |
| 17 | **Double-count catch** | Organizations (page) | ○ | `spec` | A service club also in Volunteering → cross-link offer, **never auto-merge** |
| 18 | **Thin-description catch** | Organizations (page) | ○ | `spec` | A title with nothing else, surfaced **while memory is fresh** |

## Wave 3 · The record, extended (Aug 2026)

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| E-7 | **Cadence** | Organizations (panel) | ○ | `spec` | *"Two meetings a week plus an event a month, for three years."* **The input from which hours are derived** (Standard A″) |
| E-8 | **What the org could do when you left that it couldn't when you arrived** | Organizations (panel) | ○ | `spec` | Capability, not headcount. Size · what it does · structure · standing · reach · continuity. **Freeform, most fields blank** |
| E-10 | **Founding as its own shape** | Organizations (panel) | ○ | `spec` | A founder has no predecessor and no template — `founder` as one enum value undersells it |
| E-18 | **Impact figures in your own units** | Initiatives | ○ | `spec` | `number + unit + what`. *"$4,200 raised."* **Never summed, never compared** |
| E-20 | **`roleKind` — the second axis** | Organizations (panel) | ○ | `spec` | `elected · appointed · hired · selected · volunteer · founding · honorary`. **`selected` is what the old enum could not express** — captain, drum major, cast member |
| E-20b | **`level` cleaned to pure seniority** | Organizations (panel) | ○ | `spec` | `participant · contributor · lead · officer · head`. **Needs a lossless migration** |
| E-23 | **Budget and team size** | Organizations (panel) | ○ | `spec` | *"Managed a $12,000 budget. Ran a team of 9."* Scope of responsibility per role |
| E-17 | **Repeated activities** | Organizations (panel) | ○ | `spec` | AMCAS `Repeated` + up to 3 additional date ranges (4 total). **Common in ECs specifically** |

## Wave 4 · People and community

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| E-2 | **Mentorship, both directions** | Organizations (panel) | ○ | `spec` | People you mentored · people who mentored you. **On the `Role`** (ruled). **The largest gap — no pillar models reciprocity** |
| E-11 | **The team you built** | Organizations (panel) | ○ | `spec` | Who you recruited or appointed. *"I found the person who replaced me"* is a different claim from *"I mentored someone"* |
| E-3 | **Prompts about people, not impact** | Reflections | ○ | `spec` | *"Who were these people to you?"* **#45 chips configured, not a second system** |

## Wave 5 · The arc

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| E-5 | **Progression by academic year** | Organizations (panel) | ○ | `spec` | `First year member · Sophomore committee chair · Junior VP · Senior president`. **Store dates, display years** |
| E-12 | **Year in review** | Organizations (page) | ◐ | `spec` | One retrospective per academic year. **Never a report card** — no scores, no year-on-year comparison |
| E-14 | **What you would do differently** | Initiatives | ◐ | `spec` | *"Anything you'd do differently?"* beside a completed thing. **Nothing has to have gone wrong.** Never nudged, never counted |

## Wave 6 · Campus and discovery

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| E-1 | **UNC organization directory** | Discover | ○ | `spec` | **1,278+, not a curated 150.** Category A dataset, link out to Heel Life for the rest |
| E-2b | **Recommendations by interest** | Discover | ◐ | `spec` | *"Three orgs match what you already do."* **Never by popularity among premeds** — that destroys the differentiation this pillar exists for |
| E-15 | **When elections actually happen** | Organizations (panel) | ○ | `spec` | Per-org, student-entered, optional. **Miss the spring window and you miss the year** |
| ~~E-f~~ | ~~The map, scoped to opportunities~~ | — | — | `cut` | **RE-RULED Aug 2026 (`07-campus-layer-board.md` §2d): there is no Overview map to scope.** The map is **one building marked on an event**, plus `Open in UNC maps ↗` out to Concept3D. **Replaced by `EV-1`** |
| **EV-1** | **Event prospecting — *"can I actually go to this?"*** | Discover | ○ | `spec` | **The largest feature in this pillar.** HQ finds an event, **checks it against your schedule and the walk**, and hands you what you need to show up. Sources: **flyers · Heel Life RSS/iCal · the curated dataset.** Delivered through the **bell**, accept/decline inline. **Accept blocks the travel time too** |
| **EV-2** | **`Nothing scheduled`, never `You're free`** | Discover | ○ | `spec` | **Copy law.** An empty evening is not an available one. **Same line that overturned the sufficiency call** |
| **EV-3** | **Did you join?** | Discover → Organizations | ○ | `spec` | **Days after an accepted event, once.** Yes creates the org record prefilled from E-1. **The only HQ-initiated path from `Discover` into the pillar** |

## Wave 7 · The application

| # | Feature | Surface | AI | St | What you see |
|---|---|---|---|---|---|
| E-19 | **Honors, awards, recognitions** | Profile | ○ | `spec` | **Attaches to whatever earned it; Profile/CV aggregates.** Includes `selectivity` — *"12 of 200"* |
| E-16 | **Descriptions drafted from real material** | Organizations (panel) | ◑ | `spec` | 700 characters assembled from three years of initiatives and reflections. **HQ assembles; the student writes** |

## Wave 8 · Rules with no surface

| # | Rule | AI | St | |
|---|---|---|---|---|
| E-6 | **The register — this pillar reads as personal, not as a ledger** | ○ | `spec` | Stat strip does not lead with counts. Empty states name non-medical examples first. **Nothing is ever scored, ranked, or compared** |
| A′ | **Hours: tracked, never the hero** | ○ | `spec` | AMCAS requires them. **Not in the stat strip. Weekly commitment answered on request, never pushed.** Proactive only at pre-cycle |
| A″ | **Hours are derived from cadence, not logged per session** | ○ | `spec` | Nobody logs a one-hour club meeting. **Cadence × span, overridable, one-off spikes added separately** |
| — | **Targets available, default off** | ○ | `spec` | Free-reign principle. `03-clinical.md` §7a unchanged. **HQ never suggests a number** |
| B | **Record the learning, not the failure** | ○ | `spec` | *"What I'd change"* is growth. *"I lost"* is a scar the app made you keep |
| — | **HQ does not track non-events** | ○ | `spec` | **App-wide.** Rejected twice — shadowing asks (S-7), lost elections (E-9). **Reflection attaches to events, never their absence** |
| — | **`InfoTip` on every enum value** | ○ | `spec` | `01` §4f-i. **Without it, `roleKind`'s seven values manufacture guesses** |

## Wave 11 · `Initiatives` — the surface that was five items deep (Aug 2026)

**Counted by surface: `Organizations` 27 · `Reflections` 6 · `Discover` 6 · `Initiatives` 5.** **The record and almost no intelligence on it** — the same shape `Reflections` was in before Wave 10, and this is the surface the spec calls *"the essay material."*

| # | Feature | Surface | AI | St | |
|---|---|---|---|---|---|
| **I-1** | **`status`: planning · running · finished** | Initiatives | ○ | `spec` | **RULED Aug 2026** — walked through with Andy, see the lifecycle below |
| **I-2** | **Recurring initiatives** | Initiatives | ○ | `open` | **Inheritance gap — Volunteering has this as `VE-2`** |
| **I-3** | **Two fields is a complete initiative** | Initiatives | ○ | `spec` | **RULED Aug 2026** (*"three is good"*) |
| **I-4** | **The capture trigger** | Initiatives | ○ | `open` | Nothing currently asks |

### `I-1` — one initiative, all the way through (the worked example, Andy Aug 2026)

**September of junior year, VP of Carolina Health Access.**

| When | `status` | The record |
|---|---|---|
| **September — an idea** | `planning` | **Saturday clinic shuttle** · *"Patients keep no-showing because the bus doesn't run Saturdays."* **Two fields. `survivedHandoff` and `wouldDoDifferently` are not on screen** — they would be meaningless |
| **October — it starts** | `running` | *"Patients could get to Saturday appointments without a car."* · 3 drivers · ~15 riders a month |
| **January — term boundary** | `running` | **`I-4` fires once:** *"The shuttle's been running since October. Anything changed worth noting?"* → *"Expanded to two vans after the health department asked"* |
| **May — you graduate the role** | `finished` | **Only now do the post-hoc fields appear.** `survivedHandoff: too early` · *"I should have trained a second coordinator in month two instead of month eight"* |
| **November — resolution** | `finished` | The succession follow-up revisits `too early` → **yes** |

**The final record:** *Saturday clinic shuttle · Carolina Health Access · Oct 2025 – May 2026 · you ran it · 4 drivers · ~60 riders a semester · survived handoff: yes.*

> **What `status` bought:** the record existed from the day of the idea, **it grew while the thing was happening**, and the fields that only make sense at the end **stayed hidden until the end.**
>
> **Without it, that record either does not exist until May** — reconstructed from memory — **or it sits from September with three empty boxes asking whether it survived a handoff that has not happened.**

### `I-1` — you cannot log the thing you are in the middle of

**Every field on `Initiative` is post-hoc.** `survivedHandoff`, `outcome`, *what you'd do differently* — **all of them assume the thing is over.**

**But an initiative runs for a year.** You start the shuttle in September and hand it off the following May. **Right now there is nowhere to put it during those nine months** — which is exactly when the student remembers the details that make it worth writing about.

- **`status: planning · running · finished`.** A running initiative is a complete record; `survivedHandoff` and `wouldDoDifferently` **stay hidden until it finishes** rather than sitting there as empty accusations.
- **`finished` is what triggers everything else** — the succession follow-up, `E-14`, and `RM-1`'s reflection prompt.
- **`planning` matters more than it looks.** A student with an idea has somewhere to put it. **But it records no obligation** — `U-7`, a plan that never happens is deleted, not counted as a failure.

### `I-2` — three years of the same event is one story, not three records

**Direct inheritance from `VE-2`, added to Volunteering the same day.** You ran the blood drive in 2024, 2025, and 2026. **Today that is three unrelated initiatives**, and it reads as three scattered things rather than the sustained commitment it actually is.

- **An initiative may be marked recurring**, linking its instances: *"3rd year · 3 runs · grew from 40 to 110 donors."*
- **The impact figures per instance stay separate** (`E-18`: never summed) **but the arc is visible.**
- **This is the strongest evidence-of-commitment shape this pillar has** and it currently renders as noise.

### `I-3` — the minimum initiative is a title and one sentence

**The entity has seven fields.** Title · what changed · outcome · impact figures · `survivedHandoff` · participation · dates. **Faced with seven empty boxes, a student writes nothing.**

> **Required: the title, and what changed. Everything else is optional forever.**

- ***"Started the Saturday clinic shuttle"* + *"riders could get to appointments without a car"* is a complete initiative.** It can be enriched later or never.
- **No completeness meter, no "3 of 7 fields," no amber chip.** `U-9`.
- **This is the counterpart to §5's ruling that the 5-second rule does not apply here.** **The add flow can afford to *ask* more — it must not *require* more.** Those are different things and the current spec only states the first.

### `I-4` — nothing currently asks you to record one

**#13 fires on an officer role with nothing logged** — *"you've been VP for 8 months with nothing logged."* **That is the only prompt, it is role-shaped, and it misses every initiative by a non-officer.**

**Three moments that exist in the data and are unused:**

| Trigger | |
|---|---|
| **A club event you accepted has passed** | `EV-1` put it in your schedule. **Days later: *"did the MEDLIFE fundraiser turn into something you ran?"*** |
| **An initiative marked `running` crosses a term boundary** | *"The shuttle has been going since September — anything changed worth noting?"* |
| **A role ends with no initiative attached** | Broader than #13, which only fires on officers |

**Once each, dismissible, never repeated.** **And declining records nothing** — `U-7`.

## Wave 10b · `RM-1` trigger list — this pillar's part of the shared mechanism

**`RM-1` to `RM-6` live in `05-experience-pillar.md` §2b-ii and are not retyped.** **Each pillar supplies only its triggers and its prompt copy.** These are ECs':

| Trigger | Pairs with |
|---|---|
| **An initiative is marked complete** | **The strongest one** — memory is freshest, and it already pairs with `E-14` (*what you'd do differently*) |
| **A role ends** | The arc just closed |
| **A year boundary** | `E-12`'s year in review lands here |
| **An accepted event you attended** | `EV-3`'s *"did you join?"* |
| **A `provisional` org resolving to `active`** | **Added Aug 2026.** You just decided a club is real — **the freshest possible moment to say why** |

**Prompt copy is `E-3`'s chips: about people, not impact.** *"Who were these people to you?"*

## Wave 9 · The big swings (Aug 2026)

**Why this wave exists.** Andy: *"did we really brainstorm all the different BIG features and interfaces and tabs that belong to extracurriculars?"* **No.** The campus board's grand-scale list gave this pillar **one line** — the org directory — while every item in Waves 1–8 is a field or a prompt. **`EV-1` arrived by accident out of the map conversation.** This wave is the deliberate attempt.

**The test, from `07-campus-layer-board.md` §5: does it change what a student can DO, or only how neatly they record what they already did?**

| # | Feature | Surface | AI | St | |
|---|---|---|---|---|---|
| **E-BIG-1** | **The UNC organization directory at real scale** | Discover | ○ | `spec` | **1,278+, not a curated 150.** Same as E-1 |
| **EV-1** | **Event prospecting** | Discover | ○ | `spec` | See Wave 6. **The largest feature in the pillar** |
| **E-BIG-3** | **Founding an organization — the guided path** | Organizations (page) | ○ | `open` | **GREENLIT (Andy, Aug 2026): *"I'd love a guide on that."*** See below |
| ~~E-BIG-2~~ | ~~The path to a role — per-org governance~~ | — | — | `cut` | **The data does not exist.** See the cut table |
| ~~E-BIG-4~~ | ~~The March problem — election windows across all orgs~~ | — | — | `cut` | **Timeline's job.** See the cut table |
| ~~E-BIG-5~~ | ~~Handoff as a workflow~~ | — | — | `cut` | **Serves the org, not the student.** See the cut table |

### `E-BIG-3` — founding an organization, guided by UNC's real process

**Greenlit. The reasoning:**

- **Founding is the highest-value extracurricular a premed can do**, and `roleKind: founding` already exists as a field (E-10). **This is the feature that makes anyone able to earn it.**
- **The wall is unwritten procedure, not ambition.** UNC has an actual registration process — Heel Life submission, an advisor requirement, a constitution, a minimum member count, approval windows. **A student with an idea has no idea where to start.**
- **This is precisely *"a logistical guide, not a tracker"*** — Andy's own framing of HQ's fatal flaw (`08-logistics-board.md` §1).
- **And unlike `E-BIG-2`, the data exists and is small.** **One official published process, not 1,278 org constitutions.** A single Category A document with a `freshness` block.
- **`○` deterministic.** A sourced checklist with dates and links. **HQ carries the steps; it does not submit anything on the student's behalf.**

**Research ask (new):** *UNC's official student-organization registration process — required steps, advisor requirement, constitution requirements, minimum membership, submission route, approval windows and deadlines, and how often it changes.* **Source URL and retrieval date required**, like every Category A item.

## Wave 10 · `Reflections` — the surface that was two items deep

**Why this wave exists.** Counted by surface, the catalog was **`Organizations` 26 · `Discover` 5 · `Initiatives` 5 · `Reflections` 2.** Andy on Reflections: *"a very very very important tab"* and *"everything written should really end up there."* **Two items is not that.**

| # | Feature | Surface | AI | St | |
|---|---|---|---|---|---|
| **R-3** | **A reflection is a conversation, not a text box** | Reflections | ● | `spec` | **RULED (Andy, Aug 2026).** See below — **this overturned my own proposal** |
| **R-2** | **The moments HQ asks** | Reflections | ○ | `spec` | Right now **nothing ever asks.** The tab exists and waits |
| **R-4** | **Search across your own writing** | Reflections | ○ | `spec` | **GREENLIT.** *"Sure, idk how that'd look but I like it"* |
| **R-5** | **Synthesis threads, actually specced** | Reflections | ○ | `spec` | #45b is referenced everywhere and defined nowhere. **Student-made, never auto-clustered** |
| **R-6** | **Dictation is pointed at, never implemented** | shell | ○ | `spec` | **RULED — app-wide, not a Reflections feature.** See below |
| ~~R-1~~ | ~~The dated pair — you now, reading you then~~ | — | — | `cut` | See the cut table |

### `R-3` — sufficiency is shape, not length (RULED, Andy, Aug 2026)

> *"A while ago I said that the AI should try to encourage a response. Types up a response, AI responds, provokes more thought and response, and so forth. So no, two sentences are NOT a complete reflection, but a few lines of expression or a fleshed-out point or two (even though word count may not be sufficient) is what defines it as sufficient."*

**This overturns the proposal it replaced.** I proposed *"two sentences is a complete reflection"* on the grounds that a long text box feels like homework. **The homework problem is real; the answer is not a lower bar, it is a conversation.**

- **The loop:** the student writes → **HQ responds to what they actually wrote** → that provokes more → the student writes again. **Not a form. Not a prompt-and-store.**
- **Sufficiency is defined by shape:** *a few lines of expression, or a fleshed-out point or two.* **Never a word count**, never a progress bar, never a completeness meter. **A long reflection that says nothing is not sufficient; four honest lines are.**
- **The student ends it whenever they want.** HQ never withholds "done", never asks a third time unprompted, and **never marks a reflection incomplete.** The conversation is an offer.
- **`●` requires an LLM.** **Degradation is real and must be designed:** with no key, the surface falls back to the E-3 prompt chips and a plain box. **It gets worse, not broken.**
- **HQ's side is never recorded at all** (RULED, Andy, Aug 2026: *"HQ's provoking is not recorded. It only helps student."*). **Stronger than "excluded from Story Bank" — it is not persisted anywhere.** Re-open a reflection a year later and you see **only what you wrote.** Three consequences worth stating: it keeps `09-essays-story-bank.md`'s boundary intact by construction rather than by filtering; **it means the drafter can never quote HQ back to the student**; and it keeps the store small, which matters while **S0 (the localStorage quota defect) is open.**

### `R-2` — the moments HQ asks

**Nothing in HQ currently asks for a reflection, ever.** Four moments already exist in the data and go unused:

| Trigger | |
|---|---|
| **An initiative is marked complete** | The moment memory is freshest, and it already pairs with E-14 |
| **A role ends** | The arc just closed |
| **A year boundary** | E-12 already lands here |
| **An accepted event you attended** | Pairs with `EV-3`'s *"did you join?"* |

**Once each, dismissible, never repeated** — the #11 / #13 discipline. **Without triggers this surface is a blank page, and blank pages do not get filled.**

### `R-4` — search across your own writing

**Concretely, since Andy asked what it would look like:** one search field at the top of `Reflections`, beside the existing org and state filters. **Plain text match across reflection bodies**, results as the same `ExpandableEntryRow` with the matched phrase highlighted.

- **`○` deterministic.** Substring match over localStorage. **No index, no embedding, no service.**
- **It is the same search on Story Bank**, scoped wider. **One component, two doors** — the pattern already governing this surface.
- **Semantic search is explicitly deferred to Atlas** and is not required for this to be useful. **Sixty reflections and a text box beats sixty reflections and no text box.**

### `R-6` — HQ never implements dictation (RULED app-wide; **canonical home is `implementation/integration-map.md` §1 Dictation**)

> ⚠️ **Do not duplicate this rule into pillar specs.** `integration-map.md` §1 already owned dictation as a tier-1 handoff and now carries the full ruling. **This entry is a pointer.** The summary below is retained for readers of this catalog only.

> *"Users are already encouraged to download Wispr Flow, hopefully (it should be a popup) when students are wanting to dictate. I don't trust coded dictation services, I'll only use the real source, and other services."*

**HQ ships no speech-to-text.** No Web Speech API, no transcription service, no recording. **Every writing surface is a standard `textarea` so the OS or a real dictation tool can type into it** — which `07-extracurriculars.md` §12 already required for a different reason.

**The pointer, once:** when a student first opens a long-form writing surface on mobile, a dismissible note names **Wispr Flow** and the OS's built-in dictation. **Once, dismissible forever, never repeated.**

**Two facts the copy must carry, verified Aug 2026:**
- **Students with a `.edu` address get Pro at ~$6/month** (50% off the $15 standard). **There is a free tier** — 2,000 words/week on desktop, 1,000 on iPhone. Mac, Windows, iPhone, and Android.
- **Wispr Flow captures screenshots to power its AI features**, which some users find intrusive. **HQ must say so.** Recommending a third-party tool without naming its privacy behaviour would be dishonest, and **the OS's built-in dictation must be offered alongside it** so the recommendation is not the only path.

**This is a pointer, not an integration.** No API, no dependency, no affiliate relationship. **If Wispr Flow changes or disappears, one string changes.**

## Cut, and why — do not re-propose

| # | | Why |
|---|---|---|
| O-1 | ~~Concurrency over four years — a band showing how many organizations per year and which had roles~~ | **CUT (Andy, Aug 2026): *"I guess it's cool to know, but I don't know what this is actually for."*** **Mocked** (`mockups/07-extracurriculars/organizations-surface.html` frame 2) **and killed by its own drawing.** **A student knows which clubs they have been in** — it renders information they already hold. **Worse than the campus surface it resembles:** a first-year sees one column, and it only becomes legible in senior year, by which point the student certainly knows. **No decision changes because of it** |
| — | **⚠️ THE PATTERN BEHIND THREE CUTS — read before proposing another view** | **`O-1`, `R-1` (the dated pair), and the campus surface (`07-campus-layer-board.md` §2d) all died to the same sentence from Andy: *"what is this actually for?"*** **All three were reflective views — attractive ways to look at what already happened.** **None changed a decision.** **The test that survives: does a student DO something different because of this?** If the answer is *"they understand themselves better,"* **it is a picture, not a feature** — and Story Bank plus `E-16` already deliver understanding at the one moment it is needed, which is while writing |
| R-1 | ~~The dated pair — a reflection gets a second entry years later, "here's what I'd say about this now"~~ | **CUT (Andy, Aug 2026): *"I would lean towards no."*** **He is right, and the reason is duplication, not value.** The value of re-reading old writing is real — **but `E-16` already delivers it.** The description drafter pulls three years of the student's own material **at the moment they are writing**, which is re-reading *as an input*. **R-1 was re-reading as a ritual**, and it asks for fresh writing in August of the application year — **the single worst moment to add work.** **Same failure as `reach`: a second mechanism doing a job something else already does better** |
| E-BIG-2 | ~~The path to a role — per-org governance (what positions exist, how each is filled, the typical path, who holds them)~~ | **CUT (Andy, Aug 2026): *"wouldn't that require information about the org itself? I'm not sure."*** **He is right and the objection is fatal: the data has no source.** Per-org governance for **1,278 organizations** is not published anywhere, and student-entered means one member's guess about how their own club works. **This was the under-scoping failure in reverse** — §2 corrected me for proposing too little; this proposed something whose *input does not exist*. **`E-15` (student-entered election window, optional, per-org) is the only part that survives, and it is already specced** |
| E-BIG-4 | ~~The March problem — election windows across all your orgs at once~~ | **CUT (Andy, Aug 2026): Timeline's job.** *"Tasks already take care of that whenever it happens to arise, maybe timeline even can take care of that."* **And the reason why is a statement about Timeline's purpose worth carrying:** ***"Timeline's job frankly is development, so it can watch as you become a member and then grab some leadership positions. Timeline aids development in all sectors."*** **A role progression is a development arc, which is exactly what a four-year quest log is for** (`11-timeline-tasks.md`). **Building a second cross-org deadline view here would fork Timeline** |
| E-BIG-5 | ~~Handoff as a workflow~~ | **CUT (Andy, Aug 2026): *"I'm not handing off the organization to another user and I don't really care what happens to the class below me, so idk what the point of this is."*** **Correct — it served the organization, not the student.** HQ is single-user (N-1) and there is no successor on the other end to hand anything to. **`survivedHandoff` stays as a field** because interviewers ask the question; **the workflow was building for the wrong person** |
| E-9 | ~~Elections you ran in and lost~~ | *"Presents failure with no meaning or anything to learn from."* **Non-event rule** |
| E-13 | ~~What went wrong~~ | **E-14 absorbs it.** A field named for failure invites cataloguing failures |
| E-22 | ~~Total weekly commitment across pillars~~ | `03-overview.md` §6.5 already shows it |
| E-24 | ~~Stepping back is not quitting~~ | **Defended against a state that does not exist** — this pillar has no staleness alert |
| E-21 | ~~Ran-it-vs-attended-it enum~~ | **Promoted, not cut.** Became the app-wide writing assistant → `05-experience-pillar.md` |
| — | ~~Images on org records~~ | **Blocked on S0**, the localStorage quota defect. Never base64 in the store |
| E-4 | ~~The throughline sentence~~ | **CUT (Andy, Aug 2026): "just cut the throughline."** It was **one text box whose entire payoff arrives two to three years later**, needing no data, no derivation, and no integration — a prompt with a field attached, not a feature. **And the job is already covered better:** the personality read (Profile/CV) shows patterns from real evidence, and the writing assistant helps at the moment of writing. **If the effect is ever wanted, it is a `MascotNote` on Reflections — *"what do these have in common?"* — never a stored field.** |

---

## Open — needs Andy

| # | | |
|---|---|---|
| ~~**E-31**~~ | **RULED Aug 2026: `Organizations` · `Initiatives` · `Reflections` · `Discover`.** `People` folded into the Organizations detail; `Map` became a view toggle. **Every `Surface` value above is now settled** |
| ~~**E-b**~~ | **CUT Aug 2026.** See the cut table above |
| ~~**E-e**~~ | **RULED Aug 2026: Profile/CV, in the AMCAS export preview.** Already determined by `03-clinical-views-board.md` **V3** — the export preview lives there because the **15-entry cap is application-wide**, and the most-meaningful cap of 3 has exactly the same shape. **You are on Profile/CV looking at all 15 entries from every pillar, ticking three; the suggestion appears inline in that list.** ECs deep-links and owns nothing |
| **E-BIG-3** | **Founding an organization — the guided path. GREENLIT, not yet specced.** **Blocked on one research ask** (UNC's official student-org registration process, §Wave 9). **The only `open` item in this pillar** |
| ~~**E-x**~~ | **DONE Aug 2026. The spec absorbed the catalog.** Every item above moved `board` → `spec`. **Where they now live:** `roleKind`/`level` and the migration → **§4a** · hours from cadence (A′, A″, targets) → **§4b** · impact figures (E-18) → **§4c** · repeated ranges (E-17) → **§4d** · year in review, elections, descriptions, progression-by-year (E-12, E-15, E-16, E-5) → **§7** · the register (E-6, B, non-events) → **§7a** · people both directions (E-2, E-11, E-3) → **§7b** · honors (E-19) → **§7c** · event prospecting (EV-1/2/3) → **§5g**. **Acceptance criteria gained eleven checks.** **This catalog is now a reference index, not a backlog** |
