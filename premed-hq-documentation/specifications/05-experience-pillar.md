# 05 · The shared experience frame

**Status:** Rewritten Aug 2026. Was "Experience Pillar", an 84-line spec that made per-pillar claims.
**Repo:** `src/pages/ExperiencePillar.tsx` (Clinical · Volunteering · Shadowing · Research) + `src/pages/Extracurriculars.tsx` (separate, and staying that way)
**Depends on:** `specifications/01-shared-interface-patterns.md`, `specifications/04-visual-craft-standards.md`, `general.md`

---

## What this file is for

**Only what no single tab file can say on its own.** It holds the frame the five experience pillars share and the rules that cross them. It makes **no per-pillar claims** at all.

**It is not a spec for a page.** Nothing here describes what any pillar tracks, measures, or shows. That lives in the tab files, which are the source of truth for their own domain and always win.

**Why it was rewritten:** the old version carried a per-domain config table that duplicated the tab files. Being the second-best copy, it drifted, and it kept asserting a cut feature (skills observed/performed) months after `03-clinical.md` removed it. A shared file that repeats domain detail will always rot, so this one stops repeating it.

## Where the domain detail actually lives

| Pillar | File | Renders as |
|---|---|---|
| Clinical | `tabs/03-clinical.md` | `ExperiencePillar category="clinical"` |
| Volunteering | `tabs/04-volunteering.md` | `ExperiencePillar category="volunteering"` |
| Shadowing | `tabs/05-shadowing.md` | `ExperiencePillar category="shadowing"` |
| Research | `tabs/06-research.md` | `ExperiencePillar category="research"` |
| Extracurriculars | `tabs/07-extracurriculars.md` | `Extracurriculars`, its own page |

**Each tab file owns its own headline metric, primary tracker, fields, and exclusions.** Do not look here for them.

## 1. One component, four routes

`ExperiencePillar.tsx` renders Clinical, Volunteering, Shadowing, and Research from a single component, selected by a `category` prop (`App.tsx`). **These are routes on an existing page, not four pages.**

A tab file handed to an implementer reads like a standalone spec. It is not. **Building any of the four as a new page is a defect**, not an interpretation (`CLAUDE.md`: shared components are reused, never forked).

**Extracurriculars is deliberately separate** and stays that way. **Ruled Aug 2026** (Andy), withdrawing the old instruction to fold it in. Its metric is impact rather than hours, it departs from the shared frame more than any other pillar (`07` §2.1), and its current layout is one Andy already likes. Folding it in would mean bending the shared component around the pillar that shares the least with it.

**On the implementation, stated plainly rather than aspirationally:** the component branches internally on `category`, currently in 27 places, and there is no declarative config object. Earlier versions of this file claimed a config-driven architecture with "no `if category ===` sprawl." That was never built. A refactor is recorded in `implementation/deferred.md` and is **not** an outstanding obligation, since it changes nothing a user can see.

## 2. The shared frame

Identical on all five, including Extracurriculars.

- **Compact headline strip, not stat boxes.** One slim line (`124 hrs · 68% of 150 · 5 active`), optionally a thin inline bar. **Not** three large stat squares plus a progress ring: that is the AI-default look and a waste of space (`04` §6, §10). What goes *in* the strip is the tab file's business. The shape is shared.
- **The experience list is the hero.** What the user came for is their own records: sites, orgs, physicians, projects, clubs. The list gets the space and the visual weight. The strip is a thin header above it, never the centerpiece.
- **Cards by default** on all five (`01` §5 per-shape default), opening into a **full-width inline workspace beneath the card grid**. One selected organization, site, physician, project, or initiative remains selected while the grid stays visible above its record context, related activity, people/verification, reflections, and actions. This is the experience-pillar exception to `01` §2's center-peek default: the surrounding commitments remain visible so a student can scan and compare their own record.
- **Inspector tabs:** Overview/Details · Relations · Files · Reflections · Verification · Activity.
- **Add** via Quick Add (shell §7.4), prefilled to the pillar.
- **Standard states:** empty, loading, error (`01` §8). Mobile per `01` §5c. In-app controls per `01` §4a.
- **People and orgs are shared canonical entities** (`general.md`). A supervisor is one `Person` across every pillar and Letters, never re-entered per tab.

## 2a. The three reads: hours, recency, continuity (LOCKED Aug 2026 · all five pillars)

**Andy, Aug 2026:** *"a thing to show continuity should be present in both Volunteering and Clinical and whatever the rest. Continuity is important for all of the elements. Though a little bit more emphasis is for Volunteering, everything should still be there."*

**An earlier framing had pillars owning different metrics**, as though Clinical was about recency and Volunteering about longevity and they were alternatives. **They are not alternatives.** They are three different questions, and every pillar's record answers all three:

| Read | The question | Where it lives |
|---|---|---|
| **Hours** | *How much have I done?* | The headline strip, and the running-total view of the hours chart |
| **Recency** | *Am I still doing it?* | The `last session N days ago` line on each card |
| **Continuity** | *Did I stay with it?* | **The continuity read, new** |

