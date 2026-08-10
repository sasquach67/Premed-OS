# Decisions — Public doc pages: About · Privacy · Terms · Pricing

**Mockup:** `05-public/public-legal-about-pricing.html`
**Companion:** `05-public/public-landing-and-auth.html` (same nav, same footer, same tokens)
**Spec:** `specifications/05-public-and-account.md` §5 (billing) · §6 (legal & trust) · §7 (support)
**Exact visual values:** `_shared/_visual-recipes.md` — used literally.
**Brief:** `implementation/briefs/P1-public-landing-auth.md`
**Status:** PROPOSED (Aug 2026). `BUILD-MANIFEST.md` governs whether it gets built.

Four pages in one file for review; each is its own route in the product.

---

## Locked

1. **One shell, four pages.** Same pill nav, same 720px measure, same title band, same footer. **A legal page that looks like a different site reads as boilerplate somebody pasted in**, which is exactly what these must not be.
2. **720px measure with a sticky contents rail.** Legal text at full width does not get read. Rail collapses to inline chips below 1100px.
3. **Every section opens with a plain-English summary strip.** §6.4 requires plain language; a one-sentence tinted strip above each section is how that gets enforced structurally rather than hoped for. **If a summary and its section ever disagree, the section is wrong — rewrite the section, never delete the summary.**
4. **`Last updated` date and a changelog on Privacy and Terms** (§6.4). Required, and it has to be a real date.
5. **No glass below the title band.** Same rule as the landing page: the band is the hero region, everything under it is solid-with-depth.
6. **Independence disclaimer in every footer, and in the body of About** (§6.1). AAMC line in every footer.

## About — deliberately NOT the reference layout

Andy sent a UNC student project's About page as a feel reference, then asked (Aug 2026): *"i kinda don't want to be accused of copying the other dude."* **Correct instinct, and the fix isn't to nudge it — it's to use HQ's own vocabulary instead of the reference's.**

**What the reference did, and what was dropped:**

| Reference | Here |
|---|---|
| Giant ALL-CAPS `ABOUT` over a rule | **The landing page's two-weight headline:** *"A note from / the creator."* — run **bigger here than on any other doc page** (26/56 vs 19/33), because About is the one page in the group with a voice |
| Two-column split, framed portrait left | **One 640px column.** No split. |
| Portrait as its own column | **A 226px right-floated figure the prose wraps around**, entering at the second paragraph |
| Captioned portrait | **Uncaptioned** |
| Drop cap | **None** |
| Serif body | Nunito at **17px/1.85** — leading carries the editorial feel now |

**Two things about the photo are both load-bearing** (Andy, Aug 2026: *"i like how the text wraps around the image so you can see the entire image"*):

1. **The prose wraps around it.** That's the effect he picked. A stacked or full-width image is a different page.
2. **The photo is shown whole, uncropped.** Its native ~3:4 frame is used as-is.

**Rejected along the way. Do not reintroduce any of these:**

- A left portrait column, or any two-column split.
- A drop cap.
- **A caption of any kind.** *"dont caption it, dont do me."*
- **A three-up Who / When / Team fact rail.** *"the who what team is dumb."* The prose already says all three; the rail restated them as chrome.
- **A 16:9 photo band across the top of the column.** Built and reverted — **it crops**, and seeing the whole frame is the point.

**The rest of the page:**

