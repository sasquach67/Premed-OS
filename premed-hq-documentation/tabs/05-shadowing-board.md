# Shadowing: the board before speccing

Companion to `tabs/05-shadowing.md`. **Reference index, not spec.** That file wins on any conflict.

## Why this one is different from Volunteering's

Volunteering inherits Clinical almost wholesale. **Shadowing inherits the mechanics and rejects the philosophy.**

> ## ⚠ THE PREMISE OF THIS SECTION WAS OVERTURNED (Andy, Aug 2026)
>
> Everything below argued that Shadowing's correct end state is **stop**, and excluded targets, pace projection, and the hours chart on that basis. **Andy rejected it:**
>
> *"This sufficiency call is probably the most ridiculous thing I've ever seen. Why are you trying to put caps? Targets are not necessarily caps, bro. Why would you ever limit the amount of hours that you do? That makes no sense."*
>
> **Shadowing now inherits targets, pace projection, and the hours chart exactly like every other pillar.** The `sufficiency call` is cut; **R-10 closed without research** because the feature it blocked was wrong. See `05-shadowing.md` §2.1 and §14 — **those are law; this section is history.**
>
> **What survives:** breadth is still the more useful read than volume, so **specialty coverage still leads the page.** That is a statement about emphasis, not a ban.
>
> **The error worth remembering:** I turned a true observation — *shadowing has diminishing returns because you are observing, not contributing* — into an **instruction**, and then wired a feature to switch off at a threshold the same file admitted was unsourced. **An observation the page reflects is fine. A verdict about someone's life is not.**

**Superseded reasoning, kept below.** `05-shadowing.md` §2.1 used to state it plainly: *"Low hours are the correct outcome."* Roughly 40 to 50 total hours a **complete** record; the correct end state **stop**; every other pillar pushing accumulation and this one refusing to.

**That was said to invert the single most-inherited feature set in the app** — Clinical's target, pace projection, and hours chart — so this board spends most of its length on **what not to bring**. **That balance is now wrong**, and §2's exclusion table has been corrected accordingly.

---

## 1. Inherits from Clinical

Same delta format as `04-volunteering-feature-catalog.md`. Read `03-clinical-feature-catalog.md` as the base.

**Renames:** `Site` → **Physician** · `Shift` → **Visit** · insight → **reflection** (renamed Aug 2026 by Andy for cross-pillar consistency; the spec previously used "insight" throughout).

| Clinical | Shadowing | Note |
|---|---|---|
| #1 to #11, the record | **inherits**, reorganized by person | §2.4: *"The physician is the record."* The list is a directory of people, not organizations |
| #12 to #15, mis-filing catch | **inherits, inverted** | §7's misfiled-as-clinical catch. Hands-on responsibility means it is not shadowing |
| #37 to #43, verification | **partially, and differently** | See §3. Physicians are recommenders, not verifiers, and that changes the mechanism |
| #44 to #51, reflection | **inherits, with the marker already built in** | See §4. The reflection requirement is Clinical's unpacking marker, arrived at independently |
| #55 to #62, record integrity | **inherits whole** | Return rundown, nudge routing, role fork, impossible-entry guard, estimated exclusions, bring-your-own-material |
| #63 to #71, sub-tab mechanics | **inherits whole** | Month grouping, filters, inline edit, shared `InlineAddRow` |
| #72, continuity read | **inherits, lowest emphasis** | `05` §2a already says so: a gap here is often **success**, not drift |

---

## 2. What must NOT come across, and why it is a bigger list here

