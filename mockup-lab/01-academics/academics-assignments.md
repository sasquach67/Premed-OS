# academics-assignments — decisions

> Extracted from the mockup header. **Read this instead of the HTML** — the markup is ~90% CSS you must not copy.


  ACADEMICS — DAILY MODE → ASSIGNMENTS — APPROVED VISUAL REFERENCE
  Status: APPROVED (July 2026). Spec: tabs/01-academics.md §4.1-H.

  SCOPE RULE (LOCKED)
  Anything tied to a CLASS lives here — assignments, exams, quizzes, labs,
  presentations, papers, projects. A course link is REQUIRED.
  Anything NOT tied to a class (advisor meeting, scholarship deadline,
  research symposium, personal errand) belongs to OVERVIEW → Tasks.
  One rule, no overlap, nothing lost: if it has a class, it is here.

  RELATED
   · mockups/01-academics/academics-daily-main-page.html — the sibling Daily tab
   · mockups/_shared/nav-hierarchy-3-levels.html   — the 3-level nav rule
   · mockups/03-overview/overview-bento-control-panel.html — design language

  WHY NOT A TABLE (the original Notion-derived design)
  A table is optimised for COMPARING and EDITING many records across many
  fields. Assignments are TIME-ANCHORED COMMITMENTS — the dominant question
  is "what's coming and how bad is it", which a table answers poorly because
  urgency isn't visible; you must read and mentally sort every date.
  The table is kept, but demoted to an overflow action ("Edit as table")
  where its real strengths live: bulk entry and bulk grade updates.

  DECISIONS THIS FILE ENCODES
  1. AGENDA IS THE DEFAULT. Cards bucketed Overdue → This week → Next week →
     Later → Completed. Position encodes urgency; you never read a date to
     know what's urgent.
  2. THREE VIEWS ONLY in the switcher: Agenda · Weekly · Calendar.
     (Was five. Workload and Table were pulled out — see 3 and 4.)
  3. WORKLOAD IS NOT A VIEW. It sits at the BOTTOM of the page as its own
     panel titled "Projected workload" — one
     row per week reading "This week — Heavy — 44%". Collapsible.
  4. TABLE MOVED TO THE ⋯ OVERFLOW as "Edit as table".
  5. ADD IS THE PAGE'S PRIMARY ACTION — large accent button in the banner
     labelled "Add assignment" with a ⌘N hint, PLUS a dashed add-row at the
     bottom of the list so it's reachable without scrolling up. Users must
     immediately understand this is where due dates get entered.
  6. VOLUME CONTROL (assignments get overwhelming): buckets are collapsible,
     each caps visible rows with "+N more →", and Completed is collapsed by
     default behind a count.
  7. Every row: what it is · which class · type · when · what it's worth.
     Exams carry their readiness ("4 of 9 topics ready").

  GLASS (04 §0c): frosted glass ONLY on the mode pill + banner stat strip.
  Every panel, row, card, and field below is SOLID-with-depth.
  Build from library components (01-academics.md §7a), not this markup.

 ══════════ DEFAULT: AGENDA ══════════ 
<div class="vlabel"><span class="vlt">Assignments — Agenda</span><span class="tag" style="background:color-mix(in srgb,var(--success) 18%,transparent);color:var(--success)">default view</span></div>
<div class="vnote">Time buckets, not dates — position encodes urgency. <b>Add is the page's primary action</b> (banner, ⌘N) with a second dashed add-row at the bottom of the list. Buckets collapse and cap; Completed is collapsed by default.</div>

<div class="ban">
  <div class="bantop">
    <div class="h1">Academics</div>
    <div style="display:flex;align-items:center;gap:12px">
      <div class="bstats">
        <div class="bs"><span class="bsv" style="color:#f0a08f">2</span><span class="bsl">Overdue</span></div>
        <div class="bs"><span class="bsv" style="color:#f0c68a">4</span><span class="bsl">This week</span></div>
        <div class="bs"><span class="bsv">44%</span><span class="bsl">Grade due</span></div>
      </div>
      <div class="addbig"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>Add assignment<span class="kbd">⌘N</span></div>
    </div>
  </div>
  <div class="mswitch"><div class="mo on">Daily</div><div class="mo">Planning</div></div>
  <div class="utabs"><div class="ut">Class Center</div><div class="ut on">Assignments <span class="cnt">11</span></div></div>
</div>

<div class="fbar">
  <div class="vswitch">
    <div class="vsw on"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h10"/></svg>Agenda</div>
    <div class="vsw"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 14v6M15 14v6"/></svg>Weekly</div>
    <div class="vsw"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>Calendar</div>
  </div>
  <div class="sel"><span style="font-family:'Baloo 2';font-weight:800">All classes</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m6 9 6 6 6-6"/></svg></div>
  <div class="srch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></svg>Search…</div>
  <!-- TABLE lives here, not in the switcher 
 ══════════ ALTERNATE: WEEKLY ══════════ 
