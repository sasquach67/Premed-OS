# Mockup Translation Contract

**Status:** Required implementation contract

**Scope:** Translating the mirrored HTML mockups in `specifications/mockups/` into the root `src/` application

**Question answered:** When a mockup and the app design system disagree, what happens?

> **The mockup is right about what goes where and how it behaves; the app's design system is right about how it looks.**

This is the mechanical form of `04-visual-craft-standards.md` §0a–§0c. A builder must complete the checklist in order. Do not choose whichever source looks better.

## 1. The no-judgment translation checklist

For each product view in the mockup:

1. **Freeze the mockup source.** Read only the mirror in `specifications/mockups/`. Never edit a mockup while implementing it.
2. **Inventory the drawing.** Record every element, its order, grouping, product-view boundary, interaction, state, and displayed string. These are the mockup's binding facts.
3. **Resolve the product contract.** Check the product-shell and tab specifications for routes, ownership, behavior, and data. A picture cannot create a route, collection, metric, or record that the product contract does not define.
4. **Resolve each recurring pattern through §3.** If the inventory gives a component, use that component. Do not copy the mockup's hand-rolled HTML. If the table says `NEW`, stop and add one shared implementation through the component process; do not coin a component name in feature code.
5. **Replace every visual literal through §2 and Appendix A.** No mockup hex, radius, font family, font size, or spacing scale crosses into app code. Use semantic tokens according to the declaration's role.
6. **Answer the glass question in §4.** The answer determines glass versus solid-with-depth; personal preference does not.
7. **Bind real data.** If the pictured data does not exist, render the real empty, loading, error, or partial state from §7. Never reproduce the sample population.
8. **Preserve richness.** Apply the flatness guard in §8. Decluttering cannot remove depth, motion, feedback, or the approved visual character.
9. **Verify all states.** Compare structure, order, grouping, interaction flow, empty/partial behavior, and copy against the mockup; compare palette, type, radii, spacing, icons, components, and motion against the app system. Verify both themes where the app supports them and verify reduced motion.

The implementation is conforming only when both comparisons pass.

## 2. Tokens: literal input never becomes literal output

### 2.1 Mechanical resolution order

For every mockup CSS declaration, resolve its value in this order:

1. **Determine the surface:** `05-public/*` is the public layer; every other mockup is the signed-in app.
2. **Determine the semantic role from the element and CSS property:** background, card/popover, text, muted text, border/input, focus ring, primary action, success, warning, destructive, or named product category.
3. **Use the matching token family below.** Never select a token because its current hex merely looks closest.
4. **Preserve translucency with the selected semantic token:** use `color-mix()` with that token and `transparent` in the signed-in app. On the public primary accent, use `rgba(var(--pl-pri-rgb), <alpha>)`. Never paste the mockup's RGB triplet.
5. **If the literal has several roles, the role wins.** Appendix A therefore may list several allowed destinations for one literal. The declaration's property and element choose exactly one.
6. **If no semantic role exists, do not introduce a color.** Use the neutral surface/text/border token for that property. Decorative mockup-only palette steps do not become new tokens.

| Mockup role | Signed-in app destination (`src/index.css`) | Public destination (`public-layer.css`) |
|---|---|---|
| page field | `var(--background)` | public field owned by `.pl`; no local literal |
| card/content surface | `var(--card)` | `var(--pl-card)` |
| popover/overlay surface | `var(--popover)` | `var(--pl-card)` or the existing public glass primitive |
| main text | `var(--foreground)` | `var(--pl-fg)` |
| secondary/dim text | `var(--muted-foreground)` | `var(--pl-mut)`, `var(--pl-dim)`, or `var(--pl-fine)` by the existing public role |
| muted fill | `var(--muted)` | `var(--pl-soft)` |
| border or input edge | `var(--border)` / `var(--input)` | `var(--pl-bd)` |
| primary action/accent | `var(--primary)` | `var(--pl-pri)` |
| focus ring | `var(--ring)` | `var(--pl-pri)` |
| ink on a primary fill | `var(--primary-foreground)` | `var(--pl-ink)` |
| success | `var(--success)` | `var(--pl-success)` |
| warning | `var(--warning)` | `var(--pl-warning)` |
| danger/destructive | `var(--destructive)` | `var(--pl-danger)` |
| GPA / MCAT / shadowing / volunteer / activities / clinical / research / letters | `var(--cat-gpa)` / `var(--cat-mcat)` / `var(--cat-shadow)` / `var(--cat-volunteer)` / `var(--cat-activities)` / `var(--cat-clinical)` / `var(--cat-research)` / `var(--cat-letters)` | the same named category tokens when a public illustration genuinely encodes that category |

### 2.2 The August 2026 blue split is intentional

The public accent moved with the confirmed Premed OS mark:

- public primary: `--pl-pri: #5293cc`;
- public light wordmark step: `--pl-pri-lt: #79abd7`;
- public alpha source: `--pl-pri-rgb: 82, 147, 204`.

Therefore, any public mockup drawn with `#6fb3de`, or with `rgba(111, 179, 222, …)`, is pre-revision. The token wins. Replace solid uses with `var(--pl-pri)` and alpha uses with `rgba(var(--pl-pri-rgb), alpha)`. `--pl-pri-lt` belongs to the approved wordmark ramp; it is not a generic hover color.

The signed-in app is deliberately different. Its `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring`, and `--cat-gpa` remain on the existing blue values, including dark-theme `#6fb3de` and category `#4b9cd3`. They are on `CLAUDE.md`'s locked list. **Do not unify these with the public accent and do not “fix” the difference.**

### 2.3 Radius translation

The signed-in app's radius source is `--radius: 0.9rem`, exposed as `--radius-sm`, `--radius-md`, `--radius-lg`, and `--radius-xl` in `src/index.css`. Use the component library's `rounded-full` only for a true circle or pill. The public layer uses `--r-field`, `--r-card`, and `--r-pill`.

Appendix A maps every hardcoded mockup radius. Multi-corner declarations keep their structural zero corners, but every nonzero corner uses the mapped token. A mockup's `7px`, `11px`, or `18px` is never copied merely to preserve its silhouette.

### 2.4 Type translation

Font family is never inferred from a mockup:

- display and headings: `var(--font-display)` (`Baloo 2`);
- body and controls: `var(--font-sans)` (`Nunito`).

The signed-in app consumes Tailwind's `--text-*` theme scale through the `@import 'tailwindcss'` in `src/index.css`; it does not define a second bespoke numeric scale. The public layer owns the explicit `--t-*` fluid scale in `public-layer.css`. Appendix A maps every hardcoded mockup `font-size` to one of those real destinations. Use the semantic role first; the table's numeric bucket is the deterministic fallback when the mockup gives no role.

### 2.5 Spacing translation

The mockup controls adjacency, grouping, and relative emphasis; it does not control pixel gaps. In the signed-in app, translate gaps and padding to the existing Tailwind 4px spacing scale. In the public layer, translate them to `--s-1` through `--s-6`. Do not create a one-off spacing variable to reproduce a drawing.

## 3. Components: one job, one component

This table is the required routing result of `component-inventory.md`. `NEW` means the inventory has no single owner for the pattern. It does **not** authorize a feature-local component or a guessed component name.

