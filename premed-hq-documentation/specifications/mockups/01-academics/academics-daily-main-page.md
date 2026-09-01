# academics-daily-main-page — decisions

> **Aug. 29, 2026 authority amendment — approved by Andy:** class cards have one direct **Open** action and no preview layer, Review action, or Quiz me path. The Daily bento uses Recent study work, Class materials, assignment planning, Topic coverage, and Lecture journal activity. Any conflicting historical note below is superseded.

> Extracted from the mockup header. **Read this instead of the HTML** — the markup is ~90% CSS you must not copy.

> **Visual audit (Aug. 26, 2026):** Variant A is APPROVED as the mockup
> reference. This approval is separate from implementation evidence and does
> not mark the page BUILT.


  ACADEMICS — DAILY MODE → CLASS CENTER — APPROVED VISUAL REFERENCE
  Status: APPROVED (Aug. 26, 2026 visual audit). This is the target for the
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
  4. CLASS CARDS: a compact, equal-height record collection. Each card leads
     with course title + subtitle, a compact status row, one labelled
     coursework-progress visual (completed and remaining tracked work), one real next
     dated item, and a direct Open action. Class colour is
     visible at rest as a restrained left rail and top aura, never a full-card
     wash; hover/focus strengthens the rail, border, glow, and lift, and reveals
     the secondary ellipsis menu. Four wider records lead at the desktop
     reference width; Add class is the single strong blue action in the section
     header instead of consuming a course slot. Missing grade, completion, or
     date evidence is named and routes to the class-owned add path.
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

## Later app annotations — authoritative (Aug. 24, 2026)

Andy restored the original Class Center card hierarchy in app commit
`3accbee`. These rulings are the source of truth for every future fidelity or
promotion pass. They supersede the Aug. 23 compact/no-percent/no-progress/
no-Review experiment below.

- **Footprint:** the class collection sits in a sensible max-width rail instead
  of floating across an empty canvas. Cards remain compact, equal-height, and
  responsive: four wider records lead at the desktop reference width and wrap
  to two, then one. Add class belongs in the section header rather than taking
  a record slot. Do not manufacture a blank middle zone.
- **Colour:** the course dot is paired with a restrained class-colour left rail
  and top aura at rest; hover/focus can add the stronger edge and glow. Keep the
  surface layered and readable, with the global blue reserved for Add class.
- **Information:** show course code/name, an entered letter standing or factual
  in-progress state, and the exact computed grade percent only when grade
  evidence exists. Compact chips may name factual record state; one latest
  class record may identify a linked lecture, note, material, or returned-work
  event. A labelled coursework-progress visual shows completed tracked work and
  the remaining count for that class; this is a prioritization signal, not a
  topic count, grade, or claim that the whole course is complete. Its denominator
  is the class's current tracked assignments and reading tasks: submitted or
  graded records count as complete, while dropped records are excluded. The next item appears only when it is a
  real dated class record. Missing grade, completion, or date evidence is
  named. These are facts about the record, never a score, rank, readiness
  judgement, or composite.
- **Actions:** clicking the record still opens the Center Peek. The restored
  `Review` action appears in the card's hover/focus action rail and remains in
  overflow/context paths; its play triangle is solid white. Hovering Review
  itself does not light the parent card.
- **Honest absence:** when the course has no dated item, say so plainly and
  offer the class-owned add/import route. Do not substitute a demo deadline,
  percent, review count, or progress fact.

### Historical note — superseded Aug. 24

The Aug. 23 compact-card experiment removed card percent, topic progress, and
the Review rail and used fixed equal tiles. It is retained as decision history
only; it is not a future implementation target.

## Promotion status — reopened Aug. 24, 2026

Daily · Class Center is **approved, not built**. The prior promotion record
proved controls and persistence, but it did not prove visual parity. Andy's
side-by-side review found that the app still reads flatter and more neutral
than the approved drawing: the layered warm-dark bento, panel hierarchy,
class-accent effects, and dense overall composition have not been faithfully
translated.

The previous focused test and production-build results remain useful
behavioural evidence only. They are not visual-acceptance evidence.

Before the page can be promoted again, the actual app must be compared
side-by-side with this approved drawing and visibly preserve all of the
following:

1. The literal banner treatment, including its layered warm-dark gradient and
   glass only on the mode pill and stat strip.
2. The dense solid-surface bento hierarchy: filter bar, Heads up, class grid,
   Recent study work, Class materials, Up next, GPA, and supporting panels.
3. The course-card rest, hover, and focus states: neutral rest surface with a
   small identity dot; class-colour rail, border, lift, and glow only on card
   hover/focus; and the direct Open rail beside overflow.
