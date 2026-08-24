# T1 · Academics — Package A syllabus setup journey

**Stage:** D · BACKEND / PERSISTENCE PROOF MISSING

**Scope:** Prove and, only where a test exposes a defect, repair the private
student journey from an empty Academics store to one real, scoped class:

`cold import → review → apply → Class Hub → re-import → reload`

This is the first finish-line package from
`ACADEMICS-FINISH-LINE-AUDIT-2026-08-24.md`. It is deliberately not a visual
pass. Do not restyle Class Center, Class Hub, Materials, or the temporary
import mode here.

## 1. Step-1 audit

### A. Spec → paper

**Pass for the private setup journey.** The relevant private surfaces are drawn:

- `mockup-lab/01-academics/academics-class-hub.html` — course banner and five
  class-owned views;
- `mockup-lab/01-academics/academics-syllabus-import.html` — upload, review,
  re-import, no-parse, and wrong-document states; and
- `mockup-lab/01-academics/academics-empty-states-prototype.html` — the
  no-class recovery that leads to import.

One separate §4.1-M requirement has **no private Package-A surface or model**:
the cross-user *shareable parsed structure* feature. It must remain explicitly
out of scope here—do not silently claim this private workflow implements it.
It needs its own Stage-A mockup/spec pass because it introduces a shared,
anonymous, term-and-section-scoped structure store and its own privacy review.

### B. Mockup → app

Existing implementation:

- `src/components/academics/ClassCenter.tsx` owns cold, scoped, and re-import
  entry routing plus the one-store apply operation.
- `src/components/academics/SyllabusImportMode.tsx` owns source selection,
  parse/review states, and the existing diff renderer.
- `src/lib/academics/syllabusParser.ts` reads text, PDF, DOCX, image fallback,
  and normalizes dates; `syllabusReimport.ts` owns identity-based changes and
  defaults.
- `src/lib/academics/localSyllabusFiles.ts` retains the selected source locally.

The parser and diff engine have unit coverage, and the Class Center dashboard
proves the empty cold-import entry. What is **not yet proved as one real
student journey** is that the exact apply operation preserves ownership and
persists all supported fields through hydration for each entry scope. In
particular, no focused test currently proves all of these together:

- unscoped import creates exactly one `Course` and one `ClassWorkspace`;
- each scoped entry reuses that course instead of allocating another ID;
- a data-backed second import reaches the diff path even without a stale URL
  flag; and
- reload preserves the course, workspace, local syllabus reference, accepted
  records, corrections, and keep/accept decisions.

**Required measurement was blocked:** the currently available local Academics
tab reports *“This page crashed”*, so the required live `getComputedStyle`
comparison cannot be truthfully collected in this planning pass. Do not
substitute source inspection for a measurement. The next E fidelity brief must
first obtain a runnable Class Hub/import route and measure both themes.

### C. Already built — preserve, do not rebuild

- `93bfeb8` — identity-based `syllabusReimportDiff()` and its stable matching
  tests.
- `be10e7f` — honest empty Class Center entry and store-hydration boundary.
- `c684b35` — reviewed Materials folder intake; unrelated to importing a
  syllabus.
- Existing parser/PDF worker tests, logistic empty-only writes, policy-note
  retention, and the four existing entry routes in `ClassCenter.tsx`.

Do not replace the diff engine, build a second importer, or turn this into a
new wizard.

### D. Manifest gate

`BUILD-MANIFEST.md` marks all three source mockups above **YES**. This backend
and test hardening is authorized.

### E. Decision records

**Pass.** `academics-class-hub.md` records appearance and behavior for the
class-owned five-tab shell. `academics-syllabus-import.md` records the temporary
non-wizard flow, evidence-led review, accept/keep defaults, recovery states,
and its visual hierarchy. No variant is open.

### F. Integrations and services

| dependency | state | student-facing truth today |
|---|---|---|
| PDF/DOCX/text parsing | client-side code + tests | works locally; parser output remains a proposal until Apply. |
| local syllabus retention | local browser retention helper | selected source remains private to the device; it is not shared storage. |
| API/OAuth/provider | not required for private import | a syllabus must import without an AI key, cloud folder, or Calendar connection. |
| shareable parsed structure | absent, intentionally out of Package A | no student-facing shared syllabus claim may be added. |

There is no Andy console checklist for this private path. A live browser
reproduction is still required before promotion, but it does not require an
external account configuration.

## 2. Why this lands at Stage D

Stages A–C pass for this **private** journey: its screens are drawn, both
decision records include appearance, and the app has implementations. Stage D
fails because the course/workspace/import/re-import persistence invariant is
only covered in pieces. This brief closes that behavior proof or fixes a
specific failure it discovers. Visual matching remains the next stage and is
out of scope.

## 3. Work — prove one durable course setup path

### 3.1 Add an integration-level import test boundary

