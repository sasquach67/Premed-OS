# Profile / CV — comprehensive board

**Status:** ✅ **FULLY RULED (Aug 2026).** All four waves closed across Batches 1–4. **47 rows, nothing open.** **Over-generated on purpose — cut in the open, with the reason recorded.**
**Spec it feeds:** `tabs/12-profile-cv.md`
**Method:** `HANDOFF-2026-08.md` §2. **Batches, one ruling at a time. Do not advance until the batch is closed.**

---

## 0. What binds before anything is proposed

**All five arrived from elsewhere. None is up for debate here.**

| | |
|---|---|
| **`draft \| ready`** | **One record with a state, not two records.** Story Bank owns writing; Profile/CV holds what is `ready`. `one record, two doors`, third application |
| **AMCAS split** | **Profile/CV owns the 15 activities as CV LINES. Story Bank owns the TEXT** (`09` §8) |
| **`U-6`** | Hours live in exactly one pillar. **This tab aggregates and never double-counts** |
| **`U-9`** | **Nothing scored, ranked, or compared.** No completeness percentage, no CV strength, no readiness meter |
| **`U-12`** | **No incumbent — BUILD.** Generic CV builders overlap on output format only |

**And one that is easy to forget:** **HQ never picks the three most-meaningful** (`SB-27`). It may show what material exists per activity. It never ranks them.

---

## 1. ✅ RULED Aug 2026 — the three questions that carried the tab

### Q1 · It renders and exports a real CV ✅

**PDF, DOCX, and plain text.** HQ lays out records it already holds.

**Why the word-processor cede is not threatened:** that cede was about **collaborative writing** — comments, track changes, co-editing. Docs and Word own those. **Laying out your own data is not writing**, and refusing to print it means the student retypes four years into Word, which is the exact re-entry problem this tab exists to remove.

**The line, and it is where the cede actually sits:** HQ renders **its own records** to a fixed layout. **It never becomes a place you type a document.** No rich text, no draggable page breaks, no font picker, no template gallery.

**Plain text matters more than it sounds** — application portals eat formatting, and a clean text version is the one that survives a paste into a textarea.

### Q2 · No public profile ✅ CUT

**Andy asked for the recommendation; the argument, recorded so it is not re-proposed:**

1. **The need is already met by Q1.** *"My advisor wants to see where I'm at"* is a PDF. A hosted page is not required for it.
2. **It is the largest privacy surface the product could add.** Everything in HQ is local-first — data does not leave the device unless the student syncs. A public profile inverts that: a server, a permission model, a revocation story, and a URL that may carry a GPA. **`05` §6.4's promises get much harder to keep.**
3. **It is asymmetric.** It can be added later. **It cannot be un-leaked.** This is a beta by one student with no legal review.

**⚠️ The one condition that reopens it:** students **actually asking** for a shareable link — observed, not predicted. Then it is designed properly rather than bolted on.

### Q3 · The writing desk opens OVER this tab ✅

**One editor, two entry points, one store.** Click an activity here and Story Bank's writing desk opens in place, with the student's material beside it.

**Why this and not the other two options:**

