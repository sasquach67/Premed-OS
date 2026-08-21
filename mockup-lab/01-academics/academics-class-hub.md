# academics-class-hub — decisions

> Extracted from the mockup header. **Read this instead of the HTML** — the markup is ~90% CSS you must not copy.


  ACADEMICS — PER-CLASS PAGE (center peek → EXPAND) — APPROVED
  Status: APPROVED (July 2026). REVISED from the original single-bento hub —
  a semester of material does not fit on one screen. Spec: tabs/01-academics.md §4.1-I.

  RELATED: academics-daily-main-page.html (opens from a class card) ·
           academics-review-session.html (Start review) ·
           mascot-note-pattern.html · overview-bento-control-panel.html

  DECISIONS THIS FILE ENCODES
  1. FIVE SUB-TABS: Overview · Materials · Topics · Assignments · Notes,
     sharing ONE banner (crumb, class dot+code+name, compact info line,
     glass stat strip, single primary action "Start review", ⋯).
     Class info is a LINE not a panel (01 §4b-ii) — fixed facts don't earn space.
  2. OVERVIEW is a master view of THIS class — NOT a copy of Class Center
     (which is cross-class). Leads with a status row, then due-today,
     exam scope, coming up, recently-covered, grade breakdown, contacts,
     mastery trend.
  3. EXAM SCOPE: segmented bar + LABELLED legend + an on-screen explanation
     of how scope was derived. An unlabelled stacked bar was REJECTED —
     it implied proportions of something unnamed. Do not reintroduce.
  4. EVERYTHING IS GROUPED — no flat piles:
     · Materials by week/module (module header shows unit range AND study
       state), with 3-way ownership: Course / Mine / Generated.
     · Topics into unit sections in course order, each with its own progress.
     · Assignments by SYLLABUS CATEGORY (that's how the grade is computed),
       each with weight, completion, and your average in that category.
     · Notes by kind: Exam intel · Questions to ask · Priming · Lecture.
  5. TWO KINDS OF NOTES, never merged:
     · Notes tab = notes ABOUT the class (meta/intel).
     · Materials → My notes = notes ON the material (your own pages),
       tagged "Mine" and citable by the active-recall gap report.
  6. PRIMING block per Materials module — questions to hold in mind BEFORE
     reading; rolls up as a Notes category.
  7. NOTE INGEST via watched folder (Goodnotes Auto Backup → Drive/Dropbox).
     Structure INFERRED and pre-filled, confirmed ONCE, silent thereafter.
     One-way; never writes back. Unplaceable pages import flagged "confirm week".
  8. Anki decoupled — no sync chips, no scheduler. Optional "Send to Anki"
     only when AnkiConnect is detected.
  9. Study tools = ONE primary "Generate study guide" + overflow, plus
     contextual entry (a topic's ⋯ → "Quiz me on this").

  GLASS (04 §0c): frosted only on the banner stat strip. Everything else solid.
  Build from library components (01-academics.md §7a), never copy this markup.

## Remaining paper-completion states

### Behaviour

- **Professor evidence** has two honest states: dormant when the student has too little of their own returned work, and eligible when a small, dated, course-only record exists. Both show observations and returned work, never predictions or hearsay.
- **Writing → Readings** replaces the STEM Topics surface without changing the five-tab shell. Reading rows are manually set to Not started, Skimmed, or Read; list input supports paste, one-at-a-time, or this-week entry. A partial syllabus suppresses any implied reading debt.
- **Writing → Draft** keeps the real deadline beside the student’s own target, then follows outline, draft, revision, and submitted. A feedback rail only appears after repeated feedback; one note remains a normal course note.

### Appearance

- Every state reuses the existing class banner, five tabs, Baloo 2 hierarchy, and warm-dark ladder. The only glass remains the banner stat strip; all state bodies are solid `#2b2722` panels with `#322e28` inner rows and `#3c352d` borders.
- Desktop uses one broad evidence/draft stage plus a narrower boundary rail. At narrower widths the rail stacks under the main stage, without clipping tabs. Controls have visible keyboard focus; state changes are quiet and resolve directly with reduced motion.

 ══ SHARED BANNER (identical on every sub-tab) ════════════════════════ 
<div class="ban">
 <div class="crumb">‹ Class Center</div>
 <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:18px">
  <div>
   <div class="h1"><span class="cdot"></span>CHEM 262 <span class="subn">Organic Chemistry II</span></div>
   <div class="info">Dr. Elamin · MWF 10:10a · Kenan B12 · BCPM · <u>office hours, links ⌄</u></div>
  </div>
  <div style="display:flex;gap:11px;align-items:center">
   <div class="bstats">
    <div class="bs"><div class="bsv" style="color:var(--warning)">B+</div><div class="bsl">Grade</div></div>
    <div class="bs"><div class="bsv">8<span style="font-size:12px;color:rgba(255,255,255,.6)">/18</span></div><div class="bsl">Ready</div></div>
    <div class="bs"><div class="bsv" style="color:#f0c68a">2</div><div class="bsl">Due today</div></div>
    <div class="bs"><div class="bsv" style="color:#f0a08f">6d</div><div class="bsl">Midterm 2</div></div>
   </div>
   <div class="startb">▶ Start review</div><div class="ib">⋯</div>
  </div>
 </div>
 <div class="tabs">
  <div class="tb on">Overview</div><div class="tb">Materials <span class="cnt">38</span></div>
  <div class="tb">Topics <span class="cnt">18</span></div><div class="tb">Assignments <span class="cnt">9</span></div>
  <div class="tb">Notes <span class="cnt">14</span></div>
 </div>
</div>

 ══ TAB 1 — OVERVIEW ══════════════════════════════════════════════════ 
 ══ TAB 2 — MATERIALS ═════════════════════════════════════════════════ 
<div class="lab">Tab 2 · Materials — by week · ownership markers · priming per module</div>
<div class="wrap">
 <div class="fb"><span class="f on">All 38</span><span class="f">From the course 26</span>
  <span class="f" style="background:rgba(111,192,168,.16);color:var(--success);border-color:rgba(111,192,168,.4)">My notes 12</span>
  <span class="f">Generated 4</span><span class="f">Unassigned 3</span>
  <span class="f" style="margin-left:auto">By week ⌄</span><span class="f">＋ Import from Canvas</span><span class="f">＋ Add file</span></div>

 <div class="grp">
  <div class="gh"><span class="unit">Week 9</span><span class="gt">Elimination reactions</span><span class="gm">Units 6–7</span><span class="st" style="background:rgba(75,156,211,.2);color:#8fc4ea;margin-left:auto">Current</span></div>
  <div class="gr"><span class="ic">🗂</span><span style="flex:1">Lecture 16 — E1 vs E2</span><span class="own" style="background:var(--card);color:var(--dim)">Course</span><span class="kind">Slides · 42p</span></div>
  <div class="gr"><span class="ic">📄</span><span style="flex:1">Reading — Klein ch. 8.4–8.9</span><span class="own" style="background:var(--card);color:var(--dim)">Course</span><span class="kind">PDF</span></div>
  <div class="gr mine"><span class="ic mine">✎</span><span style="flex:1">Lecture 16 — my handwritten notes</span><span class="own" style="background:rgba(111,192,168,.18);color:var(--success)">Mine</span><span class="kind">Goodnotes · synced 2h ago</span></div>
  <div class="gr"><span class="ic" style="color:var(--cat)">✦</span><span style="flex:1">Study guide — Units 6–7</span><span class="own" style="background:rgba(75,156,211,.16);color:#8fc4ea">Generated</span><span class="kind">From these files</span></div>
  <div class="prime">
   <div class="ph">◈ Prime yourself <span style="color:var(--dim);font-weight:700;text-transform:none;letter-spacing:0;font-size:11px;font-family:Nunito">— questions to hold in mind before you read</span><span class="lk" style="margin-left:auto">＋ Add</span></div>
   <div class="pq">· If both E1 and E2 remove the same H, why does base strength decide which happens?</div>
   <div class="pq">· What would make a bulky base give a <i>different</i> alkene than a small one?</div>
  </div>
 </div>
 <div class="warn">◑ <b>3 files</b> from the Lecture 12 deck aren't mapped to a unit yet — they'll still be reviewed, filed under Unit 5 by position. <span class="lk">Review mapping</span></div>
</div>

 ══ TAB 3 — TOPICS ════════════════════════════════════════════════════ 
 ══ TAB 4 — ASSIGNMENTS ═══════════════════════════════════════════════ 
<div class="lab">Tab 4 · Assignments — grouped by syllabus category (how the grade is computed) + what-if</div>
<div class="wrap">
 <div class="fb"><span class="f on">By category</span><span class="f">By date</span><span class="f">Ungraded 3</span><span class="f" style="margin-left:auto">What-if calculator →</span></div>
 <div class="grp">
  <div class="gh"><span class="gt">Problem sets</span><span class="gm">15% of grade · 4 of 6 graded</span><span class="gm" style="margin-left:auto">avg <b class="d" style="color:var(--success);font-size:14px">88%</b></span></div>
  <div class="gr"><span style="flex:1">Problem set 4</span><span class="sb">Oct 24</span><span class="d" style="color:var(--success)">48 / 50</span></div>
  <div class="gr"><span style="flex:1">Problem set 5</span><span class="sb">Oct 31</span><span class="d" style="color:var(--danger)">36 / 50</span></div>
 </div>
 <div class="grp">
  <div class="gh"><span class="gt">Exams</span><span class="gm">Midterms 35% · Final 30% · 1 of 3 taken</span><span class="gm" style="margin-left:auto">avg <b class="d" style="color:var(--warning);font-size:14px">84%</b></span></div>
  <div class="gr"><span style="flex:1">Midterm 1</span><span class="sb">15% · Oct 3</span><span class="d" style="color:var(--warning)">84 / 100</span></div>
  <div class="gr" style="color:var(--dim)"><span style="flex:1">Midterm 2</span><span class="sb">20% · Friday</span><span class="d">—</span></div>
 </div>
 <div class="pace">✓ Category weights sum to <b>100%</b> · <b>37%</b> of the grade is in · standing <b>87.4% · B+</b></div>

 <div style="display:grid;grid-template-columns:1fr 400px;gap:14px;margin-top:14px">
  <div class="card">
   <div class="hd"><span class="ti">What if…</span><span class="sb">assume a score for what's left</span></div>
   <div class="row" style="padding:10px 0;color:var(--dim)"><span style="flex:1;color:var(--mut)">Locked in so far</span><span class="wcol">37%</span><span class="d" style="font-size:14px;color:var(--fg)">32.3 pts</span></div>
   <div class="row" style="padding:10px 0"><span style="flex:1">Remaining problem sets <span class="sb">(2)</span></span><span class="wcol">5%</span><span class="inp">90</span><span class="sb">%</span></div>
   <div class="row" style="padding:10px 0"><span style="flex:1">Midterm 2 <span class="sb">Friday</span></span><span class="wcol">20%</span><span class="inp" style="border-color:var(--success)">95</span><span class="sb">%</span></div>
   <div class="row" style="padding:10px 0"><span style="flex:1">Final exam <span class="sb">Dec 14</span></span><span class="wcol">30%</span><span class="inp" style="border-color:var(--success)">93</span><span class="sb">%</span></div>
  </div>
  <div class="card">
   <div class="ti">Result</div>
   <div style="display:flex;align-items:baseline;gap:10px;margin-top:8px"><span class="big" style="color:var(--success)">90.9%</span><span class="d" style="font-size:19px;color:var(--success)">A−</span></div>
   <div class="sb" style="margin-top:4px">up from <b style="color:var(--fg)">87.4% · B+</b> today</div>
   <div class="pace" style="margin-top:12px">To land an <b>A−</b> you need <b>91.6%</b> average across everything remaining — <b>63%</b> of the grade is still unearned.</div>
   <div class="sb" style="margin-top:9px">Moves cumulative <b style="color:var(--success)">3.71 → 3.74</b> · science <b style="color:var(--success)">3.68 → 3.72</b>. Hypothetical — nothing is saved.</div>
  </div>
 </div>
</div>

 ══ TAB 5 — NOTES ═════════════════════════════════════════════════════ 
