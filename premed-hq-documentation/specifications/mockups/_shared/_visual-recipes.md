# Visual recipes — exact values from the approved mockups

**Read this with any brief.** The decisions files say *what* to build; this says *how it looks*. These are the literal values from the approved mockups — use them rather than approximating.

Base tokens live in `src/index.css`. Do not invent new ones.

```
--bg:#211e1a  --card:#2b2722  --fg:#ece3d4  --mut:#a89c8c  --dim:#7c7264
--bd:#3c352d  --muted:#322e28  --pri:#6fb3de
--success:#6fc0a8  --warning:#e7b06a  --danger:#e8806f  --star:#e7b06a
--cat:#4b9cd3 (academics)  --mcat:#8c7bd4  --research:#c98ac9
--clinical:#6fae6e  --shadow:#e0a458  --activities:#e08b9b
```

---

## Banner — layered gradient, never flat

```css
background:
  radial-gradient(340px 200px at 88% 6%, rgba(75,156,211,.34), transparent 70%),
  radial-gradient(260px 180px at 10% 130%, rgba(111,192,168,.18), transparent 70%),
  linear-gradient(115deg, #233448 0%, #2c3a4a 45%, #3a3730 100%);
padding: 18px 24px 0;
```
The blue bloom top-right and the warm shift bottom-right are what make it read as designed. A flat dark fill is wrong.

## Glass — ONLY on the mode pill and the banner stat strip

```css
background: rgba(20,26,34,.5);
backdrop-filter: blur(16px) saturate(1.1);
border: 1px solid rgba(255,255,255,.16);
box-shadow: inset 0 1px 0 rgba(255,255,255,.16);   /* the inset highlight matters */
border-radius: 13px;   /* 999px for the mode pill */
```
Nothing else in the app gets glass. Panels, rows, tables, fields, badges are solid.

## Mode pill (Daily / Planning)

```css
.pill      { padding:4px; border-radius:999px; gap:4px; }        /* + glass recipe */
.option    { padding:7px 22px; border-radius:999px;
             font-family:'Baloo 2'; font-weight:700; font-size:13.5px;
             color:rgba(255,255,255,.72); }
.option.on { background:#fff; color:#17222c; font-weight:800; }   /* solid white, high contrast */
```

## Underline tabs — the glow is the point

```css
.tab        { padding:10px 2px 11px; font-family:'Baloo 2'; font-weight:700;
              font-size:14px; color:rgba(255,255,255,.6); }
.tab.on     { color:#fff; font-weight:800; }
.tab.on::after {
  content:""; position:absolute; left:0; right:0; bottom:-1px;
  height:3px; border-radius:3px 3px 0 0;
  background:var(--cat);
  box-shadow:0 0 12px color-mix(in srgb, var(--cat) 60%, transparent);
}
.tab .count { font-size:10.5px; font-weight:800; background:rgba(255,255,255,.14);
              border-radius:999px; padding:1px 7px; }
```
The underline is the **only** active indicator. An active tab never gains a box, border, or ring.

## Title + banner stats

```css
.h1   { font-family:'Baloo 2'; font-weight:800; font-size:30px; color:#fff; letter-spacing:-.4px; }
.stat { padding:8px 15px; border-right:1px solid rgba(255,255,255,.12); min-width:78px; }
.value{ font-family:'Baloo 2'; font-weight:800; font-size:18px; color:#fff;
        font-variant-numeric:tabular-nums; }
.label{ font-size:9px; font-weight:800; letter-spacing:.07em; text-transform:uppercase;
        color:rgba(255,255,255,.6); }
```

## Panels (bento cards)

```css
background:var(--card); border:1px solid var(--bd); border-radius:16px;
box-shadow:0 10px 26px -14px rgba(0,0,0,.55);
/* header */ padding:14px 16px 8px;  /* body */ padding:3px 16px 16px; gap:8px;
/* title */  font-family:'Baloo 2'; font-weight:800; font-size:16.5px;
/* sub */    font-size:11.5px; color:var(--dim); font-weight:700;
```

## Class card — rest vs hover

