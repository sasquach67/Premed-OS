# Volunteering: the board before speccing

Companion to `tabs/04-volunteering.md`. **Reference index, not spec.** That file wins on any conflict.

**Why this board is smaller than Clinical's.** Clinical was designed from scratch and settled the boundary all five pillars are defined against. Volunteering inherits that work. Andy, Aug 2026: *"the list of new and specific features will be less, but we should still at least be comprehensive."* So this file's job is not to invent 70 features. It is to answer three questions honestly:

1. **What inherits** from Clinical's 73, and under what renaming.
2. **What is clinical-only** and must not be copied, with the reason attached.
3. **What is genuinely Volunteering's own**, which is where the real design work is.

**The existing spec is not a scaffold.** `04-volunteering.md` is 165 lines with real domain thinking (direct/indirect, population, cause throughline, longevity-over-recency). **But it predates every Aug 2026 Clinical ruling**, and its §17 claims *"None, Volunteering is fully designed"*, which is now false. That claim is the first thing to fix.

---

## 1. What Volunteering inherits, with renames

**The vocabulary shift is `Site` → `Org` and `Shift` → `Session`.** Everything structural survives it.

| Clinical | Volunteering | Notes |
|---|---|---|
| Sites · Shifts · Reflections | **Orgs · Sessions · Reflections** | Same three flat sub-tabs, same underline nav, no mode switch (`03-clinical.md` §5) |
| #1–11 the record | **inherits whole** | Org list, workspace, session log, hours by org, fast-add, bulk backfill, quick-log from Overview |
| #18 hour ownership | **inherits, and matters more here** | §2.0 is app-wide. Volunteering has **two** collision risks, not one: Clinical (a clinical-looking service role) and Extracurriculars (service through a club) |
| #34 hours chart | **inherits, different default** | See open question **V-3**: monthly bars read recency, and this pillar values longevity |
| #37–43 verification | **inherits whole** | Type-to-create verifier, batched at term rollover and pre-cycle (§7c) |
| #44–51 reflection | **inherits whole, and this is the biggest win** | Prompt chips, the tracked unpack marker (#45a), the cross-experience synthesis (#45b). Service reflection is *"why I serve"* material, which is exactly what #45b was built to surface |
| #54 shared org directory | **inherits** | Arguably stronger here: service orgs are more shared between students than hospitals are |
| #55–62 record integrity | **inherits whole** | Return rundown, nudge routing, role fork, dormancy, impossible-entry guard, estimated exclusions, bring-your-own-material |
| #63–71 sub-tab mechanics | **inherits whole** | Month grouping, two-axis filters, inline edit, shared `InlineAddRow` |

**Net: roughly 55 of Clinical's 73 carry over directly.** They need renaming in copy, not redesign.

---

## 2. What is clinical-only and must NOT be copied

Each with the reason, so nobody re-adds it later "for consistency."

| Excluded | Why |
|---|---|
| **#20–24 credentials** | Nothing in service work expires. No NREMT, no BLS. The Credentials section on `Orgs` **does not render at all**, not even empty. |
| **#16, #17 paid vs volunteer** | Every record here is volunteer by definition. The field is meaningless, and worse, showing it would imply some service is paid. |
| **#19 primary-care loop** | Clinical-only regex over role text. |
| **#52 patient-contact count** | Patient contact is the *definition* of clinical. If it is happening here, #14's route-to-Clinical should have fired. |
| **#33 stale-exposure, the ALERT only** | Clinical asks *"are you still current?"* Volunteering asks *"did you stay committed?"* A student who volunteered weekly for 18 months and stopped has a **stronger** record than one who did five scattered days last month, so an alert would punish the pattern this pillar rewards. **Read this narrowly:** what is excluded is the *unprompted nudge*. **Continuity itself is displayed here and on every pillar** (§4a). A visible fact the student can look at is not the same thing as HQ interrupting them about it. |
| **#60 overnight-shift dating** | Sessions are daytime events. The rule is harmless but pointless; leave it in the shared component and never surface it. |

---

## 3. Volunteering's own, from the existing spec

These six are already in `04-volunteering.md` §2 and are good. Listed so the board is complete, not because they need re-deciding.

