# overview-bento-control-panel — decisions

> Extracted from the mockup header. **Read this instead of the HTML** — the markup is ~90% CSS you must not copy.


  PREMED HQ — OVERVIEW / HOME — APPROVED VISUAL + STRUCTURAL REFERENCE
  Status: APPROVED by Andy (July 2026). This is the target for the Overview
  build. Read alongside specifications/03-overview.md — the spec is law for
  behavior/содержание; this file shows layout, density, hierarchy, and feel.

  WHAT THIS FILE IS
  - Static HTML/CSS only. No React, no real data, no interactivity.
  - Implementation must be built from the real component library
    (see 03-overview.md §6a "Components used"), NOT by copying this markup.

  KEY DECISIONS THIS FILE ENCODES
  1. BENTO CONTROL PANEL — a 12-col grid of MIXED-SIZE panels (tall / wide-
     short / small square). A uniform stack of equal rectangles is a defect.
  2. ORDER — Hero → Smart next actions → Tasks (first working surface) →
     Where I stand → stat tiles → quick access / goals / activity → roadmap.
  3. NO "Needs attention" strip. Urgency lives on task rows + smart actions
     + the shell bell.
  4. TASKS — Now/Soon/Done TABS (not columns). Checkbox = complete (lands in
     Done). Grip = reorder WITHIN the tab only. STAR = the single
     prioritization concept; starred rows pin to an "Important" group.
     There is NO separate "Focus" strip — one concept only.
  5. GLASS JUDGMENT (04 §0c) — frosted glass ONLY on floating surfaces
     (hero cards over the banner image, the context menu). Every content
     panel, table, row, field, tab and badge is SOLID-with-depth.
  6. TYPE — Baloo 2 (display/numbers, bold) + Nunito (body). Never change.
  7. Numbers are exact, from computed selectors (06). Motion never distorts
     data.

 ══ 1. HERO — themed banner; glass cards float over it ═══════════════ 
<div class="hero">
  <div class="hill"></div>
  <div>
    <div class="hdate">Saturday, July 25 · 1:15 PM</div>
    <div class="hgreet">Good to see you again, Eric!</div>
  </div>
  <div class="hrow">
    <div class="glass cd">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span class="cdt">Free window</span>
        <span style="font-size:12px;font-weight:700;color:rgba(255,255,255,.78)">1h 45m until start</span>
      </div>
      <div class="cdn">Clinical Shift</div>
      <div class="cdc">1:44:27</div>
      <div class="cdb"><div class="cdf"></div></div>
    </div>
    <div class="glass sch">
      <div style="display:flex;justify-content:flex-end">
        <span style="font-size:12px;font-weight:800;color:var(--pri);font-family:'Baloo 2'">Connect</span>
      </div>
      <div class="tl"><div class="tlf"></div><div class="tlm"></div></div>
      <div class="schr past"><span>9 AM &nbsp; CHEM 101 Lecture</span><span>9:50 AM</span></div>
      <div class="schr past"><span>11 AM &nbsp; Neuroscience Seminar</span><span>12:15 PM</span></div>
      <div class="schr"><span>3 PM &nbsp; Clinical Shift</span><span>7:00 PM</span></div>
    </div>
  </div>
</div>

<div class="bento">

  <!-- ══ 2. SMART NEXT ACTIONS — full width, 3 across ═══════════════════ 