| Excluded | Why |
|---|---|
| ~~**#29 to #32, target and pace projection**~~ | **NOT EXCLUDED — REVERSED Aug 2026. They inherit.** This was called *"the core exclusion,"* on the grounds that a projection contradicts *"you can stop."* **Andy cut "you can stop," so the grounds are gone.** `03-clinical.md` §7a applies unchanged, student-set |
| ~~**#34, the hours chart**~~ | **NOT EXCLUDED — REVERSED Aug 2026. It inherits.** Excluded because it *"encourages the accumulation this pillar exists to discourage"*; **the pillar no longer exists to discourage anything** |
| **#33, stale-exposure** | **Still excluded, but for a better reason.** The old one — *"a gap is normal because you should have stopped"* — died with the sufficiency call. **The surviving reason: shadowing is naturally episodic.** You go when a physician has a day free, so a three-month gap carries no information. Volunteering excludes the same alert on the same logic (`04-volunteering-board.md` §2) |
| **#20 to #24, credentials** | Nothing expires |
| **#16, #17, paid vs volunteer** | AMCAS files shadowing under its own category regardless of pay (`03-clinical-board.md` §7a) |
| **#52, patient-contact count** | **Observation without responsibility is the definition of shadowing.** Contact that implies responsibility means the record belongs in Clinical |
| **#54, the shared org directory** | **RULED OUT ENTIRELY (Andy, Aug 2026). See §5** — and note the org side is excluded too, not just the person side. |

**The pattern, CORRECTED Aug 2026:** this section used to say everything answering *"am I accumulating enough?"* was excluded *"because you already are, stop."* **That premise is dead.** What is genuinely excluded now is small and domain-specific — credentials, paid/volunteer, patient contact, the shared directory — **and none of it is about accumulation.

---

## 2a. ALL THREE RULED (Andy, Aug 2026) — read this before §3, §4, §5

**One insight resolves all of them, and it is Andy's:** *"the 'site' should just be whoever the physician is, and vice versa."*

**In Clinical, three separate things exist:** a **site** (UNC Hospitals ED), a **supervisor**, and an **AMCAS verifier** — sometimes three different entries. **In Shadowing they collapse into one person.** The physician is the site, the contact, the verifier, and the potential recommender. **That single collapse is what settles S-1, S-2, and S-3.**

| | Ruling |
|---|---|
| **S-1** | **§7c's batched verifier workflow does NOT run** — but the **completeness check survives.** See §3. |
| **S-2** | **MERGE.** Andy: *"shadowing is an unpacking thing. The mechanism should still be the same as Clinical. They should still do the same job in everything."* One marker, one mechanism, Shadowing's copy. See §4. |
| **S-3** | **HARD NO to a cross-user physician directory**, and the reason is not primarily privacy. See §5. |

---

## 3. Verification works differently here (S-1 — RULED)

**RULED: the batched verifier-capture workflow does not run. The completeness check does.**

**Because site and verifier are the same person, there is nobody to go find later.** Clinical's §7c exists to solve *"you logged 40 shifts at an ED and never wrote down who can confirm it."* **That situation cannot arise here** — you cannot log a shadowing visit without naming the physician you shadowed. **The capture already happened at log time, which is exactly what §7c was built to avoid needing.**

