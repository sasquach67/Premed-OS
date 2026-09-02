# P1 brief — Public layer (landing · auth · local→account merge)

**Read ONLY this file plus the references in §8.** Global rules are in the repo's `CLAUDE.md`.
**If something you need isn't here, read the named spec section and tell me the brief was incomplete.**

> **GATE: CLEARED.** Andy flipped both `05-public` rows in `BUILD-MANIFEST.md` to `YES` (Aug 2026). **This chunk is cleared to build.**
>
> **Cleared to build is NOT cleared to publish.** The age floor, governing law, and the `Premed OS` trademark/domain check (`05` §10) are open. **Build all seven routes; do not point a public domain at Privacy, Terms, or About until those three close.**

> **No dependency on any other brief.** This is the first surface a stranger sees and it reads no pillar data. It can be built before or after the Academics chunks.

---

## 1. Goal

Three public routes, none of which exist yet:

| Route | What it is |
|---|---|
| `/` (signed out) | One-page landing. Hero → features → guided tour → three specifics → about → privacy & cost → footer |
| `/auth` | Sign in / create account. Magic link default, password secondary, Google third |
| `/auth/merge` | Shown once, after a signed-out user with local data signs in |
| `/about` · `/privacy` · `/terms` · `/pricing` | Four doc pages on one shared shell |

**The single most important behavioural fact:** signed-out mode is already fully functional and must stay that way. **This chunk adds a front door, not a gate.**

## 2. Non-negotiables

- **`Start tracking` is the primary action everywhere. `Sign up` appears nowhere.** The line under the CTA states the local-first promise verbatim: *"No account needed. Your data stays on this device until you choose to sync it."* It must be visible without scrolling, because it is the thing that stops a bounce.
- **The independence disclaimer renders in the hero region**, not only the footer: *"An independent student project. Not affiliated with UNC-Chapel Hill or the AAMC."* Footer carries the full version plus the AAMC line. **Never describe the palette as an institutional colour.**
- **Both auth methods ship.** Magic link is the default surface; password is a real, equally supported path, not a fallback stub. Google is sign-in identity **only** — **do not request Calendar or Drive scopes here.** Those are asked for later, separately, at point of use.
- **Auth must be enumeration-safe and rate-limited.** The response for "email exists" and "email doesn't exist" is byte-identical. **Never email anything sensitive** — no grades, scores, coursework, or record counts, ever, in any auth mail.
- **The merge screen is the highest-risk surface in the product.** Local data survives until the server confirms the write. Default is `Upload this to my account`. A non-empty account gets a **change-by-change review**, never an overwrite, never "last write wins". State that property **in the panel**, not in a tooltip.
- **No fabricated social proof.** No user counts, testimonials, client logos, countdowns, or exit popups. HQ has no users yet and the page must not imply otherwise.
- **Honesty gates on the feature tiles.** The Atlas tile carries a `soon` tag because Atlas is a placeholder route. The integrations tile names Canvas but **says nothing about grades**, because only the calendar-feed path exists. **Do not remove either constraint to make the page look better.**
- **No new dependencies.** Every effect in the mockup is CSS or an inline SVG filter. `@paper-design/shaders-react` and `framer-motion` appear in the source references Andy sent and were **deliberately rejected** — do not reintroduce them.

## 3. Scoped design departures — public layer ONLY

This page intentionally breaks four house rules. **All four are scoped to `/` and `/auth*`. If any of them appears on an in-app surface, that is a defect.**

| Departure | Normally | Here | Why |
|---|---|---|---|
| **Pill buttons + floating pill nav** | 10px system radius (`04` §6) | `border-radius:999px` | Andy, Aug 2026: *"the tab should follow these formats and the buttons too"* |
| **Two-weight headline above the in-app scale** | `.h1` = 30px | 27px setup line over a 46px payoff line | The stacked format doesn't exist at one size; the contrast *is* the device |
| **Glass on every floating surface** | Glass only on the mode pill + banner stat strip (`04` §0c) | Nav, badge, buttons, feature tiles, tour callouts | In a hero, everything genuinely floats |
| **A feature grid** | Banned by the page's own earlier rule | Ten glass tiles, icon + title | Breadth is the pitch; prose can't carry ten items |

