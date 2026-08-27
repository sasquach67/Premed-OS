# Academics · interaction-first audit — 2026-08-27

**Method:** every path below was **clicked in the running app** (headless Chrome
over CDP against `localhost:5173`, isolated browser context per case). Nothing
here is claimed from static DOM or source inspection.

**Promotion result: nothing marked `built`.** Proofs 5 (integrations) and 6
(commit provenance) still fail, and Daily remains only partially exercised. See
*Remaining blockers*.

## Harness note — why earlier passes could not do this

The in-app browser pane runs **0 rAF frames/second**. Motion's `AnimatePresence`
therefore never settles: a client-side tab switch leaves **two** copies of a
panel mounted at opacity `0.04` and `0.84` forever. An audit that screenshotted
or measured after an in-app navigation was measuring a frozen half-transition.

Two rules follow, and both are used throughout:

1. Reach every state by **hard load**, never by client-side transition.
2. Seed fixtures **once** (`Page.addScriptToEvaluateOnNewDocument` re-runs on
   reload; without a guard it re-seeds and masquerades as a persistence failure —
   it produced one false "record did not survive reload" before the guard).

## Critical path · Grades & archive → Add a transcript record

| | |
|---|---|
| **1 · Start** | `#/academics?mode=planning&tab=archive`, empty store |
| **2 · Control** | `Add a transcript record` |
| **3 · Result** | Opens **transcript intake**: drop target (PDF/DOCX/PNG/JPG), paste box, `Enter one line manually`, `Cancel`, `Review lines`, and a disabled `Email a transcript · NOT CONFIGURED` note |
| **4 · Persistence** | Nothing written at this stage |
| **5 · Visual** | Measured below; both themes, both widths |
| **6 · Blocker** | none |

### What it did before

`Add a transcript record` went straight to a **manual field grid**. The screen
matched the approved mockup and was still functionally misleading: the one thing
a student actually holds — a transcript file — had nowhere to go. The mockup was
the cause, not the app: `academics-grades-archive.md` ruled the *record* and
never ruled *ingestion*. That is the failure mode `VARIANT-LAB.md` already names
— "a decisions file silent on appearance produces a screen that works and looks
wrong" — here in its behavioural form.

**The contract was changed first**, then the app was built to it:
`transcript-intake` and `transcript-review` were drawn into
`mockup-lab/01-academics/academics-grades-archive.html`, the behaviour and
appearance rules added to the `.md`, both mirrored to
`premed-hq-documentation/specifications/mockups/`, and the lab registry updated.

### Clicked paths

| # | Start | Control clicked | Result | Persistence | Blocker |
|---|---|---|---|---|---|
| 1 | empty archive | `Add a transcript record` | intake stage | none written | — |
| 2 | intake | paste 3 UNC lines → `Review lines` | review: 3 rows, exact quotes, 1 chipped `Needs you` | none written | — |
| 3 | review | `Save 3 records` | ledger appears | 3 records; **byte-identical after reload** | — |
| 4 | review | `Back` | returns to intake, file still loaded | none written | — |
| 5 | intake | `Cancel` | returns to empty state | **0 records written** | — |
| 6 | intake | drop `transcript.zip` | `Unsupported file — …Supported: PDF, DOCX, PNG, JPG, or plain text.` | none | — |
| 7 | intake | drop `scan.png` (no text layer) | `No readable text — …Paste the text, or enter the line manually.` | none | — |
| 8 | intake | paste non-transcript prose | `No transcript line found` | none | — |
| 9 | ledger | `Transcript record tools` → `Import a transcript` → paste same transcript | both rows chipped `Already recorded`, excluded by default, button reads **`Save 0 records`** and is **disabled** | re-import added **0** records | — |
| 10 | intake | `Enter one line manually` | original exact-field grid, with `Back` | unchanged | — |

### Exactness, honesty, and what is never inferred

- `3.000` and `A-` are stored **as printed** — not coerced to `3` or `A`.
- `BIOL 205 CELL BIOLOGY A` has no credit on the line. The saved record's
  `creditsExact` is `""` and the row is chipped `Needs you`. **Nothing guessed.**
- Every row shows its **source line** verbatim, so a value can be checked
  against the page it came from.
- `classificationSource` / `classificationReason` are **undefined** on every
  parsed record — BCPM is never inferred from a parsed line (asserted in test).
