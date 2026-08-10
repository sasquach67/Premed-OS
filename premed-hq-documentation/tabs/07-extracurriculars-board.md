# Extracurriculars: the board before speccing

Companion to `tabs/07-extracurriculars.md`. **Reference index, not spec.** That file wins on any conflict.

## Why this board is unlike the other three

**Clinical, Volunteering, and Shadowing are ledgers.** They answer *how much, how recently, how consistently* — and their boards were mostly about which of Clinical's 73 features carry across.

**This pillar is not a ledger, and inheritance is the wrong frame for it.** Two facts make it structurally different before any feature is discussed:

1. **`04` bans centring hours here** — the strictest version of that rule in the app. **The thing every other pillar measures is the thing this one must not.**
2. **It does not use `ExperiencePillar.tsx`.** `Extracurriculars.tsx` is ~1,077 lines with its own organizations view, org workspace, initiatives view, open-loop detection, and application read. **There is no shared builder to configure** (`07` §2.1).

**And the existing spec is genuinely good** — 158 lines, org/role/initiative separated, progression as the metric, succession captured, most-meaningful surfaced. **It is not a scaffold.** What it lacks is the half Andy just described.

---

## 1. What Andy asked for that the spec does not have (Aug 2026)

*"The theme is still that same idea of making an impact, but it's different. It has other nuances… climbing the ranks year to year, showing commitment over time, helping individuals and being helped by individuals, forming that sense of community, being in clubs that give your application a sort of narrative."*

*"It's a little more grounded and a little more personal. You can make it more personal if you want. You can make it be you… It's not as black and white as the tracking-hours aspect. We can make the extracurricular section really special and a potential differentiator."*

**Measured against the current spec:**

| Andy's theme | In the spec? |
|---|---|
| Climbing the ranks year to year | **Partly.** Role progression exists (§2.2) but is dated, not year-framed → **E-5** |
| Commitment over time | **Yes.** Involvement span (§8) |
| **Helping and being helped by individuals** | **NO. Nothing.** The largest gap → **E-2** |
| **Sense of community** | **NO.** Nothing captures belonging as distinct from doing → **E-3** |
| **Clubs that give a narrative** | **NO.** Volunteering has a cause throughline; this pillar has none → **E-4** |
| More personal, "make it be you" | **NO**, and it is a register question before it is a feature → **E-6** |
| UNC-specific organizations | **NO.** Orgs are free text today → **E-1** |

**Four of seven are absent.** That is the work.

---

## 2. E-1 · A real organization directory, seeded from UNC

*"I think this should be tied to UNC organizations… although if it is a global platform I feel like it shouldn't be. I'm actually going to scratch that idea… For now let's just do UNC as a source."*

**The tension resolves cleanly, because the app is already UNC-only** (`CLAUDE.md`: *"a UNC-only premed dashboard"*). **The mistake to avoid is not "using UNC" — it is hardcoding UNC.**

**Ship it as a dataset, not as logic.** `data/unc-orgs.json`, exactly like `unc-requirements.json`: Category A, committed, human-reviewed, carrying the `freshness` block (`implementation/data-refresh.md`). **A second school is then a second file, not a rewrite.** This is the pattern `knowledge-sources.md` already prescribes — *"build against a `data/*.json` file, never a live URL."*

**What the directory buys, in order of value:**

1. **Type-to-find instead of type-to-create.** Same mechanism as Clinical's shared org directory (#54), and here it is **safe** — a student organization is an institution, not a person, so S-3's objection does not apply.
2. **Type comes free.** `academic | service | cultural | athletic | arts | professional | greek | employment` is a guess when typed and a fact when picked.
3. **It is quietly a discovery surface.** A student who does not know a club exists cannot join it. **But see the guard below.**

### 2a. Do not rebuild Heel Life — a curated subset plus a way out (Andy, Aug 2026)

*"I don't know how much work it would be to completely sync with Heel Life, because there are clubs and stuff that change… It shouldn't try to recreate Heel Life and the other website, but it should have easy access. It should try and know the information in it and use that to help the students."*

**He is right about the cost and the answer follows from it.** UNC has hundreds of registered organizations, they change every semester, and **a full mirror would be permanently stale and permanently expensive.**

| Approach | Verdict |
|---|---|
| **Full sync with Heel Life** | **No.** Stale within a term, and a maintenance burden with no owner |
| **Just a link out, no dataset** | **No.** Cheap, and helps nobody |
| **A curated subset + a prominent way out** | **Yes** |

**The curated subset is roughly 100–150 organizations, not all of them:** the ones pre-meds actually join, the large and long-lived ones, and anything with a health, service, or research angle. **Human-curated, Category A, committed to the repo, refreshed on `data-refresh.md`'s annual cadence** — the same treatment `unc-requirements.json` gets, and the same freshness block.

**And "easy access" is a real feature, not a fallback.** A prominent, well-designed link to Heel Life sits beside the picker: *"Not here? Browse all UNC organizations →"*. **HQ is the front door for the ones that matter and an honest signpost for the rest.**

**The LLM does not need a live feed to be useful.** It reasons over the committed subset. **That is exactly `knowledge-sources.md`'s build pattern** — *"build against a `data/*.json` file, never a live URL."*

### 2b. Recommendations: by interest, never by popularity (RULED Aug 2026 — correcting my own guard)

*"It should still be recommended based on whatever interests, whatever things they have going on, whatever may be trending… Suggestions like 'hey, you should join this club if you haven't already,' or 'most pre-meds join this club, this might be good for you.'"*

**My original guard said "never rank or recommend organizations." That was too broad and I withdraw it.** Recommending a club from someone's stated interests is low-stakes and useful — it is not the app having an opinion about their life, it is a filter with a friendly label.

**But one of Andy's two examples has to be cut, and the reason is this pillar's own premise.**

