# T1 · Academics Daily · Class Hub Overview — Variant A fidelity

**Stage:** E · FRONTEND FIDELITY  
**Variant:** A · transcript-first workspace  
**Build gate:** `academics-class-hub.html` = `YES`  
**Scope:** Class Hub shell and Overview composition only. Preserve existing
lecture persistence, material intake, topic semantics, assignment behavior,
Guide behavior, Class Plan logic, forgetting-curve logic, and every non-Daily
surface.

## 1. Step-1 audit

### A · Spec → paper

**Pass for this bounded surface.** `tabs/01-academics.md` §4.1-I/K/L/Q and the
approved `academics-class-hub.md` cover the Class Hub shell, direct
transcript-first journal, supporting evidence, selected-source study work,
Class Plan placement, forgetting-curve placement, syllabus-led Topics, and
Guide/Materials boundary. The approved Variant A renders each as a visible
surface or state.

### B · Mockup → app

**Fail — visible translation is incomplete.** The app already contains a Class
Journal and working lecture dialog, but the default Overview shows either an
active-lecture summary or a paragraph-heavy empty placeholder. It does not
render the approved direct transcript drop state, bounded three-row journal,
equal-height workspace, or consolidated Course pulse.

Measured Aug. 27, 2026 at the live Lab viewport and the running app:

| surface | approved Variant A | current app baseline |
| --- | --- | --- |
| journal rail / capture stage | `#2b2722`, `#3c352d` border, `16px`, equal `318px` minimum | semantic card/border values, but about `227px` high in the empty state |
| journal window | `154px`, vertical scroll, newest first, about three rows visible | unbounded grid; empty state is `86.8px`; populated list is sliced in code rather than bounded visually |
| transcript step strip | `#262320`, `12px`, three equal columns | absent in the empty default; active lecture uses stacked generic action rows |
| transcript drop zone | `112px` minimum, dashed `rgba(75,156,211,.58)` | absent from Overview |
| primary capture action | `#4b9cd3`, `9px`, Baloo 2 `800` | large generic outline “Add today’s lecture” |
| body order | journal/capture → Course pulse → Class Plan → Forgetting curve | journal summary → repeated Class status/Coverage and six legacy overview cards → conditional Class Plan/history |

### C · Already built — preserve

- Local-first lecture creation, transcript retention, supporting evidence,
  generated material handoff, lecture numbering, and reload persistence.
- Unified Material Intake and the existing `LectureCapturePanel` dialog.
- Five tabs: Overview · Materials · Topics · Assignments · Guide.
- Class-scoped Assignments/global handoff, syllabus-led Topics, Course lens,
  source-reviewed Guide suggestions, Class Plan logic, and FSRS curve logic.
- Current Class Hub keyboard handlers, routes, overflow actions, and class-type
  configuration.

### D · Gate

**Pass.** `BUILD-MANIFEST.md` marks
`01-academics/academics-class-hub.html` **YES**.

### E · Decision record

**Pass.** `academics-class-hub.md` records both behavior and appearance and
names Variant A, transcript-first, three-row bounded journal, equal-height
composition, Course pulse, Class Plan, and full forgetting curve as approved.

### F · Integrations

Core capture is local-first and requires no external configuration. Optional
provider transcription and external-file integrations remain accurately
classified inside their existing flows; this fidelity pass does not claim
they are configured.

## 2. Why this lands at Stage E

Stages A–D pass. The approved drawing is complete, decisions are recorded, the
manifest is open, and the underlying interaction/persistence paths exist. The
blocked condition is literal frontend translation.

## 3. References — read before execution

- `mockup-lab/01-academics/academics-class-hub.html` — Variant A CSS and markup
  for the shared banner, Overview, and lecture states.
- `mockup-lab/01-academics/academics-class-hub.md` — approved behavior and
  appearance record.
