# D2 brief — Nav + Class Center main page

**Read ONLY this file plus the two references named in §6. Do not read the full spec set, and read only THIS chunk's mockup (named in §6) — not the others.**
Global rules are already in the repo's `CLAUDE.md` — do not re-read the docs to restate them.
**If something you need isn't in this brief, read the named spec section and tell me the brief was incomplete.**

---

## 1. Goal

Academics → **Daily mode → Class Center** main page, plus the mode/tab navigation chrome. Extend the existing `src/pages/Academics.tsx` and `src/components/academics/ClassCenter.tsx`. **Do not rebuild — restyle and restructure what exists.**

## 2. Navigation — three levels, three forms (binding)

1. **Mode switch** = glass pill on the banner: `Daily` · `Planning`. Swaps the whole tab set. Persists per user; deep-links `?mode=&tab=`.
2. **Tabs** = underline on the banner edge. Daily shows **2** (Class Center · Assignments). Planning shows **3** (Planner · Requirements · Grades & Archive). Only the active mode's tabs render.
3. **Filters** = solid form controls on a bar below (term `Select`, search `Input`, count, view `Toggle Group`).

**Never** render two adjacent levels in the same visual form. Term picker is a `Select`, **never a pill row**.

## 3. Banner

- Title **"Academics"** only — no group crumb, no subtitle line.
- **Glass stat strip, variable metrics only:** term GPA (▼/▲) · cumulative (▼/▲) · due today · day streak. **Never** credit count or class count (fixed facts don't earn the space).
- Ghost button: **"How to study"** → the always-open study guide.
- Glass appears **only** on the mode pill and stat strip. Everything else is solid.

## 4. Page body — bento (mixed panel sizes; a uniform stack of equal rows is a defect)

| Panel | Span | Notes |
|---|---|---|
| **Heads up** | 12 | Same component as Overview's Smart next actions. 3 recommendations, each: icon, title, one-line *why* with the specific cause bolded, `primary` + `Dismiss`. Dismiss animates out; last dismissal unmounts the widget. |
| **Your classes** | 12 | Class cards, wrapping. See §5. |
| **Today's review queue** | 7 | Rows: class badge · topic · why-due line ("Missed 2 of 3 last quiz · retrievability ~54%") · retrievability bar + % · status badge. Header actions: `Plan 90 min` (ghost) + `Start` (primary). Footer `+N more due`. |
| **Where you're weak** | 5 | **Exam-scoped by default.** Toggle: `Next exam` / `All topics`. Header block = countdown + course + unit range + "N topics in scope". Rows organised **by topic, not class**. Footer "4 of 9 exam-ready" + "Review these →". |
| **Up next** | 7 | Dynamic biggest-thing-on-your-plate (exam / presentation / deliverable): big countdown, title, subtitle with weight, primary `Build exam plan`, exam-ready segment bar with a projection marker, 2 weakest topics, chips for other upcoming items. **One** pace line. |
| **GPA** | 5 | Term / cumulative / science numbers, trend sparkline with dashed projection, "Dragging ← → lifting" contribution rows per class, **one** pace line. `What-if →` link. |
| **Contacts** | 5 | **NEW.** Professors, TAs, study groups, pre-health advisor for this term. Row = avatar · name · `class · role · location` · status chip (`Office hrs Tue 2–4`, `Potential letter`, `Letter requested`) · email action. Uses the **shared `Person` records** — never re-entered per class. |
| **Upcoming** | 4 | Important items first (starred get a left accent + tint). |
| **Mastery trend** | 4 | Topics-ready over time, actual + dashed projection, **one** pace line. |
| **Consistency** | 4 | Day streak + reviews-per-day strip. **No pace line** (streaks never get one). |

Deliberately **absent** — do not add: MCAT content-coverage panel, generic "Due soon" list, floating quick-capture, page-level study-tool panel.

## 4a. "Heads up" recommendation rules (added after D2 gap flag)

Deterministic and explainable (`architecture/02`) — **never AI-generated**. Each states its *specific* cause, offers one primary action + `Dismiss`, and persists dismissal. **Cap at 3**, ranked by urgency. **A rule only fires if its data exists** — degrade silently, never show a placeholder.

| Rule | Fires when | Copy pattern | Primary action |
|---|---|---|---|
| **Science GPA slipping** | a BCPM course's current grade pulls BCPM down by ≥0.02 | "**CHEM 262** at B+ pulls BCPM down .04." | `What-if` |
| **Unscheduled med prereq** | a prereq is in no completed or planned term before the MCAT date | "Last MCAT prereq — take by **Spring 2028**." | `Plan it` |
| **BCPM-heavy term** | a planned term has ≥3 BCPM courses | "**Fall 2027** has 3 science courses planned." | `Rebalance` |
| **Covered but never reviewed** | a unit marked covered has `timesSurfaced = 0` | "**Unit 8** was covered Nov 6 and never reviewed." | `Review it` |
| **No syllabus imported** | an active class has no parsed syllabus (blocks weeks, weights, exam scope) | "**BIOL 252** has no syllabus — weeks and grade weights are unknown." | `Import syllabus` |

## 4b. Data notes (resolved after D2 gap flag)

- **Contacts:** `persons` is empty and `ClassContact` holds duplicated data. Do a **v5 migration** creating/linking canonical `Person` records, under D1's rules: versioned, lossless, idempotent. **Dedupe on normalised name + email.** Same name with a *different* email → **migration review**, never a silent merge. Shipping contacts on duplicated records would recreate exactly the two-parallel-records problem D1 fixed.
- **Review history:** there is no review-event history, so trend and contribution visuals must show an **honest "Not enough history yet"** state — never fabricated data. **But define the `ReviewEvent` record now** (`topicId`, timestamp, grade, confidence) even though D5 populates it. History not captured is history that can never be recovered; waiting means an empty trend line for months after the chart ships.

## 5. Class cards (exact behaviour)

- **At rest:** no left accent bar, neutral border. Class identity = a small coloured dot beside the code.
- **On hover:** left bar ignites in the class accent + border/glow turn accent + card lifts + the deadline line swaps to **"Open class hub →"** + an action row appears (`Review` primary + `⋯` overflow).
- **Hovering the `Review` button leaves the card UNLIT** so the two click targets never compete.
- Contents: code + name, grade + %, status chips (`3 weak`, `BCPM`, `Anki`), **one line** "8 of 18 topics ready" + **one** progress bar, next deadline.
- **One primary action + overflow.** No instructor/meeting clutter. Cards wrap. Ends with a dashed `＋ Add class`.
- Click card (not the button) → **center peek** for that class.

## 6. References — read these two ONLY

- `specifications/mockups/01-academics/academics-daily-main-page.html` — **this chunk's mockup. Read it for layout and composition** (panel arrangement, proportions, what sits beside what). Ignore its inline CSS except where `_visual-recipes.md` confirms a value. **Rebuild from library components — never copy the markup.**
- `specifications/mockups/_shared/_visual-recipes.md` — **exact visual values** (banner gradient, glass recipe, underline glow, card hover, focus rule). Use these literally; do not approximate.
- `specifications/mockups/01-academics/academics-daily-main-page.md` — the decisions this layout encodes.
- `tabs/01-academics.md` **§4.0 through §4.0-e only** (not the whole file).

## 7. Components to reuse (do not invent)

`card.tsx` · `badge.tsx` · `button.tsx` · `select.tsx` · `input.tsx` · `toggle-group.tsx` · `progress.tsx` · `dropdown-menu.tsx` · `context-menu.tsx` (row right-click) · `avatar.tsx` (contacts) · `tooltip.tsx` · `separator.tsx` · `sonner.tsx` (undo toasts) · existing `MascotNote` if present, else defer.

Design tokens, fonts (Baloo 2 + Nunito), and colours come from `src/index.css`. **No new tokens, no new dependencies.**

## 8. Done when

- [ ] Three nav levels render in three distinct forms; mode switch swaps the tab set; mode+tab persist and deep-link.
- [ ] Banner carries title + glass variable-stat strip + How-to-study. No crumb, no subtitle, no credit count.
- [ ] Bento has mixed panel sizes; no uniform stack.
- [ ] Class cards match §5 including the hover pattern and the unlit-on-button-hover rule.
- [ ] Contacts panel present, using shared `Person` records.
- [ ] "Where you're weak" defaults to exam scope and toggles to all topics.
- [ ] At most one pace line per panel; none on Consistency; each dismissible.
- [ ] Empty / loading / error states for every list. AA contrast in light **and** dark. Keyboard + focus + reduced-motion.
- [ ] `npm run build` passes. Signed-out mode still works.

## Commit (required)

`npm run build` must pass, then **commit before reporting**: `feat(academics): nav chrome + class center`.
If unrelated pre-existing changes are in the working tree, commit them **separately** with their own message — never bundled into this chunk.

## 9. Report format

A **diff summary only** — files touched, components reused, and the checklist above with pass/fail. Do not paste full files.