1. **The photo is inlined as a data URI** in the mockup so it stays single-file. **The build serves a responsive, compressed image** — an unoptimised full-size photo is the easiest way to wreck this page's load time.
2. **The reference used a serif and HQ cannot.** Baloo 2 and Nunito are locked. **The looseness replaces it.** Normalising the leading back to the app's 1.45 kills the page.
3. **Feedback panel** — one textarea, an optional email, one button. §7 allows one email **or** one form; this is the form. **Export and deletion must never route through it.** It carries a line telling people not to paste grades, scores, or anything about a patient.
4. **Independence disclaimer sits in the body**, under the prose, not only in the footer (§6.1).
5. **Two links only — LinkedIn and email** (confirmed Andy, Aug 2026). TikTok and Instagram were in the reference and are **cut**; do not re-add them.
   - `https://www.linkedin.com/in/andy-quach-273bbb349/` — `target="_blank"` with `rel="noopener noreferrer"`.
   - `mailto:elephon08@gmail.com` — the same address the Contact section uses.
   - **The icon squares are real `<a>` elements**, not styled spans. They are links, so they must be focusable and keyboard-activatable.
   - **⚠ Worth Andy's decision before launch:** `elephon08@gmail.com` is a personal address published on a public page, which means scraping and spam. **A forwarding alias on the eventual domain (`hello@…`) is the normal fix**, and the address on the page then doesn't change if he stops using that inbox.

### The copy is Andy's, verbatim except for three mechanical edits

**Do not rewrite his voice.** Do not smooth *"my noob self"*, do not remove the exclamation marks, do not make it sound like a company. The whole value of this page is that it doesn't.

| Edit | From | To | Why |
|---|---|---|---|
| 1 | *"I (and other peers) was tracking"* | *"I was tracking … and so were a lot of my peers"* | Subject-verb agreement. The parenthetical couldn't be made to agree without rewording. |
| 2 | *"My noob self been the only developer"* | *"My noob self **has** been"* | Missing auxiliary. |
| 3 | *"but I figured using all of these apps felt a bit convoluted"* | *"but using all of these apps felt a bit convoluted"* | *"I figured"* appears twice in two sentences; dropped the second. |

**Andy can revert any of the three** — they're listed here precisely so they're visible rather than silently absorbed.

## Pricing — a coming-soon page, and honest about why

**RULED Aug 2026.** Andy: *"I don't know if we can write it all out right now because there are still some features that need to be checked out… just do a coming soon tab. Just title it something funny: 'It's free for now, don't worry' type thing."*

**The nav item is real and routes here — a dead button is a defect.** The page itself is short and says there is nothing to buy, plus *why* there's no number yet.

**Title:** *Pricing / It's free for now, don't worry.* — in the two-weight headline format, so it matches the rest of the site rather than reading as an apology.

**Banned, and this is the part that matters:**

- **Plan cards, tiers, comparison tables, or any number that isn't real.** A fake tier table on a beta is the fastest way to lose the honesty the rest of this page group is built on.
- "Coming soon" pricing, a paid-tier waitlist, or any control that could read as a purchase.
- **Do not let this page grow.** It stays this short until a measured price exists.

**Four commitments it does carry**, all from §5.4:

- **Your records are never paywalled.** Stop paying and you keep everything, and can still export it.
- **Export and deletion stay free and self-serve**, and never require emailing anyone.
- **Any paid tier states its cap.** "Unlimited AI" at a student price is a promise nobody can keep.
- **No ads, no affiliate links, no sponsored placement**, either side of a paywall. Free options named first.

### Cost estimate as of Aug 2026 — for whoever prices this later

**Rates verified Aug 2026 and they will move. Re-check before using any of this.** Claude Haiku 4.5 is $1/$5 per million input/output tokens; Sonnet 5 is $3/$15 standard. Prompt caching bills cached input at 10%, which matters a lot here because HQ resends the same student record on nearly every call.

Modelled monthly volume for a **heavy** user — lecture-transcript analysis, M2M drill generation, Advisor chat, gap reports and study guides, with **on-device transcription so audio costs $0**:

| | Input | Output | Haiku 4.5 | Sonnet 5 |
|---|---|---|---|---|
| **Heavy user** | ~580k | ~70k | **~$0.95** | **~$2.80** |
| **Typical user** | ~150k | ~18k | **~$0.25** | **~$0.75** |

**Caching plausibly cuts input cost 40–60% again**, so the realistic floor is well under a dollar for most users.

**Two observations worth acting on:**