4. The mockup's restrained class colours and nested warm-dark depth, without a
   permanent colour wash or generic blue replacement.

Do not re-mark this page `built` until Andy accepts a live side-by-side visual
check in addition to the six functional promotion conditions.

### Visual acceptance — Aug. 25, 2026

Andy accepted the current live **Variant A — Approved bento** visual treatment.
This closes the student-owned visual-acceptance portion of promotion condition
1 for Daily · Class Center. It does **not** promote the page: the separate
first-use, control, reload, integration, and provenance proofs remain required
under `T1-academics-first-use-promotion-49.md`.

### Variant ruling — A selected Aug. 24, 2026

Andy selected **Variant A — Approved bento** as the only Class Center visual
target. Its mixed-size, information-dense control-panel composition is the
reference; Variant B's study-cockpit emphasis and Variant C's class-first
canvas remain comparison history only. This ruling does not permit removing
newer app-specific annotations or working record facts. The implementation must
combine them with A's layout, depth, and interaction treatment.

## Behaviour

- The filter bar is controls, not a fourth navigation level: term is a Select,
  search narrows the current term, and Cards/List changes only the collection
  presentation. It is a light inline row with breathing room, not a heavy
  enclosing rectangle. The mode pill and underline tab flow remain unchanged.
- Class cards are shared record-open surfaces. Their primary action previews or
  opens the class hub; `Review` is offered only after that record interaction
  or from overflow. Overflow holds other secondary class-scoped actions.
  Cards reflow to fewer equal columns rather than create horizontal scrolling.
- A pane with insufficient honest data is absent or explains its dormancy. The
  bento never substitutes mock counts, zero charts, or invented projections.

## Appearance

- The hierarchy is banner and three navigation forms, then a light inline filter
  row, then a breathable 12-column bento. “Heads up” sits before the class grid;
  the class collection is a centered, max-width panel with equal-height cards
  rather than a full-width wall. Cards use title, status, coursework progress,
  one next item, and Open as the scan path.
- Use the signed-in warm-dark ladder from `_shared/_visual-recipes.md`:
  page field → solid card → muted nested object → border. Panel corners follow
  the shared card recipe; class cards use the shared 13px record-card recipe.
- Only the mode pill and banner stat strip answer **yes** to the glass test.
  Class cards, filters, bento panels, rows, and fields are solid with depth.
- Hover/selection follows the shared `.15s cubic-bezier(.16,1,.3,1)` recipe:
  the card lifts, its left accent ignites, and the ellipsis menu appears only
  when the card itself is hovered or focused. Focus is `:focus-visible`;
  reduced motion removes the lift/glow movement while preserving the state
  change. At narrow widths the filter row stacks first, then cards stack cleanly
  without clipping controls or growing into full-width dashboard rows.

## Composition refinement — Aug. 31, 2026

This mockup-only revision follows Andy’s visual direction while keeping the
approved Daily behavior and information architecture intact. The filter row is
now an inline control line; the class panel is constrained to a centered rail;
cards are shorter and equal-height; class colour appears as a restrained rail
and top aura; Add class carries the strongest action weight; and the ellipsis is
hidden until hover/focus. The visible card content is intentionally condensed
  to title, status, coursework progress, one next item, and Open. The progress
  ring communicates tracked work completed versus remaining so the student can
choose which class needs attention next; it does not claim topic mastery.
Approval status remains
separate from any later app implementation evidence.

## Stage-A proposed product views — 2026-08-29

These review canvases are **PROPOSED** and require Andy’s approve / deny /
comment decision. They do not change the approved populated Class Center.

- `contacts`: current-term `Person` records stay a compact supporting bento;
  each row keeps its class source and one direct class/office-hours action.
- `class-peek`: selecting a class opens a lean record preview with exactly two
  handoffs, **Expand Class Hub** and **Split beside Class Center**. It does not
  duplicate the five-tab hub.
- `how-to-study`: the revisitable guide states the four real workflow moments:
  syllabus, transcript-first capture, selected-source study work, and recall.
- `walkthrough`: a four-step spotlight moves across the real Daily shell. It is
  skippable, replayable, keyboard-safe, and reduced-motion safe; one teaching
  note appears at a time.

Appearance follows the approved Daily ladder literally: banner glass only,
solid card and muted nested surfaces, 16px panels, 13px record surfaces, compact
Baloo headings and Nunito body copy. Desktop uses the bento/supporting rail;
narrow widths stack without clipping actions or the walkthrough spotlight.