| Recurring mockup pattern | One component to use | Mechanical ruling |
|---|---|---|
| stat strip | **NEW** | `Ring` and `StatTile` are deprecated for routine metrics; the inventory specifies a compact stat row but names no owner. |
| sub-tab underline navigation | `Animated Tabs` | Keep the product views and order from the mockup; use the shared tabs behavior and app styling. |
| expandable row | `Collapsible` | The row remains one disclosure control; do not create a parallel expandable-list implementation. |
| inline add row | **NEW** | No inventory component owns inline collection creation. |
| contact card | `Card` | Compose the existing card primitive; clicking a record still follows the shared record-open model. |
| banner hero | `PageBanner` | Preserve the pictured content order inside the existing banner owner. |
| glass card | **NEW** | The inventory names no one cross-app glass-card component. Do not hand-roll another glass recipe. |
| mascot note | **NEW** | The inventory names no mascot-note owner. Do not invent a replacement name in a feature. |
| InfoTip | `InfoTip` | Use only for terse factual clarification, not teaching copy or safety-critical content. |
| tracker table | `TrackerTable` | Enhance the one table implementation; never build a second data table. |
| center-peek | `CenterPeek` | Record click opens through the shared record-open grammar. |
| kanban | `Kanban` | Add needed behavior to the shared workflow board; do not fork it. |

Before writing a `NEW` pattern, search `src/components/`. If an implementation exists but the inventory omitted it, the defect is inventory drift: adopt the existing component and update the inventory in the same implementation task. Do not create a duplicate. This preserves §0b even when the inventory lags the code.

## 4. Glass: one-look yes/no test

Ask exactly one question:

> **Is this surface floating over the banner or overlaying content such that the material behind it is meaningfully visible?**

- **Yes:** use the one existing glass implementation for that layer. It must include translucency, blur, a hairline light edge, the inset highlight, and depth. Do not reconstruct the recipe from the mockup.
- **No:** use a solid tokenized surface with border/shadow depth. Tables, dense lists, forms, charts, trackers, and ordinary content panels always answer **No**.

The question is about spatial function, not aesthetics. A translucent dense data card is a defect; a flat opaque floating overlay is also a defect.

## 5. What a mockup may never dictate

A mockup may never dictate:

- font family, weight inventory, or numeric type scale;
- palette, literal hex/RGB/HSL values, alpha source, or theme behavior;
- radii;
- the spacing scale or one-off pixel gaps;
- icon library or icon drawing; the app uses the existing Lucide set;
- its `<style>` block, inline CSS, reset, utility names, or layout implementation technique;
- a hand-rolled component when the component inventory already assigns that job;
- a second table, record-open model, type system, radius system, spacing system, or motion system;
- placeholder records, zero-value metrics, fake charts, or inferred collections;
- route ownership, storage behavior, recommendation logic, or other product rules contradicted by an authoritative specification.

Copying mockup CSS into `src/` is always a contract violation, even when the screenshot matches.

## 6. What a mockup is always authoritative on

Subject to the product specification's behavior and data rules, the mockup is authoritative on:

- which elements exist in the product view;
- their order, adjacency, grouping, and hierarchy;
- the product-view structure: tabs, steps, modes, panels, and named states;
- interaction flow and disclosure sequence;
- where an action originates and what surface opens next;
- which controls and information appear together;
- empty and partial-state composition shown in the drawing;
- copy shown in the drawing, unless a later specification or factual-data rule corrects it;
- relative visual emphasis and which content receives the answer-first position.

“Use the design system” never authorizes rearranging the drawing into a generic dashboard.

## 7. Data that does not exist yet

Mockups show populated screens to communicate design. They are not seed files.

When the real collection is empty, ship `EmptyState` from `01-shared-interface-patterns.md` §8 and `04-visual-craft-standards.md` §9: an icon, title, hint, and first action that explain what belongs there, why it matters, and the first step. Render loading with sectional skeletons. Render errors inline in the failed region with what failed and retry while the rest of the page survives. Preserve a real partial record as partial; do not fill its gaps.

`04` §0 directive 5 requires realistic content in **design review**. It does not license fake data in the **app**. A missing pictured metric is omitted or represented by the specified null/empty state; it is never rendered as zero unless zero is the real stored/computed value.

The drift sweep from `6276224..HEAD` reinforces this boundary: ownership moved to its specified surface, keyboard behavior was centralized, glossary guidance was made factual, persistence failures became visible, dismissed intelligence was retired, generation was limited to student-supplied grounding, task/assignment surfaces were removed from Timeline, and advising content was relocated to its ruled temporary home. These changes all follow the same rule: a drawing cannot overrule product ownership, factual provenance, or real state.

## 8. The flatness guard

**Rule:** An implementation that makes the mockup flat or plain is defective.

Restraint removes content clutter and unnecessary metaphor only. It never removes:

- depth that communicates layering;
- glass from a surface that passes the §4 test;
- solid-with-depth treatment from dense content surfaces;
- systematic motion, origin-aware transitions, hover/focus feedback, or reduced-motion equivalents;
- bold hierarchy, rich approved color, illustration, or polished microinteraction;
- a component's helpful affordance merely to reduce visual detail.

If a decluttering change reduces depth, motion, feedback, or richness, reject it and find the actual content/metaphor clutter instead.

## 9. Pull-request gate

Before merging a mockup translation, the implementer must be able to check every box:

- [ ] I read the mirror and did not edit it.
- [ ] Elements, order, grouping, product-view structure, flow, states, and copy match the mockup.
- [ ] Routes, ownership, behavior, and data match the product specification.
- [ ] Every recurring pattern resolves through §3; no duplicate component was added.
- [ ] No mockup font, color literal, radius, numeric type size, spacing scale, icon set, or CSS was copied.
- [ ] Every hardcoded mockup literal encountered resolves through §2 and Appendix A.
- [ ] Public blue uses `--pl-pri`, `--pl-pri-lt`, and `--pl-pri-rgb`; signed-in locked blues remain untouched.
- [ ] Every surface answered the glass question once and uses the corresponding shared treatment.
- [ ] The app renders real data or its real empty/loading/error/partial state, never mockup sample data.
- [ ] Decluttering did not flatten the experience.
- [ ] Keyboard, focus, responsive behavior, both supported themes, and reduced motion were verified.

## Appendix A — literal census from mockup `<style>` blocks

This census covers every `<style>` block in all 43 mirrored HTML sources. Comments are excluded. Radius and type declarations already expressed as `var(...)` are excluded because they are not hardcoded. A row with more than one destination means that the same literal appears in more than one semantic role; §2.1 selects by role, never by visual similarity. `app` means every non-`05-public` mockup; `public` means `05-public/*`.

### A1. Hex colors

