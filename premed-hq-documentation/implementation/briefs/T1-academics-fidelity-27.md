# T1 · Academics — Term Report route and visual fidelity

**Stage:** E · BUILT, NOT YET FAITHFUL / PROMOTABLE  
**Scope:** Translate the already-built, manifest-cleared **Term report** into
its selected Variant A composition and give it one direct, reloadable route
from term rollover. This is a fidelity-and-wiring pass only. It does not build
Forecast Accuracy, redesign Grades & Archive, or change the Term Report model
or synthesis contract.

## 1. Step 1 audit

### a) SPEC → PAPER

`tabs/01-academics.md` #43 and §6.10-C require a term retrospective that fires
from rollover, is evidence-led, does not claim causation, and stays dormant
when history is too thin. All of those behaviours and their states are drawn:

| Ruled surface | Drawing | Selected treatment |
| --- | --- | --- |
| Completion report | `mockup-lab/01-academics/academics-term-retrospective.html?view=page` | **A · Term report** |
| Optional inspection treatment | `...?view=sections` | stays in the lab, not a product subtab |
| Honest thin state | `...?view=thin` | same one-column report composition |

`academics-term-retrospective.md` records both behaviour and appearance: narrow
reading column; violet rollover accent; ordered sections; left-rule
observations; warning-toned evidence limit last; solid-with-depth; no chart or
study score. Stage A and B pass.

### b) MOCKUP → APP — measured and structural comparison

The model and renderer exist, but the **screen does not match the selected
drawing or its entry semantics**.

| Drawing requirement | Current app evidence | Result |
| --- | --- | --- |
| Rollover opens a focused Term Report document | `TermRollover.tsx:97,110` calls `scrollIntoView()` on an element below the rollover | **Divergent.** It scrolls within the Ledger's tools accordion; it does not open the report. |
| Report is the selected narrow document in Grades & Archive | `GradesArchive.tsx:78` places `<TermReportPanel />` inside `Collapsible title="Transcript record tools"` | **Divergent.** Transcript entry, rollover, Term Report, and grade decisions become one long tool stack. |
| Reading order: completion stamp → at-a-glance → takeaways → carry-forward → evidence limit | `TermReportPanel.tsx:51–148` has the data, but renders it as a grid plus side rail inside that stack | **Partial.** Backend content exists; Variant A's deliberate one-column report hierarchy does not. |
| Canvas → panel → inner ladder | Selected drawing: `#211e1a → #2b2722 → #322e28`; `16px → 13px` | **Measured app values:** Archive cards are `rgb(43,39,34)` / `16px` and inner rows are `rgb(50,46,40)` / `13px` in warm dark. The solid ladder is right, but the hierarchy is in the wrong owner/route. |
| Paper theme ladder | Drawing: `#f7efe1 → #fffaf0 → #efe6d4` | **Measured app values:** canvas is `rgb(247,239,225)`, card `rgb(255,250,240)`, inner rows `rgb(239,230,212)` at the same radii. The tokens are right; the page composition still fails. |

The previous transcript-faithful Ledger/GPA/What-if work in `4cfdccd` is not
evidence that this report is visually complete. Its appearance belongs to this
separate mockup and must be checked independently.

### c) Already built — preserve

| Foundation | Commit / owner | Preserve |
| --- | --- | --- |
| Non-destructive rollover and topic fates | `b4f9a2e`; `TermRollover.tsx` | Course archive and topic fate semantics |
| Evidence compiler, persisted report, v31 migration, synthesis validator | `3116c8f`; `termReport.ts`, `termReportSynthesis.ts` | Frozen evidence snapshot, no-causation and closed-reference rules |
| Grades & Archive Ledger/GPA/What-if | `4cfdccd`; `GradesArchive.tsx`, `gradeLedger.ts` | Its three existing views and transcript-faithful record work |
| Current app annotations | live app | Later app-specific rulings override a stale mock detail |

### d) Gate

