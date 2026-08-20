# Tab brief generator — paste this, change one word

**Use per tab.** It audits, then writes the brief. It does not build.

**Replace `[TAB]`** with the tab name — `MCAT`, `Clinical`, `School List`, `Essays`, `Letters`, `Timeline`, `Profile/CV`.

---

```
Write the mockup-to-app brief for the [TAB] tab.

Follow mockup-lab/VARIANT-LAB.md → "The workflow — one tab at a time".
Copy the shape of implementation/briefs/T1-academics-classcenter-mockup-to-app.md.

STEP 1 — AUDIT FIRST. Report this before writing anything:

  a) SPEC → PAPER. Read the tab's spec in premed-hq-documentation/tabs/.
     List every RULED feature that has no mockup surface — no button,
     field, state, or screen. That list is what still needs drawing.

  b) MOCKUP → APP. For each mockup: does it exist in src/, and does it
     LOOK like the drawing? Behaviour shipping is not the same as the
     drawing being translated. Say which.

  c) ALREADY BUILT. What must NOT be rebuilt. Cite the commit.

  d) GATE. Does BUILD-MANIFEST.md clear these mockups YES? If not, say
     so — the brief still gets written, but nothing may be built.

  e) DECISIONS FILES. Does each mockup's .md record APPEARANCE, or only
     behaviour? A .md silent on appearance is why the syllabus review
     screen works and looks wrong. Flag every one that's behaviour-only.

  f) ⭐ INTEGRATIONS AND SERVICES THIS TAB'S SURFACES NEED.
     A TAB OWNS EVERYTHING ITS SURFACES DEPEND ON. If a widget on this
     tab needs an external service — calendar, file storage, an API, an
     auth scope — that dependency belongs to THIS tab's brief. Do not
     split it into a separate integration brief. Do not defer it to
     another tab that also happens to use it.

     For each dependency, classify it:

       CODE MISSING              → goes in this brief's BACKEND section.
       CODE BUILT, NOT CONFIGURED → NOT a brief item. It needs account
                                   access nobody but Andy has: cloud
                                   consoles, OAuth clients, API
                                   enablement, repo secrets, .env
                                   values. Emit an ANDY CHECKLIST with
                                   exact steps.
       CODE BUILT AND CONFIGURED  → working. Say how you verified.

     ⚠️ A fully-coded but unconfigured integration is A GAP, not done.
     Say what the user SEES TODAY versus what they will see once it is
     configured. A hero rendering mock events is not a working hero.

     ⚠️ The tab does NOT reach stage F while any of its surfaces is
     running on mock or placeholder data.

STEP 2 — STOP AT THE FIRST BLOCKED STAGE. Write ONE brief, for that
stage only. Do not write past it.

  Walk the ladder in order. The first stage that fails is the brief
  you write. Everything after it is out of scope for this pass.

  ┌─ A · NOT DRAWN ────────────────────────────────────────────────
  │  Ruled features have no mockup surface (audit 1a).
  │  → MOCKUP BRIEF: what to draw, which spec rules bind it, which
  │    variants are worth trying. Nothing is coded this pass.
  │
  ├─ B · DRAWN, NOT DECIDED ───────────────────────────────────────
  │  A mockup exists but has no .md, or the .md records only
  │  behaviour and no appearance (audit 1e).
  │  → DECISIONS BRIEF: what must be settled — which variant, layout,
  │    hierarchy — before any code is written. Nothing is coded.
  │    ⚠️ Skipping this is why the syllabus review screen works and
  │    looks wrong.
  │
  ├─ C · DECIDED, NOT BUILT ───────────────────────────────────────
  │  Approved with a complete .md, nothing in src/ yet.
  │  → FULL IMPLEMENTATION BRIEF: frontend + backend together.
  │
  ├─ D · BACKEND MISSING ──────────────────────────────────────────
  │  The screen exists and matches, but its ruled behaviour does not
  │  work — data not persisted, entity missing, rule unenforced.
  │  → BACKEND BRIEF only. Do not touch the frontend.
  │
  ├─ E · FRONTEND MISSING ─────────────────────────────────────────
  │  Behaviour works but the screen was never translated from the
  │  mockup (audit 1b).
  │  → FIDELITY BRIEF only. Do not touch the logic.
  │
  └─ F · BUILT — all six promotion conditions hold ────────────────
     ⚠️ F is NOT "looks right". It is mockup-lab/VARIANT-LAB.md's
     six conditions, every one proved:
       1 visually matches, MEASURED via getComputedStyle, both themes
       2 ⭐ every Button / DropdownMenuItem / ContextMenuItem has a
         handler — run the 4fe210f audit, assert zero, paste output
       3 ⭐ every ruled behaviour persists across a reload
       4 ⭐ empty the store: no mock, sample or hardcoded data
         survives. A number that outlives an empty store is a defect
       5 ⭐ every integration coded AND configured, not just coded
       6 committed, hash noted in the mockup's .md
     → NO BRIEF. Promote it yourself: set status:"built" in
       variant-lab.html and paste all six proofs. Do not leave the
       flip to Andy — that is why nothing ever gets promoted.

  Whichever stage you land on, the brief carries:

  1 fidelity audit    — from step 1, so nothing shipped gets rebuilt
  2 references        — mockup, its .md, _shared/_visual-recipes.md,
                        the spec section, component-inventory, U-rules
  3 the work          — scoped to THIS stage only
  4 do not break      — existing behaviour, one-store rules, U-rules
  5 done when         — every forbidden thing provable by grep
  6 commit            — one line, unrelated changes commit separately
  7 next stage        — name what comes after, and say it is NOT in
                        scope for this brief

⚠️ ONE STAGE PER BRIEF. If a tab is both undrawn and unbuilt, write
the mockup brief and stop. The next pass re-runs this prompt and
lands on the next stage. That is the point — each stage is checkable
before the next begins.

RULES

- Frontend and backend in ONE brief. Shipping behaviour first and
  appearance later is the recurring visual-fidelity gap.
- No U-9 violations: no score, composite, ranking, or progress bar.
  If a mockup implies one, the rule wins — flag the conflict.
- If the spec and the mockup disagree, the SPEC wins and the mockup
  is wrong. Say so; do not quietly follow the drawing.
- If something's missing, say the brief is incomplete. Don't guess.

Name the file for the stage you landed on:
  implementation/briefs/T<n>-<tab>-<stage>.md
  where <stage> is: mockup | decisions | build | backend | fidelity

Report in your reply: the step-1 audit, WHICH STAGE you landed on,
and why the stages before it passed.
```

---

## How this runs

**Re-run the same prompt on the same tab after each stage completes.** It re-audits, the previous stage now passes, and it lands on the next one. **The tab is done when it returns `F`.**

```
run 1 → A  draw it          → you approve a variant
run 2 → B  decide it        → .md records appearance
run 3 → C  build it         → frontend + backend
run 4 → F  done             → agent promotes + pastes six proofs
```

**A tab already partway through skips ahead.** Academics/Class Center lands on **E — fidelity**, because behaviour shipped and the review screen was never translated. School List lands on **A**, because it is fully specced and barely drawn.

| Audit says | Who acts |
|---|---|
| Manifest not `YES` | **Andy** — the brief still gets written, nothing gets built |
| Spec and mockup disagree | **Andy** — spec wins, the mockup needs redrawing |
| Stage `F` | **The agent** — promote it and paste the six proofs. Andy only intervenes if a proof fails |

**Numbering:** `T1` Academics, then `T2`, `T3`… in the order you take the tabs. **Same number across stages** — `T2-mcat-mockup.md`, then `T2-mcat-build.md`.
