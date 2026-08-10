# public-landing-v2 — decisions

**Companion to `public-landing-v2.html`.** Cited by `implementation/briefs/P2-landing-restructure.md`.

**This mockup does NOT replace `public-landing-and-auth.html`.** That one is still the source for `/auth`, `/auth/merge`, and the overall page order. **v2 supersedes it for the nav, the hero, the tiles' interior, and the footer only.** Where they disagree on those four, v2 wins.

**Direction, not pixel law.** The deliverable is the structure and the single token block, not the exact hex values.

---

## 0. Why this exists — the defect that prompted it

**Andy, Aug 2026: *"i made a few changes and it just completely messed up font spacing, size and everything."***

`public-layer.css` had grown to **1013 lines across six appended "fix passes."** Each pass added rules instead of editing the previous one, so the same property was declared many times:

| Selector · property | Times declared |
|---|---|
| `.pl-hl-hero .l2` · `font-size` | **5** |
| `.pl-hero-in` | **6** |
| `.pl-btn` · `font-size` | 3 |
| `.pl-navwrap` · `max-width` | 3 |

**⚠️ And two breakpoints were dead.** `@media (max-width: 1100px)` and `(max-width: 900px)` sat at lines 757–769, **above** the non-media `clamp()` rules at 859–935. Equal specificity, later wins — so **tablet sizing had been unreachable since the fluid-type pass** and nobody noticed, because the clamps produce a plausible size at every width.

**That cascade is the actual bug.** A visual edit could not land predictably because five other rules were competing for the same property, and which one won depended on source order rather than intent.

> **⭐ THE RULE THIS SETS: every property is declared exactly once.** File order is tokens → primitives → layout → motion → **media queries last**. A future "quick fix" appended to the bottom of the file is how this returns.

---

## 1. Locked

### 1a · The nav is three floating islands. The bug was PLACEMENT.

**Andy: *"revert back to the floating islands. i was just complaining about it because the placement was off."*** An earlier version of this mockup merged them into one rail. **That was wrong and is recorded so it is not re-proposed.**

**The real defect:** `display:flex; justify-content:space-between` across three children centres the middle one **between its two neighbours**, not on the page. `Premed OS` and `Start tracking ↗` are different widths, so the pill sat off-centre by half that difference — **and the error is a fraction of the leftover space, so it grew as the viewport widened.** That is why it looked fine in a small window and wrong at full screen.

**Locked:** `grid-template-columns: 1fr auto 1fr`, brand `justify-self:start`, CTA `justify-self:end`. Side columns are forced equal, so the pill sits on true optical centre at any width.

**The pill contains the five links and nothing else** — Features · About · Pricing · Privacy · Terms. It keeps its own glass as an island.

**Signed-in state:** `Sign out` goes in the right-hand column beside the CTA. The current inline `style={{ marginLeft: 'auto' }}` breaks the distribution and must go.

### 1b · The brand is a two-tone wordmark, no icon glyph

**Andy sent six references** — MedAhead, ScalpelNote, UltimateOS, Klinar, MEDPRE, MEDOS — and **all six share one format: a two-tone wordmark with no separate icon.** The rename to **Premed OS** makes it near-automatic; `OS` is the second tone.

**Four variants are rendered in the mockup's chooser strip. `C` (accent `OS`) is shown live** — the only one that uses the product's own blue, which ties the wordmark to the CTA and the pillar accents into one system.

| | Trade-off |
|---|---|
| **A** weight + tone | Quietest. **The only one that survives at 16px** — footer, favicon |
| **B** outlined `OS` | UltimateOS's move. Best large; **the stroke turns to mush under ~18px** |
| **C** accent `OS` ✅ | Uses the product colour. Shown live |
| **D** caps, monotone | MEDPRE/MEDOS. Most "product", least warm |

> **⚠️ HONEST CONSTRAINT, recorded so it is not re-litigated:** the references are **geometric sans** (Poppins/Gilroy family). **Baloo 2 is rounded and `CLAUDE.md` says fonts never change.** The two-tone *format* transfers cleanly; the letterforms stay warmer. **Klinar is the closest of the six to what Baloo 2 can actually do** — and notably it is a single colour with no second tone at all. **Do not substitute a font to match a reference.**

**The chooser strip is mockup-only. It must not reach the build.**

### 1c · The coloured CTA is the TOP-RIGHT one

**Andy: *"colour the start tracking on the top right."*** An earlier pass applied this to the hero instead — **corrected, and recorded because the two are easy to swap.**

**Nav CTA:** saturated blue tint · `inset 0 1px 0 rgba(255,255,255,.45)` luminous top edge · outer bloom `0 6px 22px rgba(90,165,220,.32)`.

> **⭐ THE BLOOM IS LOAD-BEARING.** Every other glass surface on the page carries the inset highlight and stops there. **The bloom makes this the only element that appears to EMIT light rather than transmit it** — which is what lets a translucent pill hold the corner without going opaque. **Drop it and it becomes one more panel.**

