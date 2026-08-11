# Sweep → build: the prompt sequence — Aug 2026

**Andy's ask:** *"first a read, and then anything that can be implemented… we did things like app-wide and whatnot before we moved onto the tabs."*

**Copy each prompt verbatim into Claude Code or Codex, in order. Do not skip `S-0` or `S-1`** — they exist to stop the later prompts from producing rework.

**This file supersedes `MOCKUP-TO-CODE-PROMPT-SEQUENCE.md` for this pass.** That file's prompts are still good, but **its gate paragraph is stale** — it says *"the two `05-public` rows are `YES`, everything else is still `NO`,"* which was true when it was written and is not true now. **An agent reading it would skip all of Academics.** Every prompt below is self-contained so that line is never in play.

---

## Step 0 — human, before any prompt

**Commit or stash the working tree first.** There are ~39 dirty paths right now: all of `src/`, `index.html`, the brand assets, plus doc edits to `general.md`, `00-product-shell.md`, `mockups/README.md`, `_visual-recipes.md`, the new `specifications/generation/` folder, `IMPLICIT-DECISIONS-AUDIT.md`, `sidebar-merged-remock.html`, and `tabs/08-school-list.md`.

**Every prompt below tells the agent to stop if it finds uncommitted work from another session.** That is deliberate — Claude Code and Codex both work in this repo — but it means the first prompt will halt immediately unless the tree is clean.

---

## ⚠️ The core question, and why `git log` cannot answer it

> **Andy:** *"ANY MD file that was recently edited and contains information that wasn't previously there when I built it using the md files the first time… I think it has to do with date."*

**The instinct is right and the obvious method fails.** The entire documentation tree was bulk-committed to git **after** most of the app was built:

- `b37fdf0` · **2026-08-09** · *"docs: add the specification system, mockup lab, and design-system pillars"* — **173 doc files in one commit**
- `bcfa581` · **2026-08-10** · the Premed OS rename — **60 more doc files**

**So every `.md` in the repo now reports its last change as 2026-08-09 or 08-10, regardless of when it was actually written.** A date-sorted `git log` over the docs returns one flat wall and tells you nothing.

### What the code timeline actually says

| Code | Built | Doc content newer than it |
|---|---|---|
| **Academics** — class center, assignments, class hub, AI layer, coverage ledger, generation policy, visual recipes, craft audits | **2026-07-27 → 07-29** | **Anything marked Aug 2026** |
| **Shell** — InfoTip, WeeklyCapacity, capacity claims, class-hub banner | **2026-08-08 → 08-09** | Aug 10–11 edits |
| **Overview tasks + Timeline narrowing** (`S6`) | **2026-08-09** — `d266b53`, `a59a6a7`, `c01d0c3` | Aug 10–11 edits |
| **Public layer + brand rename** | **2026-08-09 → 08-10** | The Aug 11 logo rev 2 / accent move |

### The signal that DOES work: in-text markers

**The docs date themselves in their own prose** — `RULED Aug 2026`, `LOCKED Aug 2026`, `AMENDED`, `SUPERSEDED`, `revised Aug 2026`, `CUT`, `DEFERRED`. That is greppable and it is the real drift signal.

**Files carrying the most Aug-2026 markers whose surfaces are already built:**

| File | Markers | Why it matters |
|---|---|---|
| `implementation/deferred.md` | 18 | The running list of what was postponed |
| `specifications/03-overview.md` | 16 | **Overview shipped in July; these rulings are later** |
| `general.md` | 14 | **`U-10`, `U-11`, `U-12`, `U-13` were all LOCKED Aug 2026 — none of them existed when Academics was built** |
| `tabs/11-timeline-tasks.md` | 18 | Two narrowing passes |
| `specifications/00-product-shell.md` | 10 + the uncommitted Aug 11 sidebar amendment | |
| `specifications/01-shared-interface-patterns.md` | 3 | Includes `§4f-i` InfoTip |
| `tabs/02-mcat.md` · `tabs/12-profile-cv.md` | 3 each | No code built yet |

**Two findings worth knowing before you read the report:**

- **`tabs/01-academics.md` carries ZERO Aug-2026 markers.** The Academics spec has been stable since July. **The drift against Academics code is in the GLOBAL files it inherits from — `general.md`, `00-product-shell`, `01-shared-interface-patterns`, `03-overview` — not in its own spec.** That is the opposite of where you would look first.
- **`architecture/02-global-intelligence-framework.md` carries ZERO Aug-2026 markers across 6,062 lines and 275 headings.** It has not drifted. **The open question there is whether it was ever implemented at all**, which is a different question and `S-0` asks it separately.

---

## The gate — paste at the top of every BUILD prompt, verbatim

`S-0` and `S-1` write no app code and do not need it. **`S-2` onward do.**

```
GATE — do this before anything else.
Read premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md.
Build ONLY mockups whose Build? column reads YES. If a mockup named in this
prompt is NO, or is absent from the manifest, skip it and say so in your
summary. Do not build it "since it's approved" — the header status in a
mockup file is not permission. Do not edit the manifest yourself.
If zero rows relevant to this prompt are YES, stop and report that.
```

