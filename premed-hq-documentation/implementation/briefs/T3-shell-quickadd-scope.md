# T3 · Shell — Quick Add scope, and the task category defect

**Stage:** Not a ladder stage. This is **drift repair** found while reviewing Quick Add
against `00-product-shell.md` §7.4 and `03-overview.md` §6.4. Same shape as
`S-0-DRIFT-SWEEP.md`: the screens exist and look right, and their behaviour is wrong.

**Scope:** `src/components/layout/QuickAddDialog.tsx`, `src/components/layout/shellActions.ts`,
`src/components/overview/OverviewTasks.tsx`, and one new shared constants module.
No mockup work. No new surface. Nothing moves position on screen.

---

## 0. Decision required before executing

**One question, and the brief runs either way. Option A is the default — if Andy says
nothing, execute A.**

When Quick Add is opened from the **top bar `＋`** or the **`q` key** — with no type
specified — what appears first?

| | Behaviour | Argument |
|---|---|---|
| **A — picker first** ⭐ *default* | The 9-type grid appears, with the route's contextual type listed first and pre-highlighted. One click reaches the form. | Literal reading of §7.4: *"Two-step max: pick type (skipped when invoked prefilled) → minimal form."* Not prefilled ⇒ the pick step happens. Keeps all nine record types discoverable. |
| **B — context default, changeable** | The form opens directly on the contextual type, and a `Change type` control remains available **only** in this ambient case. | Keeps the common case one step. Closer to today's behaviour. Costs discoverability: eight of the nine types stay behind a secondary control. |

**Everything else in this brief is identical under both options.** If B is chosen, the only
change is that §2.2's `Change type` removal becomes conditional rather than total —
one line, marked inline below.

---

## 1. Fidelity audit — completed before this brief

### a. What is built and must NOT be rebuilt

| Thing | Where | Status |
|---|---|---|
| The Quick Add dialog itself | `QuickAddDialog.tsx` | Built and correct in structure. Do not rewrite it. |
| Shell action context | `shellActions.ts`, `ShellActionsProvider.tsx` | Built. `openQuickAdd(kind?)` already carries the distinction this brief needs. |
| Top bar placement | `Topbar.tsx:83–89` | Built and **matches `00-product-shell.md` §120** — demo badge → `LiveStatusChip` → Quick Add → bell → theme. Do not reorder. |
| Six palette actions | `CommandSearch.tsx:36` | Built. Each passes an explicit kind. Do not change what they pass. |
| Tasks panel, Now/Soon/Done, star, reorder, kebab menu | `OverviewTasks.tsx` | Built to spec. Untouched by this brief except where named in §2.3. |
| `CreateExperienceDialog` branch | `QuickAddDialog.tsx` | Built. `activeKind === 'experience'` routes to its own dialog. Preserve exactly. |

### b. The three findings

**F1 — a tab-owned button opens a shell-owned picker.**
`OverviewTasks.tsx:137` calls `openQuickAdd('task')`, and the dialog renders a
`Change type` control in the form header. A button labelled **`＋ Add task`**, inside the
Tasks panel, can therefore create a School, an MCAT mistake, or a Course.

`03-overview.md:187` rules: *"Task creation is a regular `＋ Add task` button in the panel
header … **It opens the standard create form.**"* A nine-type router is not the standard
create form.

**F2 — the type picker is currently unreachable except through `Change type`.**
`QuickAddDialog.tsx:68`:

```ts
const activeKind = choosing ? kind : (kind ?? quickAddKind ?? contextKind(location.pathname))
```

`contextKind()` returns a kind for **every** route — it ends `return 'task'`. So `activeKind`
is never `undefined` on open, the `!activeKind` picker branch never renders, and the top bar
`＋` goes straight to a form. The nine tiles exist only behind `Change type`.

> ⚠️ **This is why F1 cannot be fixed by deleting `Change type`.** Doing that alone would
> make eight of nine record types unreachable from the shell and silently break the
> §7.4 contract. F1 and F2 must be fixed together.

