# Academics · Materials extensions — decisions

**Status:** PROPOSED · Stage-A coverage

> **U-12 correction (Aug. 2026):** the historical Canvas calendar-feed states
> in the source HTML are retained only for recordkeeping. They are cut from the
> active lab: Premed OS does not spec, propose, or prototype Canvas sync. This
> does not affect manual records, syllabus import, pasted text, or ordinary
> external links.

## Product views

| View | Job |
|---|---|
| Resource catalog | File real assessment material by unit and source permission. |
| Study outputs | Select only student-supplied sources, then choose Revised Notes, Study Guide, or Flashcards. |
| Material reader | Inspect an attached local document or hand off to its owned external provider without losing the class, unit, ownership, or topic context. |
| Folder intake | Preview a user-selected local course folder, then confirm only the material positions the student accepts. |
| Watched notes | Explain the one-way backup-folder mapping once, then ask again only when a source path is genuinely new or unclear. |
| Textbook excerpt | Let a student paste one bounded textbook section as a named, student-owned source for the existing output triad. |
| Revised Notes baseline | Make the selected student note the visible repair anchor, with slides, transcript, and excerpts as supporting evidence. |
| No notes baseline | Keep selected sources visible when Revised Notes lacks student notes, then route to notes selection or a non-revision output. |

## Behaviour

- This extends the existing **Materials** tab; it never adds a sixth class tab.
- No Canvas token, feed, API, or sync is part of this Materials surface. Course
  dates remain student-entered or syllabus-derived and are always reviewable.
- Catalog entries keep their source/permission. Unknown-origin material remains private.
- Generation cannot run without selected student-supplied course material. Every output retains source links and a generated ownership marker.
- **Pasted textbook excerpt** is a bounded source that the student enters and names. It is never a whole-book upload, search, or remote lookup; it becomes eligible only when the student adds it to the current source selection, and no output can use material outside that selection.
- **Revised Notes** is a distinct generated artifact. It begins from the student's selected notes, preserves their organization, language, and emphasis where the selected sources support them, and uses selected slides, transcript, or excerpts only to fill supported gaps or expose an unresolved source difference. If there is no student note selected, no Revised Notes artifact can begin: the student chooses notes or uses the current sources for Study Guide or Flashcards instead.
- **Study Guide** is a distinct study-oriented organization of selected material. It does not replace Revised Notes or become an ungrounded textbook chapter.
- **Flashcards** remain a one-way Anki export artifact. They do not schedule, review, or import cards back into Premed OS.
- **Material reader** opens from the existing catalog and stays inside Materials. Local preview, provider handoff, and an unavailable embed are three recoverable reader modes—not three new pages or alternate ownership models. An unavailable provider leaves the material record, course position, and linked topics intact; it never produces copied or generated replacement content.
- **Folder intake** is deliberate local selection, not a file-system claim. Premed OS can preview a selected course folder beside the regular individual-file fallback, but it never moves, renames, edits, or otherwise changes the original folder. It proposes Material positions; applying the review updates only accepted Premed OS metadata.
- **Folder review** is keep-by-default for anything uncertain. A route with evidence can be confirmed. A file with no unambiguous week is marked **Confirm week** or kept unfiled; it is never put in a semester-wide Misc / Loose Ends bucket and it is never silently overwritten.
- **Watched notes** are one-way only. A student may later connect a folder created by GoodNotes Auto Backup, Notability, OneNote, Google Drive, Dropbox, or OneDrive; Premed OS reads/imports new notes as `Mine` and never writes back. The drawing is an awaiting-connection setup state, not a fake live provider account.
- **Mapping confirmation** makes one inferred pattern visible as `class → week → category → document`. The student confirms that pattern once or chooses **Review each import instead**. It re-asks only for a genuinely new course folder or an unguessable segment; a recognised class with no defensible week remains **Confirm week**.

### Revised Notes generation contract

> Create a Revised Notes material from the student-selected sources only.
> The student’s own notes are the baseline: preserve their organization,
> language, and emphasis where possible. Compare those notes against the
> complete selected lecture transcript and instructor-provided materials, then
> add or clarify only details those sources directly support.
>
> Improve gaps in the student’s record without turning it into a study guide,
> textbook chapter, summary of outside knowledge, or a replacement for the
> original notes. Preserve meaningful instructor terminology, distinctions,
> examples, and qualifiers.
>
> Every factual passage must include one or more traceable references to the
> selected source material. If sources conflict or do not settle a detail,
> place the competing details in an Unresolved source difference section with
> both traces. Never silently choose a version, invent a fact, or use general
> background knowledge.
>
> Return a coherent lecture-note document with clear sections, source-linked
> passages, and unresolved differences only when they genuinely exist.

This is deliberately a student-record repair task, not a second explanation
engine or a general knowledge lookup.