**Currently `YES`:** Overview bento · all 11 Academics rows · both `05-public` pages · `_shared/nav-hierarchy-3-levels` · `_shared/mascot-note-pattern`.
**Currently `NO` or absent:** every Shell row · all Clinical · all MCAT · Volunteering · **`sidebar-merged-remock.html` (absent — see `S-2`)**.

---

## The order, and why

**App-wide before tabs**, per Andy. A tab surface built before the shell and the global patterns are conformant gets rebuilt when they land.

| # | Prompt | Writes code? | Output |
|---|---|---|---|
| **S-0** | The read — doc drift + code conformance | **No** | `implementation/briefs/W1-doc-drift-and-conformance.md` |
| **S-1** | The translation contract | **No** | `implementation/MOCKUP-TRANSLATION-CONTRACT.md` |
| **S-2** | App-wide foundation — shell, global patterns, plumbing | Yes | commits |
| **S-3** | Overview — the reference implementation | Yes | commit |
| **S-4** | Overview tasks — audit, then finish (`S6` brief) | Yes | commits |
| **S-5** | Academics · Daily | Yes | commits |
| **S-6** | Academics · Planning | Yes | commits |
| **S-7** | Generation engine · Phase 0 | Yes | ⚠️ **needs clearance — see the note** |
| **S-8** | The re-sweep | **No** | `implementation/briefs/W2-resweep.md` |

**Why Overview's layout (`S-3`) comes before its task functionality (`S-4`):** `04` §0c says the one visual language is *"defined by the approved Overview hero."* `S-3` establishes the container every later surface conforms to; `S-4`'s changes are behaviour and plumbing that slot into whatever container `S-3` built. Doing it the other way means the layout pass rewrites the task widget's markup twice.

**`S6`'s Groups 0 and 1 are pulled forward into `S-2`** as a verification step — they are shell files, and `git log` says they already shipped on 2026-08-09. `S-2` confirms they are still in place rather than rebuilding them.

**Several steps are audit-then-finish rather than build-from-scratch.** Real code exists for Academics, Overview, the shell, and the public layer. **Every prompt below that touches a built surface says so and tells the agent to audit first** — the failure mode otherwise is a confident rewrite of working code.

---

# S-0 · The read

**Read-only. This prompt must not change a single line of app code.**

