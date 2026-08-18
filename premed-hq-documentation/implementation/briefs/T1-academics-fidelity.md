# T1 · Academics — Syllabus Import visual translation

**Stage:** E · FRONTEND MISSING

**Scope:** The Syllabus Import flow only. Its behaviour is shipped and correct;
its screen was never translated from the drawing. **Translate the screen. Do
not rewrite the parser, the diff engine, the store, or the migrations.**

**One deliberate exception**, named here so nobody has to guess: the
wrong-document state (§4.1-M-d) is newly drawn and has no detection behind it.
Building the state without its one classifier would ship a screen that can
never appear. §4c authorizes that single addition and nothing else.

---

## 1. Fidelity audit — completed before this brief

### a. Spec → paper

**No Stage-A blocker remains.** Every ruled Academics feature now has a mockup
surface. The last three closed in `0e90cdd`: §4.1-K Study method, §4.1-L the
forgetting curve, and §4.1-M-d wrong document.

### b. Mockup → app — the gap this brief exists to close

| | Ruled / drawn | Shipped |
|---|---|---|
| **Container** | A **temporary full-screen flow** (§4.1-M-a: *"like exam prep mode, import is a temporary full-screen flow, not a permanent surface"*) | `<Dialog>` with `<DialogContent className="max-w-xl">` — `ClassCenter.tsx:2184` |
| **Banner** | Layered gradient, quiet cancel/back above the title, a mode tag that states state and never a step count, glass stat strip | `<DialogHeader><DialogTitle>` — one line of text |
| **Review layout** | Uneven two-column workspace, `.split` = `1fr 372px` | Single column inside a `max-w-xl` dialog |
| **Apply rail** | Sticky solid-with-depth panel listing the exact records to be written | A `<DialogFooter>` button whose label carries the summary |
| **Groups** | Configured cards; clean groups collapse to one factual summary, flagged groups expand with amber evidence | Native `<details>` / `<summary>` — `ClassCenter.tsx:2196` |
| **Re-import** | Compact editorial diff rows: status tag, old→new, two explicit choices | `ReimportReview` renders inside the same narrow dialog |
| **Upload** | Dropzone dominant in a narrow reading column (`.center`, max 840px) | Dropzone plus a bare `<Textarea>` stacked in the dialog |
| **Wrong document** | Frame 4 — contained recovery card, Academics accent, did-not-find list, "File it in Materials" primary | **Does not exist** |

**The behaviour is not the problem and must not be touched.** Parsing,
evidence quotes, `searched[kind]`, scan detection, the weight-gap warning that
explicitly does not normalise, the identity-based three-way diff with its
`Keep mine` defaults, local blob retention, and all four entry paths are
shipped and correct.

### c. Already built — do not rebuild

- Syllabus parsing, local retention, scoped import, weight persistence,
  identity-based re-import: `69a0b41`, `93bfeb8`, `1ee2c87`.
- Exam Prep temporary mode: `1fb6ea7`. **This is the pattern to copy** — see §3.
- Class Center / Class Hub ownership: `9f4d3ac`, `7ddf493`.
- The four drawings and their decision records: `0e90cdd`, `7b8d373`.

### d. Gate

`BUILD-MANIFEST.md` → Academics · Daily marks
`01-academics/academics-syllabus-import.html` **`YES`**. **Cleared.**

Frame 4 (wrong document) was added to that same cleared source, so it is
covered by the same row. **No new row is needed and none may be added.**

⚠️ **C3 is still open and is not this brief's business.** The manifest also
marks `academics-requirements.html` `YES`, and that file does not exist. Do
not act on that row.

### e. Decisions files

`academics-syllabus-import.md` records **behaviour and appearance**, including
frame 4, as of `0e90cdd`. **This brief is fully specified on appearance** —
which is the whole reason Stage E can be written at all.

### f. Integrations and services

**None.** The flow is entirely local: `syllabusParser.ts` makes no network
call, and source files are retained via `localBlobStore.ts` → `idb-keyval`,
whose contract is that bytes never enter Zustand, localStorage, JSON export, or
remote sync. **No ANDY CHECKLIST items.** Nothing here waits on a console, an
OAuth client, an API key, or a repo secret.

---

## 2. References — read all of these, including the mockup itself

