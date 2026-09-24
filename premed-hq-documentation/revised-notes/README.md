# Revised Notes external-AI workflow

## Scope and accepted behavior

September 24, 2026: replace the dedicated Revised Notes page's legacy API/source-selection form with a notebook-style prompt handoff. The student selects a saved imported notebook, optionally identifies their authored notes, copies a complete prompt, supplies that prompt and their notes/materials to their AI, then reviews and imports the returned notebook package.

Revised Notes improves the student's own lecture record rather than regenerating the study guide. Preserve useful organization and terminology; explain difficult ideas simply with concrete examples; correct obvious transcription errors and verify consequential factual corrections. The external AI must identify the actual authored notes and recover missing materials rather than assume a generated guide is the student's baseline.

## Implementation milestones

1. Compose focused revised-notes instructions with the existing complete notebook contract. No new model/API call and no new transport schema.
2. Provide notebook selection, explicit preparation, copy/manual-copy/download, saved baseline/images, and reviewed import on the existing resource route. Keep baseline freshness and durable notebook transactions.
3. Validate additive changes: existing course, version, entry, study guide, objectives, practice content, sources and assets remain unchanged; new sections are titled Revised notes and use workspace purpose.
4. Verify unit, import and component behavior plus browser rendering before release.

## Maintained files

- `src/lib/academics/revisedNotes/instructions.md`: focused authoring rules.
- `src/lib/academics/revisedNotes/prompt.ts`: complete prompt composition and additive import boundary.
- `src/components/academics/RevisedNotesPromptPanel.tsx`: handoff and import UI.
- `src/pages/ResourceCreationPage.tsx`: dedicated route integration.
- `src/components/academics/NotebookImportPanel.tsx`: optional workflow validator, applied at preview and again before saving.

Use the app's Copy complete prompt or Download prompt to obtain the full contract with the selected notebook context. The instructions Markdown alone is not the full portable prompt.

## Preservation and limits

Personal notes and responses are not automatically included in the exported baseline. Original imports and earlier notebook versions remain recoverable. New explanations sharing evidence with existing practice can trigger the existing conservative practice-reset policy; acceptance displays that policy and previous responses remain in history. This workflow adds a new revised-notes rendition on every run. Editing an existing rendition is a general notebook update task.

Requires an imported notebook with an existing portable package; legacy-only lectures must first create/import a notebook. Old generated Revised Notes records and the legacy generator are retained for compatibility; the dedicated resource route no longer calls that generator.

## Verification

Focused authoring/guard, route, notebook revision, panel and import tests: 74 passing, plus 3 added version-specific schema tests passing. The prompt embeds the matching schema for saved v2/v3/v4 notebooks. Production build passed. Scoped lint passed. Browser observation with synthetic saved data verified the page, preparation with no notes-description text, successful copy feedback, and access to the existing folder/ZIP importer. No live student notebook was modified and no external AI output quality is claimed. Full-suite and release status are recorded separately when complete.

Full-suite run: 2,121 passed / 12 failed across 285 files (two failing files). The failed syllabus-journey and sync-safety suites both passed when rerun with one worker: all 55 tests on both unchanged baseline 5c7a3e4 and the implementation. This distinguishes the broad-run timing failures from the successful isolated rechecks; it is not a claim that the original full-suite run passed.