```
Audit only — do NOT write, edit, or refactor any file in src/ during this task.
If you find uncommitted work-in-progress from another session, STOP and say so
before doing anything else. Claude Code and Codex both work in this repo.

Scope note: the app is src/ at the repo root. The folder premedos/ is a stale
copy and CLAUDE.md says to ignore it. Do not read it, do not reference it, do
not modify it. Likewise ignore root rules/, spec/, CLAUDE_CODE_HANDOFF.md,
READ-ME-FIRST.md, and REVISIONS-ROUND-1.md — all stale.

Read these first, in this order:
  premed-hq-documentation/AGENT-IMPLEMENTATION-GUIDE.md
  CLAUDE.md
  premed-hq-documentation/general.md
  premed-hq-documentation/specifications/04-visual-craft-standards.md (§0, §0a, §0b, §0c in full)
  premed-hq-documentation/specifications/00-product-shell.md
  premed-hq-documentation/specifications/01-shared-interface-patterns.md
  premed-hq-documentation/specifications/mockups/README.md
  premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md
  premed-hq-documentation/implementation/component-inventory.md
  premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md

Produce ONE report at:
  premed-hq-documentation/implementation/briefs/W1-doc-drift-and-conformance.md

Five sections, nothing else.

SECTION 1 — DOC DRIFT. Documentation rulings the code never caught up to.

⚠️ METHOD — READ THIS BEFORE YOU START, THE OBVIOUS APPROACH FAILS.
Do NOT date documents by `git log` on the .md files. The whole docs tree was
bulk-committed AFTER most of the app was built — b37fdf0 (2026-08-09) added 173
doc files in one commit and bcfa581 (2026-08-10) touched 60 more. Every .md
therefore reports a last-change date of 2026-08-09 or 08-10 no matter when it
was written, and sorting by it tells you nothing.

Use these two signals instead:

  SIGNAL 1 — the in-text markers. The docs date their own rulings in prose.
  Grep the docs tree, case-sensitively, for:
    RULED / LOCKED / AMENDED / AMENDMENT / SUPERSEDED / REOPENED / CORRECTION /
    REVISED / revised / added / CUT / DEFERRED / CLOSED
  each within a few words of "Aug 2026", "August 2026", or "Aug. 11, 2026".
  Every hit is a ruling with a date attached. That is the drift signal.

  SIGNAL 2 — when the corresponding CODE was written. Use `git log` on src/,
  which IS reliable, since app code was committed as it was built:
    Academics (class center, assignments, class hub, AI layer + coverage
      ledger, generation policy, visual recipes, craft audits) .. 2026-07-27→29
    Shell (InfoTip, WeeklyCapacity, capacity claims, class-hub banner) 08-08→09
    Overview tasks + Timeline narrowing — the S6 brief:
      d266b53 fix(shell): stop milestones leaking into task surfaces .. 08-09
      a59a6a7 refactor(shell): rename Timeline, add /overview/tasks ... 08-09
      c01d0c3 feat(overview): own task editing ..................... 08-09
    Public layer, brand rename ................................. 08-09→08-10

  A doc ruling marked Aug 2026 that governs a surface built in July is drift.
  Report it. A July ruling against July code is not.

Produce a table: doc file | the ruling, quoted | its stated date | the code that
implements that surface and when it was committed | MATCHES / DRIFTED / NEVER
BUILT. Cite file:line on both sides.

Start with these, because they carry the most Aug-2026 markers over surfaces
that already shipped, then continue to anything else the grep surfaces:
  implementation/deferred.md (18 markers) — the postponed list; say which are
    now done, which are still open, and which the code silently did anyway
  specifications/03-overview.md (16) — Overview shipped in July
  general.md (14) — U-10, U-11, U-12 and U-13 were ALL locked in Aug 2026.
    NONE of them existed when Academics was built. Check Academics and Overview
    against each of the four, especially U-13 (a fact about the record is
    allowed; a judgement about the person is not) and U-10 (manual first — AI
    is a verb the student invokes, never a state the app is in).
  tabs/11-timeline-tasks.md (18) — two narrowing passes
  specifications/00-product-shell.md (10, plus an uncommitted Aug 11 amendment)
  specifications/01-shared-interface-patterns.md (3)

⚠️ Two things to check that the grep will NOT surface, because the marker
   count is zero and that means something different in each case:
  • tabs/01-academics.md has NO Aug-2026 markers. Its own spec is stable. So
    the Academics drift, if any, lives entirely in the GLOBAL files it
    inherits from. Check Academics against general.md, 00-product-shell,
    01-shared-interface-patterns and 04-visual-craft-standards specifically.
  • architecture/02-global-intelligence-framework.md has NO Aug-2026 markers
    across 6,062 lines and 275 headings. It has not drifted. The question is
    whether it was ever IMPLEMENTED. Report, section by section at the top two
    heading levels: IMPLEMENTED / PARTIAL / NOT BUILT, with the code file.
    This is the single largest unassessed document in the repo — do not skip it
    and do not summarise it in one line.

Then resolve each of these specific items and say whether src/ matches:
  a. 00-product-shell.md §7.2 — an Aug 11 amendment replaces the collapsed rail
     and pin/unpin sidebar with a single merged hover-overlay sidebar. Compare
     it to src/components/layout/Sidebar.tsx and AppShell.tsx. State exactly
     which of the amendment's requirements the code does and does not meet.
  b. general.md "The logo" — a SECOND logo revision supersedes the first. The
     accent moved: --pl-pri is now #5293cc, --pl-pri-lt is #79abd7. Verify
     against src/index.css and src/components/public/public-layer.css. Report
     any remaining hardcoded rgba(111, 179, 222, …) — the doc says ten were
     found by hand and warns against an eleventh.
  c. _visual-recipes.md "Two blues" — the earlier P2 ruling is SUPERSEDED and
     explicitly says "do not implement it." Confirm no code still follows it.
  d. AGENT-IMPLEMENTATION-GUIDE.md §1 now lists specifications/generation/ as a
     governing spec. Report whether lib/academics/generationPolicy.ts exists and
     what it currently enforces.
  e. tabs/08-school-list.md was rewritten from a stub to a full spec. Report
     what School List code exists today, if any. DO NOT BUILD IT — no School
     List mockup exists and the manifest has no row for it.
  f. Anything else in the docs tree changed in the last 30 days that src/ does
     not reflect. Cite the file and the specific claim.

SECTION 2 — WHAT IS ALREADY BUILT. For every mockup whose BUILD-MANIFEST row
reads YES, find the corresponding surface in src/ and state one of:
  BUILT-CONFORMING / BUILT-DIVERGENT / PARTIAL / NOT BUILT
Name the actual file and component for anything not NOT-BUILT. Mockups whose
row reads NO or which are absent from the manifest: list them under a heading
"Not cleared — not assessed" and do not analyse them.

SECTION 3 — DIVERGENCES, RANKED. For every BUILT-DIVERGENT or PARTIAL row, one
line per divergence:
  what the mockup or spec shows | what the code does | which 04 rule it breaks
Rank 04 §0b and §0c violations first, then missing product views, then cosmetic
drift. Be specific. "Styling differs" is not a finding. "Card uses solid
bg-card with no backdrop-filter where the mockup floats glass over the banner
hero" is. Cite file:line for both sides of every claim.

SECTION 4 — APP-WIDE GAPS. Separate from per-surface work: which of the global
patterns in 01-shared-interface-patterns.md are not implemented or are
implemented twice. Check specifically §2 center-peek, §3 the five core
inspector sections, §4b-i three-level nav, §4b-ii banner compaction, §4c
context menu (and its rule that no context-menu item may lack a visible
equivalent), §4d pacing, §4e interactive cards, §4f MascotNote, §4f-i InfoTip,
§5c layout discipline. For each: IMPLEMENTED / PARTIAL / MISSING / FORKED,
with the component name.

SECTION 5 — BUILD ORDER PROPOSAL. Order the NOT BUILT and BUILT-DIVERGENT
items. One line of justification each. Note dependencies. Flag anything you
believe cannot be built because the spec is silent or two docs contradict —
name both files and both claims, and do not resolve it yourself.

Rules:
- Do not fix anything you find. Report only.
- Do not edit any mockup file, spec file, or the manifest.
- Cite file paths and line numbers for every claim in Sections 1, 3, and 4.
- Where two documents disagree, apply the precedence order in
  AGENT-IMPLEMENTATION-GUIDE.md §1 and say which one you applied.
```

