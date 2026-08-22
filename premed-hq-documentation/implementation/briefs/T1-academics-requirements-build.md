# T1 · Academics → Requirements — safe audit implementation

**Stage:** C · DECIDED, NOT BUILT

**Scope:** Replace the legacy `TarHeelTracker()` checklist with the selected
Requirements product views: **Audit A / All requirements B / Prior credit A**.
Ship the screen and the minimum lossless transcript-record persistence it needs
in one pass. This is a Requirements audit, **not** a completion engine and not
a Planner rebuild.

---

## 1. Fidelity audit — preserve what exists, replace what is unsafe

### a) Paper and decision status

`academics-requirements.html` is manifest-cleared **YES, screen only**. The
decisions file now rules these views:

| Product view | Selected treatment | Source |
|---|---|---|
| `audit` | **A — verdict-led bento** | `academics-requirements.md` · Aug. 22 ruling |
| `requirements` | **B — gap-first** | same |
| `prior-credit` | **A — ledger with context** | same |

No remaining buildable feature lacks a paper surface. `academics-tar-heel-
tracker.html`, forecasting, and retrospective files remain outside this brief:
they have no cleared manifest row or are separate surfaces.

### b) Current app versus selected drawing

`src/pages/Academics.tsx` currently renders `TarHeelTracker()` under the
Planning `tracker` tab. It must be replaced, not cosmetically patched:

- it is a three-column course planner/checklist rather than an occasional
  audit with three product views;
- it derives completed/remaining totals, progress bars/rings, degree totals,
  and warnings from the flat `RequirementItem.satisfiedBy` list;
- its main sidebar, header, and cards all repeat `#2b2722` / 16px instead of
  establishing the selected drawing's `#211e1a → #2b2722 → #322e28` ladder;
- it has no transcript-context ledger or exact-course capture path.

**Measured before work**

| Surface | Mockup | Current running app |
|---|---:|---:|
| Page | `#1a1714` | `rgb(33, 30, 26)` / `#211e1a` |
| Primary card | `#2b2722`, `16px` | `rgb(43, 39, 34)` / `#2b2722`, `16px` |
| Inner data surface | `#322e28`, `13px` | absent as the primary audit rung |

The palette base survives; the hierarchy and product design do not.

### c) Already built — do not rebuild

| Existing capability | Preserve |
|---|---|
| Planner terms, named scenarios, locks, summer/gap slots | `b4f9a2e`; Planner remains the sole term-building owner. |
| Planner preview / compare / locked-term states | `088144b`; Requirements may link to the Planner, never recreate it. |
| Course records, requirement records, `patchItem`, data export/import | Preserve each record and existing store contract. |
| Existing study, syllabus, Grade Decisions, and term-rollover work | Out of scope. Do not refactor them while replacing this screen. |

### d) Data and integration boundary

`premed-hq-documentation/data/unc-requirements.json` is **not** safe for
degree-completion arithmetic: five majors need verification, current cohort
coverage conflicts, and the schema cannot represent choices, exclusions,
credit minima, or double-count rules. The build manifest repeats that warning.

Therefore this screen may display raw catalog-library entries and a student’s
own transcript/course records, but it must not claim that any course satisfies
or clears an academic requirement. ConnectCarolina is linked and named as the
official audit. No external integration needs configuration for this pass.

---

## 2. References

- Selected drawing: `mockup-lab/01-academics/academics-requirements.html`
- Ruling and appearance: `mockup-lab/01-academics/academics-requirements.md`
- Exact values: `mockup-lab/_shared/_visual-recipes.md`
- Product law: `premed-hq-documentation/tabs/01-academics.md` §4.2-A, §4.2-C2,
  and §4.2-D
- Gate and no-math warning:
  `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`
- Dataset caveats: `premed-hq-documentation/data/unc-requirements.json` →
  `meta.majorScope`
- Components: `premed-hq-documentation/implementation/component-inventory.md`
- Universal rules: `premed-hq-documentation/general.md` — U-1, U-5, U-8, U-9

---

## 3. FRONTEND — one audit component, three views

Extract the Requirements screen from `Academics.tsx` into one page-owned
component (for example `src/components/academics/RequirementsAudit.tsx`). Do
not fork `PlannerBoard`, `TrackerTable`, `InteractiveCard`, `Tabs`, or
`ModeSwitch`.

### Shared shell

- Rename the user-facing Planning subtab to **Requirements**. “Tar Heel
  Tracker” may appear as quiet supporting context, not as a competing page
  identity.
