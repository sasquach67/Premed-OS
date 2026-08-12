# Dated hour-log model proposal

**Status:** Proposal only — no implementation, seed change, migration, or localStorage write is authorized by this document.

## Decision

**The experience model does not already support dated hour logs.** It has one aggregate `hours` number on each `ExperienceEntry`. A date on that row is only the position's `startDate` (with an optional `endDate`); it is not the date of the hours. The current UI sometimes creates a new `ExperienceEntry` for what it calls a “log”, so it has *row-shaped* data, but not a parent position with dated child entries. That is still an aggregate model and cannot faithfully represent a legacy backfill, a position state, or measured weekly pace.

This rules out seeding aggregate experience totals. It also means the existing experience seed is stopped. The other collection seeds do not answer this modeling problem and can be handled in their own authorized chunk.

## What exists today

`ExperienceEntry` is the entire persisted experience model at `src/lib/types.ts:117-136`; `AppData` has only `experiences: CollectionRecord<ExperienceEntry>[]` at `src/lib/types.ts:977-985`.

| Current field | Meaning today | Why it is insufficient for a log |
|---|---|---|
| `id`, `category`, `org`, `organizationId`, `role` | One row's identity and owner links (`src/lib/types.ts:118-122`) | There is no parent-position / child-log relationship. |
| `startDate`, `endDate` | Optional ISO bounds on that one row (`src/lib/types.ts:123-124`) | They cannot say which day supplied which hours. The current code treats `startDate` as a log date in several places. |
| `hours` | A required aggregate number on the row (`src/lib/types.ts:125`) | It is stored, not calculated, contrary to `general.md:349-361`; it has no provenance, estimate flag, or dated components. |
| `description`, `mostMeaningful`, verifier/contact fields, file URL, tags | Position/reflection and AMCAS-facing context (`src/lib/types.ts:126-135`) | These should remain on the parent position rather than be copied into every shift. |
| `status: active \| completed \| planned` | Parent-like state (`src/lib/types.ts:132`) | It does not express the specified `ended` presentation or an ESTIMATED backfill block. |
| `CollectionRecord` envelope | Optional `createdAt`, `updatedAt`, `archived`, `deletedAt` (`src/lib/types.ts:15-24`) | It records app record changes, not activity dates. |

The experience page confirms the conflation: creating a position creates `hours: 0` (`src/pages/ExperiencePillar.tsx:105-123`), while “Add log” creates another full `ExperienceEntry` with `startDate` and aggregate `hours` (`src/pages/ExperiencePillar.tsx:325-344`). `SimpleLog` and `LogList` then render those sibling experience rows as shift/session logs (`src/pages/ExperiencePillar.tsx:364-386`).

## Proposed shape (for a later, separately authorized implementation)

Use **one parent ExperienceEntry per position** and a separate ordered collection of child hour entries. This keeps generic collection CRUD, trash, and undo semantics available without hiding a mutable array inside a parent.

```ts
// Existing parent, with the stored `hours` field removed after migration.
interface ExperienceEntry {
  id: ID
  category: ExperienceCategory
  org: string
  organizationId?: ID
  role: string
  startDate?: string       // known position boundary only; not a log surrogate
  endDate?: string
  status: 'active' | 'completed' | 'planned'
  description: string
  mostMeaningful?: string
  supervisor?: string
  supervisorId?: ID
  contact?: string
  fileUrl?: string
  tags: string[]
  order: number
}

type ExperienceHourEntryBase = {
  id: ID
  experienceId: ID
  hours: number
  note?: string
  order: number
  createdAt: number
  updatedAt: number
  archived: boolean
  deletedAt?: number
  source?: EntitySource
}

type ExperienceHourEntry = ExperienceHourEntryBase & (
  | { kind: 'logged'; date: string }
  | {
    kind: 'estimated'
    /** Absent for an undated legacy aggregate. */
    date?: string
    /** Known source bounds may be retained; neither is synthesized. */
    periodStart?: string
    periodEnd?: string
  }
)

interface AppData {
  // ...
  experiences: CollectionRecord<ExperienceEntry>[]
  experienceHourEntries: ExperienceHourEntry[]
}
```

