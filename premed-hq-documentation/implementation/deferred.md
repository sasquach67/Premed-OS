# Deferred: the roll-up

**Status:** Living index (Aug 2026). **Not a source of truth.** Every row points at the file that owns the item; that file wins on any conflict.

**Why this exists.** Open decisions were already recorded well, one section per spec file. Research blockers were recorded as sentences inside the specs, findable only by grep. Cross-cutting cleanup work had no home at all and existed only in chat. This file gives the last category a place and indexes the first two so nothing gets re-litigated in the wrong document.

**How to use it.** Add a row when you defer something. Delete the row when it ships, and record the outcome in the owning file, not here.

---

## 1. Sweeps

Mechanical, cross-cutting, no product decision left to make. Each is one focused pass.

| # | Item | Scope | Owner | Notes |
|---|---|---|---|---|
| S0 | **Long-horizon durability, D1 + D5** | `src/store/` | — | **PARTIAL Aug 2026.** D1 step 1 is done: persistence writes are guarded and a rejected save raises a blocking Attention item instead of failing silently. D5 is done: version 0 is declared as the oldest supported store and the frozen full-chain migration suite exercises the complete migration sequence without dropping legacy records. D1 steps 2–4 remain open because choosing cloud-primary entities changes the locked local-first architecture and still needs Andy's ruling. |
| S1 | **Humanizer sweep of product copy** | User-facing strings in `src/`, plus copy inside `specifications/mockups/` | Codex prompt for `src/`; me for mockups | Scope and exclusions in §1a. Do not point this at whole files. |
| S2 | **Widen `01` §4h to a full copy standard** | `specifications/01-shared-interface-patterns.md` §4h | me | §4h currently codifies only the em dash rule. Once S1's pattern set is agreed, §4h should carry all of it with em dash as one clause, otherwise two competing copy rules exist in different places. Do S2 before S1 so the sweep has a spec to enforce. |
| ~~S3~~ | ~~Fix the `05` skills contradiction~~ | | | **DONE Aug 2026.** Turned out to be seven stale lines, not one: six in `03-clinical.md` (§5 detail panel, §8 chart, §8a component table ×2, two contradicting acceptance criteria) plus `05` itself, which was rewritten. Also swept four tab headers and `AGENT-IMPLEMENTATION-GUIDE.md`. |
| S4 | **Draw #15, route-from-Shadowing** | `specifications/mockups/04-clinical/` | me | Designed in spec, never mocked. |
| S8 | **Add `--cat-timeline: #4fa3a8`** | `src/index.css` | unassigned | **One line, but it touches a `MUST-NOT-CHANGE` file**, so it cannot be smuggled into an unrelated commit. Timeline is the only tab with no accent token — the file carries gpa, mcat, shadow, volunteer, activities, clinical, research, letters. **An addition to the design system, not a change to it.** Approved by Andy Aug 2026 with `mockups/11-timeline/timeline-spine.html`. **Must be flagged explicitly in whatever build prompt carries it**, and must work in both themes. |
| S5 | **Config-driven refactor of `ExperiencePillar.tsx`** | `src/pages/ExperiencePillar.tsx` | unassigned | **Not an obligation. Do not do this because a spec implies it.** The component branches on `category` in 27 places with no config object. `05` used to claim the opposite; it now describes reality instead. A refactor is 74KB of change for zero user-visible difference, so it happens only if someone decides it is worth it. |
| ~~S6~~ | ~~**Give tasks full functionality on Overview, narrow Timeline to the roadmap**~~ | | **DONE Aug 2026** | Overview owns the full task editor at both widget and `/overview/tasks` sizes; every `TaskItem` field is editable or explicitly ruled out by the brief. Timeline now renders only the roadmap. The former Verify content is preserved temporarily on Overview with its final ownership recorded in code: `advisingQs` → Letters `LT-27`/`LT-30`; sourced `tips` → Help. Neither collection was deleted. |
| S7 | **Split `TaskItem` into three owners** | `implementation/data-model.md`, `src/store/` | unassigned | **A real code defect, not a design question.** Roadmap and milestones were always distinct in the design — **the code is what conflated them.** A `TaskItem` is a to-do, *and* a dated thing (`deadline`), *and* a roadmap milestone (`milestone: true`), all stored in `data.tasks`. So **every consumer of `tasks` has to remember `!task.milestone`, and forgetting is silent. Two consumers already forgot** — `attention.ts:93` puts dated milestones in the Attention bell labelled `Open task`, and `CommandSearch.tsx:60` returns them as task records. **A roadmap node also outgrew the flag:** it now holds authored steps and guidance, which a boolean cannot carry. **Versioned and lossless per `CLAUDE.md`** — milestones become nodes, dated tasks go to their owner or stay plain tasks, **nothing is dropped.** **Blocks the real Timeline build; does not block S6.** Detail in `data-model.md` under `TaskItem`. |
| S9 | **Experience-hour truthfulness guard** | Experience pillars and derived hour selectors | — | **DONE Aug 2026** (`3a7d135`). Aggregate position totals remain visible as recorded hours, but weekly pace, “last logged,” charts, Avg/wk, projections, and sample shift rows are dormant until dated hour logs exist. This removes invented measured-looking figures without a schema change. |
| S10 | **Persisted store version alignment** | `src/store/store.ts`, migration test | — | **DONE Aug 2026** (`d6b5374`). `CURRENT_STORE_VERSION` now equals 9, matching the newest hydration migration, `migrateShellV9`; an exact assertion prevents drift. |
| S11 | **Dated experience hour-log model** | `ExperienceEntry`, new child collection, selectors, backup/trash/import, all experience readers | unassigned | **DEFERRED deliberately.** Proposal: `implementation/briefs/HOURLOG-model-proposal.md`. Build as one separately authorized, versioned, lossless migration: every legacy aggregate becomes exactly one undated **ESTIMATED** child block, never fabricated daily rows. Only dated student-supplied logs may feed pace. This is larger than S9/S10 and must not hold either hostage. |

