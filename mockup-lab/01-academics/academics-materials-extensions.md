# Academics · Materials extensions — decisions

**Status:** PROPOSED · Stage-A coverage

## Product views

| View | Job |
|---|---|
| Resource catalog | File real assessment material by unit and source permission. |
| Calendar feed | Explain the low-cost Canvas → Google Calendar handoff and review proposed changes. |
| Study guide | Select only student-supplied sources before requesting a generated artifact. |

## Behaviour

- This extends the existing **Materials** tab; it never adds a sixth class tab.
- Canvas is read-only calendar context: no Canvas token, no write action, and no silent overwrite. A connected course with no items is ordinary.
- Catalog entries keep their source/permission. Unknown-origin material remains private.
- Generation cannot run without selected student-supplied course material. Its output retains source links and a generated ownership marker.

## Appearance

- The shared Class Hub banner and Materials underline establish place. Below it, the three view chips are quiet tools—not another tab system.
- **Resource catalog** is a material shelf: a narrow unit spine at left, a selected-unit canvas of compact object tiles at center, and one restrained empty-state rail. The hierarchy is unit → material → provenance, so the source badge is visible without turning every item into a long row.
- **Calendar feed** is a left-to-right handoff trail. Its vertical event thread makes the calendar source, one proposed change, and the student-controlled course record feel sequential rather than like three settings cards.
- **Study guide** is a source map. Small selected material nodes converge into a single source-linked output node; the linework expresses grounding without claiming that the model knows more than the inputs.
- Dense material surfaces are solid-with-depth. The banner is the only floating/glass region. The course-blue bloom is used only for source selection and the active view.

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

- **Artifact choice** follows the existing source-selection state. The same selected material nodes feed either a study guide or Flashcards V1; it is not a second generator home.
- **Flashcards preview** may read only the selected student-supplied class materials and keeps their provenance beside the deck. It shows the deck mix and a single readable card so a student can check the retrieval surface before export.
- The card answer is concise. Its Extra uses an `Ex:` line as a subordinate, familiar relation to help picture a hard idea; it does not re-explain the answer, become another tested target, or become slangy.
- **Export handoff** offers `.apkg` first and TSV second. Export is one way: Premed OS never imports, syncs, schedules, or reports Anki review state. Anki remains the card-review owner.
- **Needs sources** preserves selection and names the missing condition. It never invents a deck, card count, source, or successful export; the next route is back to source selection.

### Appearance

- These are nested states within the same Materials banner and quiet tool-row, not additional class tabs. The source map remains the grounding metaphor; after it, a two-choice artifact panel keeps study guide primary and Flashcards clearly alternate.
- Warm-dark ladder is literal: page `#211e1a`, panel `#2b2722`, inner card `#322e28`, border `#3c352d`; panels use the 16px card radius and inner objects use the 13px class-card radius. Blue uses `#4b9cd3`, success `#6fc0a8`, and warning `#e7b06a` only for semantic emphasis.
- The preview keeps one generous card at the center and a narrow provenance/type rail. A quiet angled generated stamp proves source attachment without competing with the card. Export is a single centered handoff card with `.apkg` visibly primary and TSV secondary.
- All surfaces are solid-with-depth. The shared banner alone may use glass because it floats over banner art. Hover and view changes use the shared short ease-out treatment; reduced motion resolves directly to the final selected state.