The final implementation must add `experienceHourEntries` to `AppData`, `CollectionKey`, the persisted `DATA_KEYS` list, generic collection typing, and backup/restore/trash handling. Those are explicitly not being changed here.

### What stays on the parent

The parent is the enduring position: category, organization/person links, role, position start/end bounds when known, active/ended/planned state, verifier, description/reflection, files, tags, ordering, and record envelope. It never stores a total. A parent is shown as **Active** or **Ended** (map current `completed` to the product word “ended” at render time); when it contains an estimated child block it also carries a clear **Estimated backfill** disclosure. An imported position that has only an estimated child can present as **ESTIMATED** in the expanded Overview row without pretending that its activity was measured.

The child is the unit of time. `logged` means a student-supplied dated amount; `estimated` means a supplied aggregate/backfill whose day is unknown. A known estimate may preserve a source-supplied period, but it is still one block, not silently divided into daily rows.

## Derived values after the model exists

`general.md:349-361` requires all of these to be calculated rather than manually stored. The proposed selectors must return `null` with a reason where there is not enough measured data; they must not return a plausible-looking zero or a point estimate.

| Derived value | Calculation | Treatment of ESTIMATED |
|---|---|---|
| Total hours | Sum non-deleted children for the selected parent/category. | Included in the displayed captured total, with a separately available `estimatedHours` amount. |
| Logged vs estimated split | Sum by `kind`. | Always renderable as an explicit split, never silently merged into “logged”. |
| Latest activity | Maximum `date` among `logged` children. | An undated estimate cannot become “latest activity.” |
| Duration | Earliest to latest measured log date, or known parent boundary only when the UI labels it as a position span. | No duration from an undated estimate. |
| Active semesters | Semesters containing at least one measured dated child; a known parent span can be presented separately as position tenure. | Never fabricated from an undated legacy block. |
| Weekly average / pace | Only dated, non-deleted `logged` children in an observed interval. Sparse data produces an interval or a dormant “need more dated logs” state under U-4/U-5. | **Excluded completely.** An estimate never feeds weekly pace, projections, trends, or streaks. |
| Goal progress | Total captured hours against a user-set hours goal. | If estimates are included, the UI discloses the split; pace remains based on logged hours only. |

This permits the §6.5 row to reveal *where* a total came from while preserving its rule that each position has its own state and that an estimated backfill is visually distinct and never feeds weekly pace (`specifications/03-overview.md:203-210`).

## Every current `hours` reader in `src/`

The list below is the migration inventory. “Direct” means it reads `ExperienceEntry.hours`; “derived” means it consumes a selector whose current answer depends on that field. Each is a required migration site, not permission to change it in this chunk.