- It satisfies **both** rules literally — one store (`09` §8) and **Profile/CV never becomes a second editor** (this tab's do-not-generalize anchor).
- **The student does not leave the page they were working on**, at the moment of highest friction in the entire application.

**⚠️ Implementation consequence, and it is the thing that will get built wrong:** the desk is **the same component**, invoked from a different place. **Not a copy, not a modal that re-implements it.** Verify by grep for a second editor.

## 2. Wave 0 — the record model

| # | Feature | AI | Note |
|---|---|---|---|
| **P-1** | **`status: draft \| ready` on the shared record** | ○ | Restating the ruling so the grep has a target. **One store. Verify no second store exists** |
| **P-2** | **`Publish` — the action that flips `draft → ready`** | ○ | **The student decides when something is done.** Makes an otherwise vague handoff into a real moment |
| **P-3** | **Unpublish, back to `draft`** | ○ | Non-destructive both ways. Nothing is lost by publishing early |
| **P-4** | **A `ready` record is read-only here** | ○ | Editing happens at the Story Bank desk. **This tab never becomes a second editor** — the do-not-generalize anchor |
| **P-5** | **Publish-all for a batch** | ○ | Convenience. Cut if it makes publishing feel automatic rather than chosen |

## 3. Wave 1 — the CV

| # | Feature | AI | Note |
|---|---|---|---|
| **P-6** | **Auto-assembled from every pillar** | ○ | **The reason the tab exists.** Nothing is typed twice |
| **P-7** | **Fixed section order** | ○ | Education · Experience · Research · Publications & Presentations · Honors · Certifications · Skills & Languages |
| **P-8** | **Per-line include / exclude** | ○ | A CV is a selection. **Excluding never deletes the record** |
| **P-9** | **Manual lines for what HQ does not track** | ○ | Jobs, hobbies, high-school items. **Hazard: this is the crack a word processor grows out of.** Single-line only |
| **P-10** | **Ordering within a section** | ○ | Reverse-chronological default, drag to override |
| **P-11** | **Consistent date formatting** | ○ | The single most common CV defect, and free to fix |
| **P-12** | **Hours on a line, from `U-6` aggregation** | ○ | **Never re-summed here** |
| **P-13** | **Export — PDF, DOCX, plain text, JSON** | ○ | Plain text matters more than it sounds: **application portals eat formatting** |
| **P-14** | **Print stylesheet** | ○ | If Q1 rules render |
| **P-15** | **Named CV variants** | ○ | Research CV vs general. **Probable cut — a first-year needs one CV, and variants double every downstream surface** |
| **P-16** | **One-page mode** | ○ | Not a CV convention in medicine. **Probable cut** |


## ✅ RULED — BATCH 1: the CV

| # | Ruling |
|---|---|
| **P-15** variants | **CUT.** One CV. Variants double every downstream surface — *which* CV does the letter packet use, which exports, which is "current". **Add later only if two are genuinely needed at once** |
| **P-16** one-page mode | **CUT with it.** Not a CV convention in medicine, and it inherits the same which-one problem |
| **P-9** manual lines | **BUILD, SINGLE LINE ONLY.** Title, org, dates. **No description field, no textarea.** ⚠️ **This is the crack a word processor grows out of** — give it a paragraph field and within a year someone is writing their CV in HQ and losing it in a sync conflict. The single-line constraint is the guard, and it is load-bearing rather than cosmetic |
| **P-5** publish-all | **CUT.** *"Publish" only means something if it is a choice.* A bulk flip makes it feel automatic, and the letter packet would then hand a professor a description the student never actually finished. **One at a time** |
| **P-6 · P-7 · P-8 · P-10 · P-11 · P-12 · P-13 · P-14** | **BUILD as specced.** No contention |

**Consequence worth stating:** with variants cut, **"the CV" is a definite article everywhere else in the docs.** `LT-1`'s packet, the advisor export, and the AMCAS preview all read from one object. **If variants ever return, every one of those has to gain a selector.**

## 4. Wave 2 — the fifteen AMCAS activities ⭐

**This is the tab's hardest and most valuable section.**

| # | Feature | AI | Note |
|---|---|---|---|
| **P-17** | **The 15 slots as first-class objects** | ○ | Not a list of experiences. **The constraint IS the feature** |
| **P-18** | **Slot ↔ record mapping, many-to-one** | ○ | One activity can aggregate several records — three years at one hospital is one entry |
| **P-19** | **AMCAS experience-type on each slot** | ○ | Their taxonomy, not ours |
| **P-20** | **700-char description with a live count** | ○ | **Displayed here, written at the Story Bank desk.** See the conflict in §7 |
| **P-21** | **Most-meaningful flag, student-set, max three** | ○ | **HQ never picks.** The cap is enforced; the choice is not advised |
| **P-22** | **1,325-char most-meaningful field** | ○ | Same split as `P-20` |
| **P-23** | **Contact / verifier per slot** | ○ | Already captured in the pillars. **Never re-entered** |
| **P-24** | **Hours per slot, aggregated** | ○ | `U-6`. Research-for-credit counted once |
| **P-25** | **Anticipated hours** | ○ | AMCAS allows projecting forward. **Distinct field, never merged into logged hours** |
| **P-26** | **Repeated / continuing activity handling** | ○ | Start and end dates per slot, gaps allowed |
| **P-27** | **Export preview in AMCAS shape** | ○ | The payoff of `01` §4.2-D. **An export, not a submission** |
| **P-28** | **Unassigned-candidates list** | ○ | *"You have 22 records and 15 slots; these 7 are not in any slot."* **A fact, not a recommendation** — and the line `U-9` is nearest to |


## ✅ RULED — BATCH 2: the fifteen slots

| # | Ruling |
|---|---|
| **P-28** unassigned | **BUILD, as a bare fact.** *"These 7 records are not in any slot."* **HQ never suggests which to drop, never flags "thin" ones, never uses hours as a proxy for worth.** ⚠️ **This is the row nearest `U-9` in the entire tab** — the version that flags low-hour activities was proposed and **CUT**, because hours-as-worth is precisely the judgement `SB-27` and `U-9` forbid |
| **P-29b** ⭐ **grouping suggestion** (new) | **BUILD.** Same organisation + adjacent dates → *"these two look like one AMCAS entry."* **Deterministic, no judgement** — it reads org identity, not importance. **Suggested, never applied automatically.** This is what makes `P-18`'s many-to-one mapping usable rather than tedious, and without it a student hand-maps 22 records into 15 slots and goes back to a spreadsheet |
| **P-25** anticipated hours | **BUILD, as a strictly separate field.** AMCAS asks for projected hours. **It must never merge, sum, or display alongside logged hours as one number** — that is how a projection becomes a claim |
| **P-17 · P-18 · P-19 · P-20 · P-21 · P-22 · P-23 · P-24 · P-26 · P-27** | **BUILD as specced.** No contention |

**⚠️ The distinction `P-28` and `P-29b` rest on, because they look similar and are not:**

> **Grouping is a FACT about organisations.** Two records at Carolina ED are two records at Carolina ED, and saying so involves no opinion about either.
>
> **Ranking is a JUDGEMENT about worth.** *"These three are your weakest"* requires HQ to decide what matters, which it does not get to do.
>
> **`P-29b` is on the fact side and stays there.** The moment a grouping suggestion starts ordering slots by hours, impact, or anything else, it has crossed.

## 5. Wave 3 — profile fields

| # | Feature | AI | Note |
|---|---|---|---|
| **P-29** | **Cycle year + graduation year** | ○ | **Already drives phase-gating app-wide.** Probably the single highest-leverage field in the product |
| **P-30** | **Institution and coursework link** | ○ | Read-only from Academics |
| **P-31** | **GPA summary, AMCAS-shaped** | ○ | Read-only from Academics. **Never recalculated here** |
| **P-32** | **MCAT summary** | ○ | Read-only from MCAT |
| **P-33** | **State residency** | ○ | **Materially changes a school list.** Small field, large consequence |
| **P-34** | **Languages** | ○ | AMCAS asks |
| **P-35** | **Identity / demographic fields** | ○ | **⚠️ Sensitive. Opt-in, never required, never used in any derived read.** Needs a privacy ruling before it is built |
| **P-36** | **Disadvantaged-status narrative** | ○ | **⚠️ Same, and heavier.** May belong in Story Bank entirely |


## ✅ RULED — BATCH 3: profile fields, and the sensitive ones

| # | Ruling |
|---|---|
| **P-35** demographics | **⚠️ CUT. HQ stores NO race, ethnicity, gender, parental education, or income.** The reasoning is not squeamishness — **the app has nothing to do with it.** It cannot compute anything from those fields, and `00-product-vision.md` lists *"psychologically profile users"* as a non-goal, so any derived use would cross a stated line. **AMCAS is the system of record; the student types it there once.** Storing data with no use is pure downside on the one category that cannot be un-leaked |
| **P-36** disadvantaged narrative | **MOVED TO STORY BANK.** It is an essay, Story Bank owns all text, and **`SB-73`'s per-entry *keep local, never send* already exists there.** Profile/CV shows only **that it exists and is `ready`** — never the text. **Do not build a sensitive free-text field in this tab; it has no keep-local mechanism** |
| **P-40** advisor summary | **CUT — the CV export is the answer.** Consistent with cutting the public profile: no second export format, no second permission story. *"Can I see where you're at"* is a PDF |
| **P-33** state residency | **BUILD.** Small field, **materially changes a school list**, and it is not sensitive in the way the cut fields are |
| **P-29 · P-30 · P-31 · P-32 · P-34** | **BUILD as specced.** Cycle/grad year, institution, GPA and MCAT summaries (read-only), languages |

### ⭐ `P-42` (new) — Fee Assistance, without holding the data

**The one legitimate use for income data, and it does not require storing any.**

**AAMC's Fee Assistance Program** waives most of the AMCAS fee and includes free MCAT prep. **It is genuinely under-known and worth hundreds of dollars to students who qualify** — and eligibility turns on parental income and household size.

**HQ states the thresholds as a Category A fact, dated and sourced, and links out.** The student checks themselves. **Nothing is stored, nothing is computed, and the benefit is identical.**

**⚠️ Freshness-tracked.** The thresholds are republished annually — this is exactly the Category A staleness case (`implementation/knowledge-sources.md`). **A stale threshold that tells someone they do not qualify is worse than no feature.**

## 6. Wave 4 — readiness and handover

| # | Feature | AI | Note |
|---|---|---|---|
| **P-37** | **What is missing, as a list** | ○ | **Never a percentage, never a score** (`U-9`). *"No verifier on 3 activities"* is a fact; *"78% complete"* is a judgement |
| **P-38** | **Phase-gated display** | ○ | A first-year sees a CV. **They do not see 15 AMCAS slots** |
| **P-39** | **⭐ The application packet** | ○ | **Fourth instance of the assemble-and-hand-over pattern** (`RO-3`, `E-16`, `LT-1`). CV + activities + hours + verifiers, one file |
| **P-40** | **Advisor summary** | ○ | The honest answer to *"can I see your profile?"* — **an export, not a hosted page.** Depends on Q2 |
| **P-41** | **Staleness read** | ○ | *"Your CV was last published in March; 14 records have changed since."* **Fact-shaped** |


## ✅ RULED — BATCH 4: readiness and handover. **Profile/CV is now CLOSED.**

| # | Ruling |
|---|---|
| **P-39** packet | **⭐ ONE COMPONENT, called from both tabs.** Letters passes *"what you did with this person"*; Profile/CV passes the full record. **`RO-3` · `E-16` · `LT-1` · `P-39` are four callers of ONE assembler, not four packet builders.** ⚠️ **Two builders is how they drift** — one gains a field, the other does not, and nobody notices until a professor gets a packet missing the hours. **Verify by grep: one assembler, four call sites** |
| **P-37** what is missing | **BUILD — structural incompleteness ONLY.** No verifier on an activity · no end date · a slot with no description. **Facts about the FORM.** ⚠️ **The version that says *"no research listed"* or *"no non-clinical volunteering"* was proposed and CUT** — that is HQ having an opinion about what an application should contain, which is `U-9` and also the thing `04-admissions-framework` refuses to do |
| **P-38** phase gate | **BUILD.** A first-year sees a CV, not fifteen empty AMCAS boxes |
| **P-40** advisor summary | **CUT** (Batch 3) — the CV export is the answer |
| **P-41** staleness | **BUILD.** *"Published in March; 14 records changed since."* Fact-shaped, no nag |

### The line `P-37` walks, stated because it is the same line as `P-28`

> **Structural incompleteness is a fact about the FORM.** *"This slot has no verifier"* is true or false and involves no opinion.
>
> **A content gap is a judgement about the APPLICATION.** *"You have no research"* asserts that research belongs there, which is advice HQ does not give.

**Both `P-28` and `P-37` sit on the fact side and must stay there.** They are the two rows most likely to drift, because the useful-sounding version of each is the one that crosses.

---

## ✅ PROFILE / CV — ALL FOUR WAVES RULED (Aug 2026)

**43 rows.** 41 from the original board, plus **`P-29b`** (grouping suggestions) and **`P-42`** (Fee Assistance) which emerged during the batches.

**Cut:** `P-5` publish-all · `P-15` variants · `P-16` one-page · `P-35` demographics · `P-40` advisor summary. **Moved:** `P-36` → Story Bank.

**Nothing is open.**


## ✅ RULED — BATCH 5: second-round features

**Eight proposed after the four waves closed. Three build, five die.**

| # | Feature | Ruling |
|---|---|---|
| **P-43** | **Citation formatting** | **BUILD.** Publications and posters render as proper citations — authors, venue, year, one consistent style. **Research owns the records; the CV owns the format.** Deterministic and genuinely fiddly by hand |
| **P-44** | **Duplicate detection at assembly** | **BUILD.** The same experience logged in two pillars appears twice on the CV. **Volunteering checks at add-time; nothing checked at render.** ⚠️ **This is embarrassing on a document you hand a professor**, which is exactly the failure class this tab exists to prevent |
| **P-45** | **The AMCAS photo** | **BUILD.** A slot plus the stated requirements. Small, required, **and a classic week-of-submission scramble** |
| **P-46** | **Language proficiency level** | **BUILD — one-line fix to `P-34`.** AMCAS wants the proficiency, not just the language |
| **P-47** | **Published-version history** | **CUT.** *"What did I send my PI in March?"* is answered by **the dated PDF in your sent mail.** The export already IS the snapshot. **A version store grows forever and complicates the deletion promise** — cheap to add, expensive to own. **Reopens on a real complaint, not a predicted one** |
| **P-48** | **Slot ordering** | **CUT.** Whether AMCAS entry order matters is contested in the community, **and if HQ suggested an order that would be ranking** (`U-9`). The student can reorder; HQ has no opinion |
| **P-49** | **Institutional action disclosure** | **CUT, firmly.** The single most consequential field in the application, highly sensitive, **and HQ storing it adds nothing** — it is answered on AMCAS. Same reasoning as `P-35` |
| **P-50** | **Transcript request tracking** | **MOVED TO TIMELINE.** It is a dated task with a deadline, which is what Timeline's roadmap nodes are for. **Profile/CV holds records, not errands.** ⚠️ **Requesting transcripts late is a genuine cycle-killer nobody warns first-timers about** — it must actually land in Timeline, not evaporate in the handoff |

**Running total: 47 rows. 4 cut this batch, 1 moved out, 4 built.**

## 7. ⚠️ The conflict this board found

**`09` §8 says Profile/CV owns the activities as CV LINES and Story Bank owns the TEXT. But the 700-char description IS text**, and it is the thing the 15 slots exist to hold.

**Three ways out:**

1. **Write it at the Story Bank desk, display it here read-only.** Consistent with `draft | ready` and with `P-4`. **The cost is a tab-switch at the moment of highest friction.**
2. **Write it here, and Story Bank stops at material.** Cleaner in the moment, but **it makes this tab an editor** and contradicts the do-not-generalize anchor.
3. **The desk opens over this tab** — same component, invoked from the slot. **One editor, two entry points, no second store.**

**My read is (3)**, because it satisfies both rules literally: one store, one editor, and the student never leaves the page they were working on. **Needs Andy.**

## 8. Proposed cuts — argue with these

| Cut | Why |
|---|---|
| **Public profile page** | Second privacy surface, second permission model, and the real need is served by an export (Q2) |
| **CV strength / completeness score** | `U-9`, unambiguously |
| **HQ picking most-meaningful** | `SB-27` |
| **Rich text, templates, font control** | The word-processor cede |
| **CV variants (`P-15`) and one-page mode (`P-16`)** | Doubles every downstream surface to serve a case a first-year does not have |
| **LinkedIn / ORCID import** | An incumbent nobody in this workflow uses for this purpose |

## 9. What I need from you, and it is short

**Andy has no lived experience of an AMCAS application yet**, so the interview step has less to draw on here than it did for Research. **Three questions carry the whole board:**

1. **Q1 — printable CV, or lines only?**
2. **Q2 — public profile: cut it?**
3. **§7 — where does the 700-char get typed?**

**Everything else can be ruled from the list.**