| Mockup literal | Scope | Required token destination(s) | Source |
|---|---|---|---|
| `#0004` | app | `var(--foreground)` | [M04] |
| `#08202e` | app | `var(--primary)` | [M12], [M15] |
| `#0c2740` | app | `var(--primary)` | [M18] |
| `#0d1f20` | app | `var(--primary)` | [M39] |
| `#0d1f2c` | app | `var(--cat-gpa)` | [M06], [M09], [M10], [M41], [M42] |
| `#0d2b24` | app | `var(--success)` | [M18] |
| `#0e2119` | app | `var(--cat-clinical)` | [M36] |
| `#0e2233` | app | `var(--cat-gpa)` | [M16] |
| `#0e2620` | app | `var(--primary)` | [M38] |
| `#0f1b24` | app | `var(--cat-gpa)` | [M11], [M17] |
| `#0f1c26` | app | `var(--cat-gpa)` | [M02], [M03], [M08] |
| `#0f2330` | app | `var(--primary-foreground)`; `var(--primary)` | [M01], [M06], [M09], [M12], [M15], [M22], [M24], [M36], [M37], [M39], [M41], [M42] |
| `#0f2330` | public | `var(--pl-ink)` | [M33], [M35] |
| `#0f6e56` | app | `var(--success)` | [M18] |
| `#101820` | app | `var(--cat-gpa)` | [M43] |
| `#10201a` | app | `var(--cat-clinical)` | [M25], [M26], [M29], [M30], [M31] |
| `#102432` | app | `var(--primary)` | [M14] |
| `#11100e` | app | `var(--card)` | [M43] |
| `#12241f` | app | `var(--cat-clinical)` | [M39] |
| `#131211` | app | `var(--background)` | [M28] |
| `#14120f` | app | `var(--card)` | [M11], [M17], [M23], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M40] |
| `#141210` | app | `var(--card)` | [M43] |
| `#151310` | app | `var(--card)` | [M07], [M16] |
| `#16120e` | app | `var(--foreground)` | [M06], [M09], [M22], [M39] |
| `#16222c` | app | `var(--cat-gpa)` | [M07] |
| `#16231a` | app | `var(--foreground)` | [M32] |
| `#171512` | app | `var(--card)`; `var(--background)` | [M03], [M43] |
| `#17222c` | app | `var(--foreground)` | [M02], [M03], [M06], [M09], [M10], [M11], [M12], [M14], [M15], [M19], [M24], [M39], [M42] |
| `#17222c` | public | `var(--pl-ink)` | [M33], [M34], [M35] |
| `#172c3d` | app | `var(--cat-gpa)` | [M05] |
| `#181428` | app | `var(--cat-mcat)` | [M21] |
| `#181613` | app | `var(--card)` | [M43] |
| `#185fa5` | app | `var(--primary)` | [M13], [M18] |
| `#191613` | app | `var(--card)` | [M14] |
| `#191713` | app | `var(--card)` | [M02] |
| `#1a1714` | app | `var(--card)` | [M01], [M06], [M09], [M10], [M12], [M15], [M22], [M24], [M36], [M37], [M38], [M39], [M41], [M42], [M43] |
| `#1a1714` | public | `var(--pl-card)` | [M33], [M35] |
| `#1a1917` | app | `var(--background)`; `var(--foreground)` | [M13], [M18], [M20] |
| `#1a2c22` | app | `var(--card)` | [M28] |
| `#1b2831` | app | `var(--foreground)` | [M37] |
| `#1b2c22` | app | `var(--card)` | [M16] |
| `#1d1830` | app | `var(--cat-mcat)` | [M19] |
| `#1d1a17` | public | `var(--pl-card)` | [M33] |
| `#1d1b18` | app | `var(--card)` | [M12], [M15] |
| `#1d2a25` | app | `var(--border)` | [M08] |
| `#1d2c37` | app | `var(--card)` | [M04] |
| `#1d3a5c` | app | `var(--cat-gpa)` | [M16] |
| `#1e1a16` | app | `var(--card)` | [M43] |
| `#1e1d1b` | app | `var(--card)` | [M28] |
| `#1e252c` | app | `var(--card)` | [M16] |
| `#1f1e1c` | app | `var(--foreground)`; `var(--card)` | [M13], [M18], [M20] |
| `#201d19` | app | `var(--foreground)` | [M10], [M14] |
| `#20300c` | app | `var(--success)` | [M18] |
| `#20313f` | app | `var(--primary)` | [M28] |
| `#211e19` | app | `var(--card)` | [M05] |
| `#211e1a` | app | `var(--background)` | [M01], [M02], [M03], [M04], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M39], [M40], [M41], [M42], [M43] |
| `#211e1a` | public | `var(--pl-ink)` | [M33], [M35] |
| `#211f1b` | app | `var(--card)` | [M13], [M18], [M20] |
| `#232b34` | public | `var(--pl-card)` | [M33] |
| `#233448` | app | `var(--card)` | [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M17], [M23], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M40], [M42] |
| `#233448` | public | `var(--pl-card)` | [M33], [M34] |
| `#241c10` | app | `var(--warning)` | [M39] |
| `#241f1b` | app | `var(--card)`; `var(--foreground)` | [M12], [M15], [M38] |
| `#241f45` | app | `var(--primary)` | [M20] |
| `#242019` | public | `var(--pl-card)` | [M33], [M34], [M35] |
| `#24201b` | app | `var(--card)` | [M43] |
| `#243542` | public | `var(--pl-card)` | [M35] |
| `#24382c` | app | `var(--card)` | [M16] |
| `#244d69` | app | `var(--primary)` | [M05] |
| `#245779` | app | `var(--primary)` | [M05] |
| `#252b31` | public | `var(--pl-card)` | [M33] |
| `#262320` | app | `var(--card)` | [M07] |
| `#26251f` | app | `var(--card)` | [M13], [M18], [M20] |
| `#262523` | app | `var(--card)` | [M28] |
| `#26303c` | public | `var(--pl-card)` | [M34] |
| `#26313d` | app | `var(--card)` | [M12], [M15] |
| `#272319` | app | `var(--card)` | [M37] |
| `#27231f` | app | `var(--card)` | [M10], [M14], [M43] |
| `#272420` | app | `var(--card)` | [M06], [M07], [M09], [M14], [M22], [M36], [M39], [M41], [M42] |
| `#28231f` | app | `var(--sidebar)` | [M04] |
| `#282420` | app | `var(--background)` | [M37], [M38] |
| `#293a47` | app | `var(--card)` | [M05] |
| `#2a1c20` | app | `var(--foreground)` | [M38] |
| `#2a2028` | app | `var(--foreground)` | [M38] |
| `#2a2b2c` | public | `var(--pl-card)` | [M34] |
| `#2a2f33` | public | `var(--pl-card)` | [M35] |
| `#2a3646` | public | `var(--pl-card)` | [M33] |
| `#2b2722` | app | `var(--card)` | [M01], [M02], [M03], [M04], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M39], [M40], [M41], [M42], [M43] |
| `#2b2722` | public | `var(--pl-card)` | [M33], [M35] |
| `#2b2740` | app | `var(--card)` | [M19], [M21] |
| `#2b2c2a` | app | `var(--card)` | [M12], [M15] |
| `#2b4258` | app | `var(--primary)` | [M28] |
| `#2b4740` | app | `var(--card)` | [M16] |
| `#2c2722` | app | `var(--border)` | [M05] |
| `#2c2823` | app | `var(--muted)` | [M37], [M38] |
| `#2c3540` | app | `var(--card)` | [M16] |
| `#2c3a4a` | app | `var(--card)` | [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M17], [M23], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M39], [M40], [M42] |
| `#2c4a38` | app | `var(--card)` | [M16] |
| `#2d2924` | app | `var(--card)` | [M38] |
| `#2e2a25` | app | `var(--card)` | [M16] |
| `#2e3b46` | app | `var(--card)` | [M37] |
| `#2f2a24` | app | `var(--card)` | [M12], [M15], [M37] |
| `#2f4038` | app | `var(--card)` | [M36] |
| `#2f5f7e` | app | `var(--primary)` | [M16] |
| `#302c46` | app | `var(--card)` | [M19], [M21] |
| `#302f2c` | app | `var(--border)` | [M28] |
| `#303941` | app | `var(--card)` | [M05] |
| `#322d27` | app | `var(--card)` | [M37], [M38] |
| `#322e28` | app | `var(--muted)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M39], [M40], [M41], [M42], [M43] |
| `#322e28` | public | `var(--pl-soft)` | [M33], [M35] |
| `#331f1a` | app | `var(--destructive)` | [M28] |
| `#332711` | app | `var(--warning)` | [M28] |
| `#332c25` | app | `var(--card)` | [M12], [M15] |
| `#332e28` | app | `var(--border)` | [M12], [M15] |
| `#33303c` | app | `var(--card)` | [M38] |
| `#33564f` | app | `var(--card)` | [M16] |
| `#37312a` | app | `var(--card)` | [M37] |
| `#378add` | app | `var(--primary)` | [M20] |
| `#3a1717` | app | `var(--destructive)` | [M18] |
| `#3a2c10` | app | `var(--warning)` | [M18], [M20] |
| `#3a2f8f` | app | `var(--cat-gpa)` | [M20] |
| `#3a332c` | app | `var(--border)` | [M37], [M38] |
| `#3a3530` | app | `var(--foreground)` | [M04] |
| `#3a3730` | app | `var(--card)` | [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M17], [M19], [M21], [M23], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M40], [M42] |
| `#3a3730` | public | `var(--pl-card)` | [M33] |
| `#3a382f` | app | `var(--border)` | [M13], [M18], [M20] |
| `#3a3936` | app | `var(--border)` | [M28] |
| `#3a4655` | app | `var(--foreground)` | [M05] |
| `#3a4a52` | app | `var(--card)` | [M37] |
| `#3b2f4a` | app | `var(--card)` | [M01], [M22], [M24], [M41] |
| `#3b362f` | app | `var(--border)` | [M05] |
| `#3b6d11` | app | `var(--success)` | [M13], [M18] |
| `#3b9e6f` | app | `var(--cat-clinical)` | [M20] |
| `#3c352d` | app | `var(--border)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M39], [M40], [M41], [M42], [M43] |
| `#3c352d` | public | `var(--pl-bd)` | [M33], [M35] |
| `#3c4a52` | app | `var(--card)` | [M07] |
| `#3c5b60` | app | `var(--card)` | [M39] |
| `#3c6560` | app | `var(--card)` | [M16] |
| `#3d2b2a` | app | `var(--card)` | [M11] |
| `#3d4a58` | public | `var(--pl-card)` | [M33] |
| `#3d5f4a` | app | `var(--card)` | [M16] |
| `#3f4a34` | app | `var(--card)` | [M37] |
| `#3f98d6` | app | `var(--foreground)`; `var(--primary)` | [M05] |
| `#403a33` | app | `var(--border)` | [M04] |
| `#41645a` | app | `var(--card)` | [M36] |
| `#423a32` | app | `var(--border)` | [M37], [M38] |
| `#432f2c` | app | `var(--card)` | [M11] |
| `#43413a` | app | `var(--border)` | [M12], [M15] |
| `#439bda` | app | `var(--primary)` | [M04] |
| `#443c33` | app | `var(--border)` | [M12], [M15] |
| `#459cd7` | app | `var(--primary)` | [M05] |
| `#46584f` | app | `var(--card)` | [M37] |
| `#474037` | app | `var(--card)` | [M05] |
| `#495438` | app | `var(--card)` | [M37] |
| `#4a4139` | app | `var(--card)` | [M37] |
| `#4a4238` | app | `var(--border)` | [M43] |
| `#4b3fd6` | app | `var(--primary)` | [M20] |
| `#4b414a` | app | `var(--card)` | [M38] |
| `#4b6572` | app | `var(--border)` | [M07] |
| `#4b9cd3` | app | `var(--cat-gpa)` | [M02], [M03], [M05], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M22], [M23], [M24], [M37], [M38], [M40], [M41], [M42], [M43] |
| `#4b9cd3` | public | `var(--cat-gpa)` | [M33], [M35] |
| `#4d4238` | app | `var(--border)` | [M38] |
| `#4fa3a8` | app | `var(--primary)` | [M39] |
| `#544a3f` | app | `var(--border)` | [M37], [M38] |
| `#55736c` | app | `var(--card)` | [M10], [M41] |
| `#58606d` | app | `var(--foreground)` | [M05] |
| `#59616d` | app | `var(--foreground)` | [M05] |
| `#5aa9de` | app | `var(--primary)` | [M37] |
| `#5b4c40` | app | `var(--card)` | [M37] |
| `#5b9bd5` | app | `var(--primary)` | [M28] |
| `#5c8a86` | app | `var(--card)` | [M16] |
| `#5c9fd4` | app | `var(--cat-gpa)` | [M16] |
| `#5dcaa5` | app | `var(--success)` | [M18] |
| `#5f574c` | app | `var(--foreground)` | [M32] |
| `#5f5a52` | app | `var(--card)` | [M16] |
| `#5fae98` | app | `var(--cat-clinical)` | [M12] |
| `#5fb49c` | app | `var(--cat-volunteer)` | [M22], [M24], [M36], [M37], [M38] |
| `#5fb49c` | public | `var(--cat-volunteer)` | [M33] |
| `#6aa84f` | app | `var(--cat-clinical)` | [M10], [M41] |
| `#6b6459` | app | `var(--muted-foreground)` | [M02], [M03] |
| `#6b6862` | app | `var(--foreground)` | [M07], [M16] |
| `#6c6154` | app | `var(--foreground)` | [M37] |
| `#6cc39a` | app | `var(--cat-volunteer)` | [M28] |
| `#6d5b4b` | app | `var(--muted-foreground)` | [M37] |
| `#6d8f86` | app | `var(--card)` | [M10], [M41] |
| `#6ea8de` | app | `var(--primary)` | [M28] |
| `#6f6d67` | app | `var(--muted)` | [M13], [M18], [M20] |
| `#6fae6e` | app | `var(--cat-clinical)` | [M01], [M02], [M03], [M06], [M09], [M16], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M37], [M38], [M40], [M41], [M42] |
| `#6fae6e` | public | `var(--cat-clinical)` | [M33], [M35] |
| `#6fb3de` | app | `var(--primary)`; `var(--ring)`; `var(--sidebar-primary)`; `var(--sidebar-ring)` | [M01], [M06], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M22], [M24], [M36], [M39], [M41], [M42] |
| `#6fb3de` | public | `var(--pl-pri)` | [M33], [M34], [M35] |
| `#6fc0a8` | app | `var(--success)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M41], [M42], [M43] |
| `#6fc0a8` | public | `var(--pl-success)` | [M33], [M34], [M35] |
| `#72a996` | app | `var(--cat-volunteer)` | [M23], [M40] |
| `#73aede` | app | `var(--cat-gpa)` | [M05] |
| `#75726b` | app | `var(--muted-foreground)` | [M28] |
| `#75b8e7` | app | `var(--primary)` | [M04] |
| `#776f65` | app | `var(--foreground)` | [M43] |
| `#78b2e2` | app | `var(--cat-gpa)` | [M05] |
| `#7a4f5a` | app | `var(--card)` | [M01], [M22], [M24], [M41] |
| `#7a6a54` | app | `var(--card)` | [M39] |
| `#7a7167` | app | `var(--foreground)` | [M10], [M14] |
| `#7c7264` | app | `var(--muted-foreground)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M41], [M42], [M43] |
| `#7c7264` | public | `var(--pl-dim)` | [M33], [M35] |
| `#7d6558` | app | `var(--card)` | [M38] |
| `#7d6a52` | app | `var(--card)` | [M37] |
| `#7d7050` | app | `var(--card)` | [M36] |
| `#7fa8d8` | public | `var(--cat-research)` | [M34] |
| `#7fc1e9` | app | `var(--primary)` | [M43] |
| `#7fd0b8` | app | `var(--cat-clinical)` | [M12] |
| `#81786b` | app | `var(--foreground)` | [M05] |
| `#81786d` | app | `var(--muted)` | [M04] |
| `#85b7eb` | app | `var(--primary)` | [M13], [M18] |
| `#887e70` | app | `var(--foreground)` | [M05] |
| `#888780` | app | `var(--muted-foreground)` | [M13], [M18], [M20] |
| `#89a7c4` | app | `var(--cat-gpa)` | [M12], [M15] |
| `#8aa9a0` | app | `var(--card)` | [M10], [M41] |
| `#8c7bd4` | app | `var(--cat-mcat)` | [M01], [M02], [M03], [M06], [M07], [M09], [M10], [M12], [M14], [M15], [M16], [M19], [M21], [M22], [M23], [M24], [M37], [M41] |
| `#8c7bd4` | public | `var(--cat-mcat)` | [M33], [M35] |
| `#8c8275` | app | `var(--foreground)` | [M05] |
| `#8ddcc3` | app | `var(--cat-clinical)` | [M19] |
| `#8f8475` | app | `var(--foreground)` | [M43] |
| `#8fa3b5` | app | `var(--foreground)` | [M16] |
| `#8fc4ea` | app | `var(--cat-gpa)` | [M16] |
| `#8fc6e8` | app | `var(--primary)` | [M12], [M15] |
| `#8fd6c1` | app | `var(--cat-clinical)` | [M11] |
| `#93c47d` | app | `var(--cat-clinical)` | [M10], [M41] |
| `#97c459` | app | `var(--success)` | [M13], [M18] |
| `#9a978f` | app | `var(--muted-foreground)` | [M13], [M18], [M20] |
| `#9b9184` | app | `var(--foreground)` | [M05] |
| `#9d9a93` | app | `var(--muted)` | [M28] |
| `#9fb3c4` | app | `var(--foreground)` | [M12], [M15] |
| `#a06a12` | app | `var(--warning)` | [M13], [M18], [M20] |
| `#a1968a` | app | `var(--foreground)` | [M43] |
| `#a1998e` | app | `var(--foreground)` | [M05] |
| `#a32d2d` | app | `var(--destructive)` | [M13], [M18] |
| `#a5ccee` | app | `var(--cat-gpa)` | [M05] |
| `#a79ff0` | app | `var(--primary)` | [M20] |
| `#a8875c` | app | `var(--card)` | [M36], [M39] |
| `#a89c8c` | app | `var(--muted-foreground)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M41], [M42], [M43] |
| `#a89c8c` | public | `var(--pl-dim)` | [M33], [M35] |
| `#a99f93` | app | `var(--foreground)` | [M05] |
| `#a9d3ee` | public | `var(--pl-pri-lt)` | [M33], [M35] |
| `#aba195` | app | `var(--foreground)` | [M05] |
| `#aea2d6` | app | `var(--cat-mcat)` | [M14] |
| `#b3a4ec` | app | `var(--cat-mcat)` | [M19], [M21] |
| `#b4b2a9` | app | `var(--muted)` | [M13], [M18], [M20] |
| `#b5aa9a` | app | `var(--foreground)` | [M43] |
| `#b6ada1` | app | `var(--muted)` | [M04] |
| `#b6cbdd` | app | `var(--cat-gpa)` | [M12], [M15] |
| `#b79ae0` | public | `var(--cat-mcat)` | [M34] |
| `#b8ab99` | app | `var(--foreground)` | [M37] |
| `#b9dcf3` | public | `var(--pl-pri-lt)` | [M34] |
| `#bdb3a4` | app | `var(--foreground)` | [M07] |
| `#c39a5c` | app | `var(--warning)` | [M37] |
| `#c4b6f2` | app | `var(--cat-mcat)` | [M07] |
| `#c4b9aa` | app | `var(--foreground)` | [M43] |
| `#c4dff3` | app | `var(--cat-gpa)` | [M05] |
| `#c8bcf0` | app | `var(--cat-mcat)` | [M15] |
| `#c98a1a` | app | `var(--warning)` | [M20] |
| `#c98a5e` | app | `var(--warning)` | [M01], [M22], [M24], [M41] |
| `#c98ac9` | app | `var(--cat-research)` | [M01], [M06], [M07], [M08], [M09], [M14], [M22], [M23], [M24], [M37], [M38], [M40], [M41], [M42], [M43] |
| `#c98ac9` | public | `var(--cat-research)` | [M33] |
| `#c98f88` | app | `var(--destructive)` | [M38] |
| `#c9a05e` | app | `var(--warning)` | [M36], [M39], [M43] |
| `#c9a4e8` | app | `var(--cat-letters)` | [M12] |
| `#d0b3ee` | app | `var(--cat-mcat)` | [M12] |
| `#d3c7b4` | app | `var(--foreground)` | [M37] |
| `#d3cbc0` | app | `var(--foreground)` | [M05] |
| `#d59b6a` | app | `var(--cat-letters)` | [M01], [M22], [M24], [M37] |
| `#d59b6a` | public | `var(--cat-letters)` | [M33], [M35] |
| `#d6f0d9` | app | `var(--foreground)` | [M16] |
| `#d7cdf7` | app | `var(--foreground)` | [M14] |
| `#d7cfc4` | app | `var(--foreground)` | [M05] |
| `#d8c3a0` | app | `var(--warning)` | [M36], [M39] |
| `#d97a63` | app | `var(--destructive)` | [M28] |
| `#d99b3a` | app | `var(--warning)` | [M28] |
| `#d9c2f2` | app | `var(--cat-mcat)` | [M12] |
| `#d9c79c` | app | `var(--cat-shadow)` | [M16] |
| `#d9cffc` | app | `var(--foreground)` | [M09], [M22] |
| `#d9edf7` | app | `var(--primary)` | [M04] |
| `#ddd1bf` | app | `var(--card)` | [M05] |
| `#e08b9b` | app | `var(--cat-activities)` | [M06], [M09], [M22], [M23], [M24], [M37], [M38], [M40], [M41] |
| `#e08b9b` | public | `var(--cat-activities)` | [M33] |
| `#e08e7a` | public | `var(--cat-letters)` | [M34] |
| `#e0a458` | app | `var(--cat-shadow)` | [M06], [M09], [M14], [M22], [M23], [M24], [M37], [M40], [M41], [M42] |
| `#e0a458` | public | `var(--cat-shadow)`; `var(--pl-warning)` | [M33], [M35] |
| `#e0effa` | app | `var(--foreground)` | [M05] |
| `#e1f5ee` | app | `var(--success)` | [M18] |
| `#e2f1fb` | app | `var(--primary)` | [M05] |
| `#e3dcd1` | app | `var(--foreground)` | [M05] |
| `#e4dccd` | app | `var(--border)` | [M05] |
| `#e4e1da` | app | `var(--border)` | [M13] |
| `#e5dccf` | app | `var(--border)` | [M04] |
| `#e5e2db` | app | `var(--border)` | [M18], [M20] |
| `#e6ded1` | app | `var(--foreground)` | [M16] |
| `#e6f1fb` | app | `var(--primary)` | [M18] |
| `#e7b06a` | app | `var(--warning)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M41], [M42], [M43] |
| `#e7b06a` | public | `var(--pl-warning)` | [M33], [M34], [M35] |
| `#e7c79a` | public | `var(--pl-warning)` | [M34] |
| `#e8806f` | app | `var(--destructive)` | [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M39], [M40], [M41], [M42] |
| `#e8806f` | public | `var(--pl-danger)` | [M33], [M35] |
| `#e8dfd2` | app | `var(--border)` | [M05] |
| `#e9dcc4` | public | `var(--pl-warning)` | [M33] |
| `#eaa9b6` | app | `var(--destructive)` | [M38] |
| `#eaf0f2` | app | `var(--foreground)` | [M05] |
| `#eaf3de` | app | `var(--success)` | [M18] |
| `#ece3d4` | app | `var(--foreground)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M41], [M42], [M43] |
| `#ece3d4` | public | `var(--pl-fg)` | [M33], [M34], [M35] |
| `#ecebfb` | app | `var(--primary)` | [M20] |
| `#edf6fc` | app | `var(--primary)` | [M05] |
| `#ef9f27` | app | `var(--warning)` | [M13], [M18], [M20] |
| `#f09595` | app | `var(--destructive)` | [M13], [M18] |
| `#f0bfc9` | app | `var(--destructive)` | [M38] |
| `#f0c68d` | app | `var(--warning)` | [M11] |
| `#f0c98d` | app | `var(--warning)` | [M37], [M38] |
| `#f1efe8` | app | `var(--foreground)`; `var(--card)` | [M13], [M18], [M20] |
| `#f2ece2` | app | `var(--foreground)` | [M16] |
| `#f3f1ec` | app | `var(--foreground)` | [M28] |
| `#f4eee6` | app | `var(--foreground)` | [M04] |
| `#f4f2ee` | app | `var(--card)` | [M13], [M18], [M20] |
| `#f7f0e5` | app | `var(--background)` | [M04] |
| `#f7f3ec` | app | `var(--warning)` | [M10], [M14], [M43] |
| `#f8f1e7` | app | `var(--warning)` | [M05] |
| `#faeeda` | app | `var(--warning)` | [M18] |
| `#faf0da` | app | `var(--warning)` | [M20] |
| `#faf9f7` | app | `var(--background)` | [M13], [M18], [M20] |
| `#fceceb` | app | `var(--destructive)` | [M18] |
| `#fff` | app | `var(--foreground)`; `var(--card)`; `var(--ring)`; `var(--border)` | [M01], [M02], [M03], [M04], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M18], [M19], [M20], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M41], [M42], [M43] |
| `#fff` | public | `var(--pl-fg)`; `var(--pl-card)`; `var(--pl-bd)` | [M33], [M34], [M35] |
| `#fffaf1` | app | `var(--sidebar)` | [M04] |
| `#fffaf2` | app | `var(--card)` | [M04] |
| `#fffaf3` | app | `var(--border)` | [M05] |
| `#ffffff` | app | `var(--card)` | [M13], [M18] |
| `#ffffff` | public | `var(--pl-card)` | [M33], [M34], [M35] |
| `#ffffff18` | app | `var(--card)` | [M04] |
| `#ffffff35` | app | `var(--border)` | [M04] |

