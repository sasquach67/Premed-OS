# Tooling Prompt — make the existing theme the official shadcn preset (`components.json`)

*Handoff prompt for Claude Code / Codex. Small, config-only chunk. Do NOT regenerate or alter the theme. Plan first, stop for approval, implement only this.*

---

You are working in **Premed OS**. Goal: make the app's **existing design system the canonical shadcn preset**, so any component installed via the shadcn CLI or the shadcn MCP renders in the Premed OS theme with **no manual re-skinning**. This is a config step — the theme already exists and must not change.

## Read first

1. `CLAUDE.md` — **design tokens, theme system, and fonts are MUST-NOT-CHANGE.**
2. `src/index.css` — the theme: light "paper" `:root`, `.dark`, and the `data-visual-theme` (ghibli/doraemon) variants; fonts Baloo 2 (`--font-display`) + Nunito (`--font-sans`); `--radius`; per-category `--cat-*` accents.
3. `src/components/ui/*` — the existing shadcn-style components; `tsconfig.app.json` + `vite.config.ts` (`@/*` → `./src/*`).
4. `architecture/01-global-design-system.md`, `specifications/04-visual-craft-standards.md`.
5. shadcn docs: `components.json` reference + MCP setup (ui.shadcn.com/docs).

## Facts already verified — do not re-derive

- Stack: **React 19 + Vite + Tailwind v4** (CSS-based via `@tailwindcss/vite`; **no `tailwind.config` file**).
- Alias: `@/*` → `./src/*`.
- **All standard shadcn CSS variables already exist** in `index.css` (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`, `--sidebar*`) — **except `--chart-1..5`**.

## What to do

1. **Create `components.json`** at the repo root:
   - `style`: match the existing components (likely `"new-york"`); `rsc: false`; `tsx: true`.
   - `tailwind`: `{ "config": "", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" }` (v4 → empty config path; `cssVariables: true` so it uses the existing variables, not new ones).
   - `aliases`: `{ "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" }`.
   - `iconLibrary`: `"lucide"`.
2. **Add only the missing standard tokens** — `--chart-1` … `--chart-5` — to `:root` and `.dark` (and the visual-theme variants if trivial), derived from the existing palette (e.g., from `--primary` and the `--cat-*` accents). **Additive only — do not change any existing variable's value.** This keeps shadcn Charts on-theme when pulled later.
3. **One verification install:** run `npx shadcn@latest add skeleton`, confirm it lands in `src/components/ui`, resolves to the existing variables, and renders on-theme in **light + dark**. If it collides with an existing component, do not overwrite — confirm resolution and revert the test.

## Must NOT

- Do **not** run `npx shadcn init` if it would regenerate or overwrite `src/index.css`, the tokens, fonts, radius, or the `data-visual-theme` (ghibli/doraemon) layer. If the CLI insists on writing a theme, **author `components.json` by hand** instead.
- Do **not** change any existing token value, font, radius, or the visual-theme system (`CLAUDE.md` MUST-NOT-CHANGE). The `--chart-*` additions are the **only** new variables permitted.
- Do **not** bulk-install components — config only.
- Do **not** add dependencies without flagging.

## Acceptance criteria

- [ ] `components.json` exists with `cssVariables: true`, `css: "src/index.css"`, correct aliases, `iconLibrary: "lucide"`.
- [ ] `git diff src/index.css` shows **only** additive `--chart-1..5` (plus dark/visual-theme counterparts) — **zero** changes to existing tokens, fonts, radius, or visual themes.
- [ ] A test `shadcn add` installs on-theme in light + dark with no manual re-skin; test component reverted if not needed.
- [ ] `npm run build` passes.
- [ ] Commit: `chore(design): shadcn components.json wired to existing theme preset (+ chart tokens)`.

## Process

Plan first (files + the exact `components.json` you'll write + the `--chart-*` values), **stop for approval**, then implement only this and report against the acceptance criteria.
