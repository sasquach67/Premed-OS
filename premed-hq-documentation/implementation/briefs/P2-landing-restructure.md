# P2 brief — Landing restructure (one-pass stylesheet · nav · hero · footer)

**Read ONLY this file plus the references in §9.** Global rules are in the repo's `CLAUDE.md`.
**If something you need isn't here, read the named spec section and tell me the brief was incomplete.**

> **Depends on P1, which SHIPPED (`67155de`).** This chunk changes how the landing page is styled and laid out. It does not add routes, does not touch auth, and reads no pillar data.

> **Cleared to build is NOT cleared to publish.** `05` §10's three open items — age floor, governing law, and the trademark/domain check — are unchanged by this chunk and still block pointing a public domain at Privacy, Terms, or About.

> **Three files only:** `src/components/public/public-layer.css` · `src/components/public/PublicNav.tsx` · `src/pages/public/Landing.tsx`. Plus one new `Wordmark` component. **Nothing outside `src/components/public/` and `src/pages/public/`.**

---

## 1. Goal

The landing page ships and works. This chunk fixes **why it can't be edited safely**, then applies six visual corrections Andy asked for.

**The stylesheet is the point.** The visual changes are small; the reason they need a brief is that the file they live in can no longer absorb a change predictably.

---

## 2. ⚠️ The defect — fix this first or nothing else holds

`public-layer.css` is **1013 lines across six appended "fix passes."** Each pass added rules rather than editing the previous one:

| Selector · property | Times declared |
|---|---|
| `.pl-hl-hero .l2` · `font-size` | **5** — lines ~139, 732, 758, 764, 860, 931 |
| `.pl-hero-in` | **6** — 215, 726, 854, 885, 907, + a media block |
| `.pl-btn` · `font-size` | 3 |
| `.pl-navwrap` · `max-width` | 3 |

**And two breakpoints are dead.** `@media (max-width: 1100px)` and `(max-width: 900px)` sit at lines 757–769 — **above** the non-media `clamp()` rules at 859–935. Equal specificity, later wins. **Tablet sizing has been unreachable since the fluid-type pass**, and it went unnoticed because the clamps produce a plausible size at every width.

**Andy: *"i made a few changes and it just completely messed up font spacing, size and everything."*** That is this, and it is not a user error.

### Rewrite as ONE pass

Order, strictly:

1. **Tokens** — `.pl` scope. Colour · **one** type scale · **one** spacing scale · radii · easing
2. **Primitives** — glass recipe, buttons, pills
3. **Layout** — nav, hero, features, tour, cards, footer, doc pages, auth
4. **Motion** — `.pl-an` load, `.pl-reveal` scroll
5. **Media queries LAST**, and only where a `clamp()` genuinely cannot cover it

**Every property declared exactly once. Every font-size and spacing value reads from a token — no loose px in a layout rule.**

**Delete every superseded pass. Do not keep them commented out.** The commented history is how the file got here.

> **⭐ THE STANDING RULE this sets:** a future fix **edits the rule that exists**. Appending a seventh pass to the bottom of the file is how this returns.

---

## 3. The nav

**Keep the three floating islands.** Brand, link pill, CTA — three separate elements. **Do not merge them into one rail**; that was proposed and rejected (`public-landing-v2.md` §2).

**The defect is `justify-content: space-between`.** Across three children it centres the middle one **between its neighbours**, not on the page. `Premed OS` and `Start tracking ↗` are different widths, so the pill sits off-centre by half that difference — **and because the error is a fraction of the leftover space, it grows as the viewport widens.** Fine in a small window, visibly wrong at full screen.

```css
.pl-navbar   { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; }
.pl-navbrand { justify-self: start; }
.pl-gooey    { justify-self: end; }
```

Side columns forced equal → the pill lands on true optical centre at every width.

**The pill holds the five links and nothing else** — Features · About · Pricing · Privacy · Terms. It keeps its own glass as an island.

**Signed-in state:** put `Sign out` in the right-hand column beside the CTA. **Remove the inline `style={{ marginLeft: 'auto' }}`** — it breaks the distribution entirely.