`BUILD-MANIFEST.md:103` lists
`01-academics/academics-term-retrospective.html` with **Build? = YES**, selected
Variant A / Term Report. This pass is authorized. Do not edit the manifest.

### e) Decision record

**Pass.** `academics-term-retrospective.md` rules Variant A and records both
behaviour and appearance. There is no A/B/C decision left to make.

### f) Integration state

| Dependency | Status | Required handling in this pass |
| --- | --- | --- |
| Local course/history records and persisted report snapshot | **Built** | Reuse; do not migrate or recalculate evidence. |
| `study-tools` term-report action | **Coded; deployment/configuration not proved by this visual audit** | Keep the existing unavailable state. Do not expose a browser key or fabricate an AI report. |
| Existing generated report reload | **Built path, must be re-tested** | Direct route must reopen the same saved report after reload. |

The lack of a live signed-in provider run blocks **promotion condition 5**, not
this fidelity correction. It must remain an explicit failed promotion check
unless a real configured run is performed during this work.

## 2. References

- `mockup-lab/01-academics/academics-term-retrospective.html` — open
  `?view=page` while building; A is the only implementation source.
- `mockup-lab/01-academics/academics-term-retrospective.md` — behaviour and
  literal appearance ruling.
- `mockup-lab/_shared/_visual-recipes.md` — exact palette, solid-surface,
  radius, focus, and motion rules.
- `premed-hq-documentation/tabs/01-academics.md` #43, §6.10-C, §6.12, §6.14,
  §9, and §13.
- `src/components/academics/TermRollover.tsx`.
- `src/components/academics/TermReportPanel.tsx`.
- `src/components/academics/GradesArchive.tsx`.
- `src/lib/academics/termReport.ts`, `termReportSynthesis.ts`,
  `src/store/migrations/termReportsV31.ts` and their tests — reference only.
- `premed-hq-documentation/implementation/component-inventory.md` and
  `MOCKUP-TRANSLATION-CONTRACT.md`.

## 3. The work

### 3.1 Give the report one truthful destination

1. Add one **contextual report state** under the existing Grades & Archive
   owner, represented by a URL query parameter such as
   `gradeView=ledger&termReport=<reportId>`. It is not a fourth persistent
   Grades tab and it is not an additional top-level Academics route.
2. A completed or paused rollover must navigate to that state using the new
   report id. `View your Term Report` is a real route transition, never a DOM
   scroll into an accordion.
3. Direct loading, browser back/forward, and a page reload must preserve the
   focused saved report. An unknown/deleted id returns quietly to Ledger with a
   friendly message; do not create, mutate, or select a different report.
4. Reports remain reachable from Ledger through a quiet **Term reports** entry
   only when one exists. Do not make them a broad Archive subtab, dashboard
   tile, or second retrospective editor.

### 3.2 Translate Variant A exactly in hierarchy

When `termReport=<id>` is selected, replace the Ledger document body with the
report document. Keep the existing Academics header and the existing
Grades/Ledger view grammar; do not copy the mockup's inline banner CSS.

The report document is **one reading column** (`max-width: 660px` within the
existing content width), in this exact order:

1. `End-of-term record` eyebrow, title, plain-language provenance, and compact
   violet completion stamp. On compact screens, the stamp wraps below the
   title; it never overlaps it.
2. `Your term at a glance`: readable final grades *only where recorded*, then
   returned work and saved study-note facts. Human labels only — no internal
   identifiers, source counters, or “connected topics.”
3. `What stands out`: left-rule violet observations. Each has a keyboard
   reachable **Why this appears** control that opens the existing evidence
   detail rather than duplicating editors.
4. `Carry into next term`: one or two bounded experiments. The existing
   planning-draft action stays reviewable and never writes a course, task,
   deadline, or study rule.
5. `How to read this`: warning-toned left-rule limit **last**. Its copy makes
   the fact/suggestion boundary and non-causation statement unavoidable.

At normal desktop width, do **not** render the report as a general two-column
dashboard with a permanent side rail. Course list, evidence details, source
review, generate/retry and carry-forward remain compact disclosures or dialogs
triggered from this reading flow. This is the deliberate difference between
the report and the existing Grades dashboard.

