# Lecture reader layout — September 5, 2026

User-approved refinement: preserve the Class Hub library-style lecture selector and inline guide preview. Expanding the guide opens the existing dedicated lecture route.

On that route, the guide is the page, not a rounded card inside another card:

- Put the return-to-class-journal link in the shell breadcrumb. Do not repeat a second return row below the shell.
- Use the available page width, preserving internal reading padding and a readable text measure.
- Make “In this guide” the primary desktop sidebar. Bookmarks and article scroll independently; selecting a bookmark scrolls and focuses the corresponding heading without moving the shell or bookmark column. On narrow screens, use the existing compact bookmark strip and the outer reading pane.
- Lecture switching is secondary: “Switch lecture” opens the shared accessible Sheet, closed by default. It supports touch and keyboard, not hover-only access. Keep the persistent catalog for legacy dialog views and the library selector in Class Hub.
- Guide headings and bookmarks are upright and bold in the existing font system, not italic. Keep body paragraphs regular.
- Do not regenerate saved guides, alter mastery progress, or change source/provider logic as part of this layout refinement.

Implementation: LecturePage, LectureCapturePanel, LectureStudyViews, lectureGuideNavigation, AppShell, and Topbar. The drawer reuses the existing shared Radix-backed Sheet rather than adding another overlay implementation.
