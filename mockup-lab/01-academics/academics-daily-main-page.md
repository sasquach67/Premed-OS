# academics-daily-main-page — decisions

> Extracted from the mockup header. **Read this instead of the HTML** — the markup is ~90% CSS you must not copy.


  ACADEMICS — DAILY MODE → CLASS CENTER — APPROVED VISUAL REFERENCE
  Status: APPROVED (July 2026) after review. This is the target for the
  Academics Daily main page. Spec: tabs/01-academics.md.

  RELATED APPROVED MOCKUPS
   · mockups/03-overview/overview-bento-control-panel.html  — the design language
   · mockups/_shared/nav-hierarchy-3-levels.html       — the 3-level nav rule

  DECISIONS THIS FILE ENCODES  (all also written into the specs)
  1. NAV = 3 levels, 3 forms (01 §4b-i): glass mode pill on banner →
     underline tabs on banner edge → solid filter bar (term = Select).
  2. BANNER CARRIES STATS. No "Foundation" crumb, no subtitle line.
     ONLY VARIABLE metrics go in the banner strip — things that change
     (term GPA, cumulative, due today, streak). Fixed facts (credits)
     do NOT earn the space.
  3. HEADS UP = the same component as Overview's Smart next actions.
     Dismiss animates out; last dismissal unmounts the whole widget.
  4. CLASS CARDS: at REST no left bar + neutral border (class identity =
     small colored dot). On HOVER the left bar ignites + full border and
     glow turn the class accent + card lifts + the deadline line swaps to
     "Open class hub →". Hovering the Review button leaves the
     card UNLIT so the two click targets never compete.
     ONE primary action (Review) + overflow (⋯). No instructor/meeting
     clutter. Cards WRAP. "8 of 18 topics ready" — one line, one bar.
  5. STUDY TOOLS LIVE ON/IN THE CLASS, never floating on the page —
     a tool with no class selected has no subject.
  6. WHERE YOU'RE WEAK is EXAM-SCOPED by default (topics filtered to the
     next exam's unit range), toggle → "All topics" grouped by class.
     Organised by TOPIC, not class: a class isn't actionable, a topic is.
  7. UP NEXT = dynamic "biggest thing on your plate" (exam / presentation
     / deliverable) with a build-a-plan CTA that routes to the owner.
  8. PACING / PROJECTIONS are a first-class treatment: "at THIS RATE →
     THIS OUTCOME by THIS DATE", computed deterministically, never
     guessed. RESTRAINT: max ONE pace line per panel, only where a
     projection changes what you'd do. Each is DISMISSIBLE and collapses
     to a "Show projection" pill (never deleted). Global toggles exist.
  9. Removed: MCAT content-coverage panel, generic "Due soon" list,
     floating quick-capture, cross-class study-tool panel.

  GLASS (04 §0c): frosted glass ONLY on the mode pill + banner stat strip
  (they float over banner art). Every panel/row/card/field is SOLID.
  Build from library components (see 01-academics.md §7a), not this markup.

 ══ BANNER ═══════════════════════════════════════════════════════════ 
<div class="ban">
  <div class="bantop">
    <div class="h1">Academics</div>
    <div style="display:flex;align-items:center;gap:11px">
      <!-- VARIABLE stats only. Credits (fixed) deliberately excluded. 
 ══ LEVEL 3 — filter bar ═════════════════════════════════════════════ 
<div class="fbar">
  <div class="sel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18"/></svg><span class="v">Fall 2026</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg></div>
  <div class="srch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg>Find a class, note, topic…</div>
  <span class="count">5 classes</span>
  <div class="segsm">
    <div class="ss on"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>Cards</div>
    <div class="ss"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>List</div>
  </div>
</div>

<div class="wrap"><div class="bento">

  <!-- HEADS UP — same component as Overview Smart next actions 

## Behaviour

- The filter bar is controls, not a fourth navigation level: term is a Select,
  search narrows the current term, and Cards/List changes only the collection
  presentation. The mode pill and underline tab flow remain unchanged.
- Class cards are shared record-open surfaces. A card opens its class hub;
  `Review` begins review without lighting or opening the card; overflow holds
  secondary class-scoped actions. Cards wrap rather than create horizontal
  scrolling.
- A pane with insufficient honest data is absent or explains its dormancy. The
  bento never substitutes mock counts, zero charts, or invented projections.

## Appearance

- The hierarchy is banner and three navigation forms, then a solid filter bar,
  then a breathable 12-column bento. “Heads up” sits before the class grid;
  cards remain a distinct collection rather than a stack of full-width rows.
- Use the signed-in warm-dark ladder from `_shared/_visual-recipes.md`:
  page field → solid card → muted nested object → border. Panel corners follow
  the shared card recipe; class cards use the shared 13px record-card recipe.
- Only the mode pill and banner stat strip answer **yes** to the glass test.
  Class cards, filters, bento panels, rows, and fields are solid with depth.
- Hover/selection follows the shared `.15s cubic-bezier(.16,1,.3,1)` recipe:
  the card lifts and its left accent ignites only when the card itself is the
  target. Focus is `:focus-visible`; reduced motion removes the lift/glow
  movement while preserving the state change. At narrow widths cards wrap to
  fewer columns and bento spans stack without clipping the filter controls.
