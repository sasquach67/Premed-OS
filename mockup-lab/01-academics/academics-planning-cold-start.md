# Academics · Planning cold start — decisions

**Status:** PROPOSED · Stage-A coverage

## Behaviour

- This is Planning’s no-record state, distinct from Daily’s syllabus-import launchpad.
- It asks for only the minimum durable fact: a current/completed course or prior credit. No plan, GPA, audit, recommendation, or chart appears until real information exists.
- Either path leads to the normal course/prior-credit capture flow; Planning remains read-mostly once records exist.

## Appearance

- The standard Academics banner, Planning mode thumb, and underline tabs keep the student oriented.
- The dominant surface is a lightly constructed, empty three-term plan—not a large centered empty card. Its dashed course slots show what the first fact will unlock without displaying fake recommendations or zero metrics.
- A narrow editorial introduction at left names the one next action. The small first-fact object sits inside the plan at the point where real information enters; prior credit is an intentionally subordinate off-canvas option.
- Glass stays limited to the mode pill in the banner. The planning canvas is solid and quiet.

## Component translation

- Keep `ModeSwitch`, `Tabs`, and the existing Planner owner. This is an `EmptyState` composition, not a new onboarding framework.
- The empty term canvas takes its spatial composition from 21st.dev reference work, but its input path is the existing class/prior-credit form and Premed OS styling.