### A2. Radii

| Mockup literal | Scope | Required destination | Source |
|---|---|---|---|
| `0` | app | `no radius (structural zero; no token)` | [M04], [M12], [M27], [M37], [M43] |
| `0 0 16px 16px` | app | `var(--radius-xl on the same nonzero corners; keep zero corners)` | [M36] |
| `0 7px 7px 0` | app | `var(--radius-md on the same nonzero corners; keep zero corners)` | [M17] |
| `0 8px 8px 0` | app | `var(--radius-md on the same nonzero corners; keep zero corners)` | [M11], [M23], [M29], [M30] |
| `0 9px 9px 0` | app | `var(--radius-lg on the same nonzero corners; keep zero corners)` | [M23], [M25], [M26], [M27], [M31], [M40] |
| `0 10px 10px 0` | app | `var(--radius-lg on the same nonzero corners; keep zero corners)` | [M29], [M30] |
| `0 11px 11px 0` | app | `var(--radius-lg on the same nonzero corners; keep zero corners)` | [M11], [M39] |
| `1px` | app | `var(--radius-sm)` | [M28] |
| `2px` | app | `var(--radius-sm)` | [M02], [M03], [M09], [M11], [M16], [M20], [M27], [M37] |
| `3px` | app | `var(--radius-sm)` | [M02], [M06], [M07], [M08], [M09], [M11], [M12], [M15], [M16], [M19], [M23], [M40] |
| `3px` | public | `var(--r-field)` | [M33] |
| `3px 3px 0 0` | app | `var(--radius-sm on the same nonzero corners; keep zero corners)` | [M03], [M06], [M07], [M08], [M09], [M10], [M12], [M14], [M15], [M19], [M36], [M42] |
| `4px` | app | `var(--radius-sm)` | [M02], [M03], [M06], [M07], [M09], [M22], [M25], [M30], [M31] |
| `4px 4px 0 0` | app | `var(--radius-sm on the same nonzero corners; keep zero corners)` | [M27] |
| `5px` | app | `var(--radius-sm)` | [M03], [M06], [M07], [M09], [M11], [M16], [M20], [M21], [M22], [M25], [M26], [M30], [M31], [M32], [M41] |
| `5px` | public | `var(--r-field)` | [M33] |
| `6px` | app | `var(--radius-md)` | [M01], [M02], [M06], [M09], [M12], [M15], [M17], [M21], [M38], [M39] |
| `6px` | public | `var(--r-field)` | [M33] |
| `7px` | app | `var(--radius-md)` | [M02], [M03], [M06], [M07], [M08], [M09], [M12], [M14], [M15], [M22], [M27], [M29], [M32], [M42] |
| `7px` | public | `var(--r-field)` | [M33], [M35] |
| `8px` | app | `var(--radius-md)` | [M01], [M02], [M03], [M06], [M08], [M09], [M10], [M13], [M14], [M15], [M17], [M19], [M21], [M22], [M23], [M24], [M29], [M30], [M32], [M41], [M43] |
| `9px` | app | `var(--radius-lg)` | [M01], [M05], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M37], [M38], [M40], [M42], [M43] |
| `9px` | public | `var(--r-field)` | [M33] |
| `10px` | app | `var(--radius-lg)` | [M01], [M04], [M06], [M07], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M18], [M20], [M22], [M25], [M26], [M29], [M30], [M32], [M36], [M39], [M42], [M43] |
| `10px` | public | `var(--r-field)` | [M33] |
| `11px` | app | `var(--radius-lg)` | [M01], [M03], [M04], [M05], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M17], [M19], [M21], [M22], [M24], [M25], [M26], [M29], [M30], [M31], [M38], [M39], [M41], [M42] |
| `11px` | public | `var(--r-field)` | [M33], [M35] |
| `11px 11px 0 0` | public | `var(--r-field on the same nonzero corners; keep zero corners)` | [M33] |
| `12px` | app | `var(--radius-lg)` | [M02], [M03], [M04], [M06], [M07], [M08], [M11], [M12], [M13], [M14], [M15], [M16], [M17], [M18], [M19], [M20], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M37], [M40], [M41] |
| `12px` | public | `var(--r-field)` | [M33], [M35] |
| `13px` | app | `var(--radius-lg)` | [M02], [M03], [M04], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M21], [M22], [M24], [M37], [M38], [M39], [M41], [M42] |
| `13px` | public | `var(--r-field)` | [M33], [M35] |
| `14px` | app | `var(--radius-lg)` | [M01], [M03], [M04], [M10], [M11], [M12], [M15], [M16], [M17], [M36], [M38], [M39], [M41], [M43] |
| `14px` | public | `var(--r-field)` | [M33] |
| `15px` | app | `var(--radius-xl)` | [M16], [M22], [M36], [M37], [M38], [M39] |
| `16px` | app | `var(--radius-xl)` | [M01], [M02], [M04], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M37], [M38], [M39], [M40], [M41], [M42] |
| `16px` | public | `var(--r-card)` | [M33], [M35] |
| `16px 16px 0 0` | app | `var(--radius-xl on the same nonzero corners; keep zero corners)` | [M36] |
| `18px` | app | `var(--radius-xl)` | [M02], [M08], [M11], [M17], [M21], [M23], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M40] |
| `19px` | app | `var(--radius-xl)` | [M04] |
| `20px` | app | `var(--radius-xl)` | [M01], [M24], [M36], [M37], [M38], [M39] |
| `22px` | app | `var(--radius-xl)` | [M05], [M43] |
| `28px` | app | `var(--radius-xl)` | [M04] |
| `40%` | app | `rounded-full (Tailwind library token)` | [M16] |
| `50%` | app | `rounded-full (Tailwind library token)` | [M03], [M04], [M05], [M07], [M10], [M14], [M15], [M16], [M18], [M20], [M22], [M28], [M29], [M30], [M36], [M37], [M39], [M41], [M43] |
| `50%` | public | `var(--r-pill)` | [M33] |
| `50% 50% 0 0` | app | `rounded-full (Tailwind library token)` | [M16] |
| `50% 50% 0 0/100% 100% 0 0` | app | `rounded-full (Tailwind library token)` | [M22], [M24], [M36], [M37], [M38], [M39] |
| `60% 20% 60% 20%` | app | `rounded-full (Tailwind library token)` | [M10], [M41] |
| `99px` | app | `rounded-full (Tailwind library token)` | [M04], [M05], [M08], [M19], [M21] |
| `999px` | app | `rounded-full (Tailwind library token)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M13], [M14], [M15], [M16], [M17], [M18], [M19], [M20], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M28], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M41], [M42], [M43] |
| `999px` | public | `var(--r-pill)` | [M33], [M35] |
| `clamp(11px, .85vw, 15px)` | public | `var(--r-card on the same nonzero corners; keep zero corners)` | [M34] |

### A3. Font sizes

`--text-*` values are Tailwind theme variables supplied by the `@import 'tailwindcss'` in `src/index.css`; public `--t-*` values are declared in `public-layer.css`. The app does not define a second bespoke numeric type scale.

| Mockup literal | Scope | Required type token | Source |
|---|---|---|---|
| `.82em` | public | `var(--t-fine)` | [M34] |
| `.93em` | public | `var(--t-ui)` | [M34] |
| `0` | app | `hidden state, never a type token` | [M04] |
| `7.5px` | app | `var(--text-xs)` | [M03], [M43] |
| `8.5px` | app | `var(--text-xs)` | [M02], [M06], [M14], [M21], [M26], [M32], [M43] |
| `8.8px` | app | `var(--text-xs)` | [M14] |
| `8px` | app | `var(--text-xs)` | [M03], [M09], [M10], [M14] |
| `8px` | public | `var(--t-eyebrow)` | [M33] |
| `9.5px` | app | `var(--text-xs)` | [M02], [M03], [M06], [M07], [M08], [M09], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M23], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M37], [M40], [M41], [M43] |
| `9.5px` | public | `var(--t-eyebrow)` | [M33], [M34], [M35] |
| `9px` | app | `var(--text-xs)` | [M02], [M03], [M06], [M07], [M08], [M09], [M11], [M12], [M14], [M15], [M16], [M17], [M22], [M23], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M43] |
| `9px` | public | `var(--t-eyebrow)` | [M33], [M35] |
| `10.5px` | app | `var(--text-xs)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M27], [M29], [M30], [M31], [M32], [M36], [M38], [M39], [M40], [M41], [M43] |
| `10.5px` | public | `var(--t-eyebrow)` | [M33] |
| `10px` | app | `var(--text-xs)` | [M03], [M05], [M06], [M08], [M09], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M20], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M30], [M31], [M37], [M38], [M39], [M40], [M41], [M43] |
| `10px` | public | `var(--t-eyebrow)` | [M33], [M35] |
| `11.5px` | app | `var(--text-xs)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M41], [M43] |
| `11.5px` | public | `var(--t-fine)` | [M33], [M35] |
| `11px` | app | `var(--text-xs)` | [M01], [M02], [M03], [M05], [M06], [M07], [M08], [M09], [M11], [M12], [M14], [M15], [M16], [M17], [M18], [M19], [M20], [M21], [M22], [M23], [M24], [M25], [M27], [M28], [M29], [M30], [M31], [M32], [M37], [M38], [M39], [M40], [M42], [M43] |
| `12.5px` | app | `var(--text-xs)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M19], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M28], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M41], [M42], [M43] |
| `12.5px` | public | `var(--t-fine)` | [M33], [M35] |
| `12px` | app | `var(--text-xs)` | [M01], [M02], [M03], [M04], [M05], [M06], [M07], [M09], [M10], [M11], [M12], [M13], [M15], [M16], [M17], [M18], [M20], [M22], [M23], [M24], [M25], [M26], [M27], [M28], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M41], [M42] |
| `12px` | public | `var(--t-fine)` | [M33], [M35] |
| `13.5px` | app | `var(--text-sm)` | [M01], [M02], [M03], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M19], [M21], [M22], [M24], [M25], [M28], [M29], [M30], [M32], [M36], [M37], [M38], [M39], [M41], [M42] |
| `13.5px` | public | `var(--t-ui)` | [M33], [M35] |
| `13px` | app | `var(--text-sm)` | [M01], [M03], [M04], [M06], [M07], [M08], [M09], [M10], [M11], [M12], [M13], [M14], [M15], [M16], [M17], [M18], [M19], [M20], [M21], [M22], [M23], [M24], [M25], [M26], [M27], [M28], [M29], [M30], [M31], [M32], [M36], [M37], [M38], [M39], [M40], [M42] |
| `13px` | public | `var(--t-ui)` | [M33], [M35] |
| `14.5px` | app | `var(--text-sm)` | [M07], [M08], [M12], [M15], [M22], [M42] |
| `14.5px` | public | `var(--t-ui)` | [M33], [M35] |
| `14px` | app | `var(--text-sm)` | [M02], [M04], [M05], [M06], [M07], [M09], [M10], [M12], [M13], [M14], [M15], [M16], [M17], [M18], [M19], [M20], [M21], [M24], [M28], [M32], [M36], [M37], [M38], [M39], [M40], [M42], [M43] |
| `14px` | public | `var(--t-ui)` | [M33], [M35] |
| `15.5px` | app | `var(--text-base)` | [M02], [M06], [M07], [M08], [M09], [M16], [M36], [M39], [M41] |
| `15px` | app | `var(--text-base)` | [M01], [M02], [M03], [M06], [M07], [M09], [M10], [M11], [M12], [M14], [M15], [M16], [M17], [M18], [M20], [M22], [M23], [M24], [M25], [M26], [M27], [M28], [M29], [M30], [M31], [M36], [M37], [M38], [M39], [M40], [M41], [M42], [M43] |
| `15px` | public | `var(--t-ui)` | [M33], [M35] |
| `16.5px` | app | `var(--text-base)` | [M06], [M09], [M10], [M11], [M12], [M15], [M17], [M23], [M25], [M26], [M27], [M29], [M31], [M32], [M36] |
| `16px` | app | `var(--text-base)` | [M04], [M05], [M06], [M09], [M14], [M17], [M20], [M22], [M28], [M38], [M39], [M42], [M43] |
| `16px` | public | `var(--t-body)` | [M33], [M35] |
| `17.5px` | app | `var(--text-lg)` | [M24], [M39] |
| `17px` | app | `var(--text-lg)` | [M01], [M06], [M07], [M14], [M36], [M39], [M40] |
| `17px` | public | `var(--t-body)` | [M33], [M35] |
| `18px` | app | `var(--text-lg)` | [M03], [M07], [M08], [M09], [M11], [M12], [M14], [M15], [M16], [M17], [M18], [M22], [M24], [M42] |
| `18px` | public | `var(--t-read)` | [M33] |
| `19px` | app | `var(--text-xl)` | [M04], [M09], [M11], [M17], [M28], [M36], [M37], [M38], [M40], [M43] |
| `19px` | public | `var(--t-read)` | [M33], [M35] |
| `20px` | app | `var(--text-xl)` | [M10], [M14], [M16], [M20], [M36] |
| `21px` | app | `var(--text-2xl)` | [M11], [M16], [M24], [M28], [M39] |
| `22px` | app | `var(--text-2xl)` | [M09], [M13], [M18], [M19], [M20] |
| `22px` | public | `var(--t-h3)` | [M33], [M35] |
| `23px` | app | `var(--text-2xl)` | [M15], [M17], [M26] |
| `24px` | app | `var(--text-2xl)` | [M03], [M09], [M12], [M13], [M25], [M26], [M36] |
| `25px` | app | `var(--text-3xl)` | [M05], [M08], [M11], [M21] |
| `26px` | app | `var(--text-3xl)` | [M08], [M20], [M29] |
| `26px` | public | `var(--t-h2)` | [M35] |
| `27px` | app | `var(--text-3xl)` | [M12], [M15] |
| `27px` | public | `var(--t-h2)` | [M33] |
| `28px` | app | `var(--text-3xl)` | [M06] |
| `29px` | app | `var(--text-3xl)` | [M11], [M15], [M17], [M38] |
| `30px` | app | `var(--text-3xl)` | [M07], [M09], [M10], [M12], [M14], [M15], [M23], [M25], [M26], [M27], [M28], [M29], [M30], [M31], [M32], [M36], [M37], [M40], [M42] |
| `30px` | public | `var(--t-h2)` | [M33] |
| `31px` | app | `var(--text-4xl)` | [M07] |
| `32px` | app | `var(--text-4xl)` | [M16], [M39] |
| `33px` | public | `var(--t-display)` | [M33], [M35] |
| `34px` | app | `var(--text-4xl)` | [M22], [M24], [M43] |
| `34px` | public | `var(--t-display)` | [M35] |
| `36px` | app | `var(--text-4xl)` | [M09] |
| `38px` | app | `var(--text-5xl)` | [M22] |
| `40px` | app | `var(--text-5xl)` | [M12] |
| `44px` | app | `var(--text-5xl)` | [M16] |
| `46px` | public | `var(--t-display)` | [M33] |
| `56px` | public | `var(--t-sec-pay)` | [M35] |
| `calc(var(--t-ui) * 1.12)` | public | `var(--t-ui)` | [M34] |
| `clamp(14.5px, .95vw, 17.5px)` | public | `var(--t-body)` | [M34] |
| `clamp(16px, 1.25vw, 24px)` | public | `var(--t-lede)` | [M34] |
| `clamp(19px, 1.45vw, 28px)` | public | `var(--t-h2)` | [M34] |