**Follow-ups**

> **If it's vague:** `Sections 1 and 3 are not specific enough to act on. For every row, quote the exact doc text and the exact src/ code, with file:line for both. If you cannot find the corresponding code, say NOT BUILT rather than guessing.`

> **If it starts fixing:** `You changed files in src/. Revert those changes. S-0 is read-only — the report is the deliverable.`

> **If it read the wrong app:** `You referenced premedos/. That is a stale copy CLAUDE.md tells you to ignore. Redo the affected sections against src/ at the repo root.`

---

# S-1 · The translation contract

**Still no feature work. This produces the rulebook every later prompt cites. Skipping it is what causes ten rounds of visual rework.**

```
No feature work in this task. You are writing one document.

Read:
  premed-hq-documentation/specifications/04-visual-craft-standards.md §0a, §0b, §0c
  premed-hq-documentation/implementation/component-inventory.md
  src/index.css  (the real design tokens)
  src/components/public/public-layer.css
  premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md
  premed-hq-documentation/implementation/briefs/W1-doc-drift-and-conformance.md

Write: premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md

It answers one question: when a mockup and the app's design system disagree,
what happens? 04 §0a gives the principle —

  "The mockup is right about what goes where and how it behaves;
   the app's design system is right about how it looks."

Turn that into a mechanical checklist a future session follows without
judgment calls. Cover at minimum:

1. TOKENS. A table mapping every hardcoded hex, radius, and font-size that
   appears across the mockup sources to the real CSS variable in src/index.css.
   Build it by actually reading the mockup <style> blocks, not by assuming.
   Every row cites the mockup file it came from.
   ⚠️ Include the Aug 2026 accent move: --pl-pri #5293cc, --pl-pri-lt #79abd7,
   alpha uses via --pl-pri-rgb. Any mockup still drawn against #6fb3de is
   pre-revision and the TOKEN wins, not the drawing.
   ⚠️ The signed-in app's --primary, --ring, --sidebar-* and --cat-gpa are
   DELIBERATELY still on the old blues and are on CLAUDE.md's locked list.
   Do not unify them. Say so in the contract so nobody "fixes" it.
2. COMPONENTS. For each recurring mockup pattern (stat strip, sub-tab underline
   nav, expandable row, inline add row, contact card, banner hero, glass card,
   mascot note, InfoTip, tracker table, center-peek, kanban), name the ONE
   existing component from component-inventory.md. Where none exists, mark it
   NEW — do not invent a name. 04 §0b: two components doing one job is a defect.
3. GLASS. 04 §0c is conditional — glass on surfaces floating over the banner or
   overlaying content; solid-with-depth on dense content and data surfaces.
   State it as a yes/no question a builder answers in one look.
4. WHAT A MOCKUP MAY NEVER DICTATE. At minimum: fonts, palette, radii, spacing
   scale, icon set, its own inline CSS, and any component it hand-rolled that
   already exists in the library.
5. WHAT A MOCKUP IS ALWAYS AUTHORITATIVE ON. At minimum: which elements exist,
   their order and grouping, product-view structure, interaction flow, empty
   and partial states, and copy shown in the drawing.
6. DATA THAT DOES NOT EXIST YET. Mockups draw populated screens. The rule: a
   surface ships with its real empty state from 01 §8 / 04 §9, never with
   placeholder or invented data. 04 §0 directive 5 requires realistic content
   in DESIGN; it does not license fake data in the APP.
7. THE FLATNESS GUARD, stated as a rule rather than a warning. 04 §0 directive
   1 says "make it flat/plain" is a DEFECT, not the goal. Restraint targets
   content clutter and metaphor only — never depth, motion, or richness.

Then append this line to
premed-hq-documentation/specifications/mockups/CLAUDE-HANDOFF.md, replacing the
"Do not implement these mockups" bullet under Preservation and honesty rules:

  - Mockups ARE now being implemented in the app, per
    implementation/briefs/W1-SWEEP-PROMPT-SEQUENCE.md (Andy, Aug 2026).
    Implementation reads the mockups; it never edits them. The mirror in
    specifications/mockups/ is the read source.

Change nothing else in that file.
```

**Follow-ups**

> **If the token table is guessed:** `Your token table does not match src/index.css. Re-derive it by reading the <style> block of at least five mockup sources and src/index.css side by side. Every row must cite the mockup file it came from.`

> **If it invents component names:** `You named components that do not exist in component-inventory.md. Every entry must cite a real component or be marked NEW. Guessing a name causes a fork, which 04 §0b calls a defect.`

---

# S-2 · App-wide foundation

**This is the "app-wide before tabs" pass. Nothing here is a tab surface.**

