# Mockup → code: the Claude Code prompt sequence

**Built Aug 2026** for Andy's hardcoding pass. **Copy each prompt verbatim into Claude Code, in order.** Do not skip `P0` or `P1` — they exist to stop the other prompts from failing.

---

> ## ⛔ THE GATE — read this before any prompt below
>
> **`implementation/briefs/BUILD-MANIFEST.md` decides what may be built. Nothing else does.**
>
> Andy, Aug 2026: *"I haven't officially cleared most of them and I wanna make sure it doesn't do ALL the mockups, but only the ones I've cleared."*
>
> **A mockup's own header status is not permission.** `APPROVED` in a file header means the *drawing* was approved; it says nothing about whether the app should change to match it. **Only the manifest's `Build?` column authorises work, and it defaults to `NO`.**
>
> **Every prompt below opens with the manifest check. Do not remove that paragraph.** The surface tables in `P2`–`P7` describe *where things would go if cleared* — **they are not a build list.**
>
> **Current state (Aug 2026): the two `05-public` rows are `YES`.** Everything else is still `NO`.
>
> **Cleared to build is not cleared to publish** — see the note on that row in the manifest.

**Paste this at the top of every build prompt, verbatim:**

```
GATE — do this before anything else.
Read premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md.
Build ONLY mockups whose Build? column reads YES. If a mockup named in this
prompt is NO, or is absent from the manifest, skip it and say so in your
summary. Do not build it "since it's approved" — the header status in a
mockup file is not permission. Do not edit the manifest yourself.
If zero rows relevant to this prompt are YES, stop and report that.
```

---

## Before you start — four facts that will bite

**1. `CLAUDE-HANDOFF.md` currently forbids exactly what you are about to do.** Line 306: *"Do not implement these mockups in the Premed OS app unless separately asked."* **This document is the separate ask.** `P1` amends that line so a future session does not stall on it.

**2. There are two mirrored mockup folders**, and the handoff says a mismatch has already cost one pass:

```
mockup-lab/                                     <- the working copy
premed-hq-documentation/specifications/mockups/ <- the mirror
```

**Read from the mirror.** It is inside the docs tree, and the docs are the source of truth.

**3. There is a decoy app at `premedos/`.** `CLAUDE.md` says ignore it. **Every prompt below must say `src/` at the repo root**, because a fuzzy match will find the old copy.

**4. Every mockup has A/B/C variants, and only `A` is approved.** The lab's own rule: *"A should preserve the strongest approved or currently authored direction."* **Unless you have picked otherwise for a specific view, the answer is always A.**

**Two mockups are NOT eligible** and must be excluded by name:

| File | Why |
|---|---|
| `07-campus/illustrated-campus.html` | **Header says REJECTED.** The campus surface was killed (`07-campus-layer-board.md` §2d) |
| `11-timeline/timeline-spine.html` | **Header says DRAFT.** Andy: *"not quite approved and ready for the mockup lab"* |

---

# P0 · The sweep

**Read-only. This prompt must not change a single line of app code.**