### Source references

[M01]: ../specifications/mockups/00-shell/sauce-dropdown.html
[M02]: ../specifications/mockups/00-shell/shell-calendar-overlay.html
[M03]: ../specifications/mockups/00-shell/shell-calendar-sequence.html
[M04]: ../specifications/mockups/00-shell/sidebar-dock-prototype.html
[M05]: ../specifications/mockups/00-shell/sidebar-merged-remock.html
[M06]: ../specifications/mockups/01-academics/academics-assignments.html
[M07]: ../specifications/mockups/01-academics/academics-class-hub.html
[M08]: ../specifications/mockups/01-academics/academics-class-types.html
[M09]: ../specifications/mockups/01-academics/academics-daily-main-page.html
[M10]: ../specifications/mockups/01-academics/academics-empty-states-prototype.html
[M11]: ../specifications/mockups/01-academics/academics-exam-prep-mode.html
[M12]: ../specifications/mockups/01-academics/academics-grades-archive.html
[M13]: ../specifications/mockups/01-academics/academics-mode-switch.html
[M14]: ../specifications/mockups/01-academics/academics-planner-prototype.html
[M15]: ../specifications/mockups/01-academics/academics-requirements.html
[M16]: ../specifications/mockups/01-academics/academics-review-session.html
[M17]: ../specifications/mockups/01-academics/academics-syllabus-import.html
[M18]: ../specifications/mockups/01-academics/class-center-study-hub.html
[M19]: ../specifications/mockups/02-mcat/mcat-bookshelf.html
[M20]: ../specifications/mockups/02-mcat/mcat-plan.html
[M21]: ../specifications/mockups/02-mcat/mcat-section-aware-drills.html
[M22]: ../specifications/mockups/03-overview/overview-bento-control-panel.html
[M23]: ../specifications/mockups/03-overview/overview-where-i-stand-expandable.html
[M24]: ../specifications/mockups/03-overview/sauce-two-doors.html
[M25]: ../specifications/mockups/04-clinical/clinical-credentials.html
[M26]: ../specifications/mockups/04-clinical/clinical-hour-target.html
[M27]: ../specifications/mockups/04-clinical/clinical-hours-chart.html
[M28]: ../specifications/mockups/04-clinical/clinical-pillar.html
[M29]: ../specifications/mockups/04-clinical/clinical-role-presets.html
[M30]: ../specifications/mockups/04-clinical/clinical-role-typeahead.html
[M31]: ../specifications/mockups/04-clinical/clinical-scope-recall.html
[M32]: ../specifications/mockups/04-clinical/clinical-subtabs.html
[M33]: ../specifications/mockups/05-public/public-landing-and-auth.html
[M34]: ../specifications/mockups/05-public/public-landing-v2.html
[M35]: ../specifications/mockups/05-public/public-legal-about-pricing.html
[M36]: ../specifications/mockups/05-volunteering/volunteering-standing-vs-events.html
[M37]: ../specifications/mockups/07-campus/illustrated-campus.html
[M38]: ../specifications/mockups/07-extracurriculars/organizations-surface.html
[M39]: ../specifications/mockups/11-timeline/timeline-spine.html
[M40]: ../specifications/mockups/_shared/hours-map.html
[M41]: ../specifications/mockups/_shared/mascot-note-pattern.html
[M42]: ../specifications/mockups/_shared/nav-hierarchy-3-levels.html
[M43]: ../specifications/mockups/variant-lab.html
