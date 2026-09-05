# Academics quality contract — September 5, 2026

This contract accompanies the audit remediation. Root `src/` is authoritative. Keep Baloo 2, Nunito, the existing warm color tokens, and Lucide icons. Read the current build manifest and approved mockups before changing a page.

## References and ownership

- `mockup-lab/01-academics/academics-assignments.html`: assignment hierarchy and view controls. The September 5 correction gives every day equal minimum width so full citations cannot crush weekends.
- `mockup-lab/01-academics/academics-class-hub.html`: named lecture states, saved Guide entries, supporting course context.
- `mockup-lab/01-academics/academics-planning-decisions.html`: actual placement before coverage claims.
- `premed-hq-documentation/AGENT-IMPLEMENTATION-GUIDE.md`, shared patterns section 5c, and craft guidance remain applicable.
- `src/components/ui/`: reuse the installed shadcn/Radix dialog, input, button, select, and disclosure primitives. [shadcn dialog composition](https://ui.shadcn.com/docs/components/radix/dialog) is a reference; do not replace the installed primitive implementation merely because current examples use another base library.
- `src/components/common/AssignmentsPanel.tsx` owns assignment views and creation. `assignmentsLogic.ts` owns workload semantics. `classCardSummary.ts` owns concise task titles; preserve the original title in the editor and accessible name.
- `src/components/academics/ClassHub.tsx` owns class Guide and writing flows. New entries remain drafts until Save. Cancel must not create a record. Existing records must have a reachable correction surface.
- `src/lib/academics/planner.ts` owns placement evidence. Use `placedCourseCodes` before candidate coverage; a catalog match in Unscheduled is not a placement.
- Use [Motion accessibility guidance](https://motion.dev/docs/react-accessibility) for transitions and honor reduced motion. Existing `motion/react` behavior already provides the foundation.
- Use [21st.dev](https://21st.dev/) to study component composition and interaction examples. Adapt selected patterns to the approved design; adding ornamental components does not fix information hierarchy or overflow.

## Acceptance criteria

1. Test real long citations and unbroken URLs, both empty and crowded days, all seven days. Cards show short summaries with full details reachable; cards and pages must not overflow their containers.
2. At 375px, the weekly strip may scroll horizontally within its own region. The page itself must not gain horizontal scrolling. A busy day has bounded vertical scrolling, not a page-height card stack.
3. Missing or zero grade weight does not imply a free day. Show task counts and qualify known weighted totals. Search-filtered emptiness must say no matches.
4. Calendar cells have one tab stop and support arrows, Home and End. Adding from a selected date carries that date into the form and saved record.
5. Never save unnamed Guide, paper, or reading records on Add. Preserve Save/Cancel, correction, and removal flows. Show individual feedback before it becomes a recurring theme.
6. Captured sources do not count as a generated Study Guide. Render generated work only when its saved artifact exists. Keep transcript previews under Sources.
7. Test table filtering with one record and a larger set, including clearing to restore results. Keep TanStack input data stable. Prevent hiding the final visible column.
8. Use readable status labels and usable touch targets. Separate missing transcript details from work still in progress. Exam scope that has not been entered is unknown, not zero-of-zero coverage.
9. Verify browser behavior, then record exact test/build evidence and any unresolved limitations. A local fix is not a live deployment.
