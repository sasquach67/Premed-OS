# Decisions — Public layer: landing, auth, local→account merge

**Mockup:** `05-public/public-landing-and-auth.html`
**Lab:** `variant-lab.html?page=public-landing` — group **Landing & auth**
**Spec:** `specifications/05-public-and-account.md` (§0.1 auth-not-a-gate · §0.2 merge · §1 landing · §2 auth · §6.1 independence)
**Exact visual values:** `_shared/_visual-recipes.md` — used literally.
**Status:** PROPOSED (Aug 2026). `BUILD-MANIFEST.md` governs whether it gets built.

Three surfaces in one file for review; each is its own page in the product.

---

## Locked

1. **Primary action is `Start tracking`, not `Sign up`** (§0.1). Signed-out mode is fully functional, so the landing page must not be a wall. **The promise is stated beside the CTA** — *"No account needed. Your data stays on this device until you choose to sync it."* — because it has to be visible before someone decides to bounce.
2. **Independence disclaimer sits in the HERO region**, not only the footer (§6.1). It uses the glass chip recipe because it floats over banner art. Footer carries the full version plus the AAMC line.
3. **Beta status is stated**, top-right, not implied.
4. **One page:** hero (capability strip + cropped product shot) → three specifics → privacy + cost → footer.
4a. **The hero is a centered glass hero** (Andy, Aug 2026: *"i want it really glass this time"*, with a reference set of dark centered SaaS heroes). **Every surface inside the hero region is glass; every surface below it stays solid-with-depth.** That boundary is the rule, and it is a scoped departure from `04` §0c's "glass only on the mode pill and banner stat strip" — the exception is granted to the public layer only, because in a hero everything genuinely does float. Recipe is `_visual-recipes.md` verbatim, **including the inset top highlight** — dropping it turns glass into a translucent box.
4b. **All ten capabilities are shown. This REVERSES the "no feature grid" rule below** (Andy, Aug 2026: *"i think they're all important"*). Breadth is the pitch — HQ's argument is that everything lives in one system — and prose cannot carry ten items.
4c. **The form is ten glass tiles in its own `Features` section**, carrying the hero's glass material and its two-weight heading. **Three forms were built to get here, and the two that failed are worth keeping on record:**
   - **Glass chip cloud** — rejected. *"They're just floating pieces of glass text."* Ten equal weightless objects with no structure and nothing telling you where to start reading.
   - **Numbered two-column index** — better, but it solved structure by leaving the hero's material behind, so the page had two visual languages.
   - **Glass tiles** — keeps the material, adds a **glass icon square** and a **pillar tag** per item. The tags are the real argument: they show the ten span ten different parts of the app, which neither earlier form could say.

   **Hard limits on the tiles:** **icons are lucide outlines, never emoji** (`CLAUDE.md`, absolute). **Titles only.** The moment a tile grows a description sentence it has become the generic SaaS feature grid this page rejects, and the reversal in 4b no longer covers it.
4d. **No pillar labels on the tiles** (Andy, Aug 2026: *"the little labels 'all pillars,' 'academics' is stupid"*). **The per-tile colour tint carries the same grouping without the noise** — this is the one place the earlier reasoning was wrong, because a visitor doesn't know HQ's pillar names yet and reading `All pillars` teaches them nothing. **One marker survives: a corner `Soon` on the Atlas tile**, because that is an honesty gate, not decoration.

4e. **Guided tour — an annotated screenshot section, below Features** (Andy, Aug 2026). A real screenshot per tab with **the ram mascot pointing things out**, stepping through `Overview · Academics · MCAT · Clinical`. **Overview first**, because it is home and it is the tab that explains the others.
   - **The ram is an illustration, never a UI icon** (`CLAUDE.md`, absolute). It stands *beside* a callout. **It is never the marker, the button, or the bullet** — the pulsing pin does that job.
   - **Real screenshots with demo data.** Never an illustration of an interface, never a laptop device frame, never a blurred fake.
   - The footer line states it is demo data and that a real workspace starts empty. **A landing page showing a full dashboard has to say that**, or the first empty session feels like a bug.
   - Callout coordinates are per-screenshot and will need redoing whenever a screenshot is retaken. **Accepted cost.**
   - **The ram art in the mockup is a placeholder silhouette.** Final art is the Ghibli-adjacent ram; swap the inline `<svg>` for an `<img>`.
   - **This is also where the mascot's celebration rule still applies** — the tour is explanation, not a milestone, so the ram is calm here. No confetti, no cheering copy.