| Example | Verdict |
|---|---|
| *"You seem interested in health policy — there are three orgs here doing that"* | **Yes.** Interest and fit. **Low stakes, genuinely helpful** |
| *"Most pre-meds join this club"* | **No — and it is self-defeating.** |

**Why the popularity signal has to go.** §2.4 and Andy's own framing say this pillar is where an application **stops sounding like a checklist and starts sounding like a person**, and that ECs are *"a potential differentiator."* **A recommendation that says "most pre-meds join this" pushes every pre-med into the same handful of clubs — which destroys the differentiation the pillar exists to create.** It is also the exact dynamic that makes pre-med activity sections read identically to admissions committees.

**So: recommend by interest, by what the student already does, and by what is new or active on campus. Never by how many pre-meds are in it.**

**Other guards:**

- **Free text always works.** An unlisted org, an off-campus one, a job, a family responsibility — **all add in one step with no friction.** §2.4's whole point is that unconventional activities are undervalued, and a picker that fights them makes that worse.
- **`isMedicineAdjacent` never orders the list** (§2.4, standing). **A recommendation engine that quietly floats medicine-adjacent clubs is that ranking by the back door.**
- **Suggestions are dismissible and compete in the 3-per-week attention auction** (`01` §6.11). **A club suggestion is not urgent and must never behave as if it is.**
- **`◐` — degrades gracefully.** Without a key: browse and filter the directory by type and interest tag. With one: *"three orgs match what you already do."* **The directory works fully with no AI.**
- **Do not scrape Heel Life or the Daily Tar Heel.** They are sources to build the dataset from, human-reviewed, cited, dated.

### 2c. How HQ learns interests: from use, never from a questionnaire (RULED Aug 2026)

*"HQ is supposed to gather data based on what you put in and not what it directly asks you. If you know a lot about your personality based on how you reflect, the AI in HQ should try and get as much user input as it can just by the user interacting with the app itself… to gauge a person's interests in their About Me kind of section."*

**Ruled: inference only. No interest questionnaire, at onboarding or anywhere.** The material already exists — reflections, initiatives, org types, what a student writes about repeatedly — and **a signup survey nobody fills in is worse than no recommendations at all.**

**This is app-wide and must not be built here (CONFIRMED, Andy Aug 2026).** *"Personality reads are supposed to be an app-wide thing. Everything where I input information or I put stuff, put anything, does that read there."*

**Read the scope literally: every input, not just reflections.** Org types joined, populations served, specialties observed, cause areas, what a student names an initiative, the questions they write down, which pillars they actually use. **Free text is the richest input, not the only one.**

**It belongs to Profile/CV** (`tabs/12-profile-cv.md`, currently an 80-line scaffold). **This pillar is one input and one consumer, nothing more. Do not implement a second personality read inside `Extracurriculars.tsx`** — a per-pillar version would drift from the app-wide one immediately, and two reads of the same person disagreeing is worse than none.

> **Recorded for whoever specs Profile/CV:** this is now a **named dependency of Extracurriculars' org recommendations** (§2b). Recommendations degrade to the deterministic floor — org types, causes, populations already in the record — until the app-wide read exists. **They do not block on it.**

**The rule that keeps it honest — and it is the same trap E-4 avoids.** Deriving *"you are a teacher"* from six reflections is the app telling someone who they are on thin evidence.

> **It is a mirror, not a verdict.**
>
> - **Show the student their own words back**, with the count and the source: *"teaching comes up in 6 of your 9 reflections"* — **and let them click through to those six.**
> - **Never a personality label, a type, or an adjective HQ chose.** No *"you're a builder."*
> - **Every observation is traceable to the records that produced it** (`01` §6.14: claims phrased by their evidence).
> - **The student can dismiss or correct any of it, permanently.**
> - **Dormant with a reason when the record is thin** (`01` §6.10-A) — a first-year with two reflections gets nothing, and is told why rather than shown a guess.

**For recommendations specifically, the deterministic floor works with no AI at all:** org types already joined, populations served, cause areas, specialties observed. **`◐`** — the LLM makes it better by reading free text, and its absence costs nuance, not function.

---

## 3. E-2 · Mentorship runs both ways — the largest gap

*"Helping individuals and being helped by individuals."*

**No pillar in the app models this, and this is the only pillar where it is the main event.** Clinical has supervisors — authority. Shadowing has physicians — observation. Volunteering has verifiers — administration. **Extracurriculars is where a student is developed by someone a year older and then develops someone a year younger**, and that reciprocity *is* the club experience.

**Why it earns a field rather than living in free text:**

- **It is the interview question.** *"Tell me about a time you developed someone."* A student who cannot name that person answers badly.
- **It is the best letter source on this pillar.** An advisor who watched you grow across three years knows you better than a supervisor who signed your hours. **`Person` already exists globally; this is a relationship, not a new entity.**
- **It closes a loop the spec half-opened.** `Initiative.successorId` already exists — **and a successor is usually someone you mentored.** The field is a special case of a relationship that is not modelled.

**Shape: two lists on an `Organization` or `Role`, both `Person` references.**

| | |
|---|---|
| **People I mentored** | Names, optionally what they went on to do. **This is the succession story in human form** |
| **People who mentored me** | Names, optionally what they taught you. **Feeds Letters as candidates** |

**Guards:**

- **Optional, never nudged.** A student who was in a club and mentored nobody has a complete record. **No "you haven't recorded a mentor" prompt** — that would be the app asking about someone's friendships.
- **No count, no score, no "mentorship depth."** Names and a line, nothing derived.
- **Never cross-user.** Same rule as S-3: another student's name in your record is your note, not a shared graph.

---

## 4. E-3 · Belonging is not doing — and the reflection prompts should say so

*"Forming that sense of community."*

**Every pillar's reflection prompt asks about the work.** Clinical: *what did you see*. Shadowing: *what did you understand*. Volunteering: *why does this matter*. **All three are about the activity.**

