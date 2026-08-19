# T1 · Academics — status audit, Aug 19 2026

Where every cleared Academics surface actually stands, and what "done" is
still waiting on. **This is an audit, not a brief — nothing is authorized by
it.**

---

## 1. Built and running on real records

| Surface | Landed | Notes |
|---|---|---|
| Class Center / Daily main | earlier | |
| Class Hub, Assignments, Notes | earlier | |
| Review session | earlier | |
| Exam prep mode | earlier | |
| Syllabus import | earlier | fidelity pass done |
| Study method · UNPATCHED 2026 | `a245721` | 2 of 5 groups; the rest have no engine |
| Forgetting curve | `775611e` | |
| Learning signals | `b21d89f` | all three types fire on demo data |
| Topic ↔ assignment linking | `606ed65` | the writer four passes were blocked on |
| Grade decisions | `c5a95d9` | four states |
| Material catalog | `8703804` | catalog only — see §3 |
| Transcript import | `42a6f70` | replaced lecture capture |
| Term rollover | `9e7fd73` | |
| MCAT relearning order + advisor export | `759d7c8` | |
| Planning cold start | `7ef1b81` | recovery state, not onboarding — ruled |
| Planner term board + inspector | `088144b` | A + C |

## 2. Not stage F, and why

**Stage F requires every surface to run on real records with no mock data and
every integration coded AND configured.** Academics does not reach it yet:

| Blocker | Owner |
|---|---|
| **Study method offers 2 of 5 groups.** Pretest, Predict, Connect and Full mock have no engine, so their groups are correctly absent — but the surface is incomplete against §6.6 | §6.6 features, each its own pass |
| **`#37` and `#41` fire only where links exist.** The writer shipped, so a real student can now create them — but no existing user's records have them yet | user action, not code |
| **Generation is unbuilt.** Study guide, flashcards, summaries: `specifications/generation` Phases 0–2 do not exist. `study-tools` is deployed and keyed but has no generate action | generation workstream |
| **Calendar review view unbuilt.** `googleCalendar.ts` and the client id are both in place, so this is now buildable — it simply has not been done | its own pass |

## 3. Drawn but deliberately unbuilt

| Surface | Why |
|---|---|
| Materials → **calendar review** | Buildable now. Not yet done |
| Materials → **study-guide generation** | No generator exists. A `Generate` button that cannot generate is the mistake `studyMethod.ts` refused |
| **Lecture capture** (recorder) | Superseded by transcript import. Audio never enters Premed OS |
| Planning → **requirement preview** | Substantially covered by the board's inspector |
| Planning → **registered term** | Covered by the board's `registered` boundary |
| Planning → **plan comparison** | **Needs a saved-plan model that does not exist** |
| Planning → **substitute choice** | **Needs a course catalog that does not exist** |

## 4. The two real gaps left in Planning

Both need a new entity, which is why neither was taken inside an
implementation pass:

1. **Saved plans.** Plan comparison restores and compares named plans. Nothing
   in `types.ts` stores a plan version — `courses` is a single mutable list.
   A saved plan is a *snapshot* of course placements with a name and a date,
   and restoring one rewrites placements. **The hard part is not the model, it
   is what restore does to a course that has since been graded** — a snapshot
   must not resurrect a stale grade or un-complete a finished term.
2. **A course catalog.** Substitute choice offers real alternatives for a
   filled course. Premed OS has no catalog: `unc-requirements.json` names
   requirements, not offerings, and `05` §10 of the public spec has an open
   question about what UNC data may be redistributed. **Research task before
   design**, per the repo's standing rule.

## 5. ⚠️ One thing worth knowing about the Planner

**It is not a scratchboard.** `courses` is one shared list: the Planner tab,
Tar Heel Tracker, Grades & Archive, and Class Center all read it, and
`syncCurrentTermWorkspaces` derives a class workspace for every course whose
term matches the current term. Moving a course out of the current term drops
its workspace — with a journal entry, and its materials retained.

The board itself is **read-only**: it selects and explains and writes nothing.
The editing surfaces are the term tables beneath it. The only true scratchpad
in Academics is the **What-if calculator**, which says so: *"Local scratch work
only — nothing here is saved."*

## 5a. Visual fidelity sweep, Aug 19 2026

Measured against the drawings rather than eyeballed, per the new check in
`EXECUTE-BRIEF-PROMPT.md`.

**Academics-owned surfaces: now faithful.** Class Center measures panels at
`#2b2722` / 16px radius and class cards at `#322e28` / 13px — the
`_visual-recipes.md` panel and class-card recipes exactly. The Planner board
steps `#211e1a → #322e28 → #2b2722`, matching the planner frame's own
`.term{background:var(--muted)}` over `.course{background:var(--card)}`.
25 translucent fills were made solid in `f2ecf9d`.

⚠️ **Not verified, and deliberately not swept: ~20 base translucent fills in
`src/components/common/`** — `Kanban`, `EmptyState`, `TrashRecovery`,
`SmartActionPanel`, `ResourceGrid`, `DocEmbed`, `InlineAddRow`,
`RecordOpenWorkspace`, `PaceProjectionLine`, `WeeklyCapacityCard`,
`MascotNote`.

These are **cross-pillar**: changing them alters Overview, Clinical, MCAT and
Experiences, not just Academics. Each was built against its own drawing in an
earlier pass, and without comparing each to that drawing I cannot call any of
them a defect — only unverified. **A sweep is its own pass and its own
decision.** Hover-state translucency (`hover:bg-muted/35`) is not in scope
either way: a translucent hover over a solid surface is a legitimate treatment
and is not what went wrong here.

## 6. Recommendation

Take **calendar review** next — it is the only drawn, cleared, fully-unblocked
surface left. Then decide the saved-plan restore semantics in §4.1, which is a
product question before it is a schema one.
