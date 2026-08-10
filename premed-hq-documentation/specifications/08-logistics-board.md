# Logistics: HQ as a guide, not only a tracker

**Status:** Board (Aug 2026). **Reference index, not spec.**

**Andy, Aug 2026:** *"Premed HQ, right now, one of its fatal flaws is that it obviously acts as a tracker, but it should also be used as a logistical guide… I literally want you to think of every single thing. If you think of a daily life in premed, you're going to have to think of everything… Not only are you thinking too low in scope, but you're thinking too low in terms of practicality."*

**The distinction this file exists to close:**

> **A tracker answers *what have I done*. A guide answers *can I actually do this*.**
>
> **HQ currently does the first one very well and the second one almost not at all.**

---

## 1. What already exists, and the three holes in it

**`WeeklyCapacity` is real and well-designed** (`00-product-shell.md` §11b, GOVERNING). Shell-owned, `hoursByWeekday[7]` plus `busyPeriods[]`, and both plan generators register **claims** against one pool rather than scheduling freely. Its own line: *"the clearest 'only HQ can do this' capability in the product."*

**It is right, and it is incomplete in three specific ways.**

### Hole 1 · Only two tabs claim. Five tabs eat hours invisibly.

**The claims table lists Academics and MCAT. That is all.**

**So a student with a 12 hr/week clinical commitment, a weekly volunteering shift, an officer role, and 6 hours in a lab has roughly 25 hours a week that the capacity system cannot see.** The two tabs that plan carefully bid against each other over a pool that three other tabs are quietly draining.

**Fix: every pillar registers claims.** A recurring commitment is a claim — that is what Extracurriculars' cadence field (E-7) actually produces, and what a clinical shift pattern already is. **This is not a new system; it is five more consumers of one that exists.**

### Hole 2 · It is a weekly *shape*, so it cannot see *when*.

`hoursByWeekday[7]` says Tuesday has 6 hours. **It cannot say whether that is one 6-hour block or six 1-hour fragments**, and those are entirely different weeks.

**Why it matters concretely:** you cannot take a full-length MCAT practice exam in 45-minute pieces. **`02` §3.6 schedules full-lengths as 7.5-hour objects that need contiguous time**, and the capacity model it draws from does not represent contiguity at all.

**Fix: capacity needs blocks, not just totals.** *"Tuesday: 9–11, 14–15, 19–22"* — which the calendar HQ already reads can produce.

### Hole 3 · No travel. None. Anywhere.

**Every record has a place and HQ knows none of them** (`07-campus-layer-board.md` §3). **A gap between classes is not free time if the next thing is a 20-minute walk away**, and nothing in the app can tell you that.

---

## 2. Every single thing — the inventory

**Andy asked for exhaustive, so this is the attempt.** Grouped by the scale at which it bites. **Not all of these become features; the point is that none of them are currently modelled.**

### 2a. Within a day

| Friction | Why HQ misses it today |
|---|---|
| **Travel time between commitments** | No locations, no distances |
| **How you travel** — walk, Chapel Hill Transit, bike, drive | **The bus is the real transport for most students**, runs on fixed routes and times, and is free. **A "20 minute" gap is different if the bus comes every 30** |
| **Parking** — permit, cost, availability, how far the lot is from the building | Genuinely hard at UNC and a real determinant of whether an off-campus commitment is possible |
| **Elevation** — UNC campus is not flat | Walking estimates that ignore it are wrong in one direction |
| **Meals** | **A 12–3 shift eats lunch.** Nothing models the fact that a person has to eat |
| **Fragmented vs contiguous time** | Hole 2. Four separate hours is not a four-hour block |
| **Time-of-day quality** | A 10pm study hour is not a 10am study hour, and the plan treats them identically |
| **Getting home after a late shift** | Bus service thins at night; this is a safety and feasibility question, not a preference |

### 2b. Within a week