**On this pillar the people are the activity.** A student's four years in an a cappella group are not four years of singing — they are four years of those specific people. **And that is exactly the material that goes uncaptured**, because the app never asks for it.

**So this is a copy ruling before it is a feature: Extracurriculars' prompt chips are about people, not impact.**

- *"Who were these people to you?"*
- *"What did this group make possible that you couldn't do alone?"*
- *"Who did you meet here that you'd still call?"*

**The mechanism is Clinical's #45 chips, configured** — **not a second reflection system.** Same component, different vocabulary, exactly as Shadowing's insight prompt was configured rather than forked.

**Guard:** these prompts are **offered, never required**, and there is no "belonging" field, score, or read. **The moment community becomes a metric it stops being community.**

---

## 5. ~~E-4 · The throughline sentence~~ — CUT (Andy, Aug 2026)

**Andy, after three attempts to explain it: *"just cut the throughline."***

**The repeated non-landing was the signal, and it was not a comprehension problem.** Stripped of framing, E-4 was **one text box whose entire payoff arrives two to three years later** — no data behind it, no derivation, nothing to integrate. **A prompt with a field attached.**

**And the job it was meant to do is covered better elsewhere:**

- **The personality read** (Profile/CV, §2c) shows a student their own patterns **from real evidence**, rather than asking them to summarise themselves in a box.
- **The writing assistant** (E-21 → `05-experience-pillar.md`) helps **at the moment of writing**, which is the only moment the throughline was ever for.

**If the effect is ever wanted, it is a `MascotNote` on Reflections — *"what do these have in common?"* — and never a stored field.**

**The original reasoning is preserved below**, because the argument it made about *deriving versus naming* is still correct and still governs the personality read.

### Superseded: the narrative is the student's to name, not HQ's to derive

*"Being in clubs that kind of give your application a sort of narrative."*

**Volunteering has a cause throughline** (V-4) — service records genuinely share a cause. **Extracurricular records usually do not.** Debate, a food pantry, and an a cappella group have no cause in common.

**But they can share a character**, and *that* is the narrative: *"I build things with people"* · *"I translate between groups who don't talk"* · *"I keep showing up for the unglamorous part."*

**Two ways to get it, and only one is right here.**

