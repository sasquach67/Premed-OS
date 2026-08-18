# Premed OS mockup variant lab

> **Status:** PROTOTYPE REVIEW TOOL — not an implementation reference.
>
> **Entry point:** `variant-lab.html`

The lab must run through its local server because variant injection needs the
parent and embedded mockup to share one origin. Opening `variant-lab.html`
directly now redirects to `http://localhost:8765` while preserving the selected
page and variant.

## Scope

The lab mirrors the current Premed OS product navigation:

- Overview first;
- Academics in its Daily and Planning hierarchy;
- MCAT in its seven-tab hierarchy;
- Clinical, Volunteering, Shadowing, Research, and Extracurriculars as five
  peer product categories, each with its own real sub-tabs;
- School List, Essays & Story Bank, and Letters as complete draft families;
- only Timeline & Tasks, Profile / CV, Help, and Settings remain deliberately
  undrawn.

**Every tab carries the bottom A/B/C switcher.** What the letters mean scales
with how finished the page is:

- drawn mockups get three real layout treatments, and multi-view mockups get
  three per product view;
- draft sources get three real treatments while staying labelled drafts;
- not-yet-mocked tabs get three *named layout directions*, shown as a dashed
  “Direction only · not yet drawn” block over the coming-soon card.

That last row is the honest part. A direction is a design argument written down,
not a screenshot — nothing pretends to be drawn that is not.

Shared pattern references (`_shared/`) are excluded because they govern all pages
rather than representing app pages.

### Two copies of this folder

`mockup-lab/` and `premed-hq-documentation/specifications/mockups/` are mirrors.
All mockup sources are byte-identical; only `variant-lab.html` had drifted, and
it is now back in sync. Edit the lab in one place and copy it to the other, and
check which folder your server is actually serving before debugging a change
that “did nothing”.

## Preservation rule

The approved and proposed source mockups remain untouched.

- Single-screen source files retain their authored composition.
- Multi-screen presentation boards are separated into named product views.
- The selected screen is fitted to the review canvas so it never requires inner-page scrolling.
- Where needed, page-specific structural CSS reframes the same source inside the review frame.
- Existing native prototypes load their authored `?variant=A|B|C` implementations.
- Draft sources and coming-soon pages do not pretend to have three completed variants.

This keeps every approved reference recoverable and makes the experiment obviously disposable.

## Status ladder

Every page carries a status chip. The ladder runs:

```
draft → proposed → approved → BUILT
```

| Status | Means | Chip |
|---|---|---|
| `draft` | A source exists; the design is not settled | tinted amber |
| `proposed` | A treatment is offered and awaiting a call | tinted amber |
| `approved` | Andy picked it. **Cleared as a design; not necessarily cleared to build** — `BUILD-MANIFEST.md` is the build gate | tinted green |
| **`built`** ⭐ | **This drawing now exists in the app** | **filled green** |
| `native` | An authored prototype with real `?variant=` implementations | blue |
| `legacy` · `soon` | Superseded, or deliberately undrawn | grey / violet |

### What `built` means, precisely

**The screen in the app looks like this drawing.** Not "the feature works" — **the drawing was translated.**

> ⚠️ **These come apart, and it has already happened.** Syllabus import's behaviour was built to spec and shipped, while its review screen was never translated from `academics-syllabus-import.html`. It works correctly and does not look like the mockup. **That page is not `built`.**
>
> The cause is worth remembering: its decisions `.md` recorded only behaviour and **no visual decisions**, so there was nothing to build appearance from. **A decisions file that says nothing about appearance will produce a screen that works and looks wrong.**

**The chip is filled rather than tinted because `built` is terminal.** An approved mockup is a pending decision. **A built one is a reference you check the app against** — if they diverge, one of them is a bug.

### Promoting a page to `built`

1. The screen exists in `src/` and **visually matches the mockup**, using `_shared/_visual-recipes.md` values literally.
2. The change is **committed**. Note the commit in the mockup's `.md`.
3. Set `status:"built"` on the page's registry entry in `variant-lab.html`.

**Currently `built`:** Landing · auth · merge (`67155de`) · Class types and Empty states (`cb963a3`).

---

## ⭐ The workflow — one tab at a time

**This is how a page moves from spec to app.** One page at a time, in this order. **Do not run two pages in parallel** — the point of the ladder is that each step is checkable before the next begins.

```
1  cross-reference   spec  →  is every feature ON PAPER?
2  mock              draw the missing pieces · A/B/C variants
3  approve           Andy picks · decisions .md records behaviour AND appearance
4  brief             ONE brief: frontend from the mockup + the backend behind it
5  build             code it
6  promote           status:"built"
```

### 1 · Cross-reference — spec against the drawing

**Read the tab's spec and confirm every ruled feature exists on the mockup** as a button, a field, a state, or a surface. **A feature that is specced but not drawn will not get built** — nobody codes from prose alone.

