# T4 · Research: first release (daily log + Your lab + People + stats)

**Stage:** build (ladder C/D), frontend and backend together. **Written by:** Claude, Sep 24, 2026. **Builds in:** Codex "Research" chat (`01a081de-5aa2-79a1-a816-6a5b1ac293c5`). **Reviewed by:** Claude. **Board:** Codex Planning.
**Goal:** `goals/research.md` (decisions 1–25). **Design:** `mockup-lab/06-research/research-lab-log.html`, **variant B, approved and structure fixed** (notes in `research-lab-log.md`). **Reviews that bind this brief:** `goals/reviews/2026-09-23-codex-research-goal-review.md`, `2026-09-24-codex-research-redesign-review.md`, `2026-09-24-codex-research-hours-import-review.md`, and **`2026-09-24-codex-T4-research-build-review.md`** (feasibility review of this brief; its data shapes, ordering and tests are part of this brief).
**Branch:** `research/t4-first-release` from `origin/main`, in Codex's own worktree. If something you need isn't here, read the named goal or review section, and tell Claude the brief was incomplete.

## Scope decisions (Andy, Sep 24, Claude planning chat; selected options)

| # | Question | Andy selected | Result |
|---|---|---|---|
| 1 | What the goal measures | "All research hours (Recommended)" | `goals.research` compares with **total research hours** (all labs, estimates included), the same as Overview: "Total 91.5 / 150 h". "This term" shows hours with no goal. |
| 2 | Term dates | "Fixed windows (Recommended)" | Fall = Aug 1–Dec 31, Spring = Jan 1–May 15, Summer = May 16–Jul 31, inclusive, labeled "Fall 2026" etc. |
| 3 | Pace projection | "Keep it" | Research keeps the shared hour-row pace estimate on Overview (from dated logged hours only) and in the header when a goal is set. |
| 4 | Claude's additions | Selected "Earlier notes" only | **Earlier notes: yes** (one Research-wide, read-only, unassigned list). **Lab switcher: no.** |