- Use the selected mockup’s solid level-three segmented control for `audit`,
  `requirements`, and `prior-credit`; it is not a second tab row. The URL must
  preserve the selected view and browser back/forward must restore it.
- Header: one concise planning-library boundary and an explicit **Open official
  degree audit** external action. It opens the authoritative ConnectCarolina
  destination; never label it “verify completion.”
- Use literal recipe rungs: page `--bg`; bento panels `--card`, 16px;
  data rows/inner panels `--muted`, 13px; borders `--bd`. No glass outside the
  shared Academics mode pill/banner strip.
- Visible `:focus-visible` rings, 120–150ms quiet state transitions, and a
  reduced-motion path. At narrow widths, bento cells stack; the transcript
  ledger becomes a readable labelled card sequence.

### `audit` — selected A, verdict-led bento

This is a **data-availability verdict**, not a pace or completion verdict.

1. Lead with the transparent boundary card: what this local library can show,
   what it cannot determine, and ConnectCarolina’s authority.
2. Render only named, evidenced attention items:
   - entries whose catalog source is marked `needs-verification`;
   - source freshness/curriculum-cohort caveats from the supplied library;
   - a student-recorded course lacking transcript-fidelity fields, phrased as
     *“Record details are missing”*, never as an unmet requirement.
3. **Planned next term**, not an algorithmic “Suggested next term”: show the
   student’s own earliest unlocked Planner term and its recorded courses. If
   none exists, use one friendly one-line empty state with a link to Planner.
   Never rank courses, count boxes, or choose a course for the student.
4. The overlap card is explanatory only: show the named mapping/evidence
   relationships supplied by a record, and label uncertain mappings. Do not
   calculate “boxes cleared for free,” apply a double-count cap, or infer a
   requirement is met.
5. The bottom groups are a compact preview of the raw catalog library with a
   **View all requirements** action.

### `requirements` — selected B, gap-first

- Group raw catalog entries by their published set (IDEAs, med prerequisites,
  selected-major library), with source URL, last-verified date, and a labelled
  confidence chip per group/entry.
- Within each group, uncertainty and incomplete source provenance lead;
  better-sourced entries recede but remain open and searchable. “Gap-first” is
  visual priority, not a calculated completion state.
- An unverified-major warning boundary explains that the student may acknowledge
  the warning for themselves, but the app will never change the catalog’s
  verification status or promote it to official fact.
- Rows can open the source URL and show raw `howSatisfied`, notes, exclusions,
  and catalog year. They must not render `met`, `planned`, `open`, `%`, rings,
  progress bars, “requirements left,” course recommendations, or course-claim
  chips such as “clears 3.”

### `prior-credit` — selected A, ledger with context

- Render every student course that is marked AP, transfer, dual enrollment,
  repeat, withdrawal, or pass/fail, as well as any course with a stored
  transcript record. There is no fake demonstration ledger when the store is
  empty.
- Each row makes **exact transcript code and title** primary. Display name,
  institution, term, credits, grade, course type, optional transcript-line
  scan, and capture provenance are visible context—not normalised replacements.
- An **Add prior credit** action opens a small course-record form. It must be
  keyboard reachable and save/return to the ledger. It does not classify BCPM,
  mark a requirement met, or make an enrollment/transfer claim.
- Empty state: one sentence explaining why exact records now make a future
  AMCAS export reliable, plus the same add action. No sample credits/grades.

---

## 4. BACKEND — lossless transcript context, no completion engine

### 4.1 Course transcript shape and migration v30

Add an optional, nested, lossless `transcript` field to `Course`; do not create
a second course collection and do not overwrite `Course.code` or `Course.title`.

```ts
type TranscriptCourseType =
  | 'regular' | 'ap' | 'transfer' | 'dual-enrollment'
  | 'repeat' | 'withdrawal' | 'pass-fail'

interface CourseTranscriptContext {
  institution: string
  courseNumber: string
  courseTitle: string
  termLabel: string
  creditHours: number | null
  gradeRecorded: string
  courseType: TranscriptCourseType
  transcriptLineBlobRef?: string
  capturedAt: number
  updatedAt: number
}
```

- Add **version 30**, chaining after v29. It only ensures old courses retain
  their original fields and receive no fabricated transcript values. Existing
  courses may have `transcript: undefined`; a migration must never derive an
  “exact” title or institution from display fields.
- Use a fresh deep structure, preserve unknown records/fields, and make the
  migration idempotent. Add frozen-input and twice-run migration tests.
