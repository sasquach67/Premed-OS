# T1 · Academics — Active Recall session visual fidelity

**Stage:** E · BEHAVIOUR BUILT, VISUAL TRANSLATION NOT YET PROVED  
**Scope:** Translate the approved **Active Recall session** states—start,
recall, gap report, concept-map recovery, and summary—into the current app’s
approved visual language. This is a fidelity pass only. It does not alter the
recall loop, FSRS, response handling, confidence/grade semantics, generated
gap-check contract, or provider configuration.

## 1. Step-1 audit

### A. Spec → paper

**Pass for the manifest-cleared Academics scope.** The current paper sweep
found an owner surface for every un-deferred, build-cleared rule: Daily/Class
Center, assignments, class hub, active recall, syllabus import, study method,
forgetting curve, exam prep, Materials/lecture capture, planning, requirements,
grades/archive, rollover, term report, and forecast accuracy. The remaining
course-catalog/Canvas-Path-B decisions are explicitly deferred and do not make
a new paper gap.

For this vertical, `academics-review-session.html` draws the required states:

| Ruled behaviour | Decided drawing |
| --- | --- |
| One active-recall loop with stated scope and answer before reveal | `view=recall` |
| Gap report, source provenance, confidence before grade, and explicit FSRS intervals | `view=gap-report` |
| Start and summary as scenic states; reading state dims the scene | `view=start` / `view=summary` |
| Optional concept-map response/recovery with no automatic link | `view=concept-canvas` / `view=concept-recovery` |

There is no U-9 conflict in the selected treatment: queue position and elapsed
time are session navigation facts, not a student score, rank, or readiness
claim.

### B. Mockup → app

The behaviour is present in `src/pages/AcademicRecallSession.tsx`, including
typed, microphone, image, and concept-map response paths; scope; confidence;
explicit grades; skip; a source drawer; and the saved summary. `d712de3` added
the response-input completion path. It is **not yet faithful enough to promote**:
the active and report states use generic translucent slate panels rather than
the selected drawing’s solid reading hierarchy, and no current commit records a
both-theme visual measurement for this session after the recent response UI
changed.

**Measured start-state surface, Aug. 23, 2026** (running local app at
`#/academics/review/demo-course-biol252`, not token names):

| Surface | Mockup value | App value |
| --- | --- | --- |
| canvas beneath the scenic scene | `body #151310`; scenic artwork sits above it | `rgb(33, 30, 26)` / `#211e1a` body, with the app’s landscape image above it |
| primary start action | `.bstart { background:#5c9fd4; border-radius:16px }` | `rgb(75, 156, 211)` / `#4b9cd3`, `16px` radius |
| reading-state primary panel | `.prompt`, `.comp`, and `.cardw` use solid `var(--card)` / `#2b2722` over `var(--bg)` | `bg-slate-950/82` and `bg-slate-950/88` are translucent slate overlays, not the specified solid `#2b2722` rung |

The canvas/start-action values are close in intent, but the ladder fails where
it matters for reading: **scene → solid dark reading panel → solid nested
object** is not currently implemented. The execution pass must measure the
actual active and report states in warm dark and paper after translating them.

### C. Already built — preserve, do not rebuild

- The one authoritative FSRS review loop and append-only `ReviewEvent` history.
- Explicit confidence, self-grade, skip, Focus-time separation, response
  inputs, source handling, and optional structured gap-check: `d712de3`.
- Topic linking/concept canvas’s confirmation-only writer; no TopicLink may be
  created by a suggestion.
- The separate forecast-accuracy record: `27849ec`. It observes completed
  recall calls; it must not be restyled or recomputed here.
- Existing app-specific annotations and later product rulings. Where an older
  mock detail conflicts with a confirmed annotation, preserve the annotation
  and make the fidelity note explicit rather than deleting working behaviour.

### D. Gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-review-session.html` **YES**. This fidelity pass is
authorized. Do not modify the manifest.

### E. Decisions record

**Pass.** `mockup-lab/01-academics/academics-review-session.md` records both
behaviour and appearance: the scenic start/summary, solid reading states,
scope-first composer, provenance treatment, map recovery, responsive order,
and motion boundary. There is no undecided A/B/C choice in this pass.

### F. Integrations and services

| Dependency | Classification | Student-visible state today | Required handling |
| --- | --- | --- | --- |
| Local Academics store, FSRS, review events, source chunks | **CODE BUILT AND CONFIGURED** | Recall, self-grading, scheduling, and local source references work without a provider. | Preserve; no data-model change. |
| Browser microphone and attached response image | **CODE BUILT; per-session browser permission** | The student can use typed input without granting a permission; denied microphone remains an honest typed/image recovery. | Preserve this permission/recovery state. |
| Optional `study-tools` gap check | **CODE BUILT, LIVE CONFIGURATION NOT PROVED HERE** | The deterministic self-check remains usable when the service is unavailable. | Do not make a visual pass depend on it or claim it is configured. A later promotion needs a signed-in real request. |

**First failed stage: E.** Stages A–D pass for this vertical: it is drawn,
decided, manifest-cleared, and its ruled local behaviour is implemented. Its
post-input screen has not been measured/transcribed from the approved solid
reading composition, so frontend fidelity is the first honest gap.

## 2. References

- `mockup-lab/01-academics/academics-review-session.{html,md}` — selected
  state hierarchy and appearance reference.
