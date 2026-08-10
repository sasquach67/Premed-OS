# P1 — finishing the build

`67155de` shipped the seven routes. This file closes what was left open. **Two of the three items are already done in the working tree; the third needs your machine.**

---

## 1 · Done in the working tree, needs your build + commit

**Sign-out and re-running the flow.** Sign-out already existed (sidebar account menu, Settings), but the front door is a one-way trip: `hasEnteredApp()` returns true for any browser that has ever stored HQ data, so `/` shows the dashboard permanently and the landing, auth and merge screens become unreachable in the browser you actually use.

| File | Change |
|---|---|
| `src/lib/publicLayer.ts` | `resetPublicMeta()` clears **only** the two convenience flags. `hasPreExistingData()` so the UI can tell the truth about the edge case. Nothing touches the store, the session, or anything typed. |
| `src/components/public/RootRoute.tsx` | `LandingRoute` — renders the landing page unconditionally. |
| `src/App.tsx` | `/landing` route. **Not a dev backdoor** — it is the URL any "what is this?" link should point at. |
| `src/pages/Settings.tsx` | A **Front door** block beside Sign out: *View the landing page* and *Reset the front door*, with an honest note that a pre-existing browser still needs the direct link. |

**`npx tsc --noEmit` passes clean.** `npm run build` and `npm run test` **could not be run** where these edits were made — `node_modules` holds macOS native binaries (`rolldown-binding.darwin-*`) and the sandbox is Linux, so rolldown fails to load. **Nothing was committed for that reason.**

```bash
npm run build          # must pass
npm run test           # 27 files / 212 tests in src/; Atlas/ failures are pre-existing
git add -A
git commit -m "feat(public): reachable front door — /landing and a reset control"
```

**Then check the flow end to end**, which is the thing that was impossible before:

1. Settings → Cloud sync & login → **Reset the front door**
2. Open `/` — the landing page, not the dashboard
3. `Start tracking` → dashboard. Reset again, then `Sign in` → `/auth`
4. Sign in with local work present → the merge screen appears **once**
5. Sign out from the sidebar account menu, sign back in → **no second merge prompt**

## 2 · Done in the docs — the three flags from the build report

**The ram is fixed at the source**, which is what stops it being re-litigated:

- Root `CLAUDE.md` no longer says *"Ram mascot"*. It says the mascot is **not a ram**, cites §6.1, and names `src/components/mascot/Ram.tsx` + `/art/mascot.gif` as **the thing to replace**.
- `05-public-and-account.md` §6.1's *"Confirmed July 2026: none exists"* was **wrong** and is now marked as a correction. The asset is live in the app today; the P1 build correctly kept it off the public layer.

**The About headline conflict is resolved in favour of the decisions file.** The brief said *"the person who built it"*; the mockup and decisions file said *"the creator."* **Copy is the decisions file's job** — the brief was wrong and has been corrected. The shipped code is right.

**The three deviations are recorded** in `public-legal-about-pricing.md` so nobody "fixes" the code back to the drawing: the dropped `Changelog` footer link, the mailto feedback form, and the tour placeholders.

## 3 · Not done, and it needs the app running — the guided-tour screenshots

**This is the one unmet acceptance item.** The brief requires real captures with demo data and forbids illustrations, device frames and blurred fakes. Placeholders shipped instead of a fake, which was the right call.

**What has to happen:**

1. `npm run dev`, seed a workspace that looks like a real term — **the demo data is realistic, so use it rather than staging something prettier.**
2. Capture **Overview, Academics, MCAT, Clinical** at a consistent width. **One width for all four**, or the callout coordinates won't transfer.
3. Compress and add them as responsive images. **An unoptimised set of four full-size captures will wreck the page's load time**, which is the whole reason the hero doesn't carry one.
4. **Re-position the four callouts per tab.** Coordinates are per-screenshot and the current ones point at placeholders. This is the fiddly part and there is no way around it.
5. Confirm the demo-data line still sits under the tour. **A landing page showing a populated dashboard has to say the workspace starts empty**, or the first real session reads as a bug.

**Until this is done the landing page is buildable and demo-able but not launch-ready** — the tour is the section that proves the product exists.

## 4 · Still open, unchanged

**Publishing blockers** (`05` §10): age floor, governing law, and the `Premed HQ` trademark + domain check. **Built is not publishable.** The domain question is the same decision as the contact-email alias.

**Privacy and Terms prose.** Structured, summarised in plain English, and legally empty underneath. The pages build fine without it; they cannot publish without it.

**`useCloudSync.ts:135`.** The build report notes `reconcile` is newest-wins — the "last write wins" §0.2 forbids — and that it was gated rather than rewritten. **The gate is correct for now, but the underlying reconcile is still wrong** and will matter the first time two devices disagree. Worth its own chunk.
