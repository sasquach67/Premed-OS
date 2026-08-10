# Premed OS mockup lab — Claude handoff

> Start here before adding or changing any mockup.
>
> This folder is a pre-production design workspace. It is not the Premed OS
> implementation and should not be treated as production code.

## Immediate goal

Continue and finish the Premed OS mockup library in product order while
preserving the existing Premed OS visual language.

The review entry point is:

```text
variant-lab.html
```

Run it from this folder with:

```bash
python3 -m http.server 8765
```

Then open:

```text
http://localhost:8765/variant-lab.html
```

Do not review it through `file://`. The parent lab and embedded mockups need the
same local origin for reliable switching and variant injection.

## Non-negotiable state model

There are two separate concepts:

1. **Product views** are real screens, tabs, steps, modes, or states inside the
   product. Examples include Class Hub → Overview / Materials / Topics /
   Assignments / Notes and Assignments → Agenda / Weekly / Calendar.
2. **Design variants** are competing visual layouts for the same product view.
   They are always A / B / C.

Never use A / B / C to move between product tabs or workflow steps.

- Product views use the named selector above the preview and the `view=` URL
  parameter.
- Design variants use the bottom arrow control and the `variant=A|B|C` URL
  parameter.
- A complete shareable state looks like:
  `?page=class-hub&view=assignments&variant=B`.

## Definition of finished

A page is not finished merely because all of its product views can be opened.

For every finished page or tab:

- create three meaningful design/layout alternatives: A, B, and C;
- keep the feature set and underlying product meaning constant across A/B/C;
- make the alternatives structurally different enough to support a real design
  decision—not simple recolors;
- if the page contains multiple product views, create A/B/C for **each** view;
- keep the named product-view selector independent from the A/B/C switcher;
- make every `page + view + variant` combination directly shareable by URL;
- ensure the preview fills one review page in normal mode;
- ensure full-screen mode uses realistic screen width and scrolls vertically
  when content is taller than the window;
- visually verify every view and every variant after editing.

Do not count workflow states such as Upload / Review / Re-import as three design
variants. Those are product views. Each can later receive its own A/B/C.

## Variant quality bar

The variants are layout and design explorations, not color themes.

- **A** should preserve the strongest approved or currently authored direction.
- **B** should change the emphasis or working composition while keeping the same
  components and product behavior.
- **C** should explore another credible structure or interaction hierarchy.

Keep the same fonts and overall Premed OS design language. The desired tone is
modern, focused, and polished, with restrained but useful color. Avoid making
the interface overly cartoony, overly saturated, or visually noisy.

## Product order

Keep the left navigation in the order a user encounters the product:

1. Overview
2. Academics & GPA
   - Daily
     - Class Center
     - Assignments
     - Empty states
     - supporting Class Hub and study flows
   - Planning
     - Planner
     - Requirements
     - Grades & Archive
3. MCAT
   - Dashboard
   - Plan
   - Content
   - Questions
   - Mistakes
   - Stats
   - Advisor
4. Remaining Premed OS product areas
5. Archived concepts

Do not reorder the lab by filename or creation date.

## Where the lab actually lives

There are **two mirrored copies** of this folder:

```text
mockup-lab/                                    <- work here
premed-hq-documentation/specifications/mockups/ <- mirror
```

Every mockup source file is byte-identical between them. Only `variant-lab.html`
had drifted, and the docs mirror was the stale side. They are now in sync.

**If you edit `variant-lab.html`, copy it to the mirror in the same commit.**
`open-lab.command` exists only in `mockup-lab/`, so a server started by
double-clicking the docs mirror will serve whichever copy that folder holds.
Confirm which folder is being served before concluding a change "did not work" —
that exact confusion has already cost one pass.

## The A/B/C switcher is global

Every tab in the lab now shows the bottom A/B/C switcher, with no exceptions.
What each letter *means* depends on how finished the page is:

| Page state | What A/B/C carries |
|---|---|
| Drawn mockup | Three real layout treatments injected into the source |
| Multi-view mockup | Three real treatments **per product view** |
| Draft source | Three real treatments; nav still labels it a draft |
| Not mocked yet | Three **named layout directions**, explicitly marked undrawn |

