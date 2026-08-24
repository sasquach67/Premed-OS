# Academics · Shareable syllabus structure — decisions

**Status:** PROPOSED · Stage-A paper completion

## Behaviour

- This is an optional state inside the existing temporary Syllabus Import /
  Re-import flow. It is not a permanent class tab, a social feed, or a document
  library.
- The owner decision is **private by default**. Opting in is per parsed
  syllabus, anonymous, and scoped to a term and course section.
- The only shareable payload is an explicit allow-list: term/section identity,
  units/topics, dates, grade-category weights, and permitted policy structure.
  The original file and its text, student identity, grades, progress, notes,
  files, and reviewed edits are structurally excluded.
- A recipient sees a candidate as a comparison, not a replacement. Their own
  reviewed syllabus wins; matches collapse; disagreements are shown as conflicts;
  every changed field stays Keep/Accept and nothing writes before Apply.
- No result is normal. Private upload, pasted text, and manual class details
  remain primary, fully functional paths without a shared result.

## Appearance

- The shallow Academics import banner establishes a temporary mode. The active
  underline is the only selected-tab indicator; the body never creates another
  global navigation row.
- **A · Consent-led** is the primary comparison treatment: private-by-default
  copy leads, then two clearly opposed solid disclosure objects show what may
  and may not leave the parse. The decision rail is narrow and factual.
- **B · Evidence-led** widens the candidate structure and corroboration so a
  recipient can inspect what exists before acting; the consent boundary stays
  immediately visible rather than becoming a hidden legal footnote.
- **C · Diff-led** gives the current/private structure and a candidate equal
  working weight. Matching facts and unresolved fields read as compact editorial
  rows, never a score or ranking.
- All work surfaces use the literal ladder: page `#211e1a` → panel `#2b2722`
  → dense disclosure/diff object `#322e28`, with `#3c352d` borders, 16px outer
  panels and 13px inner objects. The banner affordance alone may use the shared
  glass recipe. Focus is visible; reduced motion resolves directly.

## Views

- `owner-opt-in` — a completed private parse can remain private or contribute
  only the shown extracted structure.
- `recipient-review` — a shared candidate is compared against the student’s
  own parse before any Apply action.
- `no-result` — ordinary no-match state that routes to private import rather
  than a network/error recovery.

## Pending decision

Andy must choose A, B, or C before a shareable-structure implementation brief
is written. No backend, remote table, source-file upload, or account claim is
implied by this proposed mockup.