Below 900px the pill still hides; the `auto` column collapses to zero and brand/CTA hold the edges with no extra rule.

---

## 4. The brand — a two-tone wordmark, no icon

`Premed` + `OS`, two tones. Andy's six references all share that format and none has an icon glyph.

**Build it as a `<Wordmark>` component.** It also appears in the footer, the auth card, and later the app shell — inline nav markup will be copied and will drift.

**Variant `C`** (accent `OS`) is the default: the only one using the product's own blue, which ties the wordmark to the CTA and the pillar accents into one system. The other three are in the mockup's chooser strip.

> **⚠️ Fonts do not change.** The references are geometric sans; Baloo 2 is rounded. The two-tone **format** transfers, the letterforms stay warm. **Do not substitute a font to match a reference.**

> **✅ The `Premed HQ` → `Premed OS` rename is DONE** (Aug 2026, its own commit — 323 display strings across 126 files). **Nothing in this chunk needs to rename anything.** If you find a stray `Premed HQ` in a display string, fix it; if you find one in a **localStorage key, the vite base, or `googleDrive.ts`'s `BACKUP_FILENAME`, leave it** — those were preserved deliberately and renaming them is silent data loss. See `general.md` §Rename.

> **⭐ Andy also supplied the official logo** (Aug 2026). Assets are in `public/art/brand/` with a `README.md` carrying the sampled tokens. **The wordmark is lowercase `premed` + blue `OS`** — match the supplied lockup rather than the mockup's four chooser variants, which predate it. **Use `premedos-mark.svg` in the nav**, not a raster.
>
> ⚠️ **The logo's navy `premed` is invisible on the dark public layer.** Use the `*-ondark.png` variants there, or the SVG mark with `currentColor`.
>
> ⚠️ **The logo blue is `#2E6CB8`; `--pl-pri` is `#6FB3DE`.** They are not the same. **Do not let them drift into "almost the same blue"** — either move the accent to the logo blue deliberately or keep them clearly distinct.
>
> ⚠️ **Do not put the tagline "organize. optimize. get ahead." on the landing page.** It ships with the lockup but is not approved copy and the hero has a settled headline. Use `premedos-stack.png`, which excludes it.

**The chooser strip is mockup-only and must not reach the build.**

---

## 5. CTA hierarchy

**The nav (top-right) `Start tracking` becomes coloured glass.** From the mockup's `.btn-tint`: saturated blue tint · `inset 0 1px 0 rgba(255,255,255,.45)` · outer bloom `0 6px 22px rgba(90,165,220,.32)`.

> **⭐ The bloom is load-bearing.** Every other glass surface on the page carries the inset highlight and stops there. **The bloom makes this the only element that appears to EMIT light rather than transmit it**, which is what lets a translucent pill hold the corner without going opaque. **Drop it and it is one more panel.**

**The hero `Start tracking` stays solid white and stays the primary.** White is the heaviest value on this dark field, so the coloured pill reads as second place. **Do not colour both** — two competing primaries was the original defect; a tie is not a fix.

**Contrast:** the white label on tinted glass, over the **darkest** part of the field behind the nav, must clear WCAG AA. Keep the `text-shadow` — it exists for the light end of the gradient. **Check the `backdrop-filter`-unsupported fallback is a solid tint, not a transparent hole.**

**No copy changes.** `Sign up` still appears nowhere.

---

## 6. Hero

**Keep `min-height: 100svh`**, the flex-column centring, and the `@media (max-height: 680px)` escape. Features staying entirely below the fold is deliberate.

> **⚠️ THE NAV MUST STAY INSIDE `.pl-hero`.** It already is. **Do not lift it into a sibling header during the refactor.** `.pl-hero` is `100svh`; a sibling nav makes the first screen `nav-height + 100svh`, pushing the bottom of the hero — and the scroll cue with it — below the fold by exactly the nav's height. **Nothing errors; the cue silently disappears.** A header looks like it belongs outside a hero section, which is what makes this an attractive "tidy-up" and a real bug. **The visible scroll cue is the canary.**

**Type up substantially:**

