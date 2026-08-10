# Data Model

**Status:** Written (July 2026) — grounded in the current repo store; canonical People/Organization normalization **approved** (phased path, §10).
**Repo:** `sasquach67/Premed-HQ` — `src/lib/types.ts` (the authoritative field-level source), `src/store/store.ts` (persistence + migrations), `src/lib/selectors.ts` (derived properties), `src/data/seed.ts` (example records).
**Depends on:** `general.md` → Global entity system; `architecture/06-service-foundation.md` (ownership, cloud, migration); `specifications/01-shared-interface-patterns.md` (how records are edited/opened).

---

## 1. Purpose and how to read this

This file is the contract between the client store, cloud persistence, and Atlas. It documents **what every record is, how records relate, what is computed vs. stored, how data survives updates, and where the model is going.**

`src/lib/types.ts` is the **authoritative field-level source** — this spec does not re-type every field (that would drift). Instead it adds what the code does *not* encode: the common envelope target, the relationship graph, derived-property rules, completeness/validation states, the migration strategy, and the canonical-entity evolution. Where an entity's exact fields matter, this doc gives a field table; for large, well-typed sub-trees (the academics Class Center) it gives structure + links and points to `types.ts`.

**Two states are described throughout:** *Current* (what the persisted store holds today) and *Target* (what `general.md` and the tab specs require). Do not silently "upgrade" current shapes to target ones — evolve them through §9's migration rules.

---

## 2. Persistence architecture (current — the real mechanics)

- **One persisted root object, `AppData`** (`types.ts`), saved to `localStorage` under the key **`premed_hq_v1`** via zustand + immer + `persist`. Every edit autosaves instantly to localStorage (`architecture/01`, `specifications/01` §4).
- **Local-first is primary; signed-out mode must stay fully functional** (repo `CLAUDE.md`). Cloud is a mirror, never a prerequisite.
- **`partialize` + `DATA_KEYS`**: only the data slices are serialized; action functions are never persisted. `snapshotData()` returns a non-reactive copy of just `DATA_KEYS` for export/backup.
- **`merge` (seed-defaults under persisted data)**: on load, seed defaults are shallow-merged *under* persisted data so newly added fields appear after an app update without wiping user data. Nested singletons (`academics`, `settings.backup`, `settings.calendar`, `mcat`, `meta`, `notes`, `profile`, `goals`) are merged field-by-field.
- **Optional Google Drive mirror** (`settings.backup`) and **Supabase** (`src/lib/supabase.ts`, no-op until configured) are the cloud paths. Neither owns the data; localStorage does.
- **Generic collection CRUD**: `addItem` / `patchItem` / `removeItem` / `reorderItems` / `setCollection` operate over the array collections enumerated by `CollectionKey`. All shared editing (inline tables, Quick Add) writes through these — no parallel write paths (`specifications/00` §7.4).

---

## 3. The common envelope

**Target (from `general.md` → Global entity system):** every entity carries a stable **`id`**, **`ownerId`**, **`createdAt`**, **`updatedAt`**, **`archived`** state, optional **`deletedAt`**, and **`source`** metadata for imported/synced records.

**Current reality:**

| Envelope field | Current status |
|---|---|
| `id` | Present on every collection row (`ID = string`). |
| `order` | Present on most rows (drives drag-reorder); **not** in the target envelope but real today — keep. |
| `createdAt` / `updatedAt` | Present only on Class Center entities (epoch `number`); absent elsewhere. |
| `archived` | Only on `TaskItem`. Some entities use a domain `status` enum instead (e.g. `SchoolEntry.status`, `Org.status`). |
| `ownerId` | **Absent** — the app is single-user/local today. Required when auth ships (`06`): scope every record to the authenticated user, no cross-user reads/writes. |
| `deletedAt` | **Absent** — deletes are hard `splice` today. Target: soft-delete + trash/recovery (`specifications/01` §7). |
| `source` | **Absent** except reference data (`data/*.json` carry `retrievedAt`/`source`) and `RequirementItem` source metadata. Required for imported/synced records. |

**Rule:** new entities SHOULD adopt the full target envelope from creation. Existing entities gain envelope fields through additive migration (§9), never a rewrite.

**`source` shape (defined July 2026):** `interface EntitySource { type: 'manual' | 'import' | 'sync'; provider?: string; externalId?: string }`, used as `source?: EntitySource`. Minimal provenance — origin, optional provider (e.g. `google-drive`, `csv`) and external id for reconciliation — without pre-designing the import system. Category-A reference data (`data/*.json`) keeps its own richer `source`/`retrievedAt` metadata (§8); do not conflate the two.

