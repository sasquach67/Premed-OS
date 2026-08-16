# Overview Tasks — state coverage

**Status:** APPROVED · **Scope:** Overview task widget and its existing expanded route.

## Behaviour

- The widget and `/overview/tasks` are one task list at two sizes. `↗` adds room; it does not create another task system.
- `＋ Add task` is the only create path. There is no inline quick-add row.
- Rows expose task fields through the shared CenterPeek. Context-menu items have visible equivalents. Check-off moves a general task to Done with Undo.
- Timeline-owned steps can appear in Soon, are visually distinct, and cannot be deleted here.

## Appearance

- **One treatment only.** This is a state board, not three competing layouts: the approved bento Task panel remains the parent composition.
- The working list uses compact solid rows, warm left-border only for Important, and the blue underline as the active-tab indicator.
- The peek is a quiet solid card beside the widget, making its relationship clear without posing as a new page.
- Empty Soon is a centered one-liner, not a blank panel or an invented task.

## Deliberately absent

No Focus strip, Later tab, assignment rows, quick-add field, progress percentage, or second task surface.