| # | Thing | Status |
|---|---|---|
| **W1** | **Route-to-Clinical**, the inverse classifier | specced §7, and it is Clinical's #14 mechanism reversed |
| **W2** | **Direct vs indirect service** | specced §4. Both count; direct usually reads stronger |
| **W3** | **Population / need served** | specced §4. Preset list + free-text other, multi-select. **This is what makes the "N populations served" headline countable** |
| **W4** | **Cause area + throughline** | specced §5. Flat list by default, group-by-cause toggle |
| **W5** | **Longevity as the headline signal** | specced §2.4. *"18 months, weekly"* beats scattered one-offs |
| **W6** | **Recurring role vs one-time event** | specced §4. Powers the consistency read |
| ~~**W7**~~ | ~~Duplicate-with-EC catch~~ | **SIMPLIFIED Aug 2026, see §4g.** The cross-link machinery is cut. One record lives in one pillar; there is nothing to double-count |

---

## 4. The six, RULED (Andy, Aug 2026)

| # | Ruling |
|---|---|
| **V-1** | **Pace projection and target STAY, identical to Clinical.** Andy: *"still pace projection and target, like i said no different."* §7a's whole apparatus inherits: no target on day one, suggested from stated capacity or observed rate, always labelled `Your target`, never pre-filled, optional forever. **This overrides `03-clinical-board.md` §6**, which claimed Clinical was the only pillar allowed a target. That line was written before this pillar was examined and is now too narrow. |
| **V-2** | **Moot.** The pace line inherits unchanged with V-1. |
| **V-3** | **Both, and this generalizes to every pillar.** See §4a below. |
| **V-4** | **Inherits, unchanged in function.** Andy: *"the organization directory means a lot more here, just because clubs are obviously community-service-based. The function doesn't change."* Same entry-time resolution, same person-confirms-every-merge rule (#54). It simply matters more, because service orgs genuinely are shared between students at one school. **No mechanism change, so nothing to spec differently.** |
| **V-5** | **Same mechanism, different lens.** See §4b. |
| **V-6** | **There was no problem.** One activity is one entry in one place, because that is all AMCAS can see. See §4c and §4g. |

### 4a. Continuity is a shared signal, on every pillar (V-3, GENERALIZED)

**Andy, Aug 2026:** *"a thing to show continuity should be present in both Volunteering and Clinical and whatever the rest. Continuity is important for all of the elements. Though a little bit more emphasis is for Volunteering, everything should still be there."*

**This is a cross-pillar ruling, not a Volunteering one.** The earlier framing had Clinical owning recency and Volunteering owning longevity, as if they were alternatives. They are not: **hours, recency, and continuity are three different reads and every pillar wants all three.**

- **The hours chart (#34) inherits whole**, monthly bars plus running total. Not replaced.
- **A continuity read is added alongside it**, showing engaged months against gap months across a role's life. It answers *"did I stay with this?"*, which neither hour heights nor a running total answers.
- **Emphasis differs, presence does not.** Volunteering leads with continuity; Clinical leads with recency; both show both.
- **Consequence:** this needs writing into `03-clinical.md` and `05-experience-pillar.md`, not just here. **Clinical is not finished until it has one.**

### 4b. The synthesis pass asks different questions, not a different way (V-5)

**Andy, Aug 2026:** *"it should still ask more specialized questions, but the general just remains the same... Clinically it kind of asks why medicine. Volunteering asks why help at all, why represent these underserved communities... it kind of targets a different side of you as a human being."*

**The mechanism is #45b, unchanged.** What differs is the register:

| | Clinical asks toward | Volunteering asks toward |
|---|---|---|
| The question underneath | *Why medicine* | *Why help at all* |
| What it draws out | How you relate to patients, illness, and the work of care | Why these people, this cause, this community |
| The self it examines | The future clinician: what you can **do** for someone | The person: where you find **common ground**, what captivates you outside medicine |

**Both are introspection toward the same end**, a student who understands their own motivation. Andy: *"you still want to get an introspective view on yourself, but it's kind of focused in a different lens."*

**The rule that follows:** Volunteering's prompts must **not** route every reflection back to medicine. A student tutoring kids is developing altruism and connection, and **that is allowed to be the whole point**. Forcing a "and how does this make you a better future doctor?" turn would produce exactly the manufactured essay voice the pillar exists to avoid.

### 4c. Contact is not clinical (V-6, RULED)

**Andy, Aug 2026:** *"I'm teaching kids piano. Obviously that's patient-to-patient contact, but that would not be clinical, just because it's not medically related... There is a fine line, a gray line, but that is up for the AI to decide based on their reasoning."*

**The bug this closes:** route-to-Clinical (W1) keys off *patient contact*, and the phrase is misleading. Tutoring, coaching, mentoring, and shelter work are all **intense face-to-face human contact** and **none of them are clinical**. A naive contact test would route half this pillar into Clinical.

**The rule: two conditions, and both must hold.**

1. **Direct contact with the people served**, and
2. **A medical or health context** around it.

Piano lessons satisfy the first and fail the second. **Failing either means it stays here, silently, with no banner.**

**This is a ◑ feature at minimum, arguably ●.** Deciding whether *"I help residents at a memory care facility with music"* is clinical or service requires reading the situation, not matching a keyword. It sits alongside `03-clinical.md` §2.1's mis-filing catch as **the same judgment from the other side**, and both were marked ◑ for the same reason.

**When genuinely ambiguous, it does not ask.** It follows §2.1's judgment-calls rule: save with the sensible default, tag silently, surface once in the pre-cycle review when the student has context.
## 4d. New, specific to Volunteering (added Aug 2026)

**Andy's brief:** *"this would be like service or even things relating to my own interests, so if we try to specialize towards those, and think BEYOND just medical roles, there's so many things we can think of."*

**The premise these share:** Clinical is about a role you occupy. Volunteering is about **what you care about**, which means the pillar must handle things a medically-framed tracker would drop on the floor.

| # | Feature | AI | Why it belongs here and nowhere else |
|---|---|---|---|
| **V-7** | **The org is optional** | ◑ | **Expanded Aug 2026, see §4e.** The record shape assumes an organization, a supervisor, and a verifier. Real service often has none of them. |
| **V-8** | **What you bring, not what you observed** | ◑ | Clinical cut skills (R1) because observed/performed counts were false precision. **Service skills are a different thing**: teaching, a second language, music, coaching, cooking, carpentry, code. These are **identity, not competency scoring**, and they are the honest answer to *"why were you useful here?"* One free-text line per experience, same shape as `03-clinical.md` §2.6, different question. |
| **V-9** | **Shared background with the population served** | ○ | Optional, self-declared, **never inferred**. A first-generation student tutoring first-gen kids, or someone interpreting in a language they grew up speaking, has a materially different story than an outsider doing the same hours. Among the strongest essay material a pre-med has, and nothing in the app captures it. Never displayed as a credential. |
| **V-10** | **The throughline you did not name** | ● | W4 groups by the cause the student **selected**. This finds the one they did not: piano lessons, a food bank, and ESL tutoring look unrelated until something notices they are all **teaching**. Reads across experiences and reflections, proposes a theme in the student's own evidence. **Proposes, never assigns**, and it can be rejected. #45b's machinery pointed at the record instead of the reflections. |
| **V-11** | **Impact numerics** | ◐ | Clinical's #52 generalized, and it lands harder here. Service produces countable outcomes mentioned in passing: *"we served about 120 meals,"* *"raised $4k."* The AI reading reflections offers to tag them. **Not a leaderboard and not a score**, just the numbers that end up in a 700-character description anyway. |
| **V-12** | **One-time events are first-class** | ○ | W6 tags recurring vs event. The **copy rule** that must ride with it: a blood drive or a race is not a failed commitment. §2.4 rightly says sustained beats scattered, but that must never render as a scold on a legitimate one-day thing. **No "only one day" language anywhere.** **See §4h — the copy rule was honored and the layout still contradicted it.** |
| **V-13** | **Cause presets reach past health** | ○ | W3's population list is service-shaped, but the **cause** list must not quietly become medical. Environment, animals, arts, literacy, disaster relief, faith communities, civic and voter work, youth coaching, elder companionship. **A pre-med who volunteers at an animal shelter is not off-mission**, and a health-skewed list would imply they are. |

**Rejected while writing this section**, recorded so they are not proposed again:

- **A "find opportunities near you" search.** Needs a live external listings source HQ does not have, and it would go stale invisibly. #54's aggregate org directory is the honest version of the same impulse.
- **A cause quiz** (*"what do you care about? take this survey"*). Manufactured interests read as manufactured. Causes come from what the student actually logs, which is V-10.
- **Any "service hours needed" benchmark.** Same reason as C3: no sourced figure exists, and inventing one turns the pillar into bucket-filling.
### 4e. The org is optional: unconventional service (V-7, EXPANDED)

**Andy, Aug 2026:** *"a big part of this is incorporating any sort of role that may be unconventional or unorthodox, just allowing students to input what they want... definitely try and think of those outstanding circumstances."*

**The bug is an assumption, not a missing field.** Every entity in §4 is built around an organization: org name, supervisor, verifier contact, verification status. That shape fits a hospital volunteer program and quietly excludes a large amount of real service.

**Cases the current model cannot hold:**

| Situation | What breaks |
|---|---|
| **Caring for a grandparent, parent, or sibling** | No org, no supervisor, nobody to verify. Often the single most demanding commitment a student has |
| **Interpreting for immigrant parents** at appointments, banks, schools | Years of skilled, sustained work. No org ever existed |
| **Raising younger siblings** while parents work | Same |
| **Helping a neighbour**, driving an elderly relative, mutual aid | Informal by nature |
| **Something the student started themselves** | The "org" is them. There is no supervisor above them to verify it |
| **Faith or cultural community service** outside a formal program | Often unstructured, often deeply sustained |
| **Remote or online volunteering** (crisis lines, tutoring platforms, translation) | An org may exist but the relationship is thin, and a verifier may genuinely not know the student |

**Why this matters beyond inclusivity:** these are **disproportionately the records of students who had the least time for a formal volunteer role**, often because they were already carrying one. A model that silently drops them filters exactly the wrong people out of their own application.

**What the design has to do:**

- **Org becomes optional, not blank.** A record with no organization is **complete**, not a draft. No "missing" state, no amber chip, no data-health item.
- **Verifier becomes optional in the same way.** §7c's capture workflow **must not fire** on a record with no org, because there is nobody to capture. A student who cared for a grandparent should never be nudged to name a supervisor.
- **Type-to-create everything**, extending #8's role presets and #54's org directory. The student writes what the thing actually is, in their own words, and it is saved and offered back. **No dropdown of approved service types.**
- **The prep panel (#48) handles it at export time**, where AMCAS does want a contact. That is one moment of honest friction, not a permanent flag on the record.
- **Copy never implies a gap.** Not *"add an organization"*, not *"unverified"*. The absence is the truth of the experience, not an omission.

**One thing this is not:** a separate "informal service" category or a second record type. **Same record, optional fields.** Splitting it would create exactly the two-tier feeling this is meant to remove.
### 4f. The throughline you did not name (V-10, ELABORATED)

**The problem it solves.** W4 groups experiences by the cause the student **picked from a list**. That list is the student's own self-description, and self-description is exactly what people are worst at. A student looks at piano lessons, a food bank shift, and ESL tutoring and sees three unrelated things they happened to do. **They are all teaching.** Nobody told them that, and it is the single most useful sentence about their record.

**Why it needs AI (●), stated precisely.** It is not pattern-matching on tags, and it is not a theme-from-keywords job. **It has to derive the archetype of each activity**, then read what the student keeps choosing across them. Two steps, both requiring judgment.

### Step 1: the archetype, because the label carries almost nothing

**Andy, Aug 2026:** *"it would obviously be more about what the archetype of the activity is... they have to derive the actual substance of the events themselves or the positions."*

**Consider one org.** "Food bank volunteer" could be any of these:

| What they actually did | Archetype |
|---|---|
| Sorting donations in a back room | Logistics, largely solitary |
| Handing out meals at the window | Hospitality, face to face |
| Running the volunteer schedule | Coordination, responsibility for others |
| Teaching a nutrition class | **Teaching** |

**All four produce identical structured data**: same org, same cause (food insecurity), same population (low-income), same direct/indirect tag in most cases. **The tags cannot tell them apart, so the tags are not the input.**

The archetype comes from what the student *wrote*: the role title, V-8's "what you bring" line, the experience description, and the reflection threads. **This is why V-8 is a dependency, not a nice-to-have.** A record with a bare org name and no description is not archetypable, and the honest response is to say nothing about it.

**The archetype vocabulary is open, not a fixed list.** Teaching, accompanying, building, organizing, advocating, feeding, physical work, listening. **HQ must not own an enum here.** A closed list would force real activities into the nearest wrong box, which is the same mistake #12's classifier avoided by asking rather than guessing.

### Step 2: what they keep choosing

**The throughline is a fact about the person, not the activities.** Three experiences sharing an archetype is only interesting because **the student selected each one**. Nobody assigned them piano students, ESL learners, and an after-school program. They kept walking toward the same thing across unrelated causes, and that repeated choice is the finding.

**Two consequences:**

- **Weight repetition, not overlap.** Two experiences sharing an archetype is a coincidence. **Three or more, across different causes and populations, is a choice.** The more the surface context differs while the substance repeats, the stronger the read.
- **The output names the choosing, not the category.** Not *"your theme is education."* Closer to *"across three unrelated settings, you kept ending up teaching someone."* The first is a label; the second is about them.

### How it behaves

**When it runs:** at the same cadence as #45b's synthesis, term rollover or pre-cycle. **Never on add**, and never as a background process that surprises the student.

**What it reads:** experience titles, roles, the free-text "what you bring" line (V-8), and unpacked reflection threads. **Structured tags are the weakest input**, because they are the thing that already failed to see it.

**What it says:**

> Three of your experiences look unrelated by cause, but in all of them you were teaching someone: piano students, ESL learners, and the kids at the after-school program. That might be the throughline.

**What happens next, and this is the important part:**

- **It proposes. The student disposes.** They can accept it (which creates a cause or theme they can then group by), reject it, or ignore it entirely.
- **A rejected theme never returns.** Same permanence rule as #45a's marker and §2.1's "keep it here".
- **It never overwrites W4's causes.** The student's own cause tags stay exactly as they set them. A theme is an **additional** lens, not a correction.
- **It cites its evidence.** The proposal names which experiences it drew from, so the student can judge it rather than trust it.

### Guardrails

- **Silent when there is nothing there.** A student with three genuinely unrelated experiences gets **no proposal**, not a strained one. `01` §6.10-A: dormant with a reason beats a manufactured insight. **This is the failure mode to watch**, because a model asked to find a pattern will always find one.
- **Minimum three experiences**, and only ones with **real descriptive material**. Two things always look related, and a bare org name cannot be archetyped at all.
- **Thin records are skipped, not guessed at.** If two of four experiences have nothing written beyond a title, the pass runs on the two it can read or does not run. **It never infers an archetype from an org name**, because "food bank volunteer" genuinely does not say what the person did.
- **The archetype is never stored as a field on the record.** It is derived at synthesis time and lives in the proposal. Persisting it would turn a reading into a label the student never chose, and the next pass would then be reasoning about its own earlier guess.
- **Never a "your story is scattered" verdict.** The absence of a throughline is not a finding and must never be reported as one. Some students genuinely do unrelated things and that is allowed.
- **Never fed by hours.** A throughline is about content, and weighting by hours would just surface whatever they did most.

**Where the output goes:** Story Bank, as its own tagged item, alongside #45b's synthesis threads. It is essay material, not a dashboard metric, and it must never appear as a stat on the headline strip.
### 4g. One activity, one entry, one place (V-6 RESOLVED, and W7 simplified)

**Andy, Aug 2026:** *"if you think about this from the AMCAS perspective, what do you think they'll see? They see an activity. There's no way it's gonna be in both categories at the same time... There's no splitting halves of an event... if it's one entry, it's grouped into one place."*

**This dissolves the question rather than answering it.** The board framed V-6 as a conflict: what happens when route-to-Clinical and the EC catch both fire on one record? **There is no such state.** A record has one category. It renders in one pillar. It exports as one AMCAS entry. **Nothing was ever going to be in two places, so nothing needs arbitrating.**

**What the classifiers actually do**, stated correctly:

- They **propose a different home** for a record, one at a time.
- The student accepts or declines.
- **The record moves or stays. It never splits, and it is never in two pillars at once.**
- §2.0's hour ownership already guaranteed this. The "collision" was a misreading of it.

**The piano case, resolved by §4c and nothing more:** direct contact plus no medical context means it stays in Volunteering. **No banner fires**, so there is no second classifier to conflict with.

### W7 is cut down to a duplicate check

**Andy:** *"if we're cross-linking, it won't make sense in terms of AMCAS export, so why even do it? It's nice to track, but it's just gonna make things confusing."*

**Correct, and the reason is worth keeping.** W7 existed to stop a service club being counted twice, once in Volunteering and once in Extracurriculars. **But one record only ever lives in one pillar**, so the double-count it guarded against cannot happen. The cross-link was machinery for a problem the data model already prevents, and it would have produced an export nobody could interpret.

**What remains is smaller and genuinely useful:**

- **A duplicate-entry catch at add time.** If the student is adding something that looks like a club already recorded in Extracurriculars, say so: *"You already have Habitat for Humanity in Extracurriculars. Same thing, or separate?"*
- **Either answer is fine.** Same thing means they pick which pillar it belongs to. Separate means two genuinely different records, which does happen.
- **No link is created either way.** No cross-references, no shared entity beyond the org itself (which is already shared via #54).

**Cut for good:** the cross-link relationship, any "counted in Volunteering" attribution line on an EC record, and any UI showing one experience in two pillars.


---

## 4h. The one-time event breaks the org-card hero (V1, Aug 2026)

**The contradiction.** V-12 rules that a one-off is first-class and bans *"only one day"* copy. **§5a's layout says it anyway:** the hero is a card per Experience, so **a student with eight one-day events gets eight cards each holding one session**, sitting beside a headline reading `longest 18 mo`. **The copy rule is honored and the structure contradicts it.**

### The diagnosis: the card is the wrong shape, not the content

**A card answers *"what is my relationship here?"*** — role, cadence, longevity, verifier, a session log. **A one-off has no relationship.** It has a date and a thing you did. **A card holding one session is a mostly-empty card**, and eight of them read as eight abandoned commitments no matter what the copy says.

### And AMCAS already models the answer

**15 entries, maximum** (`03-clinical.md` §7b, verified). **Nobody submits eight one-day events as eight entries** — they combine into a single entry, described together. **So grouping them is not a UI convenience that diminishes them; it is what the student will actually submit.** That reframes the question entirely: grouping events is the app being honest about the application.

### The ruling

| | |
|---|---|
| **Standing commitments** | **Keep cards, and lead.** Unchanged |
| **One-off events** | **Rows inside ONE grouped block**, not eight cards |
| **That block's headline** | **Its own real total** — `6 events · 34 hrs` — never a consolation line |
| **Naming** | **`One-day events`. Never "Misc", "Other", or "Uncategorized"** — those are bins, and V-12 forbids the register |
| **The longevity headline** | **Reads across standing commitments only.** `longest 18 mo` sitting beside eight events was the specific insult |

### The graduation mechanic — this is what handles the Turkey Trot

**An annual one-day event is not a one-off. It is a multi-year relationship expressed once a year**, and it is common in service: the same race, the same drive, every November.

**Rule, deterministic and `○`:** when an Experience tagged `one-time event` **gains a second session**, HQ offers to re-tag it `recurring` and promote it to a standing card. *"You came back to this — want to track it as an ongoing commitment?"*

- **Offer, never auto-move**, consistent with #12–15's flag-and-offer rule.
- **Deterministic. No AI, no threshold to source.** Two sessions is the entire test.
- **It rewards the pattern this pillar exists to reward — you returned — without scolding the student who did not.**

**Draw it, do not prose it.** V1 is right that this belongs in the variant lab: whether events read best as a grouped block, a table, or a dated strip is a layout question, and prose will not settle it.

## 4i. Activity belongs on the session, not only the Experience (V2, Aug 2026)

**V-10's premise applies inside one org, not just across orgs.** *"Food bank volunteer"* could mean sorting boxes alone or teaching a nutrition class — **and a campus service club does something different every month.** Today all of it collapses into one Experience-level cause chip.

**Add one optional free-text line per Session: what you actually did that day.**

- **Precedent exists and R1 does not block it.** R1 cut *structured skill entities*; `03-clinical.md` §2.6 kept **"one optional free-text line in the student's own words."** This is that shape at session scope. **No presets, no chips, no grid** — the moment it gains structure it becomes the skills tracking R1 removed.
- **Distinct from the reflection.** Activity is *what I did*; reflection is *what it meant*. Collapsing them loses both.
- **Costs nothing at log time.** Optional, one line, inside the existing fast-add row; the 5-second rule holds.
- **It is the best material V-10 could get.** Deriving an archetype from twelve session lines beats deriving it from one org name.

## 5. Explicitly rejected, carried from Clinical

These were settled on Clinical and bind here without re-argument (`03-clinical-board.md` §5): streaks · a blended readiness score · comparison to other applicants · silent auto-classification · **any PHI field** · scraping org portals · a second calendar.

**One addition specific to this pillar:** **no "cause diversity" score.** A student devoted to one cause for four years has a *better* record than one who sampled six. Scoring breadth here would invert the pillar's own thesis, the same way #36's setting mix inverted Clinical's.

---

## 6. What this board does not do

It does not re-open W1 through W7, which are specced and sound. It does not renumber anything: **Volunteering gets its own catalog with its own numbering**, and inherited features are referenced by their Clinical number so the lineage stays visible.