```css
/* rest — no accent bar; identity is the small dot */
background:var(--muted); border:1px solid var(--bd); border-radius:13px; padding:12px;
transition:.15s cubic-bezier(.16,1,.3,1);
.dot { width:8px; height:8px; border-radius:3px; }

/* hover — bar ignites, border + glow turn accent, card lifts */
transform:translateY(-3px);
border-color:var(--accent);
box-shadow:0 18px 34px -16px rgba(0,0,0,.75),
           0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent),
           0 0 22px -6px color-mix(in srgb, var(--accent) 45%, transparent);
.bar { position:absolute; left:0; top:0; bottom:0; width:4px;
       background:var(--accent); box-shadow:0 0 14px color-mix(in srgb,var(--accent) 75%,transparent); }
```
Hovering the inner `Review` button leaves the card **unlit**.

## Pace chip (projections)

```css
background: color-mix(in srgb, var(--success) 10%, var(--muted));
border: 1px solid color-mix(in srgb, var(--success) 26%, var(--bd));
border-radius:9px; padding:7px 9px 7px 10px;
font-size:11.5px; font-weight:700; color:var(--mut);
/* warning variant swaps --success → --warning */
```

## Chips / badges generally

```css
background: color-mix(in srgb, var(--accent) 18%, transparent);
color: var(--accent);
font-family:'Baloo 2'; font-weight:800; border-radius:999px; padding:2px 8px; font-size:9.5px;
```

## Focus

Focus rings use **`:focus-visible` only** — never `:focus`. A mouse click must never paint an outline. Keyboard focus must be clearly visible.

## Motion

`transition: .15s cubic-bezier(.16,1,.3,1)` for hover/lift. Overlays ≤200ms. Sidebar hover pop-out ~220ms transform; docked pin/unpin ≤250ms. Every transition needs a `motion-reduce` fallback.

## Type

**Baloo 2** (800) for titles, numbers, buttons, labels. **Nunito** (400/600/700) for body. Numbers always `font-variant-numeric: tabular-nums`. Sentence case everywhere — never Title Case.

## Two blues — REOPENED AND RESOLVED DIFFERENTLY, Aug 2026 (logo rev 2)

> **The P2 ruling below is superseded. Do not implement it.** It was correct for the first
> logo, whose blue was `#2E6CB8`. The second revision recoloured the mark to a four-step ramp
> topping out at **`#5293CC`** — near enough to `--pl-pri` (`#6fb3de`) that the P2 ruling's
> own failure mode, "almost the same blue," became the thing it produced.

**Current ruling: the public layer's accent moved to the logo's blue.** Approved by Andy.

- `--pl-pri` is **`#5293cc`** — the tall bar and the rule.
- `--pl-pri-lt` is **`#79abd7`** — the `OS` and the third bar. **Two jobs. It is not a hover state and not a lighter accent.**
- The mark's bars are **literal, not inherited.** They no longer use `currentColor`. The ramp is the mark's content: flatten it to one colour and it stops being a chart.
- Alpha uses of the accent go through `--pl-pri-rgb`. Ten hardcoded `rgba(111, 179, 222, …)` had to be found by hand during this change — do not add an eleventh.

**Deliberately NOT moved**, and this is still the P2 reasoning holding: the signed-in app's `--primary`, `--ring`, `--sidebar-primary`, `--sidebar-ring` (`#6fb3de`) and `--cat-gpa` (`#4b9cd3`) in `src/index.css`. `CLAUDE.md` locks those, the two layers never share a screen, and repainting every pillar accent in both themes is its own chunk of work. **If the app accent is ever unified, `#5293cc` is the target.**

**Rejected, with reasons, so they are not re-proposed:**

| Option | Why not |
|---|---|
| **Keep `#6fb3de` and let the logo keep `#5293cc`** | 4% apart in hue. Reads as one colour rendered twice, badly — not as two colours. |
| **Move the accent to `#79abd7` instead** | Matches the `OS` rather than the tall bar, and carries the old accent's contrast problem: 2.4:1 on a white card. `#5293cc` is 3.3:1. |
| **Repaint the logo to `#6fb3de` in the assets** | Edits Andy's supplied artwork to chase a UI token. Wrong direction of travel, and a recoloured PNG is not reversible in one line. |

⚠️ **The ink `premed` (`#132535`) never goes on the public layer** — it is invisible on the dark field and the lockup reads as though it just says `OS`. Use `--pl-fg` for the word, or an `*-ondark.png`. The bars need no such treatment; the ramp reads on both.

⚠️ **On the paper theme the palest bar (`#BAD1E8`) is ~1.4:1 against the cream sidebar and effectively disappears.** That is faithful to the artwork — the ramp fades out on cream by design — so it has **not** been "fixed". Flagged for Andy. If it is ever changed, shift the whole ramp one step darker on light surfaces; do not lighten the background or recolour one bar in isolation.