**Record what is missing.** That list is what step 2 draws.

### 2 · Mock — draw what is missing

Three real treatments where the page warrants them. **Drafts stay labelled drafts;** do not pretend three finished variants exist when they do not (see *Preservation rule*).

### 3 · Approve — and record BOTH halves

Andy picks. **The decisions `.md` must record two things:**

| | |
|---|---|
| **Behaviour** | What it does, what it refuses to do, which rules bind it |
| **⚠️ Appearance** | Layout, hierarchy, which treatment won and why |

> **⚠️ This is the step that has already failed once.** `academics-syllabus-import.md` recorded **only behaviour** — parsing, review order, source quotes, weight gaps — and **not one visual decision.** The result: a screen built correctly that does not look like its mockup, and a decisions file that could not catch it.
>
> **A decisions file silent on appearance produces a screen that works and looks wrong.**

### 4 · Brief — frontend and backend together, in one file

**One brief per page, carrying both.** Template: `implementation/briefs/T1-academics-classcenter-mockup-to-app.md`.

Its shape: **fidelity audit → references → frontend from the mockup → backend behind it → do-not-break → done-when → commit.**

**The fidelity audit comes first for a reason** — most tabs have something already built, and the audit is what stops a brief rebuilding shipped work.

**⚠️ Why both in one brief:** shipping behaviour first and appearance later is exactly how the *"recurring visual-fidelity gap"* in `implementation/briefs/README.md` happened. **A screen is done when it works AND matches the drawing.**

### 5 · Build

**`BUILD-MANIFEST.md` is the gate, not this lab.** A page marked `approved` here is a settled *design*; it is not permission to change the app. **Only Andy moves a manifest row to `YES`.**

Use `_shared/_visual-recipes.md` values **literally, never approximated.**

### 6 · Promote to `built`

Per the three-step rule above: **matches visually → committed, commit noted in the `.md` → flip `status:"built"`.**

**Then the mockup's job changes.** It stops being a proposal and becomes the reference the app is checked against.

## Navigation

- Click a page in the left rail.
- When a page has multiple product views, use the named selector above the
  mockup to change its actual tab, mode, step, or state.
- Use the bottom arrows or `←` / `→` only to compare visual design variants.
- Use `↑` / `↓` to move between pages.
- Use **Full screen** in the top-right to hide the review chrome and explore the
  selected mockup at realistic screen-width scale. Full-screen pages scroll
  vertically when their content is taller than the window. The A/B/C switcher
  stays available there, faded back until you hover it. Press Escape or
  **Exit full screen** to return.
- Every state is shareable as
  `?page=<page-id>&view=<view-id>&variant=A|B|C`. Pages without multiple
  product views omit `view`.
- “Open untouched original” opens the source without variant injection.

## Product views versus design variants

These are independent dimensions and must not be combined:

- **Product views** are real in-product destinations or states. Class Hub uses
  Overview, Materials, Topics, Assignments, and Notes. Assignments uses Agenda,
  Weekly, and Calendar. Review Session, Exam Plan, Syllabus Import, and Class
  Types likewise use their named state selectors. Each Experience pillar uses
  the same selector for its own views, such as Sites / Shifts / Reflections or
  Projects / Outputs / Lab notes / Reflections / Discover. Experience views are
  separate lab pages, so every sub-tab has its own review URL and A/B/C state.
- **Design variants** are competing layouts for the same product view. They use
  A, B, and C and are always controlled by the bottom switcher.

Every separated product view now carries its own A/B/C design set, so the
bottom variant switcher is visible on all of them. Resolution is
`page -> product view -> design variant`, and the two controls stay
independent: changing the named view keeps you on the same design letter,
and changing the letter keeps you on the same product view.

Variant treatments for product-view pages are applied **inside the isolated
view only**. They never toggle sibling frames, because isolation has already
run by the time the CSS lands.

## Variant philosophy

The three variants are not color themes:

- **A** preserves the existing information hierarchy.
- **B** usually emphasizes the page’s primary job or working surface.
- **C** explores a different composition such as a comparison studio, decision inspector, library index, or roadmap-first view.

For product-view pages the same three roles apply **per view**, so a view's B
is about that view's job — Assignments → Calendar explores a detail rail,
while Assignments → Agenda explores two-column triage. The letters are not a
single treatment smeared across a page.

For Overview specifically, A preserves the approved colorful bento while B and C
hold its exact components and structure constant to compare two less-cartoonish
visual systems: Graphite precision and Obsidian studio.

Superseded concept pages are not listed in the lab navigation. Their source
files remain available for history, but they are not review destinations.

The former generic “feature-state sweep” pages are also no longer review
destinations. Their content was promoted into full owner surfaces: Academics
learning signals, grade decisions, and term rollover; MCAT Session, Test Day,
and full-length validity; and Overview quarterly-goal states.