## Appearance

- The shared Class Hub banner and Materials underline establish place. Below it, the three view chips are quiet tools—not another tab system.
- **Resource catalog** is a material shelf: a narrow unit spine at left, a selected-unit canvas of compact object tiles at center, and one restrained empty-state rail. The hierarchy is unit → material → provenance, so the source badge is visible without turning every item into a long row.
- **Calendar feed** is a left-to-right handoff trail. Its vertical event thread makes the calendar source, one proposed change, and the student-controlled course record feel sequential rather than like three settings cards.
- **Source selection** is a source map. Selected slides, notes, and transcript nodes converge into a single **Choose an output** node; the linework expresses grounding without claiming that the model knows more than the inputs.
- **Textbook excerpt** extends that map rather than opening a file-upload dashboard: the textarea is the dominant dense object, compact optional labels carry only student-entered provenance, and the resulting `Pasted excerpt · Mine` node sits with the other selected sources. The too-short recovery remains directly below the typed input so the student keeps their work and knows what to add.
- **Choose an output** is a compact three-choice triad, not a dropdown and not a second generator home: Revised Notes leads because it is the lecture-record repair path, with Study Guide and Flashcards alongside it. On narrow screens the triad becomes a two-up and then one-column sequence without changing its order.
- **Revised Notes result** uses the same paper-and-provenance layout as the generated guide so source access cannot drift. A short stitched passage shows the practical job: join a slide term, a student note, and a transcript moment without obscuring where each came from.
- **Revised Notes baseline** turns the source map into an evidence diagram: `My notes · baseline` occupies the central anchor, supporting nodes line toward it, then the route continues to Revised Notes. The note is primary by geometry and label, not by a new color system or a claim that support sources are ranked. The paper-plus-provenance result below it shows one bounded repair trail.
- **No notes baseline** is a quiet in-flow recovery, not an empty dashboard: the selected-source stack remains at right, the absence mark and plain explanation occupy the center, and the three next actions preserve the existing output vocabulary. No artifact preview appears.
- Dense material surfaces are solid-with-depth. The banner is the only floating/glass region. The course-blue bloom is used only for source selection and the active view.
- **Material reader** is a bounded document stage beside a narrow provenance rail. The source stays visually dominant; the rail carries the unit route, ownership, linked topics, and the route back to the module. The provider-handoff state replaces only the document stage, so the class context does not disappear. At mobile width, the rail stacks after the source stage and its actions stay in the same order.
- **Folder intake** is a three-part safety composition: a narrow local-source tree, a central course-position board in week order, and a compact review rail. This prevents a multi-file import from becoming another wall of identical file rows. The central board makes proposed placement visible before the student is asked to accept it.
- **Folder review** becomes a single broad decision sheet: file identity at left, the proposed class/week path in the center, and Confirm / Keep unfiled actions at right. At narrow width, that order stacks without losing the proposed path between the file and its decision.
- **Watched notes** use a path-to-placement map rather than a provider settings card. Solid path segments converge in one left-to-right line; matched class, week, and category use restrained semantic color, and the one-time confirmation is the only dominant action. The side rail keeps the awaiting-connection status and backup caveats subordinate.
- **Mapping exception** uses two equal, bounded cards for the only two questions that should recur: a new course folder and an unguessable path level. The exception cards do not restart setup and do not resemble a dashboard.
- The reader uses the literal warm-dark ladder: page `#211e1a` → solid panel `#2b2722` → document-stage/object `#262320` / `#322e28`, with `#3c352d` borders, 16px panels, and 13px inner objects. Source preview paper is deliberately neutral and contained; it is illustrative framing, never invented course content.
- Folder and watched-note states use that same literal ladder: page `#211e1a` → solid `#2b2722` panels → `#322e28` decision objects / `#262320` recovery inset; `#3c352d` borders; 16px panels and 13px inner objects. The banner is still the only glass surface.
- The three source-baseline states use that same literal ladder: page `#211e1a` → solid panel `#2b2722` → dense input/source object `#322e28` or recovery inset `#262320`, with `#3c352d` borders, 16px panels, and 13px inner objects. At narrow width, supporting rails stack after the primary source/input surface; focus remains visible and reduced motion resolves directly. No A/B/C variants are drawn because these are ownership/evidence states inside one established source-map composition, not competing visual directions.

## Component translation

- Use the existing `ThreeLevelNav` / Tabs owner for the class hierarchy, `ResourceGrid` for catalog objects, and `AnimatedFileUpload` for adding a real file.
- The resource shelf borrows 21st.dev’s information-density approach only; it does not introduce another card or grid owner.
- Calendar review is a configured `InteractiveCard`/`CenterPeek` decision surface when it needs detail. Animate UI is a motion reference for the view transition, re-skinned to the Premed OS tokens.