### 1a. Humanizer sweep: what it does and does not touch

The `humanizer` skill carries 33 patterns. Only some of them apply to interface copy, and two of them would damage the locked design system. **The sweep prompt must state all three lists below**, or it will flatten the app.

**Targets.** Empty states, tooltips, nudge and alert text, confirmation dialogs, error messages, help text, onboarding copy, section subtitles. Strings the user reads.

**Never touched.** Variable names, code comments, spec documents, component structure, headings, and any string that is a label rather than a sentence.

**Patterns in scope** (the content and hedging ones):

| Pattern | Why it matters here |
|---|---|
| #1 significance inflation | "plays a crucial role in your application" is exactly the pre-med anxiety the app is built against |
| #3 superficial -ing analyses | "highlighting your commitment to service" |
| #4 promotional language | the app describes a record, it does not sell it |
| #7 AI vocabulary | crucial, key, landscape, showcase, valuable, enhance |
| #9 negative parallelisms | "it's not just hours, it's consistency" |
| #10 rule of three | three-item lists that should be two or four |
| #14 em dashes | the original complaint, now one clause of a bigger rule |
| #24 excessive hedging | false uncertainty reads as evasive in a nudge |
| #25 generic positive conclusions | "you're on your way" after a logged shift |

**Patterns explicitly excluded**, with the reason, because a future agent will otherwise "fix" them:

| Pattern | Why it is excluded |
|---|---|
| **Personality and soul section** | The skill tells you to add opinions, vary rhythm, and let mess in. Wrong register for a tooltip. The skill itself says neutral is the correct human voice for reference text, and interface copy is reference text. **This section is off.** |
| #15 boldface | Boldface is structural in this UI, not emphasis-by-habit |
| #16 inline-header vertical lists | A legitimate interface pattern here, not a prose tell |
| #17 title case in headings | Heading treatment is a locked typographic decision (`CLAUDE.md`, `04` craft standards) |
| #18 emojis | Already forbidden as UI icons by a stronger existing rule |

---

## 2. Research blockers

Category A means sourced, dated, and freshness-tracked (`implementation/data-refresh.md`). **Standing rule R7: cut rather than approximate.** A blocked item ships in its fallback form or does not ship.

