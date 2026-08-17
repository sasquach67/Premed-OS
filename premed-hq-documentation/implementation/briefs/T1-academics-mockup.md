# T1 · Academics — remaining mockup coverage

**Stage:** A · NOT DRAWN

**Scope:** Academics only: Daily and Planning. This is a drawing brief. It
does not authorize changes to `src/`, the persisted store, Supabase, cloud
configuration, or `BUILD-MANIFEST.md`.

## 1. Fidelity audit — completed before this brief

### a. Spec → paper

The primary Academics surfaces are drawn, and the prior Stage-A pass added
Materials extensions, lecture capture, Planning decisions, Planning cold start,
and term rollover. Two ruled surfaces still have no actual mockup source:
`variant-lab.html` currently gives each only a generic `deepState(...)`
placeholder. A sentence in the lab navigation is not a product surface.

| Ruled feature without a usable paper surface | Binding source | What must become visible |
|---|---|---|
| **Learning signals** | `tabs/01-academics.md` §6, “Learning signals — the class-page surface” | A real STEM Class Hub **Overview** panel, placed under the class’s primary next action. It needs cause → consequence → one owner-routing action; dormant/absent behavior; the at-most-three rule; situational evidence; and a cross-class overlap proposal that asks for confirmation rather than merging courses. Writing and General exclusion must be explicit. |
| **Grade decisions and mistake evidence** | `tabs/01-academics.md` §6.8; candidate features #44–50 | A real Planning → Grades & Archive detail state for an individual course/graded item: regrade timing, policy visibility, incomplete-grade/no-data recovery, and mistake-cause evidence including blanked vs. did-not-know. A generic GPA display cannot stand in for decisions that need the underlying record and evidence. |
| **Materials failure/result states** | `tabs/01-academics.md` §§4.1-G, 4.1-O, 4.1-P | `academics-materials-extensions.html` draws a catalog, Path-A handoff, and pre-generation source selection, but it does not yet draw a provider failure/recovery, source-linked generated result, or a clear feed-unavailable/reconnect state. Those are ruled interaction states, not implementation footnotes. |
| **Planner action consequences** | `tabs/01-academics.md` §4.2-C3 | `academics-planning-decisions.html` draws requirement preview, saved-plan comparison, and course timing. It does not visibly show a locked registered term, a substitute choice, or the result of exporting an advisor snapshot. These must be distinguishable from a suggestion. |

The following Stage-A work now has a real mockup and is **not rebuilt** in this
brief: resource catalog/Canvas Path A/generation composition, lecture capture’s
main flow, term rollover’s three fates, Planning’s main decision composition,
and Planning’s first-fact cold state.

**Spec conflicts resolved while drawing:**

- Learning signals are not another Daily tab, notification feed, or generic AI
  coach. They live only in a STEM class’s Overview and route outward to the
  owner that resolves the issue.
- The study-guide surface may use only student-supplied material and must keep
  provenance. It may not fill a missing source with general course content.
- Canvas Path A is a read-only calendar-feed handoff. Do not depict Canvas
  REST, browser-side token handling, or a write action.
- Grade-policy behavior may be displayed only as a rule that was applied;
  incomplete policy data stays incomplete. Do not invent a curve, outcome, or
  score.
- No readiness score, composite, percentage bar, or fake empty metric is
  permitted. Named, attributable evidence is the design material.

### b. Mockup → app

| Mockup / surface | App evidence | Audit result |
|---|---|---|
| Daily · Class Center | `src/components/academics/ClassCenter.tsx`; `9f4d3ac` | Existing app owner; do not redraw or rebuild it in this pass. |
| Assignments | `src/pages/Academics.tsx`, `src/components/common/AssignmentsPanel.tsx` | Existing shared assignment owner; later fidelity audit only. |
| Class Hub | `src/components/academics/ClassHub.tsx`; `7ddf493` | Existing five-tab owner. Materials and Learning Signals must extend it, never fork it. |
| Review session | `src/pages/AcademicRecallSession.tsx`, `src/lib/academics/activeRecall.ts`; `9f9d98a` | Shipped; response recording is not the separate lecture-capture feature. |
| Empty state and class types | `src/components/academics/ClassCenter.tsx`; `cb963a3` | Shipped; excluded from this pass. |
| Syllabus import / re-import | `ClassCenter.tsx` plus parser and re-import tests; `69a0b41`, `93bfeb8`, `1ee2c87` | Behavior ships. Its missing companion decision document is a later Stage-B concern, not a reason to redraw it now. |
| Exam prep mode | Class-scoped behavior in `ClassCenter.tsx` | Drawn but without a companion `.md`; later Stage B. |
| Planner, Tar Heel Tracker, Grades & Archive | `src/pages/Academics.tsx` | App surfaces exist, but their proposed drawings are not a claim of fidelity. The new Grade Decisions state belongs inside the existing Grades owner. |
| Materials extensions, lecture capture, Planning decisions/cold start, term rollover | No matching new app owners expected at Stage A | Correctly drawing-only and proposed. |
| Learning signals and Grade decisions | Lab-only `deepState(...)` placeholders | **Not drawn.** These are why this run stops at Stage A. |

