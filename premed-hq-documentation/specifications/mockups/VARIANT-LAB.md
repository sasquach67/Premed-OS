# Premed HQ mockup variant lab

> **Status:** PROTOTYPE REVIEW TOOL — not an implementation reference.
>
> **Entry point:** `variant-lab.html`

The lab must run through its local server because variant injection needs the
parent and embedded mockup to share one origin. Opening `variant-lab.html`
directly now redirects to `http://localhost:8765` while preserving the selected
page and variant.

## Scope

The lab mirrors the current Premed HQ product navigation:

- Overview first;
- Academics & GPA in its locked Daily and Planning hierarchy;
- MCAT in its seven-tab hierarchy;
- the remaining product areas in application order;
- superseded concepts in a separate Archived concepts section.

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
  Types likewise use their named state selectors.
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

Legacy pages are isolated under Archived concepts. They are useful for extracting
interaction ideas, not for reviving superseded product structure.