| What | Where |
|---|---|
| **The drawing — all 4 frames** | `mockup-lab/01-academics/academics-syllabus-import.html` |
| **The appearance decisions** | `mockup-lab/01-academics/academics-syllabus-import.md` |
| ⚠️ Literal visual values | `mockup-lab/_shared/_visual-recipes.md` — **used literally, never approximated** |
| The binding spec | `premed-hq-documentation/tabs/01-academics.md` §4.1-M, §4.1-M-a…d |
| **The temporary-mode precedent in this repo** | `src/components/academics/ExamPrepMode.tsx:124`, mounted at `ClassHub.tsx:149-156` |
| What must not change | `src/lib/academics/syllabusParser.ts`, `syllabusReimport.ts`, `localSyllabusFiles.ts` |
| The component being replaced | `src/components/academics/ClassCenter.tsx:2117-2215` |
| Component reuse | `premed-hq-documentation/implementation/component-inventory.md` |
| The rules | `specifications/05-experience-pillar.md` (`U-1`…`U-12`) |

---

## 3. The work — translate the screen

### 3a. Promote the flow out of the dialog

**Copy the pattern this repo already uses for exam prep.** `ExamPrepMode.tsx`
returns `<main className="min-h-full bg-background">` and `ClassHub` swaps it in
for the normal view when `requestedExamPrep` is set. Do the same: a
`SyllabusImportMode` that replaces the Class Center view while active.

- **All four entry paths keep their current URLs and behaviour.** Cold start
  (`ClassCenter.tsx:482`), Class Hub Materials
  (`ClassHub.tsx:643`), the syllabus-row re-import (`ClassHub.tsx:669`), and
  the scoped `importFor` param (`ClassCenter.tsx:710-718`) must all still work,
  and re-import must still carry `reimport` and `reimportFile`.
- **Entry determines scope, and scope changes one block only.** Unscoped leads
  with "Which class is this?"; scoped replaces it with a static class header.
  Everything after is identical. This already works — preserve it.
- **Exiting returns where the student came from**, and clears the params, as
  the current `onOpenChange` does.

### 3b. The banner

Use the `_visual-recipes.md` banner recipe **literally** — the three-layer
gradient, not a flat fill. Above the title, the quiet cancel/back affordance and
the **mode tag**, which states state (`nothing saved yet`, `review before
apply`) and **never a step number**. §4.1-M-b: no wizard, no step counter.

The glass recipe applies to the **stat strip only** — `Items found`,
`Need a look`, and on re-import `Added / Changed / Removed / Untouched`.
Nothing else on this screen gets glass.

### 3c. The three existing states

- **Upload** — dropzone dominant in a narrow reading column (max 840px,
  centered). Keep `AnimatedFileUpload`; **do not fork it.** Paste and manual
  entry sit beneath as equal paths, not degraded ones. Parsing names what it is
  doing ("reading week structure…") with a determinate strip, never a bare
  spinner. The supportive `MascotNote` is secondary.
- **Review** — the `1fr 372px` split. Left: groups in the ruled order (identity
  → exams → weights → units → deadlines → policies → logistics), clean ones
  collapsed to one factual summary line, flagged ones expanded with amber
  evidence and the source quotation attached to the field it supports. Right: a
  **sticky** Apply rail listing the exact records to be added or changed, so
  inspection is more prominent than completion. Replace the native `<details>`
  with configured `InteractiveCard`/`Collapsible` — **do not build a new
  accordion.**
- **Re-import** — a compact editorial diff, not a table wall: status tag,
  old→new value, and two explicit choices per row, with the selected default
  visibly selected. Unchanged items stay collapsed and counted.
  **The existing diff engine owns matching and defaults; the UI only renders
  them.** Do not reimplement `syllabusReimportDiff`.

### 3d. Weight validation stays exactly as honest as it is

Categories must visibly sum to 100%, and when they do not, the gap is stated
and **nothing is normalised**. This already works — do not soften the copy and
do not add an auto-fix.

### 3e. Frame 4 — the wrong-document state

Build it as drawn: a **contained recovery card inside the same review
composition**, in the **Academics accent, not the warning tone** used by the
nothing-parsed card. Nothing failed here — the file read perfectly and simply
is not a syllabus, and the treatment must say so.

- The did-not-find list: grade weights, exam dates, a week-by-week schedule, an
  instructor block — with the one thing that *was* found shown in accent as the
  reason Materials is the better home.
- **Primary action: File it in Materials.** Secondary: review it as a syllabus
  anyway. Tertiary: try another file.