---

## 4. Entity catalog

Entities are grouped by domain (matching sidebar ownership, shell §2.2). Singletons are marked; everything else is an array collection.

### 4.1 Profile & Goals (singletons)

**`Profile`** — identity + program context that personalizes defaults, deadlines, and the roadmap (`specifications/03` §6.7).

| Field | Type | Notes |
|---|---|---|
| name, email? | string | email optional until auth |
| school, major, track | string | e.g. "UNC", "Neuroscience", "Pre-Med" |
| classYear, startTerm, matriculationTarget, applicationCycle | string | drive roadmap pacing + admissions timing |
| resumeDocUrl?, avatarDataUrl? | string | embedded CV doc; local avatar data URL |

**`Goals`** (singleton) — numeric targets consumed by pace/percent selectors: `clinical`, `volunteering`, `shadowing`, `research`, `activities`, `mcatTarget`, `gpaTarget`.

### 4.2 Academics

**`Course`** — drives the AMCAS GPA engine and the degree planner.

| Field | Type | Notes |
|---|---|---|
| term, code, title | string | term is a **string** today (e.g. "Fall 2026"), not an `AcademicTerm` entity (§10) |
| credits | number | |
| grade | `LetterGrade` | AMCAS 4.0 scale; `''`/P/NP/IP carry no quality points |
| bcpm | boolean | **true = counts in science (BCPM) GPA** |
| status | `CourseStatus` | planned / in-progress / completed |
| inResidence | boolean | only in-residence graded courses count toward GPA |
| satisfies | string[] | requirement tags this course fulfills |
| prereqOf? | string | med prerequisite covered |
| notes?, order | | |

**`RequirementItem`** — degree/requirement checklist (UNC Requirements). Carries **Category-A source metadata** (`sourceType`, `sourceLabel`, `sourceUrl`, `lastVerified`, `verificationStatus`) — the pattern all trustworthy reference data should follow (`implementation/knowledge-sources.md`).

**Class Center** (`academics.classCenter`, nested singleton) — the "move everything from Canvas into HQ" sub-model. Nine linked collections; exact fields in `types.ts`:

| Entity | Purpose | Key links |
|---|---|---|
| `ClassCenterClass` | a class shell (code, instructor, meeting, syllabus/Canvas/Drive URLs) | `currentTopicId` |
| `ClassTopic` | a syllabus topic with FSRS-style review state (`status`, `confidence`, `nextReviewAt`) | `classId`, `sourceNoteIds`, `linked*Ids` |
| `ClassNote` | lecture/reading/study-guide note, local or Google-Doc-backed | `classId`, `topicIds`, `linkedFileIds` |
| `ClassAssignment` | homework/quiz/exam with study plan + reflection | `classId`, `linkedTopicIds`, `coveredTopicIds` |
| `ClassFileResource` | uploaded/linked class file | `classId`, `linkedTopicIds` |
| `ClassContact` | professor/TA/tutor/peer | `classId`, `followUpTaskId` |
| `ClassWeakArea` | a tracked weakness (source/reason/severity) | `classId`, `topicId`, `related*Id` |
| `PracticeExam` / `PracticeQuestion` | self/AI-generated practice (AI-generation allowed here per `tabs/02-mcat` §2a rule) | `classId`, `examId`, `topicIds` |

`AcademicCourseOption` / `AcademicTypeOption` are tag registries (course + assignment-type chips) that inline editing references by id.

### 4.3 MCAT

**`McatState`** (singleton) — plan config (`targetDate`, `goalScore`, `baselineScore`, `weeklyStudyHours`, `currentPhase`, `planIntensity`, `focusSection`) plus three collections:

| Entity | Purpose | Key fields |
|---|---|---|
| `McatAttempt` | a score record | `total` (472–528), `cp`/`cars`/`bb`/`ps`, `kind` (official/aamc-fl/practice), `source` |
| `McatErrorLog` | mistake-to-mastery entry | `section`, `topic`, `whyMissed`, `fix`, `resolved` |
| `McatScheduleItem` | a study-plan block | `phase`, `week`, `focus`, `resource`, `done` |

### 4.4 Experiences