**Hero CTA stays solid white and stays the primary.** On this dark field white is the heaviest value available, so the coloured pill reads as second place. **Do not colour both** — two competing primaries was the original defect and a tie does not fix it.

### 1d · The nav lives INSIDE the hero — structural, not cosmetic

**`.pl-hero` is `100svh`. If the nav is a sibling above it, the first screen becomes `nav-height + 100svh`**, pushing the bottom of the hero — and the scroll cue with it — below the fold by exactly the nav's height.

**Nothing errors. The cue silently disappears.** This mockup shipped that bug for one round; Andy caught it (*"this should still be in my view just at the bottom of my initial screen"*).

> **⚠️ A header looks like it belongs outside a hero section, so this is exactly the kind of thing a refactor "tidies up" into a bug.** The scroll cue being visible on load is the canary — if it isn't, the nav has been lifted out.

### 1e · Hero type is much larger, and the ceilings are guardrails

**Andy: *"the hero itself could fill up more of the screen in terms of font."***

```
--t-setup:  clamp(21px, 2.9vw, 58px)
--t-payoff: clamp(42px, 7.4vw, 150px)
--t-lede:   clamp(16px, 1.4vw, 27px)
```

**The hero gets a wider rail than the content sections** — `min(1820px, 95vw)` against `min(1660px, 93vw)`. **Display type and a five-column tile grid want different measures**; forcing them to share one is what made the headline look boxed in.

> **⚠️ Past ~150px the descender in "spreadsheet" starts fighting the CTA row on a 900px-tall laptop. If it needs to be bigger, raise the `vw` factor, not the ceiling** — that scales large screens without breaking short ones.

### 1f · Vertical rhythm

**Andy: *"'no account needed' is too vertically close to start tracking and sign in."*** It read as a caption *on* the CTA rather than a separate promise.

Hero stack gap `--s-3` → `--s-4`; fine-print row gets its own `margin-top`.

**Because the hero is `100svh`, space the stack does not use becomes dead air above and below it.** Spreading the blocks **fills** the screen; it does not push anything off it.

### 1g · Tile interior — the gaps are uneven on purpose

**Andy: *"column spacing is also too close here."***

`See how` gets **more** room under the title than the title gets under the icon. **It is an affordance, not content** — equal gaps made it read as a third line of the title.

The tile is a flex column and **the title flexes**, so `See how` sits on the tile floor and every affordance in a row lines up whether a title wraps to two lines or three.

### 1h · The footer

**Missing from v1 of this mockup; Andy caught it.** Content is unchanged from the shipped `PublicFooter.tsx`.

**The disclaimer is split by design:** the hero carries the one-line independence statement (`05` §6.1), the footer carries the **long form plus the AAMC line** (`05` §6.2). **Two requirements, not one repeated.**

> **⚠️ `opacity: 1 !important; transform: none !important` STAYS.** It is not leftover debugging. The footer was given `.pl-reveal` once and its required legal lines started at opacity 0 — **a required disclaimer hidden behind a scroll animation is a compliance problem, not a visual one.** Never give `.pl-foot` the reveal class.

---

## 2. Rejected

| | Why |
|---|---|
| **One merged nav rail** | Proposed here, **rejected by Andy.** The islands are the design; placement was the defect |
| **A separate icon mark** | None of the six references has one, and the two-tone wordmark carries the identity alone |
| **Colouring both CTAs** | Recreates the two-primaries problem as a tie |
| **Substituting a geometric font** to match the references | `CLAUDE.md`: fonts never change |
| **Shortening the hero** to remove dead space | Lets Features peek in and breaks the reveal. **The fix for dead space is bigger content** |
| **Keeping the gooey `filter: url()`** | Creates a containing block, clips at some widths, needs the SVG def present. A `transform` slides the arrow just as well |

---

## 3. Do not

- **Do not append a seventh pass to `public-layer.css`.** Edit the rule that exists.
- **Do not add a description line to a closed tile** — that is the generic SaaS grid this page rejects.
- **Do not carry the wordmark chooser strip into the build.**
- **Do not lift the nav out of the hero.**
- **Do not remove the bloom from the nav CTA.**
- **Do not reveal-gate the footer.**
- **Do not do the `Premed HQ` → `Premed OS` rename in this chunk** — 297 occurrences across 125 files. The wordmark reads from one exported constant; the rename lands separately.
- **No new dependencies.** Every effect here is CSS.

---

## 4. Not covered by this mockup

- **The guided tour** — sits between Features and the footer, **unchanged by this pass.** Its sizing moves onto the shared tokens; its structure does not change. Real screenshots are tracked in `P2` §7.
- **`/auth`, `/auth/merge`, and the four doc pages** — still `public-landing-and-auth.html` and `public-legal-about-pricing.html`.