```css
--t-setup:  clamp(21px, 2.9vw, 58px);
--t-payoff: clamp(42px, 7.4vw, 150px);
--t-lede:   clamp(16px, 1.4vw, 27px);
```

**The hero gets a wider rail than the content sections** — `min(1820px, 95vw)` vs `min(1660px, 93vw)`. Display type and a five-column grid want different measures; sharing one is what made the headline look boxed in.

> ⚠️ The ceilings are guardrails. Past ~150px the descender in "spreadsheet" fights the CTA row on a 900px-tall laptop. **If it needs to be bigger, raise the `vw` factor, not the ceiling.**

**Open the vertical rhythm.** Stack gap `--s-3` → `--s-4`; the fine-print row gets its own `margin-top`. `No account needed` currently sits almost against the buttons and reads as a caption *on* the CTA. Because the hero is `100svh`, **spreading the blocks fills the screen rather than pushing anything off it.**

**Collapse the last two blocks into one fine-print row** — the no-account promise and the independence disclaimer, separated by a middot.

> **⚠️ Both stay visible without scrolling.** The no-account line is what stops a bounce (`P1` §2); the independence line is required in the hero region by `05` §6.1. **Neither is ever reveal-gated.**

**Add the scroll cue** as the last child of `.pl-hero`, `flex: none`. It is the one new element on the page.

---

## 7. Tiles · footer · tour

**Tiles** — structure unchanged: 10 tiles, titles only at rest, example on click, `Soon` on Atlas. **Do not add description text to a closed tile.**

Fix the interior spacing. Icon, title and `See how` were nearly flush. **The gaps are uneven on purpose:** `See how` gets more room under the title than the title gets under the icon, because it is an affordance rather than content — equal gaps made it read as a third line of the title. Make the tile a flex column and **let the title flex**, so `See how` sits on the tile floor and every affordance in a row lines up regardless of title wrap.

**Footer** — content unchanged from the shipped `PublicFooter.tsx`. Confirm: About · Pricing · Privacy · Terms · Contact, and the **long-form** independence + AAMC disclaimer verbatim. The hero carries the one-line version; the footer carries the full one — **two requirements, not one repeated** (`05` §6.1, §6.2).

> **⚠️ `opacity: 1 !important; transform: none !important` STAYS.** Not leftover debugging. The footer was given `.pl-reveal` once and its legal lines started at opacity 0. **A required disclaimer behind a scroll animation is a compliance problem.** Never give `.pl-foot` the reveal class.

**Guided tour — NOT in scope.** Its sizing moves onto the shared tokens; **its structure does not change.** Real screenshots are a separate task: demo mode already exists (`src/lib/demoMode.ts`, `demoSeed.ts`, Settings toggle), so it is four captures at **one fixed viewport** dropped into `public/art/tour/` plus a `shot:` line per step. **The callout `pin`/`at` percentages must be re-derived per screenshot and the failure is silent** — a different capture width drifts every pin off target with no error. **Do not attempt it in this chunk, and do not delete `TourPreview`** — it is the fallback for a failed image load.

---

## 8. Must NOT change

- **Baloo 2 + Nunito.** Never.
- **Any settled copy string.** Read `P1` §2 before touching a word.
- The continuous blue field, `background-attachment: fixed`, the mesh.
- `useReveal.ts` and its **fail-visible** design — hidden styles only apply after `data-reveal-ready`.
- The in-app 10px radius. Pills stay scoped to `.pl`.
- Auth, Supabase, the merge screen, localStorage-first behaviour.
- **No new dependencies.** `@paper-design/shaders-react` and `framer-motion` were deliberately rejected in P1 — do not reintroduce them.
- Anything outside the three files in the header.

---

## 9. References

