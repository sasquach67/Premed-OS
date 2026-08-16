# T2 · Overview — missing mockup surfaces

**Stage:** A · **NOT DRAWN**

This is a mockup brief only. It does not authorize code changes. Re-run the
tab-brief generator after the listed surfaces are drawn, reviewed, and their
decisions are recorded.

---

## 1. Fidelity audit

### a. Spec → paper

The following ruled Overview features have no adequate mockup surface yet.
They must be drawn before an Overview implementation or fidelity brief can be
complete.

| Ruled feature | What exists on paper now | Missing drawing |
|---|---|---|
| **Task record editing** | The bento shows the task list and a passive row. `overview-s3-target.html` shows only the header affordance. | Open one task from the widget and show the same `CenterPeek` fields the app supports: title, due date, category, notes, attachment, visible equivalents for context-menu actions, and the `/overview/tasks` expanded-list handoff. |
| **Task lifecycle states** | No mockup shows the empty Now/Soon/Done states, the `+N more` compact cap, completion/undo, or a Timeline-owned step distinguished from a general task. | Draw one controlled task-state surface; do not make it a fourth Overview sub-tab. |
| **Where I Stand integration** | `overview-where-i-stand-expandable.html` draws the proposed expansion alone, outside the bento and outside the lab. | Draw the collapsed and one-open-row state at real 5-column bento density, including the three-level links, capped positions, estimated-block treatment, and no-bar-without-goal rule. |
| **Smart actions absence and dismissal** | The main bento shows three recommendations only. | Draw no-recommendation/unmounted behavior and the post-dismiss reflow. This must never become an empty card or invented recommendation. |
| **Quick Access conditions** | Main bento shows static launchers. | Draw a sparse account where launchers with no real target do not render, alongside the valid file/link capture affordance. |
| **Quarterly goals current states** | The bento card now reflects the app's rows; the lab has a draft selector for normal/editor/no-data. | Draw the chosen goal row model at its actual Overview density plus the real add/edit/no-goal paths. The visual must make manual check-off versus evidence-linked measurement unmistakable without an inferred percentage. |
| **Roadmap empty state** | The main bento shows fixed sample milestones. | Draw the no-milestones state and the real-record state together: set-up route, current-node treatment, and no generic dates. |
| **Quick Capture’s ruled inputs** | The bento only shows a text prompt. | Draw text/URL/file entry, local-only/privacy control, the Story Bank landing result, and the empty/loading/error treatment. Do not silently choose between the older Atlas wording in §6.9 and the later SB-64 Story Bank ruling. |
| **Per-widget loading/error and mobile states** | No Overview source illustrates them. | Draw one shared loading/error composition and a mobile ordering/interaction treatment; no full-page spinner and no widget failure blanking Home. |

**Spec conflict requiring a ruling in the drawing:** §6.9 still describes
Capture as flowing to Atlas, while the later SB-64 amendment says it lands in
Story Bank immediately. The current app follows Story Bank. The mockup must
record the final destination explicitly; this brief does not choose it.

### b. Mockup → app

| Mockup | App state | Visual-fidelity finding |
|---|---|---|
| `03-overview/overview-bento-control-panel.html` | Exists in `Home.tsx` and `src/components/overview/*`. | **Partial match.** The bento ordering, solid panels, hero-only glass, Task card, stat tiles, and roadmap are present. The source was updated Aug 15 to match the shipped Task header and goal-row card. It remains incomplete as a full reference because the missing states above are undrawn. |
| `03-overview/overview-s3-target.html` | Exists. | **Matching for its narrow scope.** `＋ Add task`, quiet `↗`, no inline quick-add, and no targetless domain bar landed in `e889582`. |
| `03-overview/overview-where-i-stand-expandable.html` | `WhereIStand` exists. | **Not translated.** The current component does not provide the proposed one-open-row attribution inspector shown by this mockup. |
| Quarterly Goals (`_shared/deep-state-workspaces.html?area=overview`) | `QuarterlyGoalsPanel` and standing-target `CenterPeek` exist. | **Partial / not settled.** The app has goal rows, check-off, an empty state, and target editing; the current lab state needs a page-specific visual decision and must not be treated as built. |

### c. Already built — do not rebuild

- The bento shell and real-record roadmap foundation shipped in
  `f75be18` (`feat(overview): compose bento control panel`).
- Overview ownership and Story Bank capture behavior shipped in `33cc995`
  (`fix(overview): honor August ownership rulings`).
- The Task header affordance and no-bar-without-goal correction shipped in
  `e889582` (`fix(overview): conformance sweep — add-task button, no bar without a goal`).