| | |
|---|---|
| **Derive it** (V-10's archetype approach) | **NO.** Deriving a person's character from their club list is the app telling a student who they are. V-10 works because it derives an *activity* archetype from what you did. **A character throughline is not the app's to guess** |
| **Let them name it** | **YES.** One free-text line: *"what ties these together?"* |

**This is the single most direct expression of "make it be you."** The student writes one sentence about their own record, and it becomes the spine of the activities section of their application.

**Where it renders:** at the top of the pillar, above the organizations. **Empty by default, never prompted more than once, and editable forever.** A student who does not want one has a complete record.

**Optional `◑` assist, and the boundary matters:** with a key, HQ may **show the student their own material back** — the initiatives, the roles, the reflection lines — as raw input for writing that sentence. **It never drafts the sentence.**

---

## 6. E-5 · Progression is an academic-year story, not a date range

*"Climbing the ranks, maybe from year to year."*

The spec models roles as dated records with `startDate`/`endDate` (§4). **Correct as data, wrong as display.** Students do not think *"Mar 2025 – Feb 2026."* They think **sophomore year**.

**And club terms genuinely run on the academic calendar** — elections in spring, terms starting in fall. **A date range obscures an arc that a year label makes obvious:**

> `First year` member · `Sophomore` committee chair · `Junior` VP · `Senior` president

**Deterministic `○`** — the Profile already carries `startTerm`, so mapping a date to an academic year is arithmetic. **Store dates, display years.**

---

## 7. E-6 · The register — what actually makes this pillar special

**Andy's strongest line, and it is a design instruction rather than a feature:** *"It's a little more grounded and a little more personal. You can make it be you."*

**Every other pillar is a ledger that exports to AMCAS. This one should read like something a student would open when they are not working on their application.**

**What that means concretely:**

- **The stat strip must not lead with counts.** `4 organizations · 7 initiatives` is a ledger header. **The lead should be the throughline sentence (E-4) if one exists**, with counts secondary.
- **Empty states name non-medical examples first** — a job, a team, an instrument (§11, already correct and worth protecting).
- **Prompt vocabulary is about people** (E-3).
- **Nothing on this pillar is ever scored, ranked, or compared.** No leadership score, no impact score — already `04`-banned as invented composites, and here it would also be tasteless.

**One idea raised and flagged rather than recommended: images.** A team photo or an event poster would do more for "this is mine" than any field. **But `deferred.md` S0 is the highest-severity item in the project — localStorage has a hard quota and a silently-failing write — and images are the fastest way to hit it.** **Do not build this until S0 is fixed**, and even then only via object URLs or an external link, never base64 in the store.

---

## 7z. The brainstorm, in waves (Aug 2026)

**Format at Andy's request:** waves to walk as a checklist. Each item is `E-n`, with what it is, why it earns a place, and its AI marker. **Nothing here is ruled** — this is the menu.

**Two standards I would add rather than just meeting the existing ones**, flagged because Andy invited it (*"you can make new standards"*):

> **STANDARD A — WITHDRAWN AND REPLACED. It was built on a misreading (Aug 2026).**
>
> **What I wrote:** *"`04` bans hours here, so cadence must replace them."* **Andy:** *"Showing numbers is fine, so I don't know why you're trying to inhibit data."*
>
> **He was right, and the rule is narrower than I treated it.** `07` §2.1 bans hours as **a headline metric, a goal, or a projection**. It never said store or hide them — and it could not have, because **AMCAS requires them.**
>
> **So cadence is an addition, not a substitute.** *"Two meetings a week for three years"* and *"312 hours"* are different facts — rhythm and duration versus volume. Both true, both worth keeping. **I invented a replacement for something that was never removed.**
>
> **The surviving general rule is still worth having, just applied honestly:** *when a spec forbids a signal, check whether it actually forbade it before designing around the ban.*

### STANDARD A′ · Hours on Extracurriculars — RULED (Andy, Aug 2026, AMCAS-verified)

**The AMCAS fact, checked rather than assumed** ([2026 Work and Activities Guide](https://students-residents.aamc.org/media/13376/download)):

- **Every Work & Activities entry takes a total-hours figure.** Hours are **required**, not optional — *"applicants are asked to enter their best approximation of total hours spent on each activity."*
- **`Completed Hours` and `Anticipated Hours` are separate fields**, which matches `03-clinical.md` §7b.
- **15 entries, 3 most meaningful** — both confirmed.

> ✅ **RESOLVED Aug 2026 — there was no discrepancy, and the flag was my error.** I read a search summary saying *"three date intervals"* as contradicting `03-clinical.md`'s *"four."* **`03-clinical.md` §7b already said "up to 3 **additional** date ranges… four maximum per entry"** — the two figures describe the same rule from different ends. **1 primary + 3 additional = 4 total.**
>
> **Worth keeping as a note on method:** the flag was raised against a section marked VERIFIED **without re-reading that section**. Comparing a search summary to my memory of a spec, rather than to the spec, is how a correct document gets called into question. **Check the source before flagging the source.**

**So hours are tracked here. The rulings, per Andy:**

| | |
|---|---|
| **Tracked** | **Always.** AMCAS requires the number; a student who cannot produce it at application time is stuck |
| **In the stat strip / as the hero** | **No.** *"Just don't make it as a display."* Hours do not distinguish anyone in ECs — everyone in the club has similar hours, and what differs is what they did |
| **Visible on the record** | **Yes**, in the org and role detail. Available whenever the student wants it |
| **Weekly / monthly commitment** | **Yes, as a read the student can ask for.** Andy: *"a student obviously wants to know what amount of time they devote to this club in a given week."* **Answered on request, not pushed** |
| **Proactive surfacing** | **Only at pre-cycle**, when the AMCAS entry actually needs the figure. **Not a weekly "you logged 4 hours" notification** — that is the accumulation pressure this pillar exists without |
| **Target and pace projection** | **RULED: no. See §A″ — and the reason is not the one I had.** |

### STANDARD A″ · Hours here are a byproduct, not an activity (RULED, Andy Aug 2026)

**This is the pillar's number philosophy, and it is genuinely different from the other four.**

*"The format is not like you're logging an activity per se — it's just something that naturally happens. There should still be an hours thing where it shows your commitment, your consistency, the amount of hours you've spent being a part of meetings, organization, anything related to the club. It just shouldn't be something that you're aiming for. It's not something you should be striving to get hours for."*

**The distinction, stated once so it can be reasoned from:**

| | Hours are… |
|---|---|
| **Clinical · Volunteering · Shadowing** | **the record of a discrete act.** You went somewhere, did a thing for six hours, logged it. **The hour is the unit of the activity** |
| **Extracurriculars** | **the residue of belonging.** You did not do a two-hour thing — **you are in the club, and being in it takes time.** The hour measures something that was happening anyway |

**This is a better argument against targets than the one I was making.** I said hours are the weakest signal, so aiming at them is aiming at the wrong number — **which is still HQ having an opinion about what a student should want**, and Andy rightly objected to that shape of reasoning on Shadowing.

> **My argument was: you cannot aim at a byproduct.** A target needs something you can decide to do more of, and there is no *"do three more hours of club"* available — you can run for office, start an initiative, show up on Thursday. The activity is not hour-shaped.
>
> **Andy overruled it, and the reasoning generalises beyond this pillar. See the standing principle below.**

> ## STANDING PRINCIPLE (app-wide, RULED Andy Aug 2026): free reign
>
> *"I did say that Premed OS was going to be a kind of free reign for students to do whatever they choose with the app. Just like how they can choose to see where they are with things, students should still be able to choose their hours target, as well as get a pace projection because they've chosen an hours target. For me, I would not really choose to have an hours target, but I think it wouldn't hurt to still have one."*
>
> **The line, and it separates two things that both feel like restraint:**
>
> | | |
> |---|---|
> | **HQ may decline to ASSERT** | *"40 hours is enough shadowing."* *"You are done."* *"You need 150 clinical hours."* **Claims HQ cannot source and has no standing to make** |
> | **HQ may NOT WITHHOLD a capability** | *"You cannot set a target here because hours are a weak signal."* **That is deciding what a student should want** |
>
> **Both look like discipline. Only the first one is.** The second is the app substituting its judgment for the user's, dressed up as principle.
>
> **This is the third time it has happened**, and each time the justification was better-argued than the last:
>
> | | The rule I built | Why it was wrong |
> |---|---|---|
> | **Shadowing sufficiency call** | HQ announces you have enough and stops nudging | *"Why are you trying to put caps?"* |
> | **Shadowing target ban** | No targets, because the end state is *stop* | Premise deleted with the sufficiency call |
> | **Extracurriculars target ban** | No targets, because hours are a byproduct you cannot aim at | **Coherent, and still not my call** |
>
> **My "byproduct" argument was good reasoning toward a conclusion I had no standing to reach.** A student who wants to aim at 200 hours of club involvement means *"I want to be more involved"* — **that is a coherent thing to want**, and my thinking it an odd proxy does not make it my decision.
>
> **Applies everywhere. When a rule denies a student an option "for their own good," it is wrong by default and needs an unusually strong reason to survive.**

### What this means here

- **Targets and pace projection are available on Extracurriculars**, using `03-clinical.md` §7a's apparatus unchanged: **no target on day one, never pre-filled, always labelled `Your target`, optional forever.**
- **The default is off, and the byproduct observation is why** — most students will not want one here, because there is no obvious lever. **That makes it a sensible default, not a prohibition.**
- **HQ still never suggests a number.** Free reign is about the student's choice, not about HQ acquiring an opinion it could not source before.
- **Hours still do not lead the page** (Standard A′). **Available and aimable-at is not the same as centred.**

### What this means for the logging model — and it removes work rather than adding it

**Nobody logs a one-hour club meeting.** A per-session ledger would be both tedious and never used, and **it is the wrong shape anyway** given the above.

**So hours are derived, not logged:**

1. **The student enters cadence** (E-7) — *"two meetings a week, about 1.5 hours each, September to May."*
2. **HQ derives the total** from cadence × span. **This is exactly the arithmetic students already do by hand at AMCAS time**, and doing it wrong from memory is how hour figures get inflated.
3. **The student can override the total at any point**, and the override wins permanently.
4. **One-off spikes are added separately** — a weekend conference, a 12-hour event — because those genuinely are discrete acts and do not fit a weekly rhythm.

**This makes E-7 the input rather than a nice-to-have.** Cadence is what you enter; **hours are what falls out.** And it means the AMCAS number is defensible — *"two meetings a week for three years"* is a story a student can stand behind at an interview in a way *"312"* from memory is not.

**Consequence for the acceptance criteria:** `07` §15's *"no hours stat anywhere"* is **too strong and needs revising.** The correct rules are **no hours goal, no hours projection, no hours in the stat strip, and no hours chart as a hero** — but the number itself is present, derived, and available.
>
> **STANDARD B — record the learning, not the failure. (REVISED after Andy's pushback, Aug 2026.)**
>
> **My first version said "the app only records what worked, so capture failures."** Andy rejected the failure half and kept the learning half: *"I think it's good to consider what you could do differently — the house with troubleshooting and eventually growth… but [a lost position] just presents failure with no meaning or anything for me to learn from. It's just there."*
>
> **He is right, and the distinction is the whole standard.** *"The fundraiser flopped and here is what I would change"* is growth. *"I ran for president and lost"* is a record of an absence. **The first has a lesson attached; the second is a scar the app made you keep.**
>
> **So: HQ captures reflection on things that happened. It never captures the thing that did not happen.**

> ### STANDING RULE (app-wide, Aug 2026): HQ does not track non-events
>
> **This has now come up twice and been rejected both times for the same reason.**
>
> | Proposed | Rejected because |
> |---|---|
> | **S-7** — track asking physicians to shadow, including declines | *"It only needs to track positions that I already have"* |
> | **E-9** — track elections you ran in and lost | *"I don't know what kind of story would come from me losing a position… it kind of fits the same vibe as trying to email a physician and them not responding. It presents failure with no meaning or anything to learn from."* |
>
> **The rule: a record whose content is an absence — an unanswered email, a lost election, a club you did not join — carries no lesson and simply sits there as evidence of failure.**
>
> **The test that keeps it clean:** *did something happen that you can reflect on?* An initiative that went badly **happened** — E-14 applies. Not being elected **did not happen** — nothing applies. **Reflection attaches to events, never to their absence.**
>
> **Belongs in `general.md` or `01` when someone next touches them.** Recorded here because this is where it was named.

---

### Wave 1 · The record — what the entity model is missing

- [ ] **E-7 · Cadence, alongside hours** `○` **(REVISED — it is an addition, not a replacement)**
  *"Two meetings a week plus an event a month, for three years."* **Rhythm and duration, which a total-hours figure cannot express.** Stored per role, beside the hours rather than instead of them (Standard A′).

- [ ] **E-18 · Impact figures in the student's own units** `○` **(Andy, Aug 2026)**
  *"There are a lot of ways to show impact numerically — number of donations raised, how many patients you've helped."*

  **He is right that `reach` is too narrow.** `Initiative.reach` today means *people affected*, and that is one unit among many: **dollars raised, meals served, students tutored, events run, pounds collected, attendees.**

  **Shape: `number` + `unit` + `what`**, as one repeatable line per initiative. *"$4,200 raised for the clinic."* *"1,200 meals packed."* *"60 students tutored."*

  - **Free-form units, not an enum.** No fixed list survives contact with real clubs, and an "other" bucket would swallow most of them.
  - **This is the numeric impact Andy wanted, and it is a far better number than hours** — *"$4,200 raised"* says something *"312 hours"* never will.
  - **The student asserts it; HQ never computes or verifies it.**

  **Guards:** **never summed** — you cannot add dollars to meals — **never compared across initiatives or students, never ranked, never scored.** An initiative with no figure is complete; most will have none, and plenty of real impact is not countable at all.

- [ ] **E-8 · What the organization could do when you left that it couldn't when you arrived** `○` **(EXPANDED — Andy, Aug 2026)**
  *"For E-8 I think you can expand on that a little bit, more than just numbers. The development of a club or an organization definitely does happen. It's more than numbers."*

  **He is right — my version was a membership counter.** *"12 members → 40"* is one narrow slice of how an organization actually develops, and for plenty of clubs it is not even the interesting one.

  **The reframe: capability, not headcount.** The question is **what the org can do now that it couldn't before you** — and that lands the same way for a club that stayed the same size but became something different.

  | Dimension | Example |
  |---|---|
  | **Size** | *"12 active members → 40"* — kept, just no longer the whole feature |
  | **What it does** | *"One event a year → four, plus a mentorship program"* |
  | **Structure** | *"No committees → three, with a real officer pipeline"* |
  | **Standing** | *"Unrecognised → chartered, with a budget line"* |
  | **Reach** | *"Only our department → four departments and two other schools"* |
  | **Continuity** | *"No handover at all → a written transition doc still in use"* |

  **Shape: a before/after on the organization, freeform, with optional numbers where they fit.** Not a form with six required fields — **one or two of these will matter per org and the rest will be blank.**

  **How it differs from `Initiative`, since they will be confused:** an initiative is **a thing you did**; this is **what the org became.** Founding a mentorship program is an initiative; *"we now run programs, which we never did before"* is development. **They pair — the initiative is the evidence for the claim.**

  **Guard:** never scored, never compared across orgs, and **an org that stayed exactly the same is a complete record.** Plenty of good club experiences change nothing structural, and a blank here must never read as a gap.

- [ ] ~~**E-9 · Elections, including the ones you lost**~~ **CUT (Andy, Aug 2026)**
  *"I don't know what kind of story would come from me losing a position… it kind of fits the same vibe as trying to email a physician in shadowing and them not responding. It kind of just presents failure with no meaning or anything for me to learn from. It's just there."*
  **This is the second time the same idea has been rejected** — see the standing rule above. **HQ does not track non-events.** *(A won election is simply a role, which the model already holds.)*

- [ ] **E-10 · Founding gets its own treatment** `○`
  `founder` exists in the `level` enum and that undersells it. **A founder has no predecessor, no template, and no handover to inherit** — and the survival question (`survivedHandoff`) is sharpest for them. Worth a distinct shape, not one value in a dropdown.

### Wave 2 · People and community

- [ ] **E-2 · Mentorship, both directions** `○` *(already on this board, §3)*
  **The largest gap.** People you mentored, people who mentored you. **No pillar in the app models reciprocity, and this is the only one where it is the main event.**

- [ ] **E-11 · The team you built** `○`
  Distinct from mentorship: **who you recruited, appointed, or brought in.** *"I found the person who replaced me"* is a different claim from *"I mentored someone."* Feeds succession, feeds Letters, and it is the concrete form of "sense of community."

- [ ] **E-3 · Prompts about people, not impact** `○` *(already on this board, §4)*
  Every pillar's reflection asks about the work. **Here the people are the work.**

### Wave 3 · The four-year arc

- [ ] **E-5 · Progression shown by academic year** `○` *(already on this board, §6)*
  Store dates, display *"sophomore year, committee chair."*

- [ ] **E-12 · Year in review** `◐`
  **At the end of each academic year, one retrospective across everything** — roles gained, initiatives finished, people met. **Fits the year framing of E-5, fits the personal register of E-6, and it is a natural writing moment** rather than an invented one. **Once a year, dismissible, never a report card** — no scores, no comparison to last year.

### Wave 4 · Growth (Standard B)

- [ ] ~~**E-13 · What went wrong**~~ **CUT — E-14 replaces it entirely (Andy, Aug 2026)**
  I proposed both and asked whether one should absorb the other. **It should.** A field named for failure invites a student to catalogue failures; **the material a medical school interview actually wants is the reflection, not the wreckage.** E-14 gets the same substance and asks a better question.

- [x] **E-14 · What you would do differently** `◐` **— KEPT (Andy, Aug 2026)**
  *"I think it's good to consider what you could do differently: the house with troubleshooting and eventually growth, but it also does aid in the inspection process."*

  **One optional line beside a completed initiative or a finished role.** *"Anything you'd do differently?"*

  - **Nothing has to have gone wrong.** The best answers usually come from things that worked and could have worked better — which is exactly why the failure framing was the wrong door.
  - **It is genuine interview material.** *"Tell me about something you'd approach differently"* is asked constantly, and students arrive with nothing recorded and improvise badly.
  - **It is the troubleshooting habit** Andy named — the thing that turns running a club into learning to run a club.

  **Guards:** **never nudged, never counted, never a metric, never surfaced in any read.** HQ must not ask a student to produce shortcomings on demand. **Offered once beside a completed thing, and silent otherwise.** A record with none of these is complete.

### Wave 5 · Campus and discovery

- [ ] **E-1 · UNC organization directory** `○` *(already on this board, §2)*
  Curated subset, Category A, link out to Heel Life for the rest.

- [ ] **E-2b · Recommendations by interest, never popularity** `◐` *(already on this board, §2b)*

- [ ] **E-15 · When elections actually happen** `○`
  Most clubs elect in spring, terms start in fall. **A student who does not know their org's cycle misses the window entirely** — and the app already owns a roadmap that could carry it. **Per-org, student-entered, optional.** *Do not scrape or assume a calendar.*

### Wave 6 · The application

- [ ] **E-16 · Descriptions drafted from real material** `◑`
  AMCAS gives 700 characters per activity. **Students write them from memory in one sitting at the deadline** — after three years of material sat unused in this app. **The material is already here: initiatives, reflections, roles, what changed.** HQ assembles the raw pieces; **the student writes.** `◑` because the assembly is deterministic and the drafting help is the AI half.

- [ ] **E-17 · Repeated activities and date ranges** `○`
  AMCAS supports a `Repeated` flag with up to four date ranges (`03-clinical.md` §7b, verified). **A club you were in freshman year, left, and rejoined as a senior is exactly that shape** — and it is common in ECs specifically.

### Wave 7 · The nitty-gritty (Aug 2026)

- [ ] **E-19 · Honors, awards, and selective admission** `○`
  **AMCAS has a whole activity type called `Honors/Awards/Recognitions`, and this app has nowhere to put one.** Not an org, not a role, not an initiative — **a dean's list, a research prize, a scholarship, being named an All-American has no home in the data model at all.**

  **And the most underused version of it is selectivity:** *"selected from 200 applicants,"* *"one of 12 admitted to the program."* **That number says more about an activity in six words than a paragraph of description does**, and students almost never record it because nobody asked.

  **Shape:** `title` · `awarded by` · `date` · optional `selectivity` (*"12 of 200"*) · optional link to whatever produced it.

  **Where it lives — RULED Aug 2026.** Andy: *"I was thinking of where the proper home is, because I feel like it's too hidden if it's nested in one tab. The second appropriate option would be Profile and CV, but I'm not too sure."*

  **Neither, exactly — both, via the pattern this app already uses.**

  | | |
  |---|---|
  | **An award attaches to whatever earned it** | A research prize → the project. A leadership award → the org. Dean's list, a scholarship → **the profile, attached to nothing** |
  | **Profile/CV aggregates every award in one place** | That is the surface where you see them all, and where the AMCAS `Honors/Awards/Recognitions` export is built |

  **This is `one record, two doors` again** — Story Bank and pillar reflections, exactly. **You record it where you earned it, because that is where you are standing when you remember it. You see them all on Profile.**

  **Precedent already exists in the model:** `03-clinical.md` §4 says a `Certification` belongs to *"an Experience **or the profile**"* — **including the orphan case**, which is what a scholarship needs. Same shape, already solved once.

  **Why not nest it in ECs alone:** Andy is right that it is too hidden, **and it is also wrong** — a research prize is not an extracurricular. **Why not Profile alone:** Profile/CV is not even a sidebar tab (shell §2.2, reached from the account popup), so it is *more* hidden, and it would mean recording an award somewhere other than where you were working when you got it.

- [ ] **E-20 · The role model is club-shaped and fails half the pillar** `○`
  `Role.level` is `member | committee | officer | executive | founder`. **That is a student-government vocabulary**, and §2.4 says the activities students most undervalue are **athletics, music, employment, and cultural organizations** — precisely the ones this enum cannot describe.

  | Real role | Where it lands today |
  |---|---|
  | Team captain | `officer`? `executive`? Neither |
  | Drum major, section leader, concertmaster | Nothing fits |
  | TA, RA, tutor, peer mentor | `member` |
  | Editor, producer, director | Nothing fits |
  | Shift lead → assistant manager | `committee`? |

  **The fix is not more enum values — it is a second axis.** Andy: *"it should capture every single possible thing that I could be a part of. There are only so many, so I'm sure you could come up with all of them."* **So here is the complete set.**

  **`roleKind` — HOW you came to hold it.** Seven, and they cover the field:

  | Kind | Covers |
  |---|---|
  | **`elected`** | President, VP, treasurer, senator, class officer — anyone a membership voted in |
  | **`appointed`** | Committee chair named by an officer, delegate, liaison, anyone tapped by someone above them |
  | **`hired`** | TA, RA, tutor, lifeguard, work-study, any job. **Paid, with an employer** |
  | **`selected`** | **The competitive-but-unpaid case the old enum could not express at all** — team captain, drum major, concertmaster, first chair, cast member, editor chosen from applicants, anyone who tried out or applied |
  | **`volunteer`** | Member, participant, regular attendee. **The honest default, and never lesser** |
  | **`founding`** | Founder, co-founder, charter member (E-10) |
  | **`honorary`** | Inducted into an honour society, named a fellow, recognised into a body rather than joining it |

  **`level` — HOW SENIOR it was.** The existing enum is `member | committee | officer | executive | founder`, and **it currently mixes two different questions**: `committee` is a *body*, not a rank, and `founder` is a *kind*, not a rank. **With `roleKind` carrying those, `level` cleans up to pure seniority:** `participant · contributor · lead · officer · head`.

  **Tested against the roles the old enum broke on:** team captain = `selected` + `lead` · drum major = `selected` + `lead` · TA = `hired` + `contributor` · club president = `elected` + `head` · committee chair = `appointed` + `lead` · honour society = `honorary` + `participant` · shift lead → assistant manager = `hired`, `lead` → `officer`.

  **The payoff: the progression path finally reads correctly for a sports team, an orchestra, and a job** — not only for student government. **Which is exactly what §2.4 says students undervalue most.**

  **Migration note:** changing `level`'s values touches existing records and needs the versioned, lossless treatment (`CLAUDE.md`). **`committee` maps to `appointed` + `lead`; `founder` maps to `founding` + `head`.**

  **Every one of these values needs an `InfoTip` (`01` §4f-i, added Aug 2026 from this conversation).** Andy: *"people haven't really heard the explicit difference between elected and appointed."* **He is right, and it is the argument against a seven-value enum unless each value explains itself at the point of choosing.** *"Pick this if you tried out or applied and were chosen"* for `selected`; *"pick this if the membership voted"* for `elected`. **Without the tips this enum produces guesses, and a guessed field looks like data while being noise.**

- [ ] **E-21 · The writing assistant — REFRAMED and PROMOTED (Andy, Aug 2026)** `◐`
  **I proposed a small field: `ran it · co-ran it · was part of it`. Andy replaced it with something much bigger and better.**

  *"That would be a more general AI thing. When you're writing your descriptions, AI should follow up and ask clarifying questions every time you do something… It should be critical, asking 'is that what you meant to say? Or maybe you can say it like this?' It should hold your hand through that writing process and assist you, obviously not force it down your throat — not only for extracurriculars but in any instance where you write something in the experience pillar."*

  **The ambiguity I was trying to catch with an enum is one instance of a general problem.** *"Organized the gala"* versus *"was on the committee that organized it"* is a clarifying question, not a dropdown — **and the same class of question applies to every vague sentence a student writes anywhere in the app.**

  **What it does, while you write:**
  - **Asks clarifying questions** — *"were you leading this, or part of the group that did it?"* **This is where my enum went.**
  - **Is critical, not just corrective** — *"is that what you meant? You could also put it this way."*
  - **Fixes grammar and phrasing.**
  - **Guides, never overwrites.** Andy: *"not force it down your throat."*

  **Scope: every experience pillar, and anywhere a student writes for the application.** **This does not belong in `07`** — it belongs in **`specifications/05-experience-pillar.md`**, which is the shared frame, or `01` if it reaches beyond the pillars.

  **Reuse, do not fork.** #45a's unpack flow is already a 2–3 turn conversational component. **This is that component doing a different job** — #45a draws out *what an experience meant*; this refines *how a description reads*. **Same machinery, different prompt. Configure it.**

  **`◐` — degrades gracefully.** With no key the description is a plain text field and still works. **The assistant is help, never a gate:** it never blocks saving, never requires a response, and **the student's words always survive verbatim unless they accept a change.**

- [ ] ~~**E-22 · Total weekly commitment across pillars**~~ **CUT (Andy, Aug 2026)**
  *"A student can already visualize what they're seeing in terms of hours commitment on the front page. We already designed the thing where you click on the pillar, then it expands and shows all of your activities, so you can see your individual hours commitment."*
  **Right — `03-overview.md` §6.5 already does this**, and a separate cross-pillar total adds a number without adding information.

- [ ] **E-23 · Budget and resources you were responsible for** `○`
  *"Managed a $12,000 budget."* *"Ran a team of 9."* **Concrete leadership evidence that is neither an hour nor an initiative outcome** — it is a fact about the role itself, and it is the kind of thing students forget entirely by application time.

  **Distinct from E-18**, which is impact per initiative. **This is scope of responsibility per role.** Two optional numbers, no derivation, never summed across roles.

- [ ] ~~**E-24 · Stepping back is not quitting**~~ **CUT (Andy, Aug 2026) — it was defending against a feature that does not exist**
  Andy: *"How would that show on the app itself? Would that just be inactivity? I just don't think it's necessary."*

  **He is right, and the question exposes the flaw.** I was protecting students from a record that reads senior-year stepping-back as abandonment — **but this pillar has no staleness alert, no inactivity state, and no recency read at all** (`07` §14, standing). **There is nothing rendering it as abandonment, so there is nothing to defend against.**

  **What survives is already covered elsewhere:** a role has `endDate`, which is enough; and the ban on *"inactive / lapsed / dropped"* copy is `07` §14's existing exclusion, not a new rule.

  **Worth naming as a pattern, since it is the second time today:** I wrote a guard against a problem the spec had already prevented. **Before adding a protective rule, check whether the thing it protects against can actually occur.**

---

## 8. Open, for Andy

| # | Question | Lean |
|---|---|---|
| ~~**E-a**~~ | Browse clubs not joined? | **RULED Aug 2026: yes.** Curated subset in-app, link out to Heel Life for the rest (§2a). Recommendations **by interest, never by popularity** (§2b) |
| **E-b** | The **throughline sentence** (E-4) | **PARKED (Andy, Aug 2026):** *"I don't know what a through-line sentence is. I'll think about that."* **Plain version:** one sentence, written by the student about their own record — *"I build things with people"* — that ties unrelated activities together and becomes the spine of their activities section. **HQ never writes it.** Optional, and the pillar is complete without one. **Do not design further until Andy has decided** |
| ~~**E-c**~~ | Do **mentors and mentees** attach to the `Organization` or the `Role`? | **RULED Aug 2026 (Andy): the Role.** *"Mentors would be roles, obviously."* Who mentored you as a first-year is a different person from who you mentored as president — **attaching to the org loses exactly that arc** |
| **E-f** | **The map, scoped to opportunities, also lives here** (RULED Aug 2026 — `07-campus-layer-board.md` §2a). Andy: *"if you wanted to specialize the map into just being extracurricular opportunities across campus, maps should also live in Extracurriculars."* **One component, two scopes** — the full map on Overview, this one filtered to orgs, events, and opportunities. **Never a second implementation** | Ruled |
| ~~**E-d**~~ | Does **employment** stay an org type here? | **RULED Aug 2026 (Andy): yes.** *"Jobs and job organizations are obviously considered extracurricular, so it's there."* The AMCAS export splits paid employment; the UI keeps it together |
| **E-e** | The **most-meaningful comparison** — here or on Profile/CV? | **Scope ruled Aug 2026 (Andy):** *"make it as easy for me to choose in the event that I am struggling to choose between."* See §9. **Still open: which page owns the screen** — flag before building, since the cap is app-wide and touches Profile's ownership |

---

## 9. Most-meaningful: a suggestion, not a decision tool (SCOPED DOWN, Andy Aug 2026)

**What it is:** AMCAS lets you mark **3 of your 15 activities as "most meaningful"**, with roughly 1,325 extra characters for each.

**Andy's ruling, which cut this down:** *"Most meaningful would function more or less as just a suggestion, considering that the student probably knows what would be their most meaningful, but just in the rare case that they don't know."*

**He is right, and my first version was over-built.** I wrote it as a comparison surface with its own sorting model and a second use case. **The student usually already knows.** A dashboard for a decision most people make instantly is a screen nobody opens.

### What survives

**One deterministic observation, offered at the moment of choosing, dismissible.**

> **The three most meaningful are not the three biggest — they are the three you can write 1,325 more characters about.**

HQ cannot know which activity mattered most. **It can know which ones the student has already written the most about**, and that is an honest proxy for which they can write *well* about. **A 400-hour role with one line of notes fills that extra space worse than a 60-hour one with six reflections and two initiatives.**

**So: when a student is designating, HQ may note which candidates carry the most recorded material. That is the whole feature.** No screen, no ranking, no score, no comparison dashboard.

### Guards

- **A suggestion, shown once, dismissible. Never a blocker, never repeated.**
- **Never picks, never ranks "best."** §2.5 already says HQ does not have the taste for this.
- **Never sorts by hours.** `04`-banned on this pillar, and across pillars it would push everyone toward their biggest commitment rather than their most meaningful one.
- **Never treats medicine-adjacent as a tiebreak** (§2.4, standing).
- **Candidates come from all five pillars** — the cap is application-wide.

### What was cut, and why it was redundant anyway

**I proposed surfacing the same view early as a prompt to write more** — *"your favourite activity has almost no material recorded."* **Cut: `07` §7 already has the thin-description catch**, which does exactly that and fires while memory is fresh rather than at the deadline. **Fold any early-warning behaviour into that existing feature; do not build a second one.**