- A grade a transcript prints but `LetterGrade` does not model (`W`, `S`, `CR`)
  stays exact on the transcript record; the linked course simply carries no
  letter grade rather than a wrong one.
- Repeated attempts are surfaced, never merged — a retake is a real transcript
  fact, so keeping both is an explicit choice.

## Measured visual conformance — app vs mockup rule

`getComputedStyle` in the running app, against the mockup's own CSS rule.
Captured at 1440×900 and 1024×768, dark and paper.

| Property | Mockup rule | App · dark | App · paper |
|---|---|---|---|
| page | `--bg #211e1a` | `rgb(33,30,26)` ✅ | `rgb(247,239,225)` ✅ |
| card | `--card #2b2722` | `rgb(43,39,34)` ✅ | `rgb(255,250,240)` ✅ |
| row / drop | `--muted #322e28` | `rgb(50,46,40)` ✅ | `rgb(239,230,212)` ✅ |
| review cell | steps back to `--card` | `rgb(43,39,34)` ✅ | `rgb(255,250,240)` ✅ |
| shell max-width | `1060px` | `1060px` ✅ | `1060px` ✅ |
| shell columns | `1.35fr / .65fr` | `706.05 / 339.94` ✅ | same ✅ |
| shell gap | `14px` | `14px` ✅ | same ✅ |
| card radius / padding | `16px` / `17px` | `16px` / `17px` ✅ | same ✅ |
| row radius / padding | `12px` / `11px` | `12px` / `11px` ✅ | same ✅ |
| cell radius | `9px` | `9px` ✅ | same ✅ |
| drop border | dashed | `dashed` ✅ | same ✅ |
| horizontal scroll | none | none at both widths ✅ | ✅ |

**The ladder steps correctly in both themes** — page → card → row, with review
cells stepping back up to card. This is the check CLAUDE.md requires after nine
Academics surfaces shipped with `bg-muted/15–50` and collapsed the ladder.

Screenshots: `output/proof/academics-2026-08-27/` (20 files, literal viewport).

## Rendered inert-control audit

Every visible `button` / `[role=menuitem|tab|checkbox|switch]` on each route was
checked for a real React handler on itself or a wrapper (Radix puts handlers on
wrappers); `disabled` counts as a stated refusal, not inertia.

```text
Daily · Class Center   empty      total= 16 unresolved=0
Daily · Class Center   populated  total= 17 unresolved=0
Daily · Assignments    empty      total= 15 unresolved=0
Daily · Assignments    populated  total= 24 unresolved=0
Planning · Planner     empty      total= 15 unresolved=0
Planning · Planner     populated  total= 41 unresolved=0
Planning · Grades      empty      total= 15 unresolved=0
Planning · Grades      populated  total= 20 unresolved=0
Transcript intake      intake     total= 18 unresolved=0
Transcript intake      review     total= 18 unresolved=0

ACADEMICS_CONTROL_AUDIT total=199 unresolved=0
```

Keyboard, review stage: **12 focusable controls, 0 without a visible focus
indicator.**

## Planning · empty-store honesty (proof 4)

Hard-loaded on an empty origin:

- Term GPA `—`, Cumulative `—`, Due today `0`, Day streak `0`.
- Planner cold start shows one fact only; Plan coverage reads
  `COMPLETE 0 · PLANNED 0 · NOT COMPLETE 0 · MANUAL REVIEW 0`.
- Every context field reads `Not recorded` — Major/program, Catalog + cohort,
  Premed path, Prior credit, Interests, and `MCAT · date not recorded`.
- Grades empty shows **no** tabs, filter, count, or export, and no GPA.
- Exactly two Planning tabs — `Planner` and `Grades & archive`. **No visible
  Tar Heel Tracker.** Preserved.

## Preserved decisions — verified, not assumed

| Decision | Evidence |
|---|---|
| No visible Tar Heel Tracker | rendered tab list is exactly `Planner`, `Grades & archive` on every route/state |
| Exactly Planner + Grades & archive | `tabsByMode.planning = ['planner','archive']`, confirmed in DOM |
| In-app source-versioned course library | `uncPlanningLibrary.ts` carries `catalogYear 2026-2027`, `sourceUrl`, `retrievedAt`, `sourceStatus`; discovery bay lists BIOL/CHEM candidates from it |
| Honest missing metadata | `Not recorded` / `Title not recorded` / `No recorded mapping` throughout |
| No fabricated official audit | every library node is `evaluation: 'official-audit-required'`; requirement drawer states *"Local planning evidence · live official audit is not configured"*; coverage counters stay 0 |
| Mockup-to-app visual fidelity | measured table above |

