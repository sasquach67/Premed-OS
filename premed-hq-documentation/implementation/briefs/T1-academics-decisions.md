# T1 · Academics — Syllabus Import decision record

**Stage:** B · DRAWN, NOT DECIDED

**Scope:** Academics only. This is a decisions pass. Exam Prep's companion
record now exists; the pass resolves the remaining Syllabus Import appearance
decision. It does not change `src/`, the store, migrations, cloud
configuration, or the build manifest.

## 1. Fidelity audit — completed before this brief

### a. Spec → paper

The earlier Stage-A gap is now covered in the lab worktree: Learning Signals,
Grade Decisions, Materials recovery/result states, and Planner lock/substitute/
export states have real sources and companion decisions. The remaining ruled
Academics flows with a visual source but no recorded appearance decision are:

| Ruled flow | Existing paper source | Binding spec | What is missing |
|---|---|---|---|
| **Syllabus import and re-import** | `mockup-lab/01-academics/academics-syllabus-import.html` | `tabs/01-academics.md` §4.1-M and §4.1-M-a–d | The source encodes important comments and frames, but it has no adjacent `.md` that makes the hierarchy, visual treatment, state transitions, or review emphasis mechanical for an app builder. |
| **Exam prep mode** | `mockup-lab/01-academics/academics-exam-prep-mode.html` | `tabs/01-academics.md` §4.1-R and §6.15–6.16 | Its companion record now locks the day-as-finish-time composition, accelerated/steady control, catch-up treatment, and autopsy closure. No further Stage-B work belongs here. |

No additional ruled Academics feature is presently only a generic lab
placeholder. The `academics-mode-switch.html` and `class-center-study-hub.html`
concept files are not cleared by the manifest and are not sources to promote in
this pass.

### b. Mockup → app

| Surface | App evidence | Audit result |
|---|---|---|
| Syllabus import, scoped entry, local source retention, and identity-based re-import data layer | `src/components/academics/ClassCenter.tsx:401-471, 710-718, 2117-2202`; `src/lib/academics/syllabusReimport.ts` | Behavior is shipped, including the four entry paths. Its visual translation remains unauditable without a companion appearance document. |
| Materials → syllabus-row re-import entry | `src/components/academics/ClassHub.tsx:607, 633` | Shipped behavior; the decision record must preserve its scoped, non-duplicating identity. |
| Exam prep | `src/pages/Academics.tsx:313` only supplies explanatory copy; no dedicated temporary exam-plan mode or data model is present | Drawn, **not built**. Stage C may be written only after its decisions are recorded. |
| Learning Signals, Grade Decisions, Materials extensions, Planner decisions | Their real lab sources and companion `.md` files are present in the worktree | Stage-A drawing gap is closed pending its narrow mockups commit; do not redraw them here. |

### c. Already built — do not rebuild

- Class Center and Class Hub ownership: `9f4d3ac`, `7ddf493`.
- Syllabus parsing, local retention, scoped import, weight persistence, and
  identity-based re-import: `69a0b41`, `93bfeb8`, `1ee2c87`.
- Zero-class launchpad and class-type configurations: `cb963a3`.
- Active-recall runner: `9f9d98a`.

The uncommitted Stage-A drawing files are not treated as shipped app work and
must be committed separately under their own narrow mockups commit.

### d. Gate

`BUILD-MANIFEST.md` marks both
`01-academics/academics-syllabus-import.html` and
`01-academics/academics-exam-prep-mode.html` **YES**. That permits a later
implementation brief after these decisions are complete; it does not authorize
implementation in this decisions pass.

### e. Decision-file audit

| Source | Appearance record | Result |
|---|---|---|
| Daily, Assignments, Class Hub, Class Types, Empty States, Planner, Requirements, Grades & Archive | Companion docs record behavior and visual hierarchy | Pass for this rung. |
| Learning Signals, Grade Decisions, Materials extensions, Planning decisions | Companion docs now record both behavior and appearance | Pass pending their existing narrow drawing commit. |
| Syllabus Import | No companion `.md` | **Fails Stage B.** |
| Exam Prep Mode | `academics-exam-prep-mode.md` records behavior and appearance | Pass. |

### f. Integrations and services owned by Academics

| Dependency | Classification | What the student sees today | Decision consequence |
|---|---|---|---|
| Local syllabus file retention | **CODE BUILT AND CONFIGURED** | A selected syllabus stays on this device for re-import. | The decision record must never imply cloud-backed or cross-device file storage. |
| Grounded study-generation provider | **CODE BUILT, CONFIGURATION MUST BE VERIFIED** | A provider may be unavailable; the product must recover honestly rather than invent course content. | The import decisions must preserve no-source/no-provider recovery boundaries. |
| Calendar / `WeeklyCapacity` | **CODE BUILT, NOT PUBLICLY CONFIGURED/VERIFIED** for live Google Calendar access | Exam Prep cannot honestly claim personal calendar capacity until a student has configured a connection; local/manual capacity remains the fallback. | The decision record must draw an honest no-calendar state, not mock events. |
| Canvas Path A calendar-feed handoff | **CODE MISSING** | No Canvas course-feed review exists in the app. | Not part of Syllabus Import implementation; this remains a later full brief. |
| Lecture capture / transcription | **CODE MISSING** | No lecture-capture pipeline exists. | Exam Prep may show absent lecture guidance without fabricating a quote or timestamp. |
| Anki | **NO LIVE INTEGRATION REQUIRED** | Export remains one-way. | Neither source may imply an HQ card queue or two-way sync. |

### Blocking drawing conflict — a decision is required

