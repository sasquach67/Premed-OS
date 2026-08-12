# Academics empty states — prototype decisions

> **Status:** APPROVED — Variant A (Andy, Aug 2026). Use A's centered launchpad,
> with B's concise “What this sets up” explanation. “Add manually” is a quiet
> text link beneath the primary button.
>
> **Mockup:** `academics-empty-states-prototype.html`
>
> **Question:** Which zero-class treatment should become the Academics cold-start reference?

## What is locked

- This is an empty mode of **Daily → Class Center**, not a new tab or onboarding route.
- **Import a syllabus** is the single primary day-one action and creates the first class.
- **Add manually** is a quiet text link beneath it.
- The message uses the dashed, transparent `MascotNote` empty variant. Maximum one mascot per view.
- The populated shell remains recognizable, but controls with nothing to operate on are absent.
- No `0.00` GPA, `0%` readiness, zero-count stat strip, empty chart, recommendation, or hollow study panel.
- The import flow owns extraction and review. This screen only launches it.
- Glass remains limited to banner-borne navigation.

## Variants

### A — Guided launchpad

A calm centered action with a short three-part outcome rail beneath it.

- Strongest single-task hierarchy.
- Makes the review-before-apply safety promise without explaining the parser.
- Most clearly behaves like a temporary cold start that disappears after setup.

### B — Setup explained

A 7/5 split: primary action on the left, practical import outcomes on the right.

- Best for a student who needs to understand why the syllabus is valuable.
- Densest and closest to a bento control-panel composition.
- Risk: more explanation than a first action needs.

### C — In-place collection

The empty state sits exactly where the `Your classes` collection will later appear.

- Best continuity with the populated Class Center.
- Makes the empty-state component easy to reuse on other collections.
- Risk: feels more like an empty database than a guided day-one experience.

## Recommendation to test first

**A** best matches the locked “single day-one CTA” decision. It teaches only what is necessary, keeps import primary, preserves manual entry, and does not expose dormant page machinery.

## Deliberately deferred

- Planning-mode cold start — design it with Planner & GPA so its setup request is grounded in that surface.
- No-topics and no-assignments states — place those in the populated Class hub and Assignments references, where their surrounding controls and recovery actions can be judged honestly.
- Copy or layout inside the syllabus import flow — owned by `academics-syllabus-import.html`.