5. **Type scale is the in-app scale.** `.h1` = **30px / `-.4px`** per `_visual-recipes.md`. **A larger "marketing" headline is a defect** — the landing page uses the same scale as every other surface. (Corrected from 44px in the first pass.)
6. **Magic link is the default action**; password secondary; Google third (§2.1). **Google is asked for sign-in identity only** — Calendar/Drive scopes are requested later, separately, at point of use.
7. **"Check your email" is a designed state.** Expiry stated (single-use, 15 min), resend and password fallback both offered, and it closes by reassuring that **local data is untouched**.
8. **The merge screen** (§0.2) names what's on the device in **plain counts**, defaults to `Upload this to my account`, and states the safety property **in the panel, not a tooltip**: local data survives until the server confirms; a non-empty account gets a **change-by-change review**, never an overwrite, never "last write wins."
9. **Buttons use the system shape** — `border-radius:10px`, not pills. Shared `.card / .hd / .ti / .sub / .bd / .lk / .btn` classes throughout.
10. **Glass only where it floats** — the two hero chips. Every content panel is solid-with-depth (`04` §0c).

## The copy (SETTLED Aug 2026 — no longer a first pass)

Rewritten with Andy against `trajectorywebdesign.com/blog/website-hero-message`. **Formula is Problem-Solution**, chosen because the incumbent is a spreadsheet and naming that puts the reader in the sentence.

| Element | Locked text | Why |
|---|---|---|
| Headline | *Stop tracking your pre-med application in a spreadsheet.* | 8 words, second person, names what they're doing right now. **"A spreadsheet" not "Google Sheets"** — same recognition, also catches Excel and Notion. |
| Subhead | *Everything from your first semester to the day you submit.* | **One line, and it stays one line** (Andy, Aug 2026: *"there's too much writing"*). Carries the multi-year scope, which is the part a stranger can't guess. |
| Audience | **UNC is named, in the badge.** | The article's "name a narrow audience" rule. Requires §6.1's independence line in the same hero region, which it has. |

**Cut from the hero (Andy, Aug 2026):** *"…like an upperclassman who's already done this and never forgets a detail."* It was the familiar-comparison he asked for and it tested well in conversation, but it made the hero a paragraph. **The Jarvis version was drafted and set aside earlier over Marvel/Disney IP exposure** — same reasoning that renamed Tar Heel Tracker. **If a familiar comparison is ever wanted again, it belongs in the About section, not the hero.**
| CTA | `Start tracking` / `Sign in` | Locked by `05` §0.1, unchanged. |

**Rejected wordings, with reasons, so they don't come back:**

- *"Your coursework, your MCAT, your hours — finally aware of each other"* — led with a differentiator before establishing the category. A stranger doesn't yet know HQ is a planner.
- *"Real AMCAS GPA math"* — Andy: *"literally makes no sense."* Only legible to someone who has already suffered through AMCAS. Replaced with **"Everything logged AMCAS-ready."**
- *"Exports straight to AMCAS"* — there is no AMCAS API. Reads as an integration promise HQ cannot keep.
- *"Google Sheets on steroids"* — the right instinct, wrong execution. Anchoring the headline on a spreadsheet caps perceived value at spreadsheet, and the phrase fights `general.md`'s stated feel (*calm, precise, academic*).
- **"Pillar" is banned from public copy.** Half-jargon: real in pre-med advising, but mostly an internal structural term in these docs. "Every part of the application" costs nothing and works on everyone.

## The three pitch claims

**They EXPAND three hero chips. They must never restate them.**

| Card | Expands chip | Backed by |
|---|---|---|
| You type the syllabus in once. Never. | *Upload a syllabus, get your semester* | `01` §4.1-M — **the keystone, and it still has no implementation brief** |
| Classes and prep can't both win | *One weekly plan across classes and MCAT* | `00` §11b shared hour budget |
| It tells you what's gone stale | *Flags what you've forgotten before the exam* | `01` §4.2-E · `02` §3.5 |

## Hero composition and motion (Aug 2026)

Reference set: Andy's 21st.dev hero collection plus six dark centered SaaS heroes. **The brief was "minimal" — his read on the first glass pass was that it looked nothing like them, and he was right: it had too much prose in the main stack.**

**The stack, in order, and nothing else belongs in it:** badge → headline → one line → two buttons → the no-account line.