| # | Question | Blocks | Unblocked by | Fallback if it fails |
|---|---|---|---|---|
| R-1 | Does the AAMC **MSQ** ask for clinical hours, and does the report publish a distribution? | C3, catalog #31 | Open the *MSQ All Schools Summary Report*. Contact `msq@aamc.org` if not publicly reachable. | **Already shipped as the design.** No target by default; the projection describes rate and total with no goal attached. A user-set number is always labelled `Your target`. |
| R-2 | **18 or 19 AMCAS categories**, turning on whether `Health Advocacy` is live | the export mapping | The live application. AAMC's own page is bot-protected and could not be fetched. | Do not hard-code the list. |
| R-3 | Exactly which **verifier fields** AMCAS asks for | C2 verifier capture, #38 | AMCAS application itself. **The 2027 Work & Activities Guide does not cover contacts**, only hours entry. Try the *2027 AMCAS Applicant Guide* next. | **Over-capture on purpose** (Andy, Aug 2026). HQ already stores name, id, role, email, phone, exceeding what secondary sources describe. An unused field costs nothing; a missing one is unrecoverable once the student loses touch. |
| ~~R-3a~~ | ~~AMCAS Work & Activities entry structure~~ | | **RESOLVED Aug 2026.** Official 2027 guide fetched and recorded in `03-clinical.md` §7b: 15-entry cap, 700 chars, 3 most meaningful at +1325, repeated flag with up to 4 date ranges, Completed vs Anticipated as separate sections with an August ceiling. **Cycle-dated, re-verify annually.** | |
| R-4 | **Credential standards**: NREMT component split, NC EMS rules, BLS/ACLS cycle lengths, CNA registry renewal | cert CE display | Issuing bodies, each cited and dated | **Confirmed so far:** EMT NCCP is 40 credits across 3 components on a 2-year cycle, 2025 model effective 1 Apr 2025. Nothing else is hard-coded until sourced. |
| R-5 | UNC **course to requirement mapping** | the Academics audit rebuild | `catalog.unc.edu`, per-course gen-ed attributes plus major and prereq lists | Blocking. A catalog change must flag affected plans rather than silently re-deriving them. |
| R-6 | What UNC publishes for **course grade distributions**, in what form, under what licence | Academics #62 | UNC directly | Cut the feature. **Do not scrape a student-built tool without checking its terms.** |
| R-7 | AAMC **Course Classification Guide** rules, including the 50% content threshold | Academics AMCAS GPA calc | Official AAMC guides | Rules stay configurable data with the guide version cited in the UI, never hardcoded logic. |
| R-8 | MCAT **attempt limits, score release schedule, AMCAS cycle dates, percentile table year** | four separate MCAT surfaces (§3.11, §3.12, §7) | AAMC policy pages, each dated | Show a date range, never a point estimate. A stale window is worse than none. |
| R-9 | **Full-length representativeness** across publishers | MCAT §3.3-C1 score normalization | Verification before encoding | Current community read is a snapshot, not fact. Category B, not A. |
| R-11 | **The 300 to 400 hour MCAT study range** | MCAT §3.3-G, catalog #89 | Sourcing pass against `implementation/research-prompts/community-lore.md`. **Look for how consistently the range is reported and by whom**, not for an official figure, because there almost certainly is not one. | **Category B and stated as such**, which is what makes it shippable today: *"Students commonly report studying 300 to 400 hours. Community consensus, not an official figure."* Attributed, `verifiedAsOf` dated, shown once. **If the range turns out to be less consistent than assumed, widen it or cut it. Never narrow it to a midpoint.** |
| ~~R-10~~ | ~~Where the **shadowing sufficiency bar** sits~~ | | | **CLOSED Aug 2026 without research — the feature it blocked was cut.** Andy on the sufficiency call: *"probably the most ridiculous thing I've ever seen. Why are you trying to put caps? Targets are not necessarily caps."* No bar to place once nothing declares a student finished. **Shadowing now inherits targets and pace like every other pillar** (`05-shadowing.md` §2.1, §14). |

---

## 3. Open decisions (index only)

The owning file holds the decision and its rationale. **This table is a pointer.** Copying the text here is how decisions drift.