**Continuity is the one that was missing everywhere.** Hour heights show rate. A running total shows accumulation. **Neither answers whether a student stuck with something**, and that is the read admissions actually rewards across every kind of experience.

### The continuity read

- **Engaged periods against gaps, across a record's whole life.** Not hour magnitudes. A month with 4 hours and a month with 40 both count as *engaged*; a month with none is a gap. **The question is presence, not volume.**
- **Bounded height** (`01` §5c), and it sits **beside** the hours chart rather than replacing it.
- **Descriptive only.** It states the pattern and stops. **No score, no streak, no "consistency rating"**, and no comparison between a student's own experiences.
- **Silent under three months of history.** Continuity over one term is not a signal, it is a fragment (`01` §6.10-A).
- **Estimated backfill blocks are excluded**, same as everywhere else: a lump sum has no month-by-month shape to read.

### Emphasis differs; presence does not

- **Volunteering** leads with it. Sustained service is that pillar's headline signal.
- **Clinical** leads with recency, but shows continuity too. A two-year sustained role reads differently from the same hours in one summer, and Clinical previously had no way to say so.
- **Shadowing** shows it, though it carries least weight — **not because "the correct end state is stop"** (that premise was overturned Aug 2026, `05-shadowing.md` §2.1) **but because shadowing is naturally episodic.** You go when a physician has a day free, so a gap reflects their calendar more than the student's commitment.
- **Research** measures continuity in months on a project rather than session cadence, because output pipelines move slowly.
- **Extracurriculars** shows continuity **without hours**, per its own rule. Roles over time is exactly a continuity read, and this is the one pillar where it may be the *primary* one.

**A continuity display is not a staleness alert.** Volunteering excludes Clinical's #33 nudge (`04-volunteering-board.md` §2) while showing continuity in full. **A fact the student can look at is not the same as HQ interrupting them about it**, and that distinction governs every pillar.

## 2b. THE SHARED BEHAVIOUR CORE (LOCKED Aug 2026) — every pillar inherits this

> **Why this section exists.** Andy, Aug 2026: *"the idea was to carry over all the features and then come up with more features specific to that specific thing… Most of the format of clinical and the things that it does are pretty much the same for shadowing and maybe even research, and volunteering as well. There are specific things in volunteering and shadowing that are only specific to that tab, and that's why there are specialized features in there."*
>
> **The model is inheritance: Clinical's core is the baseline, each pillar adds its own.** Nothing enforced that, and an audit found the drift — **Clinical's catalog holds 134 items, Volunteering 21, and Shadowing has no catalog at all.**
>
> **These rules previously lived at the bottom of `03-clinical-feature-catalog.md` under *"Universal rules applying to every row above."* Wrong home** — a rule governing seven pillars cannot live inside one of them. **Moved here. Do not copy them back into a tab file; reference this section.**

> ### ⚠️ MOVED AGAIN Aug 2026 → `general.md` § *The nine universal rules*
>
> **This was still the wrong home.** This file scopes itself to *"the five experience pillars"* — **and Academics and MCAT obey the same nine rules while being neither.** Both of their catalogs had independently written their own copy, which is how the error surfaced.
>
> **`general.md` is the app-wide home. The table below is retained so this file reads standalone; `general.md` is authoritative.**
>
> **What legitimately stays in this file:** the shared frame (§2), the three reads (§2a), the **`RM-1`–`RM-6` reflection mechanism** (§2b-ii), and the catalog template (§2c). **Those are genuinely experience-pillar-scoped.**

### The nine rules

| # | Rule | |
|---|---|---|
| **U-1** | **Every smart feature states its cause** and is dismissible. **None fires more than once per cycle** | |
| **U-2** | **Deterministic by default.** A feature needing an LLM is marked and **must degrade, never break** — the base logging path never depends on a key | |
| **U-3** | **Every nudge competes in the 3-per-week attention auction** (`01` §6.11) **and routes through the shell Attention model with a severity**, never rendering independently on the page | |
| **U-4** | **Probabilistic outputs render as intervals, never point estimates** (`01` §6.12) | |
| **U-5** | **Insufficient data → dormant with a reason.** Never a zero, never an empty chart (`01` §6.10-A) | |
| **U-6** | **Hours live in exactly one pillar.** Cross-links never double-count | |
| **U-7** | **HQ does not track non-events.** Rejected three times — shadowing asks (`S-7`), lost elections (`E-9`), declined event prospects (`EV-1`). **Reflection attaches to things that happened, never their absence** | **Added Aug 2026** |
| **U-8** | **HQ may decline to ASSERT. It may not WITHHOLD a capability.** Targets exist and default off; **HQ never suggests a number.** The line that overturned the sufficiency call, both target bans, and `You're free` | **Added Aug 2026** |
| **U-9** | **Nothing is scored, ranked, or compared** — not against a bar, not against other students, not against the student's own past. **No invented composites** (`01` §6.12) | **Added Aug 2026** |