| Friction | |
|---|---|
| **The one 8am that ruins everything** | An early class after a closing shift is a structural problem, not a discipline problem |
| **Recurring collisions** | A club that meets Tuesdays and a shift that recurs Tuesdays — **HQ holds both and compares them nowhere** |
| **Day-shape imbalance** | Three empty days and two impossible ones is a schedule most students would fix if they could see it |
| **Where the week's slack actually is** | §11b reserves slack from the pool, but not *when* |

### 2c. Within a semester

| Friction | |
|---|---|
| **Exam clustering** | Three midterms in one week is knowable months ahead from syllabi (`A-BIG-1`) |
| **Registration windows** | Miss one and a whole term's plan changes |
| **Add/drop and withdrawal deadlines** | The last honest moment to fix an overloaded term |
| **Breaks** | Shifts stop, labs close, clubs pause — **and the plan should bend rather than accrue debt** (§11b already says this; nothing supplies the dates) |
| **The dedicated-study period** | MCAT dedicated overlapping a term is exactly what §11b was built for |

### 2d. Across years

| Friction | |
|---|---|
| **MCAT date vs semester load** | `M-BIG-1`. Knowable at the moment the date is chosen |
| **Application-year time drain** | Secondaries arrive in a burst; interviews mean travel and missed commitments |
| **Interview travel** | Days lost, flights, and every recurring commitment disrupted |

### 2e. The constraints premed tools pretend do not exist

**These are the ones I would have skipped, and they are the most important in this file.**

| | |
|---|---|
| **Paid work is not optional for many students** | **A student working 20 hrs/week to afford school has 20 fewer hours, and that is a circumstance, not a character flaw.** Every "you should do more clinical hours" nudge in every premed tool is aimed at someone who cannot |
| **Not having a car** | Rules out most off-campus clinical, shadowing, and research. **A recommendation engine that ignores this recommends impossible things** |
| **Cost of a parking permit, prep materials, application fees** | Real constraints on real plans |
| **Caregiving and family responsibility** | `07` §2.4 already says these count as activities. **They also consume the week**, and only the first half is modelled |

> **The design consequence, and it is a rule rather than a feature:** **HQ must be able to represent a student whose week is mostly spoken for by things that are not premed.** If the only expressible schedule is one with abundant free time, the app is built for the students who need it least.

---

## 3. The features, with depth

> **Correction, Aug 2026.** An earlier version of this section listed six features in four lines each. **Andy:** *"What do you think I meant when I said 'think of everything'? I meant think of everything in terms of features that you can think of that have depth."*
>
> **He is right and it was the same failure as before, one level up** — §2 above is an inventory of *problems*, and a list of six thin *solutions* underneath it is still breadth pretending to be thoroughness. **Fewer features, each worked out.**

---

## `L-A` · THE REAL WEEK — the feasibility engine

**The feature Andy remembers wanting:** *"it calculated a period of time in which you could feasibly study, and as it detects commitments in your Google Calendar, it adjusts and changes it so that you can maybe change your study plan."*

### What it actually is

**Not a number. A picture of the week you actually have**, with everything already spoken for subtracted, **recomputed the moment anything changes.**

**`WeeklyCapacity` today says "Tuesday: 6 hours." L-A says:**

> **Tuesday** · `08:00–09:15` class · `09:15–09:40` walk to Davis · **`09:40–11:00` open, 80 min** · `11:00–12:15` class · **`12:15–13:00` open, but this is lunch** · `13:00–17:00` clinical shift · `17:00–17:45` bus home · **`19:00–22:00` open, 3 hrs contiguous**

**The three things that make it different from a calendar:** it knows travel is not free, it knows a 45-minute gap is not a study block, and **it knows which of those open blocks is big enough for the thing you are trying to schedule.**

### RULED (Andy, Aug 2026): there is no surface. `L-A` is an engine.

> *"I would really prefer this to be an engine that works behind the scenes, and shows up as a descriptor or as a popup whenever necessary."*

**The week grid below is retired.** It failed the same test the campus map failed: **you already know your week.** A dense grid you visit is a picture of information you have; **the value is the arithmetic, delivered where a decision is being made.**

**And Overview stays at eight blocks.** A permanent `19 hrs open` tile on the home screen **becomes a target no matter how it is worded** — which is precisely what §4 bans, and the ban is easier to keep if the number is not parked where you see it daily.