Not-yet-mocked tabs resolve their letters from `PLACEHOLDER_DIRECTIONS` in
`variant-lab.html`. The preview shows a dashed block reading
"Direction only · not yet drawn". **That dashed block is the honesty
mechanism — never delete it to make a page look finished.** When a page gets a
real mockup, remove it from `placehold()` entirely rather than dressing up the
placeholder.

The switcher also stays visible in full screen now, faded back until hovered,
because comparing layouts at realistic width is exactly when it is needed.

## Current classification

### Verification record — Aug 2026

Verified in a live browser at `http://localhost:8765`, not by syntax check:

- **56 page + view combinations** exercised across all three letters
  (50 in the first pass, plus the 6 new Planning views).
- **Switcher present on all 56** — zero tabs hide it.
- **No letter is geometrically identical to another** on any combination. The
  check fingerprints every element's bounding box in the iframe, so a treatment
  that changes nothing is caught even when its CSS parses fine.
- Both native prototypes (Empty states, Planner) confirmed to serve three
  genuinely different authored implementations.

Known cosmetic gaps, recorded rather than hidden:

- Class Center B and C bottom out at the 0.24 zoom floor and still overflow the
  review canvas by ~105px and ~317px. Both are intentionally tall stacked
  compositions. Full screen scrolls them correctly.
- Empty states, MCAT Plan, Bookshelf, and M2M drills are not in `fitCanvas`
  because their sources have no `.frame` element for the fitter to scale. They
  scroll inside the preview instead. Fixing this means teaching `fitCanvas` a
  fallback canvas — do it deliberately, not as a drive-by.

These currently contain genuine A/B/C design variants:

- Overview
- Academics Class Center
- Academics Empty states
- Academics Planner

These now carry A/B/C for **every** named product view (Aug 2026 pass — 20
views, 60 variant definitions, declared in `VIEW_VARIANTS` in
`variant-lab.html`):

- Assignments: Agenda / Weekly / Calendar
- Class Hub: Overview / Materials / Topics / Assignments / Notes
- Review Session: Session start / Recall / Gap report
- Exam-plan builder: Accelerated / Steady / Catch-up
- Syllabus import: Upload / Review before apply / Re-import diff
- Class types: Comparison / STEM / Writing
- **Requirements: Gap & pace / All requirements / Prior credit** *(new, Aug 2026)*
- **Grades & Archive: Ledger / GPA / What-if** *(new, Aug 2026)*

### The `wrap-per-view` DOM contract

Class Hub, Requirements and Grades & Archive share one shape, and any new
multi-view page should too:

```html
<div class="frame">
  <div class="ban"> … banner, mode pill, underline tabs … </div>
  <div class="lab">Product view 1 — …</div>
  <div class="wrap"> … view 1, its own solid filter bar inside … </div>
  <div class="lab">Product view 2 — …</div>
  <div class="wrap"> … view 2 … </div>
</div>
```

Register it with `authoredViews:"wrap-per-view"` and it isolates correctly with
no new code. Each view carries its own level-3 filter bar rather than adding a
fourth nav level — the three-level rule still holds.

The draft-source and archived pages now also carry working A/B/C. Their
treatments had been authored blind while the switcher was disabled, so most of
them targeted classes that do not exist in the source. All of these were
rewritten against the real DOM:

| Page / view | What was wrong |
|---|---|
| Assignments · Weekly | Targeted `.wkd` (a label) instead of `.wkcol` / `.wkgrid` |
| Assignments · Calendar | Set grid columns on a single-child `.card`; authored view already had the rail |
| Review session · Recall & Gap report | Targeted `.col` / `.sbody` / `.sc2` / `.qr`, which live in `.scene`, not `.focus` |
| Class types · STEM & Writing | `nth-child(n+4)` — STEM has 2 panels, Writing has 3 |
| MCAT · M2M drills | Targeted a `.phone` class that does not exist in the source |
| Old Daily/Planning | `.seg .pill` — the control is `.seg > button` |
| Old study hub | `.grid > .card` — the grid holds unclassed divs |
| Old clinical pillar | `:first-of-type` / `:last-of-type` resolved to `.subtabs` and `.foot` |
| Overview | Dead `.chip` and `.btn.g` selectors |