**Also standing, from `03-clinical-feature-catalog.md` `R7`:** *stay current with real credential and scope standards* — **explicitly marked as applying to every pillar** and left in place there.

**Two more that reach beyond the experience pillars** and are recorded elsewhere, listed so a catalog author knows they exist: **text entry is a plain `input`/`textarea` with no dictation affordance** (`implementation/integration-map.md` §1) and **`PlaceLine` on every place-bearing record** (`07-campus-layer-board.md` §2e).

### What each pillar inherits versus owns

| | |
|---|---|
| **Inherited, not restated** | The nine rules · the shared frame (§2) · the three reads (§2a) · the record → ledger → writing sub-tab spine · `ContactCard`, `ExpandableEntryRow`, `InlineAddRow`, `PillarShell`, `MascotNote` |
| **Owned by the tab** | Its headline metric · what the ledger row *is* · every domain field · its own exclusions · **its specialised features, which are the reason the pillar exists separately** |

**Examples of correctly pillar-specific work, so the boundary is legible:** credentials and scope (Clinical) · the population served and standing-vs-one-day distinction (Volunteering) · the site-equals-contact-equals-verifier collapse (Shadowing) · the output pipeline and authorship (Research) · initiatives and `commitment` (Extracurriculars). **None of these belong here.**

## 2a-ii. `Discover` — what it is, and which pillars get it (RULED Andy, Aug 2026; **amended same month**)

