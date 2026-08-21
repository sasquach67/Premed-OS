# Academics · Materials extensions — decisions

**Status:** PROPOSED · Stage-A coverage

## Product views

| View | Job |
|---|---|
| Resource catalog | File real assessment material by unit and source permission. |
| Calendar feed | Explain the low-cost Canvas → Google Calendar handoff and review proposed changes. |
| Study outputs | Select only student-supplied sources, then choose Revised Notes, Study Guide, or Flashcards. |
| Material reader | Inspect an attached local document or hand off to its owned external provider without losing the class, unit, ownership, or topic context. |

## Behaviour

- This extends the existing **Materials** tab; it never adds a sixth class tab.
- Canvas is read-only calendar context: no Canvas token, no write action, and no silent overwrite. A connected course with no items is ordinary.
- Catalog entries keep their source/permission. Unknown-origin material remains private.
- Generation cannot run without selected student-supplied course material. Every output retains source links and a generated ownership marker.
- **Revised Notes** is a distinct generated artifact: it reconciles the selected slides, transcript, and the student's notes into one coherent lecture record. It preserves course vocabulary; when the selected sources do not settle a detail, it names that uncertainty rather than filling it with general knowledge.
- **Study Guide** is a distinct study-oriented organization of selected material. It does not replace Revised Notes or become an ungrounded textbook chapter.
- **Flashcards** remain a one-way Anki export artifact. They do not schedule, review, or import cards back into Premed OS.
- **Material reader** opens from the existing catalog and stays inside Materials. Local preview, provider handoff, and an unavailable embed are three recoverable reader modes—not three new pages or alternate ownership models. An unavailable provider leaves the material record, course position, and linked topics intact; it never produces copied or generated replacement content.

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
- The reader uses the literal warm-dark ladder: page `#211e1a` → solid panel `#2b2722` → document-stage/object `#262320` / `#322e28`, with `#3c352d` borders, 16px panels, and 13px inner objects. Source preview paper is deliberately neutral and contained; it is illustrative framing, never invented course content.

## Component translation

- Use the existing `ThreeLevelNav` / Tabs owner for the class hierarchy, `ResourceGrid` for catalog objects, and `AnimatedFileUpload` for adding a real file.
- The resource shelf borrows 21st.dev’s information-density approach only; it does not introduce another card or grid owner.
- Calendar review is a configured `InteractiveCard`/`CenterPeek` decision surface when it needs detail. Animate UI is a motion reference for the view transition, re-skinned to the Premed OS tokens.

## States

- Catalog shows populated sources, an explicit unknown-origin private treatment, and the first-action empty rail.
- Calendar feed shows the handoff, a date conflict that must be reviewed, connected-but-empty, and the non-destructive disconnect consequence. Its unavailable state is a reconnect recovery: no date changes, no broken class record, and no implication that Canvas is writable.
- Study guide shows selected sources and the no-eligible-material recovery. Its result keeps a narrow provenance rail with every selected source reachable from the generated material. Its unavailable state happens only after source selection and preserves those selections; it never substitutes general course content.

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
