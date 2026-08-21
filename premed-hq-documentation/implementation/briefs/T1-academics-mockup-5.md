# T1 · Academics — materials reader and lecture index

**Stage:** A · NOT DRAWN  
**Status:** Mockup-only brief. Do not edit `src/`, the store, migrations, or the manifest in this pass.  
**Why now:** The existing Materials and Lecture Capture drawings show ingestion and generation, but not the two ruled surfaces that make a student's material useful after it arrives: reading it in context and finding a specific lecture moment again.

## 1. Audit before this brief

### A. Spec → paper

The following ruled Academics feature groups have **no reachable mockup surface**. This is a surface audit, not a claim that every item is unbuilt.

| Ruled feature group | Spec source | Existing paper coverage | Gap |
|---|---|---|---|
| Inline material reading for uploaded PDF, Drive/GoodNotes embed, and external link | `tabs/01-academics.md` §4.1-A, §4.1-I Materials, §6.4 | `academics-class-hub.html` lists files; `academics-materials-extensions.html` draws the catalog and generation flow | No reader/preview state, source-location treatment, external handoff, or recoverable embed failure. |
| Bulk local course-folder intake and positional filing | §4.1-A, §4.1-I Materials, acceptance criteria “organization”/“coverage ledger” | A single-file `Add material` is visible; catalog has an Unassigned treatment | No folder-preview, proposed filing, confirm-week, or no-match state. This is **local folder intake**, not a Canvas API design. |
| Watched-folder setup and one-time mapping confirmation | §4.1-I “Note ingest — watched folders” | No paper surface | No source-provider handoff, proposed path mapping, confirm-once, new-folder, or unplaceable-page state. |
| Searchable lecture index over a captured transcript and linked materials | §4.1-Q, §4.1-I Materials | `academics-lecture-capture.html` draws capture, review, and unavailable | No search/index result, quote-to-material jump, or empty index. Capture review alone does not show the durable lecture-retrieval job. |
| Professor evidence model | §4.1 data model, §6.8 `ProfessorModel` | No paper surface | No sample-gated/silent state or evidence-only trend treatment. |
| Concept canvas inside the recall runner | §4.1-K / §4.1-I, acceptance criteria “Surface placement” | No paper surface | No simple nodes-and-labelled-edges composition, imported map parity, or confirmed-topic-link proposal. |
| Course-type-specific work surfaces | `PaperDraft` / reading tracker in §4.1 data model and class-type rules | `academics-class-types.html` establishes the three configurations | No detailed writing Draft or Readings workspace, including their empty and status states. |
| Exam/resource catalog take-and-return loop | §4.1-P | `academics-materials-extensions.html` draws a permission-aware resource catalog | No timed take state, score-to-`AcademicMistake` handoff, or historical-scope evidence state. |
| Transcript-fidelity enrollment capture and visible export | §4.2-D, §6.9 | `academics-grades-archive.html` covers ledger/GPA/what-if | No transcript-exact enrollment/edit or export surface. |

The following are **not** gaps to draw in this brief:

- Canvas Path B / REST sync is explicitly barred from further proposal until the Path-A calendar route is live and demand proves it. The later U-12 ruling is stronger: do not prototype a Canvas sync. This brief must not add a token screen, browser fetch, or Canvas client.
- Grade distributions are explicitly withheld pending the licensed UNC research task.
- Existing mockup coverage already exists for syllabus intake/re-import, source-grounded revised notes/study guides/flashcards, calendar-review handoff, lecture-capture review, topic linking, exam prep, grades, planner/requirements, study method, forgetting curve, and term rollover. They are not redrawn here.

**First gap selected:** the first row and the closely inseparable lecture-index row. A student cannot inspect, cite, or return to material the app has already accepted. The folder and watched-folder flows remain a later Stage-A mockup pass; they are intentionally not silently pulled into this one.

### B. Mockup → app

| Mockup group | Exists in `src/` | Matches the drawing? | Audit result |
|---|---|---|---|
| Daily main / Class Center | `ClassCenter.tsx`, `Academics.tsx` | Unverified visual fidelity | Built before the Aug 19 measured-fidelity rule; card styling needs a later fidelity pass, not a rebuild. |
| Class Hub | `ClassHub.tsx` | Behaviour is present; visual translation unverified | The five-tab page and shared header are present. The current direct route with `?classTab=materials` rendered the Notes panel instead, so deep-link tab selection is not proven. |
| Materials catalog + source-grounded outputs | `MaterialCatalog.tsx`, `RevisedNotesPanel.tsx`, `FlashcardDecks.tsx`, `CalendarReview.tsx` | Partial | Source selection/generation exists, but there is no inline reader or lecture-index interface to match because neither is drawn. |
| Lecture capture | `TranscriptImport.tsx` | Partial | A transcript text import exists; local audio capture, full-transcript analysis, and a lecture index do not exist. |
| Topic linking | `TopicLinkFields.tsx` | Unverified visual fidelity | The write-side is present; it needs its own later measured fidelity pass. |
| Study method / forgetting curve / grade decisions / planning / grade archive | Corresponding Academics components exist in `src/components/academics/` | Unverified or partial | These are outside the selected first missing-paper gap. No assumption of promotion is made. |