| File:line | Current use | Required later change |
|---|---|---|
| `src/lib/types.ts:117-136, 977-985, 1008-1013` | Declares the stored aggregate model, root collection, and generic collection keys. | Introduce child collection/type and remove parent aggregate after migration. |
| `src/lib/selectors.ts:50-55` | `hourTotals` sums every parent `hours`. | Replace with a selector over child entries, returning total/logged/estimated as needed. |
| `src/lib/overview.ts:119-135` | Calculates weekly hours by spreading every aggregate from its parent start date to today; labels the latest parent as the latest log. | Use dated `logged` children only; no pace/latest result for undated estimates. |
| `src/lib/intelligence/derived.ts:96-132` | `pillarSignals` derives totals, span, hours/week, activity, and active counts from parent aggregates and boundaries. | Separate parent state from child time; base rate/activity on dated logged children and expose insufficiency. |
| `src/lib/intelligence/dataHealth.ts:77-86, 111-158` | Completeness and warnings treat parent `hours` as logged and require a parent start date for it. | Evaluate parent identity separately from child log quality; flag undated estimates as such, not as bad measured logs. |
| `src/lib/intelligence/recommendations.ts:72-88, 131-149` | Verifier rule quotes active aggregate hours; stale rule consumes aggregate-based pillar signals. | Use calculated totals and the last dated logged child; keep verifier need tied to the parent position. |
| `src/lib/publicLayer.ts:143-160` | Public/merge count labels the aggregate sum “Logged hours.” | Sum only `logged` children for that label, or disclose the estimate split. |
| `src/components/overview/OverviewStatus.tsx:40-96, 310-348` | Where I Stand and Hours tile consume `hourTotals`. | Use calculated totals and show an honest estimate disclosure; no bar/pacing from absent measured data. |
| `src/components/overview/OverviewSupport.tsx:36, 64, 79-94` | Quick-link's “Last” label and target current value consume aggregate selectors. | Use last dated log and computed totals. |
| `src/pages/Profile.tsx:41-52, 160-171` | Shows aggregate total and each experience row's hours. | Show parent positions with calculated totals, and do not label an estimate as a dated session. |
| `src/pages/ExperiencePillar.tsx:88-128` | Selects experience siblings and creates a parent with `hours: 0`. | Select parents plus their child logs; create a parent without a total. |
| `src/pages/ExperiencePillar.tsx:283-344, 364-386` | Specialty/ledger totals, made-up Avg/wk, and “Add log” all use sibling parent rows. | Group child entries under the selected parent; remove the aggregate/sibling-log model. |
| `src/pages/ExperiencePillar.tsx:388-430, 610-629, 748-828` | Insight totals, timeline, quick add, expandable editor, and direct hours input all read/write parent `hours`. | Read calculated summaries; give a log its own date/hours editor and keep position editing separate. |
| `src/pages/ExperiencePillar.tsx:1102-1207` | Invents seven weekly buckets by row index, aggregates sites, builds entity totals, and projects hours from parent dates. | Bucket actual dated logs; group by `experienceId`; exclude estimates from pace/projection. |
| `src/components/experiences/ApprovedPillarLayouts.tsx:58-75, 181-191, 208, 269-307` | Computes row totals/rate from aggregate rows and renders fixed sample “hours log” rows; its add handlers create more parents. | Accept calculated parent summaries and real child logs; remove static sample rows from real record surfaces and add child log entries. |
| `src/components/layout/QuickAddDialog.tsx:90-102, 147-167` | “Hours” quick add creates an aggregate `ExperienceEntry`; create-experience defaults it to zero. | Route to the ≤5-second child-log flow or create a parent first, then a child log. |
| `src/components/common/CreateExperienceDialog.tsx:14-30, 80-92` | Creates the position identity that the page currently completes with an aggregate total. | Remains the parent-position flow; it must not require hours. The post-create route should offer a distinct log action. |
| `src/data/demoSeed.ts:266-267` | Demo experiences are aggregate parents. | Seed a parent and student-supplied child logs only when demo-mode policy authorizes it. |
| `src/lib/selectors.test.ts:86-98` | Tests aggregate totals. | Replace fixtures/assertions with parent + child log coverage. |
| `src/lib/intelligence/intelligence.test.ts:31-115` | Fixtures and assertions give hours to a parent. | Test estimate exclusion, insufficient observed interval, and calculated totals. |
| `src/components/layout/attention.test.ts:100-113` | Experience fixture uses parent `hours`. | Update to the child model and preserve attention behavior. |

`src/pages/Mcat.tsx` also has a field named `hours` (`:76-117, :981`), but it is an MCAT study-plan day, not an `ExperienceEntry`; it is deliberately **not** a migration site. `OrgReflection.hours` in `src/lib/types.ts` is likewise a different field. No other `ExperienceEntry.hours` readers were found in `src/` by the source audit.

## Versioned, lossless migration plan

The store currently declares `CURRENT_STORE_VERSION = 8` (`src/store/store.ts:45-54`) while the hydration chain already includes `migrateShellV9` (`src/store/store.ts:488-503`). The later implementation must first reconcile that version naming/numbering, then reserve the **next actual store version** for this migration. It must not casually label a new migration “v10” without resolving that mismatch.

The hour-log migration itself must be pure, shape-detected as well as version-gated, and use fresh objects. It must run in the existing hydration chain before any selectors read the new data.