## States

- Catalog shows populated sources, an explicit unknown-origin private treatment, and the first-action empty rail.
- Historical Canvas feed frames are not active views and must not be translated
  into application behavior. Existing manual/syllabus dates remain independent
  and are not removed by this correction.
- Study guide shows selected sources and the no-eligible-material recovery. Its result keeps a narrow provenance rail with every selected source reachable from the generated material. Its unavailable state happens only after source selection and preserves those selections; it never substitutes general course content.
- Pasted excerpt intake shows a bounded student-owned text box, optional student-entered labels, and a too-short recovery that preserves the typed text. It never supplies demo textbook content, uploads a whole book, or searches a provider.
- Revised Notes baseline shows the student note as the selected anchor and one paper/provenance repair trail. No notes baseline preserves the selected sources and offers Select my notes, Study Guide, or Flashcards; it never labels another source as notes or previews a Revised Notes artifact.
- Folder intake shows a selected-folder proposal, no usable files / unsupported file recovery, and individual-file fallback without losing the selected context. Folder review includes Confirm, Keep unfiled, and Confirm week; no action is implied to happen before acceptance.
- Watched notes shows awaiting connection, one-time mapping confirmation, Review each import instead, a newly visible course folder, and an unguessable path level. The setup help discloses fixed GoodNotes backup roots and that this route is unavailable on GoodNotes for macOS.

### Folder and watched-note variant ruling

These are not A/B/C presentation choices. The necessary variation is state, not
visual direction: folder intake and watched mapping each have one safety-first
composition, while folder review and mapping exception are required states
inside it. Competing layouts would obscure the same review boundary the feature
exists to protect.

Every chip and action uses `:focus-visible`; hover/view changes use the shared
`.15s cubic-bezier(.16,1,.3,1)` rule and reduce directly under
`prefers-reduced-motion`.

## Output-first material intake — proposed A/B/C treatments

### Behaviour

- A student starts from the artifact they want: **Study Guide**,
  **Flashcards**, or **Revised Notes**. The selected artifact stays visible
  while they select or add material; source selection is not a separate,
  forgotten first step.
- The only contextual input paths are existing eligible class material, **My
  notes**, a lecture transcript, instructor/course material, and one named,
  bounded pasted textbook excerpt. A bare upload with no readable/pasted text
  is shown as **not ready**, is excluded from generation, and keeps its class
  record intact.
- There is no permanent `Add material` action in this composition. Input
  affordances appear inside the selected artifact’s source picker. `Import
  syllabus` remains class setup and is not represented as generator input.
- A Study Guide or Flashcard request uses only selected ready sources.
  Flashcards still lead to one-way Anki export and never gain an in-app review
  or scheduling path.
- Revised Notes requires **My notes** as the student-selected baseline, then
  routes into the existing baseline/no-baseline states. It never overwrites the
  original note, becomes a study guide, searches a course, or fills gaps with
  general knowledge.
- These states preserve annotation-backed app behaviour. When an older drawing
  differs from a later app annotation, the later ruling is retained and the
  eventual implementation brief must reconcile it explicitly rather than
  deleting it for screenshot fidelity.

### Appearance

All three treatments use the literal Materials ladder: page `#211e1a` → solid
panel `#2b2722` → dense source/input object `#322e28` or recovery inset
`#262320`; borders `#3c352d`; outer panels `16px`; inner objects `13px`.
Only a surface floating above the class banner may be glass. Focus is visible,
hover is quiet, and `prefers-reduced-motion` resolves directly.

| Variant | Layout and hierarchy | Why it is distinct |
| --- | --- | --- |
| **A · Anchored source map** | Selected artifact locks at the upper-right of the source map. Five source paths occupy the map; selected sources form a compact adjacent tray; a narrow right rail explains the artifact path. | Preserves the existing source-map grounding metaphor and makes the result destination visually explicit. |
| **B · Artifact-first workbench** | Chosen artifact sits in the header. Five varied compact input objects surround a wide selected-source tray; the explanatory rail disappears. | Makes source collection the dominant task while retaining the selected output as a fixed badge. It avoids a wall of identical file rows. |
| **C · Contextual intake sheet** | A bounded solid sheet floats over the Materials shelf. Its artifact label and source count lead; source objects compress above a two-column selected-source tray. | Reads as a temporary focused action, not a new Materials subtab or a permanent toolbar. At narrow widths it becomes the content column without changing order. |

### Implementation selection — A · Anchored source map (Aug 21, 2026)

**A · Anchored source map** is the implementation source of truth for the
output-first intake family. The selected artifact remains fixed at the right of
the source map, the five contextual input paths remain visible in the map, and
the selected-source tray stays immediately adjacent. The narrow route rail is
retained because it makes the evidence boundary and the next artifact-specific
step legible without adding a generator-tab row.