- `mockup-lab/_shared/_visual-recipes.md` — literal palette, glass boundary,
  radii, focus, and motion rules.
- `premed-hq-documentation/tabs/01-academics.md` §4.1-J, §6.2, §6.3, §6.6,
  §6.7, §6.12–§6.14, §9–§10, and §13.
- `src/pages/AcademicRecallSession.tsx`, `src/components/academics/ConceptCanvas.tsx`,
  `src/lib/academics/activeRecall.ts`, and `src/lib/academics/fsrs.ts` —
  reference only for this pass.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`
  and `premed-hq-documentation/implementation/component-inventory.md`.

## 3. Work — frontend fidelity only

### 3.1 Preserve the two visual modes

1. Keep **start and summary** scenic: landscape art, a controlled dark veil,
   queue/summary reading order, a broad primary action, small secondary
   microphone/settings actions, and at most one dark MascotNote. The scene is
   allowed to float its context pill; it is not a generic card page.
2. Make **active recall, gap report, and concept-map recovery** solid reading
   states. When a response is being read or graded, the artwork must dim hard
   and the working surface must read as a calm document, not a translucent
   slate dashboard.
3. Apply the literal dark ladder to those reading states:
   `#211e1a` canvas → `#2b2722` primary panel (`16px`, `#3c352d` border) →
   `#322e28` nested response, scope, gap, disposition, or grade object
   (`13px`). In paper: `#f7efe1 → #fffaf0 → #efe6d4` with `#e9e2d5` borders.
   Do not substitute a Tailwind opacity class for a solid rung.
4. Keep glass only on the scenic context pill/overlay. Textareas, upload
   affordances, confidence choices, source drawer, gaps, and grade choices are
   solid; do not use `backdrop-filter` in the reading states.

### 3.2 Translate the state hierarchy, not just colors

1. **Start:** preserve the complete queue, stated estimated duration, input and
   ordering preferences, and wide `Start active recall` action. Queue rows use
   faint dividers and category/status marks rather than a new score or progress
   card.
2. **Recall:** lead with topic and scope checklist; then the one composer with
   text, microphone, image, and optional map. Confidence remains below the
   response and gates reveal. Do not create a new response mode, a separate
   side tab, or a review score.
3. **Gap report:** retain the two-sided explanatory reading order—what the
   student had / missed / got wrong—then provenance, the confidence-versus-
   grade teaching note, and the explicit interval choices. The source drawer
   must visually read as contextual detail, not a second permanent pane.
4. **Concept recovery:** preserve the quiet node/link canvas and the same
   solid ladder. Suggested relationship choices remain proposals; their
   visual treatment cannot imply that a link was saved.
5. **Summary:** restore the scenic composition only after the final grade or
   Focus completion. Use session facts in labels; never style counts as a
   performance report or add a completion/progress bar.

### 3.3 Interaction, accessibility, and responsive proof

- Keep current handlers and disabled reasons intact. No handler may be dropped
  during class-name or layout changes.
- At narrow widths, reading order is topic/scope → composer → response inputs
  → confidence → reveal/grade. The source drawer stacks after the gap it
  explains; the map controls wrap without overlapping the canvas.
- Maintain visible `:focus-visible`, keyboard grade shortcuts, and reduced
  motion. Scene/reading transitions remain short and only opacity/transform
  animate; `prefers-reduced-motion` must settle without movement.
- Do not change microphone permission, audio/image transfer disclosure,
  response persistence, scheduling, grade names/intervals, or optional
  provider behaviour in this pass.

## 4. Do not break

- One active-recall study container; do not reintroduce the retired
  quick-recall/blurting/Feynman mode split.
- FSRS and local append-only review history; do not add a second scheduler,
  Anki sync/history, hidden score, readiness value, rank, or progress bar.
- The deterministic self-check fallback and its honest unavailable copy.
- Source provenance, the closed-source boundary, and confirmation-only
  TopicLink creation.
- The separate Forecast Accuracy model, current class-card annotations, and
  unrelated dirty working-tree documentation.

## 5. Done when

- [ ] Start, recall, gap report, concept recovery, and summary visibly follow
  their selected mockup hierarchy without removing any working response path.
- [ ] Computed-style evidence records both themes for canvas, primary reading
  panel, and nested response/gap row; values match the literal ladder above.
- [ ] An inert-control audit covers every `Button`, `DropdownMenuItem`, and
  `ContextMenuItem` on the changed route and reports zero unexplained controls.
- [ ] A typed review, one denied-microphone recovery, one source drawer, one
  skipped topic, and one explicit grade still work and persist/reload exactly
  as before.
- [ ] Empty-store / no-queue state contains no mock topic, source quote,
  session count, or grade data.
- [ ] Targeted tests, full suite, production build, and a compact/mobile visual
  check pass. Keep exact test output and both-theme measurements for the later
  promotion audit.

## 6. Commit

`fix(academics): align active recall session with approved reading states`

Commit only files required for this fidelity pass. Keep the current unrelated
brief/spec/output edits out of it.

## 7. Next stage — not in this brief

Run the six-condition promotion audit for **Review session** only after this
pass. The optional live `study-tools` gap-check must be proven with a signed-in
configured request before condition 5 can pass; until then the page remains
`approved`, not `built`. Do not promote or edit `variant-lab.html` in this
fidelity commit.
