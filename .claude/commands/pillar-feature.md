---
description: Implement a Premed OS feature using the standard handoff structure
---

Implement the following feature: $ARGUMENTS

Follow this exact process:

1. **Design reference.** Re-read CLAUDE.md design foundation rules and, if a
   handoff doc or Claude Design export is referenced, read it fully first.
2. **Plan.** List the numbered concrete changes (files + what changes in
   each) BEFORE writing code. If anything is ambiguous, ask — do not guess
   on design decisions.
3. **Scope check.** State what you will NOT touch (per the standing
   must-not-change list in CLAUDE.md). If the feature seems to require
   touching a protected area, stop and ask.
4. **Implement.** One feature only. Reuse shared components (InlineAddRow,
   ExpandableEntryRow, ContactCard, PillarShell). lucide-react icons only.
5. **Verify.** `npm run build` passes; new views checked in both themes,
   signed-out mode, and empty state; no console errors; `git diff --stat`
   confined to expected files.
6. **Commit.** Single conventional commit (`feat(scope): …`). Do not push
   if build fails.
