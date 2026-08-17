# Academics · Materials extensions — decisions

**Status:** PROPOSED · Stage-A coverage

## Product views

| View | Job |
|---|---|
| Resource catalog | File real assessment material by unit and source permission. |
| Calendar feed | Explain the low-cost Canvas → Google Calendar handoff and review proposed changes. |
| Study guide | Select only student-supplied sources before requesting a generated artifact. |

## Behaviour

- This is an extension of the existing **Materials** tab, never a sixth class tab.
- Canvas is read-only calendar context: no Canvas token, no write action, no silent overwrite. A connected class with no items is ordinary, not an error.
- Catalog entries state source/permission; unknown-origin material is private and never shared.
- Generation is impossible without selected course material or the student’s own notes. Output keeps its source links and generated ownership marker.

## Appearance

- Reuses the existing Class Hub banner and blue Materials underline; the active view is a solid level-3 filter chip below it.
- Resource rows are dense solid surfaces, each with a 30px unit cell, source badge, and quiet metadata; only the banner floats.
- The safety rule is a restrained amber dashed note, never a blocking modal. The empty state is centered and singular, with one obvious recovery action.
- Normal laptop layout is a 1.35 / .65 split; it stacks on narrow screens without losing the source information.

## States

- Catalog: populated and unknown-origin private warning.
- Calendar feed: explain handoff, changed-date review, connected-but-empty, and disconnect result.
- Study guide: selected sources and no-eligible-material state. Provider failure remains a scoped error state in the later build brief.