### c. Already built — do not rebuild

- Zero-class launchpad and the three class-type configurations: `cb963a3`.
- Syllabus ingestion, local source retention, scoped entry, and identity-based
  re-import: `69a0b41`, `93bfeb8`, `1ee2c87`.
- Existing Class Center and Class Hub structure: `9f4d3ac`, `7ddf493`.
- Active-recall loop: `9f9d98a`.
- The previous paper-only Academics coverage pass: `0cc610d`, refined in
  `33ced05`.

### d. Gate

`BUILD-MANIFEST.md` has **YES** rows for the established Academics Daily and
Planning mockups. The seven newer Stage-A source names below have no individual
manifest rows. That does not block drawing, but it blocks any later source-code
implementation until Andy explicitly adds/clears them. This brief makes no
manifest edits.

### e. Decision-file audit

| Source | Appearance record | Result |
|---|---|---|
| Daily, Assignments, Class Hub, Review session, Class types, Empty states | Companion decisions record hierarchy and appearance | Pass for a later stage. |
| Planner, Tar Heel Tracker, Grades & Archive | Companion decisions record views, hierarchy, and layout intent | Proposed; no automatic promotion. |
| Materials extensions, Lecture capture, Planning decisions, Planning cold start, Term rollover | Companion decisions record behavior **and** treatment, hierarchy, surface material, and component boundary | Pass for the paper already drawn; this brief only fills the specific states named above. |
| Syllabus import and Exam prep | No companion `.md` | Stage B after every Stage-A surface is drawn. Do not write their decision docs in this pass. |
| Learning signals and Grade decisions | No HTML or companion `.md`; only lab placeholders | **Stage A fails here.** |

### f. Integrations and services owned by Academics

| Dependency | Classification | Student-visible state today | Later responsibility |
|---|---|---|---|
| Google Calendar read-only OAuth | **CODE BUILT, NOT PUBLICLY CONFIGURED/VERIFIED** | A student may see normal local/empty schedule behavior unless their Google connection is set up; public users can still meet Google’s unverified-app warning until Andy completes verification. | Not code in this drawing brief. Any Calendar-adjacent mock must include the honest unconnected state and never imply live data. |
| Canvas Path A, Canvas calendar feed through Google Calendar | **CODE MISSING** | No course-attributed Canvas-feed review exists in the app. | A later full brief owns a read-only, review-before-apply Path A. Path B REST remains explicitly deferred. |
| Grounded study generation service | **CODE BUILT, CONFIGURATION MUST BE VERIFIED** | Without configured provider secrets, the app must show unavailable/recovery rather than fabricate study content. | Later configuration checklist: verify server-side secret availability, test an authenticated call, and keep keys out of the client bundle. |
| Local syllabus file retention | **CODE BUILT AND CONFIGURED** | A chosen syllabus can be retained for re-import locally; it is not cloud file storage. | New mockups must not imply cross-device storage. |
| Lecture transcription/capture | **CODE MISSING** | No lecture-capture pipeline exists; recall audio is a different feature. | A later full brief must own local-first transcription, explicit cloud opt-in, policy disclosure, quote/timestamp evidence, and no-audio recovery. |
| Anki | **NO LIVE INTEGRATION REQUIRED** | No Premed OS scheduler or review queue is promised. | Preserve one-way export only. |

## 2. Work — Stage A only

Create or extend **only** the following proposed drawing sources in
`mockup-lab/01-academics/`, register each real source in
`mockup-lab/variant-lab.html` with `status:"proposed"`, and write/update the
companion `.md` with both behavior **and appearance**. Use the existing
Academics shell and `_shared/_visual-recipes.md` literally. Do not touch `src/`.

1. **`academics-learning-signals.html` + `.md`**
   - Draw a class-scoped STEM Overview panel in its real position: below the
     primary next action, above supporting class information.
   - Use at most three cause → consequence → one-action items. Actions route to
     Topics/review, Materials, Assignments, or the recall summary.
   - Draw populated, dormant/absent, and cross-class-overlap-proposal states.
     The latter must present evidence and ask for confirmation of a `TopicLink`.
   - Draw the type boundary plainly: Writing and General have no pretend
     signals panel. Do not render a zero/empty replacement.
   - Try **A/B/C only here**, because the contextual composition remains open:
     a narrow overview rail, an editorial section below the next action, and a
     compact evidence-first drawer. They must all use the same data rules.