- `OverviewHero.tsx`, `HeroDailySchedule.tsx`, `Sidebar.tsx`, and
  `AppShell.tsx` remain frozen approved work. This brief must not use a mockup
  update as a reason to alter them.

### d. Gate

`BUILD-MANIFEST.md` authorizes `YES` for the bento, S3 Task refinement, and
Where I Stand expansion. That permits later implementation only after the
mockup ladder clears; it does **not** make the missing drawings optional.

### e. Decisions files

| Source | Decision quality |
|---|---|
| `overview-bento-control-panel.md` | **Appearance + behavior.** Its Aug 15 alignment records the current Task header and goal rows. |
| `overview-s3-target.md` | **Appearance + behavior.** Narrow and sufficient for the Task create refinement. |
| `overview-where-i-stand-expandable.html` | **Behaviour and appearance live only in the HTML.** It has no companion `.md`; a decisions file is required before a build brief. |
| Quarterly Goals shared deep-state source | **Insufficiently page-specific.** Its shared source does not record the final Overview appearance and destination conflict above. A page-specific decisions file is required. |

---

## 2. References

| What | Where |
|---|---|
| Overview product law | `specifications/03-overview.md` §1, §5–§11, §13, SB-64 amendment |
| Main Overview visual source | `specifications/mockups/03-overview/overview-bento-control-panel.html` + `.md` |
| Task refinement | `specifications/mockups/03-overview/overview-s3-target.html` + `.md` |
| Where I Stand amendment | `specifications/mockups/03-overview/overview-where-i-stand-expandable.html` |
| Existing Quarterly Goal states | `specifications/mockups/_shared/deep-state-workspaces.html` and lab entry `overview-quarterly-goals` |
| Lab workflow | `mockup-lab/VARIANT-LAB.md` |
| Visual translation and tokens | `implementation/MOCKUP-TRANSLATION-CONTRACT.md` and `specifications/mockups/_shared/_visual-recipes.md` |
| Components | `implementation/component-inventory.md` |
| Universal constraints | `general.md` — especially U-5, U-7, U-9, U-12 |

---

## 3. Work — draw the missing Overview surfaces

1. **Add the surfaces above to the mock lab, not the app.** Keep product
   navigation separate from review-state selection: Task states and Quarterly
   Goal states use the bottom A/B/C mechanism or a named state selector only
   where they are one real interaction.
2. **Preserve the settled main Overview.** Do not redraw the frozen hero,
   reorder the eight bento blocks, reintroduce QOTD/Needs Attention, or fork
   a second Task list.
3. **Use real state vocabulary.** A mockup may use illustrative content for
   design review, but it must label unsupported/pending data honestly; never
   show a fabricated percent, readiness score, projected pace, or generic
   timeline as if measured.
4. **Write the decisions before the next brief.** Each new source needs a
   companion `.md` recording both behavior and appearance: winning variant,
   visual hierarchy, row density, links, empty/loading/error treatment, and
   what is deliberately absent.
5. **Mirror every mockup change.** `mockup-lab/` and
   `specifications/mockups/` stay byte-identical for each source. Do not
   overwrite unrelated existing drift in `variant-lab.html` while doing so.

---

## 4. Do not break

- Do not build React code, change store shapes, or modify persistence in this
  stage.
- Do not infer metrics or draw a bar without a student-set goal (U-5/U-9).
- Do not create an inline task quick-add, a second task surface, or a second
  prioritization concept.
- Do not use glass on dense content surfaces; glass remains limited to
  floating hero/overlay surfaces.
- Do not change the frozen hero or shell files.
- Do not quietly resolve the Atlas-versus-Story-Bank capture contradiction.

---

## 5. Done when

- [ ] Every row in §1a has a named mockup surface reachable from the lab.
- [ ] Each surface has A/B/C only when there are three genuine layout choices;
  otherwise it is visibly one state, not fabricated alternatives.
- [ ] `rg -n "Quick add|Needs attention|QOTD"` across the new Overview mockup
  sources finds no reintroduced forbidden UI.
- [ ] `rg -n "[0-9]+%|readiness|score"` is reviewed: no displayed percentage
  or score is an inferred/composite metric.
- [ ] Quarterly Goals records its visual decision and capture records its
  final destination before either can advance to Stage B.
- [ ] Changed mockup sources and their companion `.md` files match in the
  lab and canonical mirror.

## 6. Commit

```
docs(mockups): complete Overview state coverage
```

Commit only the new Overview mockup sources, their decisions, and the lab
registry/mirror updates. Unrelated working-tree changes remain separate.

## 7. Next stage — not in this brief

After the missing surfaces are drawn and Andy has approved the final
treatments, rerun the generator. It should then land on **Stage B · Decisions**
for the sources without complete appearance records. No frontend or backend
implementation work is in scope until that stage passes.
