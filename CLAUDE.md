# Premed OS — Claude Code project memory

Premed journey dashboard (public beta). React + TypeScript + Vite + zustand.
Deployed to GitHub Pages from `main` via Actions. Supabase magic-link auth
with local-first sync: **localStorage is primary; signed-out mode must stay
fully functional.**

## ⭐ SOURCE OF TRUTH (read first, overrides everything else)

- **All product, feature, UX, pillar, and data decisions come from `premed-hq-documentation/`.** Start with `premed-hq-documentation/AGENT-IMPLEMENTATION-GUIDE.md` — it defines read order, precedence, and workflow. When this file and the docs disagree on *what to build or how it behaves*, **the docs win.**
- This `CLAUDE.md` holds the **implementation foundation** only — the concrete design tokens, fonts, stack, commands, component names, and sync behavior below. Those remain authoritative for *how the code looks/builds* (they are the real design system the docs' mockups defer to).
- **IGNORE these stale/superseded locations — do not read them as spec:** the root `rules/` and `spec/` folders, `CLAUDE_CODE_HANDOFF.md`, `READ-ME-FIRST.md`, `REVISIONS-ROUND-1.md`, and the entire nested `premed-hq/` folder (an old app copy). They predate `premed-hq-documentation/` and cause false "open decision" / contradiction reads. Implement against `src/` at the repo root, not `premed-hq/`.

## Commands

- `npm run dev` — local dev server
- `npm run build` — MUST pass before every push
- Typecheck runs in build; treat new TS errors as blockers

## Design foundation (LOCKED — the concrete design system; craft rules in `premed-hq-documentation/specifications/04-visual-craft-standards.md`)

- Warm dark default: bg `#282420`, cards `#322d27`, borders `#423a32`,
  text `#ece3d4` / `#a89c8c` / `#7c7264`, primary `#4b9cd3`.
  (**Do not describe this as "Carolina blue" or any UNC colour.** Premed OS has its own
  design system and is **not affiliated with UNC** — see
  `premed-hq-documentation/specifications/05-public-and-account.md` §6.)
  Light "paper" theme is a user toggle — every new surface must work in both.
- Fonts: Baloo 2 (display/numbers) + Nunito (body). NEVER change.
- **No emoji as UI icons — lucide-react only.** No text glyphs as controls.
- ONE hero graphic per view; graphic vocabulary limited to: stacked bars,
  progress pills, status chips, heatmaps, ring gauges.
- One primary action per view (accent pill, top right).
- Per-pillar `--cat-*` accent carried in subtab underline + title bar + hero.
- Mascot = illustration only, never a UI icon. Celebrations only on
  real milestones (goal hit, letter submitted, first pub, cert renewed).
  **NOT a ram.** `premed-hq-documentation/specifications/05-public-and-account.md`
  §6.1 forbids ram or Rameses imagery — it reads as a UNC mascot and Premed OS is
  not affiliated with UNC. Any mascot must be **visibly unrelated to a
  university mascot**. (`src/components/mascot/Ram.tsx` + `/art/mascot.gif`
  still exist and are the thing to replace; §6.1's parenthetical claiming
  none exists is wrong. **Do not use them on the public layer.**)
- Shared components: InlineAddRow, ExpandableEntryRow, ContactCard,
  PillarShell. Reuse — never fork variants.
- Every logging flow must complete in ≤5 seconds.

## Standing MUST-NOT-CHANGE (unless a prompt explicitly overrides)

- Design tokens, theme system, fonts, mascot assets
- Auth/Supabase sync layer and schemas; localStorage-first behavior
- Letters page structure (deep-link prefills only)
- Any localStorage schema change needs a versioned, lossless migration
- No new dependencies without flagging first
- If you find uncommitted WIP from another session, stop and flag it —
  Claude Code and Codex both work in this repo

## Workflow conventions

- **Research the established method before proposing a new one** (Andy, Aug
  2026): *"everything has been done. Back-check my methods with the internet
  first."* Before designing any mechanism — content delivery, rotation,
  caching, sync, scheduling — search for how it is normally built, and say
  what the standard approach is even when choosing to depart from it.
  **Check the repo first**: Premed OS has often already solved it once
  (`useDailyQuote.ts` and `pickDaily()` were a working daily-rotation
  implementation nobody remembered). Extend what exists before inventing.
  **Where to check is `premed-hq-documentation/implementation/reference-sources.md`** —
  it sets the order (repo → these docs → official docs → MDN/web.dev →
  named individuals → general search, last and with suspicion) and lists
  what to distrust. Cite the source in the doc, not just the conclusion.

- One feature per commit; conventional commits (`feat(pillar): …`).
- Build must pass before push; verify signed-out mode + both themes +
  empty states (friendly one-liner, never a blank void) for any new view.
- Design comes from Claude Design sessions; implementation prompts follow:
  design reference → numbered changes → must-NOT list → verify → commit.
- Keep responses high-signal; flag disagreement instead of complying silently.
