# T1 · Academics Daily · Class Hub Topics — Variant A fidelity

**Stage:** E · FRONTEND FIDELITY  
**Variant:** A · week-primary syllabus standards  
**Build gate:** `academics-class-hub.html` = `YES`  
**Scope:** Class Hub Topics tab only.

## Router audit

- Spec/paper/gate pass: Topics are syllabus learning standards/objectives;
  schedule is chronological context, never coverage proof.
- Mockup/app fails: current app groups primarily by `unit`, prints “Weeks not
  mapped,” and offers `Covered a topic today`, which creates a manual generic
  Topic. Andy explicitly settled week-primary ordering and syllabus-led Topic
  creation.
- Preserve Topic/FSRS records, status filters, Topic row actions, exam scope,
  Class Plan track, notes/material links, and local persistence.

## References read

Approved `academics-class-hub.html?variant=A&view=topics` + same-name MD and
mirror; `tabs/01-academics.md` Topic rules; visual recipes; `Topic` contract;
`ClassHub.tsx` Topics/TopicRow; syllabus import route.

## Work · one stage

1. Group/sort primarily by real `scheduledFor` week; topics without a schedule
   stay visible under `Schedule not mapped`, ordered by syllabus `order`.
2. Show unit as secondary context only. Never infer a week from transcript or
   current date.
3. Replace manual Topic creation with compact `Import / refresh syllabus`.
4. Keep real status filters and row interactions; port exact Variant A panel,
   row, spacing, typography, border, radius, dark/paper ladder, and mobile wrap
   into the scoped Class Hub stylesheet with a source comment.
5. Do not touch store/types/parser/global CSS or Planning.

## Done when

- [x] week-primary/fallback ordering and syllabus action are visible;
- [x] no manual/transcript Topic creation appears;
- [x] empty/populated/filter controls and both themes/390px are checked;
- [x] focused tests, TypeScript/build, diff-check pass;
- [ ] no BUILT promotion without six-condition proof/provenance.

## Execution audit

- `groupTopicsByWeek` groups only from persisted `Topic.scheduledFor`, sorts
  Monday-week keys chronologically, and keeps unscheduled standards under
  `Schedule not mapped` in syllabus order. Unit names remain secondary labels.
- The previous `Covered a topic today` and generic `Add topic` paths were
  removed from Class Hub. The sole creation/update entry is the real
  `Import / refresh syllabus` handoff.
- Status filters were exercised live: `Marked ready` filtered the rendered
  standards and `All` restored them. Existing Topic row review, retention,
  exam-scope, notes, and linking controls remain app-native and active.
- Empty copy routes the student to syllabus import and does not invite a
  transcript-derived or manual Topic.

### Measured mockup to app fidelity

| Property | Approved Variant A / authority | App result |
| --- | --- | --- |
| Primary grouping | week chronology; unit secondary | persisted Monday-week groups; unit names in group metadata |
| Page action | compact syllabus import | `Import / refresh syllabus`, outline `sm` |
| Dark panel ladder | mockup `#2b2722`, border `#3c352d` | week panel `rgb(43, 39, 34)`, `rgb(60, 53, 45)` |
| Light panel ladder | locked paper theme (mockup has no light CSS): `#fffaf0`, `#e9e2d5` | `rgb(255, 250, 240)`, `rgb(233, 226, 213)` |
| Accent | `#4b9cd3` | `#4b9cd3` |
| Responsive target | 390 CSS px, wrapped controls, no clipped row actions | true 390px iframe render; filters wrapped and rows stacked without clipped controls |

### Evidence

- dark desktop: `/tmp/class-hub-topics-dark-desktop.png`
- light desktop: `/tmp/class-hub-topics-light-desktop.png`
- dark 390px: `/tmp/class-hub-topics-dark-mobile.png`
- focused test includes scheduled-week ordering and absence of manual Topic
  creation; TypeScript and production build passed on the shared root.

## Commit

`fix(academics): translate syllabus-led Topics Variant A`