**`ExperienceEntry`** — the generic hours-pillar row (clinical / volunteering / shadowing / research / leadership via the `category` enum). This is the **shared experience record** the pillar builder configures (`specifications/05`).

| Field | Type | Notes |
|---|---|---|
| category | `ExperienceCategory` | clinical / volunteering / shadowing / research / leadership |
| org, role | string | **`org` is free text today** — the canonical-Organization gap (§10) |
| startDate?, endDate? | ISO string | |
| hours | number | summed by `hourTotals` into per-category totals |
| description | string | |
| mostMeaningful? | string | AMCAS "most meaningful" reflection → Story Bank source |
| supervisor?, contact? | string | **free text today** — the canonical-Person gap (§10); target: verifier is a referenced Person |
| status | active / completed / planned | |
| fileUrl?, tags, order | | Drive link; tags |

> The tab specs add **domain-specific structure** on top of this shared row — Clinical adds Certifications, Skills (observed/performed), shift-level call counts; Volunteering adds direct/indirect + population presets + cause; Shadowing adds physician + specialty breadth. These are pillar-config extensions (`specifications/05` §4), not new top-level collections. Where they need persistence beyond `ExperienceEntry`'s fields, they extend it per the domain tab spec — document each extension in the owning tab file.

**`Org`** — an extracurricular organization (club/sport/org), **not** an hour log. Owns nested `reflections[]` (`OrgReflection`), `positionHistory` (`OrgPosition`), `accomplishments` (`OrgAccomplishment`), plus impact fields (`memberCount`, `eventsWorked`, `totalHours`) and verifier contact fields. `Org.reflection` (singular) is **@deprecated** — migrated into `reflections[]` (§9). This is the Extracurriculars pillar's record (impact/leadership, not hours — `04` framework).

### 4.5 Application

| Entity | Purpose | Key fields |
|---|---|---|
| `SchoolEntry` | a target school | `type` (MD/DO/Other), `category` (reach/target/safety), `status` (researching→accepted…), `medianGpa`/`medianMcat`, `secondaryStatus` |
| `LetterEntry` | a recommender + request | `recommender`, `role`, `relationship`, `type`, `status` (identified→submitted), `dateAsked`, `dueDate` |
| `StoryEntry` | Story Bank reflection | `prompt`, `title`, `commentary`, `tags`, `relatedExperienceId`, `docUrl` |
| `SecondaryEntry` | a secondary essay | `school`, `prompt`, `wordLimit`, `status`, `docUrl` |
| `InterviewQA` | interview prep Q&A | `question`, `answer`, `category` |

Note: `SchoolEntry.status` implicitly encodes the **Application lifecycle** — there is no separate `Application` entity yet (§10).

### 4.6 Tasks & Timeline

**`TaskItem`** — the one task/deadline record feeding calendar, kanban, and home alerts. `courseId`/`course` (id + legacy string), `typeId`/`type`, `deadline`, `progress` (Not started/Working on/Finished), `kanban` (todo/doing/done), `archived`, `milestone` (pinned application-cycle milestone shown on the timeline). **Owned by Overview** (shell §2.2, revised Aug 2026 — was Timeline & Tasks); referenced everywhere.