```
Audit only — do NOT write, edit, or refactor any file in src/ during this task.

Read these first, in this order:
  premed-hq-documentation/AGENT-IMPLEMENTATION-GUIDE.md
  CLAUDE.md
  premed-hq-documentation/specifications/04-visual-craft-standards.md  (read §0, §0a, §0b, §0c in full)
  premed-hq-documentation/specifications/mockups/CLAUDE-HANDOFF.md
  premed-hq-documentation/specifications/mockups/README.md
  premed-hq-documentation/implementation/component-inventory.md

Scope note: the app is src/ at the repo root. The folder premedos/ is a stale
copy and CLAUDE.md says to ignore it. Do not read or reference it.

Produce ONE report at:
  premed-hq-documentation/implementation/briefs/S9-mockup-conformance-sweep.md

The report has four sections and nothing else.

SECTION 1 — Inventory.
A table of every mockup source in
premed-hq-documentation/specifications/mockups/ (recursive), with columns:
  file | product area | product views it declares | status stated in its own
  header comment | is there a matching .md note
Read each file's opening HTML comment for its status. Two files declare
themselves ineligible — illustrated-campus.html says REJECTED and
timeline-spine.html says DRAFT. Mark them EXCLUDED and never propose
building them.

SECTION 2 — What is already built.
For each mockup, find the corresponding surface in src/ and state one of:
  BUILT-CONFORMING / BUILT-DIVERGENT / PARTIAL / NOT BUILT
Name the actual file and component for anything not NOT-BUILT.

SECTION 3 — Divergences, ranked.
For every BUILT-DIVERGENT or PARTIAL row, one line per divergence:
  what the mockup shows | what the code does | which 04 rule it breaks, if any
Rank by 04 §0b and §0c violations first (a flat card where the mockup floats
glass over a banner is a defect, not a preference), then by missing product
views, then by cosmetic drift.
Be specific. "Styling differs" is not a finding. "Card uses solid bg-card with
no backdrop-filter where the mockup floats glass over the banner hero" is.

SECTION 4 — Build order proposal.
Order the NOT BUILT and BUILT-DIVERGENT items for implementation. Justify the
order in one line each. Note any item that depends on another being done first.

Rules for this task:
- Do not fix anything you find. Report only.
- Do not edit any mockup file.
- If you find uncommitted work-in-progress from another session, stop and say
  so before doing anything else — Claude Code and Codex both work in this repo.
- Cite file paths and line numbers for every claim in Section 3.
```

### Follow-ups for `P0`

> **If the report is vague:**
> `Section 3 is not specific enough to act on. For every row, quote the exact mockup markup and the exact src/ code, with file:line for both. If you cannot find the corresponding code, say NOT BUILT rather than guessing.`

> **If it starts fixing things:**
> `You changed files in src/. Revert those changes. P0 is read-only — the report is the deliverable.`

> **If it read the wrong app:**
> `You referenced premedos/. That is a stale copy CLAUDE.md tells you to ignore. Redo the affected sections against src/ at the repo root.`

---

# P1 · The translation contract

**Still no feature work.** This produces the rulebook every later prompt cites. **Skipping this is what causes ten rounds of rework.**

```
No feature work in this task. You are writing one document.

Read again if not already in context:
  premed-hq-documentation/specifications/04-visual-craft-standards.md §0a, §0b, §0c
  premed-hq-documentation/implementation/component-inventory.md
  src/index.css  (the real design tokens)
  premed-hq-documentation/specifications/mockups/_shared/_visual-recipes.md

Write: premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md

It answers exactly one question: when a mockup and the app's design system
disagree, what happens? 04 §0a already gives the principle —

  "The mockup is right about what goes where and how it behaves;
   the app's design system is right about how it looks."

Turn that principle into a mechanical checklist a future session can follow
without judgment calls. It must cover, at minimum:

1. TOKENS. A table mapping every hardcoded hex, radius, and font-size that
   appears across the mockup sources to the real CSS variable in src/index.css.
   The mockups inline their palette; the app must not. Build this by actually
   reading the mockup <style> blocks, not by assuming.
2. COMPONENTS. For each recurring mockup pattern (stat strip, sub-tab
   underline nav, expandable row, inline add row, contact card, banner hero,
   glass card, mascot note, tracker table), name the ONE existing component
   that implements it, from component-inventory.md. Where no component exists,
   say so explicitly and mark it NEW — do not invent a name.
   04 §0b: one component per job. Two components doing the same job is a defect.
3. GLASS. 04 §0c is conditional: glass on surfaces that float over the banner
   or overlay content; solid-with-depth on dense content and data surfaces.
   State the test as a yes/no question a builder can answer in one look.
4. WHAT A MOCKUP IS NEVER ALLOWED TO DICTATE. At minimum: fonts, palette,
   radii, spacing scale, icon set, its own inline CSS, and any component it
   hand-rolled that already exists in the library.
5. WHAT A MOCKUP IS ALWAYS AUTHORITATIVE ON. At minimum: which elements exist,
   their order and grouping, product-view structure, interaction flow, empty
   and partial states, and copy shown in the drawing.
6. DATA THAT DOES NOT EXIST YET. Mockups draw populated screens. State the
   rule: a surface ships with its real empty state from 01 §8 / 04 §9, and
   never with placeholder or invented data. 04 §0 directive 5 requires
   realistic content in DESIGN; it does not license fake data in the APP.

Then append this line to
premed-hq-documentation/specifications/mockups/CLAUDE-HANDOFF.md, replacing
the "Do not implement these mockups" bullet under Preservation and honesty
rules:

  - Mockups ARE now being implemented in the app, per
    implementation/briefs/MOCKUP-TO-CODE-PROMPT-SEQUENCE.md (Andy, Aug 2026).
    Implementation reads the mockups; it never edits them. The mirror in
    specifications/mockups/ is the read source.

Do not change anything else in that file.
```

