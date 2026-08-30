# Academics · Grade decisions — decisions

**Status:** APPROVED (Aug 27, 2026 — Andy) · Variant A mockup target; implementation remains manifest-gated.

## Behaviour

- This is a record-detail layer within **Planning → Grades & Archive**, not a
  new Academics tab or a second gradebook.
- Returned work may surface a regrade window, but Premed OS never claims that a
  regrade is justified. The original work, instructor deadline, and one
  deliberate next step stay together.
- A calculation shows exactly which syllabus/record policy it applied. Missing
  weights, replacement rules, or curves stay visible as missing rather than
  being estimated.

## Appearance

- The Planning banner, glass mode pill, and underline tab preserve the real
  parent destination. The decision surface is solid-with-depth because it sits
  on a dense record page.
- **Returned work** uses a paper-like source record beside a narrow decision
  note. The deadline is factual and calm; the single blue action is review,
  not “appeal.”
- **Policy applied** uses a slim source spine and a reading sequence of applied
  rules. It makes the calculation explainable without presenting an oversized
  metric.
- **Missing inputs** is spacious and direct: one unresolved source fact, one
  recovery path, and no zero or speculative outcome.

## Product views

`regrade`, `policy`, and `incomplete` are state views of one record-detail
treatment. They are not visual variants; all use the same hierarchy and
evidence-first rule.

> **Aug. 29, 2026 authority amendment:** The review-driven `mistakes` state was
> retired with Academics Review Session. Existing mistake records remain
> migration-readable and may still support their owning exam/practice evidence;
> this Grades view no longer routes them into recall.

## Visual conformance sweep — 2026-08-26

- Refined returned work into a muted-clay evidence sheet with a blue record
  edge; applied policy uses sage, incomplete evidence uses amber, and sample-
  limited interpretation uses violet.
- All state controls retain keyboard focus and reduced-motion behavior. The
  mockup is **APPROVED** and still does not imply a registrar or LMS integration.

## Final readability and access sweep — 2026-08-26

- Removed the stale Tracker destination, leaving Planner and Grades & Archive
  as the two first-level Planning jobs.
- Kept each state’s first action adjacent to its factual record or honest
  absence; the mobile stack remains source → decision → boundary.
- Converted the three state selectors to keyboard-focusable buttons with visible
  focus while preserving their horizontally scrollable narrow layout.
