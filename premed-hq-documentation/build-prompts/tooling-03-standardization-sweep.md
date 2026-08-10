# Build Prompt — Standardization sweep (normalize the existing app to the contract)

*Handoff prompt for Claude Code / Codex. A **behavior-preserving refactor** — no new features, no data/schema changes. Runs **after `tooling-02`** (which installs the standard components). Sub-commit **per page**; plan first, stop for approval.*

---

You are implementing **Premed OS**. Goal: **make every existing screen obey the standardization contract** so the whole app reads as *one* system. This is normalization/cleanup — same behavior, same data, consistent surface. The app drifted because it was built piecemeal (e.g. Overview and Extracurriculars use different heading treatments/fonts; the Academics ledger and the Letters table are different table implementations). Fix all of it.

> **CRITICAL — this is FORMAT standardization, NOT a redesign. If a prior sweep flattened the app, REVERT it first.**
> - **Step 0 — restore the rich design.** If an earlier standardization pass flattened / restyled / re-weighted anything, `git revert` those commits so the app is back to its previous **rich, bold, layered** look (bold Baloo, dimensional cards, soft shadows/elevation, the themed banner, motion) *before doing anything else*.
> - **Standardization = conserving the same functional formats / components / structures** across screens — e.g. every table adopts the **same format as the Academics ledger `TrackerTable`**; every page uses the same header/structure patterns; one component per job. **It does NOT touch the design:** no flattening, no removing depth/shadows, no font / weight / color / spacing changes. Keep **bold Baloo** and the existing rich aesthetic *exactly*.
> - **Conform every screen to the §0c design north star.** Apply the **glassmorphic banner-hero look** — themed banner + **translucent frosted-glass cards** (semi-transparent tint + `backdrop-filter: blur` + hairline border + soft shadow, floating over the banner) + bold Baloo + layered depth — to **every tab, not just Overview.** Copy the Overview hero's glass/banner treatment across all tab heroes and design surfaces; bring out-of-place tabs *up* to it. Modern hero/glass patterns may be hybridized from 21st.dev, re-skinned to PMH tokens (§0c). **And apply the §7a motion everywhere — nothing static:** smooth transitions, hover/press, origin-aware opens, list add/remove, and stat animations on every surface, both themes. A static surface is a defect, same as a flat one.
> - If a screen ends up flatter, plainer, or less bold than before, you went the wrong way — revert it. Verify in **both dark and light (paper)** themes.

## Read first

1. `specifications/04-visual-craft-standards.md` — **§0b the standardization contract** (the checklist you're enforcing) and **§11 build checklist**.
2. `specifications/01-shared-interface-patterns.md` (tables, forms, record-open, states), `implementation/component-inventory.md` (the one-component-per-job library), `CLAUDE.md` (locked tokens/fonts — apply them, never alter).
3. The repo: every page in `src/pages/*` and shared components in `src/components/common/*` + `src/components/ui/*`.

## What to normalize (every existing page → the §0b contract)

Go **page by page** (Overview, Academics, MCAT, Clinical, Volunteering, Extracurriculars, School List, Essays, Letters, Timeline & Tasks, Profile/CV, Settings, Help) and bring each to:

1. **Page header** — every page uses `PageHeader` (title · optional subtitle · one primary action top-right). No bespoke per-page title markup.
2. **Headings & fonts** — normalize to **Overview's heading *character* as the reference**, expressed through `PageHeader` on the **locked §1 type scale (4 sizes, 2 weights, Baloo 2 / Nunito)** — **not** Overview's *current* arbitrary `clamp()` sizes or weight-800, which are themselves normalized to the scale. Every page's headings then match this corrected reference. **Remove every custom per-tab heading size/weight/font.** *(Directly fixes the Overview-vs-Extracurriculars difference.)*
3. **Tables** — **every table is `TrackerTable`**, normalized **to the Academics ledger table format as the reference** (its columns/cell/inline-edit look). The Letters table and all others match it. Remove any second/hand-rolled table.
4. **Cards** — the shared `Card` with consistent padding/radius/proportions; experience/school/class cards are that card configured, not variants.
5. **Buttons** — `Smooth Button` base + tiers (primary/secondary/ghost); verb-first labels; consolidate icon-button rows into overflow menus.
6. **Stats** — compact inline stat row; **retire `Ring`/`StatTile` big-number/ring boxes** (a page's single primary metric may go large, nothing else).
7. **Spacing & layout** — 4/8px grid, consistent gutters/margins/section rhythm, `max-w-6xl` container, layout discipline (`01` §5c).
8. **Empty / loading / error** — the one `EmptyState` / `Skeleton` / scoped-error pattern everywhere.
9. **Forms & controls** — in-app styled only (`01` §4a: no native select/date pickers), labels above inputs, consistent field layout.
10. **Chips / badges / status** — one `Animated Tags`/`Badge` system; consistent status vocabulary and colors.
11. **Icons** — lucide, outline, 16–20px; remove any emoji-as-icon or second icon set.
12. **Numbers** — tabular/mono numerals; consistent precision (GPA 2dp, hours, %); `Number Flow` for animated ones.
13. **Record open** — center-peek + `ObjectInspector` everywhere; **retire legacy dialogs** (e.g. `CourseDetailDialog`).
14. **Tabs / sub-nav** — `Animated Tabs` / `ModeSwitch` consistently.
15. **Microcopy** — sentence case, verb-first (`04` §9).
16. **Page architecture** — the `general.md` section order (identity → status → action → attention → workspace → supporting → archive).
17. **Radii / colors** — tokens only, both themes.

## Must NOT

- Do **not** change behavior, data, store shape, routes, or schemas — this is a *visual/structural* normalization only.
- Do **not** add features, or alter the locked tokens/fonts/visual-themes (apply them; never edit their values).
- Do **not** fork components — collapse duplicates into the shared one.
- Do **not** add new dependencies without flagging.

## Process

1. **Audit first:** produce a per-page report of every §0b violation you find (what's off, which component it should use), then **stop for approval** before changing code.
2. Normalize **page by page**, sub-committing per page (`refactor(ui): standardize <page> to §0b`).
3. Verify each page against the **§11 build checklist** + the §0b contract; screenshots in light/dark before/after; `npm run build` passes.

## Acceptance criteria

- [ ] Every existing page passes the §0b contract — one font, one heading system (`PageHeader` + type scale), one table (`TrackerTable`), one card, one button, one icon set, one stat pattern, one states set, one record-open, tabular numbers, sentence-case copy.
- [ ] The specific drifts are gone, normalized to the named references: **all headings match the Overview heading treatment** (font/size/weight); **all tables match the Academics ledger table format** (Letters included).
- [ ] No second-of-anything remains; legacy dialogs (e.g. `CourseDetailDialog`) and `Ring`/`StatTile` big boxes removed.
- [ ] Behavior/data unchanged; verified light/dark, desktop/mobile, keyboard-only, reduced-motion; `npm run build` passes.
