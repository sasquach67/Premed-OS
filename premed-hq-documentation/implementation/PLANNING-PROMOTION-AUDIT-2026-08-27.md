# Academics Planning · Stage-F promotion audit

**Date:** 2026-08-27  
**Router result:** terminal promotion audit reached; **promotion blocked**  
**Registry action:** none — every Planning surface remains `approved`, not `built`

This is the router pass after executing
`implementation/briefs/T1-planning-fidelity-51.md`. It evaluates every exposed
Planning / Planning · Grades registry view against the six terminal proofs in
`mockup-lab/VARIANT-LAB.md`. A missing proof is a failure; an inaccessible
data-dependent state is not promoted from source inspection alone.

## Fidelity-correction addendum · brief 52

An independent review invalidated the earlier visual pass for the Planner top
controls/context and the Grades zero-record route. The Stage-E correction is
specified in `implementation/briefs/T1-planning-fidelity-52.md` and now provides:

- a zero-record branch before every ledger/GPA/What-if control, with the exact
  `1060px`, `1.35fr / .65fr`, `14px` gap, `16px` radius, `17px` padding
  transcript-empty shell and one-column `760px` rule;
- the approved Planner control order, including real local advisor export and a
  functional overflow menu, plus Major, Catalog, Premed path, Prior credit, and
  Interests fields with `Not recorded` rather than invented context; and
- `1.42` line-height on both Planning workspaces with the approved
  `10px 24px` / `9px` control-strip density and `10px 24px` / `7px` context
  density.

The correction passed focused ESLint, TypeScript, four files / 31 tests, and a
production build. The test proves that empty Grades contains no tabs, filter,
count, or export, that Add transcript record opens the real entry, and that a
valid saved record reveals the normal ledger. The repeated control audit is:

```text
PLANNING_CONTROL_AUDIT total=65 unresolved=0
```

The delegated task had no connected visual-browser backend, so the corrected
desktop/narrow and paper/dark screenshots could not be captured in that task.
The exact CSS values are statically present, but this is not a substitute for a
live computed-style proof. Planner Plan and transcript-empty therefore remain
unverified for promotion until the parent task captures those states.

## Shared proof record

1. **Measured visual proof — fail after correction.** The earlier inspection
   was invalidated by the independent audit. The corrected values are a literal
   source port, but the required live desktop/narrow and paper/dark
   computed-style capture remains outstanding. Data-dependent supporting views
   also remain unverified and therefore fail promotion proof 1.
2. **Inert controls — pass for the Planning owners.** AST audit over
   `PlannerBoard`, `PlanningDecisions`, `PlanningColdStart`,
   `RequirementsAudit`, `GradesArchive`, `TermRollover`, `TermReportPanel`,
   `TranscriptRecordsPanel`, `GradeDecisions`, and `ForecastAccuracyPanel`:

   ```text
   PLANNING_CONTROL_AUDIT total=60 unresolved=0
   ```

3. **Reload persistence — pass for the routed core and tested domain owners.**
   On isolated origin `localhost:5176`, adding the first course changed the
   cold state to the real Planner (`workspace=1`, `courses=1`) and the same
   state remained after reload. Fourteen focused test files / 108 tests passed
   across planner, saved plans, requirements, grade ledger, grade decisions,
   forecast accuracy, rollover, term reports, advisor export, and MCAT timing.
4. **Honest empty store — pass for the two destinations.** On the isolated
   origin, Planner showed only the one-fact cold state (`Planner 0`), while
   Grades & Archive showed `0 records`, disabled export/save actions, and no
   fabricated GPA. No illustrative course or GPA survived.
5. **Integrations — fail for Planner course discovery.** Today the app searches
   only recorded local courses and says `Catalog ingestion is not configured`;
   it links to the UNC Catalog and ConnectCarolina. The complete catalog / live
   section integration depicted in the catalog view is not configured. Grades
   & Archive is manual/local and has no external integration requirement for
   its core ledger.
6. **Commit provenance — fail globally.** The primary worktree is intentionally
   dirty with concurrent authorized Daily and Planning work. The Planning
   delta has not received an isolated commit hash, and no mockup `.md` contains
   such a hash. No Planning page may be promoted.

## Per-view result

Legend: `P` pass, `F` fail, `U` unverified (counts as fail for promotion).

