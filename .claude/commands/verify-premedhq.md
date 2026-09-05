---
description: Full Premed OS verification pass before push
---

Run the complete Premed OS verification checklist on the current working
state:

1. `npm run build` — report and fix any errors/warnings introduced by
   recent changes.
2. `git diff --stat` against the last commit — confirm no files outside
   the intended scope were touched. Flag anything unexpected.
3. Grep changed files for violations: emoji characters in JSX/TSX,
   hardcoded hex colors that bypass theme tokens, font-family declarations
   other than Baloo 2 / Nunito, `any` types.
4. Confirm any localStorage schema change has a versioned migration and
   old data loads losslessly.
5. For changed panel, row, or field surfaces, compare computed background
   colors in light and dark themes with the approved mockup and shared
   visual recipe. Inner surfaces use solid `var(--muted)` when prescribed;
   preserve deliberate hero glass and hover tints. Record the measured
   values and reference rule, not just the class names.
6. Report a short pass/fail summary per check. Do NOT auto-push.