- Mirrored HTML/MD under
  `premed-hq-documentation/specifications/mockups/01-academics/`.
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`.
- `premed-hq-documentation/tabs/01-academics.md` §4.1-I/K/L/Q, §6.4, §6.6,
  §9–10, and acceptance criteria applying to Class Hub.
- `src/components/academics/ClassHub.tsx`.
- `src/components/academics/LectureCapturePanel.tsx`.
- `src/components/academics/StudyMethodPanel.tsx` and
  `src/components/academics/ForgettingCurve.tsx`.

## 4. Work — fidelity only

### 4.1 Shared banner

- Preserve the single working PageHeader, handlers, stats, and five-tab shell.
- Match the mockup banner proportions: compact crumb; 31px/800 course code;
  17px course name; 12.5px info line; glass stat strip; compact white Start
  review; underline-only tabs.
- The banner stat strip is the only class-status strip. Do not repeat grade,
  readiness, due-today, or exam countdown in the Overview body.

### 4.2 Default transcript-first workspace

- Render one 12-column workspace, desktop columns `260px minmax(0,1fr)`, gap
  `14px`, equal stretch, rail and capture stage minimum `318px`.
- Journal rail: `13px` padding; Class journal kicker; Lecture evidence; real
  count and newest-first label; a focusable `154px` vertical-scroll window;
  about three compact rows visible; no class selector; `View all N lectures`
  only when the bounded window hides records.
- Default right stage always leads with the next numbered lecture and direct
  **Add transcript** state, even when saved lectures exist. Preserve scheduled
  time/location only when real.
- Render the approved three equal steps: Transcript required → Evidence
  optional → Study work after capture. Render the 112px dashed transcript
  drop affordance and compact `Import transcript` / `Paste transcript`
  controls. Both open the existing focused intake; do not create a second
  persistence path or actual file input.
- Selecting a saved journal row switches the right stage to one grouped record:
  transcript, supporting evidence, and study work, with one quiet Open lecture
  action. It must not replace the default transcript-first state until a row is
  explicitly selected.
- Remove reviewer prose and repeated trust banners. Keep only the compact
  syllabus-led boundary where it changes a decision.

### 4.3 Overview reading order

- Replace the repeated Class status + Material coverage + six-card legacy body
  with the approved compact Course pulse, using only real data and real
  handlers: next assignment, next exam/retention, materials needing filing,
  Guide items/suggestions.
- Follow with Class Plan. Actionable groups keep their existing evidence-backed
  derivation. When a non-General class has syllabus topics but no actionable
  signal, retain the approved placement with one truthful `Course map` group
  linking to that class's Topics; never invent a due/review state.
- Close with the existing full one-topic Forgetting Curve when evidence allows.
  Preserve its honest no-history/no-exam behavior; do not draw fake data.
- Non-STEM classes keep their ruled behavior. Do not introduce dormant STEM
  panels or change class-type semantics.

### 4.4 Literal visual values

- Use a Daily/Class-Hub-scoped stylesheet imported by `ClassHub.tsx`; do not
  modify Planning rules or global theme tokens.
- Copy the approved selectors' exact values: panel/card/border ladder,
  dimensions, padding, gap, radii, font roles, focus-visible treatment,
  breakpoints at 960/760px, and reduced-motion behavior.
- Measure the mockup's computed dark ladder and the repository's locked paper
  theme ladder. The approved page HTML exposes no separate light CSS, so do
  not fabricate a mockup-light measurement. Match dark `backgroundColor`,
  border color, typography, radius, padding, gap, and dimensions literally;
  in light, prove the locked paper tokens compute to their exact values with
  identical geometry. Do not reuse dark hex fills in light mode.
- No glass below the banner, no oversized blue pills, no generic card wall,
  no reviewer labels, no arbitrary icons or invented data.

## 5. Do not break

- Do not edit stores, migrations, types, generation, material intake, lecture
  numbering, routes, syllabus parser, assignment logic, Guide semantics, Topic
  semantics, or Planning-owned files.
- No Topic picker in the lecture path. Topics remain syllabus standards and
  objectives; lecture material remains evidence/context.
- Do not touch `src/pages/Academics.tsx` or `src/index.css` in this pass.
- Preserve all unrelated dirty work; record only new Class Hub hunks.

## 6. Done when

- [ ] Default Overview visibly matches the Variant A journal/capture workspace
      at desktop and 390px: 260px rail, 14px gap, equal-height 318px intent,
      154px scroll window, no clipped action.
- [ ] Saved-row selection switches to the compact saved-record state; direct
      transcript-first is still the default after load.
- [ ] Banner and body order match Variant A; no duplicate body status strip or
      legacy card wall remains for STEM Overview.
- [ ] Measured light/dark tables compare geometry and surface ladder for banner,
      rail, stage, scroll window, step strip, drop zone, action, Course pulse,
      Class Plan, and curve.
- [ ] Existing Class Hub/Lecture Capture tests pass; add focused tests for the
      default transcript state, bounded journal contract, and saved-row switch.
- [ ] Inert-control audit is zero for touched Class Hub controls; keyboard
      focus, scroll, narrow layout, and reduced motion are verified.
- [ ] `npm run build` and scoped `git diff --check` pass.

## 7. Commit

`fix(academics): translate Class Hub Variant A overview`

Commit only the exact new Daily hunks after coordinating with the primary root.

## 8. Next stage — out of scope

Re-run the router after this execution. The next brief may cover Class Hub
Materials, Topics, Assignments, Guide, a lecture sub-state, another Daily page,
or the six-condition promotion audit. Do not start it inside this brief.

## 9. Execution audit · Aug. 27, 2026

### Measured mockup → app

| contract | approved Variant A | primary-root app · dark | primary-root app · light |
| --- | --- | --- | --- |
| journal composition | `260px minmax(0,1fr)` · `14px` gap · `318px` min | `260px / 956px` · `14px` · equal `329.1px` with honest empty data | identical geometry |
| journal window | `154px` · vertical scroll | `154px` · vertical scroll · focusable | identical |
| rail / stage | `#2b2722` · `#3c352d` · `16px` · `13px/16px` padding | exact same RGBA/geometry | `#fffaf0` · `#e9e2d5` · `16px` · same padding |
| three-step strip | `#262320` · `#3c352d` · `12px` | exact same dark ladder/radius | locked paper mix `rgb(246,238,224)` · `#e9e2d5` · same radius |
| transcript drop | `112px` min · `12px` · dashed `rgba(75,156,211,.58)` · `24px` | exact same values | same blue alpha/radius/padding on paper |
| Course pulse | `#2b2722` · `#3c352d` · `16px` · `170px + 4` columns | exact same ladder/columns | `#fffaf0` · `#e9e2d5` · same columns |
| Class Plan | `15px 17px` · `16px` · two groups/row · `8px` gap | exact panel/group recipe; truthful Course map fallback is visible when no action signal exists | locked paper ladder with identical geometry |
| primary | `#4b9cd3` · Baloo 2 `800` · `9px` control radius | exact | exact |