> ### ⚠️ RE-AMENDED Aug 2026 — `Discover` is UNIVERSAL. Five pillars. (Andy)
>
> > *"Maybe Discover could actually be its own tab through all of them. **They just serve a different purpose.**"*
>
> **This is the third position on `Discover` in one month and the reversal is worth naming, because the reason is not the reason I originally gave.**
>
> | | |
> |---|---|
> | **My first proposal** | Universal, **argued structurally** — every pillar should have the same shape |
> | **Andy's rejection** | *"I never said Discover should be universal… it should really just be in ECs"* — **correct, because I had no content for the other four** |
> | **This ruling** | Universal, **argued from content** — each pillar names something real, external, and dated that a student cannot find |
>
> **The lesson holds and is not undone: the earlier rejection was right.** **A shape repeated across pillars with nothing to put in it is symmetry for its own sake.** **What changed is that the content was found**, pillar by pillar, and Andy's own clause is the governing one: **`Discover` is one tab that serves a different purpose in each pillar, not one tab copied five times.**
>
> #### What each pillar's `Discover` holds
>
> | Pillar | What it lists | Source |
> |---|---|---|
> | **Extracurriculars** | Clubs · campus events · **the map** | Heel Life · Localist |
> | **Research** | **Venues to present · grants · labs** | Conference CFPs · SURF/dept awards · **UNC OUR opportunities database** |
> | **Clinical** | **Paid clinical roles · scribe/EMT/CNA postings** | **See the sourcing note below** |
> | **Volunteering** | **Service orgs that are not health clubs** — closes `V-BIG-1` | Orange County / local orgs |
> | **Shadowing** | **Shadowing programmes · specialty coverage · nearby providers** | **UNC Health · NPPES/NPI Registry** |
>
> #### ✅ Shadowing gets one too — FIVE of five (Andy, Aug 2026)
>
> > *"For shadowing, it MIGHT be possible — **gets your location and looks at possible people that you can contact**, or provide any hospital/clinical directories. It's possible……."*
>
> **⚠️ My prior text said a Shadowing `Discover` would be *"a list nobody can publish."* That was wrong, and the error was conflating two different lists.**
>
> | | |
> |---|---|
> | **Publishable** | **Who practices near you** — name, specialty, address, phone. **The federal government already publishes this** |
> | **NOT publishable** | **Which of them accepts shadows.** **No source has this. It does not exist** |
>
> **`S-36` cut the second one and it stays cut.** **The first one is a real, sourced, buildable directory and I wrote it off by mistake.**
>
> ##### The source: NPPES / the NPI Registry
>
> **`npiregistry.cms.hhs.gov/api/?version=2.1`** — **CMS. Every licensed US provider. Free, public, documented as requiring no key.** Filterable by `city`, `state`, `taxonomy_description` (the specialty), `enumeration_type=NPI-1` (individuals, not organisations). Returns practice address and phone.
>
> **⚠️ Documented, NOT verified live** — the domain was blocked from the sandbox at time of writing. **Confirm the no-key claim and the CORS headers before speccing against it.** **CORS is the real risk: a static GitHub Pages bundle calls this from the browser or not at all.**
>
> ##### The three tiers, and they are not equally valuable
>
> | | | Why |
> |---|---|---|
> | **1 · Structured shadowing programmes** | **Highest value** | **UNC Health and most systems run them. Dated, real applications, and the thing a first-year has never heard of.** Same shape as Clinical's `C-BIG-1` — **source them in the same research pass** |
> | **2 · Specialty coverage** | **Solves the actual problem** | **The real premed gap is *"I have only shadowed primary care and I need a surgeon."*** **A directory filtered by specialty answers a question the student already has**, which is what separates a used tab from a visited-once tab |
> | **3 · Nearby providers (NPPES)** | **Useful, and the one to guard** | Cold-outreach targets. **`PlaceLine` applies — a practice address is a location** |
>
> ##### ⚠️ The guard tier 3 needs, and it is specific
>
> **HQ does not create the ability to cold-email a physician — a student can already find these people on Google.** **What HQ changes is friction, and that is exactly the risk.** **A directory with a send button hands two hundred premeds the same list of Chapel Hill family physicians**, and the cost lands on the physicians and on the collective reputation of the students who email them.
>
> **So: `Discover` shows who is nearby. It does not send, and it does not auto-fill a template.** **`U-10` already says this — manual first, AI is invoked and never assumed.** **The student writes the email.**
>
> **Also binding: `U-8`.** **HQ lists who practices nearby. It never suggests contacting a specific person.**
>
> #### ✅ RULED Aug 2026 — ONE `saved` FLAG. Nothing more. (Andy)
>
> **Option (b).** **`Discover` rows carry a boolean `saved`. That is the entire mechanism.**
>
> **⚠️ FORBIDDEN, and this list is exhaustive by intent:** **applied · not applied · rejected · accepted · waiting · date applied · follow-up due · response rate · rejection count · a pipeline column · a kanban · a status enum of any kind.** **Adding any one of them re-opens `S-36` and `U-7`, both of which were closed deliberately.**
>
> **Why (b) and not (a):** **a student who cannot bookmark a posting will open a browser tab instead — which is the tab losing.** **Saving is not a pipeline.**
>
> **Why (b) and not (c):** **"a tracker for paid roles only" is a status enum with a scope condition, and scope conditions erode.** **One rule for all five pillars.**
>
> **The line, stated so it survives a future reader:** **`saved` records INTEREST. It does not record PURSUIT.** **HQ knows you looked at it. HQ never knows whether you went for it, and `U-7` is why — an application with no reply is a non-event, and HQ does not track non-events.**
>
> ---
>
> #### ~~⚠️ OPEN — the guard is under pressure and Andy has not ruled~~ *(superseded by the ruling above; kept for the reasoning)*
>
> **This section says `Discover` is a resource, not a tracker: no rejection count, no application pipeline.** **That guard was written when `Discover` listed clubs and events, which you attend rather than apply to.**
>
> **Jobs, grants, and lab positions are things you APPLY to**, and a student looking at five postings will want to record which ones they sent. **That is an application tracker, which is the exact thing the guard forbids and `S-36` cut.**
>
> **Three ways out, unruled:** **(a)** hold the line — `Discover` lists, and applying is invisible to HQ; **(b)** allow a single `saved` flag and nothing more; **(c)** admit the tracker for paid roles only. **My lean is (b)** — **saving is not a pipeline, and a student who cannot even bookmark a posting will use a browser tab instead, which is the tab losing.**
>
> #### ⚠️ SOURCING — Indeed specifically is not buildable
>
> Andy: *"maybe job postings on Indeed, because I get emails about that all the time."*
>
> **Indeed has no self-service API.** **The Publisher Program closed to new publishers in Oct 2022 and the Publisher API was deprecated in 2024; no new keys are issued.** What remains is partner-only and gated behind an enterprise sales process. **Scraping is not an option for a static GitHub Pages bundle.**
>
> **The instinct is still right — the mechanism is wrong.** **Andy is not subscribed to Indeed's API; he is on listservs.** **The buildable version is the upstream source, not the aggregator:**
>
> | | |
> |---|---|
> | **Research** | **`our.unc.edu/find/opportunities/` — UNC's Office for Undergraduate Research already runs a searchable opportunities database.** **This is `D-4`'s content, officially maintained.** Verify whether it exposes a feed |
> | **Clinical / paid roles** | **UNC Handshake** is the university job board and where the emails originate. **Access model unverified — a research ask** |
> | **Fallback for all of them** | **A hand-built, cited, dated list**, same as Volunteering's org list. **Slower, always works, never breaks** |
>
> **⚠️ Do not write "pull from Indeed" into any spec.** **Recorded here so it is not re-proposed.**
>
> ---
>
> **⚠️ AMENDED Aug 2026 — `Discover` is Extracurriculars **and Research**.** Andy: *"I'd be open to learning more about **opportunities to present research and possible scholarships and research grants**… **I also think we could bring back the Discover tab just for that reason.**"*
>
> **The test below did not change; Research's answer to it did.** When `Discover` was pulled from Research the pillar had one outward-facing item (a lab directory) and a ruling that discovery is *"not the main point."* **Both are still true. What changed is that venues and grants were identified, and they are dated, external, and unfindable** — which is exactly what the tab is for.
>
> **Clinical, Volunteering, and Shadowing still do not get it.** **They record what you already hold**, and Shadowing's ask-pipeline was explicitly cut (`S-36`).
>
> **Research's `Discover` obeys every guard in this section unchanged — a resource, not a tracker.** See `tabs/06-research-feature-catalog.md` §7b-x.

