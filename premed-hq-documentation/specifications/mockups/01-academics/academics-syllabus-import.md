# Academics syllabus import

> **Status:** PROPOSED — build-cleared in `implementation/briefs/BUILD-MANIFEST.md`.
>
> **Mockup:** `academics-syllabus-import.html`
>
> **Behavior owner:** `tabs/01-academics.md` §4.1-M through §4.1-M-d.

## Decision

This is one temporary, full-screen import flow, not a tab and not a wizard.
It accepts local PDF/DOCX files or pasted text, proposes extracted course
structure, and writes nothing until the student applies the proposal.

- Pasted text is first-class.
- Parsing is client-side; source documents and extracted prose do not leave the device.
- The review order is identity, exams, weights, units, deadlines, policies, then logistics.
- Every proposal must show its quoted source line. Missing groups remain visible and offer manual entry.
- Weight totals show any gap; they are never normalized.
- A re-import is a per-item added/changed/removed diff, never an overwrite.
- A scan is named as a scan and routes to paste or manual entry; OCR is intentionally deferred.

## Out of scope

No shared parses, share button, server upload, Canvas ingestion, or OCR.