```
[PASTE THE GATE PARAGRAPH HERE]

Scope note: the app is src/ at the repo root. Ignore premedos/.

Read:
  premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md
  premed-hq-documentation/implementation/briefs/W1-doc-drift-and-conformance.md
  premed-hq-documentation/specifications/00-product-shell.md
  premed-hq-documentation/specifications/01-shared-interface-patterns.md
  premed-hq-documentation/specifications/04-visual-craft-standards.md
  premed-hq-documentation/general.md — the universal rules U-1 to U-13
Mockups (both are Build? = YES; Variant A only):
  specifications/mockups/_shared/nav-hierarchy-3-levels.html + .md
  specifications/mockups/_shared/mascot-note-pattern.html + .md

⚠️ GROUPS A AND B WERE ALREADY SHIPPED on 2026-08-09 — commits d266b53
(fix(shell): stop milestones leaking into task surfaces) and a59a6a7
(refactor(shell): rename Timeline, add /overview/tasks). VERIFY them against
the descriptions below; do NOT rebuild them. Report anything that regressed or
was only partly done, and fix only that.

Work in this order, one commit per group.

GROUP A — VERIFY ONLY unless broken. Roadmap milestones are rows in data.tasks
with milestone:true, and every reader of tasks must filter them out. Two did
not:
  1. attention.ts ~line 93 — data.tasks.map((task) => deadlineItem(...)) has no
     !task.milestone filter, so a dated milestone shows in the Attention bell as
     a deadline labelled "Open task". Add the filter.
  2. CommandSearch.tsx ~line 60 — for (const row of store.tasks) has no filter,
     so milestones are returned as task records in search. Add the filter.
Readers that already do it right, for reference: overview.ts:65, Timeline.tsx:77.
⚠️ These are GUARDS, not the fix. The fix is S7 (splitting TaskItem) and is out
of scope. If you find a THIRD reader needing this filter, add it and REPORT it
— the count is the argument for S7.

GROUP B — VERIFY ONLY unless broken. Routes and naming.
  3. routes.tsx — id 'timeline' label 'Timeline & Tasks' becomes 'Timeline'.
     Tagline 'The cycle as a graphic + your assignment tracker.' becomes
     'The roadmap for your whole premed journey.'
  4. Add the /overview/tasks sub-route. Full screen, inside Overview. Pattern to
     copy: /academics/classes/:courseId. NOT a sidebar entry (nav: false), NOT
     a CenterPeek.
  5. /overview/tasks renders THE SAME COMPONENT as the widget at a larger size
     (03-overview.md §6.4: "one list at two sizes, not two implementations").
     Do not fork a second task list. The expanded view adds room to filter and
     search and NOTHING the widget lacks. If you find yourself adding a
     capability to only one, stop and ask.

GROUP C — the global patterns (commit: feat(shell): global interaction
patterns). Using W1 Section 4 as the worklist, bring these into conformance.
Implement each ONCE, as a shared component; configure, never fork:
  • 01 §2 center-peek record-open model, with expand and split
  • 01 §3 the five core inspector sections, consistent across every entity
  • 01 §4b-i three-level nav in its three forms — build from
    _shared/nav-hierarchy-3-levels.html, Variant A
  • 01 §4b-ii banner compaction + variable-metrics-only stat strip
  • 01 §4c right-click context menu. Binding rule: no context-menu item may
    exist without a visible equivalent elsewhere. Right-click is undiscoverable
    and unavailable on touch. Long-press is the touch equivalent.
  • 01 §4e interactive card states
  • 01 §4f MascotNote — build from _shared/mascot-note-pattern.html, Variant A
  • 01 §4f-i InfoTip — content is DATA, not JSX
  • 01 §5c layout discipline: equal-height side-by-side elements, bounded
    dimensions, nothing protruding or overflowing
  • shell §7.5 the Attention bell — one aggregator; every warning states why it
    appeared; suggested items never badge

GROUP D — the accent, only if W1 Section 1b found gaps (commit: fix(brand):
finish the accent move). Resolve any remaining hardcoded rgba(111, 179, 222, …)
to --pl-pri-rgb. ⚠️ Do NOT touch --primary, --ring, --sidebar-*, or --cat-gpa
in src/index.css — CLAUDE.md locks them and _visual-recipes.md says the
signed-in app deliberately keeps the old blues.

⚠️ SIDEBAR — READ BEFORE TOUCHING IT.
00-product-shell.md §7.2 carries an Aug 11 amendment describing a merged
hover-overlay sidebar, and names
specifications/mockups/00-shell/sidebar-merged-remock.html as its layout
reference. THAT MOCKUP HAS NO ROW IN BUILD-MANIFEST.md, and every Shell row in
the manifest reads NO. Per the gate: skip it, and say so in your summary. Do
not build it because the amendment or mockups/README calls it approved. If and
only if the manifest gains a row reading YES for it, build it in a separate
pass.

MUST NOT:
- Copy inline CSS, colour, font, or radius from any mockup. Tokens only, per the
  translation contract.
- Fork any component in component-inventory.md.
- Invent a percentage, score, or composite metric (U-9, 01 §6.12).
- Change tokens, the theme system, fonts, mascot assets, the auth-sync layer, or
  anything else on CLAUDE.md's MUST-NOT-CHANGE list.
- Alter a localStorage shape without a versioned, lossless migration.
- Add any dependency without flagging it first.
- Build any tab surface. This prompt is app-wide only.

VERIFY before claiming done:
- npm run test and npm run build both pass before each commit.
- Signed-out mode is fully functional — localStorage is primary.
- Dark and light (paper) themes both render on every touched surface.
- Keyboard-only and reduced-motion both work.
- Every empty state is a friendly one-liner, never a blank void.

Report per numbered item: done / partial / skipped, with file references.
Call out explicitly: any third milestone-filter reader you found, any 20th
reference to /timeline this list missed, and anything you skipped on the gate.
```

