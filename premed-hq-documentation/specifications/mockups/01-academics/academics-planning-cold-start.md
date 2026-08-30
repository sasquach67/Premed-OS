# Academics · Planning cold start — decisions

**Status:** APPROVED (Aug 27, 2026 — Andy) · Variant A mockup target; implementation remains manifest-gated.

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

## Visual conformance sweep — 2026-08-26

- Re-anchored the state under the shared **Academics** banner and kept the
  Planning navigation visible so the empty experience does not look like a
  separate onboarding product.
- Built the empty plan as one solid 16px scene containing three 12px muted-clay
  term lanes and quiet ghost course rows. The first real fact receives the blue
  action edge; prior credit remains a subordinate sage evidence boundary.
- No invented plan, zero metric, generic hero card, or oversized primary action
  was introduced. The state remains a spatial preview of where real records go.

## Final readability and access sweep — 2026-08-26

- Removed the obsolete Tracker tab so the empty state does not advertise a
  destination that the integrated Planner proposal explicitly retired.
- Preserved the mobile scan order: one durable fact and its primary action lead,
  then the empty three-term scene explains what that fact unlocks.
- Made the one primary action keyboard-focusable while retaining the quiet,
  non-onboarding visual weight.
