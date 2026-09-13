# Flashcard prompt workflow v1

Approved September 12, 2026. Premed OS now prepares a complete copyable flashcard prompt from a completed Class Journal; the external AI creates the finished `.apkg` for Anki.

Entry points are Create study resources → Flashcards and Create flashcards on a saved Journal page. The class picker includes only that class's Journals; unfinished entries are disabled. An entry-specific request stays attached to that entry. Study guide, Mastery Map, and practice options are removed from the create-resource menu because Class Notebook already provides them. Existing resources and legacy direct links remain available. Revised notes retain their existing workflow.

The copy includes all five exact pipeline files and current selected Journal content. Private notes, practice responses, history, and other entries are excluded. Original material access is still checked by the external AI. A failed clipboard operation exposes manual selection and download; no generation API, Anki import, or app store write happens in this handoff.

## Verification on the implementation branch

- Full application suite: 257 files / 1,930 tests passed on the release branch rebased onto the latest account-data safety update. The release run used two workers after an overloaded unrestricted run hit timeouts; no test expectations or timeouts were weakened.
- Focused workflow and integration suite: 56 tests passed, including missing/wrong-class/unfinished Journal states, exact embedded content, clipboard fallback, and Journal open/close without modifying notebook or practice state.
- TypeScript build and Vite production build passed. Vite reports existing large-chunk and mixed-import warnings.
- Full lint: zero errors, 56 warnings; scoped new modules have no errors or warnings. Existing ClassHub warnings were preserved.
- Nine isolated Python checks passed, including rejection of preset deck hierarchies and verification that no extra parent decks are imported. The exact embedded files were extracted into a fresh directory, built a synthetic 12-note/14-card package, and imported it through the real Anki engine.
- Local browser check: desktop light and narrow dark presentations, no observed horizontal overflow, copy-success feedback, and missing-Journal prerequisite. The visual fixture was invented and did not use student data.
- Independent subagent review found no blocking issue. Integration tests caught and resolved a duplicate React sibling key when closing the Journal prompt panel.

A real lecture trial is still required to assess authoring quality and manageable workload. Package verification does not prove educational correctness. Native image occlusion and safe updates to existing Anki decks are outside v1.

## Dedicated resource pages

Flashcards and Revised notes now open `/academics/classes/:courseId/resources/:resource` directly from either class resource menu, using the Notebook page shell and typography. They do not open the new-Notebook goal picker or embed their workflow in Materials. Older `createMaterial` links redirect to the dedicated page. The Journal flashcard action preserves its selected entry with `?journal=...` and returns to that Journal. Revised notes retains its existing baseline/source and generation behavior.
