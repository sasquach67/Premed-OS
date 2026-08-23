# T1 · Academics — real first-run data boundary

**Stage:** D · BACKEND MISSING
**Status:** implementation brief only. This fixes the real-versus-demo initial
store boundary behind the approved Academics empty state. It does **not** restyle
Class Center, add a new screen, change an app annotation, or promote a page.

## 1. Fidelity audit — before this brief

### A. Spec → paper

Every current manifest-cleared Academics feature family has a paper owner:

| Family | Paper owner(s) |
| --- | --- |
| Daily Class Center, cards, assignments, class hub, review, and empty start | `academics-daily-main-page`, `academics-assignments`, `academics-class-hub`, `academics-review-session`, `academics-empty-states-prototype` |
| Per-class learning and generation | `academics-study-method`, `academics-forgetting-curve`, `academics-learning-signals`, `academics-exam-prep-mode`, `academics-materials-extensions`, `academics-lecture-capture`, `academics-topic-linking` |
| Syllabus and class configuration | `academics-syllabus-import`, `academics-class-types` |
| Planning, audit, grade decisions, rollover, and report | `academics-planner-prototype`, `academics-requirements`, `academics-grades-archive`, `academics-planning-decisions`, `academics-planning-cold-start`, `academics-term-rollover`, `academics-term-retrospective` |

**No new ruled Academics behaviour lacks a paper surface.** `Forecast Accuracy`
is drawn, but has no `Build? = YES` manifest row; it is deliberately excluded
from this and every implementation brief until the manifest changes.

### B. Mockup → app

| Mockup family | App owner exists | Translation finding |
| --- | --- | --- |
| Daily main / Class Center | `ClassCenter.tsx` | Exists. The live card is behaviour-rich but does **not** yet match the approved compact card geometry/hover ladder; see measured row below. That is stage E, not this backend pass. |
| Assignments / review / class hub | `AssignmentsPanel.tsx`, `ReviewSession.tsx`, `ClassHub.tsx` | Existing functional owners; visual promotion remains unassessed. |
| Empty state | `ClassCenter.tsx:533-553` | The approved UI exists, but ordinary first run never reaches it because `store.ts:75-80` creates a populated seed. **Backend failure.** |
| Class types | `ClassCenter.tsx`, `ClassHub.tsx`, `migrateClassTypesV10` | Persisted STEM/Writing/General configuration and type-specific workspace behaviour exist. The required daily-row verbs are not rendered; that is a later fidelity translation, not evidence of missing stored data. |
| Syllabus, Materials, lecture capture, topic linking, study tools | Their named `src/components/academics/*` owners | Existing implementation owners and migrations are present; their per-page visual/promotion tests remain later work. |
| Planner, Requirements, Grades & Archive, decisions, rollover, term report | `Academics.tsx`, `TermRollover.tsx`, `TermReportPanel.tsx` | Existing implementation owners are present; their per-page visual/promotion tests remain later work. |

#### Measured primary record surface — Class Center card, dark theme

Measured in the running app on 2026-08-23 with `getComputedStyle`, not token
names. The mock is `academics-daily-main-page.html` Variant A, `.cc`; the app
surface is the BIOL 252 `Preview` card.

| Surface | Mockup value | App value |
| --- | --- | --- |
| Class-card fill | `rgb(50, 46, 40)` | `rgb(50, 46, 40)` |
| Rest border | `1px solid rgb(60, 53, 45)` | `0.56px solid rgb(60, 53, 45)` |
| Radius | `13px` | `13px` |
| Rest/hover elevation | mock rest is none; approved hover is `0 18px 34px -16px` plus accent ring/glow | `0 1px 2px` plus `0 6px 16px -8px` at rest; the approved hover ladder is not established |
| Card geometry | compact `12px` padded card | `0px` padding on a much taller card shell |

This pass must not try to fix that visual divergence. It is evidence for the
next **E · fidelity** brief after this persistence defect is fixed.

### C. Already built — preserve, do not rebuild

- Class Center's approved zero-class composition, import-first action, and
  quiet `Add manually` link: `ClassCenter.tsx:533-553`.
- Demo namespacing and protection against an unstamped demo blob:
  `src/lib/demoMode.ts` and `src/store/store.ts:60-73`.
- Class type persistence and non-destructive type migration: `migrateClassTypesV10`.
- Syllabus ingestion, source-grounded study materials, lecture capture,
  planning, grade decisions, requirements, rollover, and Term Report commits:
  `93bfeb8`, `00036a5`, `4f734e4`, `b4f9a2e`, `f71e156`, and `3116c8f`.
- Every app-specific annotation or visual correction made after a mockup. A
  stale drawing is never permission to remove it.

### D. Gate

`BUILD-MANIFEST.md` marks the empty-state owner
`01-academics/academics-empty-states-prototype.html` **YES**. The manifest also
clears the other named Academics owner mockups in this audit. It does **not**
clear Forecast Accuracy; do not build it.

### E. Decision records

All current `mockup-lab/01-academics/*.md` paired records contain appearance
language as well as behaviour. In particular,
`academics-empty-states-prototype.md` records Variant A's action hierarchy and
solid-with-depth treatment. No decision-only stage blocks this backend pass.

### F. Integrations and services this tab owns