This choice applies to `study-guide-intake`, `flashcards-intake`, and
`revised-notes-intake`. The recovery views inherit the same anchored hierarchy:
they retain the requested artifact and source identity before showing one safe
next action. Variants B and C remain available in the lab as comparison
records, but they are not implementation directions.

The eventual app implementation still translates the dark mockup's visual
roles through `src/index.css` tokens and separately measures light and dark
themes. It does not copy the mockup's inline colors, radii, type, or spacing.

The new product views are `study-guide-intake`, `flashcards-intake`,
`revised-notes-intake`, `source-not-ready`, and `no-eligible-source`. They
share the same source grammar; their labels change only to make the artifact’s
real boundary clear. No fake course facts, grades, readiness, model confidence,
scores, rankings, progress, scheduling, full-textbook upload, or external
source lookup appears in any treatment.

### Responsive and state treatment

- At narrow width, source paths become a two-column grid and then stack;
  provenance remains adjacent to source identity. Variant C’s sheet becomes
  the full content column rather than creating a nested scrolling region.
- `source-not-ready` preserves the attached file identity and offers only
  **Paste readable text** or **Choose another source**. It never invents a
  preview or silently treats the file as evidence.
- `no-eligible-source` preserves the requested output and presents only the
  allowed paths into grounded material. It contains no starter deck, generated
  content, or course lookup.

## Flashcards V1 extension

### Behaviour

- **Artifact choice** follows the existing source-selection state. The same selected material nodes feed Revised Notes, Study Guide, or Flashcards V1; it is not a second generator home.
- **Flashcards preview** may read only the selected student-supplied class materials and keeps their provenance beside the deck. It shows the deck mix and a single readable card so a student can check the retrieval surface before export.
- The card answer is concise. Its Extra uses an `Ex:` line as a subordinate, familiar relation to help picture a hard idea; it does not re-explain the answer, become another tested target, or become slangy.
- **Export handoff** offers `.apkg` first and TSV second. Export is one way: Premed OS never imports, syncs, schedules, or reports Anki review state. Anki remains the card-review owner.
- **Needs sources** preserves selection and names the missing condition. It never invents a deck, card count, source, or successful export; the next route is back to source selection.

### Appearance

- These are nested states within the same Materials banner and quiet tool-row, not additional class tabs. The source map remains the grounding metaphor; after it, a three-choice artifact panel keeps Revised Notes visually first while Study Guide and Flashcards remain equally legible alternatives.
- Warm-dark ladder is literal: page `#211e1a`, panel `#2b2722`, inner card `#322e28`, border `#3c352d`; panels use the 16px card radius and inner objects use the 13px class-card radius. Blue uses `#4b9cd3`, success `#6fc0a8`, and warning `#e7b06a` only for semantic emphasis.
- The preview keeps one generous card at the center and a narrow provenance/type rail. A quiet angled generated stamp proves source attachment without competing with the card. Export is a single centered handoff card with `.apkg` visibly primary and TSV secondary.
- All surfaces are solid-with-depth. The shared banner alone may use glass because it floats over banner art. Hover and view changes use the shared short ease-out treatment; reduced motion resolves directly to the final selected state.
- Reader controls use `:focus-visible` and the shared `0.15s cubic-bezier(.16,1,.3,1)` motion language; the reduced-motion rule resolves every reader mode directly.

## Assessment material states

### Behaviour

- **Actual material** is a compact, course-private catalog. Each row carries a confirmed scope plus exactly one source/permission condition: instructor-provided, publicly posted, my returned work, or unknown origin. Unknown-origin material stays private and cannot become an implied shared bank.
- **Timed attempt** is visibly based on one named item with its unit scope and time boundary. It records an attempt; it never forecasts a course exam or creates a readiness score.
- **Return & mistakes** stores the actual result with its material source. One optional AcademicMistake capture uses the locked causes `didnt-know`, `knew-it-but-blanked`, `misread-the-question`, `arithmetic`, `ran-out-of-time`, and `wrong-method`; leaving a miss unclassified is always valid. History remains a transparent record only.

### Appearance

- The three views remain nested inside the existing Materials banner and quiet tool row. The catalog uses a narrow evidence rail and a solid, vertically scannable source list; timed work uses a generous question stage with a compact context rail; return uses two equal-height solid panels.
- The warm-dark ladder is literal: page `#211e1a`, panels `#2b2722`, dense inner objects `#322e28`, and borders `#3c352d`; panels use 16px radii and dense objects 13px. Glass is absent because none of these surfaces floats above the banner.
- On a narrow desktop the rails stack below their primary stage, keyboard focus is visibly outlined, and reduced motion resolves directly to the selected state rather than sliding the stage.
