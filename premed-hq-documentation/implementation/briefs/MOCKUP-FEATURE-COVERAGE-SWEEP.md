# Mockup feature-coverage map — Aug 14, 2026

> **⚠️ RE-SWEPT Aug 20, 2026 for Academics only.** This map predates the
> surfaces drawn Aug 17–20, so it is stale for anything added since. The
> Academics re-sweep ran all **121 numbered features** in `tabs/01-academics.md`
> against the mockup corpus and found **two** needing a surface of their own:
>
> | # | Feature | Drawn |
> |---|---|---|
> | 52 | Forecast accuracy ledger ⭐ | `academics-forecast-accuracy.html`, Aug 19 |
> | 43 | Term retrospective | `academics-term-retrospective.html`, Aug 20 |
>
> **Everything else flagged was a false positive.** Most were drawn under
> different wording — `#47/#48` are the "Blanked / Did not know" tags in
> `academics-grade-decisions.html`. A whole class of them — `#16`, `#21`,
> `#25`, `#36`, `#39` — are **learning-signal types**, and the drawn signals
> panel covers them as a pattern; each does not need its own frame.
>
> **Overview, MCAT, Clinical and the other pillars have NOT been re-swept.**

## Purpose

This is the durable map from canonical product areas to their visible mockup
surfaces. A feature is not considered visually covered merely because its name
appears on a review card. It must appear in the screen, tab, workflow state, or
empty state where a student would actually encounter it.

The lab currently exposes **61 review pages**. Four are deliberately undrawn:
Timeline & Tasks, Profile / CV, Help, and Settings. Everything else listed below
has a real HTML surface and three A/B/C layout directions.

The previous generic `feature-coverage-sweep.html` remains as historical source
material but is no longer a lab destination. Its useful states were promoted
into full owner workspaces.

## Product map

### Overview

| Product surface | Visible mockup | Features visibly represented |
|---|---|---|
| Overview | `03-overview/overview-bento-control-panel.html` | eight-block bento, smart actions, Now/Soon/Done tasks, Where I stand, quick access, roadmap |
| Quarterly goals | `_shared/deep-state-workspaces.html?area=overview&view=quarterly-goals` | check-off, cumulative metric, period metric, evidence connection |
| Goal editor | `_shared/deep-state-workspaces.html?area=overview&view=goal-editor` | AI suggestion, student confirmation, manual fallback, no fake percentage |
| Honest absence | `_shared/deep-state-workspaces.html?area=overview&view=no-data` | no bar without goal, no zero chart, friendly empty copy, reduced-motion outcome |

### Academics

| Product area | Sub-tabs / states present in the lab |
|---|---|
| Daily | Class Center; Assignments → Agenda / Weekly / Calendar; Empty state |
| Class Hub | Overview / Materials / Topics / Assignments / Notes |
| Study flows | Review → Start / Recall / Gap report; Exam plan → Accelerated / Steady / Catch-up; Syllabus import → Upload / Review / Re-import; Class types → Comparison / STEM / Writing |
| Planning | Planner; Tar Heel Tracker → Gap & pace / All requirements / Prior credit; Grades → Ledger / GPA / What-if |
| Class-owned learning signals | interleaving, deadline collision, prerequisite decay, cycle stall, cram context, reread pattern, topic difficulty, material staleness, weekly attention auction |
| Grade decisions | upward trend, W deadline, effort-to-outcome, regrade window, blanking versus not-knowing |
| Term rollover | retire with class, carry for MCAT, carry as prerequisite, return amnesty |

The last three rows are full owner surfaces in
`_shared/deep-state-workspaces.html?area=academics`, not new Academics tabs.

### MCAT