| File | § | Open | Note |
|---|---|---|---|
| `tabs/01-academics.md` | §14 | 5 of 7 | #2 and #3 resolved July 2026. #5 is R-5 above. #6 and #7 depend on Atlas and onboarding. |
| `tabs/02-mcat.md` | §12 | 2 | Decisions files missing for the drill and Bookshelf mockups. Research tasks are R-8 and R-9. Board otherwise closed. |
| `tabs/03-clinical.md` | §16 | **0** | Original three all resolved Aug 2026 (classifier assertiveness by the writing itself; setting mix cut; patient-contact count shipped as #52/§7e). The fourth (scan vs warn on #62 imports) is **RESOLVED Aug 2026: neither, it redacts.** Names become `[name]` on the way in. The student is never asked to clean anything up. Catalog now 64 items (62 canonical + 45a + 45b), all specced. |
| `tabs/03-clinical-board.md` | §7b | 1 | **Classify-not-file.** Recorded, not adopted. Would dissolve C1 and make double-counting structurally impossible, but it changes ownership semantics in five specs and reopens a Volunteering decision already marked resolved. |
| `tabs/04-volunteering.md` | §17 | 0 | Fully designed. |
| `tabs/05-shadowing.md` | §16 | **0 mine** | **All closed Aug 2026.** Planned-visit → dissolved with the S-7 cut. `proceduresObserved` → stays in the insight. Sufficiency bar → dissolved with the sufficiency call (R-10 closed without research). Remaining: cold-email help, **parked at Andy's request**. |
| `tabs/06-research.md` | §16 | 3 | Protocol/IRB and thesis as output types. Role progression shape. Whether rejected outputs stay visible. |
| `tabs/07-extracurriculars.md` | §16 | 3 | Employment placement. `reach` as number or text. Most-meaningful comparison surface. **The third flags before building**, since it touches Profile's ownership. |
| `specifications/03-overview.md` | §12 | 1 | Five of six resolved July 2026. Connection peek and roadmap branching depend on the Atlas integration timeline. |

---

## 4. Unspecced tabs

Seven tabs are still 78 to 84 line scaffolds whose open-decisions section reads *"Unresolved design/product questions (TBD)."* They have not been through the board and spec process that Overview, Academics, MCAT, and the Experiences pillars went through.

| File | Lines | Note |
|---|---|---|
| `tabs/08-school-list.md` | 80 | |
| ~~`tabs/05-shadowing.md`~~ | **317** | **DONE Aug 2026 — no longer a scaffold and no longer blocked.** Specced to pillar density: three sub-tabs (`Physicians · Visits · Insights`) with §5a–§5c, inspector, states, mobile, admissions reasoning, and a full component table. **Every §16 decision closed.** Key rulings: the **sufficiency call is cut** (Andy: *"why are you trying to put caps?"*) so targets and pace now inherit like every pillar and **R-10 closed without research**; the **ask/application pipeline is cut** (*"only track positions that I already have"*), which removed the D7 #3 dependency; **no cross-user physician directory** (1-on-1 by construction, so aggregation buys nothing and costs privacy); site = contact = verifier = one person. **Still owed: a mockup.** |
| **every remaining pillar** | | **Inherit `05` §2a's continuity read** when specced: Research, Extracurriculars. *(Shadowing done.)* It is app-wide, not Clinical's or Volunteering's. Extracurriculars shows it **without hours**, and it may be that pillar's *primary* read since roles-over-time is exactly a continuity shape. |
| `tabs/09-essays-story-bank.md` | 80 | **CONSTRAINED before it is written, and the constraint got broader Aug 2026.** <br><br>**(1) Architecture, from `03-clinical-views-board.md` V5:** the **aggregate view over pillar-owned reflections**, never a store that receives copies. One record set, two doors. **Building it as its own store silently undoes that ruling.** <br><br>**(2) Scope, from Andy Aug 2026 — wider than V5 assumed:** *"everything written should really end up there… it can help us compile and get us personal statements, secondaries. Very very very important tab."* **So it aggregates every word the student writes, not only reflections:** pillar reflections (all five) · initiative outcomes and *what changed* · **what you'd do differently** (E-14) · year in review (E-12) · Research lab notes · 700-character AMCAS descriptions · personal statement and secondary drafts. <br><br>**(3) The boundary that keeps it coherent: only what the STUDENT wrote.** **Not** Timeline node notes (authored by us) · **not** Sauce blurbs (Atlas's) · **not** imported physician bios (S-16). Those are things a student *reads*. **A bank mixing your words with material handed to you is useless as essay input** — the whole point is that it is yours. <br><br>**(4) Why this is load-bearing, not just a nice tab:** three features already ruled elsewhere depend on it as their substrate. **E-16** drafts descriptions from real material — this is the material. **The most-meaningful suggestion** sorts candidates by how much you have written — that count comes from here. **The writing assistant** (E-21, `05-experience-pillar.md`) operates on this text. **Story Bank is not a feature; it is the input to the application-year features.** |
| `tabs/10-letters.md` | 80 | **Structure is locked** by `CLAUDE.md` (deep-link prefills only), so the spec has less room than the others. |
| `tabs/11-timeline-tasks.md` | 84 | **Renamed to Timeline** (Aug 2026) and **narrowed twice**. Tasks moved out entirely, entity and surface, to Overview (`/overview/tasks`). **Then deadlines moved out too** — each belongs to whatever the date is attached to, and the Attention bell was already the cross-cutting surface. **What is left is the tab's real subject: a four-year quest-log roadmap.** Sequenced nodes, soft-locked but never gated, each one a screen of steps and guidance rather than a label; **achievements ride the same spine**, placed at their real dates, and are what make a generic roadmap personal. **Mocked as a DRAFT** (`mockups/11-timeline/timeline-spine.html`) — **layout approved, design not settled.** Andy, Aug 2026: *"wouldn't commit it to the lab yet cuz it's still got design flaws."* **Six flaws are listed in that file's header block; the design pass is deferred to when Timeline comes up properly.** Scaffold sections still unwritten. Build blocked on S7; needs S8 for its accent token. | |
| `tabs/12-profile-cv.md` | 80 | **CONSTRAINED before it is written** (`03-clinical-views-board.md` V3): **owns the AMCAS export preview**, including the application-wide **15-entry cap** across all five pillars and most-meaningful selection. No pillar-scoped surface can render a cross-pillar cap, so if Profile/CV is specced without it, **#48's cross-pillar half has no owner anywhere.** Also owns the surface Extracurriculars §16 #3 wants to borrow. |
| `tabs/13-help.md` | 78 | |
| `tabs/14-settings.md` | 78 | Holds the global `WeeklyCapacity` and intensity-mode values (`01-academics.md` §6.15-B). |

