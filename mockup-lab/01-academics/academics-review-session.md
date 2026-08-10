# academics-review-session — decisions

> Extracted from the mockup header. **Read this instead of the HTML** — the markup is ~90% CSS you must not copy.


  ACADEMICS — ACTIVE RECALL SESSION RUNNER — APPROVED VISUAL REFERENCE
  Status: APPROVED (July 2026). What happens after "Start review" / "Recall".
  Spec: tabs/01-academics.md §4.1-J.

  RELATED APPROVED MOCKUPS
   · mockups/01-academics/academics-class-hub.html        — where sessions launch from
   · mockups/01-academics/academics-daily-main-page.html  — cross-class review queue → Start
   · mockups/_shared/mascot-note-pattern.html        — the teaching-note component

  DECISIONS THIS FILE ENCODES  (all written into §4.1-J)
  1. ONE MODE — "Active recall". The earlier three-mode split (quick recall /
     blurting / Feynman) was WRONG and is removed: they are one act at
     different depths. DO NOT REINTRODUCE MODES.
  2. ONE COMPOSER, three input affordances used together or alone:
     MIC (default) · KEYBOARD · IMAGE ATTACH. Andy's real method is narrating
     while drawing, so speech + an attached page is the primary path.
     Full video analysis is deliberately NOT built (cost/latency) — the
     audio transcript + the final image is the 90% solution.
  3. SCOPE IS STATED BEFORE YOU ANSWER (the "am I on the right page?" fix).
     The cue's scope chips ARE the checklist the grader uses. You are never
     marked down for something you were not asked for.
  4. OUTPUT IS A GAP REPORT, NOT A NOTES DUMP. Revealing full notes teaches
     nothing — you skim and think "I knew that". Show only: what you had,
     what you missed, what you got wrong.
  5. EVERY GAP ITEM CARRIES PROVENANCE, and it is CLICKABLE:
       · blue chip  = "from your materials" → opens the file at the cited
         passage, highlighted (Anthropic Citations returns char offsets)
       · amber chip = "general knowledge — not in your notes"
     Never silently blend the two.
  6. CONFIDENCE BEFORE REVEAL → calibration. Deterministic (predicted vs
     actual grade); works with NO API. This is the teaching layer.
  7. GRADE BUTTONS SHOW THEIR INTERVALS so FSRS is legible, not magic.
  8. ANKI IS FULLY DECOUPLED. No sync chips, no "reviewed in Anki", no
     scheduler ownership. HQ schedules every topic; Anki schedules its own
     cards. They test different grain (concepts vs facts). See §4.1 rewrite.
  9. SESSION START uses the SCENIC treatment (Andy): background art + veil,
     "9 topics up" (numeral, not a word), the FULL comprehensive queue with
     faint hairline dividers, wide primary Start + mic/settings squares.
     NO panel/card container around it. NO giant orphan numeral.
     The scene is full-strength on START and SUMMARY; it dims hard behind
     the recall card so reading never fights the art.

  GLASS (04 §0c): the scene states use translucent pills over art; the
  reading states are solid. Build from library components, not this markup.

 ══ STATE A — SESSION START (scenic, comprehensive queue) ═════════════ 
<div class="lab">State A · session start — scenic, full queue, numeral not word</div>
<div class="scene">
 <div class="sun"></div><div class="hill h2"></div><div class="hill h3"></div><div class="hill h1"></div><div class="water"></div><div class="field"></div>
 <div class="veil"></div>
 <div class="sinner">
  <div class="stop"><span class="pill">← Back to CHEM 262</span><span class="pill" style="margin-left:auto">CHEM 262 · Active recall</span></div>
  <div class="sbody">
   <div class="col">
    <div class="hero">9 topics up</div>
    <div class="facts">About <b>35 min</b> · <b>2</b> weak · <b>1</b> never reviewed</div>
    <div class="qlist">
     <div class="qr"><span class="qn">SN1 / SN2 mechanisms</span><span class="tag" style="background:rgba(232,128,111,.26);color:#f0a08f">Weak</span><span class="u">U5</span></div>
     <div class="qr"><span class="qn">E1 / E2 elimination</span><span class="tag" style="background:rgba(232,128,111,.26);color:#f0a08f">Weak</span><span class="u">U6</span></div>
     <div class="qr"><span class="qn">Conjugation &amp; dienes</span><span class="tag" style="background:rgba(92,159,212,.32);color:#a8d3f2">Never reviewed</span><span class="u">U8</span></div>
     <div class="more">+ 6 more due</div>
    </div>
    <div class="cta">
     <div class="bstart">▶ Start active recall</div>
     <div class="sq">🎙</div><div class="sq">⚙</div>
    </div>
    <div class="prefsline">Speak <b>default</b> · Interleave <b>on</b> · Weak first <b>on</b></div>
   </div>
  </div>
  <div class="mascot"><div class="ram">HQ</div><div class="mbub">Say it out loud before you look. The gap between feeling sure and actually recalling is the whole point.</div></div>
 </div>