**Glass recipe is `_visual-recipes.md` verbatim, including the inset top highlight.** Dropping `box-shadow: inset 0 1px 0 rgba(255,255,255,.16)` turns glass into a translucent box and is the most likely fidelity miss in this chunk.

## 4. The landing page, section by section

1. **Floating pill nav** over the gradient — brand left, glass pill of text links centre, gooey CTA right. **Not a solid top bar.** The gooey CTA is a white label pill with an arrow pill that slides out from under it on hover, fused by an SVG `feGaussianBlur` + `feColorMatrix` filter so there's no seam mid-slide.
2. **Hero, five elements and nothing else:** badge → two-weight headline → one line → two pill buttons → the no-account line, then the disclaimer. **No screenshot in the hero** — it lives in the guided tour below Features, where it can be annotated.
3. **Features:** eyebrow, two-weight heading, one line, then **ten glass tiles in a 5×2 grid**. Each tile is a glass icon square and a title. **Icons are lucide outlines. Never emoji** (`CLAUDE.md`, absolute). **Titles only — a description under a tile turns this into the generic SaaS grid the page rejects.** **No pillar labels**; the per-tile colour tint carries the grouping. The **only** marker is a corner `Soon` on the Atlas tile.
4. **Guided tour** — a real screenshot per tab with **the mascot pointing things out**, stepping `Overview · Academics · MCAT · Clinical`, Overview first.
   - **⚠ THE MASCOT IS NOT A RAM.** `05-public-and-account.md` §6.1 forbids ram or Rameses imagery. Any mascot must be **visibly unrelated to a university mascot**. Use a **Ghibli-adjacent doctor character** (Andy's words: *"little doctor ghibli"*). **A ram asset DOES exist** — `src/components/mascot/Ram.tsx` rendering `/art/mascot.gif` via `MascotNote.tsx`, live in the app today. **Do not use it on the public layer.** (§6.1 once claimed no such asset existed; that was wrong and both it and root `CLAUDE.md` were corrected Aug 2026.)
   - **The mascot is an illustration, never a UI icon.** It stands beside a callout; the pulsing pin marks the region. It is never a marker, a button, or a bullet.
   - **Real screenshots with demo data.** No illustration-of-an-interface, no laptop device frame, no blurred fake.
   - The footer line must say it's demo data and that a real workspace starts empty. **Without it, the first empty session reads as a bug.**
   - The mascot is **calm here.** Celebrations are for real milestones only; a tour is explanation. No confetti.
   - The mockup's figure is a **placeholder silhouette.**
5. **Three specifics** — solid cards. These **expand** feature tiles 2, 4 and 5; they must never restate them.
6. **About** — first person, and it stays first person. A beta with no users has exactly one honest trust signal: who made it and why. **Rewriting this into third-person company voice reads as a fake team** and is a defect.
7. **Privacy + cost**, then footer with the full independence and AAMC lines.

**Everything below the hero is solid-with-depth**, not glass. That boundary is the rule.

## 5. Motion

- **Staggered entrance:** `translateY(18px) → 0` with opacity, `.62s`, `cubic-bezier(.22,1,.36,1)`, six steps roughly 90ms apart. **Six is the cap** — more and the page feels slow to arrive.
- **Animated mesh background:** three drifting radial blobs, 26–32s, `ease-in-out infinite alternate`. This is the CSS stand-in for the reference's WebGL `<MeshGradient>`. It is not a video, not a canvas, not a dependency.
- **Headline sheen:** a slow gradient sweep on the payoff line. **First thing to cut if the page feels busy.**
- **`prefers-reduced-motion: reduce` shows everything instantly** — not a faster animation, none. Mesh drift and sheen both stop.

## 6. Auth states to build (all of them, none stubbed)

Sign in · create account · **"check your email"** (expiry stated, resend offered, password fallback offered, closes by reassuring that local data is untouched) · invalid or expired link · rate-limited · network failure · already signed in.

**"Check your email" is a designed state**, not a redirect with a toast.

## 7. Merge screen

- Names what's on the device in **plain counts** — "14 classes, 62 assignments, 340 logged hours" — never bytes, never a JSON blob.
- Two options, `Upload this to my account` preselected.
- The safety property in the panel: local data survives until the server confirms.
- `Decide later` is a real path that changes nothing and points at Settings → Data.
- **Shown once.** It must not reappear on every sign-in.

## 7b. Doc pages — About · Privacy · Terms · Pricing

**One shell, four routes.** Same pill nav, same footer, **720px measure** with a sticky contents rail above 1100px. **No glass below the title band.**

- **Every section opens with a one-sentence plain-English summary strip.** §6.4 requires plain language; the strip is how that gets enforced structurally. **If a summary and its section disagree, rewrite the section — never delete the summary.**
- **`Last updated` date + changelog on Privacy and Terms.** Real dates.
- **Privacy names all three processors** (Supabase, the AI provider, the transcription provider) and gives a **table of what leaves the device with the local-only alternative for each.** On-device transcription is called out separately.
- **Privacy names the real sensitive-data protections**: HTTPS transport; Supabase Auth and owner-scoped row-level security; short-lived Calendar tokens kept only in tab session storage; AES-GCM-encrypted server-side Drive refresh tokens; least-privilege scopes; limited human access.
- **Privacy includes the affirmative Google Workspace API Limited Use statement** and expressly prohibits using raw or derived Workspace data to develop, improve, or train generalized or non-personalized AI/ML models. Calendar event data does not go to an AI provider; Drive-derived material reaches AI only after the student deliberately selects it for a visible study action.
- **Terms carries the "every number is an estimate to verify" clause**, the user-owns-their-content licence that ends on deletion, the provenance rules from §6.6, and the permanent read-only Canvas boundary.
- **About uses HQ's own vocabulary, deliberately not the reference's** (Andy: *"i kinda don't want to be accused of copying the other dude"*). **Two-weight headline** (*"A note from / the creator."* — **the decisions file owns copy; an earlier draft of this brief said "the person who built it" and was wrong**), **one 640px column**, and **the photo as a 226px right-floated figure the prose wraps around**, entering at the second paragraph. **Both the wrap and the uncropped frame are load-bearing** (Andy: *"i like how the text wraps around the image so you can see the entire image"*). Body is 17px/1.85; **normalising the leading back to 1.45 kills the page.**
- **Rejected, do not reintroduce:** a left portrait column or any two-column split · a drop cap · **a caption of any kind** (*"dont caption it"*) · **a Who/When/Team fact rail** (*"the who what team is dumb"*) · **a 16:9 photo band across the top** — built and reverted, because it crops.
- **The About copy is Andy's own words**, with three mechanical edits listed in the decisions file. **Do not rewrite his voice, do not smooth "my noob self", do not make it read like a company.**
- **The photo is a real photo of Andy**, shown **whole and uncropped** at its native ~3:4, **uncaptioned**. Not an avatar, not an illustration, not the mascot. Serve it responsive and compressed.
- **Two links only: LinkedIn and email.** `https://www.linkedin.com/in/andy-quach-273bbb349/` (`target="_blank"`, `rel="noopener noreferrer"`) and `mailto:elephon08@gmail.com`. **TikTok and Instagram were in the reference and are cut.** The icon squares are real `<a>` elements, focusable and keyboard-activatable, not styled spans.

- **The feedback panel is the §7 form** (one email *or* one form, not both). **Export and deletion must never route through it**, and it carries a line telling people not to paste grades, scores, or patient details.
- **About states independence in the body**, not only the footer.

**Pricing is a short coming-soon page** (ruled Aug 2026), titled *"It's free for now, don't worry."* in the two-weight headline format. **The nav item is real and routes here — a dead button is a defect.** The page says there is nothing to buy and why there's no number yet, then carries the four §5.4 commitments.

**Banned on the pricing page:** plan cards, tiers, comparison tables, **any number that isn't real**, blurred or placeholder prices, a paid-tier waitlist, or any control that could read as a purchase. **Do not let the page grow** — it stays short until a measured price exists.

**Do not paste a generic policy template.** Every claim on Privacy must be checkable against the spec. **A claim HQ cannot keep is worse than no page.**

> **Publishing blockers, not build blockers (§10):** the **age floor**, **governing law**, and the **`Premed OS` trademark and domain check** are all unresolved. Build the pages; **do not publish them live** until Andy closes those three.

## 8. References — these only

- `specifications/mockups/05-public/public-landing-and-auth.html` — **this chunk's mockup. Read it for layout and composition.** Ignore its inline CSS except where `_visual-recipes.md` confirms a value. **Rebuild from library components — never copy the markup.** The SVG filter defs and the mesh keyframes are the exception: those are behaviour, and porting them literally is correct.
- `specifications/mockups/05-public/public-legal-about-pricing.html` — **the doc pages' mockup.** Same rules: layout and composition only, rebuild from library components.
- `specifications/mockups/05-public/public-legal-about-pricing.md` — locked decisions for the doc pages, including the pricing constraints.
- `specifications/mockups/05-public/public-landing-and-auth.md` — locked decisions, the settled copy, the rejected wordings and why, the honesty gates.
- `specifications/mockups/_shared/_visual-recipes.md` — **exact visual values**, used literally.
- `specifications/05-public-and-account.md` — **the spec is law for behaviour**: §0.1 auth-not-a-gate · §0.2 merge · §1 landing · §2 auth · §4 account & deletion · §6.1 independence · §6.4–6.5 privacy & terms.

## 8b. Build these as ONE component each, not per-page copies

- **`PublicHeadline`** — the two-weight headline (`.l1` setup line + `.l2` gradient payoff line). Used by the hero, the Features heading, the tour heading, About, and Pricing. **In the mockups it exists twice and drifted; in the build it is one component.** About passes a larger size (26/56 vs 19/33) — a prop, not a fork.
- **`PublicNav`** and **`PublicFooter`** — identical across all seven public routes.
- **`GlassSurface`** — the `_visual-recipes.md` glass recipe including the inset top highlight, so it cannot be half-implemented on one surface.

## 9. Components to reuse

`button` (configured to the pill variant **for this route group only**) · `card` · `badge` · `input` · `label` · `separator` · `sonner` · `alert` · `radio-group` (merge options) · lucide icons.

**Do not fork `Card`.** The three specifics, About, privacy and cost are all the shared card, configured. The glass tiles are their own public-layer component and must not be added to the in-app library.

## 10. Done when

- [ ] `/`, `/auth`, `/auth/merge` route and render signed out; **the app still works fully signed out and nothing new gates it.**
- [ ] `Start tracking` is primary everywhere; the string `Sign up` appears nowhere in the route group.
- [ ] The local-first promise line renders **without scrolling** at 1280px and on mobile.
- [ ] Independence disclaimer in the hero region **and** the footer; AAMC line in the footer.
- [ ] Magic link **and** password both work end to end. Google requests identity scopes only — **verify the consent screen lists no Calendar or Drive scope.**
- [ ] Auth responses are **enumeration-safe** (identical for known and unknown emails) and rate-limited. No auth email contains grades, scores, coursework, or counts.
- [ ] All eight auth states render, including "check your email" as a designed screen.
- [ ] Merge: plain counts, upload preselected, safety property in the panel, `Decide later` works, **shown once**.
- [ ] Ten feature tiles, lucide icons, no pillar labels, **zero emoji anywhere in the route group** (grep and say so).
- [ ] Guided tour: real screenshots with demo data, **mascot is a doctor and not a ram**, illustration only, pins mark regions, demo-data line present, tab stepper works.
- [ ] Atlas tile carries `soon`; the integrations tile makes **no claim about Canvas grades**.
- [ ] Glass carries the inset top highlight; **nothing below the hero is glass**.
- [ ] Pills and the 46px headline exist **only** in this route group — **grep the in-app surfaces and confirm neither leaked.**
- [ ] Reduced motion shows everything instantly; keyboard, focus order, and AA contrast pass in **both** themes.
- [ ] **No new packages in `package.json`.**
- [ ] Four doc pages route and render on one shared shell; **every section has a plain-English summary strip**; Privacy and Terms carry a real `Last updated` and a changelog.
- [ ] Pricing routes from the nav, states there is nothing to buy and why, and contains **no plan cards, tiers, purchasable control, or any number that isn't real**.
- [ ] **No nav item anywhere goes nowhere.**
- [ ] `npm run build` passes.

## Commit (required)

`npm run build` must pass, then **commit before reporting**: `feat(public): landing, auth, and local-to-account merge`.
If unrelated pre-existing changes are in the working tree, commit them **separately** with their own message — never bundled into this chunk.

## 11. Report

Diff summary, plus three greps: no `Sign up` string, no emoji in the route group, and no pill radius or 46px headline outside `/` and `/auth*`.
