# mascot-note-pattern — decisions

> Extracted from the mockup header. **Read this instead of the HTML** — the markup is ~90% CSS you must not copy.


  MASCOTNOTE — GLOBAL EXPLANATION PATTERN — APPROVED VISUAL REFERENCE
  Status: APPROVED (July 2026).  Spec: specifications/01-shared-interface-
  patterns.md §4f.  Applies APP-WIDE — every tab, not just Academics.

  WHAT IT IS
  The mascot is the app's voice for EXPLAINING and TEACHING — the
  "why this matters" moments. It gets ONE reusable component used
  identically everywhere. It is never a control.

  ANATOMY
    [mascot illustration ~38px] · message (1–2 lines, plain language)
    · [SOURCE LABEL] · [optional actions] · [optional dismiss ×]

    · Message: conversational, second person, specific. Bold the number or
      the operative word. Never more than two lines.
    · SOURCE LABEL: small uppercase dim text beneath the message
      (e.g. R/PREMED, HOW SPACED REPETITION WORKS). CITE THE SOURCE WHEN
      ONE EXISTS — r/premed, an uploaded guide, an Atlas-ingested source.
      If the line is app guidance with no external source, OMIT the label
      rather than inventing one (architecture/02 citation/traceability).
    · Dismiss: tip + teaching variants are dismissible; dismissal PERSISTS.

  FIVE VARIANTS (same shape, different tint)
    1 Tip          neutral muted        ambient advice on a solid surface
    2 Banner       frosted glass        the same note over banner artwork
    3 Teaching     --cat-mcat tinted    micro-lessons + walkthrough steps
    4 Empty state  dashed, transparent  friendly one-liner + first action
    5 Milestone    success tinted       a REAL threshold reached

  WHERE IT BELONGS
    · Just-in-time micro-lessons — first time a mechanism appears, explain
      it once (Academics §4.1-F: "the scheduler predicts you're about to
      forget this — recalling it at the edge is what makes it stick").
    · First-run walkthrough steps (with Animated Stepper).
    · Empty states — every empty collection gets a mascot line + first
      action, never a blank void.
    · Milestone recognition — goal hit, first publication, letter received.
    · Ambient sourced tips on a banner.

  RESTRAINT (BINDING — a mascot that talks constantly stops being charming)
    ✕ NEVER on errors, failures, or destructive confirmations. A cartoon
      delivering "couldn't save" or "delete 12 records?" reads as flippant —
      use the scoped-error pattern and Alert Dialog.
    ✕ NEVER as a UI icon, button, nav item, or inline label. Illustration
      only (CLAUDE.md).
    ✕ MAXIMUM ONE PER VIEW. Two turns character into noise.
    ✕ Teaching notes fire ONCE PER CONCEPT, then dismiss permanently.
      Generic encouragement on every visit is nagging, not personality.
    ✕ Milestones only on REAL thresholds — never manufactured praise
      ("nice job opening the app").
    ✓ Cite the source when there is one; omit the label when there isn't.

  NOTE ON THIS FILE: the mascot here is a CSS placeholder circle. The real
  component uses the ram mascot asset. Build MascotNote as a shared
  component in src/components/common/ — do not copy this markup.

