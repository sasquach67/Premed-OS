# `U-12` incumbent audit — every pillar, Aug 2026

**`U-12` (`general.md`) was written during the Research pass and no other pillar had been tested against it.** This is that pass.

**The test:** does a mature product already do this → can this student get it free or cheap → **then HQ does not rebuild it; HQ builds the layer the incumbent lacks.**

**⚠️ This audit added a fourth clause. See §0.**

---

## 0. `U-12` gains a fourth clause — CAN HQ REACH IT?

**Canvas forced this.** **The test as written assumes that if an incumbent exists, HQ can hand off to it. Sometimes HQ cannot.**

> **4. If HQ cannot integrate with the incumbent, HQ may duplicate — MINIMALLY, by paste, and never by sync.**

**Three outcomes, not two:**

| | Meaning | Example |
|---|---|---|
| **CEDE** | The incumbent does it; HQ points out | **Anki · LabArchives** |
| **BRIDGE** | HQ keeps a minimal record and reads one-way | **Zotero** (`B-7`) |
| **DUPLICATE-MINIMAL** | **Reachable? No. HQ re-enters by paste, stores the least it can** | **Canvas** |

**`DUPLICATE-MINIMAL` is not a loophole.** **It requires proving the integration is impossible, not merely inconvenient**, and the duplicate must be the smallest thing that works.

---

## 1. MCAT vs. **Anki** — CEDE. The largest finding in this audit.

**Anki is free. MileDown (2,888 cards) is free. AnKing MCAT (6,200+ cards) is $6/month via AnkiHub.** **Spaced repetition is backed by decades of learning science and is standard in the study plans of top scorers.**

**Every premed already runs Anki.** **It is the most refined tool in the category and HQ cannot approach it.**

### ⚠️ HQ MUST NOT BUILD

**A flashcard system. A spaced-repetition scheduler. A card review queue. Card authoring. Deck management.** **Any of these is a fifth-best Anki**, and the `Lab notes` precedent applies exactly: **the ≤5-second logging rule and `S0` both break on a card library.**

### What HQ keeps — and it is substantial, because Anki does none of it

| | Why Anki cannot |
|---|---|
| **The plan** — dates, phases, what to do this week | Anki schedules cards, not a study campaign |
| **Score tracking** — FL practice results over time, by section | Anki has no concept of a practice test |
| **Section-aware weakness reading** — from the student's OWN practice data | Requires the score history HQ holds |
| **The bookshelf** — which resources they own and have finished | Resource inventory, not content |
| **The MCAT date and everything that counts back from it** | — |

### ✅ `mcat-section-aware-drills.html` — RESOLVED. It STANDS, with one addition.

**The mockup was read. It is not a flashcard system and the surface-level resemblance is misleading.**

| | **Anki** | **HQ's drills** |
|---|---|---|
| **Where content comes from** | **A pre-made deck** — AnKing, MileDown | **The student's OWN missed questions**, tagged by cause (`arithmetic`, `trap-answer`) and source |
| **What a card IS** | **Recall of a static fact** | **A generated exercise.** *"An arithmetic miss → a real calculation. A trap-answer miss → a PATTERN drill, no passage"* |
| **How it is graded** | **Self-rated** — again/hard/good/easy | ***"Scheduling is automatic — the answer is the grade."*** **No self-rating** |
| **Scale** | **6,200+ cards** | **A mistake log. Tens to low hundreds** |

**Anki cannot hold this content.** **It cannot know you missed a question because you fell for a trap answer on FL3.** **A student could hand-make that card, but the drill is generated FROM the miss, which is the part HQ owns.**

**On the scheduler specifically — the one real overlap.** **HQ's is three buckets** (*wrong → soon · right-but-flagged → medium · right-and-unflagged → long*). **Anki's FSRS is vastly more sophisticated and that does not matter here**, because **the sophistication pays off across thousands of cards over years, not across a mistake log during one prep cycle.** **And the no-self-rating divergence is deliberate and correct: a wrong calculation is objectively wrong, so asking the student to rate their own recall would be worse, not simpler.**

**⚠️ THE LINE, and it is narrow: the drill queue is fed ONLY by the student's own attempts.** **The moment HQ ships or imports a content deck, `U-12` fires and this ruling is void.** **No HQ-authored cards. No pre-made decks. No card authoring UI.**

**The addition — `M-ANKI`:** **one dismissible pointer that Anki exists and MileDown is free** (`N-12` pattern, `U-8` — states it, never instructs). **Plus export a miss as plain text so a student can paste it into their own deck.** **One-way out, consistent with the no-two-way-sync rule.**

---

## 2. Academics vs. **Canvas / Sakai** — DUPLICATE-MINIMAL. Integration is impossible, and that is a finding.

**Canvas is the incumbent for assignments and due dates and UNC runs it. Tests 1 and 2 pass overwhelmingly.**

### ⚠️ But HQ cannot connect, and this is architectural rather than a matter of effort

- **Third-party access needs a Developer Key** — an OAuth2 **client ID and secret pair** issued by a **root account administrator**, after an **institutional security review.**
- **A client secret cannot live in a static GitHub Pages bundle.** It would be in the JavaScript.
- **The OAuth2 flow needs a server** to exchange the code. **HQ has no backend by design.**
- **Personal access tokens exist but are the wrong instrument** — universities publish policies restricting them, tokens issued after Oct 2015 **expire in one hour** and require refresh, and every institution's guidance says **do not give your token to a third-party application.** **HQ asking a student to paste one would be asking them to violate their own university's policy.**

