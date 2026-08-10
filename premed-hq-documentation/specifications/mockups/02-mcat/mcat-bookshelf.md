# Decisions — The Bookshelf

**Mockup:** `specifications/mockups/02-mcat/mcat-bookshelf.html`
**Spec:** `tabs/02-mcat.md` §3.10 (Bookshelf), §7 (resource bank), §3.3-B (phases)
**Exact visual values:** `decisions/_visual-recipes.md` — used literally. MCAT accent = `--mcat`.

Lives **inside the Content sub-tab**, alongside Content mastery. **Not a new tab.**

---

## The point of the mockup

**A shelf that opens as a grid of logos is a storefront.** The hero answers *"what should I use right now"* with **one recommendation and one link**; the shelf below is for browsing, not deciding.

## Locked

1. **Four regions, in this order:** hero (one recommendation) · attention (≤2 lines) · shelf (grouped by purpose) · gap notice.
2. **Hero = one recommendation, one reason, one `Open`.** Derived from **the block already scheduled today**. External resources open externally (`integration-map` §0 tier 3 — deep link, don't embed).
3. **REJECTED — do not build:** `First pass` / `Refresher` role labels · estimated durations · `Add as warm-up` / session insertion. **Andy: not needed** — the redirect is sufficient; the student knows whether they're learning or brushing up.
4. **If nothing scheduled maps to a resource, the hero says so in one line.** Never manufacture a suggestion.
5. **Expiry tracking is on PAID items only.** Free resources show `Free` and **carry no expiry field at all** — never an empty one, never "n/a". Only `owned` and `trial` enter the subscription tracker.
6. **`lifetime` is a first-class value, not a null date.**
7. **Expiry warnings fire only on a real collision with a planned block** — *"UWorld expires Mar 3, your heaviest practice block is Mar 10 – Apr 18"* — **never as a countdown.** Once, via the attention auction (`01` §6.11).
8. **AAMC burn rate** renders as a bar with used/remaining and time-to-test. Feeds the plan generator so **AAMC schedules late by construction**; the shelf shows `Hold for Polish` rather than nagging.
9. **Shelf grouped by PURPOSE, not price:** Content review · Question banks · Decks · Full-lengths — matching the plan's phases, so the group currently needed is the one highlighted (lit dot).
10. **Decks show as tracked-here, reviewed-in-Anki** (§5h). No card review in HQ.
11. **Full-lengths distinguish `Trend line` (AAMC) from `Directional only` (third-party)** — §3.3-C1.
12. **Gap notice points at coverage holes**, and where possible resolves to something **free** (the mockup points at Pankow, unstarted).

## Money rules — non-negotiable

- **No affiliate links. No sponsored placement. Ever.**
- **`cost` displayed only for items already owned.** No prices on anything the student doesn't have.
- **No "upgrade" affordance anywhere.**
- **Free options lead where they're genuinely competitive** (Khan Academy, Jack Westin dailies, AAMC free material).
- **Recommendations are Category B** — attributed, `verifiedAsOf` dated (`implementation/knowledge-sources.md`).

## Do not

- Do not make this a new tab.
- Do not open as a catalog or logo grid.
- Do not show an expiry field on a free resource.
- Do not warn on expiry without a planned-block collision.
- Do not nudge a purchase, or resolve a gap notice to something the student must buy.
- Do not add role labels, durations, or session insertion to the hero.