---

# S-3 · Overview — the reference implementation

**Overview goes first among surfaces and is not negotiable.** `04` §0c: the one visual language is *"defined by the approved Overview hero."* Every later surface conforms to what this produces.

```
[PASTE THE GATE PARAGRAPH HERE]

Design reference (Variant A only):
  specifications/mockups/03-overview/overview-bento-control-panel.html + .md
Spec — law for behaviour and data:
  premed-hq-documentation/specifications/03-overview.md
Contract:
  premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md
Target: src/pages/Home.tsx and its components.

⚠️ overview-where-i-stand-expandable.html and sauce-two-doors.html are Build? =
NO. Do not build them. The "Where I stand" work below comes from the bento
mockup and the spec, not from the expandable mockup.

Numbered changes:
1. Bento grid of mixed-size panels, in the mockup's block order.
2. Banner hero with the themed art and its scrim; hero cards float over it as
   frosted glass. Content panels below are solid-with-depth, NOT glass.
3. Where I stand — compact single-line domain rows carrying value-against-goal,
   mini bar, and pace chip, grouped Foundation / Experiences / Application.
   Pace chips render ONLY where a standing goal exists.
4. Tasks as Now / Soon / Done tabs. Drag reorders within a tab only. Star is
   the only prioritization concept. (Full task editing is S-4 — build the
   container here, not the editing.)
5. Stat tiles and Quick access per the mockup; quick-access launchers appear
   only when their target exists.
6. Roadmap as a horizontal spine of milestone cards, current one raised.

MUST NOT:
- Add a "Needs attention" strip. 03-overview §6.2 bans it; urgency lives on task
  rows, in smart actions, and in the bell.
- Copy inline CSS, colour, font, or radius from the mockup. Tokens only.
- Fork any component. Configure the ones in component-inventory.md.
- Invent a percentage, score, or composite metric. U-9 / 01 §6.12.
- Add a ninth block. If the mockup implies one, stop and flag it.
- Render placeholder or demo data on any panel with no records — real empty
  state only.

VERIFY: npm run build and npm run test pass · signed-out mode works · both
themes render · every panel's empty state is a friendly one-liner · squint test
shows exactly one dominant primary action.

One commit: feat(overview): ...
Do not start another surface in this task.
```

**The follow-up you will need most:**

> `This came out flat. 04 §0 directive 1 says "make it flat/plain" is a DEFECT, not the goal. Re-read 04 §0c and restore: banner hero, glass cards floating over it, layered depth, soft shadows, bold Baloo headings, motion on every interactive element. Do not reduce richness in the name of restraint — restraint targets content clutter and metaphor only.`

---

# S-4 · Overview tasks — audit, then finish

> **⚠️ This brief was largely SHIPPED on 2026-08-09** — `d266b53`, `a59a6a7`, and `c01d0c3` (*feat(overview): own task editing*) match Groups 0, 1, and 2 by commit message. **`c01d0c3` touched a single file**, which is thin for a group whose acceptance test is a thirteen-field parity table. **Audit before building.** Group 3 (narrow Timeline) and Group 4 (spec sync) show no matching commit at all.

```
[PASTE THE GATE PARAGRAPH HERE]

Read, in full:
  premed-hq-documentation/implementation/briefs/S6-tasks-to-overview.md

⚠️ Much of this brief has already been implemented — commits d266b53, a59a6a7,
and c01d0c3, all 2026-08-09. AUDIT FIRST, BUILD SECOND.

Step 1 — audit. Go through the brief item by item, all 23 numbered items, and
report each as SHIPPED / PARTIAL / NOT DONE with the file:line that proves it.
Pay particular attention to Group 2a's parity table: c01d0c3 changed only ONE
file, which is thin for a group whose acceptance test is that every field on
TaskItem is editable. Verify each of the thirteen rows individually — title
inline rename, deadline picker on the row, notes, fileUrl, all 8 categories in
both menus, progress, important, horizon, order, archived, kanban, course,
milestone.

Step 2 — implement only what the audit found PARTIAL or NOT DONE. Groups 3 and
4 show no matching commit and are likely untouched.

The bar, from the brief and from Andy: "It should have full functionality. Even
though it's a little widget on the Overview, it should be fully functional, and
if you want to expand it, then you expand it in Overview."

The acceptance test for the whole brief is the parity table in Group 2a: every
field on TaskItem is either editable or on the explicitly ruled-out list.

Report, specifically, the five items the brief asks you to call out:
  • the parity table, field by field
  • item 17 — where VerifyChecklist should live, and why
  • item 13 — your proposed NextEventWidget empty-state copy
  • item 14 — whether existing activity-feed entries need migrating
  • any 20th reference to /timeline the brief missed

Out of scope, named in the brief and repeated here: the quest-log redesign,
splitting TaskItem (that is S7 and needs a versioned migration), and any
rewrite of AssignmentsPanel's internals — it moves, it does not get rewritten.

VERIFY: parity at BOTH sizes — every action in the widget is available at
/overview/tasks and vice versa; a capability on only one is a defect
(03-overview.md §6.4). npm run test and npm run build pass before each commit.
Signed-out mode, both themes, keyboard-only, reduced-motion. The row gained
inline editing, so check rename and the date picker are reachable without a
pointer.
```