#### Measured primary record surface — Aug 21, 2026

Measured in the running dark app at `#/academics/classes/demo-course-biol252?classTab=materials`. The rendered tab was **Notes**, despite the URL requesting Materials; record that mismatch for the later implementation/fidelity pass.

| Surface | Mockup value | Running app value |
|---|---|---|
| Class-page canvas | `.frame` `#211e1a` in `academics-class-hub.html` | `body` `rgb(33, 30, 26)` = `#211e1a` |
| Primary solid panel | `.card` `#2b2722`, `1px #3c352d`, `16px` radius | `.card-soft` `rgb(43, 39, 34)` = `#2b2722`, `rgb(60, 53, 45)` = `#3c352d`, `16px` radius |
| Inner object rung | mock Materials groups step down to `#262320` / muted `#322e28` | current note items use `bg-muted/25` (`oklab(... / .25)`), not a directly comparable solid object rung |

The outer page → card ladder matches for the two measured rungs. The third rung cannot be signed off: it was measured on the wrong rendered class sub-tab and is translucent rather than the mockup’s solid materials object. This is evidence for a later Stage-E fidelity check, not permission to change it in a Stage-A mockup brief.

### C. Already built — do not rebuild

- Real local material add path: `1f5d908` (`feat(academics): give course materials a real add path`).
- Grounded artifact foundation: `8ca4d65`.
- Class full-mock/flashcard flow: `d009cb7`; browser `.apkg` export: `326a17a`.
- Revised Notes source-grounded generation: `00036a5` (`feat(academics): add source-grounded revised notes generation`).

This brief draws the missing paper only. It must not fork those generators, material ownership, or the Class Hub.

### D. Manifest gate

`BUILD-MANIFEST.md` marks `academics-materials-extensions.html` and `academics-lecture-capture.html` **YES**. New mockup states in those files are therefore eligible for a later build only after they are drawn and decided. The manifest is not edited here.

### E. Decision-file check

`academics-materials-extensions.md` and `academics-lecture-capture.md` both record **Behaviour** and **Appearance**. Their existing decisions remain valid. The new reader/index state needs the same paired documentation; a screen description without its visual ladder and hierarchy does not advance to Stage B.

### F. Integrations and services

| Dependency | Status | What the student sees today | Consequence / later owner |
|---|---|---|---|
| Local uploaded material/blob persistence | **CODE BUILT, PARTIAL PRODUCT SURFACE** | A student can add material, but cannot inspect it inline through the class workspace. | The later implementation brief must verify persistence across reload and add the reader only after this mockup is approved. |
| OpenAI generation through Supabase | **CODE BUILT, CONFIGURATION NOT PROVEN HERE** | Revised Notes, study guide, and flashcard affordances exist; a live signed-in run is still the proof. | Do not put a secret in the client. Andy’s checklist for the later build: verify the existing Supabase OpenAI secret, deploy the invoked function, sign in, generate from selected material, and confirm source-only output. |
| Google Calendar / Canvas Path A | **CODE BUILT, CONFIGURATION NOT PROVEN HERE** | Calendar Review shows the read-only, review-before-apply route; it is not proof that an individual Canvas feed is arriving. | Andy later verifies Google OAuth redirect/domain, Calendar scope, a subscribed personal Canvas ICS feed, and a real proposed change. No Canvas API/token work. |
| Lecture transcription / analysis | **CODE MISSING** | Text transcript import only. | Future backend brief after the capture/index mockup is decided: local-first transcription, whole-transcript analysis, quoted/timestamped evidence, and explicit cloud disclosure. |
| Watched GoodNotes/Drive/Dropbox folder | **CODE MISSING** | Manual add/upload. | Future backend brief after its own mockup and decision pass; do not imply background sync now. |

Because those services are unproven or absent and the tab still carries demo data, Academics is not at promotion Stage F.

## 2. Work — draw the first missing paper only

### Draw

Extend the two existing materials-level mockups; do not make a new sixth class sub-tab or a second generator home.

1. **`academics-materials-extensions.html` → `reader` view**
   - It is reached by opening a file in the existing Materials catalog.
   - Keep the class banner and Materials underline visible.
   - Use a wide, bounded document stage with the rendered source/preview as the main object; add a narrow context rail for unit, ownership (`Course` / `Mine` / `Generated`), linked topics, and source actions.
   - Draw three small, real states inside the same view selector: local PDF/image preview, external/embed handoff, and an unavailable-but-recoverable embed. Do not fake a full PDF viewer or invent source text.
   - The reader must show the material’s position in the course and a route back to the module. It must not imply that uploaded source material is public or redistributed.

