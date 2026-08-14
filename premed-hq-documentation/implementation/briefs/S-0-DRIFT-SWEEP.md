# S-0 · The drift sweep — find it AND fix it

**Paste the block below verbatim into Claude Code, in the repo root.**

> **Andy, Aug 2026:** *"the point of me doing this is so it can actually code stuff in from md that was previously added but before it was coded previously — so now I want to update it by coding the remaining parts in."*

**This prompt implements. It is not a report.** An earlier read-only version of `S-0` existed and is superseded.

**Set expectations before running it.** The grep covers the whole docs tree, but **most hits will correctly report OUT OF BOUNDARY.** The highest marker counts belong to pillars with no mockups and no code — `07-extracurriculars-board` (32), `03-clinical` (32), `05-shadowing` (28), `05-experience-pillar` (28). The drift that is actually implementable is concentrated in seven files, which is why groups A–G are ordered the way they are. **Group H is what makes the sweep provable rather than a list somebody picked.**

---

```
Scope: bring the EXISTING app code up to date with documentation rulings that
were written AFTER that code was built. Find the drift, then fix it. Do not
write a report and hand it back — implement.

Scope note: the app is src/ at the repo root. The folder premedos/ is a stale
copy CLAUDE.md says to ignore. Also ignore root rules/, spec/,
CLAUDE_CODE_HANDOFF.md, READ-ME-FIRST.md, REVISIONS-ROUND-1.md — all stale.

GATE — before changing anything mockup-driven:
Read premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md. Only
mockups whose Build? column reads YES may be built. NO or absent = skip and say
so. A mockup's own APPROVED header is not permission. Do not edit the manifest.

STEP 1 — FIND THE DRIFT.

Grep EVERY .md file under premed-hq-documentation/ — all of them, recursively,
including tabs/, architecture/, specifications/, implementation/, briefs/,
mockups/, and the root-level files. Not a sample, not only the ones named
below. Produce the complete hit list first, then work it. State the total file
count you scanned and the total number of dated rulings you found, so it is
obvious if the sweep was partial.

⚠️ Do NOT date documents by `git log` on the .md files. The docs tree was
bulk-committed AFTER most of the app was built — b37fdf0 (2026-08-09) added 173
doc files at once, bcfa581 (2026-08-10) touched 60 more. Every .md reports
2026-08-09 or 08-10 regardless of when it was written. That signal is useless.

Use these two instead:

  SIGNAL 1 — in-text markers. The docs date their own rulings in prose. Grep
  for RULED / LOCKED / AMENDED / AMENDMENT / SUPERSEDED / REOPENED /
  CORRECTION / REVISED / revised / added / CUT / DEFERRED / CLOSED near
  "Aug 2026", "August 2026", or "Aug. 11, 2026".

  SIGNAL 2 — when the code was written. `git log` on src/ IS reliable:
    Academics (class center, assignments, class hub, AI layer + coverage
      ledger, generation policy, visual recipes, craft audits) . 2026-07-27→29
    Shell (InfoTip, WeeklyCapacity, capacity claims, class-hub banner) 08-08→09
    Overview tasks + Timeline narrowing (S6 brief) ................... 08-09
    Public layer + brand rename ................................ 08-09→08-10
    Generation Phase 0 (4bc3efa) ..................................... 08-11

An Aug-2026 ruling governing a July surface is drift. Fix it. A July ruling
against July code is not — leave it alone.

⚠️ Two files the grep will NOT surface, for opposite reasons:
  • tabs/01-academics.md has ZERO Aug-2026 markers — its own spec is stable.
    So Academics drift lives entirely in the GLOBAL files it inherits from.
    Check Academics against general.md, 00-product-shell,
    01-shared-interface-patterns, and 04-visual-craft-standards specifically.
  • architecture/02-global-intelligence-framework.md has ZERO Aug-2026 markers
    across 6,062 lines and 275 headings. It has not drifted — the question is
    whether it was ever implemented. Assess it section by section and implement
    what is missing, EXCEPT anything that would create a new undesigned
    surface (see the boundary below).

STEP 2 — IMPLEMENT.

Work in this order, ONE COMMIT PER GROUP, conventional commit messages:

  A. general.md's universal rules. U-10, U-11, U-12 and U-13 were ALL locked in
     Aug 2026 — none existed when Academics or Overview were built. Audit both
     surfaces against all four and fix violations. Highest value:
       U-13 — a fact about the record is allowed, a judgement about the person
         is not. Anything ranking, scoring, or calling the student's work weak.
       U-10 — manual first. Nothing auto-parsed, auto-filed, or auto-summarised
         on arrival. AI proposes and waits; it is never a state the app is in.
       U-9  — nothing scored, ranked, or compared. No invented composites.
       U-5  — insufficient data means dormant with a reason, never a zero and
         never an empty chart.
  B. specifications/03-overview.md — 16 Aug-2026 rulings over a surface built
     in July. Implement each. The bento mockup is Build? = YES.
  C. specifications/00-product-shell.md — 10 markers plus the Aug 11 §7.2
     sidebar amendment (merged hover-overlay sidebar, no rail, no width peek,
     opacity-only ~520ms reveal, ⌘B to pin). ⚠️ Its reference mockup
     00-shell/sidebar-merged-remock.html has NO manifest row — per the gate,
     skip the sidebar and report it. Implement the other shell rulings.
  D. specifications/01-shared-interface-patterns.md — the global patterns.
     Implement or de-fork: §2 center-peek, §3 the five core inspector sections,
     §4b-i three-level nav, §4b-ii banner compaction, §4c context menu (no item
     may exist without a visible equivalent), §4d pacing, §4e card states,
     §4f MascotNote, §4f-i InfoTip, §5c layout discipline.
  E. tabs/11-timeline-tasks.md — two narrowing passes. S6's Groups 0–2 shipped
     on 08-09; Groups 3 (narrow Timeline to the roadmap) and 4 show no commit.
     Audit against briefs/S6-tasks-to-overview.md and finish what is missing.
     Verify Group 2a's parity table field by field — c01d0c3 touched only one
     file, which is thin for a thirteen-field acceptance test.
  F. implementation/deferred.md — 18 markers. For each: still open, now done,
     or silently done by the code anyway. Implement anything ruled and unbuilt.
  G. architecture/02-global-intelligence-framework.md — implement the missing
     deterministic pieces that attach to surfaces that already exist.
  H. EVERYTHING ELSE THE GREP FOUND. Groups A–G are the priority order, not
     the scope. Work the remaining hits from Step 1 in descending order of
     marker count. Do not stop when A–G are done — A–G are where the drift is
     densest over already-built surfaces, but the sweep is the whole tree.
     For every remaining ruling, one of three outcomes, all reported:
       IMPLEMENTED — with the commit
       OUT OF BOUNDARY — names a surface with no approved mockup, or is
         blocked by the gate. Say which.
       NEEDS A RULING — the doc is silent or two docs contradict. Name both.
     A ruling you neither implemented nor explained is a failed sweep.

THE BOUNDARY — do not cross it:
- Do NOT build a surface that has no approved mockup. Extracurriculars,
  Shadowing, Research, Volunteering, Letters, Essays & Story Bank, School List,
  Timeline's redesign, Profile/CV, Help, Settings, Atlas — none are drawn. A
  complete spec is not a design. tabs/08-school-list.md was finished this week
  and is the sharpest example: full spec, zero drawings, no manifest row.
- Do NOT rewrite working code. Fix the drift, nothing else.
- Do NOT change tokens, the theme system, fonts, mascot assets, the auth-sync
  layer, or anything on CLAUDE.md's MUST-NOT-CHANGE list.
- Do NOT change --primary, --ring, --sidebar-*, or --cat-gpa — _visual-recipes
  says the signed-in app deliberately keeps the old blues.
- Do NOT alter a localStorage shape without a versioned, lossless migration.
- Do NOT copy inline CSS, colour, font, or radius from any mockup. Tokens only.
- Do NOT fork a component that exists in component-inventory.md.
- Do NOT invent a percentage, score, or composite metric.
- If a doc is silent, ambiguous, or two docs contradict: STOP and ask. Name
  both files and both claims. Never guess, never fill the gap.

VERIFY before each commit: npm run test and npm run build pass · signed-out
mode fully functional · both themes render · keyboard-only and reduced-motion
work · every empty state is a friendly one-liner, never a blank void.

REPORT at the end: total .md files scanned and total rulings found · what you
changed per group · what you skipped on the gate · what you stopped and need a
ruling on · every Group H ruling with its outcome.
```

---

## Follow-ups

> **If it only did the named files:** `Group H says the scope is the whole tree, not groups A–G. Report the total .md count you scanned and the total rulings found, then account for every remaining ruling as IMPLEMENTED, OUT OF BOUNDARY, or NEEDS A RULING.`

> **If it started building undrawn surfaces:** `That surface has no approved mockup and no manifest row. A complete spec is not a design. Revert it and report it as OUT OF BOUNDARY.`

> **If it rewrote working code:** `You rewrote code that was not drifting. The scope is rulings that postdate the surface they govern. Revert anything outside that and re-commit.`

> **If it flattened something:** `04 §0 directive 1 says "make it flat/plain" is a DEFECT, not the goal. Re-read 04 §0c and restore the banner hero, glass over it, layered depth, soft shadows, bold Baloo headings, motion on interactive elements. Restraint targets content clutter and metaphor only.`

> **If it says done without verifying:** `Run npm run build and npm run test, load the app signed out, toggle both themes, and empty a store to see the empty state. Report what you observed — a syntax check is not verification.`
