# overview-s3-target — decisions

**Status:** APPROVED direction (Andy, Aug 2026). **Refinement of `overview-bento-control-panel.html`, not a replacement.**
**Spec:** `specifications/03-overview.md` §5–§6.9 — law for behaviour and data.
**Supersedes the bento mockup for ONE thing only: the Tasks panel's create affordance.** For hero, bento spans, glass judgment, block order, and everything else, `overview-bento-control-panel.html` remains the reference. *(Same pattern as `public-landing-v2` superseding P1's mockup for nav/hero/footer only.)*

---

## Why it exists

Drawn to answer *"what would `S-3` actually produce?"* — and the answer turned out to be **almost what is already built.** `src/pages/Home.tsx` already composes all eight blocks at the spec's spans, with Now/Soon/Done tabs, `Reorder`, star, `PaceProjectionLine`, the horizontal roadmap spine with its "You are here" eyebrow, and glass confined to the hero.

**So this file is a conformance reference, not a build target.** Its job is to be held beside the running app.

## ⭐ The one real change — `＋ Add task`

> **Andy, Aug 2026:** *"remove the quick add and just do add task like regular"*

**A regular `＋ Add task` button in the Tasks panel header.** It opens the standard create form. **The inline "Quick add — type and hit enter…" row is removed and must not return.**

**Four spec locations were updated to match** — `03-overview.md` §6.4 (twice), §6a's components table, and the §11 acceptance criteria. **Recorded because the old lines said the opposite**, and an unamended spec is how a later sweep "fixes" this back.

**Expand becomes a quiet `↗`** beside the button rather than a labelled control — one dominant action per panel.

## ⚠️ The defect this drawing exposed

**§6.5 says "no normalized bars unless the user set the goal."** School List and Activities have no goal. Drawing them produced **empty bars, which read as zero progress rather than as no target** — a `U-5` violation (insufficient data goes dormant with a reason, never renders as a zero).

**Ruling: a domain row with no standing target renders NO bar at all** — accent chip, name, value, and a neutral chip only. The bar is the goal's representation; without a goal there is nothing to draw.

## Locked

- **The hero is FROZEN.** `OverviewHero.tsx` and `HeroDailySchedule.tsx` are hand-tuned and approved as-is. The hero in this file is a *rendering* of them for context. **Do not modify either file to match this drawing.**
- **Accent is `--pri` `#6fb3de` and `--cat` `#4b9cd3`** — the signed-in app deliberately keeps the old blues (`_visual-recipes.md` "Two blues"). **`#5293cc` is public-layer only and must not appear here.**
- **Glass on the hero cards only.** Every panel, row, table, tab and badge is solid-with-depth (`04` §0c).
- **Important rows carry a warm left border** and pin above an "Everything else" group.
- **Due chips are severity-coloured** — overdue destructive, soon warning.
- **Hours tile shows Clinical, Volunteering and Research only**, with the exclusion stated in a footer line.

## Do not

- **Do not rebuild Overview from this file.** It is already built. Diff against it and fix only what differs.
- **Do not copy the markup or the inline CSS.** Values came from `_shared/_visual-recipes.md`; rebuild from the component library per `MOCKUP-TRANSLATION-CONTRACT.md`.
- **Do not reintroduce an inline quick-add row** alongside the button.
- **Do not add a "Needs attention" strip** (`03-overview.md` §6.2, banned).
- **Do not draw a progress bar for a domain with no standing target.**
- **Do not touch the hero or the shell chrome.**