**Consequence of "no lab switcher"** (Claude's reading; Andy can correct):

- "Your lab" and People show the **current lab**: the one the student marks current, defaulting to the most recently logged.
- The log shows **all research entries**, each labeled with its lab name only when there's more than one lab.
- Totals always cover all research.
- Other labs' data stays intact and editable from their entries. Nothing is merged.

## Approvals

| Date | Chat | Andy's exact answer | Brief revision | Covers |
|---|---|---|---|---|
| Sep 24, 2026 | Claude planning (session 429b1fa7) | Selected **"Approve build"** to the question "Approve the first Research build (brief T4 at commit 5c0ff8f)? … It does NOT release anything" | `5c0ff8fa6c02c7e8bbcc9a4bba102257df6c63cf` | **Building this brief** on `research/t4-first-release`, with preview-only route enablement and alpha on a local preview with the separate test account. **Not** release, production unlock, merge to `main`, or any change to real account data. |

## 1. Already built (don't rebuild)

- `ExperienceHourEntry` (`date`, `hours`, `kind`, `note`, period bounds) and hour totals: `src/lib/experienceHours.ts`, migration `experienceHoursV15.ts`
- `PositionDetail` add-only capture in `components/experiences/ApprovedPillarLayouts.tsx`. Its patterns can be reused; it is **not** the finished log.
- `Person` / `persons`, `Organization`; `ExperienceEntry.supervisorId` / `organizationId`
- `Goals.research` already exists (`types.ts:2011`), and Overview already offers "Research hours" as a target (`OverviewSupport.tsx:249`)
- Overview's "Hours logged" research bar (`OverviewStatus.tsx`)
- `ReservedSpace` for `research` in `App.tsx` **and** `src/app/availability.ts`

Old `ResearchWorkspace` / `LabNotebookView` / PI checkboxes in `ExperiencePillar.tsx` are unrendered patterns, not working features. Don't count them as built.

## 2. References

- Mockup B (read the HTML, not just the `.md`), both themes, 375px
- `mockup-lab/_shared/_visual-recipes.md`, **but** the X1 sweep measured the real app. Where they differ, match the implemented Academics pages.
- Spec `tabs/06-research.md` with its **Sep 24 revision notes** (§2.1, §7, §9, §14, §15)
- Shared components: `PillarShell`, `InlineAddRow`, `ExpandableEntryRow`, `ContactCard`. Reuse them; never fork variants.

## 3. The work

### 3a. Page (route `research`, design B)

- **Header:** "Research", the lab name as subtitle, and the stat strip:
  - **This term** hours (dated logged hours inside the fixed term window (decision 2); inclusive dates, local midnight rollover)
  - **Goal** (decision 1): "Total 91.5 / 150 h" when `goals.research > 0`, with the pace estimate (decision 3). The same numerator as Overview. Never a per-lab goal. Totals always cover all research.
  - **Total** hours, with estimates labeled ("Total · 60 est.")
  - Search and date filters affect **only the log**, never the header stats.
  - **Lab days** = distinct dates with logged hours > 0
- **Tabs:** "Log" only. No tabs for unbuilt features.
- **Control bar:**
  - search (What I did + Thoughts)
  - date range (this term / last 30 days / all time / custom)
  - primary action **"Log a lab day"** (the one blue pill)
- **Left: the daily log**
  - **Quick capture:** date, hours (**optional**), "What I did" (one line), Save; "+ Thoughts" opens a second field. ≤5 seconds for date + hours + one line.
  - **Save state line:** "Saved on this device" is separate from sync pending/failed. Never show a failure as saved.
  - **Entries grouped by week.** Each week header shows its hours and lab days. Each row shows date · hours chip ("No hours recorded" when 0) · What I did · Thoughts clamped to one line, expanding to full with **Edit** and **Delete**.
  - "Show earlier entries"
- **Right: "Your lab"** (the working box)
  - **Lab facts, one line:** department · institution · research type · since. Plus "Last PI contact <date> · Update" (a date the student records).
  - **Upcoming (+ Add):** dated items the student adds (date, title, optional short note), sorted by date; past items are **hidden from view, not deleted** (inclusive of today; rolls over at local midnight). A list only: **no calendar, no recurrence engine, no notifications** in this release.
  - **Pinned reminders (+ Add):** short text lines; add, edit, remove, reorder.
  - **Timeline:** dated role notes (date + one line), newest first.
  - **Not in this release:** Key reading and the onboarding-doc footer (they arrive with the onboarding import). Don't render them or their empty shells.
- **Right, below: People**
  - **Cards:** avatar initials · name · role in this lab · short bio · "Project: …" (text).
  - **"+ Add person"** uses a shared select/create/link control over `persons`, and never auto-merges by name.
  - **No status tracking** on people (decision 16).
- **Empty states:**
  - no lab yet: one action, "Add your lab"
  - lab, but no entries: "Log your first lab day"
  - empty Upcoming / Reminders / People: one line each with its + Add

  Friendly one-liners, never blank.

### 3b. Overview (small, same release)

- The Research status row uses the shared **`hourRow`** (`OverviewStatus.tsx:75`), like Clinical/Volunteering/Shadowing: hours, `goals.research` progress, and the pace projection. That replaces "N projects · record count".
- The "Hours logged" research bar and the "Research hours" target option stay.

### 3c. Data & backend

- **One hours ledger.**
  - A log entry is one `ExperienceHourEntry` (`kind: 'logged'`) under the lab's `ExperienceEntry` ID.
  - "What I did" = `note`, kept verbatim and never truncated.
  - Add optional `thoughts`.
  - Zero-hour entries use `hours: 0` and are excluded from sums and lab days.
  - Estimates stay estimates: never dated, never lab days.
- **Lab = the existing research `ExperienceEntry`, extended in place** (decision 3).
  - Keep its ID, fields, hours and story links.
  - Link an `Organization` only when the student picks one.
  - Unknown type/PI/dates stay unresolved.
  - Never merge same-name entries.
  - With several research entries: no switcher (decision 4). The rail shows the **current lab**; the log shows all entries, lab-labeled when there's more than one lab. No merging.
- **New records (names to settle in code):**
  - Upcoming items, Pinned reminders and role-timeline notes, each linked to the lab
  - a lab-membership link (lab ↔ Person) holding role-in-lab and "their project" text
  - `bio` as an optional field on `Person`
  - "last PI contact" date on the lab extension
- **Register every new collection/field** (redesign review §6, all 8 points):
  - `AppData` / `CollectionKey`
  - seed defaults
  - the versioned migration chain + `workspaceVersion.ts`
  - `DATA_KEYS`
  - structural **and** meaning validation at local load, import, cloud and restore
  - merge areas and local-work detection
  - JSON/ZIP round-trip
  - old-client protection (a stale-client test, or a documented safe refusal)
- **Shared fixes this release depends on:**
  1. `MergePage.tsx:44`: the experiences merge area must carry `experienceHourEntries` and the new Research collections, kept together with their parent lab.
  2. `publicLayer.ts:144–187`: local-work detection counts **records**, not the deprecated `ExperienceEntry.hours` sum, so a guest with only log entries (including zero-hour ones) is detected.
  3. **Estimated-block deletion tombstone**, so a later migration can't recreate a deleted estimate.
- **Record shapes** (from the T4 review; exact names are settled in code):
  - `ExperienceHourEntry` gains optional `thoughts`. Log retrieval must **not** reuse `activeEntries` (it drops zero-hour rows).
  - Lab facts (department, institution, research type, since) are **named additive fields** on the lab extension or explicit mappings to existing fields.
  - Upcoming `{experienceId, date, title, note?}`, reminders `{experienceId, text, order}`, timeline notes `{experienceId, date, text}`: independent collections with `EntityEnvelope`. These are not Tasks, calendar events or Timeline milestones.
  - Membership `{experienceId, personId, roleInLab?, projectText?}`. `Person.bio` is shared, so editing it changes that person everywhere. Removing a card **unlinks** the membership and never deletes the Person. Duplicate links are prevented. Existing `supervisorId` links are kept.
  - **Last PI contact** is a manual date only in this release.
- **Delete/restore:**
  - Define parent-delete, restore and dangling-reference behavior (generic delete doesn't cascade).
  - Validation separates preserved historical/deleted links from a malformed *active* link. Rejecting every historical orphan would not be lossless.
  - The **estimate tombstone must survive a permanent Trash purge** and later import/re-migration.
- **Earlier notes** (decision 4, accepted):
  - Research `NotePage`s stay **unassigned**, one Research-wide read-only list, including when no lab exists. Nothing is assigned by lab name or selection.
  - Guest merge must carry `notePages` (today's merge areas don't).
  - Other pillars' notes are untouched.
- **Validation** also covers `persons` / `organizations` (not in today's structural validator).
- **Sync:** whole-workspace sync carries the registered data, Thoughts included (decision 5). Test the real outgoing and reloaded payload. No new backend API, no file storage, no integrations.

### 3e. Old-app compatibility (blocks production, not alpha)

- The local version guard protects only the persisted envelope. **Cloud writes send bare `AppData`**, and remote validation ignores unknown collections, so an older production app can load an account and save it back **without** the new Research data.
- **Required outcome:** a new app writes, then the **actual current production app** reads, edits an unrelated field and saves. Either every new field, collection and tombstone survives, or the old app refuses before replacing anything.
- A guard added only to the new app can't protect old ones. If the fix needs shared sync changes, it becomes a **separate shared-system brief** (`DEV-WORKFLOW.md` §4), not silent scope growth here.
- **Alpha runs on the separate test account** in the meantime. New-schema data must never meet the old production app until this passes.

### 3d. Route availability (preview only)

- One **explicit, default-off build flag**, read by both `App.tsx` and `src/app/availability.ts`. It is not tied to Vite dev mode, because a deployed preview is a production build. Direct URLs follow the same rule. Test two built artifacts: flag off stays reserved; flag on opens Research with consistent navigation.
- Alpha uses a **local `npm run preview`** until hosted previews exist, signed in with the **separate test account** (`DEV-WORKFLOW.md` §9). Recovering the Cloudflare work is **not** a hidden prerequisite.
- **Production stays `ReservedSpace`.** Unlocking production (`App.tsx` + `availability.ts`) is part of the release step and needs Andy's separate release authorization.

## 4. Do not break

- Other pillars' hours, totals, projections, pages and Overview rows
- Existing research records, hours (logged vs estimated), story links and legacy notes. Keep old research `NotePage`s intact and reachable (listed read-only under the lab as "Earlier notes" if any exist).
- Signed-out mode
- The `CLAUDE.md` must-not-change list (tokens, fonts, sync layer schemas only via versioned migration)
- lucide icons only; one primary action; ≤5-second logging

## 5. Done when

1. **Log:**
   - add, edit, delete, search and date-filter entries
   - zero-hour entries show "No hours recorded"
   - **totals recompute correctly:**
     - editing only What I did/Thoughts changes no hours
     - editing hours changes the sum
     - delete subtracts once, and restore adds back once
     - two positive logs on one date = one lab day
     - zero-only dates count none
2. **Header:**
   - this-term hours use the fixed windows (decision 2, inclusive)
   - the goal appears only when set, against total research hours (decision 1), and matches Overview
   - total hours label estimates
   - lab days
   - fixtures: two labs, missing term, estimated-only, zero-hour-only, archived/deleted rows, date and leap-day boundaries, and goal absent vs positive
3. **Your lab:** facts line, last-contact update, Upcoming, Reminders and Timeline all add/edit/remove and survive a reload. Past Upcoming items are hidden, not deleted. Key reading is not rendered.
4. **People:**
   - add, link, edit and unlink, with bio and project
   - unlinking never deletes the Person
   - same-name different Persons stay distinct
   - no name auto-merge
5. **Overview:** the Research row uses the same numerator/goal as the header (with the pace projection, decision 3). The old "projects" wording is gone.
6. **Migration:**
   - **Complete legacy records are compared before and after**, and only enumerated additive changes are allowed.
   - Cover null/absent optionals, long legacy text (never truncated), unknown PI identity and old notes.
   - Re-running it is idempotent.
   - A deleted estimate stays deleted through **delete → purge → export/import → migrate twice**, and restore-before-purge brings it back once.
   - Restore works parent-before-child and child-before-parent.
7. **Round-trips:**
   - reload
   - JSON/ZIP export/import
   - a Research-only guest→account merge that carries hours and notes
   - account switch
   - cloud reload

   Malformed payloads are rejected. Also exercise storage rejection, offline sync, cloud rejection, and switching account mid-write. "Saved on this device" appears only after durable acknowledgment.
8. **Old-app compatibility** (§3e) passes before any production unlock. It isn't needed for alpha on the test account.
9. **Five seconds**, measured this way: page already open, default date, a short known entry, no Thoughts, ending at durable confirmation. Sync time is recorded separately.
10. **Six promotion proofs** (`DEV-WORKFLOW.md` §6) against the exact approved B revision, plus:
    - build, **lint**, test
    - signed-out mode
    - both themes
    - 375px with no horizontal scroll
    - keyboard access
    - empty store showing real empty states

    Unconfigured preview checks are listed as **blockers**, never passed by reading source.
11. **Route:** the production build is still reserved (flag off), and the preview build opens Research (flag on).

**Build order** (from the review):

1. freeze scope decisions
2. types, defaults, validation and versioned migration, including the tombstone
3. persistence, merge, local-work detection and round-trips
4. pure selectors (log retrieval, date windows, totals, lab days), tested against fixtures
5. the UI and the preview flag
6. the full acceptance matrix and alpha

## 6. Commit

One feature per commit (conventional): e.g. `feat(research): …`, `fix(merge): carry experience hour entries`, `fix(public): count local work by records`. The build report is appended to this brief as `## Build report`.

## 7. Next stage (not in this brief)

Andy tries it on the preview (alpha). Then a **release brief**: production unlock, release authorization, live check. After that, **T4-b: onboarding import** (reminders, key reading, standing meetings, people and checklist from the lab's document).
