# Decisions — Class types (STEM · Writing · General)

**Mockup:** `specifications/mockups/01-academics/academics-class-types.html`
**Spec:** `tabs/01-academics.md` §4.1-N (types), §3.3 (`ClassWorkspace.type`, Writing entities), §6 #57–59
**Exact visual values:** `decisions/_visual-recipes.md` — use literally, do not approximate.

The mockup shows CHEM 261 (STEM) and ENGL 105 (Writing) side by side, plus the three class-card variants and the unified daily list.

---

## The point of the mockup

**Writing must read as an equal, not a downgrade.** Both pages have the same panel count, the same density, the same banner and stat strip. Writing has *different* features, never *fewer* — no greyed-out panels, no "0 topics ready", no empty shells.

If a build makes the Writing page look emptier than the STEM page, the build is wrong even if every listed requirement passes.

## Locked

1. **Exactly three types** — `stem` · `writing` · `general`. A five-type taxonomy and a per-feature toggle checklist were both proposed and **rejected** (July 2026). Do not reintroduce; do not add a fourth.
2. **One banner, one page structure.** Breadcrumb · dot + code + name · info line · glass stat strip · one primary action · `⋯`. Identical in every type.
3. **Overview · Materials · Assignments · Notes exist in STEM and Writing and behave identically.**
4. **Only two things differ between types:**

   | Type | Third sub-tab | Primary action |
   |---|---|---|
   | STEM | **Topics** | `Start review` |
   | Writing | **Readings** | `Open current draft` |
   | General | *(none — four tabs)* | `Add a grade` |

5. **Stat strip contents are per-type** but the component is identical — STEM: grade · ready · due today · exam countdown. Writing: grade · next due · draft stage · readings behind. General: grade · next deadline · credits.
6. **Class cards: same shell, one differing signal line, NO type badge.** The signal line already says what kind of class it is; a badge would label the student rather than the work.
7. **"What's due today" is ordered by urgency across all classes, never grouped by type.** Each row carries its own verb chip — `Recall` · `Draft` · `Read` · `Log` — so the work type is legible without naming the type.
8. **Type is a view concern only.** GPA, BCPM, requirement audit, Planner, Overview must contain **zero reads of `type`**.

## Writing-specific surfaces (build these, they are the substitute layer)

- **Draft rail** — Outline → Draft → Revision → Submitted as pips on a connector line. Completed pips filled `--success` with a check; current pip ringed in `--cat` with a 4px halo. **The student's own target date is shown separately from the professor's deadline** — "2 days late" in the mockup refers to the self-set draft date, not the submission date. That distinction is the entire value of the feature; do not collapse them into one date.
- **Readings** — per-reading status chips (Read `--success` / Skimmed `--warning` / Not started `--danger`) plus a term-long dot strip. Footer states debt in plain language.
- **"What keeps coming back"** (`FeedbackNote`) — themes across graded papers with the professor's actual quote, a paper count chip, and which papers it came from. **Only surfaces once a theme repeats**; a single note is never shown as a theme.
- **Pace chip** uses the standard recipe; warning variant for the late-draft line.

## Degradation — the most likely Writing failure

Readings frequently aren't parseable (table-as-image, "posted weekly on Sakai", LMS-only lists). See §4.1-N:

- Never render an empty Readings tab as if parsing succeeded — say what happened.
- Three first-class entry paths: paste a list, add inline as assigned, add this week's.
- **Reading debt is suppressed entirely without a complete list** — no denominator, no number. It returns when the list completes.
- A Writing class with legitimately no readings is valid and must not imply something is missing.

## Do not

- Do not add a type badge to class cards.
- Do not group the daily list by class type.
- Do not give Writing a forgetting curve, topic list, exam scope, or recall runner.
- Do not give General any study layer at all.
- Do not build separate page components per type — one page, three configurations.
- Do not compute a blended cross-type "readiness" number. It doesn't exist (§6.12: no false precision).

## Behaviour

- `stem`, `writing`, and `general` configure one class workspace; switching
  type never deletes dormant data and never changes GPA, BCPM, credits, or
  requirement logic. No calculation may read `type`.
- Shared tabs and owner actions retain their behavior. The substituted third
  surface is Topics/Start review for STEM, Readings/Open current draft for
  Writing, and absent for General; General retains only its legitimate grade
  action.
- A partial reading list offers paste, inline add, and this-week entry. Until
  that list is complete, reading debt has no denominator and is not rendered.

## Appearance

- Every type inherits the same class banner, stat-strip footprint, tab edge,
  panel count, and warm-dark surface ladder. Writing is equal density to STEM,
  never a greyed-out or hollow substitute; General removes inapplicable study
  machinery rather than rendering zeros.
- The type-specific signal is content in the shared geometry: a draft rail and
  readings state for Writing, topic/review state for STEM, and factual grade
  context for General. There is no type badge on the card or daily list.
- Use solid panels and rows with the shared radii/borders; only the banner stat
  strip is glass. Draft-pip and status changes use color/background feedback
  at the shared quiet timing, keyboard focus is `:focus-visible`, and reduced
  motion resolves the state without rail/pip travel. On narrow screens rails
  and supporting columns stack under the same banner without clipping tabs.
