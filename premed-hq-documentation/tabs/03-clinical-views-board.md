# Clinical: the views board (structure, not features)

**Status:** Aug 2026. **All structural rulings made.** Companion to `03-clinical-board.md` (which brainstormed *features*) and `03-clinical-feature-catalog.md` (which numbers them).

**The rulings in one line:** Clinical gets **three flat sub-tabs on the MCAT model** (`Sites` · `Shifts` · `Reflections`), no Daily/Planning mode switch above them, and **the AMCAS export preview moves to Profile/CV** with only a phase-gated prep panel left behind.

**Two rulings here constrain files that do not exist yet.** `09-essays-story-bank.md` must be built as an aggregate view over pillar-owned reflections rather than a store that receives copies (V5), and `12-profile-cv.md` must own the cross-pillar export preview (V3). **Both are unspecced scaffolds.** If those tabs get written without these constraints, the work here is undone silently.

---

## Why this file exists

`03-clinical.md` has 64 catalog items and **zero sub-tabs**. Everything specced across Waves 1 to 8 is a panel, a rule, or a behavior sitting on **one master-detail page**, plus three full-screen flows (#45a, #45b, #48).

Compare what the two mature tabs actually look like:

| Tab | Structure |
|---|---|
| **Academics** | Two modes (Daily / Planning), each with its own tab set. Roughly 20 named surfaces: Class Center, Assignments, per-class hub (**with five sub-tabs of its own**), Planner & GPA, Requirements, Grades & Archive, recall runner, exam prep mode, syllabus ingestion |
| **MCAT** | Seven flat sub-tabs: Dashboard, Plan, Content, Questions, Mistakes, Stats, Advisor |
| **Clinical** | One page |

Andy, Aug 2026: *"something as big as academic's tar heel tracker could just be yet to be specced in clinical and it just hasn't yet."* Correct. This file looks for those.

**The standing constraint:** *no new tabs* (`02-mcat.md` §3.11 restates it as locked). Clinical stays one sidebar entry. The question is whether it earns **sub-tabs inside** that entry, the way MCAT did.

**The test each candidate must pass:** does it answer a question the current page structurally *cannot*, or is it a panel that would fit on the page we already have? A candidate that fails this is a feature, not a view, and belongs in the feature catalog instead.

---

## 1. Confirmed structural gaps (found by inspection, not brainstormed)

These are not ideas. They are questions the specced app cannot currently answer.

| # | Gap | Why it is structural |
|---|---|---|
| **V1** | **No way to see all shifts at once.** The shift log lives *inside* the selected-site detail panel (§5), so shifts are only ever viewable one site at a time. | *"What did I actually do in March?"* is unanswerable for a student working two jobs. Academics has **Grades & Archive** as exactly this kind of whole-record ledger. Clinical has no equivalent. |
| **V2** | **Certifications have a homeless case.** §4 defines a Certification as belonging to *"an Experience **or the profile**"*, but §5 only ever renders certs inside a site's detail panel. | A BLS card not tied to one job has **nowhere to exist in the UI**. This is a spec-internal contradiction, not a preference. |

---

## 2. Candidate views, for Andy to rule on

Ordered by how much structure they add.

### V3: application prep. **RULED (Andy, Aug 2026): split it. Profile owns the preview; Clinical keeps a phase-gated prep panel, not a sub-tab**

**#48 had accumulated too much for one place.** It absorbed the rejected hours-map's four elements, then §7b's three consequences (anticipated-hours split, repeated-entry merge, cross-pillar 15-entry cap), then judgment-call review (#13), paid/volunteer breakdown (#17), and most-meaningful candidacy (#49).

**The name was the tell.** Andy: *"it's just misleading because application implies the entire application."* Correct. "Application" promises schools, essays, letters, MCAT, and transcripts. What was actually there is *Work & Activities entries for one pillar*.

**The split, by what each surface can structurally see:**

| Owner | Holds | Why it must live there |
|---|---|---|
| **Profile/CV** | The **export preview** itself. The **15-entry cap** across all five pillars, cross-pillar merging and prioritization, most-meaningful selection (#49). | The cap is **application-wide**. Clinical competes with Volunteering, Shadowing, Research, and Extracurriculars for the same fifteen slots. **No pillar-scoped surface can render that**, by definition. Profile/CV is already the cross-pillar aggregator (`05` §5). |
| **Clinical** | **Prep only:** unresolved judgment calls (#13), missing verifiers (§7c), 700-character descriptions, completed/anticipated split, repeated-range merging within clinical records. | This is *getting clinical's own records right*, which is pillar-specific work and belongs where the records live. It is not assembling an application. |

**Not a sub-tab. A phase-gated panel on `Sites`.** Direct precedent: `02-mcat.md` §3.11 ruled Test Day *"a phase-gated panel on Dashboard, rendered only when a phase is open"* rather than its own surface. Same reasoning, same answer.

**Consequences:**

- **Clinical has three sub-tabs, not five.** With V4 also ruled down to a section, this directly answers the §3 counter-argument about adding weight to what is fundamentally a log.
- **The naming problem dissolves.** A contextual prep panel needs no tab label, so nothing over-promises.
- **It is invisible outside the cycle**, appearing as the application year approaches and deep-linking to Profile for the whole picture.
- **`12-profile-cv.md` is an unspecced scaffold.** This ruling constrains it, the same way V5 constrains Story Bank. **Record it there when that tab is specced**, or #48's cross-pillar half has no owner.
- **The same phase-gated prep pattern should repeat on the other four pillars** rather than each inventing its own. Not specced there yet; noted so it is not reinvented per pillar.

### V4: credentials. **RULED (Andy, Aug 2026): a section on `Sites`, not a sub-tab**

Andy: *"most people probably have four certs, and it's not really necessary to put in the entire tab."*

**V2 is still resolved**, which was the actual requirement. The section groups by site, with a **"Not tied to a site"** group at the bottom for profile-level credentials like BLS. That group is the whole point: a cert you hold personally had nowhere to exist when certs only rendered inside a site panel. Mockup: `mockups/04-clinical/clinical-subtabs.html` frame 3.

**What the catalog contributed:** only **3 features** (#20, #21, #22) ever attached to Credentials. The Surface column made that visible before anything was built, which is what the column was added for.

**The argument for a tab, recorded because it was real:** credentials are the only thing in this pillar that **expire on a clock the student does not control**, and R6 means nothing else in the app reacts to them. That remains true. It just does not require a tab to be true, and a section on the default landing surface is *more* visible than a tab nobody opens.

**Andy's second point, which generalizes past this decision:** *"credentials would already be exported as part of the Profile/CV, and that goes with everything. Everything in those pillars contributes to the final Profile/CV export."* Credentials do not need their own home to reach the application. **That is the standing rule for every pillar**, not a Clinical-specific one.

### V5: reflections. **RULED IN (Andy, Aug 2026): one record, two doors**

By senior year a student could have several hundred threads (#45a). Today the only way to reach one is through the shift it belongs to.

**The redundancy objection is answered by sync, not by cutting the view.** Andy: *"they could all be localized there, but the specific reflections could be housed in the specific activity."*

**The principle, which generalizes to all five pillars:**

- **Story Bank (`09-essays-story-bank.md`) is the aggregate door.** "My stories," every reflection from every pillar in one place.
- **Each pillar has a scoped door.** Clinical's Reflections sub-tab shows *clinical* threads only.
- **There is exactly one set of records.** The pillar view is a **filter over the same data**, never a copy, never a separate store. Editing in one place changes the other because they are the same record.

**This is why it is not the hours-map mistake.** That was rejected for being *a third rendering of numbers Overview already showed twice*. This is one dataset with a scoped entry point and an aggregate entry point, which is the same shape as `03-clinical.md` §2.0's hour-ownership rule: one record, referenced from multiple places, never duplicated.

**Consequence to carry forward:** `09-essays-story-bank.md` is still an unspecced scaffold. **This ruling constrains it.** Story Bank must be built as the aggregate view over pillar-owned reflections, not as a store that receives copies. Record this in that file when it is specced.

**Still open:** whether #45b's synthesis output (a cross-experience thread, distinct from a single-shift unpack) appears in both doors or only in Story Bank.

### V6: archive

§6 lists *"Archive: end/close an experience without deleting its hours or reflections"* as a workflow, but **no view displays archived experiences.** Academics has Grades & **Archive**; Clinical has the verb without the noun.

**Lean: fold into V1** (a ledger with a filter for ended roles) rather than its own surface.

### V7: site discovery (from #54)

#54 currently produces one number: *"12 students logged hours here."* The obvious extension is a browsable directory for a student looking for a first clinical role.

**Lean: not now.** It inherits every concern already recorded in `deferred.md` N-1 (cross-user data, moderation, needs scale to be worth anything), and #54's aggregate count was deliberately scoped *down* from that. Listed for completeness, not proposed.

---

## 3. Structure. **RULED (Andy, Aug 2026): flat sub-tabs, the MCAT model**

**Clinical gets sub-tabs.** Andy: *"it still should contain subtabs like academics and mcat."*

**Flat, with no mode switch above them.** Academics needs Daily/Planning because it has two genuinely different jobs, doing this semester's work versus planning the degree. Andy: *"you don't need another layer of switching tabs since all it's doing is tracking clinical experiences."* One job, one level of navigation.

Per `01` §4b-i's three-level nav rule, that means **level 2 only**: underline tabs, no glass mode pill above them. Same treatment MCAT's seven use.

### The set

| Sub-tab | What it is | From |
|---|---|---|
| **Sites** | Today's master-detail hero. Site cards, selected-site detail, shift fast-add. The default landing. | existing §5 |
| **Shifts** | Every shift across every site, one ledger. Filterable, including by ended roles, which absorbs V6. | **V1** |
| ~~Credentials~~ | **RULED DOWN to a section on `Sites`** (Andy, Aug 2026), not a sub-tab. Everything with an expiry, with profile-level certs grouped under "Not tied to a site" so **V2 is still resolved**. Only 3 features attached to it, which is the evidence that settled it. | ~~V4~~ → §on Sites |
| **Reflections** | Clinical-scoped door onto the same records Story Bank aggregates. Browse **and** worklist, two independent filters. | **V5** |

**Three sub-tabs, and that is the whole set.** Two candidates were ruled down rather than in:

- **No `Application` tab** (V3): the export preview moves to Profile/CV, and Clinical keeps a **phase-gated prep panel on `Sites`**.
- **No `Credentials` tab** (V4): it is a **section on `Sites`**, with profile-level certs grouped under "Not tied to a site".

**Logging is reachable from `Sites`, `Shifts`, and Overview (#10)**, all rendering the same `InlineAddRow`. An earlier draft made `Shifts` read-only for creating; **reversed** (Andy): *"users should have the freedom to add shifts from the shift logger as well."* The objection was that two add rows means two code paths that drift, which is an implementation concern solved by sharing the component, and it was already moot since #10 put logging on Overview. The guards (#59, #60) live **in** the component, so every door enforces them.

Mockup for all three: `mockups/04-clinical/clinical-subtabs.html`.

### The counter-argument, recorded rather than dismissed

MCAT earns seven sub-tabs because studying has genuinely different modes of work. **Clinical is fundamentally a log**, and sub-tabs on a logging tool can add weight without adding capability. The **≤5-second logging rule** (`CLAUDE.md`) is what's most at risk.

**Why it does not block the ruling:** every sub-tab here answers a question the single page structurally cannot, and two of them (V1, V2) fix defects rather than add surface. **The guard is that `Sites` stays the default landing and keeps the fast-add row**, so the core loop never gains a click. If any sub-tab starts absorbing steps from the logging path, that is the signal this went too far.

---

## 3a. Sites stays cards. **RULED (Andy, Aug 2026)**

Four layouts were considered for `Sites`, since it is the surface most likely to feel like a copy of Academics' Class Center.

Andy: *"since there are limited amounts of roles that I can occupy, I do feel like the cards are big enough, visually, and that cards are an appropriate display."*

**That is the right test.** Cards fail when there are twenty of something. A student holds **2 to 4 clinical sites**, occasionally 5 across four years, and at that count a card holds name, role, cadence, hours, and recency without crowding.

| Considered | Why not |
|---|---|
| **Timeline** (each site a bar on a date axis) | The most interesting in the abstract, because **recency and continuity are the pillar's stated signals** (§2.3) and a timeline shows them structurally rather than in words. But with two sites it is two bars, which is a lot of horizontal space to say what a card already says in one line. **It only earns its keep at five-plus overlapping engagements**, which is not the common case. Also not in the approved graphic vocabulary (`CLAUDE.md`). |
| **Split-pane master-detail** | Proven and dense, but the most generic-app option, and it buys nothing at this record count. |
| **Single-site focus + switcher** | Fastest for the one-active-site case, worse for anyone genuinely juggling two jobs. |
| **Sites table** | Densest, coldest, and it would make `Sites` read as a second ledger sitting next to `Shifts`. |

**Clinical already differs from Class Center without forking anything.** Layout differs (a **row**, because there are few sites, versus Academics' grid for 4 to 6 classes) and content differs (hours, recency, cadence, active dot, none of which a class card carries). Same `Card` component, different arrangement and payload.

**Why this matters past Clinical:** a bespoke card style here means Volunteering, Shadowing, Research, and Extracurriculars each want their own, and the shared-skeleton ruling is gone. `CLAUDE.md` already forbids forking shared components into variants.

## 4. Explicitly considered and rejected

| Idea | Why not |
|---|---|
| A separate "Hours" analytics view | §8's chart plus the headline strip already carry rate, recency, and total. A third rendering repeats the hours-map mistake. |
| A "Verifiers" directory view | §7c already batches verifier work into two review moments. A standing directory would be a list nobody visits between those moments. |
| A Clinical calendar | `01` §6.9 is explicit and standing: do not build a calendar, read from one. |
| Per-site dashboards | The selected-site detail panel is already this. |

---

## 5. What this file does not do

It does not touch the 64-item feature catalog. **Every candidate here is a container for features that already exist**, not new functionality. If a candidate is adopted, the features it holds are already specced; only their placement changes.
