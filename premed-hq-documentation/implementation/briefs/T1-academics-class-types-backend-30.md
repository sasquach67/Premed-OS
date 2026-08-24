# T1 · Academics — Class-type suggestion contract

**Stage:** D · BEHAVIOUR / DATA CONTRACT NOT YET COMPLETE  
**Scope:** Make class-type selection an explicit, explainable proposal at
add-class time. This pass creates and tests the deterministic suggestion
contract only; it does not restyle Class Center, redesign the chips, or change
an already saved class type.

## 1. Step-1 audit

### A. Spec → paper

**Pass.** `academics-class-types.html` and its companion decision record draw
all of the build-cleared class-type rules: the three configurations, one shared
class-hub shell, the per-type third tab and primary action, one shared card
with a signal line, the urgency-ordered daily list, Writing’s draft/reading/
feedback substitute layer, and honest partial-reading degradation. No separate
paper state is missing for the current implementation unit.

### B. Mockup → app

Most runtime ownership is already present:

- `ClassHub.tsx` uses the one shared route and gates the fifth tab and primary
  action by `stem`, `writing`, or `general`.
- `ClassCenter.tsx` gives the daily signal line its contextual verb:
  `Recall`, `Draft`, `Read`, or `Log`; it does not put a type badge on cards.
- Writing records (`PaperDraft`, `AssignedReading`, `FeedbackNote`) and their
  type-scoped views exist; the reading tracker suppresses debt without a
  complete list.

The add-class behaviour fails the selected/spec’d interaction. The form’s
initial draft is hard-coded to `type: 'stem'` (`ClassCenter.tsx:192`), and the
three chips are merely direct setters. There is no proposal, no reason, no
confidence boundary, and no unselected state. That silently classifies a new
course before the student sees a reason, which contradicts
`01-academics.md` §3.3 and §4.1-N.

**Measured shared-card surface, Aug. 23, 2026** (running local app, dark
Class Center): the actual class card canvas was `#211e1a`, its card was
`rgb(50, 46, 40)` / `#322e28`, border `rgb(60, 53, 45)` / `#3c352d`, and
radius `13px`. The mockup uses the same warm-dark ladder for its card row
(`--bg #211e1a`, `--muted #322e28`, `--bd #3c352d`, `13px`). The shared shell
is therefore not the first failure. The first failed stage is the missing
selection contract behind the existing chips.

### C. Already built — preserve, do not rebuild

- Exactly the three existing `ClassWorkspaceType` values. Do not add a fourth
  type or a per-tool toggle list.
- `migrateClassTypesV10`’s lossless arrays and the existing dormant-data
  behaviour: switching a saved class must never delete topics, review events,
  drafts, readings, feedback, grades, or coursework.
- Type blindness outside the study view: GPA, BCPM, credits, requirement
  audit, Planner, and Overview must not read type.
- The shared class hub/tab/action ownership, daily-list verbs, writing reading
  degradation, class-card dimensions, Review-popup annotation, and all later
  app-specific visual annotations.
- Existing workspace `type` values. A previously stored selection is user data
  even when an older migration may have used a coarse default; this pass must
  not guess which legacy values were intentional and rewrite them.

### D. Gate

`BUILD-MANIFEST.md` marks
`01-academics/academics-class-types.html` **YES**. The backend/data contract
is authorized. Do not modify the manifest in this pass.

### E. Decisions record

**Pass.** `mockup-lab/01-academics/academics-class-types.md` records both
behaviour and appearance. The governing specification provides the missing
interaction rule precisely: one row of three chips at add time, a suggested
choice with a short reason, and no preselection when confidence is low.

### F. Integrations and services

| Dependency | Classification | Required handling |
| --- | --- | --- |
| Local course/workspace data | **CODE BUILT AND CONFIGURED** | A saved, student-confirmed type remains local and non-destructive. |
| Syllabus extraction facts | **CODE BUILT; may be absent** | It may supply the strongest suggestion only when already parsed. It must never make a suggestion appear as a confirmed selection. |
| Course code / BCPM metadata | **CODE BUILT AND CONFIGURED** | Use only as a lower-confidence deterministic hint with an honest reason. |
| User history | **NOT YET A SAFE INPUT** | Do not infer from broad past labels. Include it only when a future explicit, attributable history signal is designed and tested. |
| Catalog / Canvas / AI provider | **NOT REQUIRED** | A local add-class flow must remain usable with no network/provider. |

**First failed stage: D.** The mockup and decisions exist, the manifest permits
the work, but the source has no proposal contract and silently initializes the
form as STEM. A fidelity-only pass would merely make the wrong interaction
prettier.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §3.3 and §4.1-N, especially
  “Picking it — one row of chips at add time.”
- `mockup-lab/01-academics/academics-class-types.{html,md}` — selected visual
  and interaction treatment.
- `mockup-lab/_shared/_visual-recipes.md` — later literal visual translation;
  reference only in this data pass.
- `src/components/academics/ClassCenter.tsx` — add/edit draft owner; do not
  restyle it in this pass.
- `src/components/academics/ClassHub.tsx` — shared three-configuration owner.
- `src/store/migrations/classTypesV10.{ts,test.ts}` and `src/store/store.ts` —
  existing type hydration boundary.
