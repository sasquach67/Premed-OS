# T1 Academics · Class Hub Guide — backend 56

**Stage:** D · backend missing  
**Scope:** durable, local-first Guide proposal and Course lens behavior only. The approved Class Hub drawing and its CSS are unchanged.

## 1. Fidelity audit

### Spec → paper

The approved Class Hub decision record draws and rules all behavior in this pass:

- Guide suggestions are sourced from confirmed syllabus facts and saved lecture transcripts.
- Every suggestion exposes its supporting evidence and remains pending until the student reviews, edits, accepts, or dismisses it.
- Course lens is optional, course-scoped, student-edited, sourceable, and used by study-guide generation only when explicitly enabled.
- Topics remain syllabus standards/objectives. Lecture transcripts are evidence, never a topic generator.

No new surface needs drawing for this backend stage.

### Mockup → app

`src/components/academics/ClassHub.tsx` already renders the five-tab Class Hub and a pending lecture-proposal card, but the persisted record contains only `lectureId`, `findingId`, and status. It has no editable draft, generalized syllabus source, source passage, accepted-note provenance, or Course lens home. `LectureCapturePanel.tsx` creates only the legacy lecture-linked record. The visible Guide therefore cannot meet the ruled review/source boundary after reload.

### Already built — preserve

- Existing local-first Zustand persistence and v0→v35 pure migration chain.
- Confirmed syllabus import, syllabus-led Topics, lecture transcript → optional evidence → selected-source study work, unified Material Intake, and class-scoped Assignments.
- Existing source-only study-guide generator and citation boundary.
- Current Class Hub markup/CSS and every Planning-owned surface.

### Gate

`BUILD-MANIFEST.md` marks `01-academics/academics-class-hub.html` **YES**.

### Decisions

`mockup-lab/01-academics/academics-class-hub.md` records both appearance and behavior, including Course lens and Guide suggestion source/review rules. Andy explicitly authorized the recommended durable persisted contract in this pass, resolving the runner's persisted-entity decision gate.

### Integrations

- Local proposal creation, edit, accept, dismiss, Course lens, and reload: **code missing**; this brief owns it.
- Lecture analysis provider: **code built, configuration external**. Preserve its existing unconfigured/signed-out outcomes; no cloud setup is claimed.
- Study-guide provider: **code built, configuration external**. The local request assembly and no-source refusal are testable; signed-in provider output remains configuration-gated.

## 2. References

- `premed-hq-documentation/tabs/01-academics.md` §4.1-I, §4.1-M, §4.1-Q, acceptance criteria.
- `mockup-lab/01-academics/academics-class-hub.html`, Variant A `view=guide` and lecture workflow views.
- `mockup-lab/01-academics/academics-class-hub.md`, decisions 4, 5, 10–12.
- Matching documentation mirror under `premed-hq-documentation/specifications/mockups/01-academics/`.
- `src/lib/types.ts`, `src/store/store.ts`, `src/store/migrations/lectureCaptureV28.ts`.
- `src/components/academics/ClassHub.tsx`, `LectureCapturePanel.tsx`, `MaterialGenerationIntake.tsx`.
- `src/lib/academics/generateStudyGuide.ts` and existing generation/source policy.

## 3. The work

1. Add a generalized Guide proposal contract with:
   - `sourceKind: syllabus | lecture`;
   - source and source-record IDs plus optional file/chunk IDs;
   - exact source passage/location/label;
   - editable draft title/text and destination note type;
   - pending/accepted/dismissed lifecycle and accepted-note linkage.
2. Add an optional course-scoped Course lens record with student-authored text, explicit source references, and an opt-in study-guide flag. A partial lens may be saved, but cannot affect generation without text and valid same-course evidence.
3. Add pure v37 hydration migration after the independently owned Planning v36 migration:
   - preserve every legacy `lectureNoteProposals` row and status;
   - enrich from its lecture finding/source chunk when available;
   - keep malformed or missing-source rows without fabricating evidence;
   - add empty `guideProposals` and `courseLenses` homes when absent;
   - remain idempotent and safe on frozen input.
4. Add pure selectors/actions for course scoping, proposal creation, edit, dismiss, accept, source validation, and Course lens upsert.
5. Wire saved lecture findings into the generalized proposal creator and use the generalized collection in Guide/Lecture Capture.
6. Derive syllabus proposals only from already-confirmed, source-bearing course records. Do not infer from a course title, schedule topic, or unsourced field.
7. Persist accepted Guide notes with their proposal/source references. Rejected or malformed evidence cannot be accepted.
8. Let study-guide request assembly include a Course lens only when explicitly enabled and all its references are valid and course-scoped. The request and saved trace name the lens and its sources; no outside context is added.

## 4. Do not break

- Never create Topics from transcripts or Guide text.
- Never treat schedule chronology as evidence.
- Never silently accept or save a Guide proposal.
- Never infer a Course lens from course title/type.
- Never use material outside the student's selected generation sources.
- Never upload raw audio or change provider/configuration behavior.
- Do not alter mockup HTML/CSS, shared visual tokens, Planning, flashcards, or unrelated dirty work.
- Every migration is pure and lossless.

## 5. Done when

- Focused tests cover lecture and syllabus creation, exact attribution, edit/dismiss/accept, malformed legacy rows, v36→v37 migration, idempotence/frozen input, reload serialization, class isolation, Course lens opt-in/partial states, and no-fabrication.
- Existing lecture-linked records remain represented with their lifecycle intact.
- TypeScript and production build pass.
- Existing Guide/Lecture controls are backed by real handlers; the scoped handler audit finds no new inert control.
- No production status is promoted and no external provider is claimed configured.

## 6. Commit

`feat(academics): persist source-backed guide proposals`

Preexisting dirty hunks must be excluded through a conflict-safe delta patch if a clean commit cannot be formed.

## 7. Next stage — out of scope

Re-run the router for Class Hub Guide visual fidelity and promotion proof. Do not change drawing or styling in this backend brief.
