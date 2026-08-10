# Agent handoff — read this first (July 2026)

You are picking up implementation of **Premed HQ** from a previous coding agent. This doc gets you on the same page fast. **`premed-hq-documentation/` is the single source of truth — the docs win over your priors.** When docs are silent/contradictory on something you need, **stop and ask; never guess.**

## 1. The repo

`sasquach67/Premed-HQ` — Vite + React 19 + React Router 7 + Tailwind 4 + Radix/shadcn + a zustand-style store. **localStorage-first; signed-out mode must always work.** Respect `CLAUDE.md` MUST-NOT-CHANGE list (design tokens, theme, fonts, auth/sync layer, schemas — any localStorage change needs a versioned lossless migration). If you find uncommitted WIP from another session, stop and flag it.

## 2. Where things stand

- **Built:** foundation chunks **01–05** (data layer + Person/Organization, center-peek record-open + inspector, lists/inline-editing/states, bulk/undo/trash/saved-views/focus, shell wiring) and **tooling-01** (shadcn `components.json` preset wired to the theme). Motion scaffolding partly exists (`src/lib/motion.ts`, `MotionProvider`).
- **In flight (your job):** **`build-prompts/tooling-02`** (component + motion pass) — its plan was approved; execute it. Then **`tooling-03`** (standardization sweep), then **`06`** (deterministic intelligence).
- **Not started:** the tabs (Overview + Academics/MCAT/Clinical/Volunteering are *spec'd*; Shadowing→Settings are stubs). Tabs come last. Service-foundation (auth/cloud/billing) + the LLM/Atlas layer are deliberately last.

**Order:** (revert any prior flatten →) tooling-02 → tooling-03 → 06 → tabs.

## 3. NON-NEGOTIABLE design direction (this is where the last agent went wrong — do not repeat)

- **Never flat — in look OR motion.** The app is **rich, bold, dimensional, animated**, not minimal/flat. See `04-visual-craft` **§0c** (the glass north star) and **§7a** (motion).
- **Glass north star (§0c):** every tab has a **themed banner hero**; cards are **frosted translucent glass** (translucent tint + `backdrop-filter: blur ~16–20px` + hairline border + soft shadow, floating over the banner). **Every component — especially clickable ones — wears this glass language** (floating surfaces = full frosted glass; buttons/chips/tabs/inputs/rows = glass-consistent + interactive glass hover/press/focus states). Nothing ships flat/opaque.
- **Bold Baloo** headings + numbers (bold weight, tabular figures), Nunito body. **Do NOT lighten or change the font.**
- **Motion everywhere (§7a):** nothing static — smooth opens/hovers/press/list-updates/transitions/stat-counts. Transform/opacity only, <~350ms, springs milestone-only, reduced-motion honored, **motion never distorts data**.
- **Standardization ≠ redesign (§0b).** "Standardize" means **conserve the same functional formats/components** (one table = `TrackerTable`; tables normalize to the **Academics ledger** format; headings to the **Overview** treatment on the locked scale; one component per job). It **never** flattens or restyles. **Standardize UP to the rich look, never DOWN to flat — if a screen ends up flatter/plainer, revert it.**

## 4. Workflow discipline

- **Plan first, stop for approval** before any code (files, spec→code map, ambiguities, dependency diff).
- **Sub-commit by area**, conventional commits; `npm run build` must pass before push.
- **Flag new dependencies** (this pass adds `motion`/Framer Motion, `@tanstack/react-table`, per-component Radix).
- **Verify + screenshot** each area in **light AND dark**, proving the glass depth + bold type + motion are intact; check reduced-motion, keyboard-only.
- Don't touch unrelated working-tree changes; don't change tokens/fonts/schemas/behavior during visual work.

## 5. Immediate task (tooling-02) + recent addenda

**Status — the §0c glass pass is PARTWAY DONE.** The prior agent (Codex) began applying the glass language to components and **stopped halfway**. **First action: audit which components already have the glass treatment vs. which don't, then FINISH the rest — do not restart from scratch or re-glass what's already done.** The goal is completing the addendum below across every component.

Execute `build-prompts/tooling-02-component-and-motion-pass.md` (approved plan: motion system → on-theme primitives → animated primitives ported *into* existing components → delight components → TrackerTable+Chart → sidebar motion → park Atlas §8 set). Fold in these recent decisions:
- **Every component wears §0c glass** incl. interactive glass states on clickables.
- **Sidebar:** port Animate UI motion into the *existing* sidebar (don't replace); fixed icon rail, transform/opacity only; **fix the lag on rapid hover** (hover-intent open/close delay ~80–120ms, interruptible, 60fps); **experiment with a fade variant** for the pop-out; **name tooltip only in the collapsed icon state** (not when expanded); **align the active-item treatment across dark + light** (one glass pill).
- Smooth Button folded into the base Button; Ripple + Dynamic Island dropped; Aspect Ratio kept/wired; Slider added only where a home invokes it.

## 6. Read order

`AGENT-IMPLEMENTATION-GUIDE.md` → `general.md` → `architecture/` (01 design-system, 02 intelligence, 04 admissions, 06 service-foundation) → `specifications/` (00 shell, 01 patterns, 03 overview, **04 visual-craft — esp. §0b/§0c/§7a**, 05 experience-pillar) → `data/` → `implementation/` (data-model, **component-inventory** — the component↔feature traceability + coverage matrix) → `tabs/` → `build-prompts/` (the paste-ready chunk prompts + this handoff).