**Lesson worth keeping: a variant that renders is not the same as a variant that
does anything.** A treatment whose selectors match nothing fails silently and
looks identical to A. Before trusting a new treatment, confirm the selector
actually exists in that source file and that the element it targets has enough
children for the rule to matter.

These are intentionally unfinished. They are honest placeholders carrying named
directions only, and must not be presented as completed variant sets:

- most MCAT tabs
- Letters, Experiences, Essays, School List, Timeline, Profile, Help, Settings

**Academics is now fully mocked.** Requirements and Grades & Archive were
drawn in Aug 2026 and removed from `placehold()` entirely — that is the pattern
to follow when a placeholder graduates. Do not leave a dressed-up placeholder
behind once a real source file exists.

## Recommended continuation order

1. ~~Finish A/B/C across every existing Academics product view.~~ Done. Every
   drawn page and every drawn product view now has three working treatments.
2. ~~Mock Requirements.~~ Done — `01-academics/academics-requirements.html`,
   three product views, A/B/C each.
3. ~~Mock Grades & Archive.~~ Done — `01-academics/academics-grades-archive.html`,
   three product views, A/B/C each.
4. Return to MCAT in its documented product order. Each MCAT tab already has
   three proposed directions written in `PLACEHOLDER_DIRECTIONS` — start from
   those rather than inventing new ones.
5. Replace a “coming soon” entry only after its substantive mockup exists.

## How to add a new page

1. Read the relevant specification and nearby `.md` mockup notes first.
2. Create the source HTML in the appropriate numbered product folder.
3. Preserve source mockups; use the lab to compare alternatives rather than
   destructively replacing approved work.
4. Add the page to `variant-lab.html` in product order.
5. Declare its product views with stable, readable slugs.
6. Declare A/B/C independently from those views.
7. Keep unfinished variants visibly unfinished; do not duplicate one design
   three times merely to populate the switcher.
8. Update `VARIANT-LAB.md` and this handoff when the inventory or model changes.
9. Test normal mode, full screen, direct URLs, every product-view button, and
   both variant arrows.

## Architecture note for the next pass

Implemented (Aug 2026). The lookup is live:

```text
page -> product view -> design variant -> source/layout treatment
```

- `VIEW_VARIANTS` holds per-view A/B/C, keyed `pageId -> viewSlug -> {v,b,c}`.
- `currentVariantSet()` resolves it, falling back to the page-level set for
  flat pages. Everything downstream (`currentKeys`, `renderMeta`,
  `injectedCss`, the body label) reads through it.
- `view=` and `variant=` are fully independent in state and URL. Switching a
  view clamps rather than resets the letter.

**Constraint for anyone extending this:** product-view pages are isolated by
`isolateAuthoredView()` *before* variant CSS is injected, so a treatment must
only target descendants of the isolated view. Toggling sibling frames from a
variant treatment will fight isolation and silently lose.

Do not collapse the lookup back into one flat array.

## Preservation and honesty rules

- Documentation is the source of truth.
- Do not implement these mockups in the Premed OS app unless separately asked.
- Do not invent zero-value metrics, fake charts, or empty recommendation shells.
- Keep Academics cold-start actions inside Daily → Class Center.
- “Import a syllabus” remains the primary cold-start action.
- “Add manually” remains visible and secondary.
- Keep archived concepts separated from the active product structure.
- Preserve unrelated files and existing user work.

## Files to read

- `VARIANT-LAB.md` — lab behavior and navigation rules
- `variant-lab.html` — review application and page registry
- `README.md` — mockup folder overview
- the matching `.md` beside each source HTML
- `_shared/` — reusable visual and interaction patterns

Before claiming completion, reload the live lab and visually inspect the final
render. A syntax check alone is not sufficient for mockup work.