2. **`academics-lecture-capture.html` → `index` view**
   - It is reached from the Materials-level capture surface after a transcript has been processed.
   - Give the page one search/filter field, a left timestamp trail, central result excerpts, and a constrained material-link rail. Results must be quote + timestamp + linked material only.
   - Include an honest empty state: no processed lecture transcripts, with capture/upload as the next action. Include one no-result state if it can fit the selector without making a fourth comparison variant.
   - Search may find a phrase or supplied material title; it must not label an item high-yield, predict an exam, rank importance, or fabricate an explanation.

### Variant decisions to draw

No A/B/C visual competition is warranted for the reader: the parent hierarchy, solid material surface, and narrow provenance rail are already ruled. Draw **one** reader treatment plus its embedded states.

For the index, draw **two** variants only if they materially change the retrieval model:

- **A — Evidence rail:** timestamp trail → readable quote stack → source-link rail. Recommended; it keeps the student’s words/quotes primary.
- **B — Material-first split:** selected slide/note at left, matching transcript excerpts at right. Use only to test whether reading versus searching is clearer.

Do not create a decorative third variant. If A and B are functionally equivalent, retain A alone and state why in the companion `.md`.

### Binding rules

- Source material is student supplied or course-linked. Generated material stays visibly `Generated`; no web/course lookup fills a gap.
- The transcript is analysed in full only later; this mockup must not imply a keyword gate or skipped segments.
- Every proposal is reviewable. The reader/index does not write coverage, topic links, or a ProfessorModel automatically.
- Lecture output remains descriptive: quote + timestamp + measured context. Never render a score, composite, ranking, progress bar, confidence percentage, or “likely on the exam” claim (U-9).
- Glass stays confined to the shared banner/stat-strip context. Reader, transcript, and rail panels are solid-with-depth.
- Keep Material and class ownership separate: source file on the left/center; course context in the right rail. Do not duplicate the file list or move the five class tabs.

## References

- `premed-hq-documentation/tabs/01-academics.md` §4.1-A, §4.1-I Materials, §4.1-Q, §6.3–§6.4, §6.8, §6.12, §6.14, and the acceptance criteria.
- `mockup-lab/01-academics/academics-class-hub.html` + `.md`.
- `mockup-lab/01-academics/academics-materials-extensions.html` + `.md`.
- `mockup-lab/01-academics/academics-lecture-capture.html` + `.md`.
- `mockup-lab/_shared/_visual-recipes.md` (literal warm-dark ladder, banner, glass, type, focus, and motion values).
- `premed-hq-documentation/implementation/component-inventory.md` (`DocEmbed`, `ResourceGrid`, `AnimatedFileUpload`, `Resizable`, `InfoTip`, `Tabs`, `EmptyState`).
- `premed-hq-documentation/implementation/briefs/BUILD-MANIFEST.md`.

## Do not break

- Do not edit `src/`, storage, edge functions, OAuth, manifest rows, or the existing approved/proposed mockup states outside these two files and their companion decisions.
- Do not restart a Canvas REST/token design; Path A is calendar context only and the U-12 ruling forbids new Canvas-sync proposal.
- Do not fork `ResourceGrid`, `DocEmbed`, `AnimatedFileUpload`, Tabs, or the existing generation surface.
- Do not show sample lecture/course content as if it were a real user record. Example quotes must be visibly illustrative, source-labelled, and contained within prototype framing.
- Do not add in-app flashcard review, Anki scheduling/sync, a sixth tab, a second generator home, or invented performance metrics.

## Done when

- [ ] The reader and lecture-index states are reachable from the existing lab pages through `?view=` and registered in `variant-lab.html` as `proposed`.
- [ ] The companion `.md` files record both Behaviour and Appearance, including the literal page → panel → inner-object ladder and desktop/mobile hierarchy.
- [ ] Reader states cover local preview, external/embed handoff, and recoverable unavailable state without invented material text.
- [ ] Index states cover searchable evidence and no processed transcript; every result carries a quote, timestamp, and material connection.
- [ ] `rg -n -i 'high-yield|likely on the exam|confidence score|exam prediction' mockup-lab/01-academics/academics-{materials-extensions,lecture-capture}.*` returns no new forbidden claim.
- [ ] No new class tab, Canvas token/API flow, background upload, or `src/` change appears in the diff.
- [ ] The lab renders both added views at desktop and a narrow viewport; focus and reduced-motion notes are recorded.

## Commit

`docs(mockups): draw Academics material reader and lecture index`

Commit only the mockup files and their companion `.md` files. Keep unrelated working-tree changes separate.

## Next stage — not in this brief

After this paper exists, re-run `TAB-BRIEF-PROMPT.md`. It should either find the next undrawn Academics group (folder/watch, ProfessorModel, concept canvas, course-type work surface, exam loop, or transcript capture/export) and remain at Stage A, or—only when all ruled groups are drawn—advance to Stage B decisions. It must not build the reader/index until the stage ladder reaches a decided, manifest-cleared implementation brief.