> **Known modeling defect (Aug 2026) — and it is already leaking.** `TaskItem` carries **three things that no longer belong together**: a task (Overview's), a `deadline` (each record's own owner), and a `milestone` flag (Timeline's). **The design always treated these as distinct; the code never did.** Roadmap milestones are stored as rows inside `data.tasks`, so **every consumer of `tasks` must remember to exclude them, and forgetting is silent.**
>
> **Two consumers already forgot:**
>
> - **`attention.ts:93`** — `data.tasks.map(deadlineItem)` has **no `!milestone` filter.** A dated roadmap milestone therefore appears in the Attention bell as a deadline, labelled `Open task`. **Live defect.**
> - **`CommandSearch.tsx:60`** — `for (const row of store.tasks)` has **no filter either.** Milestones show up in command search as task records.
>
> The consumers that *do* remember — `overview.ts:65` and `Timeline.tsx:77`, both carrying a defensive `!task.milestone` — are the tell. **A filter that every reader must repeat is a modeling error, not a convention.**
>
> **The Aug 2026 node-steps ruling makes the split unavoidable.** A roadmap node now holds a **typed checklist** — `step` items (actionable, flowing to Overview → `Soon`) and `note` items (guidance, never leaving the node) — on top of its authored copy. **That is a node entity with child records.** It cannot be a boolean on a to-do.
>
> **The step is its own record type, owned by Timeline.** Overview's task list becomes a **read-time union** of its own `Task` records plus the current node's steps. **The union must never be materialized into `tasks`** — that would recreate exactly the shared-drawer problem this split exists to end. See `tabs/11-timeline-tasks.md`.
>
> - **A roadmap node is its own entity, not a flagged task.** A node has authored content — steps, heads-up copy, phase framing — and a boolean on a to-do cannot carry it (`tabs/11-timeline-tasks.md`).
> - **A deadline is a field on the record it belongs to**, not a `TaskItem`. Assignments already have `courseId` required (`briefs/D3-assignments.md`); `ResearchOutput` already has `deadline` (`06-research.md` §4). **The owners mostly exist already** — what exists wrongly is the parallel copy in `TaskItem`.
> - **Any split needs a versioned, lossless migration** per `CLAUDE.md`. Existing records flagged `milestone` must map to nodes, and existing dated tasks must map to their owner or stay plain tasks. **Nothing may be dropped.**
>
> Tracked in `implementation/deferred.md`.

### 4.7 Cross-cutting & infrastructure

- **`ResourceLink`** — per-pillar categorized link (`pillar`, `category`, `label`, `url`, `official`).
- **`NotePage`** — mini notes-DB page (side-peek); optional `pillar`/`orgId` scope.
- **`TipEntry`** — mascot tip pool (deterministic-by-date); `tag` = official/community/andy (trust separation, `knowledge-sources.md`).
- **`FocusTarget`, `QuarterlyGoal`, `AdvisingQuestion`, `InterviewQA`** — small planning/reflection lists.
- **`Settings`** (singleton) — theme, `visualTheme`, `backup` (`BackupMeta`), `calendar` (`CalendarSettings` + cached `NormalizedScheduleEvent[]`), shell UI flags (`sidebarCollapsed`, `dismissedAlertKey`, `overviewTaskMode`, …).
- **`Meta`** (singleton) — `recentRoutes` (palette recency), `activity` (`ActivityEvent[]`, capped at 30), `lastOpenedAt`, `seedVersion`.
- **`notes`** — `Record<string,string>` free-text scratchpads keyed by id.

---

## 5. Relationships and backlinks

**Current linking is mixed:** some references are by **id** (Class Center's `classId`/`topicId`/`linkedFileIds`; `Task.courseId`; `Story.relatedExperienceId`; `NotePage.orgId`), others are by **string match** (`Course.code` ↔ `Task.course`; `ExperienceEntry.org` as a bare name; `supervisor`/`contact` as text).

**Target (`general.md`):** relationships are first-class or strongly-typed references, and **every inspector shows backlinks** ("where is this used"). The evolution is to replace string-match links with id references as the canonical People/Organization entities land (§10).

**Reference map (who points at whom):**

- `Task.courseId → Course`; `Task` referenced by Class Center (`ClassContact.followUpTaskId`), milestones (Timeline).
- `ClassTopic ↔ ClassNote / ClassAssignment / ClassFileResource / ClassWeakArea` (all by id within `classCenter`).
- `StoryEntry.relatedExperienceId → ExperienceEntry`; experiences → Story Bank (as `mostMeaningful`/reflection source).
- `ExperienceEntry` / `Org` → **Profile/CV** (read-only aggregation), **Letters** (supervisors as recommenders), **Overview** (hours → domain rows).
- `SecondaryEntry.school`, `SchoolEntry` ↔ Essays/secondaries.
- Target shared entities: **Person** (supervisors, PIs, physicians, professors, recommenders) and **Organization** (sites, labs, clubs, schools-as-orgs) referenced across all of the above instead of re-entered.

---

## 6. Derived properties (computed, never stored)

Per `general.md`, these are calculated on read (see `selectors.ts`), never persisted:

- **GPA engine** (`gpaStats`): cumulative, **science/BCPM**, and all-other GPA; only graded, in-residence courses; every attempt included (AMCAS: no grade replacement). `qualityPoints`, credit subtotals.
- **`hourTotals`**: sum of `ExperienceEntry.hours` per category → Overview domain rows and pillar headlines.
- **`bestMcat`**: max official total (falls back to any scored attempt).
- **`upcomingAlerts`**: tasks due within horizon (exams ~8 days, others ~10), severity urgent/soon/info, kind exam/task/meeting/milestone → AlertsStrip + Attention bell.
- **`percent(value, goal)`**: pace toward a `Goals` target.
- **Per-pillar derived** (from tab specs, computed not stored): longevity/cadence + distinct-population count (Volunteering), streak/hrs-per-week + pace projection (Clinical), distinct-specialty breadth (Shadowing), output-pipeline stage (Research).

**Rule:** if a value can be computed from stored records, compute it. Never persist totals, counts, or GPA — they drift.

---

## 7. Validation and completeness

**Completeness states (`general.md`):** prefer labeled states — **Incomplete → Usable → Well documented → Ready for export** — and always show exactly what's missing. Quick Add creates a *usable* record with only required fields; the owning page fills the rest (`specifications/00` §7.4).

**Data-health warnings (`general.md`, surfaced via the Attention bell, shell §7.5):** missing required field, missing verification contact, missing/!invalid date range, duplicate organization, broken file link, unlinked imported record, stale active record, deadline without owner, completed record with unresolved tasks. **Severity: blocking / important / suggested.** Every warning states *why* it appeared.

---

## 8. Import & source metadata

Imported/synced records carry `source` (target envelope, §3). Import enters **review when uncertain** (`general.md`): show created / matched / conflicts / skipped / errors. Category-A reference data (`data/*.json`) carries `retrievedAt`/`source` and a scheduled change-detection loop (`implementation/data-refresh.md`, `architecture/06`) — never auto-applied; a human approves.

---

## 9. Migration strategy

The store already implements a real, lossless migration pattern — future changes MUST follow it (repo `CLAUDE.md`: "any localStorage schema change needs a versioned, lossless migration"):

1. **Additive fields → the `merge` path.** New optional fields appear automatically because seed defaults are shallow-merged under persisted data. No migration function needed for pure additions.
2. **Structural changes → an explicit `migrate*` function** run in `merge` and `replaceAll` (see `migrateAcademicTags`, `migrateOrgReflections`, `migrateRequirementMetadata`). Each is idempotent (`??=` guards) and lossless.
3. **Deprecation pattern:** keep the old field marked `@deprecated`, migrate its data into the new shape, and stop writing it (e.g. `Org.reflection` → `Org.reflections[]`).
4. **Version bump:** `STORAGE_KEY = premed_hq_v1` + `SEED_VERSION`. A breaking reshape increments the persisted `version` and adds a keyed migration step.
5. **Never** destructively drop user data in a migration; if a record can't be migrated, preserve it and raise a data-health item rather than deleting.

### 9a. Chain depth and the stale client (added Aug 2026)

The store is already at **V8** inside roughly one year. Over a four-year student
lifetime the chain plausibly reaches 25+ steps, and because localStorage is
primary and signed-out mode must keep working, that chain runs **client-side, on
a device that may be many versions behind, with no server fallback**.

- **Test the whole chain, not each step.** Seed the oldest supported shape, run
  every migration in sequence, assert nothing is lost. Per-step tests do not
  catch a step that assumes a shape an earlier step produced.
- **Declare an oldest supported version** and what happens below it.

See `implementation/long-horizon-durability.md` §D5.

### 9b. Persistence has no quota handling — LIVE DEFECT (added Aug 2026)

`AppData` is one root object rewritten in full on every edit, and
`localStorage.setItem` is called with **no `try`/`catch` anywhere in
`src/store/`**. A quota-exceeded write therefore throws and is lost **at the
moment the student saves**, while the app appears to be working.

This is not a distant risk: `03-clinical.md` §7d creates a threaded AI
conversation **per shift**, and the full thread is stored rather than a summary.

**Minimum fix, shippable alone:** wrap persistence so a failed write raises a
**blocking** data-health item in the Attention bell (shell §7.5).

**The larger decision** — which entities become cloud-primary rather than
local-primary, and the storage budget that implies — is
`implementation/long-horizon-durability.md` §D1. It is a real exception to
localStorage-primary and **must be recorded in this file when it is made**,
not left in the durability doc.

---

## 10. Canonical-entity evolution (the key open decision)

`general.md`'s target entity system names **User, Person, Organization, Place, Experience, Role, Event, Project, Course, AcademicTerm, Exam, School, Application, Letter, Essay, Story, Note, File, Task, Goal, Tag, Skill, Resource.** The current model implements many of these **implicitly or denormalized:**

| Target entity | Current representation | Gap |
|---|---|---|
| User | none (single-user local) | add `ownerId` when auth ships (`06`) |
| **Person** | free-text `supervisor`/`contact`, `ClassContact`, `Org.verifier*`, `LetterEntry.recommender` | **not canonical** — same person re-entered per pillar |
| **Organization** | free-text `ExperienceEntry.org`, `Org` (ECs only), `ClassCenterClass` | **not canonical / not unified** |
| AcademicTerm | `Course.term` string | implicit |
| Exam | `McatAttempt` (+ `PracticeExam`) | partial |
| Application | `SchoolEntry.status` | implicit; no standalone entity |
| Skill | `ClassWeakArea`; Clinical skills (spec) | partial |
| Place / Event / Project / Role / Tag | ad hoc fields | mostly implicit |

**Approved path (phased, not big-bang) — RESOLVED (July 2026):**

- **Phase 1 (non-breaking, do first):** introduce `Person` and `Organization` collections with the full envelope; add **optional** `personId` / `orgId` reference fields alongside the existing string fields; add a "link to existing / create" affordance and dedup detection (`general.md`). Strings remain the fallback; nothing breaks. New records are captured as linked entities going forward.
- **Phase 2 (backfill, later):** a `migrate*` function sweeps existing free-text strings (`supervisor`, `contact`, `ExperienceEntry.org`, `Org.verifier*`, `LetterEntry.recommender`, `ClassContact`…), promotes the distinct ones to `Person`/`Organization` records, dedups, and links them — so existing data gets the same connected benefit retroactively. Once coverage is high, the string fields become `@deprecated` display-only (kept, never dropped).
- **Rationale:** delivers "capture once, reuse everywhere" and the tab specs' "a supervisor is one Person across pillars" without a risky rewrite, and keeps local-first/signed-out behavior intact.

`Person` and `Organization` are **records inside a single user's own data** (the real supervisors, PIs, physicians, professors, sites, labs, clubs they reference) — *not* user accounts. Multi-user/account scoping is the separate `ownerId`/User layer (§11), which arrives with auth.

---

## 11. Cloud, ownership, and export

- **Ownership (target, `06`):** every record scoped to the authenticated user via `ownerId`; no cross-user reads/writes. Until auth ships, the local store is the single user's data.
- **Cloud (target):** Supabase mirror with local-to-cloud migration, offline behavior, sync-conflict handling (Conflict/Error surface in the Attention bell system feed, shell §7.5). localStorage stays primary.
- **Export/backup:** `snapshotData()` → JSON (Drive mirror today); target adds a full personal-data export + account-deletion workflow (`06`, `general.md` privacy).

---

## 12. Atlas entities (cross-app contract)

Atlas (`sasquach67/Atlas`, `src/lib/schema`) owns a separate knowledge model: **Claim, Transcript, Source, Guide, Pillar** (20 pre-med pillars). These stay in Atlas's store; the HQ↔Atlas contract is that **HQ records and Atlas claims are distinct, visibly-distinguishable entity types** (trust separation, `architecture/02`, `specifications/02-atlas` §3). Overview Quick Capture writes local capture records that Atlas later consumes. Full Atlas schema + the HQ-record ↔ Atlas-claim link table is **to be detailed from the Atlas repo** when integration is designed (`specifications/02-atlas` "Still to write"); do not build the link now.

---

## 13. Do Not

- Do not persist derived values (GPA, totals, counts) — compute them (§6).
- Do not add a parallel write path; all mutations go through the store actions (§2).
- Do not perform a destructive or unversioned schema change (§9); no data loss, ever.
- Do not fuse HQ records and Atlas claims into one undifferentiated type (§12).
- Do not normalize People/Organizations big-bang; follow the approved phased path (§10) — Phase 1 optional links + dedup first, Phase 2 backfill later.

---

## 14. Decisions

1. **Canonical People/Organization normalization (§10) — RESOLVED (July 2026):** approved, phased. Phase 1 (optional `personId`/`orgId` references + dedup, non-breaking) is part of the foundation build; Phase 2 (backfill existing strings) comes later. Person/Org are records inside one user's data, not accounts.

*Still open:*

2. **Common envelope backfill order** — which existing collections gain `createdAt`/`updatedAt`/`ownerId`/`deletedAt` first (lean: add `ownerId` + soft-delete when auth/trash ship; add timestamps opportunistically via `merge`).
3. **`Application` as a first-class entity** vs. keeping it implicit in `SchoolEntry.status` (lean: keep implicit until the School List tab is designed).
