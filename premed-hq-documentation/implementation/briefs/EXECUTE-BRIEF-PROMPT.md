# Execute a brief — the universal runner

**Two prompts run this whole process. Both take just a tab name.**

```
TAB-BRIEF-PROMPT.md      + [TAB]  →  audits, writes the brief for the blocked stage
                                     ⬐ YOU READ IT HERE
EXECUTE-BRIEF-PROMPT.md  + [TAB]  →  does exactly what that brief says
```

**Repeat until the router returns stage `F`.** No third prompt, ever.

> **⚠️ Do not merge these into one prompt. The gap between them is the review point, and it has already paid for itself:** T2's brief surfaced the unresolved Capture destination conflict — spec says Atlas, the app uses Story Bank — **before anything was drawn.** Auto-execution would have drawn it wrong.
>
> **Read the brief. That is the whole job between the two pastes.** Most take a minute; skim the audit and the scope line and move on.

> **⚠️ If this runner ever needs stage-specific instructions added to it, the brief was incomplete.** Fix the brief, not the runner. **Rulings, constraints, and settled conflicts belong in the brief** — that is what makes it reviewable before any work starts.

---

```
Execute the current brief for the [TAB] tab.

Find it: the newest T<n>-<tab>-*.md in
premed-hq-documentation/implementation/briefs/.
Say which file you picked. If more than one is unexecuted, or you
cannot tell which is current, ask rather than guessing.

Read it fully, plus every file in its references section, before
doing anything.

SCOPE
- Do exactly what the brief authorizes. Nothing more.
- The brief names its stage and names the next stage as out of scope.
  Respect that boundary even if the next step looks trivial.
- If the brief says "draw only," do not touch src/.
  If it says "backend only," do not touch the frontend.
  If it says "fidelity only," do not touch the logic.

BEFORE YOU START
- Re-run the brief's fidelity audit. If something it lists as
  unbuilt is now built, say so and skip it — do not rebuild.
- If the brief's references include a mockup, read the mockup itself,
  not only its .md.
- If BUILD-MANIFEST.md does not clear a mockup this brief would
  build, stop and say so. Only Andy flips a manifest row.

WHILE WORKING
- _shared/_visual-recipes.md values are used LITERALLY, never
  approximated. **A token NAME is not the value.** `bg-muted/25` is not
  `var(--muted)`: a translucent fill washes toward whatever sits behind
  it, and three surfaces that each "use muted" can end up the same
  colour. Solid where the recipe says solid.

⭐ VISUAL FIDELITY CHECK — REQUIRED BEFORE YOU CALL ANYTHING DONE
  Andy, Aug 19 2026, after a week of surfaces shipped washed-out:
  "make sure it's part of the workflow from now on, visually copying
  from the mockup to the app."

  Open the mockup and the built screen side by side, then MEASURE —
  do not eyeball, and do not trust that reusing a token name worked:

  1. Serve the lab standalone, NOT through the dev server:
       cd mockup-lab && python3 -m http.server 4599
     Vite's Tailwind plugin tries to compile the mockups' own CSS and
     errors on it.
  2. Read the mockup's own rule for each surface:
       grep -o "\.term{[^}]*}" mockup-lab/01-academics/<frame>.html
  3. In the running app, read the COMPUTED value of the same surfaces:
       getComputedStyle(el).backgroundColor
  4. Compare the ladder, not one value. A drawing that steps
     bg -> muted -> card must step the same way in the app. Equal-looking
     surfaces are the failure this check exists to catch.
  5. Do this in BOTH themes.

  Report the before/after table in the commit when it changes anything.
- Reuse existing components. Do not fork one to change it.
- No U-9 violations: no score, composite, ranking, or progress bar.
  If the brief or a mockup implies one, flag the conflict and do not
  build it.
- If the spec and a mockup disagree, the SPEC wins. Say so.

IF YOU HIT A BLOCKER
- Name it and keep working on everything else in scope.
- Do not stop the whole pass for one obstacle.
- Do not guess a decision the brief left open. Say the brief was
  incomplete and name what is missing.

WHEN DONE
- Work through the brief's "done when" list and report each item
  pass or fail. Do not claim completion with items outstanding.
- Run tests and the production build if the brief touched src/.
- Make the brief's commit. Unrelated working-tree changes commit
  separately.
- Report: what you did, what you skipped and why, every "done when"
  item that failed, and what stage this tab is at now.
```

---

## The loop

```
run TAB-BRIEF-PROMPT  → stage A · brief written
run EXECUTE           → mockups drawn
   you pick variants, .md records appearance
run TAB-BRIEF-PROMPT  → stage C · brief written
run EXECUTE           → built
run TAB-BRIEF-PROMPT  → stage F · done
   you flip status:"built"
```

**Three things only you do:** pick a variant · flip a `BUILD-MANIFEST` row · resolve a spec-versus-spec conflict.

**Everything else alternates between those two prompts.**