| Product surface | Visible mockup | Features visibly represented |
|---|---|---|
| Dashboard | `02-mcat/mcat-dashboard.html` | next study action, measured readiness, plan context |
| Plan | `02-mcat/mcat-plan-spec.html` | intake constraints, phases, protected full-length review, rebuild when unreachable |
| Content | `02-mcat/mcat-tab-spec.html?screen=content` | section rollups, owned resources, expiry collision, one-way `.apkg` boundary |
| Questions | `02-mcat/mcat-tab-spec.html?screen=questions` | source-aware real practice and result logging |
| Mistakes | `02-mcat/mcat-tab-spec.html?screen=mistakes` | Mistake-to-Mastery review loop; section-aware drills remain nested here |
| Stats | `02-mcat/mcat-tab-spec.html?screen=stats` | real full-length evidence, score anchors, sections, dated context |
| Advisor | `02-mcat/mcat-tab-spec.html?screen=advisor` | explainable adjustment with reason and controllable next move |
| Working Session | `_shared/deep-state-workspaces.html?area=mcat&view=session` | customize, Pomodoro/focus, quick mistake/note, pause, resume, end early, actual-time summary |
| Test Day | `_shared/deep-state-workspaces.html?area=mcat&view=test-day` | Register / Logistics / After, official dated facts, prewritten void rule; this is a Dashboard panel, not an eighth tab |
| Full-length validity | `_shared/deep-state-workspaces.html?area=mcat&view=validity` | sitting/timing/break flags, inclusion reason, stamina evidence, diagnostic/current/goal anchors, dated percentile source |

### Experience pillars

Every pillar is a peer category in the lab. There is no generic “Experiences”
category and no sixth shared-feature page.

| Pillar | Canonical sub-tabs | Key depth now visible |
|---|---|---|
| Clinical | Sites / Shifts / Reflections | credentials, skills observed/performed, person-scoped verifier, selected-site workspace, dated ledger, estimated block excluded from pace, prompted reflection |
| Volunteering | Organizations / Events / Reflections | standing versus single-day service, continuity from dated events, organization workspace, event ledger, prompted reflection |
| Shadowing | Physicians / Visits / Reflections | specialty-breadth table, physician relationship, bio/contact/question context, visit ledger, cross-specialty reflection |
| Research | Projects / Outputs / Lab notes / Reflections / Discover | role progression, PI relationship, authorship expectation, output pipeline and lineage, decision/anomaly/blocker notes, ELN boundary, sourced opportunities |
| Extracurriculars | Organizations / Initiatives / Reflections / Discover | contribution without a leadership ladder, initiative outcomes and handoff, organization record, prompted reflection, sourced campus opportunities |

All experience sub-tabs are configured by
`_shared/experience-pillar-dashboard.html`. The first tab uses a card grid and
the approved full-width selected-record drop-down; supporting sub-tabs render
their own ledgers, worklists, pipelines, and discovery surfaces.

### Application

| Product family | Canonical sub-tabs | Key depth now visible |
|---|---|---|
| School List | Explore / Track | data-trust layers, official roster facts, map, student-owned tiers, prerequisite record presence, letter routing, pasted secondary prompts, elapsed time, export |
| Essays & Story Bank | The bank / Essays / Writing desk | seven-theme retrieval, newest-first owned material, journal/orphans, exact pasted prompts and limits, filtered source material, student draft, cited AI direction, paste-test boundary |
| Letters of Rec | People / Dossier / Requests | automatic people door, relationship record, work links and excerpts, running notes, conversation subject, phase-gated requests, ready-only packet, waiver, no sending or storing letters |

These are configured by `_shared/application-workspaces.html`.

## Deliberate exclusions

Per Andy’s Aug 14 scope, this pass does not draw:

- Timeline & Tasks
- Profile / CV
- Help
- Settings

Their dashed A/B/C direction placeholders remain the honesty mechanism. They
must not be described as implemented or approved.

## Coverage rule going forward

When a feature enters a canonical spec:

1. place it in its real owner screen, sub-tab, workflow state, or empty state;
2. make the state directly reviewable in the lab if it is not visible in the
   owner’s default frame;
3. do not create a generic feature card as a substitute for designing the
   interaction;
4. do not create an extra product tab merely to make the feature visible;
5. keep invisible rules invisible, but show their user-visible result—for
   example, “no bar without a goal” renders a neutral row with no bar.

This map records visual coverage only. It is not approval and it is not build
permission; `BUILD-MANIFEST.md` remains the implementation gate.