**These are not deferred decisions. They are unstarted work**, listed here so the distinction stays visible.

### 4a. Sauce — new scope, boarded but NOT specced (Aug 2026)

**`specifications/06-knowledge-delivery-board.md`** exists. **A board is a reference index, not a spec** — same stage Clinical was at before its spec was written. **Sauce is not on the fifteen-tab list above and it is not in the §6 sweep gate**, so it is recorded here or it disappears.

**Settled:** the name **`Sauce`** · the mascot/Sauce split (mascot = app tips only, tab-specific) · three registers — instruction / statement / quote — **distinguished by shape, never labelled** · quotes are quotation marks plus loose attribution · **not phase-gated** — shuffle across everything, weighted toward the pillars a student touches least · **ONE door: a top-bar dropdown**, no page and no bento block · no unread count, no badge, outside the attention auction · **all of it Category B** · **bulk-then-drip via stale-while-revalidate**, small batch, human-approved · local set first, Supabase later.

**Not settled:** the name · blurbs per day · K-2 to K-6 in the board's §8 · **placement on Overview, where the bento is already 8 blocks** · the mockup, **rejected** (`mockups/03-overview/sauce-two-doors.html`) · and everything a real spec in this project carries — components table, acceptance criteria, empty/loading/error states, mobile.

**Hard blocker: `HQ↔Atlas data flow` is open** (`02-atlas-interface-and-knowledge-map.md` §98 — *"embedded vs. linked vs. merged codebase"*). **That decision is bigger than Sauce and gates any real build.** The only work guaranteed not wasted before it lands is **content** — growing `seed.ts:616`'s tips, which is the offline read path regardless of what Atlas becomes.