- `premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md` and
  `component-inventory.md`.

## 3. Work — backend/data contract only

### 3.1 Introduce one pure suggestion seam

Create one tested, framework-independent function under
`src/lib/academics/` that receives only already-available, attributable facts
about the not-yet-created class and returns exactly one of:

```ts
type ClassTypeProposal =
  | { kind: 'suggestion'; type: ClassWorkspaceType; reason: string; source: 'syllabus' | 'course-code' | 'course-metadata' }
  | { kind: 'needs-choice' }
```

It is a **proposal**, not a `ClassWorkspace` writer. It must be pure and must
not call a provider, mutate data, create a workspace, write storage, or use
the current date.

### 3.2 Evidence order and conservative rules

Apply sources in this strict order; return at the first high-confidence result:

1. **Parsed syllabus facts** when they are already present for this class:
   - a verified writing signal such as a paper/draft assignment or a stated
     dominant writing/paper component → Writing;
   - a verified cumulative topic/unit/exam structure with no competing writing
     signal → STEM;
   - neither → continue, never manufacture a category from a file name.
2. **Course metadata/code** only when a narrowly documented deterministic rule
   applies:
   - established writing prefixes (`ENGL`, `WRIT`, `COMP`, `RHET`, `LIT`) →
     Writing with a code-based reason;
   - explicit BCPM / science metadata → STEM with a metadata-based reason.
3. **No confident source** → `{ kind: 'needs-choice' }`. General is a valid
   explicit student choice; it is not a silent fallback for uncertainty.

Reasons are one short, human-readable sentence naming the evidence, e.g.
“Suggested Writing — this syllabus includes a staged paper.” Never claim the
catalog, a percentage, or a syllabus fact that the input did not provide.

Do not add user-history inference in this pass. A prior course title or a
previous label is too weak to classify a new course without a separate,
attributable decision record.

### 3.3 Separate proposal state from saved state

- Remove the implicit assumption that an unsaved add-class draft has a saved
  `ClassWorkspace.type`. A draft may be unchosen; a persisted workspace may
  not.
- Do **not** make `ClassWorkspace.type` nullable, and do **not** change its
  three-value union. The later UI pass must require an explicit click before it
  creates/saves a workspace when the proposal is `needs-choice`.
- Do not overwrite a type after a syllabus parses or re-imports. A later parse
  may show a new proposal/reason for the student to select, but it has no
  automatic writer.
- Preserve the current V10 migration’s idempotence and deep-data safety. Do
  not launch a corrective migration that reclassifies legacy `stem` records:
  the persisted record cannot distinguish a student’s choice from an old
  default without inventing intent.

### 3.4 Tests

Add focused tests that prove:

- each of the three successful source paths returns the correct type, source,
  and human-readable reason;
- syllabus evidence wins over code/metadata where they conflict;
- unknown/missing/ambiguous evidence returns `needs-choice`, never General or
  STEM by default;
- every result is serially stable and the function has no mutation side effect;
- the contract cannot produce a fourth type or a type outside the existing
  union;
- existing V10 migration tests still prove frozen input safety, idempotence,
  array preservation, and no reclassification of an already persisted type.

This pass does not need a provider test: proposals are deterministic and must
remain available offline.

## 4. Do not break

- The exact three-type union and all type-gated class-hub behaviour already in
  place.
- Existing student selections and dormant study data.
- GPA, BCPM, credits, satisfaction, Planner, Requirements, Archive, and
  Overview type blindness.
- Syllabus import/re-import: extraction proposes; it never changes a selected
  class type.
- Writing’s equal-density substitute layer and reading-debt denominator rule.
- The recently approved square class-card sizing, compact card flow, popup-only
  Review action, softened colors, and any app annotations that differ from an
  older mockup.
- Unrelated working-tree brief/spec/output edits.

## 5. Done when

- [ ] One exported pure contract returns only `suggestion` or `needs-choice`.
- [ ] It obeys syllabus → course code/metadata → no selection, without a
  network call or an AI/provider dependency.
- [ ] It never writes a workspace, mutates an input, or silently changes an
  existing `type`.
- [ ] A missing/ambiguous input produces an honest explicit-choice outcome,
  not a defaulted STEM/General class.
- [ ] Focused unit tests, the complete test suite, TypeScript check, and the
  production build pass.
- [ ] The follow-up UI/fidelity brief has a stable contract to render: an
  unselected three-chip row or one preselected suggestion with its reason.

## 6. Commit

`feat(academics): add explainable class-type suggestions (§4.1-N)`

Commit only the contract, its tests, and any necessary narrow type/import
changes. Keep all current unrelated brief/spec/output changes out of it.

## 7. Next stage — not in this brief

Run a **Stage E class-type selection fidelity brief** after this contract lands.
It must wire the existing add-class chips to the proposal without adding a
wizard: show a suggestion reason, leave every chip unselected when the contract
returns `needs-choice`, require an explicit type before creation, and retain
the exact warm-dark/shared-card treatment. It must then visually measure the
add-class state in paper and dark, plus Writing and General class-hub states;
only after that can the six-condition promotion audit be attempted.