### The two shapes it may take — and the rule that decides

| | | |
|---|---|---|
| **Descriptor** | **A quiet line on something you are already looking at.** No interruption, always present, never dismissible because it is not an event | **Facts about a place or a fit** |
| **Popup** | **The existing bell.** Never a new notification system, never a blocking modal | **Only when it prevents a mistake, or when something already broke** |

> **THE RULE: descriptor for facts, popup only for a mistake about to happen or a plan that just broke.** Everything else stays silent.

### What it actually says — the complete caller list

**This is the whole feature. If a line is not here, `L-A` does not say it.**

| Caller | Shape | The line |
|---|---|---|
| **`EV-1` prospect** | Popup (bell) | *"Nothing scheduled. Your last thing ends 5:15 in Caudill — 7 min walk."* |
| **Adding a commitment** | Descriptor, under the time field | *"This starts at 1:00. Your Tuesday class ends 12:15 in Caudill, and this is in Durham — about 35 min driving."* |
| **Scheduling an MCAT full-length** | Descriptor | *"Saturday is your only 7.5-hour block this week."* — or, honestly: *"No 7.5-hour block this week. Your longest is Sunday, about 4 hrs."* |
| **A record's detail** | Descriptor, stated once | *"About 18 min from campus. Bus every 20."* |
| **A calendar event lands and breaks a plan** | Popup (bell) | *"Thursday's 3-hour block is now 40 minutes. Your Thursday content review doesn't fit."* **The named casualty, never a generic warning** |
| **A plan generator asking for hours** | **Silent** | **Nothing. It receives blocks instead of daily totals and the student never sees this happen** |

**The largest caller says nothing at all**, and that is the clearest evidence this is an engine rather than a feature.

**Consequence, stated plainly: the fragment count mostly never appears.** It was called *"the number nobody has ever been shown"* — under this ruling it shows up **inside the "this doesn't fit" moment and nowhere else.** That is the correct trade. **A number worth seeing once is not a number worth mounting on the home screen.**

### The retired surface — kept for the reasoning trail

> ⚠️ **SUPERSEDED.** Retained because the segment *typing* below still describes what the engine computes internally — claimed, travel, open, protected — even though none of it is drawn.