**F3 — the task form's "Details" field is secretly the category field.**
In the `activeKind === 'task'` branch of `submit()`:

```ts
addItem('tasks', { id, title: title.trim(), type: detail.trim() || 'Task', … })
```

`TaskItem.type` is the **category**. `OverviewTasks.tsx:330` proves it:

```ts
function setCategory(category: string) { patchItem('tasks', task.id, { type: category }) }
```

…and that menu offers a fixed eight (`OverviewTasks.tsx:67`):
`Personal · Application · Advising · MCAT · Academics · Clinical · Letters · Essays`.

`TaskType` is `export type TaskType = string` — nothing constrains it. So today:

- typing `email Dr. Chen about the letter` into **Details** produces a task whose
  **category** is `email Dr. Chen about the letter`;
- leaving Details blank produces the literal category `Task`.

`03-overview.md:168` rules that field as a **per-pillar coloured badge**
(*"category tag (`Badge`, per-pillar color: MCAT / Academics / Clinical / Letters / Essays…)"*),
and §177 lists category among the fields that must edit from the widget. A free-text input
writing into a controlled, colour-mapped vocabulary is a data defect, not a labelling one.

`TaskItem` already has `notes?: string` — that is where free text belongs.

### c. Gate

`BUILD-MANIFEST.md` is not consulted. **No mockup is being translated** — this brief changes
behaviour on screens already cleared and shipped. Nothing here needs a manifest row.

### d. Integrations

None. No service, key, scope, or console configuration is involved.

---

## 2. The work

### 2.1 Separate explicit prefill from ambient invocation

The distinction already exists in the data and is simply not read: **`quickAddKind` is set
only by explicit callers.** `Topbar.tsx:50` and `Topbar.tsx:86` both call `openQuickAdd()`
with no argument; `CommandSearch.tsx:36` and `OverviewTasks.tsx:137` always pass one.

So the predicate is:

```ts
const prefilled = quickAddKind !== undefined
```

Do **not** add a new flag to `shellActions.ts` unless the implementation genuinely cannot
read `quickAddKind` where it needs to. Prefer the existing field.

**Under option A**, change the resolution so an ambient open lands on the picker with the
contextual kind surfaced rather than silently applied:

- ambient (`!prefilled`) → picker renders; `contextKind(pathname)` determines which tile
  sorts first and carries a pre-highlighted state; the label stays honest
  (e.g. a `Suggested` micro-label), never a fake selection;
- explicit (`prefilled`) → form renders directly on `quickAddKind`.

**Under option B**, leave resolution as it is and only gate `Change type` on `!prefilled`.

### 2.2 Remove `Change type` from prefilled invocations

The control in the form header currently reads:

```tsx
<Button … onClick={() => { setKind(undefined); setChoosing(true) }}>Change type</Button>
```

- **Option A:** remove it entirely. The picker is now reachable ambiently, so the escape
  hatch has no job.
- **Option B:** render it only when `!prefilled`.

Either way, `＋ Add task`, `New course`, `Log hours`, `New school`, `New story`, and the
other palette actions land on a form that creates exactly what their label says.

### 2.3 Give the task form a real category select

**Extract the vocabulary.** `CATEGORIES` is currently a module-local array in
`OverviewTasks.tsx:67`. Move it to a new `src/lib/taskCategories.ts`, export it, and import
it in both `OverviewTasks.tsx` and `QuickAddDialog.tsx`. **One source, two readers** — do not
duplicate the literal.

**Rebuild the task branch of the form** to carry the fields the spec says a task has:

| Field | Control | Writes to |
|---|---|---|
| Title | `Input`, required, autofocus | `title` |
| Category | `Select` over the shared list | `type` |
| Due date | existing `DateField` | `deadline` |
| Notes | `Textarea` | `notes` |

**The category default** comes from the route, mirroring §7.4's context-sensitive defaults:
`/mcat` → `MCAT`, `/academics` → `Academics`, `/clinical` → `Clinical`, `/letters` → `Letters`,
`/essays` → `Essays`, everything else → `Personal`. Never default to the string `Task`.

