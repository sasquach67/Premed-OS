# D9b · Add-a-class — make entry point 4 an actual fast path

**Small, self-contained. Read only this file.** If something you need isn't here, read `tabs/01-academics.md` §4.1-M-a and **say the brief was incomplete.**

**⚠️ The syllabus backend is COMPLETE. Nothing below is a missing feature.** All four entry points, the re-import diff, weights, logistics, and the migration are built and shipping. **This is one behavioural refinement.**

---

## 1. What exists, and why it isn't quite what the spec asked for

`ClassCenter.tsx` has `Create & import syllabus` in the Add-a-class dialog. It calls `saveClass(true)`, which creates the class from the typed form, then sets `importFor=<newCourseId>` and opens the import **scoped** to it. That works and it is correct.

**But the spec calls entry point 4** *"the fast path, with manual entry always beside it."*

**As built, it is not faster.** The student types the course code, the title, and the term — **all of which are on page one of the syllabus** — and only then imports. The typing the feature exists to eliminate still happens.

> **`§4.1-M`'s own argument:** *"a student who must hand-enter nine units and twelve deadlines per course will do it once, for one course, in week one — and never again."* **The same logic applies to the three fields above.**

**Cold start already proves the pattern works** — it runs unscoped, and the review screen leads with *"Which class is this?"* prefilled from the parsed course code.

## 2. The change

**Put the import affordance at the TOP of the Add-a-class dialog, above the fields.**

```
┌─ Create class ────────────────────────────┐
│  Have the syllabus?                       │
│  [ Import it and fill this in ]  ← NEW    │
│  ───────────────────────────────          │
│  Course code   [____]                     │
│  Course title  [____]                     │
│  Semester      [____]                     │
│                                           │
│         [Cancel]  [Create]                │
└───────────────────────────────────────────┘
```

**Behaviour:**

- **`Import it and fill this in` opens the import UNSCOPED** — the same path cold start uses. The syllabus supplies the course code and title, the review screen's *"Which class is this?"* block appears prefilled, and the `Course` + `ClassWorkspace` are created on apply. **No class is created beforehand.**
- **The manual fields stay visible below it**, exactly as the spec requires — *"manual entry always beside it."*

**Keep `Create & import syllabus` for the case it is actually right:** the student has already typed the class identity and wants to attach a syllabus to it. **That is a different intent and both should exist.**

**⚠️ Suggested rule if you want one affordance instead of two:** if the form is untouched, the top affordance goes unscoped; once any field has content, it behaves as create-then-scoped so the student's typing is not discarded. **Two clearly-labelled buttons is also fine and simpler.**

## 3. Do not break these

- **Cold start stays unscoped and unchanged.** It is the primary path (`§6.10-A`).
- **Entries 2 and 3 stay scoped** and must still reuse `courseId` — `const courseId = existingCourseId ?? uid()`. **No scoped path may ever create a second class.**
- **`Create & import syllabus` must remain hidden when editing an existing class** — currently `editor.courseId ? undefined : …`. That guard is correct.
- **Nothing is written before Apply**, on any path.

## 4. Done when

- [ ] The Add-a-class dialog offers the syllabus path **above** the fields, with manual entry visible below.
- [ ] Choosing it opens the import **unscoped**; the review screen shows *"Which class is this?"* **prefilled from the parsed course code.**
- [ ] **No class is created until Apply** on that path. **Cancelling leaves no orphan class** — verify by cancelling mid-review and confirming the class list is unchanged.
- [ ] `Create & import syllabus` still works for a typed-then-import flow, and is still absent when editing an existing class.
- [ ] Cold start, Materials, and card-overflow entries are unchanged.
- [ ] **No scoped entry creates a duplicate class** — verify by importing into an existing class and confirming the count does not rise.
- [ ] Full suite and production build pass.

## 5. Commit

```
feat(academics): make add-a-class a real syllabus fast path (§4.1-M-a)
```

**⚠️ Do not bundle this with a deploy.** `DEPLOY-01-syllabus-import.md`'s blockers are separate and still open — the stale `netlify.toml`, the unverified Supabase secrets, and 89 uncommitted files. **Unrelated working-tree changes commit separately.**
