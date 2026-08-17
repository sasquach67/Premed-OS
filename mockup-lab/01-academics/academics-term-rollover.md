# Academics · Term rollover — decisions

**Status:** PROPOSED · Stage-A coverage

## Behaviour

- Opens at a term boundary from the completed-course/Planning transition, never as a standing tab.
- The course record always archives to Grades & Archive. Topic fates are separately pre-sorted: retire, carry for MCAT, or carry as a prerequisite.
- Bulk actions, `Pause everything`, skip/default, and one January re-offer keep the ritual under a minute. The user may later reverse any choice.
- Carried topics preserve their existing study state; no list is reset and nothing is deleted.

## Appearance

- This is a transition map, not a three-column dashboard: the completed course sits at the origin, a small connector expresses the irreversible ledger archive, and three adjacent fates receive the topics.
- Each fate is intentionally a narrow path with a distinct small directional mark. The visual hierarchy is origin → consequence → topics → quiet bulk action, rather than three equally loud rectangular cards.
- The archive promise is a thin boundary note beneath the flow. `Pause everything` is spacious and non-celebratory; the January re-offer is a small calendar reminder, not a modal wizard.
- Work surfaces remain solid-with-depth; the shared Academics banner is the only floating treatment.

## Component translation

- This is one bounded `AlertDialog` / `Collapsible`-capable transition flow owned by Academics—not a new wizard library.
- The flow geometry is a page-owned composition. SmoothUI/Animate UI can inform its compact enter/exit motion, but standard app buttons, confirmation behavior, and reduced-motion rules remain the implementation source of truth.

## Product views

`ritual` is the editable default, `paused` proves the reversible bulk exit, and `january` shows the single low-pressure re-offer.