## Integrations — explicitly unconfigured (proof 5 · fails, correctly)

None of these has authoritative access, and each says so in the UI rather than
pretending:

| Integration | What the user sees today |
|---|---|
| UNC official catalog | `Catalog ingestion is not configured`; local recorded courses only |
| ConnectCarolina | linked out only; no live section or registration data |
| Official degree audit | `live official audit is not configured`; nodes marked `official-audit-required` |
| Transcript email import | disabled, chipped `Not configured` |

These stay unconfigured until authoritative access is provided. **They are the
reason proof 5 fails and no page may be promoted.**

## Defect found — first-use migration banner (Planning-owned, not fixed here)

**Reproduced live.** Empty store → `Add your first course` → the banner
*"Academics migration needs your review · 1 item needs confirmation"* appears and
survives reload. A brand-new profile has nothing to migrate.

Cause: `currentTermFor` in `src/store/migrations/academicsV4.ts` guards with
`hasAcademicRecords`, whose intent is documented as *"must not be shown a
migration-recovery banner for records that never existed."* But `addItem` pushes
the new course **before** calling `syncCurrentTermWorkspaces`, so on the very
first course `data.courses.length` is already `1`, the guard passes, and a
`current-term-confirmation` entry is journalled for a record the user just
created.

| | |
|---|---|
| Start | empty store, `#/academics?mode=planning&tab=planner` |
| Control | `Add your first course` |
| Result | migration banner + `Review migration` |
| Persistence | journal entry persists across reload |
| Blocker | **breaks proof 4 (honest first-use) for Planning** |

Left unfixed deliberately: the standing instruction for this pass was not to
modify Planning surfaces outside the authorised scope. It is a blocker for
Planner promotion and should be its own scoped change.

## Remaining blockers

1. **Proof 5 — integrations.** Catalog, ConnectCarolina, degree audit, and
   transcript email import are all unconfigured. ANDY CHECKLIST.
2. **Proof 6 — commit provenance.** The shared root carries concurrent
   authorised work; no mockup `.md` yet records this change's hash.
3. **First-use migration banner** above.
4. **Daily coverage is partial.** Class Center and Assignments were audited for
   inert controls and empty/populated rendering. The lecture → transcript →
   evidence chain, Materials intake, Guide proposal lifecycle, Review Session,
   and syllabus import review were **not** click-driven in this pass and remain
   unproven.
5. **Minor:** long institution strings visually clip inside review cells (the
   input scrolls; the value is intact and editable).
6. **Mobile** remains explicitly deferred.

## Files changed

| File | Change |
|---|---|
| `mockup-lab/01-academics/academics-grades-archive.html` | added `transcript-intake` + `transcript-review` views and their CSS |
| `mockup-lab/01-academics/academics-grades-archive.md` | ruled ingestion behaviour + appearance; revision note |
| `mockup-lab/variant-lab.html` | registered both views; bumped `variantSourceRev` |
| `premed-hq-documentation/specifications/mockups/…` | byte-identical mirrors of the above |
| `src/lib/academics/documentText.ts` | **new** — one shared PDF/DOCX/image/text extractor, carrying the canonical `pdfTextToLines` and the pdf.js worker fix |
| `src/lib/academics/syllabusParser.ts` | now consumes the shared extractor; re-exports `pdfTextToLines` (no behaviour change) |
| `src/lib/academics/transcriptParser.ts` | **new** — transcript line parser, duplicate keying |
| `src/lib/academics/transcriptParser.test.ts` | **new** — 11 tests |
| `src/components/academics/TranscriptIntake.tsx` | **new** — intake + review stages |
| `src/components/academics/TranscriptIntake.test.tsx` | **new** — 11 tests |
| `src/components/academics/GradesArchive.tsx` | empty state opens intake; `Import a transcript` on the populated route |
| `src/components/academics/GradesArchive.css` | intake/review styles at the mockup's literal values |
| `src/lib/academics/syllabusPdf.test.ts` | worker guard retargeted to the shared module; added a guard that syllabus import cannot re-fork the pdf.js path |
| `src/components/academics/PlanningFidelity.test.tsx` | updated to the new approved contract, keeping every original guarantee |

Not touched: flashcard surfaces, Planning components, app-wide surfaces, and the
224 unrelated dirty files already in the tree.