<div class="vlabel"><span class="vlt">Alternate view · Weekly</span><span class="tag" style="background:color-mix(in srgb,var(--pri) 18%,transparent);color:var(--pri)">how is my week shaped</span></div>
<div class="vnote">Same data as a week. Each day carries a plain-language <b>load badge</b> (Free / Light / Busy / Heavy); cards drag between days to reschedule.</div>
<div class="fbar" style="border-top:1px solid var(--bd)">
  <div class="vswitch">
    <div class="vsw"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 6h16M4 12h16M4 18h10"/></svg>Agenda</div>
    <div class="vsw on"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 14v6M15 14v6"/></svg>Weekly</div>
    <div class="vsw"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>Calendar</div>
  </div>
  <div class="sel"><span style="font-family:'Baloo 2';font-weight:800">◀ Week of Nov 2 ▶</span></div>
  <div class="ovf"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></div>
</div>
<div class="body"><div class="card"><div class="bd" style="padding-top:14px">
  <div class="wkgrid">
    <div class="wkcol"><div class="wkhd"><span class="wkd">Sun</span><span class="wknum">2</span></div><span class="wkbadge" style="background:#272420;color:var(--dim)">Free</span><div class="wkempty">—</div></div>
    <div class="wkcol today"><div class="wkhd"><span class="wkd">Mon</span><span class="wknum">3</span></div><span class="wkbadge" style="background:color-mix(in srgb,var(--warning) 20%,transparent);color:var(--warning)">Busy</span>
      <div class="wcard"><div class="wcbar" style="background:var(--research)"></div><div class="wct">Lab report — synaptic</div><div class="wcm">BIOL 252 · 10%</div></div></div>
    <div class="wkcol"><div class="wkhd"><span class="wkd">Tue</span><span class="wknum">4</span></div><span class="wkbadge" style="background:color-mix(in srgb,var(--success) 20%,transparent);color:var(--success)">Light</span><div class="wkempty">Nothing due</div></div>
    <div class="wkcol"><div class="wkhd"><span class="wkd">Wed</span><span class="wknum">5</span></div><span class="wkbadge" style="background:color-mix(in srgb,var(--success) 20%,transparent);color:var(--success)">Light</span>
      <div class="wcard"><div class="wcbar" style="background:var(--shadow)"></div><div class="wct">Problem set 7</div><div class="wcm">PHYS 118 · 4%</div></div></div>
    <div class="wkcol"><div class="wkhd"><span class="wkd">Thu</span><span class="wknum">6</span></div><span class="wkbadge" style="background:#272420;color:var(--dim)">Free</span><div class="wkempty">—</div></div>
    <div class="wkcol"><div class="wkhd"><span class="wkd">Fri</span><span class="wknum">7</span></div><span class="wkbadge" style="background:color-mix(in srgb,var(--danger) 20%,transparent);color:var(--danger)">Heavy</span>
      <div class="wcard"><div class="wcbar" style="background:var(--cat)"></div><div class="wct">Midterm 2 — Units 4–7</div><div class="wcm">CHEM 262 · 25%</div></div>
      <div class="wcard"><div class="wcbar" style="background:var(--clinical)"></div><div class="wct">Reading response 4</div><div class="wcm">PSYC 210 · 5%</div></div></div>
    <div class="wkcol"><div class="wkhd"><span class="wkd">Sat</span><span class="wknum">8</span></div><span class="wkbadge" style="background:#272420;color:var(--dim)">Free</span><div class="wkempty">—</div></div>
  </div>
</div></div></div>

 ══════════ ALTERNATE: CALENDAR ══════════ 

## Behaviour

- Agenda is the default and buckets class-owned work by urgency. Weekly and
  Calendar project the exact same assignment records; “Edit as table” remains
  a secondary overflow path for bulk work.
- The banner `Add assignment` action is the primary creation path, with the
  dashed list-end add row as its reachable repeat. The wording is contextual:
  assignments are **due**; exams, presentations, and other scheduled class
  events are **upcoming**, not falsely due.
- Buckets collapse, cap visible items, and keep Completed collapsed by default.
  Workload is an optional collapsible panel, never a competing primary view.

## Appearance

- The common banner stays visually identical to Daily. Below it, the solid
  filter bar carries the Agenda/Weekly/Calendar control, class filter, search,
  and overflow; it never becomes a second pill-navigation track.
- Agenda uses compact, solid urgency buckets; Weekly uses seven balanced day
  columns; Calendar uses the same solid event objects in month geometry. Each
  makes time legible by placement before a student reads the date.
- Use the shared signed-in surface ladder, panel/card radii, and border/shadow
  depth literally. Glass is confined to the banner mode pill and stat strip;
  all rows, day cells, cards, and workload treatment are solid.
- Hover and selection only change color/background at the shared quiet timing;
  keyboard focus is visible without mouse focus rings. On narrow screens,
  Agenda stays single-column, Weekly permits horizontal day exploration, and
  Calendar preserves legible event cells. Reduced motion removes drag/entry
  movement but retains the selected/view state.