**Where the spec would live when written:** Sauce is **one shell component — a top-bar popover** (RULED Aug 2026, narrowing an earlier "Overview block plus a sub-route" reading). So it belongs in **`specifications/00-product-shell.md`** beside the Attention bell and Quick Add, not in `03-overview.md` and not in a sixteenth `tabs/` file.

**The scope ruling that got it there** (Andy): *"to build this would essentially be to replace Atlas and I'm not tryna do that. I'm just tryna transfer a small **view** of what Atlas can show."* **The feed page, filters, history, and archive are all cut** — a browsable knowledge archive *is* Atlas. HQ shows three and points out. **Mockup: `mockups/00-shell/sauce-dropdown.html`** (DRAFT); `mockups/03-overview/sauce-two-doors.html` is historical.

---

## 5. Current position

**Clinical is fully specced (Aug 2026), at 64 catalog items** (62 canonical + #45a + #45b). Items #55 to #62 and sections §7f to §7i were added by a **parallel Claude session**, along with `implementation/long-horizon-durability.md`. Every remaining ○ waits on implementation rather than a decision, **except #62**, which carries one open ruling (§16.4, the PHI scan-vs-warn question). The largest single unbuilt item is still **#48, the AMCAS export preview**, which has a clear shape from §7b's verified structure.

**`long-horizon-durability.md` raises D1 as a live defect** and it verifies: `store.ts` persists all of `AppData` to localStorage through zustand's `persist` middleware with **no quota handling**, while our own #45a (uncapped threads, full thread to Story Bank) is the accelerant. **D1's proposed fix requires amending a locked rule** (localStorage-primary, `CLAUDE.md`) by making reflection threads cloud-primary. **That is Andy's call, not a decision any session should absorb quietly.** Its own priority order puts D1 step 1 (wrap persistence, never fail silently) first, and D5 (full-chain migration test) second, as the two where damage is unrecoverable.

**No final mockups go to the variant lab until every clinical feature is specced** (Andy, Aug 2026). **That condition is now met for Clinical**; the remaining gap before mockups is building, not designing.

### N-1. The social/network layer: recorded, not adopted

Raised while speccing #54 (Aug 2026), then narrowed. Andy's original framing was LinkedIn-style: click into another student's profile and see what you have in common. **Set aside, not built.** Two different features live under one name here, and only the smaller one shipped (as #54/§7e, the aggregate org directory, no individual ever visible).

The bigger one is genuinely a different product direction: students visible to each other, profile-to-profile, mutual affiliations. It would require inverting the app's default posture (single-user, local-first, private by default per `CLAUDE.md`) into something closer to LinkedIn's default-visible model, plus real moderation and safety design nothing else in HQ currently needs. **It also needs scale to be worth anything** ("provided there are actually users that want to use the app," Andy's own caveat): worthless with a small user base, only interesting once there's a real network to surface.

**Not a Clinical feature, not a Wave-8 line item.** If it's ever built, it's closer in scope to Atlas: a new layer of the app, not a subfeature of one pillar. Revisit once there's a real user base to know if it's worth it.

---

## 6. The sweep gate

**S1 and S2 run when the tabs are done** (Andy, Aug 2026). Not on a date. A copy sweep against a moving spec would be redone, and every new tab writes new copy.

**"Done" means this checklist is clear.** Tick a box the moment that tab's spec closes.

**Experiences pillars, boards then specs:**

- [x] Overview
- [x] Academics
- [x] MCAT
- [x] **Clinical** (specced Aug 2026, all 56 catalog items)
- [ ] Volunteering
- [ ] Shadowing
- [ ] Research
- [ ] Extracurriculars

**The seven scaffolds from §4:**

- [ ] School List
- [ ] Essays / Story Bank
- [ ] Letters
- [ ] Timeline
- [ ] Profile / CV
- [ ] Help
- [ ] Settings

**When the last box is ticked, in this order:**

1. **S2** widen `01` §4h into the full copy standard, using §1a's pattern set.
2. **S1** run the sweep against it. Mockups first, since they are mine and cheap to redo. Then the Codex prompt for `src/`.
3. **S3 and S4** are not gated by this and can go any time.

Anyone picking this file up mid-project: if boxes remain, the sweep is not late. It is waiting on purpose.