> *"The Discover page is supposed to be synced to Heel Life, and also I think that's where maps live… That should be finding new opportunities, new clubs, and new things that are going on around campus, and that's the purpose of the tab anyway."*

**`Discover` is the campus-life surface.** **Clubs · campus events · the map.** It lives on Extracurriculars because that is where campus life lives, and **it exists nowhere else.**

| What it holds | |
|---|---|
| **The UNC organization directory** | `E-1` — 1,278+, not a curated 150 |
| **Campus events** | Heel Life RSS/iCal · the Localist API · photographed flyers and Instagram promos (`07-campus-layer-board.md` §2h) |
| **The map** | `PlaceLine` expanding into the Leaflet panel (§2e, §2g) |
| **Event prospecting** | `EV-1` – `EV-4` |

**All four sub-tab sets stand as originally ruled:**

| Clinical | Volunteering | Shadowing | Research | Extracurriculars |
|---|---|---|---|---|
| Sites · Shifts · Reflections | Orgs · Events · Reflections | Physicians · Visits · Reflections | Projects · Outputs · Lab notes · Reflections | Organizations · Initiatives · Reflections · **Discover** |

### ⚠️ A correction about how the last hour went

**An earlier version of this section made `Discover` universal. That was wrong twice over.**

1. **Andy answered a question about Clinical and Shadowing and I extended it to Volunteering, then wrote it up as a universal slot.** Over-reach.
2. **More importantly, the problem it was solving was one I had just created.** I proposed big-swings features for Clinical, Shadowing, and Volunteering, found they had nowhere to live, **and began reshaping the navigation around features Andy had not approved.** **That is backwards, and it produced two reversals in twenty minutes.**

> **Standing correction: do not move a ruled structure to accommodate an unapproved feature.** **Propose the feature, get a ruling, then ask where it lives.** A feature without a home is a parked idea; **a nav changed for a parked idea is churn that everyone downstream pays for.**

### The parked features

**Proposed Aug 2026, not ruled, no home. They stay in their catalogs marked `open` and nothing moves for them.**

| Pillar | Parked |
|---|---|
| **Clinical** | `C-BIG-1` application cycles · `C-BIG-2` first clinical job · `C-BIG-3` credential pathway |
| **Shadowing** | `S-BIG-1` programs not people · `S-BIG-2` what to do on the day · `S-BIG-3` cold email |
| **Volunteering** | `V-BIG-1` service beyond health · `V-BIG-2` the commitment you can keep |

**One exception: `RS-BIG-1`, the lab directory, is GREENLIT** (Andy, Aug 2026: *"1 I agree with"*). **It predates this and is not a parked idea** — it comes from `07-campus-layer-board.md` §5, which calls it *"the most important single feature in this document."* **It needs a home on Research, and that is a real question rather than a self-inflicted one.**

## 2b-ii. THE REFLECTION MECHANISM (LOCKED Aug 2026) — one mechanism, five pillars

> **Andy, Aug 2026:** *"Since it was designed, all of those features need to be carried across. Supposedly, if we had specced the reflection mechanism on Clinical, it should carry across all of the other ones that have that reflection mechanism."*
>
> **The audit that forced this** (`implementation/briefs/S12-cross-pillar-subtab-audit.md`): the writing surface holds **Clinical 4 · Shadowing 3 · Volunteering 1 · Research 1 · Extracurriculars 6.** ECs only reached 6 because a wave was added the same day. **The other four never received it.**
>
> **These are not five features. They are one mechanism configured five ways** — the same ruling `R-S2` already made for the unpacking marker: *"the mechanism should still be the same as Clinical. The wording is configured; the machinery is not forked."*

### `RM-1` · The moments HQ asks

**Today nothing in HQ ever asks for a reflection. Every writing surface exists and waits.** Each pillar has trigger moments already in its data and uses none of them.

| Pillar | Triggers |
|---|---|
| **Clinical** | A shift ends · a role ends · a credential renews |
| **Volunteering** | A service event finishes · a standing commitment ends · a one-time event gains a second session (`V-14`) |
| **Shadowing** | **A visit ends** — the strongest trigger in the app, because §2.6 already treats a visit with hours and no reflection as incomplete |
| **Research** | An output changes status · a project ends · an authorship conversation happens |
| **Extracurriculars** | An initiative completes · a role ends · a year boundary · an accepted event attended |

**Rules, identical everywhere: once per trigger · dismissible forever · never blocks the log · competes in the attention auction (`U-3`).**

