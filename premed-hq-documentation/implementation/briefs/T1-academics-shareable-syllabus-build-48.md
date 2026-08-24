# T1 · Academics — Shareable syllabus structure build

**Stage:** C · DECIDED, NOT BUILT

**Approved treatment:** **A · Consent-led** — recorded in
`mockup-lab/01-academics/academics-syllabus-structure-share.md`.

**Scope:** Build one optional, anonymous, privacy-safe shared *parsed
structure* route inside the existing Syllabus Import / Re-import flow. This is
one feature with frontend and backend built together. It is not a social
feature, document library, source-file upload path, or new Academics tab.

**Execution gate:** **blocked until `BUILD-MANIFEST.md` receives an explicit
`Build? = YES` row for `academics-syllabus-structure-share`.** The existing
private syllabus-import row does not authorize a remote, cross-user data model.

---

## 1. Step-1 audit

### a) Spec → paper

**Pass.** #56 is now represented by `academics-syllabus-structure-share` in
three states: owner opt-in, recipient review-before-apply, and normal
no-result/private fallback. The selected Consent-led hierarchy makes the
privacy decision visible before any sharing benefit.

### b) Mockup → app

**No implementation exists, by design.** There is no in-app owner consent,
candidate lookup, remote shared structure, corroboration, correction diff, or
recipient review route. Existing public Privacy text is an explanation only;
it is not an implementation.

The target visual surface is the temporary Syllabus Import/Re-import mode:

| surface | mockup value | current app value |
| --- | --- | --- |
| owner consent body | page `#211e1a` → panel `#2b2722` → disclosure objects `#322e28`, bordered `#3c352d` | absent — no shareable-parse UI exists |

The implementation must reproduce this literal ladder, 16px outer panels,
13px inner disclosure objects, shallow temporary import banner, visible focus,
and reduced-motion direct resolution. The banner alone may use the shared glass
recipe. No scores, rankings, progress bars, popularity counts, or avatars.

### c) Already built — preserve, do not rebuild

| Private capability | Evidence | Preservation rule |
| --- | --- | --- |
| parse → review → apply | `e638095`, `ac23637` | private upload/paste/manual entry stays the primary route |
| scoped and cold-start ownership | `7d2c5e4`, `9c1fa65` | scoped imports attach to their existing class, never duplicate it |
| re-import identity diff | `93bfeb8` | changed/removed rows default to Keep; nothing writes before Apply |
| private import/class-hub fidelity | `dc3be56` | add only a temporary branch, not another permanent Materials tab |

### d) Gate — `BUILD-MANIFEST.md`

**Fail / action required before execution.** There is no row for
`01-academics/academics-syllabus-structure-share.html`. Andy must add a
manifest row with `Build? = YES` after reviewing this brief. Until then this is
an implementation plan, not authorization to change `src/` or Supabase.

### e) Decision records

**Pass.** The paired mockup decision record specifies behavior, the approved
Consent-led hierarchy, ladder values, density, exclusions, and why consent
precedes benefit.

### f) Integrations and services

| Dependency | Classification | What the student sees today | What execution adds |
| --- | --- | --- | --- |
| private parser/re-import | CODE BUILT AND CONFIGURED | personal parsed proposal, review, and apply | unchanged |
| Supabase remote shared structures | CODE MISSING | no share result | anonymous candidate lookup and publish/revoke through server endpoints |
| remote schema / RLS / server-side allow-list | CODE MISSING | no cross-user data | a structure-only store that cannot carry source or student data |
| corroboration/conflicts/correction revisions | CODE MISSING | no candidate provenance | evidence and conflict data before local acceptance |

No new model-provider key, OAuth client, or third-party account is needed. The
existing Supabase project is the only deployment dependency; execution must
deploy the migration and Edge Function(s) as part of this feature.

## 2. References

- Mockup: `mockup-lab/01-academics/academics-syllabus-structure-share.html`
- Approved record:
  `mockup-lab/01-academics/academics-syllabus-structure-share.md`
