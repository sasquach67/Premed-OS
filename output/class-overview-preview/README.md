# Class Overview app preview — September 5, 2026

Local app integration on codex/class-overview-preview, based on ef19afb (purpose-driven journal workflow). Approved mockup reference: codex/academics-design-reassessment at 1916756. No deployment or changes to the user's primary checkout.

## App changes

- Attention bar first: next upcoming non-exam assignment, next upcoming exam, student-editable class focus.
- Journal plus Continue studying, This week, and Recent feedback. All values come from the app store; absent data gets an empty state.
- Dotted Add to journal tile routes to /academics/classes/:courseId/journal/new. Existing unfinished entries use the same dedicated page.
- Existing accordion keeps each preview below its own row; repeated selection collapses it. Completed entries have one Full Screen action in the preview header.
- Uses shared Card, Button, Input, Accordion, Dialog, and Lucide icons. Colors reference semantic tokens, including success and warning, with unboxed icons.
- Optional ClassWorkspace.studyFocus and lastOpenedLectureId fields preserve student choices. Lookups use canonical courseId because the ClassCenter view uses a display ID distinct from workspace.id.
- Continue reading selects the last-opened entry when available, otherwise the latest completed entry. It does not yet resume an exact scroll position.
- This week currently summarizes upcoming assignments in the next seven days; it does not synthesize a meeting schedule.

## Verification

Production build passes (existing bundle-size warning remains). All 42 focused ClassHub, LectureCapturePanel, and journalStudyIntent tests pass, including routed entry creation and saving focus when display and workspace IDs differ.

Local browser verified with isolated, visibly labeled demo data on http://127.0.0.1:5211: both themes, no page overflow at 1460px, Add to journal routing, optional-transcript/purpose controls, focus persistence across reload, inline reading, and full-screen dialog. Existing specialized workflow tests cover intent and materials selection. No paid generation request was made; signed-in end-to-end generation quality is still unverified. Oversized exam packets still require staged corpus processing as documented in the source workflow brief.

The dev server runs on port 5211; Mockup Lab remains separate on 5207.