1. **`05` §5.2's "$3–5/month per heavy user" looks conservative at current rates.** Update it rather than pricing against a stale number.
2. **Stripe's fee, not inference, is what sets the floor.** At $4/month the fee is roughly $0.42, about 10.5%; at $9 it's ~6.5%. **Below about $5 the payment processor takes a bigger share than the AI does**, which argues for one honest tier rather than a cheap one.

**Candidate values, for argument only:** **$5/month** covers a heavy user with roughly 5× margin after fees. **$9/month** is the version that funds a genuinely generous cap. **Neither goes on the page until a term has been measured.**

## Privacy — what makes it different from a template

- **A table of what leaves the device, with the local-only alternative for each.** That is the part people want and the part most policies bury.
- **On-device transcription is called out separately.** It is simultaneously the largest cost decision in the product (§5.2: ~$18/mo → $0) and the strongest privacy claim HQ can make.
- **Three named processors** — Supabase, the AI provider, the transcription provider — each with what it receives.
- **"No third-party analytics" is stated plainly**, along with the fact that usage instrumentation is local and user-owned. It's unusual and worth saying.
- **Shared syllabus parses are described as structurally incapable of carrying personal data**, not as a promise about care.

## Terms — the two clauses that matter most

- **"Numbers are estimates."** GPA, BCPM, projections, readiness and score bands are all computed from user input and from rules that change between cycles. **This is the clause that keeps HQ from being treated as authoritative**, and it also appears wherever a derived number is displayed, not only here.
- **User owns their content; HQ takes only the licence needed to operate, and it ends on deletion.**

Plus: beta status and no uptime guarantee · acceptable use with the provenance rules (§6.6) named specifically · Canvas is read-only permanently and **no answer-sharing integration will ever exist** · community content is dated opinion · liability limits.

## Do not

- Do not paste a generic policy template. Every claim on the Privacy page must be checkable against the spec, and a claim HQ cannot keep is worse than no page.
- Do not drop the plain-English strips to "tighten" the pages.
- Do not add plan cards, tiers, or any purchasable control to Pricing.
- Do not ship a nav item that goes nowhere.
- Do not put glass below the title band.
- Do not let the About page drift into third-person company voice.

## One shared component to actually share

`.hl` / `.l1` / `.l2` — the two-weight headline — **is the same recipe in both public mockups and must stay in sync.** It was missing from this file for one pass and every title on all four pages rendered as plain body text. **In the real build it is one component, not two copies.** If a title here ever looks unstyled, this is the reason.

## Shipped Aug 2026 — three deviations from this file, all accepted

Recorded so the next reader doesn't "fix" the code back to the drawing.

| Mockup says | Shipped | Why it's right |
|---|---|---|
| Footer carries a `Changelog` link | **Dropped** | The changelog is a section *inside* Privacy and Terms. A footer entry would be a nav item that goes nowhere, which this page group explicitly bans. |
| Feedback form posts somewhere | **Opens a mail compose** | There is no server endpoint yet. **A button that silently discards what someone typed is worse than an obvious mailto**, and the note under it says what will happen. |
| Guided tour shows real screenshots | **Labelled placeholders** | The brief forbids illustrations and blurred fakes, and real captures did not exist at build time. **This is the one unmet acceptance item.** Four callouts per tab are positioned and waiting; **the coordinates need redoing once the real shots are taken.** |

## Open — blockers for publishing, not for designing (§10)

| Item | Why it blocks |
|---|---|
| **Age floor** | Terms must state one |
| **Governing law** | Terms needs a jurisdiction |
| **`Premed HQ` trademark + domain check** | Flagged in §6.1 and still unresolved. **Do not print the name on legal pages as a settled brand until this is done.** |

## Note recorded here because it surfaced during this pass

**§6.1 forbids ram or Rameses imagery**, and states that root `CLAUDE.md`'s *"Ram mascot"* line is **stale**. A guided-tour mascot was drafted as a ram and **corrected to a Ghibli-adjacent doctor character** — which is also what Andy actually asked for (*"little doctor ghibli"*). **Root `CLAUDE.md` still carries the stale ram line and should be fixed at the source**, or this will be re-litigated every time someone reads it.
