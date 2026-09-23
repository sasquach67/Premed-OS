# Design & Theme (HIGHEST PRIORITY)

The prior AI prototypes failed by being flat box-grids that felt vanilla. This file defines the look/feel. When in doubt, optimize for "clean, warm, interactive, deliberate."

## Vibe — cozy "iyashikei" / lo-fi anime (whole-app theme)
The entire theme is **iyashikei** (癒し系, calm/cozy "healing" slice-of-life) — cozy lo-fi anime. Two art modes combined:
- **Painterly backgrounds** = hand-painted **gouache Studio Ghibli scenery** (rice fields, tatami room w/ maple leaves, sunlit bedroom w/ city view). Warm, nostalgic, soft light.
- **Pixel-art accents/mascot** = chibi pixel sprites in the same cozy palette ("paint + pixel" combo, like Ghibli scenery meets a Stardew-style sprite).
- **Per-page header banner** (painterly art) + subtle full-page background tint. Home gets the hero scene. Inspiration in `/spec/references/` + Andy's refs.

## Palette
- Base: warm off-white "paper" (not stark white); gentle, low-contrast dark mode.
- Accent: subtle **Carolina blue** + soft Ghibli greens. One accent dominant; use sparingly.
- Keep the light/dark toggle but retune BOTH — current versions feel off.

## Typography
- Non-vanilla: a characterful display font for headings (rounded humanist or soft serif) + clean readable body.
- Propose 2–3 pairings for Andy to choose; load via Fontsource or self-hosted (no FOUT).

## Layout principles
- Card-based, generous whitespace, MedCoach-style grouped sidebar (see `/spec/references/medcoach.png`).
- **No plain rectangles as content.** Replace static boxes with interactive elements (cards that open, side-peek panels, accordions).
- **No explainer copy** ("command center", section descriptions). Self-evident UI only.

## Mascot rules
- **Replace the SVG ram with a cozy PIXEL-ART chibi creature** in the iyashikei palette (an original cute sprite — not a literal Totoro/Chibi-Totoro, to keep it ours; can keep a subtle ram nod if desired). It's decorative + delivers a random daily tip via speech bubble from an editable pool.
- **Must be FIXED in a reserved blank "nook" per page** — it must NOT scroll with content or overlap anything (current bug: it floats over Academics/GPA). Reserve a small whitespace corner on each page; position varies per page but is fixed within the page.
- Mascot art = Andy's sprite at `public/art/mascot.gif` — **animated GIF, render as a plain `<img src="/art/mascot.gif">`** so it animates (don't reimplement as SVG). Update `src/components/mascot/` to use the image; keep the speech-bubble logic.

## Theme switcher (Settings) — NEW feature
- Support multiple visual themes the user picks in Settings; default = **Ghibli (iyashikei)**, alternate = **Doraemon**. A theme swaps the banner/background image set + mascot + accent palette.
- Implement as a `theme` value in the store; assets resolve by suffix (`/art/home-banner.jpg` vs `/art/home-banner-doraemon.jpg`, `/art/mascot.gif` vs `/art/mascot-doraemon.gif`). Easy to add more themes later. Persist the choice.
- Main background to use now = Andy's `wallpaper.jpg` → place as `/art/home-banner.jpg`.

## Art style (matches Andy's Notion "school" cover — Ghibli countryside)
Target look = a hand-painted **Studio Ghibli countryside**: lush green terraced rice paddies reflecting the sky, scattered trees, distant rolling hills, soft cumulus clouds, warm gentle daylight — calm, nostalgic, painterly anime background art. This is the banner + background vibe for the whole app.

**Image-generation prompt (for an image model — NOT Claude Code; Claude Code only places the file):**
> "Studio Ghibli-inspired hand-painted landscape, lush green terraced rice paddies reflecting a bright blue sky, scattered trees and distant rolling hills, soft white cumulus clouds, warm gentle morning light, painterly anime background art (in the style of 'Only Yesterday' / 'My Neighbor Totoro' countryside), calm and nostalgic, highly detailed, no text, no characters, wide cinematic banner — aspect ratio ~3:1."

Variants: generate 2–3 (e.g., a sunrise field, a forest path, a hillside town) so different pages/banners can rotate. Keep them cohesive (same palette/lighting).

**Claude Code integration:** put generated art in `src/assets/banners/`; render a reusable `<PageBanner image=… />` at the top of each page (Home = hero). Add a soft full-page background tint sampled from the art. Until art exists, use a tasteful gradient placeholder in the same green/blue palette.

## Assets pending from Andy
Final Ghibli banner art (use prompt above) · ram reference pics · (these unblock final theme).

## Shared controls are required

Every new or modified interface must use the existing themed controls in `src/components/ui` for its visible interactions. This applies to dialogs, generated-resource workflows, settings, and secondary forms as well as primary pages. Retain the app's current fonts, colors, focus treatment, and light/dark theme tokens.

- Use `SelectField` for simple option lists, including an explicit empty choice, or the shared `Select` primitives for grouped/custom layouts.
- Use `DropdownMenu` for actions. When users can enter custom text, keep an editable input and provide themed preset choices rather than a native `datalist`.
- Do not add raw `<select>` or `<datalist>` elements; the release lint gate enforces this across the app.
- Check the **opened menu**, not just its closed trigger: light/dark themes, keyboard navigation and Escape, touch access, dialog layering, and long labels on narrow screens.
- Preserve stored option values, empty/reset choices, labels, disabled states, and form behavior when changing presentation.
