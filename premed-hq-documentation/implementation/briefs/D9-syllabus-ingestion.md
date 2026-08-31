# D9 · Syllabus ingestion — THE KEYSTONE

**Read only this file plus the references in §2.** If something you need isn't here, read the named spec section and **tell me the brief was incomplete** — don't guess.

**Source of truth is `tabs/01-academics.md` §4.1-M through §4.1-M-d.** Where this brief and that spec disagree, **the spec wins and this brief is wrong.**

---

## 0. Why this one first

`briefs/README.md`: *"the keystone; most other features are decorative without it."* `01-academics-feature-catalog.md`: **fourteen features plus two subsystems depend on it.**

**And it is the product's front door.** `05-public-and-account.md` makes *"import a syllabus"* onboarding's **single** call to action, and the landing page markets *"Upload a syllabus, get your semester."* Today both resolve to `importSyllabus()` in `ClassCenter.tsx:372`, which creates a course and stores `fileName` + `mimeType` — **the file is never read.** No document-parsing dependency is installed.

**The spec's own argument, and it should govern every trade-off below:** *"a student who must hand-enter nine units and twelve deadlines per course will do it once, for one course, in week one — and never again."*

## 1. Scope

**IN:** extraction from PDF / DOCX / image / pasted text · the review-before-apply screen · apply · failure states · re-import diff.

