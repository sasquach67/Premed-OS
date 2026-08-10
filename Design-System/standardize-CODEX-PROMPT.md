# CODEX TASK — Design-system standardization sweep (Premed OS)

**Reference:** open `Design-System/premedos-style-guide.html` in a browser first — it is the canonical system. Direction, not pixel-law. App root: repo root (`src/`). Run with `export PATH="$HOME/.local/node/bin:$PATH"`, dev server on :5180.

This is a **mechanical consistency sweep** — no redesigns, no layout changes, no new features. Audited drift (2026-07-12): 6 radius scales in use, 19 arbitrary `shadow-[…]`, 63 ad-hoc pills vs Badge in only 3 files, ~15 hex literals in TSX, cold Tailwind grays in the error boundary.

## Must NOT change
- Fonts (Baloo 2 / Nunito), theme tokens' *values*, working behavior, layouts, copy.
- The persist key / store. The Google Drive + Supabase sync code paths.
- Do not touch `.github/workflows/`.
- If a file has heavy uncommitted WIP you don't recognize, skip it and list it at the end rather than conflict.

## The sweep (in order)

### 1. Radius → three roles
- `rounded-3xl` → `rounded-2xl` (all 14). `rounded-sm` → `rounded-md`.
- Outer surfaces (Card, panels, banners, dropzones): `rounded-2xl`. Nested rows/tiles: `rounded-xl` or `rounded-lg`. Pills/avatars: `rounded-full`. Don't churn existing `xl/lg` unless a file mixes roles inconsistently side-by-side.

### 2. Elevation → two shadows
- Resting cards/panels: the `card-soft` utility. Replace `shadow-sm`/`shadow-md` *on card-like surfaces* with `card-soft` (leave `shadow-sm` on tiny controls like segmented-control thumbs).
- Overlays (Dialog/Popover/Dropdown/hover-cards): `shadow-lg`.
- Kill every arbitrary `shadow-[…]` in favor of one of those two (check each: card → card-soft, floating → shadow-lg).

### 3. Section colors → tokens
- `src/index.css` now defines `--sec-bb / --sec-cp / --sec-cars / --sec-ps` (done).
- Update `SECTION_META` in `src/pages/Mcat.tsx` so `color` values are `'var(--sec-bb)'` etc. instead of hex. Grep for other hardcoded `#76b86c|#e4a24f|#62b7ee|#ef86b4` and point them at the vars.
- Any other hex literal in TSX → nearest existing token (`--primary`, `--leaf`, `--warning`…). **Exception:** `AppErrorBoundary.tsx` may keep inline styles (it renders when CSS may be dead) but swap its cold grays for warm values: bg `#f7efe1`, text `#3a3530`, border `#e9e2d5`, buttons `#3f93cf` / `#e26d5c`.

### 4. Pills → Badge
- Migrate hand-rolled `rounded-full … px-2 … text-xs/[10px]` status/section spans to `<Badge variant=…>` (variants exist: default/secondary/outline/muted/success/warning/danger).
- Section chips: `<Badge className="border-transparent text-white" style={{ background: 'var(--sec-bb)' }}>BIO</Badge>` — add a tiny helper if repeated.
- Skip pills that are actually buttons/filters (segmented controls, filter chips with onClick) — only badge-like status/label spans.

### 5. Type scale
- Page/hero titles + big numerals (scores, streaks, countdowns, GPA): ensure `font-display`. Grep `text-2xl|text-3xl|text-4xl` without `font-display` and fix numerals/titles (leave prose alone).
- **Weight discipline:** `font-extrabold` (800) in the display font is reserved for the page/hero title + hero numeral — one per view. Card titles (`CardTitle`, section headings) cap at `font-bold` (700). Grep `font-display` + `font-extrabold` and demote everything that isn't the page hero.
- **Tabular figures:** `.font-display` now sets `tabular-nums` globally (done in index.css). Add the `.nums` utility (or Tailwind `tabular-nums`) to live numerals rendered in the *body* font: table numeric columns, timers/countdowns, stat rows, GPA/score readouts.
- Caption/meta labels: `text-xs font-bold uppercase tracking-wide text-muted-foreground` (align stragglers using one-off letter-spacing/sizes).

### 6. Gradients
- Allowed: scrims over banner/hero art (`from-black/50 to-transparent` style) and the single Home hero wash. Any decorative `bg-gradient-to-*` on plain cards → solid `bg-secondary/60` or `bg-muted/40`.

## Verify
`npm run build` green; flip through every page at :5180 (light + dark + Doraemon theme) — no visual regressions beyond the intended cleanups; screenshot Home, Academics, MCAT Dashboard, Settings for review.

## Commit
`style: design-system standardization sweep (radius/elevation/badges/tokens)`
