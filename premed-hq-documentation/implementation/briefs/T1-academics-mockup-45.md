# T1 · Academics — finish-line paper reconciliation

**Stage:** A · NOT DRAWN

**Scope:** Complete the *paper map* for the entire Academics tab before another
app pass. This is deliberately a drawing and lab-cleanup brief: it adds the
one required product surface that has never been drawn, and removes two active
mockup paths that now contradict locked rulings. It does **not** change `src/`,
create a backend, or promote a page to built.

The outcome is a single coherent handoff for the remaining Academics work:
there is no silent sharing feature, no defunct Canvas promise, and no audio
capture route hiding in the lab while later briefs implement a different
product.

## 1. Step-1 audit — whole-tab finish line

### A. Spec → paper

The Academics corpus is broad and has usable visual surfaces for the private
student journey: Daily / Class Center, Class Hub, Assignments, Review Session,
Planner, Grades & Archive, Requirements, Syllabus Import, Materials output
flows, class types, study methods, planning states, and retrospective/learning
signals. Several are still only proposed or approved; that is a promotion and
implementation question, not a reason to invent a second visual system.

Three paper issues block a truthful tab-wide implementation brief:

| ruled capability / ruling | current paper state | required disposition |
| --- | --- | --- |
| **Shareable syllabus parse (#56)**: anonymous, opt-in, term-and-section-scoped sharing of extracted units, dates, weights, and policies; never source text or any student data | no screen or decision record exists | draw the privacy/consent and recipient review surfaces before a sharing backend can be considered |
| **U-12 Canvas ruling**: “Do not spec, propose, or prototype a Canvas sync”; store only the least manual/syllabus-derived record needed | existing old Materials/Canvas variants and historical prose still imply a Canvas route | mark the obsolete Canvas-specific lab states as superseded; do not delete their source files or reinterpret a manual/link workflow as sync |
| **Recent product ruling**: transcript import is the source route; audio never enters Premed OS | `academics-lecture-capture` remains an active proposed page | remove it from active lab navigation/status as CUT, retaining the source as historical record so it cannot accidentally be rebuilt |

Nothing in this pass decides a new top-level Academics tab. The shareable parse
belongs inside the existing temporary syllabus-import/re-import journey.

### B. Mockup → app

| surface | current evidence | conclusion |
| --- | --- | --- |
| Daily / Class Center | existing shipped Daily is marked built; Class Center is the established operational entry surface | preserve; its app-specific visual annotations are authoritative where newer than a mockup |
| Class Hub | app source and focused visual pass landed in `dc3be56`; its registry entry is still `approved` | promotion proof, not redraw, remains later work |
| Private Syllabus Import / Re-import | app exposes the scoped upload view; current fresh dark measurement confirms its page field at `#211e1a` | upload exists, but its complete review/re-import/recovery composition is not a promotion proof and sharing is absent by design |
| Materials generation / folder intake | visible product surfaces exist, including study-guide, flashcard, revised-notes, and source intake directions | keep as the private study-material route; do not turn source selection into persistent extra tabs |
| Canvas-specific material views | active old paper conflicts with U-12 | cut from the active prototype corpus before any broad fidelity pass |
| Lecture Capture | active old paper conflicts with the transcript-only ruling | cut from the active prototype corpus before any broad fidelity pass |

### C. Already built — preserve, do not rebuild

- `93bfeb8` — stable, identity-based `syllabusReimportDiff()` behavior.
- `7d2c5e4` and `9c1fa65` — scoped/unscoped import ownership and cold-import
  persistence boundaries.
- `dc3be56` — private Class Hub and Syllabus Import fidelity pass.
- Existing study-material generation, class workspace, assignments, review,
  planner, archive, and requirements work remains in place. This brief neither
  replaces them nor claims they have passed the six promotion conditions.

### D. Manifest gate

**Pass.** The Academics rows in `BUILD-MANIFEST.md` are cleared for their
respective implementation work. This stage does not use that permission,
because the missing shareable-parse surface has no visual decision yet.

### E. Decision records

**Blocked.** Existing private import and class-hub records include behavior and
appearance, but shareable structure has neither. Its security boundary is too
important to infer from a generic “share” button. The old Canvas and audio
drawings are additionally misleading after their product rulings changed.

### F. Integrations and services

| dependency | current classification | student-facing truth |
| --- | --- | --- |
| local syllabus parsing and private re-import | code built | parsing proposes edits; it is private to the student's current browser/device flow |
| study-material generation | code and deployed `study-tools` function exist; end-to-end student test remains separate | selected source materials can be used to generate study outputs; no output is claimed before a run succeeds |
| Google Drive / folder-provider intake | code path may exist, but provider configuration/proof is separate | optional source intake, never required for syllabus or material generation |
| Canvas | ruled out by U-12 | no sync, token, OAuth, API proxy, calendar-feed claim, or mockup affordance |
| lecture audio | ruled out | students provide a transcript or other course material; Premed OS does not record or receive audio |
| shareable parsed structure | not built | no classmate/shared-parse claim until the privacy design is chosen, then separately implemented and tested |

## 2. Why this lands at Stage A

The whole tab cannot responsibly move to a final implementation sweep while a
required social/privacy feature has no screen at all and two visible prototype
routes promise behavior the product has explicitly ruled out. The next correct
deliverable is therefore paper completion, not another narrow CSS or backend
pass.

## 3. Work — draw and reconcile only

### 3.1 Draw `academics-syllabus-structure-share`

Create one new proposed page in `mockup-lab/01-academics/`, with a paired `.md`
recording **both behavior and appearance**, and register it in
`mockup-lab/variant-lab.html` with `status: "proposed"`.

It is a state of Syllabus Import / Re-import, not a new permanent tab.
Draw exactly these states:

1. **Owner opt-in after a successful private parse.** Default is private. The
   student can inspect the explicit allow-list before choosing to contribute:
   section/term identity, units/topics, dates, grade-category weights, and
   verbatim policy field *only where the source rule permits it*. Clearly show
   what never leaves the device/account: the original document/text, name,
   grades, progress, notes, files, and personal edits.
2. **Recipient review-before-apply.** A student who finds a structure for their
   own section sees source provenance/confidence and a compact editorial diff.
   Their own parse wins; uncertain/disagreeing fields remain visible conflicts;
   nothing writes until the student chooses Apply.
3. **No result / privacy-safe fallback.** The normal private upload/paste path
   remains primary. No shared result must read as a normal absence, never a
   failed requirement or a request to reveal a classmate.

Use three variants because this is a consequential consent decision, not
decoration:

- **A — Consent-led:** the default/private decision is the page hierarchy,
  with the allowed and prohibited data sets shown as a quiet disclosure.
- **B — Evidence-led:** the candidate shared structure and its corroboration
  are primary, while the consent boundary remains immediately inspectable.
- **C — Diff-led:** the recipient's current/private parse compared with the
  structure is primary, with unresolved fields visibly held for review.

Do not choose a winner in this drawing brief. The user chooses the treatment
before any sharing implementation brief. Each variant must obey the existing
warm-dark/light visual recipes: one temporary import composition, solid review
groups and rail, no glass-card wall, no score/composite/ranking, and no
anonymous-avatar gimmicks.

### 3.2 Retire contradictory prototype routes without erasing history

- Change `academics-lecture-capture` from an active proposed surface to a
  clearly labelled **CUT / superseded** record in the lab. Keep its HTML and
  decision record on disk, annotate why it is historical, and remove it from
  normal active navigation/filtering so it cannot be approved accidentally.
- Mark every Canvas-sync-specific Materials/extension state as **CUT /
  superseded by U-12** in its decision record and active registry treatment.
  Preserve generic paste/upload/link material intake where it is independent
  of Canvas. Do not remove a student’s manual deadline/course data merely
  because an old drawing mentioned Canvas.
- Update the mirrored mockup documentation according to `VARIANT-LAB.md` so
  the lab and docs do not drift.

### 3.3 Draw no extra feature

Do not redraw all Academics pages, add new navigator tabs, invent a peer
directory, create a cloud/share backend, or turn the user’s materials into a
generic file manager. This is reconciliation plus the one indispensable
missing surface.

## 4. Do not break

- No changes under `src/`, Supabase, migrations, Edge Functions, API keys, or
  deployment configuration.
- Do not change the four existing syllabus-import entry points, parser,
  re-import diff, default Keep/Accept behavior, or private source retention.
- Do not delete historical mockup files; deprecate them explicitly instead.
- Preserve every user-approved app-specific visual annotation even where an
  older mockup differs. A later fidelity brief reconciles the approved visual
  hierarchy; it does not erase those decisions.
- Do not prototype Canvas sync, audio recording/upload, transcript scraping,
  or any inference that a professor/classmate consented to sharing.

## 5. Done when

- [ ] `academics-syllabus-structure-share` has A/B/C screens plus a paired
      behavior-and-appearance decision record, and is registered proposed in
      the lab.
- [ ] The drawings visibly enforce: extracted allow-list only; no source text,
      personal data, or unreviewed apply; own syllabus wins; disagreements are
      conflicts; sharing is anonymous, opt-in, and term/section-scoped.
- [ ] Lecture Capture and Canvas-sync-only mockup routes are no longer active
      approval candidates, but their source/history remains recoverable and
      explains the superseding ruling.
- [ ] A full Academics lab inventory can distinguish active private product
      surfaces from proposed future work and cut historical paths without
      ambiguous labels.
- [ ] `git diff --check` passes. No `src/` files change.

## 6. Commit

`docs(mockups): reconcile Academics finish-line sources`

Commit only the lab drawings, registry, and paired decision records. Keep
unrelated worktree changes separate.

## 7. Next stage

After Andy picks shareable-parse A, B, or C, write the narrow decision/backend
brief for that feature. In parallel, the normal page-promotion pass may move
the existing active Academics pages from approved to built only when each page
has all six proofs. Neither path should revive Canvas or lecture-audio work.
