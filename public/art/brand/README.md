# Brand assets — Premed OS

**Official logo supplied by Andy, Aug 2026.** Master source: `premedos-lockup.png`.

## Tokens — sampled from the logo, not guessed

| Token | Hex | Where |
|---|---|---|
| **Ink** | `#1E3044` | the word `premed` |
| **Blue** | `#2E6CB8` | `OS`, the tallest bar, the slider fill |
| **Blue light** | `#9AB3DF` | the three shorter bars |
| **Cream** | `#F6F3F1` | the logo's own background |

⚠️ `#2E6CB8` is **not** the same as the app's `--pl-pri` (`#6FB3DE`). The logo blue is
deeper. Decide deliberately whether the UI accent moves to the logo blue or the two coexist
— **do not let them drift into "almost the same blue," which is worse than either.**

## Files

| File | Use |
|---|---|
| `premedos-lockup.png` | Full lockup on its own cream. Decks, README, social card |
| `premedos-lockup-transparent.png` | Same, background knocked out |
| `premedos-stack.png` | Mark + wordmark, **no tagline**. The general-purpose lockup |
| `premedos-wordmark.png` | Wordmark alone |
| `premedos-mark.png` | The four bars alone |
| **`premedos-mark.svg`** | **The mark as vector — use this in UI.** Traced from the raster; bar geometry and the `#2E6CB8` accent are exact. Short bars use `currentColor`, so it inherits |
| `*-ondark.png` | See below |
| `favicon-{16,32,180,512}.png` | Browser and touch icons, from the mark |

## ⚠️ The dark-background problem

**The word `premed` is navy. On the public layer's dark field it is invisible.**

`*-ondark.png` remaps only the navy pixels to cream `#ECE3D4`. The blue `OS` and the mark
are untouched — they already read on dark.

**So: `premedos-*.png` on light surfaces, `premedos-*-ondark.png` on the public layer and
anywhere dark.** Getting this wrong produces a logo that looks like it says `OS`.

## Tagline

**"organize. optimize. get ahead."** is part of the supplied lockup. It is **not** currently
approved marketing copy anywhere in `premed-hq-documentation/`, and the landing hero has its
own settled headline. **Do not paste the tagline onto the landing page** without deciding it
against `P1` §2's copy — use `premedos-stack.png`, which excludes it.

## Provenance

Cropped and recoloured from the single master Andy supplied. **The mark SVG is the only
redrawn asset**; everything else is the original pixels. If a true vector master ever
exists, replace these rather than re-tracing.