---

# S-5 · Academics · Daily

```
[PASTE THE GATE PARAGRAPH HERE]

Design references — all Build? = YES, Variant A only unless noted:
  01-academics/academics-daily-main-page.html + .md      → brief D2
  01-academics/academics-assignments.html + .md          → brief D3
  01-academics/academics-class-hub.html + .md            → brief D4
  01-academics/academics-review-session.html + .md       → brief D5
  01-academics/academics-class-types.html + .md          → brief D8
  01-academics/academics-empty-states-prototype.html
  01-academics/academics-exam-prep-mode.html
  01-academics/academics-syllabus-import.html
⚠️ academics-mode-switch.html and class-center-study-hub.html are Build? = NO.
Do not build them.
Spec — law for behaviour and data:
  premed-hq-documentation/tabs/01-academics.md  (§6 holds all 77 features)
Contract:
  premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md

⚠️ ACADEMICS IS ALREADY LARGELY BUILT — 2026-07-27 to 07-29, roughly a dozen
commits including the class center, assignments, the class hub, the AI layer
and coverage ledger, the generation policy, visual recipes, and two craft
audits. AUDIT AGAINST EACH BRIEF FIRST and report SHIPPED / PARTIAL / NOT DONE
per item before changing anything. Do not rewrite working surfaces.

⚠️ AND THE DRIFT IS NOT IN THE ACADEMICS SPEC. tabs/01-academics.md carries no
Aug-2026 rulings — it has been stable since July. What changed underneath it is
GLOBAL: general.md's U-10, U-11, U-12 and U-13 were all locked in Aug 2026 and
did not exist when this code was written. Check every Academics surface against
those four, especially U-13 (a fact about the record is allowed; a judgement
about the person is not) and U-10 (manual first — nothing auto-parsed,
auto-filed, or auto-summarised on arrival; AI proposes and waits).

Work brief by brief, in dependency order, ONE COMMIT PER BRIEF:
  DX (demo data) → D2 (Class Center) → D3 (Assignments) → D4 (Class page, five
  sub-tabs) → D5 (Active recall runner) → D8 (Class types) → then empty states,
  exam prep mode, and syllabus import.
Each brief is at premed-hq-documentation/implementation/briefs/<id>-*.md. Read
only that brief plus what it names, per its own header.

⚠️ D6 (the AI layer and coverage ledger) is NOT in this prompt. It depends on
specifications/generation/, which is S-7. If a brief you are running reaches
into generated content, stop at that boundary and report it.

⚠️ Two of these mockups carry no status line in their own source and
variant-lab.html labels them PROTOTYPE. They are cleared to build anyway, but
the design is NOT frozen — if a drawing changes later, the code follows it.
Build them; do not treat the drawing as final.

Same MUST NOTs and VERIFY block as S-3. One brief per commit. Stop and report
after each brief rather than running the whole set unattended.
```

---

# S-6 · Academics · Planning

```
[PASTE THE GATE PARAGRAPH HERE]

Design references — all Build? = YES, Variant A only:
  01-academics/academics-planner-prototype.html + .md
  01-academics/academics-requirements.html + .md
  01-academics/academics-grades-archive.html + .md
Spec: premed-hq-documentation/tabs/01-academics.md
Contract: premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md

⚠️ No briefs exist for these three. briefs/README.md lists the term-column
Planner (§4.2-C1), the grade ledger (§6.8), lifecycle/amnesty (§6.10), and the
course→requirement catalog dataset as "spec exists, brief does not." Derive the
numbered changes from each mockup's own .md note plus the named spec section,
and WRITE THEM OUT before coding so they can be checked.

⚠️ academics-requirements.html depends on the course→requirement catalog, which
does not exist as a dataset. Build the surface against the existing
data/unc-requirements.json and its stated medium confidence; do NOT invent a
per-school requirement mapping, and do NOT read data/med-schools.json for
requirements — its prereqs arrays are empty by design (tabs/08-school-list.md
§2). If the surface cannot be honestly built without the catalog, say so and
stop.

Same MUST NOTs and VERIFY block as S-3. One commit per surface.
```

---

# S-7 · Generation engine · Phase 0

> ## ⚠️ NEEDS ANDY'S CLEARANCE BEFORE RUNNING
>
> `specifications/generation/` is marked **APPROVED Aug 2026, all nine decisions resolved**, and `AGENT-IMPLEMENTATION-GUIDE.md` §1 now names it a governing spec with the instruction to *"build against `09-migration-plan.md` §3 from Phase 0."*
>
> **But `BUILD-MANIFEST.md` is a mockup gate and has no row for it, so the manifest neither clears nor blocks it.** That is a hole in the gate, not permission. **Andy says go, or this does not run.**
>
> It is placed here rather than later because **`D6` — the Academics AI layer and coverage ledger — depends on it**, and `lib/academics/generationPolicy.ts` is named as the enforcing gate for every generated artifact.

