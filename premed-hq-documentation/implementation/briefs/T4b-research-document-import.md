# T4-b · Research: document import (lab notes + onboarding document)

**Stage:** build — first working version done by Claude; **Codex finishes.** **Written by:** Claude, Oct 11, 2026. **Branch:** `claude/fervent-cori-gkxe4a` (from `origin/main` 4b54197). **Not merged, not deployed.**
**Predecessor:** `T4-research-build.md` §7 names "T4-b: onboarding import" as the next stage. This brief also covers Andy's main use, importing his own lab notes.

## Why

Andy, Oct 11: the Research tab tracks entries, but *"the parsing still isn't functional — it should, backend wise, be similar to how the syllabus import works, where it automatically detects a type of data."* Before this, every Research entry had to be typed by hand.

## Decisions (Andy, Oct 11, Claude chat; selected options)

| # | Question | Andy selected / said | Result |
|---|---|---|---|
| 1 | Dated entries in notes | *"usually everything is a lab date unless another date indicates otherwise"* | A dated entry is a **lab day**. A **future** heading date, or a **dated deadline inside an entry** ("Abstract due Nov 3"), becomes **Upcoming** instead. |
| 2 | Checklist, standing meetings and reading list have no record type | **"Use existing fields now (Recommended)"** | They become **pinned reminders** (`researchReminders.text`) with prefixes (`To do:`, `Read:`, `Guideline:`; meetings unprefixed). **No schema change, no migration, no new collection.** Proper checklist/reading records are a later, separately approved change: new collections repeat the S1 old-client-drop risk. |
| 3 | Main future source | **"My own lab notes"** | Lab-notes parsing is the primary path. **It needs tuning against a real sample from Andy (still outstanding).** |

## What was built (on this branch)

Same contract as the syllabus importer (`src/lib/academics/syllabusParser.ts`): on-device text extraction, deterministic typed proposals with the exact source quote, review before anything is written. No AI key, no new dependency, no storage change.

- `src/lib/researchImport.ts`:
  - `parseResearchText(text, name, { today })` returns a proposal with items typed `lab | people | logs | upcoming | meetings | checklist | reading | guidelines`. Each item carries confidence (`high`/`low`), a preselection flag, and its evidence quote and line.
  - It classifies the document as `lab-notes | onboarding | mixed | unrecognized`. In an onboarding document, the document's own dates ("Updated January 2026") never become lab days.
  - `extractResearchFile(file)` reuses `extractDocumentText` (DOCX via mammoth raw text, PDF with OCR recovery, TXT/CSV).
  - `applyResearchImport(draft, target, chosen)` writes everything in **one transaction**:
    - It never overwrites a filled lab field.
    - People match by email, or by exact name **only among people already linked to that lab**. It never does a global name merge.
    - Rows that already exist are skipped, so re-importing the same file adds nothing.
    - The PI link is set only if the lab has none and the PI row stays checked.
- `src/components/research/ResearchImportDialog.tsx`: upload or paste → review grouped by type (checkbox, Select all/Clear, inline edit for text/date/hours/thoughts, "Check" chip on low-confidence rows, source quote under each row, "Not found" list) → "Save N items" → summary.
  - **Save to** defaults to the lab the document names if it exists. Otherwise it defaults to a new lab, so content never lands in the wrong lab. If the document names no lab, it defaults to the current lab.
  - Guidelines and reading start unchecked.
- `src/pages/Research.tsx`: an outline **Import** button beside the primary "Log a lab day", plus **Import from a document** on the empty state.
- `src/pages/research.css`: solid `var(--muted)` group and `var(--card)` item surfaces.
- `src/lib/researchImport.test.ts`: 29 tests. The fixtures are **fictional**. Andy's real onboarding document contains third-party names and phone numbers and must **not** be committed.

## Verification so far (Claude, Oct 11)

- `npm run build` passes. Full suite: **322 files / 2,588 tests passed**. ESLint is clean on the changed files.
- Real-browser check on a local build with `VITE_RESEARCH_PREVIEW=true`, signed out, using **Andy's actual onboarding .docx** (kept outside the repo):
  - Reading and parsing took **~0.8 s**.
  - Detected:
    - Lab: McCauley Lab · UNC · since Fall 2026 · PI Heather McCauley (low confidence).
    - 3 people with roles, emails and phones.
    - 5 standing meetings with correct required/encouraged status.
    - 14 checklist items with their contacts and links.
    - 17 reading items and ~45 guidelines, both unchecked by default.
    - 0 false lab days.
  - Saving 25 items created the lab, the people, the PI link and 19 reminders.
  - Importing the same file again went to the same lab: **22 skipped, 0 added**.
- Measured surfaces: light group/item `rgb(239,230,212)` / `rgb(255,250,240)`; dark `rgb(50,46,40)` / `rgb(43,39,34)` (= `--muted` / `--card`). At 375px the page and dialog have no horizontal overflow (375/375, 341/341) in both themes.

## Remaining work for Codex

1. **Tune lab-notes parsing against Andy's real notes.** Ask Andy for a sample (names can be swapped). Covered today:
   - Date-led lines: `10/6/2026`, `10/6`, `Oct 6`, `October 6, 2026`, `2026-10-06`, `Mon 10/5`, `6 Oct`.
   - Hours: `3h`, `2.5 hrs`, `Hours: 4`, and clock ranges like `1–4:30pm`, `9-12pm`, `13:00-16:30`.
   - CSV rows: `date,hours,task`.

   Add his real formats as tests, using synthetic text in the same shape. Watch for date-like openings that aren't entries.
2. **Re-run the whole suite and build after rebasing on current `main`**, then the browser check above in both themes, at 375px, and signed out.
3. **Design review** against the Research mockup (variant B lives on Andy's unpushed `docs/dev-workflow` branch). Check the dialog's group/item recipe and the Import button's hierarchy: outline, secondary to "Log a lab day".
4. **Reminder clutter:** about 19 reminders from one onboarding document is a lot for the "Pinned reminders" rail. Consider collapsing the rail after N items. Do **not** add a new record type without Andy approving a migration-safe brief (decision 2).
5. **Andy tries it on a preview build, then release approval.** Merge to `main` deploys to premedos.app, so it needs Andy's explicit go-ahead. No production DB change is involved.

## Must not

- Change the Research data schema, add collections or bump the cloud schema (S1 risk) without a separately approved brief.
- Commit Andy's real documents or any data copied from them.
- Write anything before the student confirms, overwrite filled lab fields, or merge people globally by name.
- Add dependencies or AI calls. Every feature must work with no key (spec §15).