### `RM-2` · A reflection is a conversation, not a text box

**Student writes → HQ responds to what they actually wrote → that provokes more → they write again.**

- **Sufficiency is shape, not length.** *A few lines of real expression, or a fleshed-out point or two.* **Never a word count, never a progress bar, never a completeness meter.**
- **The student ends it whenever they want.** HQ never withholds *done*, never asks a third time unprompted, **never marks a reflection incomplete.**
- **HQ's side is never recorded.** Re-open a reflection a year later and **you see only what you wrote.** This keeps Story Bank's boundary intact by construction and stops the drafter quoting HQ back at the student.
- **`●` requires an LLM, and degradation is designed:** no key → the pillar's prompt chips and a plain box. **Worse, not broken.**
- **The prompt copy is per-pillar and stays.** **Shadowing's *"what did you understand today that you didn't yesterday?"* is the best one in the app** and benefits from this most.

### `RM-3` · Search across your own writing

**One search field beside each pillar's existing filters.** Plain substring match over reflection bodies; results render as `ExpandableEntryRow` with the match highlighted.

**`○` deterministic — no index, no embeddings, no service.** **The same search Story Bank uses, scoped narrower.** **Clinical will accumulate more reflections than any other pillar and currently has no way to find one.**

### `RM-4` · Synthesis threads

**Several reflections the student groups themselves under one idea, rendered visually distinct from single entries.**

**Student-made, never auto-clustered** — an app deciding which of your memories belong together is the "deciding for the user" failure in its purest form.