**A week grid, and the only graphic in the app that is deliberately dense.** Rows are days, and each day is a stack of typed segments — **claimed** (per-pillar `--cat-*` colour), **travel** (hatched, never a solid block, because it is time you did not choose), **open** (the app's ground), and **protected** (sleep, meals — see below).

- **The headline is the honest one:** `19 hrs open · longest block 3 hrs · 4 fragments under 45 min`. **Fragment count is the number nobody has ever been shown**, and it is usually the reason a study plan failed.
- **Hover any open block** → what fits in it. *"3 hrs — enough for a full CARS set, not a full-length."*
- **Hover a travel segment** → mode, distance, and which two things it sits between.

### The interaction that matters

**Not "here is your week." It is "will this fit?"** — **and after the engine ruling above, that is the only thing left, which is the point.**

- ~~**Dragging a proposed commitment onto the grid** shows what it displaces before it is committed.~~ **Dead with the grid.** **Replaced by the descriptor on the add form**: the fit is stated in words at the moment of adding, not demonstrated by dragging.
- **A plan generator asking for hours gets real blocks back**, not a daily total — which is what lets MCAT schedule a 7.5-hour full-length honestly for the first time (`02` §3.6).
- **When a Google Calendar event appears, the grid recomputes and says what broke.** *"Thursday's 3-hour block is now 40 minutes. Your Thursday content review does not fit."* **Naming the specific casualty, not a generic warning.**

### Protected time — the part every planner gets wrong

**Sleep and meals are not open time, and treating them as available is how these tools produce plans nobody follows.**

- **A default sleep window and meal windows exist from first run**, editable, and **rendered as protected rather than open.**
- **A commitment that eats a meal window is shown doing so** — *"this shift runs 12–3, through lunch"* — **as a fact, not a warning.** Plenty of people work through lunch on purpose.
- **Nothing is ever auto-scheduled into protected time.** The student may do it manually; HQ never proposes it.

### States, because this feature lives or dies on partial data

| Situation | Behaviour |
|---|---|
| **No calendar connected** | **Works.** `WeeklyCapacity`'s weekly shape is the fallback; the grid is coarser and says so |
| **No locations recorded** | **Travel segments simply do not appear.** No estimates, no guesses, **and no nagging for addresses** |
| **One commitment missing a time** | It appears as an all-day band rather than being silently dropped |
| **Nothing recorded at all** | The empty state shows **an empty week**, not a full one — *"add a class or a commitment and this fills in"* |
| **A week with almost nothing open** | **Rendered plainly and without comment.** No red, no warning, no *"you're overloaded"* — that is §4's line |

### What it must not do

- **Never rearrange the week.** It reports; it does not optimise a life.
- **Never colour an open block as "wasted."**
- **Never a utilisation percentage.** *"You used 64% of your week"* is a productivity score and `04` bans invented composites.
- **Never a nudge to fill an open block.** §11b already forbids this and **better data makes the temptation stronger.**

**`○` deterministic. No AI anywhere in it.**

---

## `L-B` · CAN I GET THERE — travel as a constraint, not a display

**Depends on locations existing** (`07-campus-layer-board.md` **§3c** — §3's plotted surface was retired Aug 2026; **§2d confirmed this line: the map is not the feature, this is**).

> **Aug 2026 — `L-B` gained its first real caller.** Extracurriculars' **event prospecting (`EV-1`)** asks exactly this question: *"nothing scheduled, your last thing ends 5:15 in Caudill, seven minutes away."* **That sentence is `L-A` and `L-B` in one line.** **One calculation, two callers — build it once.**

### The single output that justifies the whole thing

> **Telling a student a commitment is impossible *before* they take it.**
>
> *"This shift starts at 1:00. Your Tuesday class ends 12:15 in Chapel Hill, and this is in Durham — 35 minutes driving, and you do not have a parking permit there."*

**Nothing else in HQ can prevent a bad decision at the moment it is being made.** Everything else in the app is retrospective.

### How it works

- **Each location carries a mode** — walk, Chapel Hill Transit, bike, drive — **because a 1.2 mile gap is 25 minutes walking and 6 minutes driving**, and the answer changes the decision.
- **Transit is not distance.** A bus route running every 30 minutes means the honest number is *"12 minute ride, up to 30 minutes waiting."* **Both are reported; averaging them is a lie.**
- **Driving carries parking as a real cost** — permit or not, lot distance from the building, and the walk from the lot. **At UNC this is frequently the deciding factor and no tool models it.**
- **Elevation matters on this campus.** A walking estimate that ignores it is wrong in one direction only.

### Where it appears

**Three places, and never as a standalone screen:**

1. **Inline in the week grid** (L-A) as hatched segments.
2. **At the moment of adding a commitment** — the feasibility line, above.
3. **On a record's detail** — *"18 min from campus, bus every 20."* **A fact about the place, stated once.**

### The failure modes, stated honestly

- **Travel estimates are wrong sometimes.** Rendered as *"about 20 min"*, never `20`, and **never used to hard-block anything** — the student may always proceed.
- **A student with no car**, recorded once (L-C), **changes every estimate in the app**, and off-campus recommendations must respect it or they are recommending impossible things.
- **Weather, construction, and a missed bus are real and unmodellable.** The number is a planning aid and the copy says so.

**`◐`** — the arithmetic is deterministic; route data is Category A and needs sourcing (§5, L-b).

---

## `L-C` · CIRCUMSTANCES — the inputs that change everything downstream

**The most important feature in this document, and the least visible.**

### What it holds

**Four facts, none of them premed:** hours worked for pay · whether the student has a car · caregiving or family responsibility · where they actually live and commute from.

### Why it is a feature and not a settings page

**Because everything reads it:**

- **`L-A`** subtracts paid work as claimed time — **not as a "commitment" the student chose, but as a constraint they are under.**
- **`L-B`** stops estimating driving times for someone without a car.
- **The opportunity engine** (`07-campus-layer-board.md` §4) **stops recommending an unpaid position 25 minutes off campus to someone working 20 hours a week.**
- **Every pace projection** across every pillar reads a real week instead of an imagined one.

### How it is captured — and this is the hard part

**Never a wizard. Never an onboarding questionnaire.** These are the most intrusive questions in the app and the highest-value answers, **and a signup form asking about someone's finances before they have seen the product is the wrong trade.**

**Captured where they become relevant, once, and skippable:**
- The first time a plan is generated: *"anything else taking up your week? A job, family, a commute?"* — **one line, optional, dismissible forever.**
- The first off-campus recommendation: *"do you have a car?"* — **because that answer changes the recommendation being made right now.**

**Every field stays blank permanently if the student wants**, and nothing is ever re-asked.

### The rule this feature exists to enforce

> **HQ must be able to represent a student whose week is mostly spoken for by things that are not premed.**
>
> **A student working 20 hours a week to afford school has 20 fewer hours. That is a circumstance, not a character flaw** — and every "do more clinical hours" nudge in every competing tool is aimed at someone who cannot.
>
> **If the only expressible schedule is one with abundant free time, the app is built for the students who need it least.**

**`○`. And it is never displayed back as a deficit** — no "you have less time than peers," no comparison, ever.

---

## `L-D` · WHAT THIS COSTS — and what you do not have to pay

**Andy, Aug 2026:** *"finances important too right"* — **yes, and this is the one place HQ can prevent measurable, irreversible harm to a specific student.**

### The problem, stated with the real numbers

**Applying to medical school costs thousands of dollars, and almost all of it is invisible until it arrives.** Verified Aug 2026 against [AAMC](https://students-residents.aamc.org/fee-assistance-program/fee-assistance-program):

| | |
|---|---|
| **MCAT registration** | ~$345 standard · **$145 with fee assistance** |
| **AMCAS** | first school, then a smaller fee per additional school — **twenty schools runs to roughly a thousand dollars** |
| **Secondaries** | **$75–150 each. This is the ambush.** They arrive within days of verification, **all at once**, and twenty of them is $1,500–3,000 that nobody budgeted for |
| **Interviews** | Travel, hotels, clothes |
| **Prep materials, transcripts, additional services** | Accumulating quietly for two years |

### The single highest-value thing in this feature: the FAP sequencing trap

**The AAMC Fee Assistance Program is worth over $2,000** — reduced MCAT registration, the Official Prep bundle, a two-year MSAR subscription, and **AMCAS fees waived for up to 20 school submissions.**

**And it has an ordering rule that costs real money to get wrong:**

> **AAMC:** *"If you are awarded fee assistance, you cannot apply your benefits to previous registrations or purchases. If you register for the MCAT exam before receiving your fee assistance benefits, you will not be reimbursed for the discounted rate."*

**A student who registers for the MCAT before applying for FAP permanently loses ~$200 and gets nothing back.** It is a pure sequencing error, it is completely avoidable, **and nobody tells students about it at the moment they are clicking register.**

**HQ knows when a student is about to set an MCAT date. That is the moment to say it, once.**

### The second-highest: most students who qualify assume they do not

**Eligibility is family income at or below 400% of the federal poverty level.** For a household of four that is well over $100,000 — **a far wider net than the phrase "fee assistance" suggests**, and the reason qualified students never apply is that they assume it is for someone poorer than them.

**So the copy must never imply a threshold or invite self-assessment.** Not *"if you have financial need."* **The honest version states the actual bar and lets the student check** — *"eligibility is family income up to 400% of the federal poverty level, which is higher than most people expect."*

**Application opens 2 February and benefits last until 31 December of the following year** — which makes it a **roadmap node**, not a notification (`11-timeline-tasks.md`).

### The school list is a budget decision, and no tool presents it that way

**Adding a school is roughly $45 in AMCAS plus $75–150 in secondaries.** Going from 15 schools to 25 is **around a thousand dollars**, decided in an afternoon, usually without the number ever being visible.

**So: the running total lives on the School List, updating as schools are added or removed.** Not a warning. **A number that is present while the decision is being made.**

**And it interacts with FAP directly** — the waiver covers 20 submissions, so **school 21 is where the student starts paying**, and that is a genuinely useful thing to see at the moment of adding it.

### What the surface actually is

**Not a budgeting app. Three things:**

1. **A running picture** — spent so far, committed, and what is coming based on where the student is in the cycle. **Anticipated costs are ranges, never point estimates** (`01` §6.12).
2. **The secondary projection**, which is the one nobody sees coming: *"if all 22 schools send secondaries, that is roughly $1,900, arriving within about two weeks of verification."*
3. **Fee assistance status** — not applied · applied · approved · not eligible — **with the sequencing warning live until the MCAT is registered.**

### Guards — this is the most sensitive data in the app

- **Never judge spending.** No "that's a lot," no budget advice, no suggestion to apply to fewer schools. **Where to apply is a life decision with consequences far past money, and HQ has no standing in it.**
- **Never compare to other students.** Not average spend, not "most applicants spend X."
- **Never assume ineligibility.** The failure mode is students self-excluding; **HQ states the bar and never guesses on their behalf.**
- **Income is never stored.** **Eligibility is not computed** — HQ links to the AAMC tool and records only a status the student sets themselves.
- **All amounts are Category A** — sourced, dated, `freshness`-tracked (`data-refresh.md`), because **they change every single year** and a stale figure here is worse than none.
- **localStorage-first matters more here than anywhere else in the app.** This is the one dataset a student would be genuinely upset to have leak.

### States

| | |
|---|---|
| **Nothing entered** | **Dormant.** No empty budget shell, no prompt to enter finances |
| **FAP status unset, MCAT date being chosen** | **The one proactive moment.** Stated once, dismissible, never repeated |
| **FAP approved** | Costs recompute; the 20-school waiver line appears on the School List |
| **Past the application year** | **The whole surface goes quiet.** It is not a permanent expense tracker |

**`○` deterministic throughout. No AI, no estimation model — published fees and arithmetic.**

---

## 4. What must not happen

- **No judgment of the total.** State it; do not rate it. Free-reign principle, `07` board.
- **No "you have free time" nudges.** §11b already forbids this and it must survive contact with better data — **more accurate free-time detection makes this temptation stronger, not weaker.**
- **No optimising someone's day for them.** HQ says *"this does not fit"*; it does not rearrange a life.
- **No guilt for a small week.** A student working 20 hours has a small week. **The app reports capacity, never a deficit.**
- **Never a productivity score, a utilisation rate, or a "% of your week used."**

---

## 5. Open

| # | |
|---|---|
| ~~**L-a**~~ | **RULED Aug 2026: per-commitment, defaulting from the profile.** A profile-only setting is wrong — students bus to the hospital and walk to class, and forcing one mode makes every second estimate a lie. **A per-commitment setting the student must fill in for every record is worse** — it is a required field serving an optional feature. **So: the profile holds a default (`L-C` already records whether they have a car), each record may override it, and an unset record uses the default silently.** No prompt, no nag |
| ~~**L-c**~~ | **RULED Aug 2026: never a wizard**, as leaned. Captured where each fact becomes relevant, one line, optional, dismissible forever, never re-asked. **Already written into `L-C`** |
| ~~**L-d**~~ | **RULED Aug 2026: always yes — the student may always proceed.** Free reign. **HQ says *"this doesn't fit"*; it never refuses.** This is the same line as the sufficiency call, the target bans, and `Nothing scheduled` — **HQ may decline to assert, it may not withhold a capability** |
| **L-b** | **Chapel Hill Transit route data — does a usable source exist**, and at what refresh cadence? **Still open, and it is a research-agent ask** (`07-campus-layer-board.md` §7 ask 1). **`L-B` degrades without it**: walking and driving estimates are pure arithmetic on coordinates and work today; **transit is the one mode that needs sourced data**, and until it exists HQ should say *"about 25 min walk"* and stay silent about the bus rather than guess a headway |
