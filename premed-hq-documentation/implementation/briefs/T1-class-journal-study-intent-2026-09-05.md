# Class Journal: purpose and selected evidence

Andy resumed implementation in the Class Journal task on September 5, 2026.
This replaces the transcript-required entry workflow. It does not redesign the
Academics landing page or change the API model or billing configuration.

## Student workflow

1. **Purpose:** Understand material or Prepare for an exam. Optional focus text,
   an editable title, and entry date. Transcript upload/paste is optional and
   collapsed initially.
2. **Materials:** Upload sources with the existing intake dialog or explicitly
   select already saved material from this class, including other lectures.
   Newly attached files remain included automatically. Unselected library files
   are excluded. No class-wide material is implicitly included.
3. **Build:** Review the purpose, instructions, review-sheet title, source counts,
   transcript status, and readable passage coverage before generating.

Exam preparation allows one selected review sheet to define scope and topic
order. Lectures, readings, and question sheets provide explanations and cases.
A missing review sheet means provisional scope, not a guessed exam syllabus.
The prompt asks for explicit missing-evidence labels, disagreements, distinctions,
and source-supported examples. It does not promise the actual exam questions.
Both guide and mastery requests carry the saved intent; mastery repair retains it.
Generated practice cues remain distinct from supplied assessment questions.

## Structure and design

The journal remains a collection of entries; no required class-format onboarding
is added. Entry purposes can differ within one class. The existing shadcn-style
Button, Input, Textarea, Card and DateField components and established Baloo/Nunito
and theme tokens remain authoritative. Native fieldset/radio semantics express
one purpose selection; disclosures keep transcript and source-library details
out of the initial scan. The signature is a direct two-choice purpose control,
not a second dashboard. No decorative motion or dependency is needed.

- `JournalIntentFields.tsx`: purpose and optional student focus.
- `LectureCapturePanel.tsx`: existing entry wizard and generation orchestration.
- `journalStudyIntent.ts`: shared, evidence-scoped generation instructions.
- `LectureRecord.studyIntent`: optional purpose, instructions, review-sheet ID.
- Store v48: additive, lossless migration. Older lectures are not reclassified.
- `completedLectureTitle`: new journal entries avoid forced Lesson numbering;
  descriptive AI titles replace default entry labels while custom titles survive.

The overall ClassHub composition is owned by the separate design-reassessment
task. Only entry terminology and selected-material counts changed here.

## Evidence and limits

Existing source preparation fits at most 480 chunks / 220,000 characters for
ordinary guides. Exam entries stop before generation when the selected readable
packet would be sampled. Staged full-corpus processing remains separate work.
General-study legacy sampling remains visible with the exact omitted count.
A readable selected review sheet is required if the student designates one.
No readable source means no generation. No new transcript file is fabricated.
Original materials remain available if generation fails. Guide and mastery are
saved together only after both succeed. A requested prompt behavior is not proof
that a model has covered every source; provider quality still requires a real
coursework evaluation. This pass did not make paid provider requests.

Validation: focused integration tests cover materials-only exam creation, source
exclusion, intent propagation to both request paths and repair, persistence,
legacy preservation, and an oversized exam packet. Local browser checks cover
both themes, narrow layout without horizontal overflow, and reload/resume of
selected material, review-sheet choice, title and focus.