| Dependency | Classification | What the student sees today | Required result |
| --- | --- | --- |
| Local persisted Academics store | **CODE BUILT, RULE UNENFORCED** | A normal first visit is seeded with sample UNC courses, so an honest zero-class start is unreachable. | A normal first visit has an empty personal Academics collection; demo mode alone has sample records. |
| Syllabus parsing and local review | **CODE BUILT** | Import is available from the existing empty state once it can be reached. | Preserve it; no service/configuration work here. |
| Source-grounded generators / Supabase study-tools | **CODE BUILT; deployment configuration not re-proven in this brief** | A configured account can generate from selected material; an unavailable route must remain honest. | Outside this storage-only pass; never place a provider key in `src/`. |

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.0, §4.1-N, §9, §6.10,
  §6.12, §6.14, and §13.
- `mockup-lab/01-academics/academics-empty-states-prototype.{html,md}` —
  approved Variant A.
- `mockup-lab/01-academics/academics-daily-main-page.{html,md}` and
  `_shared/_visual-recipes.md` — measured card ladder preserved for the next
  fidelity stage.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md` and
  `premed-hq-documentation/implementation/component-inventory.md`.
- `src/store/store.ts`, `src/data/seed.ts`, `src/data/demoSeed.ts`,
  `src/lib/demoMode.ts`, and `src/components/academics/ClassCenter.tsx`.

## 3. BACKEND — separate a real first run from a demo

### 3.1 Add a real-person initial-data factory

Create a named, typed factory for an ordinary first-time personal namespace.
It must produce the valid app root and required preferences, but no fictional
student records, courses, current-term workspaces, assignments, topics,
grades, requirement completions, tasks, generated artifacts, attention counts,
or default records that render as the student's work. It may retain structural
defaults required for the app to boot (theme/system preferences and empty
collections), but no prose, number, date, or entity may pretend to be user
data.

Do **not** repurpose `createSeedData()` as a hidden template and delete only
courses. That approach leaks synthetic profile, goal, task, and cross-tab
values into a supposedly empty account. Keep the existing seed factory intact
for fixtures and the explicitly selected demo namespace; introduce a separate
personal-initial-data factory with tests that prove the Academics roots are
empty.

### 3.2 Bootstrap rules

1. A normal namespace with no persisted real root boots from the new empty
   personal factory.
2. An existing legacy or real namespace still hydrates through `migrateAll`
   and survives byte-for-byte except for an already-required migration. Do
   **not** infer that an existing seeded-looking record is disposable and do
   not silently clear it.
3. Demo mode remains the only route that calls `createDemoData()`, stamps the
   demo namespace, and presents sample data with its existing Demo data badge.
4. Existing test helpers may keep calling `createSeedData()`; their fixture
   contract must not become the user's first-run contract.
5. This brief changes no persisted entity shape, so do not bump the store
   version or create a destructive migration merely to replace the bootstrap
   factory.

### 3.3 Reset semantics

Do not change the visible Settings label or confirmation copy in this backend
pass. Preserve its current explicit seeded-plan action until a later
annotation/UX ruling decides whether real-account reset means blank personal
data, a downloadable backup plus clear, or a reset choice.

The first-run path is the defect being fixed. Existing users' records and the
current reset behaviour are protected from an accidental, broad data deletion.

## 4. FRONTEND

**None in this brief.** `ClassCenter.tsx` already renders the approved empty
state when the live collection is empty. Do not alter its markup, spacing,
glow, hierarchy, buttons, or app-specific annotations. The next fidelity brief
will translate the Class Center card geometry and the class-type daily verbs.

## 5. Do not break

- Never delete, rewrite, or classify an existing real/legacy record as demo.
- Never alter localStorage shape without a versioned, lossless migration.
- Never place fake courses, grades, grades-in-progress, goals, or assignments
  into the real namespace merely to make the page look populated.
- Keep Demo data explicit and isolated; do not let a demo badge sit above real
  student content.
- Do not touch Class Center's visual implementation, Settings copy, generator
  prompts, Supabase functions, model secrets, the manifest, or unrelated dirty
  documentation.
- No score, composite, ranking, progress bar, or inferred study metric.

## 6. Done when

- [ ] A brand-new normal localStorage namespace produces zero `courses`, zero
  `academics.classCenter.workspaces`, assignments, topics, grade categories,
  review events, and generated study artifacts.
- [ ] The same first launch renders the existing Class Center empty state;
  `Import syllabus` is usable and `Add manually` remains the quiet fallback.
- [ ] A demo namespace still receives only stamped `createDemoData()` records.
- [ ] A populated real namespace and a legacy namespace survive bootstrap and
  reload unchanged; no heuristic clears a record.
- [ ] Tests cover: new normal first run; demo first run; real persisted reload;
  legacy namespace copy; and frozen fixture data remaining unmutated.
- [ ] `npm run test` and `npm run build` pass.
- [ ] Grep proves no normal bootstrap route calls `createSeedData()`.

## 7. Commit

`fix(academics): separate real first run from demo seed`

Commit unrelated working-tree changes separately.

## 8. Next stage — E · fidelity, not in scope here

Re-run the Academics brief generator after this commit. The next known visual
work is Class Center: translate the approved compact class-card rest/hover
ladder and daily-row action verbs (`Recall` / `Draft` / `Read` / `Log`) while
preserving the already-persisted class-type model. Then promotion audits must
prove controls, reload persistence, an actually empty store, integrations, and
the recorded commit before any page is marked `built`.
