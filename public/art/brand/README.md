# Brand assets — Premed OS

**Official logo supplied by Andy, Aug 2026 (second revision).** Master source:
`/uploads/premedos.png`, the full cream lockup. Every file here is cropped from that one
image; nothing is redrawn except the mark, which is vector.

## The logo has two forms

| | What it is | Where |
|---|---|---|
| **Full lockup** | mark, wordmark, tagline, rule | social card, decks, README |
| **The logo** | mark **above** wordmark, no tagline | everywhere in the product |
| **The mark / icon** | the four bars alone | favicon, collapsed sidebar rail, app icon |

**The mark sits ABOVE the wordmark. It is never beside it.** The app got this wrong for one
release — `Wordmark.tsx` set them inline, which matched no supplied artwork. Where a
horizontal brand seems necessary, the answer is the mark alone, not a relaid-out lockup.

## Tokens — sampled from the master, not guessed

| Token | Hex | Where |
|---|---|---|
| **Ink** | `#132535` | the word `premed`, the tagline |
| **Blue 4** | `#5293CC` | tallest bar, the rule. **The accent.** |
| **Blue 3** | `#79ABD7` | third bar, and the `OS` |
| **Blue 2** | `#9EC0E0` | second bar |
| **Blue 1** | `#BAD1E8` | shortest bar |
| **Cream** | `#FAF6F3` | the logo's own background |

⚠️ **The bars are a four-step ramp, not a light/dark pair.** The previous revision had three
identical pale bars and one dark one; flattening the ramp back to that turns a chart into
four sticks. The steps are the point.

⚠️ **`#79ABD7` belongs to the `OS` and the third bar. It is not a hover state, a disabled
state, or a lighter `--pl-pri`.** It is `--pl-pri-lt` and has exactly two jobs.

## The accent moved (Aug 2026)

`--pl-pri` **was** `#6fb3de`; it is now the logo's `#5293cc`. The previous revision's logo
blue was `#2E6CB8`, far enough from the UI accent to coexist. This revision's is not — at
`#5293CC` against `#6FB3DE` the two read as one colour rendered twice, badly. Andy approved
the move rather than shipping the drift.

Alpha uses of the accent go through `--pl-pri-rgb`, not a literal `rgba(82, 147, 204, …)`.
There were ten hardcoded `rgba(111, 179, 222, …)` in `public-layer.css` that had to be found
by hand during this change; do not add an eleventh in the new colour.

**Still on the old blue and deliberately untouched:** the signed-in app's `--primary`,
`--ring`, `--sidebar-primary`, `--sidebar-ring` in `src/index.css` (all `#6fb3de`) and
`--cat-gpa` (`#4b9cd3`). `CLAUDE.md` locks those tokens, the two layers never share a
screen, and moving them repaints every button and pillar accent in the product. Flagged, not
done.

## Files

| File | Use |
|---|---|
| `premedos-lockup.png` | Full lockup on cream, 1509×790. **1.91:1 — sized for the og:image**, don't recrop |
| `premedos-lockup-transparent.png` | Same, background knocked out |
| `premedos-stack.png` | Mark + wordmark, **no tagline**. The general-purpose logo |
| `premedos-wordmark.png` | Wordmark alone |
| `premedos-mark.png` | The four bars alone, tight crop, transparent |
| **`premedos-mark.svg`** | **The mark as vector — use this in UI.** viewBox `0 0 312 205` |
| `*-ondark.png` | See below |
| `favicon-{16,32,180,512}.png` | Browser and touch icons |

The favicons are **drawn from the bar geometry and downsampled**, not resampled from the
raster. At 16px a resampled bar is mush and the four steps collapse into a blur, which loses
the only thing the icon says.

## ⚠️ The dark-background problem

**The word `premed` is `#132535`. On the public layer's dark field it is invisible.**

`*-ondark.png` remaps the ink to cream `#ECE3D4` and leaves the blue ramp alone — the ramp
already reads on dark. **So: `premedos-*.png` on light surfaces, `premedos-*-ondark.png` on
the public layer and anywhere dark.** Getting this wrong produces a logo that looks like it
says `OS`.

The remap classifies a pixel as ramp-blue by `B − R > 40` **and** `B > 150`. The second test
is not redundant: the ink's own `B − R` is 34, six away from the first threshold, and the
master is AI-generated with per-pixel texture — noise inside the navy glyphs crossed the
line and survived as black speckles until the luminance test was added.

## Tagline

**"organize. optimize. get ahead."** ships with the lockup. It is **not** approved marketing
copy anywhere in `premed-hq-documentation/`, and the landing hero has its own settled
headline. **Do not paste the tagline onto the landing page** without deciding it against
`P1` §2's copy — use `premedos-stack.png`, which excludes it.

## Provenance

Cropped from the single master Andy supplied. The crop boxes are measured off ink bounding
boxes, not eyeballed: bands at y 189–393 (bars), 420–629 (wordmark), 660–720 (tagline),
782–800 (rule). **The mark SVG and the favicons are the only redrawn assets.** If a true
vector master ever exists, replace these rather than re-tracing.
