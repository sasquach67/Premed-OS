# Academics · Materials extensions — decisions

**Status:** PROPOSED · Stage-A coverage

## Product views

| View | Job |
|---|---|
| Resource catalog | File real assessment material by unit and source permission. |
| Calendar feed | Explain the low-cost Canvas → Google Calendar handoff and review proposed changes. |
| Study outputs | Select only student-supplied sources, then choose Revised Notes, Study Guide, or Flashcards. |
| Material reader | Inspect an attached local document or hand off to its owned external provider without losing the class, unit, ownership, or topic context. |
| Folder intake | Preview a user-selected local course folder, then confirm only the material positions the student accepts. |
| Watched notes | Explain the one-way backup-folder mapping once, then ask again only when a source path is genuinely new or unclear. |

## Behaviour

- This extends the existing **Materials** tab; it never adds a sixth class tab.
- Canvas is read-only calendar context: no Canvas token, no write action, and no silent overwrite. A connected course with no items is ordinary.
- Catalog entries keep their source/permission. Unknown-origin material remains private.
- Generation cannot run without selected student-supplied course material. Every output retains source links and a generated ownership marker.
- **Revised Notes** is a distinct generated artifact: it reconciles the selected slides, transcript, and the student's notes into one coherent lecture record. It preserves course vocabulary; when the selected sources do not settle a detail, it names that uncertainty rather than filling it with general knowledge.
- **Study Guide** is a distinct study-oriented organization of selected material. It does not replace Revised Notes or become an ungrounded textbook chapter.
- **Flashcards** remain a one-way Anki export artifact. They do not schedule, review, or import cards back into Premed OS.
- **Material reader** opens from the existing catalog and stays inside Materials. Local preview, provider handoff, and an unavailable embed are three recoverable reader modes—not three new pages or alternate ownership models. An unavailable provider leaves the material record, course position, and linked topics intact; it never produces copied or generated replacement content.
- **Folder intake** is deliberate local selection, not a file-system claim. Premed OS can preview a selected course folder beside the regular individual-file fallback, but it never moves, renames, edits, or otherwise changes the original folder. It proposes Material positions; applying the review updates only accepted Premed OS metadata.
- **Folder review** is keep-by-default for anything uncertain. A route with evidence can be confirmed. A file with no unambiguous week is marked **Confirm week** or kept unfiled; it is never put in a semester-wide Misc / Loose Ends bucket and it is never silently overwritten.
- **Watched notes** are one-way only. A student may later connect a folder created by GoodNotes Auto Backup, Notability, OneNote, Google Drive, Dropbox, or OneDrive; Premed OS reads/imports new notes as `Mine` and never writes back. The drawing is an awaiting-connection setup state, not a fake live provider account.
- **Mapping confirmation** makes one inferred pattern visible as `class → week → category → document`. The student confirms that pattern once or chooses **Review each import instead**. It re-asks only for a genuinely new course folder or an unguessable segment; a recognised class with no defensible week remains **Confirm week**.

### Revised Notes generation contract

The implementation prompt stays short and restrictive:

> Create one accurate, readable lecture-note document from only the selected
> student-supplied sources. Preserve the instructor's terms and distinctions.
> Reconcile a gap only when another selected source supports it. When sources
> conflict or do not settle a detail, label the uncertainty. Do not add outside
> course knowledge. Keep a source trace beside every merged passage.

This is deliberately a record-repair task, not a second explanation engine or
a general knowledge lookup.

## Appearance

- The shared Class Hub banner and Materials underline establish place. Below it, the three view chips are quiet tools—not another tab system.
- **Resource catalog** is a material shelf: a narrow unit spine at left, a selected-unit canvas of compact object tiles at center, and one restrained empty-state rail. The hierarchy is unit → material → provenance, so the source badge is visible without turning every item into a long row.
- **Calendar feed** is a left-to-right handoff trail. Its vertical event thread makes the calendar source, one proposed change, and the student-controlled course record feel sequential rather than like three settings cards.
- **Source selection** is a source map. Selected slides, notes, and transcript nodes converge into a single **Choose an output** node; the linework expresses grounding without claiming that the model knows more than the inputs.
- **Choose an output** is a compact three-choice triad, not a dropdown and not a second generator home: Revised Notes leads because it is the lecture-record repair path, with Study Guide and Flashcards alongside it. On narrow screens the triad becomes a two-up and then one-column sequence without changing its order.
- **Revised Notes result** uses the same paper-and-provenance layout as the generated guide so source access cannot drift. A short stitched passage shows the practical job: join a slide term, a student note, and a transcript moment without obscuring where each came from.
- Dense material surfaces are solid-with-depth. The banner is the only floating/glass region. The course-blue bloom is used only for source selection and the active view.
- **Material reader** is a bounded document stage beside a narrow provenance rail. The source stays visually dominant; the rail carries the unit route, ownership, linked topics, and the route back to the module. The provider-handoff state replaces only the document stage, so the class context does not disappear. At mobile width, the rail stacks after the source stage and its actions stay in the same order.
- **Folder intake** is a three-part safety composition: a narrow local-source tree, a central course-position board in week order, and a compact review rail. This prevents a multi-file import from becoming another wall of identical file rows. The central board makes proposed placement visible before the student is asked to accept it.
- **Folder review** becomes a single broad decision sheet: file identity at left, the proposed class/week path in the center, and Confirm / Keep unfiled actions at right. At narrow width, that order stacks without losing the proposed path between the file and its decision.
- **Watched notes** use a path-to-placement map rather than a provider settings card. Solid path segments converge in one left-to-right line; matched class, week, and category use restrained semantic color, and the one-time confirmation is the only dominant action. The side rail keeps the awaiting-connection status and backup caveats subordinate.
- **Mapping exception** uses two equal, bounded cards for the only two questions that should recur: a new course folder and an unguessable path level. The exception cards do not restart setup and do not resemble a dashboard.
- The reader uses the literal warm-dark ladder: page `#211e1a` → solid panel `#2b2722` → document-stage/object `#262320` / `#322e28`, with `#3c352d` borders, 16px panels, and 13px inner objects. Source preview paper is deliberately neutral and contained; it is illustrative framing, never invented course content.
- Folder and watched-note states use that same literal ladder: page `#211e1a` → solid `#2b2722` panels → `#322e28` decision objects / `#262320` recovery inset; `#3c352d` borders; 16px panels and 13px inner objects. The banner is still the only glass surface.

## Component translation

- Use the existing `ThreeLevelNav` / Tabs owner for the class hierarchy, `ResourceGrid` for catalog objects, and `AnimatedFileUpload` for adding a real file.
- The resource shelf borrows 21st.dev’s information-density approach only; it does not introduce another card or grid owner.
- Calendar review is a configured `InteractiveCard`/`CenterPeek` decision surface when it needs detail. Animate UI is a motion reference for the view transition, re-skinned to the Premed OS tokens.

## States

- Catalog shows populated sources, an explicit unknown-origin private treatment, and the first-action empty rail.
- Calendar feed shows the handoff, a date conflict that must be reviewed, connected-but-empty, and the non-destructive disconnect consequence. Its unavailable state is a reconnect recovery: no date changes, no broken class record, and no implication that Canvas is writable.
- Study guide shows selected sources and the no-eligible-material recovery. Its result keeps a narrow provenance rail with every selected source reachable from the generated material. Its unavailable state happens only after source selection and preserves those selections; it never substitutes general course content.
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