| Page / exposed view | Direct Lab URL | Visual | Controls | Reload | Empty | Integration | Commit | Promotion result |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Planner · Plan | `http://localhost:8765/variant-lab.html?page=planner&variant=A&view=plan` | U | P | P | P | F | F | **blocked** — corrected live visual proof + catalog configuration + commit |
| Planner · Requirement map | `http://localhost:8765/variant-lab.html?page=planner&variant=A&view=requirements` | U | P | P | P | P | F | **blocked** — full drawer visual proof + commit |
| Planner · Add course | `http://localhost:8765/variant-lab.html?page=planner&variant=A&view=catalog` | F | P | P | P | F | F | **blocked** — catalog is local-only/unconfigured |
| Planner decisions · Requirement preview | `http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=preview` | U | P | P | P | P | F | **blocked** — visual state + commit |
| Planner decisions · Plan comparison | `http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=compare` | U | P | P | P | P | F | **blocked** — visual state + commit |
| Planner decisions · MCAT decay | `http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=decay` | U | P | P | P | P | F | **blocked** — visual state + commit |
| Planner decisions · Registered term | `http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=locked` | U | P | P | P | P | F | **blocked** — visual state + commit |
| Planner decisions · Substitute decision | `http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=substitute` | U | P | P | P | P | F | **blocked** — visual state + commit |
| Planner decisions · Advisor export | `http://localhost:8765/variant-lab.html?page=academics-planning-decisions&variant=A&view=export` | U | P | P | P | P | F | **blocked** — visual state + commit |
| Planning empty state | `http://localhost:8765/variant-lab.html?page=academics-planning-cold-start&variant=A` | U | P | P | P | P | F | **blocked** — measured visual proof + commit |
| Grades & Archive · Ledger | `http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=ledger` | U | P | P | P | P | F | **blocked** — populated ledger unavailable + commit |
| Grades & Archive · GPA | `http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=gpa` | U | P | P | P | P | F | **blocked** — populated GPA unavailable + commit |
| Grades & Archive · What-if | `http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=what-if` | U | P | P | P | P | F | **blocked** — measured visual state + commit |
| Grades & Archive · Transcript record | `http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=transcript-record` | U | P | P | P | P | F | **blocked** — measured visual state + commit |
| Grades & Archive · No transcript records | `http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=transcript-empty` | U | P | P | P | P | F | **blocked** — corrected live visual proof + commit provenance |
| Grades & Archive · Coursework export | `http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=transcript-export` | U | P | P | P | P | F | **blocked** — populated export state + commit |
| Grades & Archive · Term report | `http://localhost:8765/variant-lab.html?page=grades-archive&variant=A&view=term-retrospective` | U | P | P | P | P | F | **blocked** — saved report visual + commit |
| Forecast accuracy · Plain-language ledger | `http://localhost:8765/variant-lab.html?page=academics-forecast-accuracy&variant=A` | U | P | P | P | P | F | **blocked** — prediction-backed visual + commit |
| Forecast accuracy · Prediction table | `http://localhost:8765/variant-lab.html?page=academics-forecast-accuracy&variant=B` | U | P | P | P | P | F | **blocked** — prediction-backed visual + commit |
| Forecast accuracy · Below the gate | `http://localhost:8765/variant-lab.html?page=academics-forecast-accuracy&variant=C` | U | P | P | P | P | F | **blocked** — measured visual + commit |
| Grade decisions · Returned work | `http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=regrade` | U | P | P | P | P | F | **blocked** — returned-work visual + commit |
| Grade decisions · Policy applied | `http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=policy` | U | P | P | P | P | F | **blocked** — policy-state visual + commit |
| Grade decisions · Missing inputs | `http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=incomplete` | U | P | P | P | P | F | **blocked** — measured visual + commit |
| Grade decisions · Mistake evidence | `http://localhost:8765/variant-lab.html?page=academics-grade-decisions&variant=A&view=mistakes` | U | P | P | P | P | F | **blocked** — evidence-state visual + commit |
| Term rollover · Ritual | `http://localhost:8765/variant-lab.html?page=academics-term-rollover&variant=A&view=ritual` | U | P | P | P | P | F | **blocked** — rollover visual + commit |
| Term rollover · Paused work | `http://localhost:8765/variant-lab.html?page=academics-term-rollover&variant=A&view=paused` | U | P | P | P | P | F | **blocked** — paused visual + commit |
| Term rollover · January re-offer | `http://localhost:8765/variant-lab.html?page=academics-term-rollover&variant=A&view=january` | U | P | P | P | P | F | **blocked** — re-offer visual + commit |

## Terminal result

The tab is **not Stage F / built**. The corrected Planner plan and Grades empty
shell now match the approved source structurally, but final live visual proof is
still missing, the complete catalog integration is unconfigured, supporting
data-dependent views lack honest live visual proof, and the dirty shared-root
delta has no isolated commit provenance. The router must stop here; no registry
or mockup decision file was promoted.