- Visual recipe: `mockup-lab/_shared/_visual-recipes.md`
- Spec: `tabs/01-academics.md` §4.1-M, especially **Shareable parses (#56)**
  and its locked security/privacy model
- Existing import/re-import: `src/pages/SyllabusImportMode.tsx`,
  `src/lib/academics/syllabusReimport.ts`
- Existing types/store/migrations: `src/lib/types.ts`, `src/lib/store.ts`
- Supabase conventions: `supabase/functions/` and existing migrations
- Rules: `premed-hq-documentation/general.md` and the `U-*` rules

## 3. Work — build one privacy proof end to end

### 3.1 Add an explicit manifest authorization first

Before code, add a distinct manifest row for the mockup and record this exact
scope: anonymous, opt-in, term-and-section-scoped **parsed structure only**.
It must state that source files/text, grades, notes, progress, personal edits,
and identity are excluded. Do not repurpose the private syllabus-import row.

### 3.2 Create a structure-only server model

Create a dedicated Supabase migration and server-owned data model. It must be
structurally separate from courses, class workspaces, materials, grades, topics,
notes, assignments, and any user-profile/contact table.

The persisted public candidate may contain only this serialized allow-list:

- normalized institution/course/term/section scope;
- units/topic titles and their ordering;
- dates and typed date facts;
- grade-category names and numeric weights;
- explicitly modeled, non-prose policy flags;
- public-course logistics that the spec permits (instructor/office-hours only
  when they come from the course listing, not student-entered contact data);
- parse/revision timestamps, independent-parse corroboration facts, import and
  correction counts, plus opaque candidate/revision identifiers.

It may **not** store a `courseId`, `workspaceId`, `materialId`, student ID,
email, account profile, original filename, blob reference, original source
text, excerpts, page/image data, note, grade, progress, review, or personal
edit. Do not add a JSON “catch-all” field. The server serializer must discard
everything outside the allow-list before persistence.

Use an opaque publish/revoke capability, returned only to the publishing
browser and stored locally beside that syllabus’s private metadata. Do not put
the publisher’s authenticated identity in the shared row or return it in a
candidate response. A recipient should only ever see: **“shared by someone in
this section.”**

No browser client receives direct table privileges. Keep tables inaccessible by
default under RLS and expose the minimum publish, lookup, report/correct, and
revoke actions through server-validated Edge Function endpoints. Validate every
payload against the allow-list a second time at the endpoint. Rate-limit and
normalize scope input server-side; reject cross-term/section lookup and every
unknown field.

### 3.3 Publish only from a confirmed private parse

Inside the existing import/re-import flow, after private parsing and before the
student applies shared data anywhere, show the **Consent-led owner state**:

1. Default choice: **Keep this private**.
2. Explain that no source document/text or student data can leave.
3. Show the exact allowed fields and an equally clear “never shared” group.
4. Let the student opt in for this one parsed syllabus only.
5. Publish only after explicit confirmation; do not enable a default checkbox,
   retroactively publish an earlier parse, or infer consent from Apply.

Successful publishing leaves the local private parse unchanged. The student can
revoke the shared candidate from that same syllabus state using their local
capability; revocation removes it from future lookup, not from a recipient’s
already-confirmed private data.

### 3.4 Find, corroborate, and review candidates without authority theatre

For a matching normalized term + section, show no more than the eligible shared
structure candidates. A candidate presents term, section, parsed/revised date,
independent parse count, import/correction counts, and conflicts — never a
trust score, rank, account identity, popularity feed, or “best” badge.

- Independent parses that agree may increase a plain-language corroboration
  label; they do not silently replace a student’s private parse.
- Any disagreement remains a visible conflict. Do not majority-vote a field
  into the student’s class.
- Report/correct creates a new candidate revision/diff through the same
  allow-list, retaining provenance. It never mutates a recipient’s private
  data.
- Previous-term candidates are history only, labelled clearly and not offered
  as current data.

### 3.5 Reuse the existing review-before-apply mechanics

Recipient import enters the existing review composition, not a separate form.
Their own reviewed syllabus wins. Matching rows collapse and count; differences
are grouped editorially by identity, exam dates, grade weights, units/topics,
deadlines, policies, then permitted logistics. Every differing row defaults to
**Keep**; the student chooses Accept per row. Nothing writes until Apply.

No result is a normal state: keep private upload, paste, and manual entry
immediately available. A network failure is separate and honest; it must never
pressure a user to share their own parse as recovery.

### 3.6 Tests and proofs

Add focused tests that prove:

- serialization drops every forbidden field, including a future unknown field;
- no source text/file/blob/course/workspace/user identity can enter a shared
  row or endpoint response;
- anonymous recipient response exposes no owner information;
- a publish requires an explicit per-syllabus opt-in; revoke removes lookup
  visibility only;
- scope requires an exact normalized institution/course/term/section match;
- candidate conflict/corroboration state never auto-accepts or writes;
- recipient defaults to Keep and only accepted fields apply;
- private re-import behavior and inserted-week identity matching remain intact;
- RLS/direct-client requests cannot read or write the shared table;
- owner, recipient, no-result, error, and reduced-motion views work in both
  themes and match the approved Consent-led ladder.

Run the full test suite, production build, migration validation, and a real
authenticated end-to-end round trip against the deployed endpoint: publish a
sanitized candidate, look it up from a separate browser/session, accept exactly
one field, reload, revoke, and confirm future lookup returns no candidate.

## 4. Do not break

- Do not alter the four existing private import entry points, private parser,
  local source retention, re-import diff, default Keep behavior, or manual
  entry fallback.
- Do not build a permanent Syllabus Sharing page, classmate discovery, chat,
  social graph, peer comparison, ranking, score, or an avatar system.
- Do not transmit copyrighted source PDFs, images, extracted text, filenames,
  notes, or policy prose. Facts/structured flags only.
- Do not link the new remote structure tables to a user’s private educational
  records. Any schema change creating that join path is a blocking review.
- Do not call an LLM to adjudicate a conflict or infer an omitted field.
- Keep current user-approved app-specific visual annotations where they differ
  from older generic mockups.

## 5. Done when

- [ ] Manifest has an explicit `Build? = YES` row for this feature.
- [ ] Consent-led owner, recipient-review, no-result, error, and revoke states
      visually follow the approved mockup in light and dark themes.
- [ ] The database and endpoints enforce the allow-list twice, are inaccessible
      directly from the browser, and have no private-record join path.
- [ ] A recipient sees no publisher identity, source document/text, or student
      data.
- [ ] Shared candidates are scoped, corroborated without ranking, conflict-safe,
      review-before-apply, and never write before Apply.
- [ ] All tests, migration validation, production build, and the two-session
      deployed round trip pass.
- [ ] The decision record receives the implementing commit and all six
      promotion proofs before a built promotion is considered.

## 6. Commit

`feat(academics): add consent-led shareable syllabus structure`

Commit only this feature’s migration, Edge Function(s), types, UI, tests,
manifest authorization, and decision-record proof. Keep current flashcard
output/spec work and all unrelated worktree changes separate.

## 7. Next stage

After execution, re-run the tab brief audit. It may land on **D** for a missing
backend proof, **E** for fidelity, or **F** only if all six promotion conditions
are demonstrably satisfied. It is not authorized to promote merely because the
screen renders.