2. **`academics-grade-decisions.html` + `.md`**
   - Draw this inside Planning → Grades & Archive rather than creating a new
     tab. Its states are: a returned item with a regrade window, a policy-aware
     calculation disclosure, insufficient grade/policy data, and a
     mistake-evidence detail that separates blanked from did-not-know.
   - Every metric needs an attributable input. If the record is incomplete,
     show the missing input and a recovery action—not a projection, zero, or
     generic warning.
   - Use one coherent treatment and named product views instead of A/B/C
     cosmetic alternatives. It must feel like a record detail/decision surface,
     not a wall of rectangular alert cards.

3. **Extend `academics-materials-extensions.html` + `.md`**
   - Add named product states for: no calendar feed/reconnect recovery;
     a source-linked generated result; and provider unavailable/error after the
     student selected eligible material. No request runs before the student
     selects sources.
   - Keep the existing three quiet Materials tools. Do not make a sixth Class
     Hub tab or draw Path B.

4. **Extend `academics-planning-decisions.html` + `.md`**
   - Add a locked registered-term state, an explicit substitute selection with
     what it clears/does not clear, and an advisor-export result that names its
     assumptions and source date.
   - A locked term is a factual boundary, not a decorative lock. Suggestions
     must not visually appear able to alter it.

## 3. References

- `premed-hq-documentation/tabs/01-academics.md` §§4.1-G, 4.1-O–Q,
  4.2-C, 6, 6.8, 6.10–6.12, 13–14.
- `premed-hq-documentation/implementation/component-inventory.md`.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md`.
- `premed-hq-documentation/specifications/01-shared-interface-patterns.md`.
- `premed-hq-documentation/specifications/04-visual-craft-standards.md` §0.
- `premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md`.
- Existing source and decisions: `mockup-lab/01-academics/academics-class-hub.*`,
  `academics-materials-extensions.*`, `academics-lecture-capture.*`,
  `academics-planning-decisions.*`, `academics-planning-cold-start.*`,
  `academics-term-rollover.*`, and `academics-grades-archive.*`.

## 4. Do not break

- Do not touch `src/`, store shapes, migrations, Supabase, cloud credentials,
  tokens, fonts, or the manifest.
- Do not replace Class Center, Class Hub, the existing syllabus import/re-import
  flow, class types, empty state, active recall, Planner, or Grades & Archive.
- Do not add a sixth Class Hub tab, another Academics top-level tab, a Canvas
  browser fetch/token, a Canvas write action, or a live Anki review surface.
- Do not present AI output as course truth. Generation is student-material
  grounded and retains provenance.
- Do not draw scores, composite readiness, invented percentages, fake examples,
  zero-progress empty states, generic “you are behind” warnings, or a predicted
  exam outcome.
- Glass floats only over banner art or an overlay. Dense records and decision
  surfaces stay solid-with-depth.

## 5. Done when

- `academics-learning-signals.html` and `academics-grade-decisions.html` each
  exist with a companion `.md`, and each has a real registry entry rather than
  a `deepState(...)` placeholder.
- Learning Signals shows its STEM-only boundary, maximum-three discipline,
  one-action routing, dormant/absent rule, and confirm-before-link overlap.
- Grade Decisions names source evidence, policy application, incomplete-data
  recovery, regrade timing, and blanked-vs-did-not-know without inventing a
  result.
- Materials contains a source-linked generation result and both relevant
  unavailable/recovery states; Planning contains lock, substitute, and export
  result states.
- `rg -n "score|readiness|[0-9]+%|high-yield" mockup-lab/01-academics/academics-learning-signals.* mockup-lab/01-academics/academics-grade-decisions.*`
  finds no prohibited new claim.
- `rg -n "academics-learning-signals|academics-grade-decisions" mockup-lab/variant-lab.html`
  points to the two real sources and both remain `status:"proposed"`.
- Existing Academics pages still load in the lab. `npm run build` remains clean
  even though this stage has no app-code change.

## 6. Commit

`docs(mockups): draw remaining Academics decision states`

Commit only these two new sources, their decision documents, the two targeted
source/decision extensions, and the exact registry hunks. Do not sweep unrelated
dirty lab, research, or brief work into this commit.

## 7. Next stage — not in scope here

After Andy reviews these drawings, rerun `TAB-BRIEF-PROMPT.md` for Academics.
The expected next stop is **B · DRAWN, NOT DECIDED** for syllabus import and
exam prep (and any source whose updated companion `.md` lacks appearance
decisions). No app code is authorized by this brief.
