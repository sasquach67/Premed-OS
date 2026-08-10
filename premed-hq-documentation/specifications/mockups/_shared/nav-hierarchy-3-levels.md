# academics-nav-hierarchy — decisions

> Extracted from the mockup header. **Read this instead of the HTML** — the markup is ~90% CSS you must not copy.


  ACADEMICS — NAVIGATION CHROME HIERARCHY — APPROVED REFERENCE
  Status: APPROVED (Option A), July 2026.
  Specs: specifications/01-shared-interface-patterns.md §4b-i (global rule)
         tabs/01-academics.md §4 "Mode-switch behavior"

  THE PROBLEM THIS FIXES
  The original build rendered THREE stacked rounded-pill groups on dark
  tracks — mode (Daily/Planning), tabs (5 of them), and the term picker
  (Fall 2026 / Spring 2027 / All / Archived). Identical shape + weight =
  no hierarchy. Nothing told the user which row was primary navigation
  and which was just a filter.

  THE RULE (binding, applies to any page with a mode switch)
  Three levels of chrome ⇒ THREE DIFFERENT VISUAL FORMS:
    LEVEL 1  Mode     → segmented GLASS pill, ON the banner   (loudest)
    LEVEL 2  Tabs     → UNDERLINE tabs, banner's lower edge   (no container)
    LEVEL 3  Filters  → form CONTROLS on the solid page       (quietest)
                        Select + search Input + count + Toggle Group

  ALSO ENCODED
  - Term picker is a SELECT DROPDOWN, never a pill row (must scale past
    6+ terms, and it is a filter — not navigation).
  - Only the ACTIVE mode's tabs render (Daily = 2, Planning = 3). The flat
    5-tab bar is gone.
  - Glass judgment (04 §0c): the mode pill is frosted ONLY because it
    floats over banner imagery. Underline tabs, filter bar, and every
    control below are SOLID-with-depth, no blur.
  - REJECTED alternative: mode as a vertical left sub-rail. Costs page
    width, adds a second vertical rail beside the app sidebar, and a
    two-item vertical list is awkward — verticals need length.

  This is static HTML. Build from the real library components
  (ModeSwitch, Tabs, Select, Input, Toggle Group, Badge), not this markup.

 ══ ANTI-PATTERN ═══════════════════════════════════════════════════════ 
<div class="lbl">
  <span class="lbn">Anti-pattern — do not build this</span>
  <span class="chipbad" style="background:color-mix(in srgb,var(--danger) 16%,transparent);color:var(--danger)">3 identical pill rows</span>
</div>
<div class="note">Mode, tabs, and term filter all rendered as <b>rounded pill groups on a dark track</b>. Same shape, same weight, stacked — nothing signals which level is primary navigation and which is only a filter.</div>
<div class="demo"><div class="bad">
  <div class="badmark">✕ avoid</div>
  <div class="pillrow"><div class="pill on">Daily</div><div class="pill">Planning</div></div>
  <div class="pillrow"><div class="pill on">Class Center</div><div class="pill">Assignments</div><div class="pill">Planner &amp; GPA</div><div class="pill">Requirements</div><div class="pill">Archive</div></div>
  <div class="pillrow"><div class="pill blue">Fall 2026</div><div class="pill">Spring 2027</div><div class="pill">All</div><div class="pill">Archived</div></div>
</div></div>

 ══ APPROVED ═══════════════════════════════════════════════════════════ 
