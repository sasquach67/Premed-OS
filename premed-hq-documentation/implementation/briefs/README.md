# Implementation briefs — index and order

Each brief is a **self-contained chunk**: hand Codex one brief, it reads only that file plus the references listed inside it. This keeps context small and precise. The trade-off is coverage — which is why **every brief carries the line "if something you need isn't here, read the named spec section and tell me the brief was incomplete,"** and why `FINAL-audit.md` does one wide read at the end.

**Source of truth is always `tabs/*.md` and `architecture/*.md`.** A brief is a pointer, never a replacement. Where a brief and the spec disagree, the spec wins and the brief is wrong.

## Order

| # | Brief | Builds | Depends on |
|---|---|---|---|
| DX | `DX-demo-data.md` | Site-wide demo data | none — **run early**, every later chunk is easier to verify against populated screens |
| D2 | `D2-class-center.md` | Class Center | — |
| D3 | `D3-assignments.md` | Assignments | D2 |
| D4 | `D4-class-page.md` | Class page, five sub-tabs | D2 |
| D5 | `D5-active-recall-runner.md` | Active recall session runner | D4 |
| D6 | `D6-ai-and-coverage.md` | AI layer + coverage ledger (**wide read**) | D4, D5 |
| D7 | `D7-remediation.md` | Audit remediation | D2–D6 |
| D8 | `D8-class-types.md` | Class types — STEM · Writing · General | **D4** |
| P1 | `P1-public-landing-auth.md` · prompt: `P1-BUILD-PROMPT.md` · **remaining work: `P1-FINISH.md`** | Public layer — landing, auth, merge, About, Privacy, Terms, Pricing | **SHIPPED `67155de`.** **Guided-tour screenshots still outstanding** (see P2 §7); publishing blocked on `05` §10 |
| P2 | `P2-landing-restructure.md` | **Landing restructure** — one-pass stylesheet, nav placement, wordmark, hero scale, footer | **P1.** Ready to build |
| — | `FINAL-audit.md` | One wide audit across everything | all |

**Not yet written** (spec exists, brief does not): syllabus ingestion (§4.1-M — **the keystone; most other features are decorative without it**), the grade ledger (§6.8), lifecycle/amnesty (§6.10), the attention budget (§6.11), the term-column Planner (§4.2-C1), the course→requirement catalog dataset.

## Every brief carries these

- Read-only-this-file header, and permission to flag an incomplete brief
- **Its own mockup** in the references — plus `decisions/_visual-recipes.md` for exact values, used **literally, never approximated**. (Removing mockups from briefs once caused a recurring visual-fidelity gap. Don't do it again.)
- Components to reuse, so nothing gets forked
- A `Done when` checklist
- A required commit message, and the rule that unrelated working-tree changes commit separately

## Reference

- `tabs/01-academics-feature-catalog.md` — all 77 Academics features with what each does, what the student sees, and the cross-cutting dependency table. **Readable index, not spec** — `tabs/01-academics.md` §6 wins on any conflict.

## Mockup workflow (STANDING RULE — Andy, July 2026)

**Every mockup must be wired into the chain before it counts as done.** A mockup nobody's brief points at is a mockup Codex will never see, which is exactly how the recurring visual-fidelity gap happened.

**The chain, and all four links are required:**

```
mockup .html/.png  →  <same-folder>/<same-name>.md  →  named in a brief's §References  →  built
```

**Process:**

1. **Mockup is produced in conversation.** Andy reviews it there first.
2. **On his go-ahead it moves into `specifications/mockups/` immediately** — same turn, not later. **Always ask before filing one.**
3. **A `<same-name>.md` is written alongside it in the same per-tab folder** (`00-shell/`, `01-academics/`, `02-mcat/`, … shared assets in `_shared/`) — what's locked, what's rejected, and a `Do not` list. The decisions file is what a brief cites; the HTML is what it looks at.
4. **The table below is updated** so the mockup has a brief.
5. **Any prompt or brief touching that surface names the mockup file explicitly** — never "see the mockups folder". Codex reads only what it's pointed at.

**In every brief that has a mockup, the reference reads:**

> `specifications/mockups/<file>.html` — **this chunk's mockup. Read it for layout and composition.** Ignore its inline CSS except where `_visual-recipes.md` confirms a value. **Rebuild from library components — never copy the markup.**

**A surface with no mockup says so in its brief**, so nobody assumes one exists.

## Mockups ↔ decisions ↔ briefs

| Mockup | Decisions file | Brief |
|---|---|---|
| `academics-daily-main-page.html` | `decisions/academics-daily-main-page.md` | D2 |
| `academics-assignments.html` | `decisions/academics-assignments.md` | D3 |
| `academics-class-hub.html` | `decisions/academics-class-hub.md` | D4 |
| `academics-review-session.html` | `decisions/academics-review-session.md` | D5 |
| `academics-class-types.html` | `decisions/academics-class-types.md` | **D8** |
| `mcat-section-aware-drills.html` | `decisions/mcat-section-aware-drills.md` | *MCAT chunk — not yet written* |
| `mcat-bookshelf.html` | `decisions/mcat-bookshelf.md` | *MCAT chunk — not yet written* |
| `mcat-plan.html` | *needs one* | *MCAT chunk — not yet written* |
| `00-shell/shell-calendar-sequence.html` + `shell-calendar-overlay.html` | `00-shell/shell-calendar-overlay.md` | *shell chunk — not yet written* |
| `05-public/public-landing-and-auth.html` | `05-public/public-landing-and-auth.md` | **P1** |
| `05-public/public-landing-v2.html` | `05-public/public-landing-v2.md` | **P2** — supersedes the P1 mockup for the **nav, hero, tile interior and footer only**; P1's remains the source for `/auth`, `/auth/merge` and page order |
| `05-public/public-legal-about-pricing.html` | `05-public/public-legal-about-pricing.md` | **P1** |
| `academics-nav-hierarchy.html` | `decisions/academics-nav-hierarchy.md` | shell/global |
| — | `decisions/_visual-recipes.md` | **all of them** |