### Follow-ups for `P1`

> **If the token table is guessed rather than read:**
> `Your token table does not match src/index.css. Re-derive it by reading the <style> block of at least five mockup sources and src/index.css side by side. Every row must cite the mockup file it came from.`

> **If it invents component names:**
> `You named components that do not exist in component-inventory.md. Every entry must either cite a real component or be marked NEW. Guessing a name causes a fork, which 04 §0b calls a defect.`

---

# P2 · Overview — the reference implementation

**Overview goes first and is not negotiable.** `04` §0c: the one visual language is *"defined by the approved Overview hero."* **Every later surface conforms to what this prompt produces**, so a shortcut here propagates everywhere.

```
Design reference:
  premed-hq-documentation/specifications/mockups/03-overview/overview-bento-control-panel.html
  premed-hq-documentation/specifications/mockups/03-overview/overview-bento-control-panel.md
  premed-hq-documentation/specifications/mockups/03-overview/overview-where-i-stand-expandable.html
  Variant A only.
Spec (law for behaviour and data):
  premed-hq-documentation/specifications/03-overview.md
Contract:
  premed-hq-documentation/implementation/MOCKUP-TRANSLATION-CONTRACT.md
Target: src/pages/Home.tsx and its components.

Bring Overview into conformance with the mockup. Numbered changes:

1. Bento grid of mixed-size panels, in the mockup's block order.
2. Banner hero with the themed art and its scrim; hero cards float over it as
   frosted glass. Content panels below are solid-with-depth, NOT glass.
3. Where I stand — compact single-line domain rows carrying value-against-goal,
   mini bar, and pace chip, grouped Foundation / Experiences / Application.
   Pace chips render ONLY where a standing goal exists.
4. Tasks as Now / Soon / Done tabs. Drag reorders within a tab only. Star is
   the only prioritization concept.
5. Stat tiles and Quick access per the mockup; quick-access launchers appear
   only when their target exists.
6. Roadmap as a horizontal spine of milestone cards, current one raised.

Must NOT:
- Add a "Needs attention" strip. 03-overview §6.2 bans it; urgency lives on
  task rows, in smart actions, and in the bell.
- Copy any inline CSS, colour, font, or radius from the mockup. Tokens only.
- Fork any component. Configure the ones in component-inventory.md.
- Invent a percentage, score, or composite metric. 01 §6.12.
- Add a ninth block. If the mockup implies one, stop and flag it.
- Render placeholder or demo data on any panel with no records — use the real
  empty state.
- Add any dependency without flagging it first.

Verify before you claim done:
- npm run build passes with no new TypeScript errors.
- Signed-out mode is fully functional.
- Dark and light (paper) themes both render correctly on every new surface.
- Every panel's empty state is a friendly one-liner, never a blank void.
- Squint test: exactly one primary action is dominant.

Then: one commit, conventional format, feat(overview): ...
Do not start another surface in this task.
```

### Follow-ups for every build prompt (`P2` onward)

Keep these to hand. **They are the ones you will need repeatedly.**

> **It flattened the design — the single most common failure:**
> `This came out flat. 04 §0 directive 1 says "Make it flat/plain" is a DEFECT, not the goal. Re-read 04 §0c and restore: banner hero, glass cards floating over it, layered depth, soft shadows, bold Baloo headings, motion on every interactive element. Do not reduce richness in the name of restraint — restraint targets content clutter and metaphor only.`

> **It copied the mockup's CSS:**
> `You brought the mockup's inline styling into the app. Per 04 §0a the mockup's styling is a stand-in, not the target. Replace every hardcoded value with the token from src/index.css per the translation contract. Verify by grepping the diff for hex codes.`

> **It forked a component:**
> `You created a new component that duplicates one in component-inventory.md. 04 §0b: one component per job — two doing the same job is a defect. Delete yours and configure the existing one.`