- **The Apply rail stays visible and reads "Nothing to apply"** with explicit
  zero counts. A rail that vanished would hide the fact that this import writes
  nothing.
- The file is retained either way — it is already attached before parsing
  begins, and every route out must keep it.

**The one authorized logic addition:** a classifier in `syllabusParser.ts` that
decides whether a parsed document reads as a syllabus at all, distinct from the
existing `scanDetected`. It is a proposal like every other one on this screen —
the "review it anyway" override must always be available, because some syllabi
genuinely carry no weights table. **Nothing else in the parser may change.**

---

## 4. Do not break

- **Do not touch** `syllabusParser.ts` beyond §3e's classifier,
  `syllabusReimport.ts`, `localSyllabusFiles.ts`, `localBlobStore.ts`, or any
  migration. No store schema change. No new persisted field beyond what the
  classifier needs.
- **Do not regress** what `D9a-syllabus-ingestion-gaps.md` §1 lists as
  must-hold: client-side-only parsing, the key-free deterministic parser,
  `evidence.quote` + `location` on every item, `searched[kind]` naming what was
  not found, scan detection, the non-normalising weight-gap warning,
  `AnimatedFileUpload` reuse, `useToast`.
- **Do not add a wizard, a step counter, or a progress bar.** §4.1-M-b, and
  `U-9`.
- **Do not add an auto-apply-if-confident shortcut.** Review-before-apply is
  non-negotiable.
- **No share button, no shared-parse table, no server upload path** — still out
  of scope per `D9-syllabus-ingestion.md` §1.
- **Do not fork** `AnimatedFileUpload`, `MascotNote`, `InteractiveCard`, or
  `Collapsible` to change one.
- `_visual-recipes.md` values are **literal**.
- **Do not touch the ~114 pre-existing working-tree changes**, including the 8
  staged Academics mockups. They are another session's and commit separately.

---

## 5. Done when — every item provable

- [ ] Syllabus import renders as a **temporary full-screen mode**, not a dialog.
      `rg -n "DialogContent" src/components/academics/ClassCenter.tsx` no longer
      matches the syllabus import flow.
- [ ] All four entry paths still open it, and re-import still carries
      `reimport` + `reimportFile`. Exiting restores the prior view and clears
      the params.
- [ ] The banner uses the literal three-layer gradient; **glass appears on the
      stat strip only.** `rg -n "glass" ` over the new component shows no
      second use.
- [ ] The review state renders a `1fr 372px` split with a **sticky** Apply rail
      naming the exact records to be written.
- [ ] Clean groups are collapsed to a summary; any group with a low-confidence
      item is expanded. Every item still shows its quoted source and location.
- [ ] Native `<details>` is gone from this flow.
- [ ] Re-import renders as editorial diff rows with visible selected defaults;
      `syllabusReimportDiff` is unchanged — `git diff --stat` shows no change to
      `syllabusReimport.ts`.
- [ ] The weight gap still states the shortfall and **normalises nothing**.
- [ ] The wrong-document state exists, uses the Academics accent rather than the
      warning tone, offers **File it in Materials** as primary, keeps the file,
      shows a zeroed Apply rail, and always offers the review-anyway override.
- [ ] **No mock or placeholder data** anywhere in the flow.
- [ ] `rg -n -i "step [0-9] of|progress|readiness|composite|rank"` over the new
      component returns nothing.
- [ ] Signed-out mode works; **both themes**; keyboard-only completes upload →
      review → apply; `:focus-visible` only; reduced motion honoured.
- [ ] `npm run test` and `npm run build` pass.
- [ ] The built screen is compared against all four frames of
      `academics-syllabus-import.html`, and the decision record receives the
      resulting commit.

---

## 6. Commit

```
fix(academics): translate syllabus import to its drawn full-screen mode (§4.1-M)
```

One commit. Unrelated working-tree changes commit separately.

---

## 7. Next stage — NOT in scope for this brief

After this lands, Syllabus Import should reach **F** for its own surface, and
the tab's remaining blocker becomes the **gate, not the ladder**: §4.1-K Study
method, §4.1-L the forgetting curve, Learning signals, Grade decisions,
Materials extensions, Lecture capture, Planning decisions, cold start, and term
rollover are all now drawn **and** decided, and **none of them has a
`BUILD-MANIFEST.md` row.** They cannot be built until Andy adds rows.

**Do not implement any of them here, and do not add a manifest row.**