**Do not migrate existing records.** Tasks already carrying an off-list `type` keep it —
rewriting stored user data is out of scope, and the row kebab menu already offers the fixed
list as a correction path. Say so in the commit body; do not add a migration.

**Only the `task` branch changes.** Course, assignment, hour-log, school, story, note, and
mistake branches keep their current fields and write paths exactly.

---

## 3. References

- `premed-hq-documentation/specifications/00-product-shell.md` §7.3 (palette actions),
  **§7.4 (Quick Add contract)**, §7.6 (`q`), §7.7 (top-bar order), §120 (right cluster).
- `premed-hq-documentation/specifications/03-overview.md` **§168** (row anatomy, category
  badge), **§177** (widget field parity), **§187** (`＋ Add task` ruling).
- `premed-hq-documentation/implementation/briefs/S6-tasks-to-overview.md` §2a — the
  field-by-field parity table §177 points at.
- `src/lib/types.ts` — `TaskItem`, `TaskType`.
- `premed-hq-documentation/specifications/01-shared-interface-patterns.md` §105 — Quick Add
  owns *creation*; that section governs *editing*.

---

## 4. Do not break

- **Do not move anything in the top bar.** Placement already matches §120.
- **Do not change what the six palette actions pass.** They are correct.
- **Do not touch the `experience` branch** or `CreateExperienceDialog`.
- **Do not remove the toast** with `Open` (deep link) and `Undo`, required by §7.4.
- **Do not add a second write path.** §7.4: creation writes through the same store actions
  the owning pages use. Keep using `addItem`.
- **Do not break the keyboard route.** §7.4 requires ⌘K → *"new task"* → Enter to work
  end-to-end without a pointer. Under option A the picker is now in that path — it must be
  arrow-navigable and Enter-selectable, and `Esc` must still close per §7.6's overlay stack.
- **Do not introduce a category not in the shared list**, and do not let free text reach `type`.
- No U-9 violations. Nothing here scores, ranks, or measures anything.

---

## 5. Done when

- `rg -n "Change type" src/` returns **nothing** (option A), or returns exactly one
  occurrence guarded by `!prefilled` (option B).
- `rg -n "type: detail" src/` returns **nothing** — free text no longer reaches the category.
- `rg -n "CATEGORIES" src/` shows the constant defined **once**, in `src/lib/taskCategories.ts`,
  and imported by `OverviewTasks.tsx` and `QuickAddDialog.tsx`.
- `rg -n "\|\| 'Task'" src/` returns nothing.
- From the Tasks panel, `＋ Add task` cannot produce any record that is not a task.
- From the top bar `＋`, all nine record types are reachable.
- ⌘K → *new task* → Enter creates a task with no pointer.
- A task created from Quick Add shows a real category badge in the Tasks row, coloured per
  §168, identical to one set from the kebab menu.
- `npm run build` clean; existing tests pass.

---

## 6. Commit

```
fix(shell): scope Quick Add to its caller and constrain task category
```

Commit body should note that pre-existing tasks with off-list categories are intentionally
left as-is. Commit only the files named in §2 — the working tree has unrelated dirty files
that must not be swept in.

---

## 7. Not in scope

- **The §120 vs §316 top-bar ordering conflict.** §120 says
  `LiveStatusChip → Quick Add → bell → appearance`; §316 says
  `Quick Add → bell → LiveStatusChip → appearance → overflow menu`, and also lists an
  overflow menu (profile, Ultimate Guide, Help, Settings, Export data) that is absent from
  `Topbar.tsx`. The code follows §120. **This is a spec-versus-spec conflict and only Andy
  resolves it.** It does not block this brief — nothing here reorders the top bar.
- `tabs/11-timeline-tasks.md:20` still describes Overview's task surface as having an
  *"inline quick-add"*, superseded by `03-overview.md:187`. Documentation drift, no code
  impact; fix it in a docs pass, not here.
- Any change to the other eight record types' forms.