**What still runs, and it matters for AMCAS:** a physician can exist as a name with **no email or phone**. The pre-cycle completeness sweep (part of #48's prep panel) **still flags incomplete physician contact details**, because the AMCAS entry needs them. **What is cut is the "find and add a verifier" step, not the "is this contact usable" check.**

**Consequence for the shared builder:** Shadowing configures the verifier slot to **point at the physician record** rather than rendering a second contact field. **Do not build a separate verifier entity on this pillar.**

---

## 3z. Superseded reasoning (kept so the question is not reopened)

Clinical's §7c captures a **verifier**: someone who can confirm you were there, needed for the AMCAS entry, batched at term rollover.

**Shadowing's physician is already more than that.** §2.4 calls the directory *"the pillar most likely to produce a recommender."* The spec has a **letter-conversion prompt** (§7) rather than a verifier-capture workflow.

**Open question:** does §7c's batched verifier review run here at all, or does the letter-conversion prompt replace it entirely?

**Lean: it does not run.** A physician you shadowed **is** the contact, captured at the moment you logged the visit. There is no separate person to go find later, which is the whole reason §7c exists. **Batching a review of contacts you already have would be busywork.**

---

## 4. The reflection requirement IS the unpacking marker (S-2 — RULED: MERGE)

**Arrived at independently, before Clinical's #45a existed.** §2.6: *"A visit with hours and no reflection is treated as incomplete, and it is the only pillar where that is true."* §7 has a missing-reflection nudge that fires once and never blocks.

**That is structurally the same thing as #45a's marker**: a per-record state that says *this is not finished*, cleared by doing it or by moving on.

**What needs deciding:** do the two merge, or stay separate?

**RULED: merge (Andy, Aug 2026).** *"Shadowing is an unpacking thing. The mechanism should still be the same as Clinical. They should still do the same job in everything."*

**One mechanism, one marker, one set of rules** about permanence and deferral. **#45a is not reimplemented here — it is configured.** Shadowing's question (*"what did you understand today that you didn't yesterday?"*) is better than Clinical's generic prompt, so **the domain wording survives the merge; the machinery does not fork.**

**And #45b's synthesis matters more here than anywhere.** *"What did you learn about medicine across 6 physicians and 5 specialties"* is a better question than any single visit can answer, and it is the question the AMCAS entry actually needs answered.

**And #45a's full unpack flow applies**, since an reflection is exactly the kind of thing that benefits from being drawn out. **#45b's synthesis matters even more here**, because *"what did you learn about medicine across 6 physicians and 5 specialties"* is a better question than any single visit can answer.

---

## 5. The physician directory must NOT be cross-user (S-3)

**Clinical's #54 aggregates orgs across students**: *"12 students logged hours at UNC Hospitals ED."* Volunteering inherits it and it matters more there.

**It must not inherit here.** The records on this pillar are **named individual people**, not institutions. A cross-user directory would produce *"8 students have shadowed Dr. Reyes"*, which is:

- **A private individual's activity, aggregated without their knowledge or consent.** A hospital is an institution; a physician is a person.
- **Plausibly harmful to the student.** A doctor discovering they are listed in an app as a shadowing target is a real risk to that relationship.
- **Contrary to the app's own posture.** `deferred.md` N-1 already ruled the cross-user network idea out of scope, and this is a sharper version of it because the subject is not even a user.

**RULED: hard no, and Andy's reason is stronger than the privacy one (Aug 2026).**

*"Let's not recreate the '_ students have shadowed here' — it's supposed to be a 1-on-1 relationship after all. It's different from clinical where students can have the same activity, but normally the supervisor, their mentor or whatever, varies. Let's try not to pull in a database of common mentors because that's just not necessary."*

**The feature would not work even setting privacy aside.** Clinical's #54 earns its keep because students **genuinely share sites** — a hundred pre-meds cycle through UNC Hospitals ED, so *"12 students logged hours here"* is real signal and the merge saves real typing. **Shadowing is 1:1 by construction.** Mentors vary per student, so the overlap that makes a shared directory useful barely exists. **Building it would be a privacy risk in exchange for almost no value** — the worst possible trade, and the reason this is not a close call.

**So: no shared directory of any kind on this pillar, and no org side either.** An earlier draft of this section said *"the org side (practices, hospitals) may inherit #54."* **Withdrawn.** Andy: *"the 'site' should just be whoever the physician is, and vice versa"* — **there is no separate organization entity here to aggregate.** A practice name is an attribute on the physician record, not a shared canonical org.

**Write it as a standing exclusion**, not left to be inferred from the absence of a spec line, because #54 is inherited by every other pillar and someone will generalize it here for consistency.

---

## 6. The three existing open decisions (§16)

| # | Question | Status |
|---|---|---|
| 1 | Is a **planned visit** a distinct status, or a dated session with zero hours? | **Superseded by S-7.** Both options were too small — the object worth modelling is **the ask**, not the visit. Reuse `LetterEntry`'s status chain |
| 2 | Does **`proceduresObserved`** earn a structured field? | Lean **no, keep it inside the reflection**. Structuring it invites exactly the skills tracking R1 cut from Clinical. **Same argument, and it already won once** |
| ~~3~~ | ~~Where does the **sufficiency bar** sit?~~ | **DISSOLVED Aug 2026.** The question only existed because the sufficiency call did. **No call, no bar. `deferred.md` R-10 closed without its research ever being done** |

---

## 7. Genuinely new, for discussion

| # | Thing | Why |
|---|---|---|
| ~~**S-4**~~ | **RULED Aug 2026: `Physicians` · `Visits` · `Reflections`.** Three, flat, underline nav, no mode switch. `Reflections` rather than `Reflections` because the domain word is better — **the word survives, the component does not fork.** Full treatment now in `05-shadowing.md` §5, §5a–§5c |
| ~~**S-5**~~ | **RULED Aug 2026: written as a deliberate exception**, not left to be inferred. Specialty coverage leads and the directory sits beneath it. **The reason, now in §5a:** the question this pillar answers is *breadth*, and **seven physician cards cannot show breadth — a specialty × hours × settings table can.** The directory is how you reach a record; the table is what you came to see |
| ~~**S-6**~~ | ~~What happens after the sufficiency call?~~ | **MOOT Aug 2026.** There is no "after" — nothing marks a student finished, so the page never enters a completed state. **It just keeps working**, which is what the question was groping toward anyway |

### 7a. Four more, added Aug 2026 (brainstorming pass)

| # | Thing | Why it is worth having |
|---|---|---|
| ~~**S-7**~~ | **CUT (Andy, Aug 2026).** *"I feel like it only needs to track positions that I already have, so we can scratch the application and the act of asking a potential physician to shadow."* **The pillar records what you have, not what you are chasing.** No `askStatus`, no `identified`/`asked`/`declined`, no pipeline. **See §7c for what this took down with it** — the cut is larger than one feature |
| **S-8** | **Name the depth-vs-breadth tension, and derive the letter candidate** | **The spec has two goals pulling opposite ways and never says so.** Breadth (specialty coverage, the hero) rewards *5 physicians once each*. **A letter rewards the opposite** — 5 visits with *one* physician, because nobody writes for a stranger. Both read as "5 visits" today. **Proposal: derive a letter candidate** from visit count plus recency with one named person, and surface it in §7's existing letter-conversion prompt. **Derived, never asked** — the student should not have to declare who likes them. `#54`-style aggregation is not involved; this is entirely within one student's own records |
| ~~**S-9**~~ | **RULED (Andy, Aug 2026): virtual shadowing counts.** | *"Virtual shadowing counts too, but is uncommon and not typically done, but can still be done as an option. Don't stress about it too much."* **So `telehealth` stays in the `setting` enum and nothing else changes.** No warning, no separate total, no asterisk on the hours. **Not a research blocker** — it was going to become one, and the ruling closes it instead |
| **S-10** | **Cold-email help: sourced templates, AI-assisted, PARKED** | Andy, Aug 2026: *"I'd rather incorporate cold email templates from online and done by other people, but AI-assisted is acceptable. I'll talk more about this."* **So the earlier framing — "this is purely Sauce's job, build nothing" — is too narrow.** What survives from it: **the app does not invent advice in its own voice**, and templates are **sourced from real people**, consistent with §4 of the Sauce board. What is now open: whether a student can *compose* from a template inside HQ, and how much the LLM may adapt it. **Parked at Andy's request. Do not design it unprompted** |

### 7a-iii. Four more, second brainstorming pass (Aug 2026)

**All four were put to Andy and three came back corrected. Revised ranking below; my original one is kept underneath each so the reasoning is auditable.**

| # | Thing | Status after review |
|---|---|---|
| **S-15** | **Practice environment: private practice vs hospital system** | **BUILD. Upgraded from "probably over-structuring" — I had the wrong axis.** |
| **S-13** | **Name the non-MD/DO options instead of `other`** | **BUILD, simplified.** I over-dramatised it |
| **S-12** | **Patient population as a structured field** | **Keep, with a caveat I missed.** Weaker than pitched |
| ~~**S-14**~~ | ~~"Did this change your mind?"~~ | **CUT.** Did not survive the challenge |

#### S-12 · Patient population is structured on Volunteering and missing here

**Volunteering has `population/need served` as a multi-select preset list** (`04-volunteering.md` §4) — underserved, homeless, youth, elderly, rural, veterans, and so on. **Shadowing has nothing equivalent, and the exposure is just as real.** Shadowing a rural family practice, an urban safety-net clinic, and a private suburban dermatology office are three different educational experiences, and **only one of them speaks to a mission-driven school.**

- **Reuses an existing field shape**, so it costs a preset list and a multi-select, not a new pattern.
- **It is the honest input to School List mission fit** — which currently has nothing from this pillar.
- **Guard:** it must never become a coverage grid to fill (S-11's rejection applies). **A field you fill in, never a set you complete.**

**CAVEAT I MISSED, and it weakens the pitch (Andy, Aug 2026).** On Volunteering the field means *"who you served"* — something the student did. **In shadowing you are observing, so it is the physician's patient population, not yours.** The field is **descriptive of the exposure, not a claim about the student's contribution**, and the label must say so. `Patients you observed`, never `Population served`. **Still worth having** — schools that care about underserved medicine care whether you have seen it — **but it is not the straight parity gap I originally called it.**

#### S-13 · Name the non-MD/DO options instead of bucketing them into `other`

**REVISED after Andy pushed back — my first version was alarmist.** I wrote that `other` was *"doing dangerous work"* and attached a flag-and-offer nudge to it. Andy: *"what's dangerous? it should still be a selector if students decide to shadow someone other than MD or DO."* **He is right on both counts. Nothing here is dangerous, and the nudge was me inventing a nag around what is really a field-type problem.**

**The whole of it:** `Physician.degree` is `MD | DO | MBBS | other` (§4). **A free `other` bucket cannot be reasoned about** — you cannot later tell a PA from an NP from anything else, so you cannot filter, count, or report on it. **Give the common cases names: `MD | DO | MBBS | PA | NP | other`.** That is the entire change.

- **No nudge, no flag, no move offer.** A student shadowing a PA made a choice; the app records it and says nothing.
- **Do not editorialize about which is better.**
- **Category A check still owed** on how AMCAS actually treats PA/NP observation **before any copy asserts a filing rule.** I asserted one before sourcing it, which was the other half of the mistake.

#### ~~S-14~~ · "Did this change your mind?" — CUT (Aug 2026)

**Proposed, challenged, and it did not survive.** Andy: *"what is the actual use, saying that I don't like it or I change my mind, idk what that means."*

**The pitch was:** interviews ask *"how do you know you want this,"* and *"I thought I wanted surgery, shadowed it, and realised I cared more about continuity"* is a real answer — so capture it as a three-state control on the reflection.

**Why it fails: the reflection text already holds it.** A selector on top is structure over something already recorded in the student's own words, and **#45b's synthesis reads that text anyway.** The only thing the control bought was *finding* it two years later without re-reading twenty reflections — **which is precisely what the synthesis pass exists to do.** Adding a field to solve a retrieval problem another feature already solves is duplication, not capture.

**Kept as a rejected entry** because it sounds compelling and will be re-proposed.

#### S-17 · Questions you brought — the other half of the bio

**S-16 gives a student something to read before a visit. This is what they do with it.**

**Before a visit: two or three questions, jotted.** After: the reflection. **Those are different fields at different moments** — *what I wanted to know* is not *what I understood* — and the first one is the thing that turns a day of standing quietly into a day of learning.

**It completes a loop that no other pillar has:** **bio → question → visit → reflection.** Read who they are, form something worth asking, spend the day, write down what changed. **S-16 without this is reading for its own sake; together they are preparation.**

**REVISED after the S-7 cut (§7c).** Questions were originally attached to a planned visit. **There is no planned visit any more**, so they move to **the physician record** — *"things I want to ask them."*

**The move improves it.** A standing list on the person **persists across visits**: you ask one thing in March, another in May, and the ones you never got to are still sitting there. **A per-visit list would have been thrown away every time.**

- **Two or three lines, optional, on the `Physician` record.**
- **Visible in the visit fast-add row and in the physician detail panel**, so the answer lands next to the question without the question living on the visit.
- **No prompts, no suggested questions, no AI-generated list.** The moment HQ supplies the questions it has taken over the one part the student has to own. **`○` deterministic — it is a text field and a placement rule.**
- **Never nudged.** A visit with no questions is a complete visit.

**Confidence: medium-high.** It is small, it costs nothing, and it is the only feature discussed that makes the *experience itself* better rather than the record of it.

#### S-18 · A duplicate `specialty` field — DELETED. Not a design question.

**§4 carried `specialty` on `Physician` *and* on `ShadowingExperience`.** A leftover duplicate, nothing more.

**Andy, Aug 2026:** *"Why would the specialty tag change with each experience? The specialty and the physician go hand in hand, and those two are never, never separated."* **Correct, and it was never in dispute.**

**Why it mattered at all:** with two fields, the coverage table — the pillar's hero — had **two possible answers to "how many specialties have you seen"**, depending on which field the code read. Both would have looked correct.

**Fixed: `ShadowingExperience.specialty` is deleted.** `Physician.specialty` is the only one. `setting` and `practiceEnvironment` already carry where and how.

> **Note on how this was written up the first time.** I framed it as an open decision and argued a case for keeping both fields — *"a family medicine physician sees everything, so the specialty of the visit can differ from the specialty of the person."* **That was inventing a justification for a field that was simply a mistake, and it made a one-line cleanup look like a design question.** When a duplicate field has no reason to exist, say so and delete it.

#### ~~S-19~~ · What happens at `declined`? — DISSOLVED with S-7 (Aug 2026)

**There is no `declined` state any more**, so there is no discouraging moment to design for. **A question that only existed because of a feature that is now cut.**

**One thing worth carrying forward, since it was the useful half:** *"most students hear back from a minority of physicians they contact"* is a good **Sauce `Fact`** regardless. It just gets shuffled like everything else rather than fired at a moment.

**And the architectural question it raised is real and still open, in the right file:** **may Sauce content ever be surfaced contextually, or only through the dropdown?** **Contextual surfacing is how a calm digest turns into a system that interrupts.** Recorded in `06-knowledge-delivery-board.md`; **do not resolve it here.**

### 7c. What the S-7 cut took down with it (Aug 2026)

**Andy's ruling is one sentence and it removes five things.** Recorded together because they were specced across three sections and would otherwise be found one at a time.

| Cut | Where it was |
|---|---|
| **`askStatus` on `Physician`** | §4 |
| **The ask-status chip on physician cards** | §5a |
| **Planned visits, and the "upcoming above logged" rule** | §5b |
| **S-19 entirely** | board §7a-iii |
| **§16 #1's ruling** (reuse `LetterEntry`'s chain) | spec §16 |

**Two consequences that are not deletions:**

1. **The D7 #3 blocker disappears from this pillar.** S-7 was the only thing here that needed Letters wired to `Person` records. **Shadowing is no longer waiting on anything.** *(D7 #3 remains a real defect for Letters itself — it is simply not Shadowing's blocker any more.)*
2. **S-17 loses its anchor and needs a new one.** Pre-visit questions were specced onto the planned visit that S-7's `scheduled` state created. **With no planned visit, there is nowhere to attach them.** → see the revised S-17.

#### S-16 · The physician bio — a directory you would actually read (Andy, Aug 2026)

*"For physicians it's different because they're physicians. I think it'd be helpful if there's a directory with a little bio, or if it imports information from that bio over to HQ so I can read it for fun."*

**This is the feature that makes the physician directory worth opening.** Right now a physician record is name, degree, specialty, hours — an index entry. **Physicians are the one entity in this app that come with a published biography**, because nearly all of them have a faculty page, a practice "our team" page, or a university profile. **No org in Clinical or Volunteering has that; a hospital does not have a life story.**

**Three uses, and they are genuinely different:**

| | Why it matters |
|---|---|
| **Before you shadow** | You spend a day with someone. Knowing they did a fellowship in transplant makes you a participant rather than a passenger, and it is the difference between a good question and no questions |
| **Before you ask** | **A cold email referencing their actual work lands; a generic one does not.** This is the concrete half of S-10 — HQ does not write the email, but it puts the material in front of you |
| **For its own sake** | Andy: *"so I can read it for fun."* **A legitimate reason.** Reading how someone got where they are is the closest thing to a preview of the job |

**Mechanism: paste, never crawl.**

- **The student pastes a URL or the bio text.** HQ stores it against the physician. **No scraping** — `03-clinical-board.md` §5 already bans scraping portals, a static app on GitHub Pages cannot fetch arbitrary origins anyway (CORS), and auto-crawling a named person's page is a different act from a student saving a page they were reading.
- **Reuse `Preview Link Card`**, which already exists for Quick Capture (`03-overview.md` §6a). **No new component.**
- **`bioSource` + `bioRetrievedAt` ride along**, the same discipline every other record in this app carries.
- **AI marker `◐` — degrades gracefully.** Without a key: the link and whatever text was pasted. With one: **a 2–3 line summary.** Never invented — **it summarizes what was pasted and nothing else**, and says so.

**Guards:**

- **NEVER cross-user.** S-3 applies with full force: a bio one student saved never becomes shared data, a suggestion, or a merge candidate. **It is one student's private note about a public page.**
- **Separate from the student's own notes.** *"Trained at Hopkins, transplant fellowship"* (imported) and *"let me hold the retractor"* (yours) are different things and must not merge into one blob.
- **Not a discovery surface.** It is a field on a physician **already in your directory** — and since S-7 was cut (§7c), that now means **someone you have actually shadowed.** *(An earlier version said "includes people you have only emailed," which was true while the ask chain existed and is not any more. The guard got stricter by accident, which is fine.)* **The moment it becomes a searchable database of doctors it is a different product with a different privacy story.**
- **Entirely optional.** A physician with no bio is a complete record, and nothing nudges about a missing one.

#### S-15 · Practice environment — UPGRADED. Build it. (Andy, Aug 2026)

**I originally ranked this lowest and framed it as "academic vs community," which is about teaching. Andy reframed it and the reframing is what makes it worth building:**

*"It does help to get more information about the nature of the shadowing — thought it was fundamental to distinguish private practice than corporation hospitals."*

**Private practice vs large hospital system is not about teaching. It is about how medicine actually gets practiced** — whether the physician owns the place or is employed, their autonomy, patient volume, how many minutes they get per patient, how much of the day is administrative. **A student who has only ever seen one of those has seen one version of the job**, and this is a thing interviews genuinely probe.

- **It is a distinct axis from `setting`.** `setting` is *where care happens* (inpatient, OR, clinic); this is *how the practice is organised*. Cardiology in a physician-owned practice and cardiology inside a hospital system are the same specialty and the same setting, and different jobs.
- **Proposed values: `private practice | hospital system | academic medical center | community clinic | other`.** One selector on the `ShadowingExperience`.
- **Same guard as S-12:** a field you fill in, **never a set to complete.** No coverage grid, no "you have not seen private practice yet" — S-11's rejection applies here too.
- **My original objection was that S-12 covered it.** It does not: S-12 describes *who the patients are*, this describes *how the practice runs*. **Different questions, and a student can have full breadth on one and none on the other.**

### 7a-ii. S-11: the specialty landscape view — RAISED AND REJECTED (Aug 2026)

**The idea:** a landscape of all specialties showing **what you have not seen yet**, as the complement to §5's coverage hero.

**It is the obvious next feature and it should still not be built — but the reason had to be rewritten (Aug 2026).** The original argument leaned on *"this pillar's correct end state is stop,"* **which Andy overturned.**

**The surviving reason is simpler and does not depend on that premise:** a grid of empty cells is **a checklist, and HQ does not hand students checklists it invented.** Nobody sourced a list of specialties you are supposed to see, so rendering one as unfilled boxes **manufactures an obligation out of a layout choice.** That objection holds on every pillar; it is merely most obvious here.

**§7's breadth gap already names what is missing, in prose, once.** That remains the ceiling. **A named gap is guidance; a grid of empty cells is a scoreboard.**

**§7's breadth gap already names what is missing, in prose, once.** That is the correct ceiling. **A named gap is guidance; a grid of empty cells is a scoreboard.**

**Filed as rejected rather than open**, because it will be re-proposed — it looks like an improvement, and the reason it is not is specific to this pillar.

### 7b. How S-7's status chain actually works (Andy's question, Aug 2026)

*"Would it connect to prof contacts housed in Academics, and so forth? Will every letter of rec person have a home in HQ? A writer would be housed somewhere — if I did a sport and my coach were to write one, their contact should be housed in ECs or something."*

**Yes, every writer has a home — but it is one global home, not a per-pillar one.** `Person` already exists as a top-level entity (`types.ts:39`, `persons` in `AppData`). **Three different things are involved and they must not be conflated:**

| | Where it lives | Example |
|---|---|---|
| **The person** | **The global `persons` store.** One record, forever | `Coach Ellis` |
| **The relationship** | **The pillar where it happened** | ECs: *"Coach Ellis, cross-country, 3 years"* |
| **The ask** | **Whichever tab is doing the asking** | Letters: *"asked 14 Mar, agreed 20 Mar"* |

**The correction to "housed in ECs":** a contact is **stored globally and surfaced in the pillar**, not owned by it. **Otherwise a professor who teaches your Bio 101 *and* runs your lab needs two records**, and you get exactly the duplication `general.md` §Deduplication exists to prevent. **One record, many doors** — the same pattern as Story Bank and the node steps.

**And the two asks are separate arcs, not one shared status.** *"Can I shadow you?"* and *"Will you write me a letter?"* are different questions about the same person, often **years apart**. Merging them into one status field produces nonsense — a physician marked `agreed` tells you nothing about which. **So: same shape, two instances.** Shadowing owns its ask-status per physician; Letters owns its ask-status per recommender; the `Person` underneath is shared.

**S-7 IS BLOCKED, and by a known defect.** `Letters.tsx:13` stores the recommender as a **plain text string**, not a `Person` reference — so today there is nothing for a Shadowing hand-off to attach to. **This is already `implementation/briefs/D7-remediation.md` item 3** (*"wire both to the canonical `Person` records… migrate existing recommender strings to `Person` links — versioned, lossless, ambiguity → review, never a silent merge"*). **D7 #3 must land before S-7 can be built.**

---

## 8. Rejected, carried and added

**Carried from Clinical** (`03-clinical-board.md` §5): streaks · readiness scores · comparison to other applicants · silent auto-classification · any PHI field · scraping portals · a second calendar.

**Shadowing's own:**

- **No specialty "diversity score."** Breadth is the metric, but scoring it would turn *"stop when you have enough"* into *"maximize the number."*
- **No cross-user physician directory** (S-3).
- **No hours leaderboard, target, or projection** of any kind. This is already §14 and bears repeating because it is the most likely thing to be reintroduced by someone generalizing from Clinical.