> **It shipped fake data:**
> `There are placeholder values on a surface with no records. Replace with the real empty state per 01 §8 and 04 §9. 04 §0 directive 5 requires realistic content while DESIGNING; it does not license invented data in the app.`

> **It broke signed-out mode:**
> `This requires auth to render. CLAUDE.md: localStorage is primary and signed-out mode must stay fully functional. Fix and re-verify signed out.`

> **It did too much:**
> `This touched more than the numbered changes. One feature per commit. Revert everything outside the list and re-commit.`

> **It changed a locked thing:**
> `You modified [tokens / theme system / fonts / mascot assets / the auth-sync layer / Letters page structure]. All are on CLAUDE.md's MUST-NOT-CHANGE list. Revert that change and complete the rest.`

> **A localStorage schema changed:**
> `This alters a localStorage shape. CLAUDE.md requires a versioned, lossless migration. Write it, and prove no existing record loses data.`

> **It says done without checking:**
> `You have not verified. Run npm run build, load the app signed out, toggle both themes, and empty the relevant store to see the empty state. Report what you actually observed — a syntax check is not verification.`

---

# P3–P7 · The remaining surfaces, in order

**Same shape as `P2` every time.** Swap the five fields and re-derive the numbered changes from that mockup's own `.md` note plus its spec.

| # | Surface | Mockups | Spec |
|---|---|---|---|
| **P3** | **Shell** — calendar overlay, Sauce dropdown, 3-level nav | `00-shell/*`, `_shared/nav-hierarchy-3-levels.html` | `00-product-shell.md`, `06-knowledge-delivery-board.md` |
| **P4** | **Academics · Daily** — Class Center, Assignments, Class Hub, empty states | `01-academics/` (Daily set) | `01-academics.md` |
| **P5** | **Academics · Planning** — Planner, Requirements, Grades & Archive | `01-academics/` (Planning set) | `01-academics.md` |
| **P6** | **Clinical** — pillar, sub-tabs, credentials, role presets, scope recall | `04-clinical/*` | `03-clinical.md` |
| **P7** | **MCAT** — Bookshelf, Plan, M2M drills **only** | `02-mcat/*` | `02-mcat.md` |

**Ordering logic, so it can be argued with:** Shell before pillars because every pillar renders inside it. **Academics before everything else** because it is the only fully-mocked pillar — all product views, all A/B/C — so it is the least ambiguous large build. Clinical next because it has the most drawn sub-surfaces. **MCAT last and partial** — the handoff says most MCAT tabs are honest placeholders, and a placeholder is not a design.

**Not in this sequence, deliberately:** Volunteering has one mockup (`standing-vs-events`) and no pillar drawing. Shadowing, Extracurriculars, Research, Letters, Essays, School List, Timeline, Profile, Help, and Settings **have no approved mockups at all.** Per the lab's own honesty rule, a named direction is not a design. **Do not let Claude Code build these from the spec alone in this pass** — that is a different job with a different risk profile.

---

# P8 · The conformance re-sweep

**Run `P0` again, verbatim**, writing to `S10-mockup-conformance-resweep.md`.

**The point is the diff.** Every row that was `BUILT-DIVERGENT` in S9 should now be `BUILT-CONFORMING`, and **anything that regressed is the real finding.** Add one instruction to the re-run:

```
Additionally: diff this report against
premed-hq-documentation/implementation/briefs/S9-mockup-conformance-sweep.md
and list, in a fifth section, every row whose status changed — improved and
regressed separately. A regression is a higher-priority finding than anything
still outstanding.
```

---

## The three things most likely to go wrong

**1. Flattening.** Three mockups have already been rejected in this project for exactly one reason — reading `04` §10's anti-pattern list without reading `04` §0c's north star, and producing clean, flat, competent minimalism. **`04` §0 calls that a defect in as many words.** The follow-up prompt above is written for this and you will use it.

**2. Building the spec instead of the drawing.** The specs describe far more than has been designed. **A prompt that says "implement Extracurriculars per the spec" will produce 26 features nobody has drawn.** Every prompt in this sequence names its mockup files explicitly for that reason — keep it that way.

**3. Variant drift.** The lab has 60 variant definitions. **If a prompt does not say `Variant A only`, you will get a blend of three.**