**OUT of this brief, deliberately:** shareable parses (§4.1-M #56) — it needs a separate table, an allow-list serialiser, and a corroboration model, and **the spec marks its security design LOCKED and structural.** Build the single-user path first; a sharing brief comes after. **Do not add a share button, a shared-parse table, or an upload-to-server path in this chunk.**

**Also OUT:** Canvas/LMS (§4.1-O — Path A ships through Google Calendar, unrelated to this).

## 2. References — read these

| What | Where |
|---|---|
| **The spec** | `tabs/01-academics.md` §4.1-M, §4.1-M-a, §4.1-M-b, §4.1-M-c, §4.1-M-d |
| **Mockup** | `specifications/mockups/01-academics/academics-syllabus-import.html` |
| **Exact visual values** | `specifications/mockups/_shared/_visual-recipes.md` — **used literally, never approximated** |
| **Universal rules** | `general.md` `U-1`–`U-13`. **`U-2` and `U-8` are load-bearing here** |
| **Components** | `implementation/component-inventory.md` |
| **Entities** | `tabs/01-academics.md` §2 — `Course`, `ClassWorkspace`, `AssignedReading`, materials/files |

> ⚠️ **`academics-syllabus-import.html` has no `.md` decision file.** The standing mockup rule requires `mockup → same-name .md → named in a brief → built`. **Write that `.md` as part of this chunk**, or the chain is broken and the next reader can't tell what was approved.

## 3. Components to reuse — do not fork

- **`AnimatedFileUpload`** (`components/motion/`) — drag-and-drop, click-to-browse, `accept` filter, drag-state lift. **The spec says explicitly: do not fork a variant.**
- Existing dialog/sheet, `Button`, `Card`, form primitives, and the toast system — **`useToast`, already imported in `Academics.tsx:63`.** ⚠️ `S9-overview-academics-sweep.md` F9 records a second toast system built inside `TarHeelTracker` with `useState` + `setTimeout`. **Don't repeat that.**

## 4. The three decisions the spec doesn't make

### 4a · Where parsing runs — **client-side, and this is not a preference**

**The spec's security model turns on never redistributing the document**, and §4.1-M is explicit that a syllabus is *"the professor's copyrighted work"* and that redistributing it *"is not permitted."* Uploading the file to a server creates exactly the artefact the model exists to avoid. **Parse in the browser. The file never leaves the device.**

- **PDF** → `pdfjs-dist` text layer.
- **DOCX** → `mammoth` (HTML) or `docx` → text.
- **Pasted text** → straight through, and it is the **highest-fidelity path**, not the fallback.
- **Images** → see 4b.

**Add these as real dependencies.** None is installed today.

### 4b · Images / scanned PDFs

**Outcome (Aug. 30, 2026):** this original deferral was superseded by Andy's explicit beta-testing request after real scanned schedules proved incomplete. The shipped follow-up uses a self-hosted browser worker and English model, recognizes only image-only PDF pages, keeps page pixels and OCR text on the device, and still preserves paste/manual review paths when recognition is incomplete.

**A scanned syllabus has no text layer**, and a PDF that extracts to near-nothing is almost always a scan.

**Detect it and say so** rather than reporting "nothing parsed": *"This looks like a scan — the text can't be read directly."* Then offer the two paths that work: **paste the text**, or **manual entry with the file open beside it.**

**Do not add an OCR engine in this chunk.** Tesseract-in-browser is multi-megabyte and slow, and the spec's fallbacks already cover the case. **Record the deferral in `deferred.md` with this reason** so it isn't re-proposed as an oversight.

### 4c · `U-2` compliance — **the deterministic pass is the base path**

> **`U-2`: a feature needing an LLM is marked and must degrade, never break — no base capture path ever depends on a key.**

**Syllabus import IS a base capture path. It must work with no API key at all.** Two layers:

| Layer | What it does | Key required |
|---|---|---|
| **Deterministic** | Date patterns · `%`-weight tables · week/unit headings · meeting times · common section headers | **No** |
| **LLM assist** | Ambiguous prose, unusual layouts, policy classification — **raises confidence, never the only source** | Yes, optional |

**Build the deterministic layer first and ship it alone if the LLM layer slips.** Weights, dates, and week headings are the highest-value fields and are the most regular text in a syllabus. **Mark LLM-assisted items in the review screen** per `U-1`.

## 5. The review screen — the one screen that matters

**Follow §4.1-M-c exactly.** Restated only where implementation could drift:

- **Groups in this order:** class identity → exam dates → grade weights → units/topics → deadlines → policies → logistics.
- **Clean groups collapse with a summary line** (*"12 deadlines · all confident"*); **any group holding a low-confidence item expands by default.**
- **Every item shows its source text**, quoted, with page or line. **This is what makes confirmation meaningful rather than ceremonial** — a student cannot verify a weight they cannot trace. **If you cannot produce source text for an item, that item is low-confidence by definition.**
- **Low-confidence items are flagged, never hidden or dropped**, and edit inline. No modal. Each row has an explicit **Confirm** action; Apply stays unavailable until every flagged row is confirmed or removed, and editing a confirmed row reopens its check.
- **⚠️ Weight validation is the highest-stakes field on the screen.** Categories must sum to 100%; if they don't, **show the gap** — never auto-normalise, never silently drop a category. *A mis-parsed weight corrupts every downstream projection and the student would have no idea why.*
- **Apply is one action and states its consequence:** *"Adds 9 units, 12 deadlines, 3 exam dates, and 5 grade categories to CHEM 262."*
- **Nothing is written before Apply.** No partial writes, no optimistic creates.
- **Everything applied stays editable**, and the source file is retained and linked.

### The case the spec doesn't cover — and it's the common one

**§4.1-M-d covers a parse that fails. It does not cover a parse that is confidently wrong** — 8 assignments found where there are 12. Nothing detects that, and the review screen is the only place it can be caught.

**So the screen must make absence visible, not just presence.** Two requirements:

1. **State what was searched for and not found**, per group — *"No attendance policy found"* — rather than omitting the group silently. An absent group reads as "the syllabus has none," which may be false.
2. **Every group ends with an `Add manually` affordance**, so a missing 12th assignment can be added without leaving the flow.

**⚠️ Do not display a completeness score, a percentage, or a quality bar.** That is `U-9`'s invented composite.

## 6. Entry points — §4.1-M-a

Four entry points, one destination, **no new tab** — a temporary full-screen flow like exam prep mode (§4.1-R).

| Entry | Scope | Review screen difference |
|---|---|---|
| **Cold start** (day-one CTA, §6.10-A) | unscoped | Leads with *"Which class is this?"*, prefilled from the parsed course code. **Creates `Course` + `ClassWorkspace` on apply** |
| **Class page → Materials, top of tab** | scoped | Static class header instead |
| **Class Center card overflow** | scoped | Static class header instead |
| **Add a class flow** | scoped | Static class header instead, manual entry always beside it |

**Scope changes ONE block. Everything after it is identical** — build one screen, not two.

## 7. Failure states — §4.1-M-d

- **Nothing parsed** → say what was tried, **keep the file attached to the class**, go straight to manual entry with the file open beside it. **Never a dead end, never a bare error.**
- **Wrong document** (problem set, slide deck) → say so, offer to file it in Materials, **which is where it belongs.**
- **Never block the app on parsing.** Manual entry is visible throughout, not revealed on failure (`U-8` — Premed OS may decline to assert; it may not withhold a capability).

## 8. Re-import diff

Same flow in diff mode, from Materials → existing syllabus row → `Re-import`.

- **Three-way: added / changed / removed**, each with old and new side by side, **each individually accept-or-keep.**
- **Confirmed data is never silently overwritten.**
- **Unchanged items are collapsed and counted, not re-listed.**

## 9. Parsing-state UX

**Name what it's doing** — *"reading week structure…"* — never an indeterminate spinner. **Cancellable.** *A 20-second silent wait reads as a hang.*

## 10. Done when

- [ ] `pdfjs-dist` and a DOCX reader are real dependencies; **PDF and DOCX text extraction verifiably runs in the browser.**
- [ ] **No file content is uploaded anywhere.** Grep proves no network call carries file bytes or extracted prose.
- [ ] Pasted text is a first-class input, not a fallback.
- [ ] A scanned PDF is **detected and named as a scan**, with paste and manual-entry offered. **Not reported as "nothing parsed."**
- [ ] **The deterministic parser works with no API key**, extracting dates, `%` weights, and week/unit headings. Verified with the key removed.
- [ ] LLM-assisted items are visibly marked (`U-1`).
- [ ] Every extracted item shows quoted **source text with page or line**.
- [ ] Groups that parsed cleanly are collapsed; **any group with a low-confidence item is expanded**.
- [ ] Every low-confidence row can be explicitly confirmed; Apply is unavailable while any flagged row remains unresolved, and editing a confirmed row requires confirmation again.
- [ ] **Grade categories not summing to 100% show the gap.** Grep proves no auto-normalise and no silent drop.
- [ ] Groups that found nothing **say so** rather than being omitted.
- [ ] Every group has an `Add manually` affordance.
- [ ] **No completeness score, percentage, or quality bar exists** (`U-9`).
- [ ] **Nothing is written before Apply**; Apply states its consequence with real counts.
- [ ] All four entry points reach one screen; only the class-identity block differs.
- [ ] Cold start creates `Course` + `ClassWorkspace`; scoped entries do not.
- [ ] Failure keeps the file attached and opens manual entry beside it.
- [ ] Re-import shows added/changed/removed with per-item accept; **unchanged collapsed and counted**.
- [ ] **`AnimatedFileUpload` is reused, not forked.** Grep proves one upload component.
- [ ] **`useToast` is used.** Grep proves no second toast system.
- [ ] `academics-syllabus-import.md` exists beside the mockup and is named in this brief's §2.
- [ ] Image OCR is recorded in `deferred.md` **with its reason**.
- [ ] **No share button, no shared-parse table, no server upload path** — out of scope (§1).

## 11. Commit

```
feat(academics): implement syllabus ingestion (§4.1-M)
```

**Unrelated working-tree changes commit separately.** ⚠️ At the time of writing, `premed-hq-documentation/` has uncommitted spec work and `research-only/` holds a staging dataset — **neither belongs in this commit.**
