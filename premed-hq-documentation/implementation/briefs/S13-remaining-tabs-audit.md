# S13 · The other seven tabs — they are not missing catalogs, they were never specced

**Built Aug 2026** while working down the list of tabs without feature catalogs. **The list was misdescribed, including by me an hour ago.**

## The finding

**Six of the seven have specs that are scaffolds** — section headers with placeholder prose. `09-essays-story-bank.md` §Purpose reads, in full: *"Define the exact user outcome this tab supports."*

| Tab | Spec | Page | Reality |
|---|---|---|---|
| **School List** | **80 lines · stub** | `Schools.tsx` **63 lines** | Scaffold |
| **Essays & Story Bank** | **80 lines · stub** | `Essays.tsx` 191 | Scaffold |
| **Letters** | **80 lines · stub** | `Letters.tsx` 143 | Scaffold |
| **Profile / CV** | **80 lines · stub** | `Profile.tsx` 277 | Scaffold |
| **Help** | **78 lines · stub** | `Help.tsx` 88 | Scaffold |
| **Settings** | **78 lines · stub** | `Settings.tsx` **571** | Scaffold spec, **substantial code** |
| **Timeline** | **300 lines · REAL** | `Timeline.tsx` 131 | **Specced Aug 2026.** The exception |

**Every stub carries the same boilerplate**: *"Purpose — define the exact user outcome this tab supports"* · *"Core entities — records that belong here"* · *"Acceptance criteria (TBD)"* · *"Open decisions (TBD)."*

> **A feature catalog for a scaffold would be an empty table.** **These tabs do not need cataloguing. They need speccing**, which is a different and much larger job than the one I was about to start.

## What each stub already commits to

**Not nothing.** Each carries an ownership block and a *do-not-generalize* anchor, which are real constraints and the right starting point:

| Tab | Owns | The anchor |
|---|---|---|
| **Story Bank** | Stories · personal statement · secondaries · linked docs | **Narrative and draft metrics only. Never hours, never scores.** Stories link to experiences as source material — **capture-once** |
| **School List** | The list, per-school requirements and status | — |
| **Letters** | Letter requests, recommenders, status | **Structure is on `CLAUDE.md`'s MUST-NOT-CHANGE list.** Deep-link prefill only, from every pillar |
| **Profile / CV** | The AMCAS export preview | **Owns the app-wide 15-entry cap and the most-meaningful 3** (`03-clinical-views-board.md` V3) |

## The one that is load-bearing and blocking

**Story Bank.** Aug 2026 ruling, recorded in `implementation/deferred.md` and `07-extracurriculars.md`:

> **"Story Bank is not a feature; it is the input to the application-year features."**

**Three specced features depend on it and none can be built until it exists:** **`E-16`** (700-character AMCAS descriptions drafted from real material) · **the most-meaningful suggestion** (sorts by how much the student has written) · **`E-21`** (the app-wide writing assistant).

**And the entire `RM-1` – `RM-6` reflection mechanism written today feeds it.** **Five pillars now have triggers, a conversation model, search, threads, and a headline — all pointing at a surface defined by an 80-line scaffold.**

**Its ruled constraints, already scattered across other files:**

- **Aggregate view, never a store receiving copies** (`03-clinical-views-board.md` V5). **One record set, two doors.**
- **Everything the student writes** — reflections, initiative outcomes, `E-14`, `E-12`, lab notes, 700-char descriptions, PS and secondary drafts.
- **Only what the STUDENT wrote.** Not Timeline node notes, not Sauce blurbs, not imported physician bios, **not HQ's side of a reflection conversation** (`RM-2`). *"A bank mixing your words with material handed to you is useless as essay input."*

## Recommended order, if these get worked

1. **Story Bank** — blocking three features and the destination of everything written today.
2. **Profile / CV** — owns the 15-entry cap and the most-meaningful surface; **every pillar deep-links into a scaffold.**
3. **Letters** — every pillar prefills into it, and its structure is locked, so the spec is mostly writing down what must not change.
4. **School List** — feeds Shadowing's DO-letter gap and `L-D`'s cost projection.
5. **Settings** — **571 lines of code against a 78-line stub.** The largest spec-to-code gap in the project, and probably the one most likely to contain undocumented behaviour.
6. **Help** — last, and legitimately.

## Correction to the record

**`S12` and my own summary called these *"tabs without catalogs."*** **That framing implied the specs were done and only the index was missing.** **The opposite is true**, and the mistake would have produced seven empty tables that looked like progress.