</div>

 ══ STATE B — RECALL (scope + one composer + confidence) ══════════════ 
 ══ STATE C — GAP REPORT (cited, source drawer open) ══════════════════ 
<div class="lab">State C · gap report — only what you missed · citation clicked, source open</div>
<div class="focus">
 <div class="ftop"><div class="x">✕</div><div class="ctx"><span class="cdot"></span>CHEM 262</div>
  <div class="spine"><span class="sg" style="background:var(--success)"></span><span class="sg" style="background:var(--danger)"></span><span class="sg" style="background:var(--cat)"></span><span class="sg"></span><span class="sg"></span><span class="sg"></span><span class="sg"></span><span class="sg"></span><span class="sg"></span></div>
  <div class="meta"><span>3 of 9</span><span>12:41</span></div></div>
 <div class="stage"><div class="cardw">
  <div style="display:flex;align-items:baseline;gap:10px"><div class="topic" style="font-size:25px;margin:0">SN1 / SN2 mechanisms</div><span class="why">you spoke for 47s · 340 words</span></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:15px">
   <div class="gapc"><h4 style="color:var(--success)">✓ You had it</h4>
    <div class="gi"><span>✓</span><span>SN2 concerted, backside attack, inversion</span></div>
    <div class="gi"><span>✓</span><span>Polar aprotic favours SN2</span></div>
    <div class="gi"><span>✓</span><span>3° substrate pushes SN1</span></div>
   </div>
   <div class="gapc" style="border-color:rgba(232,128,111,.4)"><h4 style="color:var(--danger)">✕ Gaps</h4>
    <div class="gi"><span>✕</span><span>You said SN1 gives <b>inversion</b> — planar carbocation means <b>racemization</b><span class="cite">Lecture 12 · slide 9 ↗</span></span></div>
    <div class="gi"><span>✕</span><span>Never mentioned the <b>rate law</b> difference<span class="cite">Lecture 12 · slide 4 ↗</span></span></div>
    <div class="gi"><span>✕</span><span>Carbocation <b>rearrangement</b><span class="cite gen">general knowledge</span></span></div>
   </div>
  </div>
  <div class="drawer">
   <div class="dhd">📄 Lecture 12 — Nucleophilic substitution · slide 9<span style="margin-left:auto">Open file ↗</span><span>✕</span></div>
   <div class="dbody">
    <div class="slide"><div style="color:#c9d6e2;font-size:11px;font-family:'Baloo 2';font-weight:800;margin-bottom:7px">Stereochemical outcome</div>· SN2 → backside attack<br>· SN1 → planar intermediate<br><br><span style="color:var(--cat)">▸ racemic mixture</span></div>
    <div class="passage">"Because the SN1 pathway proceeds through a <span class="hl">planar carbocation intermediate, the nucleophile can attack from either face, producing a racemic mixture</span> rather than the clean inversion seen in SN2."</div>
   </div>
  </div>
  <div style="display:flex;align-items:center;gap:9px;background:rgba(231,176,106,.11);border:1px solid rgba(231,176,106,.28);border-radius:11px;padding:10px 13px;margin-top:13px;font-size:12.5px;font-weight:700;color:var(--mut)">◑ You said <b class="d" style="color:var(--fg)">Pretty sure</b> and missed 3 — that gap is the signal. Grade honestly.</div>
  <div class="g4" style="margin-top:14px">
   <div class="gr" style="border-color:rgba(232,128,111,.45)"><div class="t" style="color:var(--danger)">Again</div><div class="i">&lt; 10 min</div></div>
   <div class="gr" style="border-color:rgba(231,176,106,.4)"><div class="t" style="color:var(--warning)">Hard</div><div class="i">2 days</div></div>
   <div class="gr" style="border-color:rgba(111,192,168,.45)"><div class="t" style="color:var(--success)">Good</div><div class="i">5 days</div></div>
   <div class="gr" style="border-color:rgba(75,156,211,.4)"><div class="t" style="color:var(--cat)">Easy</div><div class="i">12 days</div></div>
  </div>
  <div class="quiet"><span>Space reveals · 1–4 grades</span><span style="margin-left:auto;border-bottom:1px dotted var(--bd)">Second opinion</span><span style="border-bottom:1px dotted var(--bd)">Add a note</span></div>
 </div></div>
</div>

 ══ STATE D — SUMMARY (scenic returns; NO Anki row) ═══════════════════ 
