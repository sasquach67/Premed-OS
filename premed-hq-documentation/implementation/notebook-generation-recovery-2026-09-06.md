# Notebook generation recovery — September 6, 2026

## Confirmed failure

One authorized live retry in Arc produced a valid Study Guide, then two rejected Mastery Map responses. Both map responses had title and unit but an empty standards array. The first reported `failed_missing_explicit_objectives`; the repair reported `failed_source_requirements`. Both explained that the material lacked explicitly labeled instructor objectives and the artifact rules prohibited deriving them. The generic validation message obscured this reason. The composer discarded the successful guide because it required both outputs before persistence.

This establishes the cause of this attempt, not every historical generation issue. The model's claim to have reviewed all passages is not independent evidence of complete content understanding.

## Local change

- The mastery briefing and assembled runtime rules preserve explicit instructor objectives when supplied, otherwise permit source-grounded study objectives with a `Study objective:` title prefix. These stay within the generated artifact and cannot create syllabus Topics or claim instructor authority.
- Readings and notes can define scope when instructor sources are absent. Source tracing, depth, original practice, and citation validation remain required.
- Save the independently validated Study Guide before requesting the map. Map rejection or a thrown request leaves the guide available; any older map is retained and identified as potentially based on older material.
- Persist a readable recovery notice using the existing optional `processingError` field. Display it in the saved reader. An interrupted draft can open its saved entry without another AI call. No new schema or migration.
- A selected file with zero readable text blocks creation until replaced or excluded. Review includes per-file readable page counts, OCR recovery, remaining unreadable pages, and the figure interpretation boundary.
- Validation identifies the actual missing title, unit, or objectives field separately.
- Correct the existing ClassHub test fixture's missing required file metadata so the production build can run.

## Resource limits still present

Verified in `documentText.ts`, `MaterialIntakeDialog.tsx`, and `syncGenerationSources.ts`:

- Supported extraction: text, PDF, DOCX, and image OCR. Original PowerPoint and arbitrary other file formats do not have dedicated parsers here; export to a supported format.
- File import rejects files above 50 MB and PDFs above 250 pages. These bounds do not constitute a whole-textbook ingestion workflow.
- Material intake opts into local OCR; OCR success is not guaranteed, and OCR text does not establish diagram interpretation.
- One generation packet is capped at 480 passages and 220,000 characters. Notebook blocks oversized packets rather than silently sampling them. Larger collections need staged ingestion/generation work beyond this correction, or separate entries under the current limits.
- The production generator's current output cap and provider/citation/audit constraints still apply. A successful input parse does not guarantee a valid generated map.

## Verification and integration

Focused coverage includes missing-objective prompt rules on both attempts, independently saved guides while maps are pending, failed/thrown map requests, prior-map retention, interrupted-draft recovery, mixed resources, unreadable and partial coverage, reader notices, source limits, document extraction, and briefing drift. The saved-reader warning was visually checked with synthetic local data. No further paid provider trial or deployment was performed after the diagnostic retry.

Integrate the local commit before expecting different behavior on premedos.app. Runtime prompts are assembled in the frontend; this change does not alter provider routing, authentication, backend functions, or schemas. Overlap-sensitive files are NotebookEntryComposer.tsx and its tests, LectureCapturePanel.tsx and its tests, ClassHub.test.tsx, and the Notebook/mastery briefings. Preserve concurrent Materials changes.