1. Clone/normalize the persisted root without mutating the frozen input. Add an empty `experienceHourEntries` collection when absent.
2. Preserve every parent ExperienceEntry field except its derived aggregate storage role. Parent start/end dates remain position metadata; they are not copied into invented activity days.
3. For each non-deleted or deleted legacy parent whose finite `hours` is greater than zero, create exactly one child entry with `experienceId` equal to the parent id, `kind: 'estimated'`, the exact numeric `hours`, `date: undefined`, and source metadata such as `{ type: 'import', provider: 'legacy-experience-aggregate' }`. A known existing parent start/end may be copied only to `periodStart` and `periodEnd`, explicitly as position bounds. It must never create daily, weekly, or monthly child rows.
4. Preserve zero-hour parent positions with no child entries. Preserve deleted parents and their child records so restoring a parent restores the attributable history; generic trash behavior must be designed and tested before deletion is enabled for children.
5. Remove/ignore parent `hours` only after all readers are switched. The child is the lossless representation of the original exact number; no rounding, spreading, current-date stamping, or invented descriptions are allowed.
6. Make the conversion idempotent. A second hydration must find the deterministic legacy child for each parent and create no duplicate. It must survive import, reset, backup, and restore paths.
7. Add migration tests for frozen input, exact totals, zero/negative/invalid values, deleted parents, existing partially migrated data, idempotency, and the central safety assertion: an undated `estimated` entry never changes a weekly pace, streak, projection, or “last logged” date.

This is lossless because an existing number becomes one faithful, explicitly estimated block. It does **not** claim to recover facts that were never stored.

## What remains broken if this is deferred

Deferral is acceptable only if the product stops treating aggregate data as a measured log history. It blocks the following ruled work:

- **§6.5 position states:** the Overview expansion requires each position to show active, ended, or estimated, with estimated backfill visually distinct and excluded from pace (`specifications/03-overview.md:203-210`). An aggregate parent cannot prove which hours were measured or which were estimated.
- **U-6 attribution:** `general.md:36` says hours live in exactly one pillar and cross-links never double-count. A parent can link an organization, but it cannot attribute a particular dated block to that position while keeping an auditable single source of time.
- **U-4 intervals:** `general.md:34` forbids probabilistic point estimates. An aggregate total plus a position start date cannot establish observed cadence; it can only manufacture one.

Several surfaces currently render inferred quantities with the visual authority of measured data:

- `src/lib/overview.ts:119-126` divides an aggregate total by wall-clock weeks since the earliest parent start date and calls it observed weekly hours.
- `src/lib/intelligence/derived.ts:101-115` does the same for pillar `hoursPerWeek`, extending an active position to today.
- `src/components/experiences/ApprovedPillarLayouts.tsx:181-191` derives a weekly rate from dated aggregate rows.
- `src/pages/ExperiencePillar.tsx:313-320` renders `Avg / wk` as `site.hours / (session-count * 4)`, an arbitrary denominator.
- `src/pages/ExperiencePillar.tsx:1102-1108` assigns aggregate rows to weekly chart buckets by array index rather than their dates.
- `src/pages/ExperiencePillar.tsx:1197-1206` projects 48 weeks from aggregates and parent dates.

Until the model is built, those are not valid measured pace signals. The safe interim behavior is dormant-with-a-reason under U-5, not a zero and not an invented rate.

## ≤5-second logging requirement

`CLAUDE.md:42-44` makes the interaction constraint explicit: **every logging flow completes in five seconds or less.** The later UI must make one measured entry no slower than a spreadsheet row:

1. The student is already in a position context (or picks an existing position with a type-ahead default).
2. Date defaults to today and is keyboard-editable.
3. They enter decimal hours, optionally add a short note, and press Enter to save. No verifier, category, or long reflection is required to log time.
4. “Add estimated backfill” is a visibly separate, lower-frequency action: amount plus optional known period, explicitly marked ESTIMATED. It cannot silently use today's date or enter the pace calculation.

This is the needed next chunk: approve the model and migration boundary first; then implement the data model, migration, selectors, flows, and tests together.