### The ruling

**`DUPLICATE-MINIMAL`.** **`academics-syllabus-import.html` is the correct answer and it was already the right instinct** — **paste the syllabus, extract the dates, confirm them** (`U-10`: extraction proposes, the student confirms).

**⚠️ Do not spec, propose, or prototype a Canvas sync. Recorded here so it is not re-raised.** **The blocker is the client secret, and no amount of design removes it.**

**Store the least that works:** title, due date, course, status. **Not submissions, not grades from Canvas, not attachments.**

---

## 3. Letters vs. **Interfolio** and the **AAMC Letter Writer Portal** — CEDE delivery, keep the relationship.

**Interfolio Dossier is free to request and store letters; `$59.99` to deliver (50 deliveries).** **It is a preferred AMCAS service.**

**⚠️ NEWER THAN THE LETTERS SPEC:** **for the 2026 entering cycle and beyond, AAMC launched a Letter Writer Portal that lets applicants send letter requests directly from the AMCAS application.** **The Letters spec predates this and must be re-read against it.**

### ⚠️ HQ MUST NOT BUILD

**Letter delivery. Letter storage. A waiver/FERPA workflow. Anything that receives a letter from a writer.** **Confidentiality is the whole product here and HQ has no standing to hold a confidential letter** — `localStorage` on a student's laptop is the wrong place for a document the student is not allowed to read.

### What HQ keeps

**The relationship and the ask** — who, how strong, last contact, what they were sent, whether the request went out, and **the deep-link prefill.** **`PIRelationship` and `ContactCard` already do this and are shared with Research.** **No incumbent tracks the four-year relationship that produces the letter; they only move the file at the end.**

---

## 4. School List vs. **AAMC MSAR** — CEDE the data, keep the list.

**MSAR is `$28`/year (`$36` for two).** **It is the only source carrying data directly from the MCAT exam, the AMCAS application, and admissions offices**, and it already offers sort, browse, and side-by-side comparison of up to ten schools.

### ⚠️ HQ MUST NOT BUILD

**A medical school database. Median GPA/MCAT figures. Acceptance rates. In-state percentages. A comparison table.** **Two reasons were given. ⚠️ CORRECTED Aug 2026 — only one of them holds:**

1. ~~*"MSAR's data is licensed and republishing it is not HQ's to do."*~~ **OVERSTATED.** It forbids copying MSAR; **it does not forbid compiling the same facts from schools' own public pages. Facts are not copyrightable.**
2. **✅ HOLDS: any hand-maintained copy will be stale in a year, which is worse than absent.** 227 schools × ~15 fields, re-verified annually, by one student.

**The ruling stands — Andy re-confirmed it after the correction** (`tabs/08-school-list-board.md` §1). **It now rests on maintenance, which is true, rather than licensing, which was not.**

### What HQ keeps

**The student's own list** — which schools, why each one is on it, reach/target/likely **as the student's own judgement rather than a computed tier**, application status, secondaries, interviews, and the dates. **`U-9`: nothing is scored.** **MSAR tells you about schools. HQ tracks YOUR application to them.** **No overlap.**

---

## 5. Clinical · Volunteering · Shadowing · ECs — NO INCUMBENT. Build.

**Checked and cleared.** **Generic hour-tracking and volunteer-management apps exist (Track it Forward, Golden), but they are employer- or organisation-side, not premed-side**, and **none is AMCAS-shaped.**

**Nothing tracks experience against the fifteen-activity AMCAS limit, most-meaningful designation, hour categories an adcom recognises, or the reflection that becomes an essay.** **That absence is the reason HQ exists.**

**`U-12` explicitly does not presume against building** — it is a test, and here it returns *build*.

---

## 6. Story Bank · Profile/CV · Timeline · Overview — NO INCUMBENT. Build.

**Story Bank has no competitor in any category.** **Profile/CV overlaps generic CV builders only in output format, not in the four-year accumulation that feeds it.** **Timeline is HQ's own roadmap.**

---

## 7. Summary

| Pillar | Incumbent | Outcome | Cost to student |
|---|---|---|---|
| **MCAT** | **Anki** | **CEDE** — no flashcards, no SRS | **Free** |
| **Academics** | **Canvas** | **DUPLICATE-MINIMAL** — paste, never sync | Free but **unreachable** |
| **Research · Lab notes** | **LabArchives** | **CEDE** — ruled Aug 2026 | Free via UNC |
| **Research · Literature** | **Zotero / Sciwheel** | **BRIDGE** — one-way read | Free |
| **Letters** | **Interfolio · AAMC portal** | **CEDE delivery**, keep the relationship | Free to store · `$59.99` to deliver |
| **School List** | **AAMC MSAR** | **CEDE the data**, keep the list | `$28`/yr |
| **Clinical · Volunteering · Shadowing · ECs** | **None** | **BUILD** | — |
| **Story Bank · Profile/CV · Timeline** | **None** | **BUILD** | — |

### Two things this audit changed beyond the rulings

**`U-12` gained a fourth clause** (§0) — reachability, and the three-outcome vocabulary.

**Two specs are now known to be out of date:** **Letters** (the AAMC Letter Writer Portal is new for the 2026 cycle) and **`mcat-section-aware-drills.html`** (unresolved until the mockup is read against §1).
