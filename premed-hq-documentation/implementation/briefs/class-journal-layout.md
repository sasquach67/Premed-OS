# Class journal layout — September 5, 2026

The user rejected both the full embedded reader and the subsequent two-column compact preview because the sparse journal still left an awkward empty area.

The user further clarified that the entire inline study workspace must remain on screen, only slightly compressed. The replacement is one full-width list, using the existing shadcn Accordion component. This supersedes the older journal-rail / journal-stage geometry for Class Hub Overview.

- Header: Class journal, lecture count, Add today's lecture.
- Each row: saved topic title, date, transcript/material metadata, expansion indicator, existing record actions.
- Expand at most one row at a time. The preview belongs directly beneath its row, inside the same list; clicking again collapses it.
- Completed lecture preview: full inline Study Guide, Mastery Map, Materials, and Sources. Modestly tighter typography and section spacing; a keyboard-focusable reading area scrolls independently within 68vh / 38rem. Never truncate saved study content to a summary.
- Open full screen expands to the complete lecture dialog. Incomplete lectures retain the existing Open lecture import flow.
- Empty state: one sentence explaining how to add a first lecture. The Add action opens the existing import flow.
- No side preview column, fixed-height journal, filler widgets, repeated lecture title. Full guide content remains available inline.
- Keep existing theme tokens and fonts, wrap long titles, preserve mobile access and reduced motion.

Implementation: `src/components/academics/ClassHub.tsx`, `LecturePreview.tsx`, `classHubVariantA.css`; shared primitive: `src/components/ui/accordion.tsx`. Component pattern reference: [shadcn components](https://ui.shadcn.com/docs/components).

Verification: test in-row expansion/collapse, empty-state import, record actions, and full-workspace access; visually check both themes and a 375px viewport.
