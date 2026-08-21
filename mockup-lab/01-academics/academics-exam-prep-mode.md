# Academics · Exam prep mode — decisions

**Status:** PROPOSED · Stage-B decision record

## Product views

| View | Job |
|---|---|
| Accelerated | Build the default front-loaded plan from class evidence and the student's available time, with a clear finish time for each day. |
| Steady | Spread the same scope across more days during an overwhelming week without treating the student as behind. |
| Catch-up | Reflow a changed plan and name what to defer; it is a state of Exam Prep, never a selectable pace mode. |
| Clocked out / exam day | End the day's work truthfully, then offer the optional exam autopsy and later decay check. |

## Behaviour

- Exam Prep is a temporary, full-screen class mode entered from **Build exam
  plan** or an imminent-exam offer. It exits back to that class and ends when
  the exam does. It is not a permanent Class Hub tab or a nested sidebar page.
- It assembles existing, attributable inputs: syllabus-derived scope, recorded
  topic state, available study time, completed past exams, and linked lecture
  evidence. It never invents content, grades, a blended readiness claim, or an
  exam outcome.
- The plan makes a day finite. Each day states its planned finish time and why
  its work is first; once it is complete, the clocked-out state ends the day's
  asks rather than finding more work.
- **Accelerated** and **Steady** are the only intensity options. The value is
  shared with the Daily Academics and MCAT planners through one weekly-capacity
  setting. The first change explains that shared reach once; reverting is
  quiet. The product never chooses a setting for the student.
- Catch-up is detected from an updated plan, not selected. It reflows remaining
  days and names what can be deferred or abandoned; it never creates an overdue
  count, a debt ledger, or a moralizing warning.
- A missing syllabus scope, calendar connection/capacity, past exam, or lecture
  evidence leaves that input visibly absent with a manual/continue path. The
  student can still make a less-informed plan; no widget fabricates evidence.
- Exam day closes the temporary mode and offers, but never requires, the short
  autopsy and later post-exam decay check.

## Appearance

- The full-screen frame deliberately replaces the ordinary app shell. A shallow
  layered Academics banner establishes place with an exit affordance, class
  identity, and restrained factual context; it should read as a focused work
  session, not a new permanent destination.
- **Today is the dominant bento.** Its active plan is expanded and carries the
  finish-time promise. Future days are compact, reason-bearing rows. This
  uneven composition is intentional: a uniform stack of day cards would hide
  the thing that needs attention now.
- The pace control is a compact explanatory status surface in the header—not a
  second segmented pill beside the global Daily/Planning switch. It says the
  current mode and factual timing consequence, then reveals the alternative on
  request. Catch-up sits alongside that same control without changing the
  selected pace.
- Steady's first-use notice is a small, anchored explanation close to the
  control. It explains shared weekly impact without becoming onboarding or a
  blocking dialog.
- The catch-up composition preserves the current-day bento, but moves the
  concrete defer/keep choice into the strongest nearby decision surface. It
  should feel like a calm re-plan, never an error screen.
- The clocked-out state is visually quieter than an active plan: a resolved
  closed-day card, no prominent next action, and explicit permission to leave.
  Exam-day closure moves attention to the optional reflection/autopsy card.
- Glass belongs only to any banner surface floating over banner art. Day cards,
  evidence rows, time availability, and the catch-up decision are
  solid-with-depth using the shared Academics tokens, borders, and shadows.
- Motion is functional and small: focused-mode entry/exit and day reflow use
  the shared transition system; plan changes never use animation to imply a
  data value. Reduced motion retains the final state with no choreography.

## Evidence and honest absence

- Any forecast remains a **band** tied to named topic evidence and the exam
  date. It is not a single-point outcome, a relative ordering, or a standalone
  completion bar.
- Lecture guidance must be a quote or observed source reference with a
  timestamp. If no capture exists, the panel names that absence instead of
  pretending lecture intelligence is available.
- Calendar capacity may use a live connection only after the student has
  configured it. Before then, the interface uses the student's own entered
  capacity or says that calendar availability is not connected.

## Component translation

- Configure the existing class workspace, `ModeSwitch`, `InteractiveCard`,
  `MascotNote`, and `CollectionState` owners; do not fork a new exam-dashboard
  component system.
- The dominant Today card is an existing interactive-card composition with
  configured evidence and action slots. Future-day rows are the same data model
  at a compact density, not a second planner list.
- The entry/exit and re-plan transition may use the shared motion system and
  reduced-motion handling. Component-library references supply interaction
  polish only; Premed OS tokens, type, density, and hierarchy remain the source
  of truth.

## States

- **Accelerated:** enough observed capacity to finish earlier, without turning
  spare time into a third, more demanding mode.
- **Steady:** same scope, later finish, still explicitly on pace.
- **First shared-setting change:** one anchored explanation that the setting
  also affects the user's other study planning surfaces.
- **Catch-up:** deadline is closer or capacity changed; remaining work is
  reflowed, and the plan states what it will not ask the student to do.
- **Clocked out:** today's committed work is complete; the mode does not offer
  bonus work or make tomorrow feel overdue.
- **Missing evidence:** no parsed scope, capacity source, past exam, or lecture
  capture stays dormant-with-a-reason and offers the appropriate manual route.
- **Exam day / closeout:** a skippable autopsy offer and a later decay-check
  reminder, neither framed as compulsory homework.

## Full-mock extension

### Behaviour

- **Eligibility / start** is nested inside the existing Exam Prep mode and names one class, one exam scope, and the exact student-supplied materials it may use. Without either scope or sufficient material, it stays dormant-with-a-reason and routes to Materials or exam-scope setup rather than generating generic questions.
- **Focused runner** temporarily replaces the ordinary shell. It has elapsed time and one explicit end action, but no pause, answer peek, persistent sidebar, or Class Hub tab system. Its source context states that the item is generated practice, not a real past or upcoming professor exam.
- **Autopsy** records only topic-level evidence from the attempt: missed or self-flagged topic, its source, and a next action. It does not calculate a readiness score, rank, composite, or forecast for the real exam.
- The runner and autopsy do not introduce Anki ownership, card scheduling, or any source outside student-supplied class material.

### Appearance

- Eligibility shares the focused Exam Prep banner, then uses one broad scope-and-source panel paired with a restrained honest-absence rail. This makes the source requirement look like a real prerequisite, not an error toast.
- The runner is deliberately spare: a shallow solid top bar, one centered question card, concise source-context rail, and a clearly separated end action. It is a working surface, not another dashboard.
- The autopsy returns to the Exam Prep banner and pairs a generous evidence list with a narrow explanation rail. Topic rows are individually actionable and vary by missed versus self-flagged status, avoiding a flat table or a score summary.
- Literal warm-dark ladder stays `#211e1a` page, `#2b2722` panel, `#322e28` nested surface, `#3c352d` border; 16px panels and 13px inner cards preserve the established density. Glass stays only in the floating banner/chrome treatment because every dense runner and evidence surface is solid-with-depth.
- Focused-mode entry/exit remains a short shared transition. Reduced motion lands immediately on the runner or autopsy state with no timed choreography.
