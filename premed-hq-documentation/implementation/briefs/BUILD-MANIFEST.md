# Build manifest — what Claude Code is allowed to implement

**THIS FILE IS THE GATE. Nothing gets built unless it says `YES` in the `Build?` column.**

**Created Aug 2026.** Andy: *"I haven't officially cleared most of them and I wanna make sure it doesn't do ALL the mockups, but only the ones I've cleared."*

---

## The rule, stated for whoever reads this next

> **A mockup's own header status is NOT permission to build.**
>
> `APPROVED` in a file header means **the drawing was approved as a design.** It says nothing about whether the app should be changed to match it today. **Those are two separate decisions and the folder cannot tell them apart.**
>
> **`Build?` in this table is the only authority.** Default is `NO`. Only Andy changes a row to `YES`.

**Every prompt in `MOCKUP-TO-CODE-PROMPT-SEQUENCE.md` reads this file first and builds only `YES` rows.** A prompt that names a mockup not cleared here is a bug in the prompt, not permission.

---

## The manifest

**Andy: change `NO` → `YES` on anything you want built. Leave the rest.**

> ### CLEARED Aug 2026 — Overview + Academics & GPA, everything in them
>
> Andy: *"these sections specifically, and ONLY these for now"* → **everything in those two sections regardless of status.**
>
> **12 rows are `YES`.** Shell (calendar, Sauce), Clinical, MCAT, and Volunteering **remain blocked** and are not part of this pass.
>
> **Two things this means, recorded so nobody is surprised later:**
> - **7 of the 12 are PROPOSED or PROTOTYPE**, not APPROVED. **They are cleared to build, but the design is not frozen** — if a drawing changes, the code follows it. That is an accepted cost, not an oversight.
> - **The lab's nav is more authoritative on status than the file headers.** `academics-empty-states-prototype.html` and `academics-planner-prototype.html` carry **no status line at all** in their own source, and `variant-lab.html` labels both **PROTOTYPE**. **When they disagree, trust the lab.** Worth backfilling the headers so the files stop lying.

### Overview

| Mockup | Header status | Build? |
|---|---|---|
| `03-overview/overview-bento-control-panel.html` | APPROVED (July 2026) | **`YES`** |
| `03-overview/overview-where-i-stand-expandable.html` | PROPOSED (Aug 2026) | `NO` |
| `03-overview/sauce-two-doors.html` | DRAFT | `NO` |

### Landing & auth

> **CLEARED Aug 2026 (Andy).** Both public-layer mockups are cleared to build via `P1-public-landing-auth.md`.
>
> **Two conditions, and they are not optional:**
> 1. **The design is PROPOSED, not frozen.** If a drawing changes, the code follows it. Accepted cost, same as the Overview/Academics rows.
> 2. **Cleared to BUILD is not cleared to PUBLISH.** The age floor, governing law, and the `Premed OS` trademark/domain check (`05` §10) are still open. **Build the pages; do not point a public domain at Privacy, Terms, or About until those three close.**


| Mockup | Header status | Build? |
|---|---|---|
| `05-public/public-landing-and-auth.html` | PROPOSED (Aug 2026) | **`YES`** |
| `05-public/public-legal-about-pricing.html` | PROPOSED (Aug 2026) | **`YES`** |

### Shell

| Mockup | Header status | Build? |
|---|---|---|
| `00-shell/shell-calendar-overlay.html` | **none** | `NO` |
| `00-shell/shell-calendar-sequence.html` | **none** | `NO` |
| `00-shell/sauce-dropdown.html` | DRAFT | `NO` |
| `_shared/nav-hierarchy-3-levels.html` | APPROVED (Option A, July 2026) | **`YES`** |
| `_shared/mascot-note-pattern.html` | APPROVED (July 2026) | **`YES`** |

### Academics · Daily

