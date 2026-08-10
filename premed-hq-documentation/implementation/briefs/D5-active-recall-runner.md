# D5 brief — Active recall session runner

**Read ONLY this file plus the references in §7.** Global rules are in the repo's `CLAUDE.md`.
**If something you need isn't here, read the named spec section and tell me the brief was incomplete.**

---

## 1. Goal

The full-screen focus surface that runs when the user hits `Start review` (class page / Class Center queue) or `Recall` on a topic.

## 2. ONE mode — "Active recall"

There is **one** mode. An earlier three-mode split (quick recall / blurting / Feynman) was **removed** — they are one act at different depths. **Do not build a mode switcher.**

## 3. ONE composer, three input affordances

**Mic (default) · keyboard · image attach** — usable together or alone. The primary path is narrating while drawing: speak, then attach a photo of the page. Image attach stays available **at any point, including after speaking**.

**Do not build video analysis** (cost/latency) — audio transcript + the final image is the intended solution.

## 4. The loop

1. **Cue with stated scope.** The prompt names what to cover — scope chips (`substrate · nucleophile · solvent · stereochemistry`). **Those chips ARE the grading checklist**; the user is never marked down for something not asked for.
2. **Respond** via the composer.
3. **Confidence before reveal** — `No idea / Shaky / Pretty sure / Know it cold`. Plain language, not a 1–5 scale. Captured **before** anything is shown.
4. **Gap report** (§5).
5. **Self-grade** `Again / Hard / Good / Easy` (`ts-fsrs`), **with intervals shown** (`<10 min · 2d · 5d · 12d`). Keyboard: space reveals, 1–4 grade, N skips.

## 5. Output is a GAP REPORT, not a notes dump (locked)

Revealing full notes teaches nothing. Show only **what you had · what you missed · what you got wrong**.

- **Every gap item carries clickable provenance:** blue chip = **"from your materials"** → opens the file at the cited passage, **highlighted** (Anthropic Citations returns character offsets); amber chip = **"general knowledge — not in your notes."** Never blend the two silently.
- **"Second opinion"** available per-claim, on demand — never run by default.

## 6. Calibration, session shell, and Anki

- **Calibration is deterministic** (predicted confidence vs actual grade) and works with **no API**. The summary leads with it: *"Overconfident on 2 of 9 — you said Pretty sure, then graded both Again."*
- **Session start:** scenic background + veil, **`9 topics up`** (numeral, not a word), the **full comprehensive queue** with faint hairline dividers and `Weak` / `Never reviewed` tags, `+ N more due`, wide primary **Start active recall** with mic/settings squares, preferences line. **No panel container, no giant orphan numeral.**
- **Scene runs full-strength on start and summary; dims hard behind reading states** so legibility never fights the art.
- **Anki is decoupled** — no sync chips, no "reviewed in Anki", no scheduler field. Every topic is HQ-scheduled.
- One `MascotNote` per session surface.

## 7. References — these only

- `specifications/mockups/01-academics/academics-review-session.html` — **this chunk's mockup. Read it for layout and composition** (panel arrangement, proportions, what sits beside what). Ignore its inline CSS except where `_visual-recipes.md` confirms a value. **Rebuild from library components — never copy the markup.**
- `specifications/mockups/_shared/_visual-recipes.md` — **exact visual values** (banner gradient, glass recipe, underline glow, card hover, focus rule). Use these literally; do not approximate.
- `specifications/mockups/01-academics/academics-review-session.md`
- `tabs/01-academics.md` **§4.1-J only**

## 8. Components to reuse

`dialog`/full-screen route · `progress` (session spine) · `toggle-group` (confidence) · `button` · `badge` · `textarea` (typed input) · `sonner` · `tooltip` · existing `MascotNote`. Audio capture + image attach: use existing upload utilities; do not add dependencies without flagging.

## 9. Done when

- [ ] One mode; no mode switcher anywhere.
- [ ] Composer accepts voice, text, and image, combinable in one response.
- [ ] Scope chips shown **before** responding and used as the grading checklist.
- [ ] Confidence captured before reveal; calibration computed deterministically and surfaced in the summary.
- [ ] Gap report only — never a full notes dump; every item has a provenance chip; source chips open the file at the highlighted passage.
- [ ] Grade buttons show intervals; keyboard shortcuts work.
- [ ] Scene full-strength on start/summary, dimmed behind reading states.
- [ ] **Entire loop works with no API key** except the AI gap-check (FSRS, calibration, scheduling, summary all deterministic).
- [ ] AA light + dark; keyboard + focus + reduced-motion; `npm run build` passes.

## Commit (required)

`npm run build` must pass, then **commit before reporting**: `feat(academics): active recall session runner`.
If unrelated pre-existing changes are in the working tree, commit them **separately** with their own message — never bundled into this chunk.

## 10. Report

Diff summary only. No full-file dumps.