**Already specced as mattering most on Shadowing** (#45b: *"what did you learn about medicine across six physicians and five specialties?"* — **the question the AMCAS entry actually needs answered**) **and it was thinner there than on ECs.**

### `RM-2a` · Depth without a gate — resolving Clinical `#45a`'s minimum (RULED Aug 2026)

**The conflict:** Clinical `#45a` cleared its marker only after a **2–3 exchange minimum**. `RM-2` says the student ends it whenever they want. **Both cannot be true.**

**Andy's intent, in his words:**

> *"The point of me setting that minimum was just to juice as much information out of the student and make sure that they're really trying to, because the idea is that the AI builds off of what they say. Anything they say could potentially spark more reflection… I just didn't know how to make it if I wanted to make a minimum, because when the student ends the thing whenever they want, they're at risk for not having a proper reflection. I do think that the back and forth is useful."*

**The minimum was conflating two different things:**

| | What it asks | Mechanism |
|---|---|---|
| **The marker** | *Have you engaged with this at all?* | **Clears on the first real exchange.** Binary |
| **The conversation** | *How deep did this go?* | **Never gated, never counted, never scored** |

> **RULED: the exchange minimum is CUT. The back-and-forth is kept and made the path of least resistance instead of a requirement.**

**Four mechanisms that produce depth without withholding *done*:**

1. **HQ's reply always ends with a question, and the question is the last thing on screen.** **Answering is the default motion; stopping takes a deliberate click.** No *"are you finished?"* prompt — that manufactures the gate in copy instead of code.
2. **HQ builds visibly on what the student wrote.** *"You mentioned the family twice"* pulls harder than *"tell me more."* **The incentive to continue is that the next question is good** — not that the door is locked.
3. **Nothing is ever labelled thin.** No length warning, no depth meter, no *"most students write more."* **`U-9`.**
4. **The thread never closes.** A student can return a week later and keep going. **A reflection is complete whenever they stop and still open whenever they come back** — which is the honest version of *"you might have more to say."*

**Why this is not a loss.** The minimum could force three exchanges; **it could not force three good ones.** A student who wants out types *"idk"* twice and clears the gate, and **the record is worse than an honest one-exchange reflection.** The pull has to come from the question being worth answering.

**Applies everywhere.** `#45a`'s minimum is removed from Clinical and no pillar reintroduces one.

### `RM-2b` · How it ends — two endings, two mechanics (RULED Aug 2026)

**Andy: *"How do I know when to stop with the reflection? I still wanna leave it up to the student, but when does it actually choose to stop?"***

**`RM-2a` said HQ always leaves a question open, which taken literally means it never stops.** **An AI that will not let go is worse than a gate** — by the ninth exchange the questions are filler, and the student learns the feature is a chore. **Both endings need defining.**

#### 1 · HQ stops by not asking

**While HQ has something worth asking, a question sits at the bottom of the screen. When it does not, its final message reflects back and ends.**

> *"That's the part — you noticed the family staying and Dr. Patel didn't mention it."*

**No question mark. No *"anything else?"* No completion state, no summary card, no "great reflection."** **The absence of a question is the ending.**

**This is HQ judging its own supply, never the student's answer.** *"I have nothing better to ask"* — **not** *"you have said enough,"* which would be `U-8` all over again in a softer voice.

**When HQ has run out:** it has already asked about the people, the decision, and what changed · the student is restating rather than adding · **or the honest next question would be generic.** **A generic question is worse than stopping** — it teaches the student the exchange is theatre.

#### 2 · The student stops whenever, and the exit says nothing about quality

- **Always visible, from the first exchange.** Never hidden behind an overflow, never disabled.
- **Labelled `Save`, not `Done`.** ***Done* implies a standard was met; *save* is neutral** and matches every other write in the app. **`04` §9: verb-first.**
- **The thread stays reopenable forever.** **Stopping is not a verdict either** — a student can return a week later and keep going, and `RM-1` will not re-trigger on something already touched.

#### 3 · The only limit in the system is on HQ

> **A ceiling of roughly 5–6 exchanges per sitting, even when HQ still has questions.**

**A reflection that runs twenty turns is an interrogation**, and the student will remember it that way and avoid the feature afterwards. **When the ceiling is reached HQ ends the same way it always does — by not asking** — and the thread stays open for another day.

**This is the exact inverse of the minimum `RM-2a` cut.** **The floor protected HQ's idea of a good reflection from the student. The ceiling protects the student from HQ.** Only the second is legitimate.

### `RM-5` · The headline on every writing surface (RULED Aug 2026)

**`14 threads · 9 shifts not yet unpacked`** — **Clinical #70's line, promoted to the standard.**

- **In the filter bar, never a badge.** A badge on a nav item is a demand; a count beside a filter is a fact.
- **The vocabulary is the pillar's** — shifts · events · visits · initiatives · outputs — **the shape is shared.**
- **It is a count, not a quota.** No target, no percentage, no *"you're behind on reflections."* **`U-8` and `U-9`** — HQ states what is unpacked and says nothing about whether that is enough.
- **Silent at zero.** A student with no reflections sees the empty state, not `0 threads`.

**Rejected alternatives, recorded:** *no headline at all* (the count is the one number that tells you whether work is waiting, and hiding it helps nobody) · *most recent reflection date* (a recency read here edges into the staleness alert already cut from Volunteering as #33).

### `RM-6` · Backfilled entries never carry a marker (RULED Aug 2026 · app-wide)

**An estimated backfill block — hours reconstructed from memory months later — gets no unpacking marker, on any pillar, ever.**

**Already true on Clinical and Volunteering** (*"estimated backfill blocks render hatched, carry no unpacking marker ever"*). **Now universal**, and it extends to Shadowing, Research, and Extracurriculars.

**The reason is not tidiness.** **You cannot reflect on a stretch you reconstructed from a rough estimate**, and asking would invite the student to invent a memory to fill the box. **A manufactured reflection is worse than none** — it enters Story Bank and gets drafted into an essay as if it were real.

**Backfilled entries also stay out of** pace, the median-gap baseline, the monthly bars, and `RM-5`'s outstanding count. **They are hours, and only hours.**

### The two-doors rule, restated because it governs all four

**One record set, two doors.** Story Bank aggregates every word the student writes; the pillar surface is the scoped view. **A filter, never a copy.** And **only what the student wrote** — not HQ's prompts, not imported bios, not Timeline notes.

### ⚠️ How to read a low row-count on an inheriting surface

> **Andy, Aug 2026:** *"Inherited mechanisms are similar. It's just that the AI kind of reads it as a separate section. It would take the same kind of backbone structure that's taken from another tab, but it integrates it into its own context."*

**A count of rows in a catalog measures pillar-SPECIFIC additions. It does not measure behaviour.**

| Pillar | `Reflections` rows | What is actually there |
|---|---|---|
| Extracurriculars | 6 | `RM-1`–`RM-6` **plus four ECs-specific items** |
| Clinical | 4 | `RM-1`–`RM-6` plus its own |
| Shadowing | 3 | `RM-1`–`RM-6` plus its own |
| **Volunteering** | **1** | **`RM-1`–`RM-6`, same as everyone.** The single row is its delta |

**Volunteering's `Reflections` is not one-sixth of Extracurriculars'. It is the same mechanism with one addition.**

> **This will look like a gap to anyone who counts, and it is not.** **The `S12` audit made exactly this mistake once** — it read row counts as design depth and flagged the entity tab as bloated when it was a labelling problem. **A count is a symptom, not a diagnosis.**
>
> **The question to ask instead: does this pillar need something the shared mechanism cannot express?** For `Reflections`, the answer on four of five pillars is **no** — the prompt copy and the trigger list are the only per-pillar parts, and both are supplied.

### Propagation status

| Pillar | `RM-1` | `RM-2` | `RM-3` | `RM-4` |
|---|---|---|---|---|
| Clinical | **owed** | **owed** | **owed** | has #45b |
| Volunteering | **owed** | **owed** | **owed** | **owed** |
| Shadowing | **owed** | **owed** | **owed** | has #45b |
| Research | **owed** | **owed** | **owed** | **owed** |
| Extracurriculars | `R-2` | `R-3` | `R-4` | `R-5` |

**Every `owed` cell is a catalog row that does not exist yet.** **They inherit from this section rather than being retyped** — a catalog cites `05` §2b-ii and adds only its own trigger list and prompt copy.

## 2c. THE CATALOG TEMPLATE — the format every pillar's catalog follows

**`03-clinical-feature-catalog.md` is the reference implementation.** It has three things no other catalog has, and all three should be standard:

| Section | Why it matters |
|---|---|
| **`Part 1 — Currently implemented`**, split **real and working** / **placeholder UI — looks built, isn't** / **specced but not built at all** | **The most useful section in any catalog and only Clinical has it.** The middle category is the dangerous one: surfaces that look finished and are not. **For six pillars, nobody knows.** |
| **A rulings block (`R1`…) that overrides the rows above** | Decisions that reversed earlier answers, **kept visible rather than edited into invisibility.** A row silently rewritten loses the reason |
| **Waves, numbered, with a `St` column** | `live` · `spec` · `board` · `open` · `cut`. **`cut` rows are kept with their reasoning so nothing is re-proposed** |

**Plus the columns already in use:** `Surface` · `Origin` (`core` inherited · `own` pillar-specific · `core*` inherited but altered) · `AI` (`○` deterministic · `◑` better with AI · `◐` degrades gracefully · `●` requires an LLM) · a one-line *what you see*.

### `Surface` must distinguish the list from the panel (LOCKED Aug 2026)

**The entity tab absorbs everything** — Clinical 33 rows, Extracurriculars 25, **58 of ~120 counted features on two surfaces.** Mostly legitimate: the entity tab holds both the list *and* the detail panel, and the panel is where depth belongs.

**But a row marked `Sites` might be a list-row element, a detail-panel module, or a nudge that fires on the page — and a mockup cannot be drawn from that.** Extracurriculars hit the wall immediately: *"the card carries seven things; what survives the squint test?"* **had no recorded answer, because nothing in the catalog said which rows were card content.**

> **Every entity-tab row is suffixed `(list)`, `(panel)`, or `(page)`.** `Sites (list)` · `Sites (panel)` · `Sites (page)` for something that fires on the surface rather than living in either. **Mechanical, cheap, and it is the difference between a catalog you can read and one you can draw from.**

**A catalog is finished when:** every row has a `St`, nothing sits at `board`, `Part 1` reflects the actual code, and **every `cut` row carries the sentence that killed it.**

## 3. Cross-tab flow

- Hours and impact totals feed **Overview** domain rows (`03-overview.md` §6.5).
- Every experience is source material for **Essays / Story Bank**, aggregates into **Profile/CV**, and supplies recommenders to **Letters**.
- **Hour ownership is governed by `03-clinical.md` §2.0**, not here: one record, one category, counted once. It lives in the Clinical file because that is where the boundary is argued.

## 4. Do not generalize

The point of the file. Everything above is a pointer. These are rules.

1. **Do not fork the builder.** Configure the existing component. See §1.
2. **Do not force hours onto Research or Extracurriculars.** Research leads with outputs and project stage. Extracurriculars leads with impact and leadership and shows **no hours at all** (`07` §2.1). This is the wrong metric, not a different emphasis.
3. **Never surface an hours-based warning on a pillar where hours are not the metric.** No stale-hours nudge on Research or Extracurriculars.
4. **Do not build decorative or metaphorical dashboards.** Pragmatic trackers only (`04` §0, §10). The "watering plants" direction was explicitly rejected.
5. **Do not re-store people or orgs per pillar.** Reference the shared entities.
6. **Do not add per-pillar detail to this file.** If it is true of one pillar, it belongs in that tab file. This rule is why the file rotted last time.

## 5. Acceptance criteria (frame-level only)

Domain criteria live in the tab files.

- [ ] Clinical, Volunteering, Shadowing, and Research render from **one component**, not four pages. Extracurriculars stays its own page.
- [ ] Every pillar leads with a **compact stat row**, with the **list as the visual hero**. No stat-square grid, no dominating progress ring.
- [ ] Experiences open in a **full-width inline workspace below the card grid**, carrying reflections and verification. People and orgs resolve to **shared entities**.
- [ ] Extracurriculars shows **no hours anywhere**, including in any shared surface it inherits.
- [ ] Verified in light and dark, desktop and mobile, keyboard-only, reduced-motion.

## 6. Resolved

1. The experience list defaults to **cards** on all five pillars. (Jul 2026)
2. Shadowing specialty breadth is a **count and list, not a chart**, at launch. (Jul 2026)
3. **Extracurriculars stays a separate page.** The instruction to fold it into the shared builder is withdrawn. (Aug 2026)
4. **This file stops carrying per-domain configuration.** The config table and per-pillar notes are deleted. Tab files are the source of truth. (Aug 2026)
5. **A selected experience card opens one full-width inline workspace beneath the grid.** The center-peek default is superseded for these five pillars only; the surrounding cards remain visible above the selected record. (Aug 2026)
