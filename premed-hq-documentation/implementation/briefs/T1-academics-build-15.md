# T1 · Academics — `TopicLink` and the Connect step

**Stage:** C · DECIDED, NOT BUILT · **EXECUTED Aug 19, 2026**

**Scope:** The `TopicLink` entity (§6.6 Connect) and the affordance that
authors one. Frontend and backend.

---

## 1. Why this one

The spec calls it outright: **"This is the largest missing piece — every
current feature treats topics as independent islands."** Four things are
waiting on it:

| Waiting feature | What it needs |
|---|---|
| Study method's **Needs connecting** group | `recalled but no TopicLink` → `Connect it` (§6.6 table) |
| **#39 concept-map gaps** | topics with **no** `TopicLink` at all |
| **#22 cross-class overlap** | a proposal the student confirms, which *writes* a `TopicLink` |
| **#21 prerequisite decay** | `TopicLink` relations of kind `prerequisite` |

`studyMethod.ts` already documents the absence: its `needs-connecting` group is
deliberately omitted "because Pretest/Predict, TopicLink and Full mock do not
exist", and the component renders whatever `studyGroups` returns — **so the
group turns on with no component change.**

## 2. Audit

- **Spec → paper:** the entity is fully ruled at `01-academics.md` line 55 —
  `fromTopicId`, `toTopicId`, `relation`, `note`, `createdAt` — and §6.6 rules
  the flow: after a topic is covered, prompt for an explicit link, suggest
  candidates, and the **user writes it**.
- **Mockup → app:** the *group* is drawn in `academics-study-method.html`. The
  linking affordance itself is not separately drawn.
- ⚠️ **No new variant question is opened.** Andy ruled **A + C** for
  topic ↔ assignment linking on Aug 19 (`1ba9c7e` / `413fca9`): inline chips
  lead, a picker is the link-many escape hatch above five candidates, and the
  handoff is specified. **Topic ↔ topic is the same act against a different
  record**, so it reuses that ruling rather than asking for a second one.
  Opening a fresh A/B/C here would be inventing a decision, not honouring one.
- **Gate:** `academics-study-method.html` is **`YES`**.
- **Integrations:** none. **No ANDY CHECKLIST.**

## 3. The records

1. `TopicLinkRelation = 'builds-on' | 'contrasts-with' | 'same-mechanism'
   | 'prerequisite' | 'shared-mcat-category'` — the spec's five, no more.
2. `TopicLink { id, fromTopicId, toTopicId, relation, note?, createdAt,
   updatedAt, order }` in a new `classCenter.topicLinks[]`.
3. `migrateTopicLinksV21` — adds the empty array. Pure, idempotent, **invents
   no link**.

## 4. The work

### `src/lib/academics/topicGraph.ts` (new)

4. `linksForTopic(links, topicId)` → both directions, since a link is
   undirected in practice even though it is stored with a direction.
5. `linkTopics(links, { fromTopicId, toTopicId, relation, note })` — refuses a
   self-link and refuses a duplicate pair **in either direction**.
6. `unlinkTopics(links, linkId)`.
7. `connectCandidates(topic, topics, courses, links)` → the §6.6 suggestion
   set, in the spec's own order: same course first, then a prerequisite
   course, then **shared MCAT content category** via `mcatTiming.courseSections`.
   Already-linked topics are excluded. **Candidates are suggestions the student
   picks from — nothing is written by suggesting.**
8. `isolatedTopics(topics, links)` → #39's input: topics with no link at all.
9. `topicGraph.test.ts` — self-link refused, duplicate refused in both
   directions, candidate ordering, MCAT-category candidates only where a course
   maps, and `isolatedTopics` excluding anything linked either way.

### Turn on the study-method group

10. `studyMethod.ts` — add `needs-connecting` (recalled, no `TopicLink`) with
    action `Connect it`, and update its header comment, which currently names
    `TopicLink` as a reason the group is absent.

### `src/components/academics/TopicConnectField.tsx` (new)

11. The ruled A + C composition, applied to topics: relation-labelled chips for
    existing links each with `×`, a dashed `+ Connect topic` opening a
    typeahead over `connectCandidates`, and `Link many…` above five candidates.
12. Choosing a candidate asks for the **relation** — the link is meaningless
    without it, and defaulting it would author a claim the student did not make.
13. Mounted on `TopicRow`, beside the existing assignment-link field.

## 5. Do not break

- **Never auto-write a link.** §6.6 and #22 both rule proposals-then-confirm.
- No merging of topics, ever — "a wrong merge corrupts two classes' review
  schedules at once".
- Unlinking removes one statement; it never deletes a topic or touches FSRS.
- U-9: no connectedness score, no coverage percentage over the graph.
- Do not fork `TopicLinkFields`; this is a sibling, not a variant of it.

## 6. Done when

- [x] A student can link two topics with a named relation, and unlink it.
- [x] Duplicates and self-links are refused.
- [x] The study-method `Needs connecting` group appears once links exist.
- [x] Migration is pure and idempotent, with a test.
- [x] Build passes; suite green; **surfaces measured against the drawing**.

## 7. Commit

`feat(academics): add TopicLink and the Connect step (§6.6)`