- New course flows may create a transcript context only from typed user input.
  Update it through the existing `patchItem('courses', …)` path.
- If attaching a transcript-line image is already supported by the existing
  blob layer, retain only a blob reference in the course record. If no safe
  picker/retention path exists, show “No scan attached” and do **not** add a
  fake upload button or store file bytes in localStorage.

### 4.2 Personal acknowledgment is not catalog verification

Store a user’s one-tap source-warning acknowledgment separately from the
catalog fact—e.g. an optional `acknowledgedCatalogWarnings` record keyed by
stable requirement/library ID and source version. It contains only:

```ts
{ requirementId, sourceVersion, acknowledgedAt }
```

- It can hide the repeated warning for that user’s current source version;
  a new source version re-surfaces it.
- It never writes `verificationStatus`, never changes a catalog source, and
  never affects the audit’s language or any calculation.
- Version and migrate this addition losslessly. Tests prove reload persistence,
  source-version reappearance, and no mutation of `RequirementItem` metadata.

### 4.3 Remove unsafe Requirements derivation from this surface

- `requirementStatus`, progress rings/bars, totals, credits-to-120, overlap
  counts, “planning issues,” `unplacedRequirements`, and any completion-based
  warning must not power the new Requirements component.
- Do not delete reusable Planner helpers unless no other caller uses them. The
  scope is to stop consuming them here; Planner work remains untouched.
- Any data that is insufficient becomes dormant with a stated reason (U-5),
  never zero, empty data visualization, or an inferred student state.

---

## 5. Do not break

- The Planner retains all term editing, planning slot, locked-term, scenario,
  course-library, and user-annotation behavior from `b4f9a2e`.
- Preserve all existing courses, requirements, import/export data, and older
  local storage through v30; no destructive reshaping or inferred values.
- Never treat the flat UNC file, a course label, or a student acknowledgment as
  proof of graduation, requirement completion, official course equivalency, or
  AMCAS BCPM classification.
- No score, composite, ranking, percentage, ring, progress bar, completion
  count, automatic course advice, retention figure, or fake demo record.
- No `academics-tar-heel-tracker.html` work, no manifest edit, no Atlas/UNC
  scrape, and no change to Google Calendar, syllabus generation, or materials.
- Reuse the existing solid data-surface components; do not add a requirements
  component library or copy mockup inline CSS.

---

## 6. Done when

### Screen and fidelity

- [ ] `audit`, `requirements`, and `prior-credit` render the selected A/B/A
      hierarchy, are route-addressable, keyboard accessible, and responsive.
- [ ] The literal dark ladder measures in both themes: outer panel is the card
      rung/16px, nested row is the muted rung/13px, and neither is washed into
      the same computed color by transparency.
- [ ] The current three-column planner/checklist, totals, rings, bars, and
      completion/warning calculations are absent from Requirements.
- [ ] Empty store shows only friendly, honest empty states—no sample courses,
      requirements, grades, credits, or catalogue counts survive.
- [ ] `rg` proves no Requirements copy claims “completed,” “remaining,”
      “on pace,” “clears,” “degree progress,” or a percentage.

### Data and persistence

- [ ] v30 is lossless, frozen-input safe, and idempotent.
- [ ] Existing courses retain every pre-v30 field byte-for-byte.
- [ ] Transcript context is only created from student-entered values; exact
      values lead the ledger and are never silently normalised.
- [ ] Acknowledging a source warning persists across reload, reappears on a
      source-version change, and never mutates source verification metadata.
- [ ] Empty transcript context renders “not recorded,” never guessed values.

### Verification

- [ ] `npm run test` and `npm run build` pass.
- [ ] Test the three views in light and dark themes, keyboard-only, reduced
      motion, populated data, and empty data.
- [ ] Run the inert-control audit for the touched Requirements surface with
      zero unhandled Button/DropdownMenuItem/ContextMenuItem controls.
- [ ] Do **not** promote the page yet unless all six conditions in
      `VARIANT-LAB.md` pass, including an empty-store proof and the new
      persistence tests. This brief does not assume they will.

---

## 7. Commit

```
feat(academics): translate Requirements audit without completion maths
```

## 8. Next stage — not in this brief

After this lands, rerun the tab brief prompt. It must audit the implemented
screen against the six promotion conditions before changing mockup status. The
remaining Requirements data-model work—complete catalog rule semantics,
official-cohort verification, and any real completion calculation—requires a
separate evidence-backed ruling and is explicitly not in this build.