- `specifications/mockups/05-public/public-landing-v2.html` — **this chunk's mockup. Read it for structure and the token block.** Ignore its inline CSS except where `_visual-recipes.md` confirms a value. **Rebuild from library components — never copy the markup.**
- `specifications/mockups/05-public/public-landing-v2.md` — **what's locked, what was rejected, and the Do-not list. Read before the HTML.**
- `specifications/mockups/05-public/public-landing-and-auth.html` — **still the source for `/auth`, `/auth/merge`, and page order.** v2 supersedes it for the nav, hero, tile interior, and footer only.
- `specifications/decisions/_visual-recipes.md` — exact values, **used literally, never approximated.** The glass recipe's `inset 0 1px 0 rgba(255,255,255,.16)` is what makes glass read as glass.
- `implementation/briefs/P1-public-landing-auth.md` §2, §3 — non-negotiables and the four scoped departures.
- `specifications/05-public-and-account.md` §6.1, §6.2 — the disclaimers.

---

## 10. Done when

- [ ] `npm run build` passes
- [ ] **`.pl-hl-hero .l2` `font-size` appears exactly once** in the stylesheet
- [ ] **Every media query sits below every non-media rule** for the same selector
- [ ] No superseded pass remains, commented or otherwise
- [ ] **The scroll cue is visible on load without scrolling** at 1440×900 and 1920×1080 — if not, the nav has been lifted out of the hero (§6)
- [ ] **The nav pill is optically centred at 1280 / 1600 / 1920** — measure it, don't eyeball it
- [ ] The nav pill contains the five links and nothing else
- [ ] Squint test: the hero's white CTA is clearly heavier than the nav's coloured one
- [ ] Nav CTA label clears **WCAG AA** against the darkest field behind the nav
- [ ] Nav CTA is legible with `backdrop-filter` unsupported
- [ ] `See how` sits on the tile floor and lines up across a row with mixed title lengths
- [ ] Full-screen 1920px: hero fills the viewport, no Features peeking in, headline spans the measure
- [ ] 1280 / 1024 / 768 / 390px: no overlap, headline never clips
- [ ] `max-height: 680px`: hero content is not cut off
- [ ] Signed out **and** signed in: nav layout holds; `Sign out` does not shift the CTA
- [ ] Both themes — the public layer is art and must not follow the paper theme
- [ ] **The no-account line and the independence line are visible on load, without scrolling, with JS disabled**
- [ ] Footer legal lines render at full opacity with JS disabled
- [ ] Keyboard: tab through nav → hero CTAs → tiles, visible focus on each
- [ ] `prefers-reduced-motion`: scroll cue static, no tile transitions
- [ ] The wordmark chooser strip is **not** in the build
- [ ] `grep -rn "Premed HQ" src/` returns **nothing** in display strings
- [ ] `grep -rn "premed_hq" src/` still returns **8 localStorage keys** — they must survive this chunk untouched
- [ ] The nav mark renders from `premedos-mark.svg`, not a PNG
- [ ] The wordmark is legible on the dark field — navy `premed` has not been shipped onto it

## 11. Commit

```
refactor(public): one-pass stylesheet, centred nav pill, bigger hero

public-layer.css was six appended fix passes deep — .pl-hl-hero .l2
font-size declared 5 times, .pl-hero-in 6 — and the 1100px/900px
breakpoints were dead, sitting above the non-media clamp rules that
overrode them, so tablet sizing had been unreachable since the fluid
type pass. Rewritten as one pass: tokens, primitives, layout, motion,
media queries last, every property declared once.

- Nav keeps its three floating islands. space-between centred the pill
  between its neighbours rather than on the page, so it drifted by half
  the brand/CTA width difference and got worse as the viewport widened.
  Now a 1fr auto 1fr grid. The pill holds only the five links.
- Brand becomes a two-tone Premed OS wordmark component, no icon glyph.
  Reads from one constant; the 297-file rename is NOT in this commit.
- Nav CTA is coloured glass with an outer bloom; hero CTA stays solid
  white. Two identical white pills meant there was no primary.
- Hero type raised and given a wider rail than the tile grid. Display
  type and a 5-column grid want different measures.
- Scroll cue added as the last child of the hero. The nav stays INSIDE
  .pl-hero — as a sibling it pushes the cue below the fold by exactly
  its own height, silently.
- Tile interior spacing opened up; See how sits on the tile floor.
- Footer stays un-animated. Nothing legally required is animated in.
```

**Commit unrelated working-tree changes separately.**