The Syllabus Import source conflicts with already-implemented and binding
re-import behavior:

| Source drawing | Binding behavior | Required decision |
|---|---|---|
| The banner says **“step 1 of 2”** and **“step 2 of 2.”** | §4.1-M explicitly rules out a wizard and step counter: upload → parse → review → apply is one screen changing state. | Remove the step labels and use a neutral temporary-mode label, or explicitly change the product ruling. The latter is not assumed here. |
| Changed and removed diff rows visually emphasize **Accept**, while **Keep mine** is quiet. | `syllabusReimportDiff()` defaults changed and removed rows to `keep`; confirmed data must never be silently overwritten. | Make **Keep mine** visibly selected/default for changed and removed rows; added may default to Accept. |

The first option in each row follows the existing spec and shipped data model.
Until Andy confirms it, no companion record can honestly say the current
drawing is the approved presentation.

## 2. Work — Stage B only

Create these companion decision documents. They must record **behavior and
appearance** in a way an implementation pass can follow without consulting
inline HTML/CSS. Do not edit the two drawings unless a decision document reveals
a concrete conflict with the binding spec; if so, flag the conflict and stop.

### `mockup-lab/01-academics/academics-syllabus-import.md`

Record the approved treatment of one temporary, full-screen flow whose content
changes in place rather than becoming a multi-step wizard:

- **Product position:** all four entry points land in one Import → Parse →
  Review → Apply flow. Unscoped uses the class-identity block; scoped replaces
  only that block with a static course header and reuses the existing course
  identity. Re-import opens at the same flow with change review, never at a
  second class creator.
- **Visual hierarchy:** a calm, shallow banner establishes the temporary mode;
  the source input is the unmistakable primary surface; parsing uses named,
  cancellable progress; review makes low-confidence and changed groups more
  prominent than clean/unchanged summaries; the Apply rail states exactly what
  will be written.
- **Surface material:** glass is limited to the floating banner/stat strip if
  it overlays banner art. Dropzone, parse status, review groups, source quotes,
  and the apply rail are solid-with-depth, not glass.
- **Review states:** source quote per proposal row; grade-weight validation;
  partial parse recovery; manual entry beside what failed; no silent apply.
  For re-import, added defaults to accept, changed and removed default to keep,
  unchanged rows stay collapsed and counted, and removed never means automatic
  deletion.
- **Data/privacy boundary:** the original file remains local; shared learning
  may use extracted structure only, never the document. Generated study content
  is grounded only in selected student-provided sources with provenance.
- **Accessibility/motion:** keyboard-reachable source selection and review
  controls, visible focus, no color-only confidence state, and reduced-motion
  non-animated equivalents.

## 3. References

- `premed-hq-documentation/tabs/01-academics.md` §§3.2–3.3, 4.1-G,
  4.1-I, 4.1-M, 4.1-R, 6.2–6.4, 6.8, 6.10–6.16.
- `premed-hq-documentation/tabs/01-academics-feature-catalog.md` #32, #33,
  #41, #42, #49, #73.
- `mockup-lab/01-academics/academics-syllabus-import.html` and
  `academics-exam-prep-mode.html`.
- `mockup-lab/01-academics/academics-class-hub.md`.
- `premed-hq-documentation/implementation/component-inventory.md`.
- `premed-hq-documentation/specifications/01-shared-interface-patterns.md`.
- `premed-hq-documentation/specifications/04-visual-craft-standards.md` §0.
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`.

## 4. Do not break

- Do not touch `src/`, store shapes, migrations, Supabase, cloud credentials,
  tokens, fonts, or `BUILD-MANIFEST.md`.
- Do not turn either flow into a permanent Academics tab, a second Class Hub,
  a multi-step wizard, or a generic stack of equal rectangles.
- Do not fabricate class data, lecture findings, calendar availability, course
  content, a grade outcome, or a readiness/progress score.
- Do not change approved Syllabus Import behavior: review before apply,
  lossless estimated/manual recovery, scoped identity reuse, and safe re-import
  defaults remain binding.
- Do not change the two-mode, shared-capacity decision in Exam Prep.

## 5. Done when

- Both existing `.html` sources have adjacent `.md` files that separately name
  behavior, layout/hierarchy, surface material, state treatment, and why.
- The Syllabus record explicitly covers all four entries, scoped identity,
  quotes, partial recovery, local-file boundary, and three-way re-import
  defaults.
- The existing Exam Prep record explicitly covers temporary-mode positioning,
  two-mode shared intensity, finish-time days, missing-evidence paths,
  catch-up, and autopsy closure.
- `rg -n "score|composite|readiness [0-9]+%|auto-apply|sixth.*tab" \
  mockup-lab/01-academics/academics-syllabus-import.md \
  mockup-lab/01-academics/academics-exam-prep-mode.md`
  finds no prohibited promise.
- Existing Academics lab pages still load.

## 6. Commit

`docs(mockups): record Academics Syllabus Import decisions`

Commit only the Syllabus Import decision document after the two drawing
conflicts above are resolved. The existing Exam Prep decision record and the
pending Stage-A drawing sources remain separate, as does unrelated dirty work.

## 7. Next stage — not in scope here

After Andy resolves the two Syllabus Import visual conflicts and approves its
decision record, rerun
`TAB-BRIEF-PROMPT.md` for Academics. The expected next stop is
**C · DECIDED, NOT BUILT** for Exam Prep and **E · FRONTEND MISSING** for the
already-shipped Syllabus Import flow. Because the ladder stops at its first
failure, the next brief must address only Stage C first; it must include Exam
Prep frontend and backend together, plus its calendar-capacity configuration
checklist.