Add focused coverage next to the existing Class Center tests. Use the real
Zustand persist seam (`partialize → localStorage → rehydrate`) rather than a
mock store. Exercise `SyllabusImportMode` through the same callbacks that
`ClassCenter` owns, or extract the smallest pure apply helper only if that is
necessary to make the boundary testable.

The test data must be a minimal private proposal, not seed/demo data. It must
contain:

- one class identity;
- at least two units/topics;
- one exam and one ordinary deadline in ISO form;
- grade categories that sum to 100%;
- one policy; and
- logistics for instructor, meeting day/time, and location.

### 3.2 Required journey proofs

1. **Cold import:** applying an unscoped confirmed proposal creates exactly one
   `Course` and one matching `ClassWorkspace`, retains the submitted syllabus
   locally, and creates only the proposal’s topic/deadline/category records.
   No default/demo class may appear.
2. **Scoped import:** Class Hub Materials, Class Center overflow, and the
   Add-a-class fast path attach the proposal to their existing `courseId`; no
   second `uid()` / Course / Workspace is created. The static class identity
   is preserved.
3. **Second import:** when the scoped class already has syllabus-derived
   topics, assignments, or grade categories, ordinary import reaches the
   existing re-import diff even if the URL lacks `reimport=1`.
4. **Identity and defaults:** inserting a week into a newer proposal does not
   mark later title+date assignments or title-keyed topics/categories changed.
   Added rows default **Accept**; changed and removed rows default **Keep
   mine**; unchanged rows remain countable but not actionable.
5. **Apply choices only:** accepting a changed field changes only that field;
   retaining a changed or removed item preserves the student-confirmed value.
   A removed row never deletes anything unless the student explicitly accepts
   its removal. Do not write a second diff function.
6. **Logistics and policies:** imported logistics fill only blank
   `ClassWorkspace` fields. Existing instructor, meeting day/time, and
   location values win. Policy text stays verbatim in `GradeCategory.policyNote`;
   do not add drop-lowest, replacement, late-work, or grade-behavior math.
7. **Reload:** after a real persist/rehydrate cycle, course, workspace, local
   syllabus record, accepted topics, assignments, grade categories, policy
   note, and student-edited field are byte-equivalent in the fields this flow
   owns. No duplicate record appears.
8. **Recovery:** an empty/scan/no-parse path retains the source and exposes
   manual entry; a clearly wrong document writes no course record and offers
   only a route to Materials or an explicit override.

### 3.3 Runtime recovery only if reproducible

Start the local app and navigate specifically to the cold import and an
existing class’s scoped import/re-import routes. If either reproduces a runtime
error, capture the exact route and stack, add a regression test, and make the
narrowest fix required for **this import journey**. Do not touch the unrelated
Requirements tracker merely because the tab that happened to be open crashed.

### 3.4 Guardrails

- No visual/CSS/layout changes, mockup changes, lab status changes, or new
  controls. The current class-specific app annotations remain untouched.
- Do not create shared syllabus parses, Supabase storage, remote retention,
  Canvas fetching, OCR-as-fact, social data, or general model inference.
- Do not add an external integration requirement to a private local import.
- No U-9 score, composite, ranking, or progress-bar language.
- Keep all current unrelated working-tree changes out of the commit,
  particularly Flashcards V1/spec edits, generated output, and other briefs.

## 4. Done when

- [ ] All eight journey proofs above have an automated test or a documented
      manual browser proof; the new state changes have at least integration
      coverage through real hydration.
- [ ] `rg -n 'function syllabusReimportDiff' src` finds exactly the existing
      diff engine—no duplicate diff implementation exists.
- [ ] `rg -n 'drop.?lowest|replacement rule|late.?work.*math' src/components/academics src/lib/academics`
      finds no policy-to-grade-behavior implementation introduced by this pass.
- [ ] A local cold, scoped, and re-import route is manually reachable without
      a runtime error; any reproduced defect has a regression test and narrow
      repair.
- [ ] Focused tests, full `npm test`, `npm run build`, and `git diff --check`
      pass.
- [ ] Report exactly which proof remains manual. Do not call either page
      `built`: its measured two-theme visual audit still has not run.

## 5. Commit

`test(academics): prove syllabus setup journey persistence (§4.1-M)`

If a defect needs a source repair, use `fix(academics): preserve scoped
syllabus import invariants (§4.1-M)` instead. Commit only the tests and the
narrowest supporting source change; commit unrelated work separately.

## 6. Next stage — explicitly out of scope

**E · Fidelity:** after this test/behavior pass, compare the Class Hub and
Syllabus Import drawings against the running app in both themes, use literal
visual-recipe values, preserve Andy’s newer app annotations, and audit all
controls. Only after that can the page-level six-condition promotion audit run.

Materials generation, reviewed folders/Drive, Calendar, Planning, Grades &
Archive, Requirements, and shared parses are not implied by this brief.
