# T1 · Academics → Class Center — mockup to app

**Read only this file plus §2's references.** If something you need isn't here, read the named spec section and **say the brief was incomplete.**

> ## ⭐ This brief is also the TEMPLATE
>
> **The workflow, one tab at a time:** cross-reference spec against the variant lab so every specced feature exists on paper → **then one brief carrying frontend and backend together** → then build.
>
> **Every future tab brief follows this shape:** §1 fidelity audit · §2 references · §3 frontend from the mockup · §4 backend behind it · §5 do-not-break · §6 done-when · §7 commit.
>
> **Why frontend and backend ship together:** building behaviour first and appearance later is how the *"recurring visual-fidelity gap"* in `briefs/README.md` happened — twice. **A screen is done when it works AND looks like the drawing.**

---

## 1. Fidelity audit — what is already correct, and do not rebuild it

**⚠️ Most of this tab is built. Verify before changing anything.**

| Surface | State |
|---|---|
| **Empty state / cold start** | ✅ **BUILT** (`cb963a3`) and matches approved Variant A — centred `MascotNote`, `Import syllabus` primary, `Add manually` as a quiet link beneath, three-item explanation grid |
| **Syllabus parsing, apply, re-import, migration** | ✅ **BUILT** and tested. **Behaviour is correct. Do not touch the logic.** |
| **🔴 Syllabus review screen — appearance** | **NEVER TRANSLATED FROM THE MOCKUP.** This is the work |

**The gap, precisely:** `academics-syllabus-import.md` documents **only behaviour** — pasted text first-class, client-side parsing, review order, quoted source lines, weight gap, re-import diff. **Zero visual decisions.** So the implementation used a bare `<details>` element and stock inputs, while the mockup carries a designed vocabulary: `.ghead` · `.gsum` · `.gright` · `.gicon` · `.irow` · `.iname` · `.ival` · `.src`.

**Nothing is broken. The screen simply does not look like the approved drawing** — and it is the one screen a beta tester spends real time on.

## 2. References

| What | Where |
|---|---|
| **Mockup — the visual source of truth** | `specifications/mockups/01-academics/academics-syllabus-import.html` |
| Its decisions | `…/academics-syllabus-import.md` — **behaviour only; visual intent lives in the HTML** |
| Empty-state mockup + decisions | `…/academics-empty-states-prototype.html` · `.md` — **Variant A approved** |
| **Exact values — used literally, never approximated** | `specifications/mockups/_shared/_visual-recipes.md` |
| Behaviour spec | `tabs/01-academics.md` §4.1-M → §4.1-M-d |
| Components | `implementation/component-inventory.md` |
| Universal rules | `general.md` — **`U-1`, `U-5`, `U-8`, `U-9`** |

**Build gate:** `BUILD-MANIFEST.md` line 82 clears `academics-syllabus-import.html` **`YES`**. Empty states are cleared too. **Nothing else in this brief is authorised.**

---

## 3. FRONTEND — build the review screen from the mockup

**The screen is currently an inline JSX blob inside `ClassCenter.tsx` (2,600+ lines). Extract it into its own component while translating it.**

### Group headers — the mockup's `.ghead` treatment

Each proposal group gets the mockup's header, not a bare `<summary>`:

- **`.gicon`** — the group's icon
- **`.gtitle`** — the group name
- **`.gsum`** — the summary line (*"12 deadlines · all confident"*)
- **`.gright`** — the count and confidence state

**Preserve the ruled behaviour exactly:** clean groups collapsed, **any group holding a low-confidence item expanded by default**.

### Item rows — `.irow`

- **`.iname`** and **`.ival`** as the mockup lays them out
- **`.src`** for the quoted source line — **this is the element that makes confirmation meaningful rather than ceremonial.** It carries the quote and the page or line reference and **must be visually distinct from the value itself.**
- **Low-confidence items keep a visible flag**, styled per the mockup, and stay inline-editable

### The rest

- **Weight-gap warning** — mockup's treatment. **Still states the gap and still never normalises.**
- **Scan-detected message** — mockup's treatment.
- **Empty groups** — *"No attendance policy found"* stays **visible**, with its `Add manually` affordance.
- **Apply button** — states its consequence with live counts, per the mockup.

### Rules

- **Reuse `AnimatedFileUpload`. Do not fork it.**
- **`_visual-recipes.md` values are used literally.** Do not eyeball a colour or a radius.
- **⚠️ Do not add a completeness score, percentage, or quality bar** — `U-9`. If the mockup implies one, the rule wins and **flag the conflict**.

---

## 4. BACKEND — the one behavioural change (`D9b`)

**Everything else is built. This is the only logic change in this brief.**

**Make Add-a-class an actual fast path.** Today `Create & import syllabus` creates the class from typed fields, then imports scoped. The student types course code, title, and term — **all on page one of the syllabus.**

- **Put the syllabus affordance at the TOP of the Add-a-class dialog**, above the fields, with manual entry visible below — **`§4.1-M-a`: "offered as the fast path, with manual entry always beside it."**
- **It opens the import UNSCOPED**, like cold start. The syllabus supplies the course code and title; *"Which class is this?"* renders prefilled; the `Course` and `ClassWorkspace` are created **on apply**.
- **Keep `Create & import syllabus`** for the typed-then-attach case. Different intent, both valid.

**⚠️ The failure mode this introduces: an orphan class.** Nothing may be created before Apply. **Cancelling mid-review must leave the class list unchanged.**

---

## 5. Do not break

- **Cold start stays unscoped.** Entries 2 and 3 stay scoped and reuse `courseId` — `existingCourseId ?? uid()`. **No scoped path creates a second class.**
- **All parsing stays client-side. No file bytes leave the device.**
- **The parser stays key-free** (`U-2`).
- **Weights show the gap and are never normalised.**
- **Re-import: changed and removed default to Keep. Exactly one diff function exists.**
- **`Add manually` appends to its own group** and leaves the rest of the proposal intact.
- **`useToast` only.** No second toast system (`S9` F9).

## 6. Done when

**Frontend**

- [ ] The review screen is **its own component**, not inline in `ClassCenter.tsx`.
- [ ] Group headers use the mockup's icon / title / summary / count treatment.
- [ ] **Source quotes render in the mockup's `.src` treatment, visually distinct from values.**
- [ ] Clean groups collapsed; **any group with a low-confidence item expanded.**
- [ ] Weight gap, scan message, empty groups, and Apply all match the mockup.
- [ ] **`_visual-recipes.md` values used literally** — verified by reading the file, not by eye.
- [ ] **No completeness score, percentage, or quality bar exists** (`U-9`).
- [ ] Empty state still matches approved Variant A.

**Backend**

- [ ] Add-a-class offers the syllabus path **above** the fields; manual entry visible below.
- [ ] It opens **unscoped**; *"Which class is this?"* is prefilled from the parsed code.
- [ ] **Cancelling mid-review leaves no orphan class** — verified by cancelling and checking the class list.
- [ ] `Create & import syllabus` still works and is still hidden when editing an existing class.

**Both**

- [ ] Full suite and production build pass.
- [ ] **Verified against a real syllabus PDF**, not fixtures.

## 7. Commit

```
feat(academics): translate syllabus review screen from mockup, add fast path (§4.1-M)
```

**Unrelated working-tree changes commit separately.** ⚠️ The tree currently holds ~89 uncommitted items across six concerns — **none belongs in this commit.**