1. **Only the headline is large type.** Everything else is 11–14px. That contrast is what makes the reference heroes read as minimal; it is not achieved by deleting content.
2. **The feature index is its own section below the hero**, not part of the hero stack. An earlier pass put it in the hero's "client logo row" slot; **it made the hero long even when dimmed.** The hero is five elements, full stop.
3. **Entrance animation: staggered fade + rise.** `translateY(18px) → 0`, `.62s`, `cubic-bezier(.22,1,.36,1)`, six steps ~90ms apart. **Six is the cap** — more and the page feels slow to arrive.
4. **`prefers-reduced-motion` shows everything instantly.** Not a faster animation, none. Required by `04`.
5. **The headline is now two weights and breaks the in-app scale** — a 27px setup line over a 46px payoff line, vs `_visual-recipes.md`'s single 30px. **This reverses decision #5**, because the stacked format Andy picked from reference 1 doesn't exist at one size; the weight-and-size contrast *is* the device. **Scoped to this page. Every in-app surface stays 30px.**
6. **Pill buttons and a floating pill nav — reverses decision #9, public layer only** (Andy, Aug 2026: *"the tab should follow these formats and the buttons too"*). **In-app buttons keep the 10px system radius, and this must not leak past landing/auth.**

## What was lifted from the two 21st.dev references, and what wasn't

Andy sent two components and named what he wanted from each: reference 1 (`ShaderShowcase`) for the headline format, the glass, and the button set; reference 2 (`ResponsiveHeroBanner`) for the minimal top tabs and the motion.

**Taken:**

| Piece | From | Note |
|---|---|---|
| `feTurbulence` + `feDisplacementMap` glass filter | 1 | **This is the actual "real glass" Andy kept asking for.** The edge refracts what's behind it instead of only blurring. `scale="0.3"` — higher looks melted. |
| Gooey CTA (label pill + arrow pill that slides out from under it) | 1 | The `feGaussianBlur` + `feColorMatrix` gooey filter fuses them mid-slide instead of showing a seam. |
| Two-weight stacked headline | 1 | Light setup line, heavy gradient payoff line. |
| Animated mesh background | 1 | **Rebuilt in CSS.** Three drifting radial blobs, 26–32s, alternate. |
| Floating pill nav | 2 | Glass container, text links, hover fill. |
| Pill buttons, solid + ghost | 1 & 2 | |
| Staggered fade-and-rise entrance | 2 | Already ported last round. |

**Dropped, deliberately:**

- **`@paper-design/shaders-react`** — WebGL, and a new dependency. `CLAUDE.md` requires flagging before adding one, and the CSS mesh gets ~90% of the look at zero cost.
- **`framer-motion`** — every motion in these two components is a CSS keyframe or transition.
- **The cyan/orange ramp, Instrument Serif, Inter, and the zinc `:root`** — they would fight `src/index.css`.
- **The rotating `textPath` badge and the logo particle burst** — decorative, and against `general.md`'s *calm, precise, academic*.
- **The partner logo row** — HQ has no partners, and fabricated social proof is banned on this page.
- **The full-bleed stock background image** — the cropped product screenshot does that job honestly.

## About section (added Aug 2026, Andy's request)

**First person, and it stays first person.** With no users, no logos and no testimonials, the only trust signal a beta honestly has is who made it and why.

- **Do not rewrite it into third-person company voice.** "Premed OS was founded to…" reads as a fake team and undoes the point.
- It carries the commercial commitments in plain language: not a company, no investors, no ads, no affiliate links, nothing sponsored, free options named first.
- It is the correct home for a familiar-comparison line if one is ever wanted again.

## Honesty gates on the strip

The chips are claims on a public page, so each has to be true on the day it ships.

- **"Advice from people ahead of you" carries a `soon` tag** — Atlas is a placeholder route (`00` §2.1). It is the most compelling item on the list and the least built. **Do not remove the tag until Atlas ships.**
- **"Google Calendar, Canvas, Drive, dictation"** — Canvas is **Path A only** (calendar feed). The grades API is specced and deliberately unbuilt (`integration-map` §2). The chip says nothing about grades, and must not.
- **School List, Essays, Letters and Profile/CV are ~80-line stubs.** Counting them toward breadth is fine; claiming depth is not.

## Do not

- Do not make `Sign up` the primary action, or gate the app behind an account.
- Do not use a headline size above the `_visual-recipes.md` scale.
- Do not bury the independence disclaimer in the footer alone.
- Do not add fabricated social proof, user counts, testimonials, countdowns, or exit popups. (**"or a feature grid" was struck Aug 2026 — see #4b.** The strip is permitted; a grid of icon+title+blurb cards is still not.)
- Do not give the capability chips icons, headings, or descriptions, and do not lay them out on a fixed column grid. The cloud is the concession; the card grid is not.
- Do not put glass on anything below the hero, and do not drop the inset top highlight from anything above it.
- Do not remove the `soon` tag from the Atlas chip until Atlas actually ships.
- Do not bundle Calendar/Drive scopes into sign-in.
- Do not let the merge screen default to anything other than upload, or describe the outcome without stating what happens to the local copy.
- Do not use pill buttons, and do not put glass on a content panel.