```
[PASTE THE GATE PARAGRAPH HERE]

Read, in this order:
  premed-hq-documentation/specifications/generation/README.md — the decision log
  premed-hq-documentation/specifications/generation/01-architecture.md
  premed-hq-documentation/specifications/generation/02-global-rules-and-source-modes.md
  premed-hq-documentation/specifications/generation/07-schemas.md
  premed-hq-documentation/specifications/generation/09-migration-plan.md
Then read src/lib/academics/generationPolicy.ts — it is the enforcing gate and
it already exists.

Implement PHASE 0 ONLY, per 09-migration-plan.md §3. Do not run ahead into
later phases. Report the phase boundary you stopped at and what Phase 1 would
require.

Binding constraints from higher-precedence docs — check each before you write:
  • U-2 — a feature needing an LLM is marked and must DEGRADE, never break. No
    base capture path may depend on an API key.
  • U-10 — manual first. The student types into the table; AI is a verb they
    invoke, never a state the app is in. Nothing is auto-parsed, auto-filed, or
    auto-summarised on arrival.
  • AI acts permission-first — propose, confirm, then act. Never a silent edit
    of user data.
  • tabs/02-mcat.md §2a — AI generates practice items in exactly two places,
    M2M drills and flashcards. QBank questions and CARS passages are externally
    sourced, permanently.
  • No flashcard REVIEW in the app, either tab — generate, tag, export, Anki.
    But ts-fsrs still schedules topics (Academics) and drills (MCAT); those are
    not flashcards. Do not delete them.

Same MUST NOTs and VERIFY block as S-3.
```

---

# S-8 · The re-sweep

**Run `S-0` again, verbatim**, writing to `implementation/briefs/W2-resweep.md`, plus this:

```
Additionally: diff this report against
premed-hq-documentation/implementation/briefs/W1-doc-drift-and-conformance.md
and list, in a sixth section, every row whose status changed — improved and
regressed, separately. A regression is a higher-priority finding than anything
still outstanding.
```

---

## Follow-ups worth keeping to hand

> **It copied the mockup's CSS:** `You brought the mockup's inline styling into the app. Per 04 §0a the mockup's styling is a stand-in, not the target. Replace every hardcoded value with the token from src/index.css per the translation contract. Verify by grepping the diff for hex codes.`

> **It forked a component:** `You created a component that duplicates one in component-inventory.md. 04 §0b: one component per job — two doing the same job is a defect. Delete yours and configure the existing one.`

> **It shipped fake data:** `There are placeholder values on a surface with no records. Replace with the real empty state per 01 §8 and 04 §9. 04 §0 directive 5 requires realistic content while DESIGNING; it does not license invented data in the app.`

> **It broke signed-out mode:** `This requires auth to render. CLAUDE.md: localStorage is primary and signed-out mode must stay fully functional. Fix and re-verify signed out.`

> **It did too much:** `This touched more than the numbered changes. One feature per commit. Revert everything outside the list and re-commit.`

> **It changed a locked thing:** `You modified [tokens / theme system / fonts / mascot assets / the auth-sync layer / Letters page structure]. All are on CLAUDE.md's MUST-NOT-CHANGE list. Revert that change and complete the rest.`

> **A localStorage schema changed:** `This alters a localStorage shape. CLAUDE.md requires a versioned, lossless migration. Write it, and prove no existing record loses data.`

> **It says done without checking:** `You have not verified. Run npm run build, load the app signed out, toggle both themes, and empty the relevant store to see the empty state. Report what you actually observed — a syntax check is not verification.`

> **It built something not cleared:** `That mockup's Build? column reads NO, or it has no row at all. The gate says skip and report. Revert it. A mockup's own APPROVED header is not permission — approving a drawing and changing the app are two decisions.`

---

## The three things most likely to go wrong

**1. Flattening.** Three mockups have already been rejected in this project for one reason — reading `04` §10's anti-pattern list without reading `04` §0c's north star, and producing clean, flat, competent minimalism. **`04` §0 calls that a defect in as many words.** You will use the follow-up above.

**2. Building the spec instead of the drawing.** The specs describe far more than has been designed. **A prompt saying "implement Extracurriculars per the spec" would produce thirty undesigned surfaces.** Every prompt here names its mockup files explicitly for that reason. Keep it that way.

**3. Variant drift.** The lab has ~60 variant definitions. **If a prompt does not say `Variant A only`, you get a blend of three.**

---

## Not in this pass, deliberately

**No mockup exists** for Extracurriculars · Shadowing · Research · Volunteering (the pillar) · Letters · Essays & Story Bank · **School List** · Timeline · Profile/CV · Help · Settings · Atlas. **Those are design jobs before they are code jobs.** Do not let an agent build them from the spec alone, however complete the spec looks — `tabs/08-school-list.md` was finished this week and is the sharpest example: a full spec, zero drawings, no manifest row.

**Blocked by the manifest:** all Shell mockups (including the sidebar remock) · all Clinical · all MCAT · Volunteering's one mockup.

**Permanently blocked, decision already made:** `illustrated-campus.html` (rejected) · `hours-map.html` (rejected) · `clinical-pillar.html` (superseded) · `clinical-role-presets.html` (superseded by the typeahead) · `timeline-spine.html` (draft, explicitly not cleared).