### 3.3 Honest non-ready states

- **Insufficient evidence:** preserve the selected reading-column frame and
  the exact friendly meaning: no evidence-led report can be made yet; studying
  without logging is still studying. It must contain no generic tips, zero,
  chart, or placeholder cards.
- **Provider unavailable:** local deterministic facts remain readable, the
  unavailable message is human and retriable, and no partial AI report is
  saved or shown as ready.
- **No reports in Ledger:** one small quiet entry or absence, not report chrome
  populated with demo data.

### 3.4 Appearance and interaction constraints

- Use the literal recipe values: warm dark
  `#211e1a → #2b2722 → #322e28`, paper
  `#f7efe1 → #fffaf0 → #efe6d4`, `#3c352d` / `#e9e2d5` borders, `16px` outer
  panel and `13px` inner surfaces, recipe shadow. All report interiors are
  solid. Glass stays out of this document.
- Violet is a restrained accent for the end-of-term stamp and left rules; it
  must not turn the page into a second MCAT or ranking surface.
- Reuse existing `Card`, `Dialog`, `Collapsible`, and button families. Do not
  fork a report-card primitive.
- Every new interactive control has a handler and `:focus-visible` state.
  Motion is existing short opacity/transform only, with reduced-motion
  fallback.
- No score, ranking, method grade, progress bar, causal claim, inferred study
  time, fabricated record, or source outside the frozen report snapshot.

## 4. Do not break

- Do not alter `TermReport`, its migration, snapshot compiler, AI schema,
  citation validation, or report evidence semantics in this pass.
- Do not remove Transcript record tools, Term Rollover, Grade Decisions, or
  any app annotation. Move only the Term Report renderer out of the generic
  Ledger tools stack.
- Do not combine Forecast Accuracy with this document; its manifest row is
  absent and it is out of scope.
- Do not promote this page merely because the new screen renders. Promotion
  requires all six conditions below.

## 5. Done when

- [ ] A rollover creates its existing report record and opens its direct
  Grades & Archive report state — no `scrollIntoView()` handoff remains.
- [ ] Direct report URL, browser navigation and reload restore the same saved
  report without a duplicate or altered snapshot.
- [ ] Variant A's one-column hierarchy and its three honest states render in
  both themes using the measured solid ladders above.
- [ ] The report's evidence, source-review, generate/retry and carry-forward
  controls remain keyboard operable; the inert-control audit reports zero
  unexplained controls.
- [ ] Empty store and no-report history render friendly absence with no
  hardcoded student data.
- [ ] Existing term report unit/migration/synthesis tests plus relevant route
  tests pass, and `npm run test` / `npm run build` pass.
- [ ] The implementation report includes a before/after `getComputedStyle`
  table for canvas, report panel, inner evidence row in both themes.

## 6. Promotion check — expected status

Run all six checks for `academics-term-retrospective` after this work. The
page may be promoted only if all pass; otherwise it remains `proposed`.

| Condition | Current expected outcome |
| --- | --- |
| 1. measured visual match | Expected to pass only after §3.2 and both-theme measurements. |
| 2. every control works | Must be freshly audited. |
| 3. ruled behaviour persists | Must prove rollover → route → reload. |
| 4. empty store has no fake data | Must be freshly proved. |
| 5. integrations coded and configured | **Likely pending** until a signed-in configured term-report generation run is recorded. |
| 6. commit noted in mockup `.md` | Must be done in the implementation commit. |

## 7. Commit

`fix(academics): route and align the end-of-term report`

Commit only files required by this brief. Keep existing unrelated documentation,
generation-spec, `output/`, and mockup-lab working-tree changes out of it.

## 8. Next stage

If the provider run proves condition 5, use `PAGE-PROMOTION-PROMPT.md` for the
Term Report page. Forecast Accuracy remains a separate future vertical; it is
not manifest-cleared and cannot be built by implication.