| Mockup | Header status | Build? |
|---|---|---|
| `01-academics/academics-daily-main-page.html` | APPROVED (July 2026) | **`YES`** |
| `01-academics/academics-assignments.html` | APPROVED (July 2026) | **`YES`** |
| `01-academics/academics-class-hub.html` | APPROVED (July 2026, revised) | **`YES`** |
| `01-academics/academics-review-session.html` | APPROVED (July 2026) | **`YES`** |
| `01-academics/academics-empty-states-prototype.html` | **none** | **`YES`** |
| `01-academics/academics-class-types.html` | **none** | **`YES`** |
| `01-academics/academics-mode-switch.html` | **none** (concept) | `NO` |
| `01-academics/class-center-study-hub.html` | **none** (concept) | `NO` |
| `01-academics/academics-exam-prep-mode.html` | PROPOSED (July 2026) | **`YES`** |
| `01-academics/academics-syllabus-import.html` | PROPOSED (July 2026) | **`YES`** |

### Academics · Planning

| Mockup | Header status | Build? |
|---|---|---|
| `01-academics/academics-planner-prototype.html` | **none** | **`YES`** |
| `01-academics/academics-requirements.html` | PROPOSED (Aug 2026) | **`YES`** |
| `01-academics/academics-grades-archive.html` | PROPOSED (Aug 2026) | **`YES`** |

### Clinical

| Mockup | Header status | Build? |
|---|---|---|
| `04-clinical/clinical-subtabs.html` | PROPOSED (Aug 2026) | `NO` |
| `04-clinical/clinical-role-typeahead.html` | PROPOSED (Aug 2026) | `NO` |
| `04-clinical/clinical-credentials.html` | PROPOSED (Aug 2026) | `NO` |
| `04-clinical/clinical-hour-target.html` | PROPOSED (Aug 2026) | `NO` |
| `04-clinical/clinical-hours-chart.html` | PROPOSED (Aug 2026) | `NO` |
| `04-clinical/clinical-scope-recall.html` | PROPOSED (Aug 2026) | `NO` |

### MCAT

| Mockup | Header status | Build? |
|---|---|---|
| `02-mcat/mcat-bookshelf.html` | **none** | `NO` |
| `02-mcat/mcat-plan.html` | **none** (concept) | `NO` |
| `02-mcat/mcat-section-aware-drills.html` | **none** | `NO` |

### Volunteering

| Mockup | Header status | Build? |
|---|---|---|
| `05-volunteering/volunteering-standing-vs-events.html` | DRAFT (Aug 2026) | `NO` |

---

## Permanently blocked — never build, do not ask again

**These are not awaiting a decision. The decision was made.**

| Mockup | Why |
|---|---|
| `07-campus/illustrated-campus.html` | **REJECTED.** The campus surface was killed — `07-campus-layer-board.md` §2d. Andy: *"while it is nice to see, I just don't know the practical use of it."* Kept because frame 2's detail panel is still the reference for `PlaceLine` |
| `_shared/hours-map.html` | **REJECTED (Aug 2026).** Header says *"Do not build."* |
| `04-clinical/clinical-pillar.html` | **SUPERSEDED.** An earlier direction, kept only as a record |
| `04-clinical/clinical-role-presets.html` | **PARTIALLY SUPERSEDED** by `clinical-role-typeahead.html`. **Build the typeahead, never the presets** |
| `11-timeline/timeline-spine.html` | **DRAFT and explicitly not cleared.** Andy: *"not quite approved and ready for the mockup lab — it's still got design flaws"* |

---

## No mockup exists — do not build these from the spec alone

**Extracurriculars · Shadowing · Research · Volunteering (the pillar itself) · Letters · Essays & Story Bank · School List · Timeline · Profile/CV · Help · Settings · Atlas · Campus / event prospecting**

**The lab's own honesty rule applies:** a named direction in `PLACEHOLDER_DIRECTIONS` is not a design, and the dashed *"Direction only · not yet drawn"* block exists so nobody mistakes one for the other.

**Extracurriculars is the sharpest case.** Its spec is ~300 lines and 30 items deep after the Aug 2026 migration, **and not one of them has been drawn.** A prompt saying *"implement Extracurriculars per the spec"* would produce thirty undesigned surfaces. **That is a design job first.**

---

## When a row flips to `YES`

1. **Say which variant.** The lab holds A/B/C for most views and **A is the default** (*"A should preserve the strongest approved or currently authored direction"*). If it is not A, write the letter in the row.
2. **Say which product views**, if the mockup declares several. Class Hub alone has five.
3. **Then run the matching prompt** from `MOCKUP-TO-CODE-PROMPT-SEQUENCE.md`, which will re-read this file and refuse anything still `NO`.
