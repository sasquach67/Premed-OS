# academics-class-hub — decisions

> **Aug. 29, 2026 authority amendment — approved by Andy:** Academics Review Session, Class Plan, Forgetting Curve, review queues, Quiz me, and the Anki handoff are retired. Class Center cards open the full Class Hub directly. The Overview ends with recent source-backed study work; Topics show syllabus objectives and linked evidence. The single **Create study resources** action opens a format menu for Flashcards, Study Guide, Study Outline, or Revised Notes. Flashcards remain an inspectable Materials resource, not a review system. Any conflicting historical decision below is superseded.

> Extracted from the mockup header. **Read this instead of the HTML** — the markup is ~90% CSS you must not copy.


  ACADEMICS — PER-CLASS PAGE (center peek → EXPAND) — APPROVED
  Status: APPROVED (July 2026). Class Plan and Forgetting Curve integrations
  approved by Andy August 26, 2026. Lecture workflow revision APPROVED
  by Andy August 27, 2026. REVISED from the original single-bento hub — a semester of
  material does not fit on one screen. Spec: tabs/01-academics.md §4.1-I/K.

  RELATED: academics-daily-main-page.html (opens from a class card) ·
           mascot-note-pattern.html · overview-bento-control-panel.html

  DECISIONS THIS FILE ENCODES
  1. FIVE SUB-TABS: Overview · Materials · Topics · Assignments · Guide,
     sharing ONE banner (crumb, class dot+code+name, compact info line,
     glass stat strip, single primary action "Create study resources" + format menu, ⋯).
     The banner is an 18px rounded shared shell whose ambient hue follows the
     class's saved colour. The study-resource action remains blue across classes
     as the stable creation affordance.
     Class info is a LINE not a panel (01 §4b-ii) — fixed facts don't earn space.
  2. OVERVIEW is a master view of THIS class — NOT a copy of Class Center
     (which is cross-class). A bounded, newest-first Class journal and direct
     transcript-first panel lead as one balanced workspace. The journal shows
     about three lecture rows at once and scrolls. The capture panel creates
     the next numbered lecture from imported or pasted transcript text, then
     continues to optional evidence and study work. This is not a lecture tab.
  3. COURSE PULSE consolidates the next assignment, labelled Midterm coverage,
     material filing, and Guide suggestions into one subordinate surface.
  4. EVERYTHING IS GROUPED — no flat piles:
     · Materials by week/module (module header shows unit range AND study
       state), with 3-way ownership: Course / Mine / Generated.
     · Topics by syllabus week in course order, each week section carrying its
       own progress; unit number remains secondary course/exam-scope context.
       They are syllabus standards/objectives—the likely exam contract—not
       transcript-derived concepts. Schedule gives chronology only.
     · Assignments use the same practical task behavior as Overview Tasks—
       complete with Undo, reorder, mark important, and open/edit details—
       inside the familiar time-based agenda, permanently fixed to this course.
       A visible handoff opens the cross-class agenda, while grade categories
       and what-if stay below as secondary class-specific context.
     · Guide by kind: Exam intel · Questions to ask · Priming · Lecture
       context. It may suggest additions from confirmed syllabus facts and
       saved lecture transcripts, but every suggestion shows its source and
       requires review/edit/dismiss before saving. Materials-owned notes stay
       in Materials.
  5. TWO KINDS OF NOTES, never merged:
     · Guide = information ABOUT the class (meta/intel).
     · Materials → My notes = notes ON the material (your own pages),
       tagged "Mine" and citable by the active-recall gap report.
  6. PRIMING block per Materials module — questions to hold in mind BEFORE
     reading; rolls up as a Guide category.
  7. NOTE INGEST via watched folder (Goodnotes Auto Backup → Drive/Dropbox).
     Structure INFERRED and pre-filled, confirmed ONCE, silent thereafter.
     One-way; never writes back. Unplaceable pages import flagged "confirm week".
  8. Flashcards are a source-backed generated Materials resource. There is no
     Anki export, sync chip, scheduler, review queue, or Quiz me action.
  9. Study tools = ONE primary "Create study resources" menu with Flashcards,
     Study Guide, Study Outline, and Revised Notes.
  10. LECTURE WORKFLOW is an Overview state, never a separate product tab.
      The normal Overview is the direct transcript-first state: the journal
      shows the recent numbered record while the adjacent, equally weighted
      panel offers Import transcript or Paste transcript for today’s next
      numbered lecture. The journal window shows roughly three lecture rows at
      once and scrolls instead of lengthening the page. Selecting a saved
      lecture opens its transcript, attached material, and saved study work.
      After transcript capture, the workflow continues in order to (2) optional
      supporting evidence—file, clipboard screenshot, or textbook excerpt—and
      (3) selected-source study work. Every state retains the complete CHEM 262
      Class Hub banner and keeps Overview active; Lecture 18 is the selected
      record, never a page title or separate destination. There is no normal
      Topic picker. Titles and standards context can be inferred later; Topics
      remain syllabus objectives.
  11. COURSE LENS is optional context inside Guide—not a sixth tab or hidden
      memory. A student writes and reviews it against selected syllabus,
      learning-goal, course-material, or lecture evidence. It may guide an
      explicitly opted-in study guide and the saved output names the lens and
      its sources. It never replaces syllabus-standard Topics, supplies
      unsourced cultural or disciplinary context, or infers a lens from a
      course title. STEM courses can leave it unset.
  12. GUIDE SUGGESTIONS are proposals, never silent writes. The confirmed
      syllabus is the baseline source; saved lecture transcripts may add
      course-operational suggestions when present. Each suggestion opens its
      supporting passage/fact and must be reviewed, edited, or dismissed by
      the student. Without a transcript, syllabus and manual Guide entries
      continue normally. Material/per-topic notes remain in Materials.
  13. CLASS PLAN is integrated into the Class Hub, never exposed as its own
      Lab page or product tab. Overview places a compact course pulse after the
      lecture journal, followed by the course-specific next-useful-step groups;
      Topics rows carry the compact before / after / retain dot track beside
      the existing retrievability status. The class schedule may reorder Before
      class and Just covered, but its absence never blocks the groups. Only the
      next useful action appears, skipped steps are never scolded, and the
      entire Class Plan section disappears when every group is empty.
  14. FORGETTING CURVE is also integrated into Class Hub, never exposed as a
      standalone Lab page or product tab. The full one-topic panel replaces
      the older generic “Mastery over the semester” chart on Overview: solid
      history, dashed projection, review resets, exam line, exam-day number
      plus plain-language reading, always-visible teaching legend, widening-
      gap provenance, and honest no-history/no-exam states. Topic rows and the
      Midterm item in the course pulse are its two entry points.

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
- Overview has four calm layers in order: Class journal, one compact course pulse, Class Plan, then the full Forgetting Curve. The course pulse consolidates the actionable assignment, exam, material, and Guide facts that previously occupied six separate cards; grade detail stays with Assignments and contacts stay in the class info/Guide surfaces. Class Plan is a source-backed, course-specific panel for what comes before class, what was captured in class, and what should be reviewed after; it uses compact next-step groups with no explanatory side rail or empty zero-state group. On Topics, the nine-dot lifecycle track wraps below the existing bar/status cluster at narrow widths instead of clipping.
- The Class journal and transcript capture panel form one balanced default workspace. The journal is class-scoped by the surrounding Class Hub (no selector), ordered newest first, and capped to roughly three visible lecture rows with its own vertical scroll. The adjacent panel is comparable in height and leads with `Add transcript`, `Import transcript`, and `Paste transcript`; a compact 1 → 2 → 3 strip makes supporting evidence secondary/optional and Study work subsequent. Selecting a saved lecture exposes transcript, attached material, and generated work inside one grouped source surface. Labels and actions carry the flow instead of reviewer prose. At narrow widths the journal stacks first, keeps its bounded scroll window, and every action remains reachable. The banner glass stat strip is the only class-status strip; Overview does not repeat those metrics in its body.
- The full Forgetting Curve is the single bottom-of-Overview chart; it replaces the generic mastery trend rather than stacking a second graph. Its main plot and teaching legend occupy the broad stage, with widening gaps and local-computation provenance in a narrow rail. At narrow widths the rail stacks below and the topic picker remains full width.

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
  <div class="tb">Guide <span class="cnt">14</span></div>
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
<div class="lab">Tab 4 · Assignments — Overview task behavior, fixed to CHEM 262; course-specific grades and what-if stay below</div>
<div class="wrap">
 <div class="fb"><span class="f on">Agenda</span><span class="f">Weekly</span><span class="f">Calendar</span><span class="f">CHEM 262 only</span><span class="f" style="margin-left:auto">＋ Add assignment</span></div>
 <div class="grp">
  <div class="gh"><span class="gt">Overdue</span><span class="gm">1 item</span></div>
  <div class="gr">drag · complete · Post-lab writeup 4 · Lab · 4% · Aug 22 · important · actions</div>
 </div>
 <div class="grp">
  <div class="gh"><span class="gt">This week</span><span class="gm">2 items · estimated 3 h 20 m</span></div>
  <div class="gr">drag · complete · Problem set 6 · Problem set · 2.5% · Wed · actions</div>
  <div class="gr">drag · complete · Midterm 2 · Exam · 20% · Fri · important · actions</div>
 </div>
 <div class="pace">Completion moves to Completed with Undo; opening a row exposes editable details. Open all assignments →</div>

 <div class="support-label">Course grade context · supporting</div>
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

 ══ TAB 5 — GUIDE ═════════════════════════════════════════════════════

## Stage-A proposed product views — 2026-08-29

These canvases are **PROPOSED** extensions inside the fixed five-tab Class Hub:

- `pretest`: one-time, before-class retrieval prompts sourced from syllabus
  standards; the student may speak, type, or sketch. No score is created.
- `predict`: a saved before-class claim and confidence statement. It changes no
  readiness, weakness, review interval, or grade.
- `predict-resurface`: the original prediction returns beside named lecture
  evidence so the student can save a correction; both sources stay visible.
- `no-topics`: the populated class keeps its Topics host and routes to syllabus
  review/objective entry. Transcripts remain evidence, never Topics.
- `no-assignments`: the class-filtered assignment host remains familiar and
  routes to Add assignment or the global cross-class agenda; grade context is
  dormant until graded evidence exists.

All five views reuse the approved banner, tabs, solid depth ladder, compact
buttons, 16px panels, and source/status labels. Three-column prompts collapse to
one column on narrow screens; no control clips or moves off canvas.
