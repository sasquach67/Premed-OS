# Academics remediation — local implementation

Implementation requested September 5 after the audit. Changes are local; not deployed. The root app was edited. Approved mockups and shared design guidance were reviewed. No dependencies, backend changes, schemas, or production records were changed.

## Delivered

| Audit finding | Implementation |
| --- | --- |
| F01 table freeze | Stable filtered-row identity for TanStack. Regression failed before the fix and passed after with 1 and 160 records. Browser search/clear restored 0 → 2 records without hanging. |
| F02 false Free labels | Unweighted and zero-weight tasks show task counts. Projected workload includes unweighted records and identifies missing weights. |
| F03 weekly overflow | Equal minimum day widths, concise task summaries, full accessible titles, three-line clamp, bounded day scrolling. Browser card scroll width equaled client width; page width equaled viewport at 1422px and 375px. |
| F05 hidden Guide creation | Save/Cancel form with required title and chosen kind. Legacy class-context note types now have a visible section and existing edit/removal controls. |
| F07 raw capture masquerading as generated work | Ungenerated journal entries show captured sources and explain that no Study Guide exists. Saved generated previews remain available. |
| F08 Guide hierarchy | Saved notes precede optional course lens/evidence. Empty category panels and an empty side column no longer occupy the page. |
| F09 misleading transcript status | Terms with missing details say Needs details. Selecting that ledger filter opens correction tools. GPA difference copy explains eligibility instead of simply asking for another record. |
| F12 filtered empty states | Weekly/calendar empty days say no matching assignments under a filter; Clear filters resets both search and class. |
| F13 unplaced coverage | Coverage uses dated placements or protected records; an Unscheduled candidate no longer counts as Placed. The unscheduled column is labelled Unplaced. |
| F14 small/ambiguous controls | Larger grade, class return, office-hours, icon/color and writing-target controls. Class type/Icon/Color are labelled groups instead of one label enclosing several buttons. Shared controls are being handled in the other beta task. |
| F15 writing creation and feedback | Required-title Save/Cancel forms, edit/remove flows, assignment linking for papers, and a visible individual feedback log. Removal preserves linked assignments/feedback. |
| F16 calendar keyboard | One tab stop; arrows and Home/End move selection/focus, including across the displayed window. |
| F17 creation context | Calendar Add preserves selected date. Overview Add exam opens a class-scoped exam form. Missing exam scope has plain-language unknown-state copy. |
| Claude S23 | The last visible table column cannot be unchecked; defensive guard prevents empty-column state from restoring every column. |

## Verification

- 144 distinct targeted tests passed across table filtering, assignment logic and interactions, Guide, writing, Planner, Grades, and Class Center. The final Guide/assignment rerun passed 41 tests after hierarchy/clear-filter adjustments.
- Production build passed. Existing large-chunk warnings remain (especially the bundled planning catalog).
- Scoped ESLint: zero errors, ten existing-style hook/compiler warnings; this was not a whole-repository clean-lint claim.
- Browser: original table search/clear sequence passed; weekly long-URL card contained at desktop and 375px in light/dark; Guide opens a labelled form and Cancel leaves the count unchanged.
- The saved 375px screenshot reflects the browser provider's raster scale. CSS viewport/scroll-width measurements are the geometry evidence.

## Still open / separate integration

- F04 split imported citations: existing records were not merged or rewritten. The source extraction origin remains unverified; a source-backed review/merge flow is still needed. Editing the displayed summary cannot repair that underlying data.
- F06 stale chunk recovery and shared shell/controls are owned by the parallel beta remediation task, not verified in this checkout.
- F10 failed-source receipt clarity and F11 local PDF worker behavior were sent to the lecture ingestion/generation owner. No generated result is claimed from the 43-source local fixture.
- F08 remaining Materials filing/duplicate-tool hierarchy is not included in this Guide-focused change.
- The existing production blank Guide entry was not deleted. The corrected UI exposes legacy entries so they can be reviewed normally.
- Integration must preserve ongoing LectureCapturePanel, study-tools backend, unitQuestionBank and generation work. Do not copy this old checkout over current main; integrate the scoped commit.

Design contract: `premed-hq-documentation/implementation/briefs/academics-quality-contract.md` maps the owning files to approved mockups, shadcn/Radix, Motion accessibility, and 21st.dev references.
