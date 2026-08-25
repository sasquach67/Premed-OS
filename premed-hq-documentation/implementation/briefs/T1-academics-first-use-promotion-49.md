# T1 · Academics — Package A first-use promotion audit

**Stage:** F · promotion audit only  
**Status:** ready to execute  
**Authority:** `ACADEMICS-FINISH-LINE-AUDIT-2026-08-24.md` §4, `PAGE-PROMOTION-PROMPT.md`, and the approved Build Manifest rows.  
**Purpose:** determine whether the Daily first-use journey is genuinely **built**. This is not a build, fidelity, or feature brief.

## 1. Scope — one student journey, four surfaces

Audit only the path a student uses to begin a real term:

1. **Class Center / Daily** — `academics-daily-main-page`
2. **Empty first-use state** — `academics-empty-states-prototype`
3. **Syllabus import and re-import** — `academics-syllabus-import`
4. **Class Hub** — `academics-class-hub`

Do not build, restyle, refactor, change mockup status, or start Planning,
Materials generation, Review Session, Google Drive, Atlas, Requirements, or
any proposed page. Do not change, clear, seed, or merge the student's personal
workspace. A disposable test store or test account is required for empty-state
proofs.

The scope is deliberately vertical: a student must be able to start blank,
create one course from a syllabus or manually, review what was proposed, apply
only their confirmations, reload, and arrive at the matching Class Hub without
a duplicate course or leaked demo data.

## 2. Page owners and governing records

| Surface | Registry state at audit start | Drawing and appearance record | Governing rule | App owner |
|---|---|---|---|---|
| Class Center | `built` under the old rule; treat as unproved | `mockup-lab/01-academics/academics-daily-main-page.html` + `.md` | Academics §4.1-M-a; Daily decisions | `src/components/academics/ClassCenter.tsx`, `src/pages/Academics.tsx` |
| Empty first-use | `approved` | `mockup-lab/01-academics/academics-empty-states-prototype.html` + `.md` | Empty-state decision record | `ClassCenter.tsx`, course creation/import entry routes |
| Syllabus import | `proposed` | `mockup-lab/01-academics/academics-syllabus-import.html` + `.md` | Academics §4.1-M and §4.1-M-d | `src/components/academics/SyllabusImportMode.tsx`, `src/lib/academics/syllabusReimport.ts` |
| Class Hub | `approved` | `mockup-lab/01-academics/academics-class-hub.html` + `.md` | Academics class-workspace sections | `src/components/academics/ClassHub.tsx` |

The existing `.md` files are the appearance contract. Preserve any later
app-specific annotations from Andy over an older drawing; record the annotation
in the proof rather than erasing it to make a screenshot match.

## 3. Six-condition audit protocol

Run the lab on `:4599` and the application independently. Assume **not built**
until every condition has direct proof. Audit all four surfaces before making
any registry edit.

### 1 · Visual match in light and dark

For each surface, measure the visual ladder from the mockup and the running app
in both themes: page/background → muted/collection surface → card → active or
action surface. Do not compare one color in isolation. Record CSS/computed
values, dimensions where the layout is ruled, and screenshots or exact
selectors used. The Class Center audit must specifically preserve Andy's
approved card annotations: compact square grid, course color as an accent rather
than an opaque fill, grade/readiness information when it exists, and Review
behind the card overflow instead of exposed as a permanent primary card action.

### 2 · Every visible control works

Run the handler audit from `PAGE-PROMOTION-PROMPT.md` for every `Button`,
`DropdownMenuItem`, and `ContextMenuItem` on the current surface. Include
overflow routes, empty-state actions, import actions, cancel/back, paste/manual
routes, review choices, Apply, Class Hub tabs, and relevant mobile controls.
For a deliberately disabled control, point to the code that explains the
disabled state. Paste the zero-unhandled result; a source-reading assertion is
not proof.

### 3 · Every ruled behavior survives reload

Use disposable data and exercise each behavior below, then reload the app:

| Surface | Behaviors that must persist or remain truthful |
|---|---|
| Class Center | course added or edited, selected display mode, overflow action destination, and no cross-course leakage |
| Empty state | no courses shows only the single primary import route and quiet manual route; neither invents metrics or a sample course |
| Syllabus import | unscoped creation vs scoped import, individual corrections, accepted rows only, grade categories, source retention, cancellation with no write, and re-import action selections |
| Re-import | added defaults to Accept; changed/removed default to Keep mine; unchanged items stay collapsed and counted; an inserted middle week does not change later identities; removed records never auto-delete |
| Class Hub | route stays scoped to the created course; overview/materials/topics/assignments/notes stay with that course and retain the accepted import data |

Record action → observed state before reload → observed state after reload for
each. A behavior that is intentionally temporary must disappear for the stated
reason; it cannot simply be missing.

### 4 · Empty store is honest

Create or open a known-empty disposable namespace. Confirm the first-use state
has no demo courses, GPA/readiness fiction, recommendation cards, empty charts,
or background study queue. Verify its first action reaches the same import
surface as the populated routes, and that manual entry is still available. Test
desktop and a narrow mobile viewport.

### 5 · Integrations are classified, not assumed

The core Package A flow is local parsing/review/persistence and should not
require a model provider, Google Drive, shared syllabus structure, or calendar
authorization.

- Confirm the local core flow works without any external integration.
- Treat optional shared syllabus lookup as a separate, non-blocking integration:
  verify its deployed function and migration exist, but do not promote it based
  on an untested signed-in lookup. If its exposed control is not independently
  live-proven, say so in the syllabus row and leave only that page unpromoted.
- Do not claim an uploaded document has been shared or stored remotely. The
  import's source-file/re-import boundary must remain local and truthful.

### 6 · Commit provenance and decisions

For every page that passes conditions 1–5, record the exact implementation
commit hash in its adjacent mockup `.md`, then set only that page's registry
status to `built`. A failed or incomplete proof means the registry remains or
returns to `approved`; a `built` label from the old rule is not grandfathered.

## 4. Existing automated evidence to rerun

Run the narrow suite first, then production build:

```bash
npx vitest run \
  src/components/academics/ClassCenter.test.ts \
  src/components/academics/ClassCenter.dashboard.test.tsx \
  src/components/academics/ClassCenter.syllabusJourney.test.tsx \
  src/components/academics/ClassHub.test.tsx \
  src/lib/academics/syllabusParser.test.ts \
  src/lib/academics/syllabusPdf.test.ts \
  src/lib/academics/syllabusReimport.test.ts \
  src/lib/academics/sharedSyllabusStructure.test.ts
npm run build
```

These tests are supporting evidence only. They do not replace the running-app
control, reload, empty-store, theme, and integration proofs.

## 5. Required report and router outcome

Use this table exactly after the audit:

| Page | Visual ladder | Controls | Reload / ruled behavior | Empty store | Integration | Commit / decision record | Result |
|---|---|---|---|---|---|---|---|
| Class Center | pass/fail + evidence | pass/fail + script | pass/fail + route | pass/fail | n/a/core-local | hash or missing | `built` / `approved` |
| Empty first-use | pass/fail + evidence | pass/fail + script | pass/fail + route | pass/fail | core-local | hash or missing | `built` / `approved` |
| Syllabus import / re-import | pass/fail + evidence | pass/fail + script | pass/fail + route | pass/fail | local core / optional shared lookup | hash or missing | `built` / `approved` |
| Class Hub | pass/fail + evidence | pass/fail + script | pass/fail + route | n/a (requires course) | core-local | hash or missing | `built` / `approved` |

If any row fails, name the earliest failed condition and write the next bounded
router brief only for that failure:

- behavior/data proof fails → **Stage D** backend brief;
- visual ladder/interaction fidelity fails → **Stage E** fidelity brief;
- missing decision or unsettled treatment → **Stage B** decision brief;
- missing mockup/decision record → **Stage A** mockup brief.

Do not fix the failure in this audit. Stop after the full table. “Daily is done”
is an allowed conclusion only if every Package A row says `built` with all six
proofs.