The mockup HTML has one dark CSS ladder only. Light verification therefore
uses the locked repository paper values: canvas `rgb(247,239,225)`, card
`rgb(255,250,240)`, muted `rgb(239,230,212)`, border `rgb(233,226,213)`, and
foreground `rgb(58,53,48)`.

### Proof

- [x] Desktop dark screenshot: `/tmp/class-hub-dark-desktop.png`.
- [x] Desktop light screenshot: `/tmp/class-hub-light-desktop.png`.
- [x] 390px responsive dark/light harness screenshots:
      `/tmp/class-hub-dark-mobile-full.png` and
      `/tmp/class-hub-light-mobile.png`; controls stack, the five tabs remain
      horizontally reachable, and capture actions do not clip.
- [x] Direct approved canvas reference:
      `/tmp/class-hub-mockup-direct.png`.
- [x] Focused test: `ClassHub.test.tsx` · 5/5 passed. It proves transcript-first
      default with an existing saved lecture, bounded journal presence,
      explicit saved-row switch, syllabus-led boundary, and truthful Class
      Plan fallback.
- [x] `npx tsc -b --pretty false` passed.
- [x] `npm run build` passed (4,444 transformed modules).
- [x] Scoped `git diff --check` passed.
- [x] Touched controls are non-inert: journal row selects; transcript actions
      open the existing intake; pulse rows route to their real tabs/exam flow;
      Class Plan opens Review or class Topics.

### Promotion boundary

This brief proves the bounded Class Hub Overview translation only. It does not
promote the full Class Hub or Daily area to BUILT: Materials, Topics,
Assignments, Guide, configured optional providers, whole-area empty/reload
proof, and commit provenance require their own routed briefs/audits.
