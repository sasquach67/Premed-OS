# T1 · Academics — term-start path (scoped vertical)

**This brief deliberately suspends the stage ladder for one pass.**

`TAB-BRIEF-PROMPT.md` optimises for *spec completeness across a whole tab*. That is
the right default and it should resume after this. But Andy's classes start Monday,
and the ladder cannot tell the difference between "the last ruled Planning state is
undrawn" and "I cannot put my own course materials into my own app." This pass is
scoped to the second thing.

**Scope:** one vertical — get a real term in, end to end, on real records.
**Not in scope:** every other Academics surface, stage F, and any promotion.
**Do not** run the stage router this pass. Do not write `T1-academics-build-20.md`.

---

## Why this brief exists

`T1-academics-build.md` … `T1-academics-build-19.md` is nineteen build briefs on one
tab. That is not disobedience — it is the ladder working as written on a tab with
roughly nineteen surfaces, where **stage F is defined tab-wide** (*"the tab does NOT
reach stage F while any of its surfaces is running on mock or placeholder data"*).
Every re-run correctly finds one more unbuilt surface and correctly writes a build
brief for it. Overview had ~6 surfaces and converged in 5 passes. Academics will need
~25, and the passes remaining are the *least* useful ones — plan comparison and
substitute choice, both blocked on a course catalog that does not exist (`T1-academics-status.md` §3).

Meanwhile the term-start path has a hole in it. See §2.

---

## 1. What is already built — do NOT rebuild any of this

Verified against the tree, not against the briefs:

| Path | Evidence |
|---|---|
| Syllabus import, real files | `SyllabusImportMode.tsx:258` accepts `.pdf,.docx,image/*,text/plain` |
| PDF actually parses in a browser | `ac23637` configured the pdfjs worker; `syllabusPdf.test.ts:121` regression-tests it |
| Dates land as ISO and render | `28011d4`, plus migration `assignmentDueDateIsoV24` |
| Second import is a re-import, not an append | `227cfb0`, `syllabusReimport.ts` |
| Syllabus file retained locally | `localSyllabusFiles.ts` → `retainLocalBlob` |
| Assignments, Class Hub, Class Center, review session | shipped earlier |

**The syllabus half of Andy's Monday need works.** Do not touch it.

---

## 2. The gap — course materials have no entry point

`ClassHub.tsx:686`:

```tsx
<MaterialCatalog files={files} topics={topics} />
```

`MaterialCatalog.tsx:36` declares `onAdd?: () => void`, and both its "Add material"
buttons (`:54` empty state, `:128` populated) render **only when `onAdd` is passed**.
ClassHub never passes it.

Consequences today:

- A student opening Materials on a new class sees an empty state **with no way to add anything**.
- `retainLocalBlob` is called from exactly two places app-wide — `localSyllabusFiles.ts`
  and `overviewFileCapture.ts`. **Nothing in Academics stores a course material file.**
  The catalog is metadata about files that cannot be added.
- The Materials toolbar's only file action is `Import syllabus`.

This is why the tab "isn't doing the backend" from the outside. Most of the backend is
there — 40+ engine modules under `src/lib/academics/`, each with a test — but the one
verb the student needs first is missing, so nothing downstream of it can be reached.

---

## 3. The work — three items, in order

**3.1 Give Materials a real add path.**

- Pass `onAdd` from `ClassHub.tsx` so both buttons render.
- `onAdd` opens a file picker accepting the same types the syllabus importer does.
- Store the bytes with `retainLocalBlob`, exactly as `localSyllabusFiles.ts` does.
  **Do not invent a second retention mechanism**, and do not add cloud storage.
- Create the `AcademicFile` record with ownership `mine` unless the student says
  otherwise, and leave the unit link empty rather than guessing.
- Unlinked material is honest: it appears under an `Unassigned` group, not filed to a
  made-up unit.

**3.2 Make the empty Materials state route to both doors.**

A new class has neither a syllabus nor materials. The empty state should offer
`Import syllabus` and `Add material` as peers — today it offers neither.

**3.3 Prove the whole vertical on one real course.**

Not a unit test — a walkthrough, reported step by step:

1. Create a class from scratch.
2. Import a real multi-page PDF syllabus.
3. Confirm assignments appear with correct ISO dates, in Assignments and on Overview.
4. Add a course material file; confirm it persists across a page reload.
5. Re-import the same syllabus; confirm it diffs rather than duplicating.

Report each step pass or fail with what was observed. **If a step fails, stop and say
so** — do not repair it silently and do not move to the next item.

---

## 4. Do not break

- Do not touch the syllabus parser, the PDF path, the ISO migration, or the re-import diff.
- Do not add a second blob-retention path or any cloud storage claim.
- Do not promote any page to `built` this pass.
- Do not open the stage router, and do not write another numbered build brief.
- No U-9 violations. Nothing here scores or ranks.

---

## 5. Done when

- `rg -n "MaterialCatalog" src/components/academics/ClassHub.tsx` shows `onAdd` passed.
- `rg -n "retainLocalBlob" src/` shows a third caller, inside Academics.
- A file added to Materials survives a reload.
- The five-step walkthrough in §3.3 is reported step by step, with failures named.
- `npm run build` clean, `npm test` green. **Report the actual output** — Andy cannot
  assume it, and the bridge Claude uses cannot run his suite (his `node_modules` are
  darwin-arm64; the bridge VM is linux-arm64, so `rolldown` fails to load there).

---

## 6. Commit

```
feat(academics): give course materials a real add path
```

Commit only the files this brief names. The working tree carries unrelated changes.

---

## 7. After this pass

Resume `TAB-BRIEF-PROMPT.md` normally. The next honest stop is whatever the router
finds — but the term-start vertical will no longer be the thing standing between Andy
and using his own app during a term.
