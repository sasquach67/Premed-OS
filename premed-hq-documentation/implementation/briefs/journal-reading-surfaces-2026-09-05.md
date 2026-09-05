# Journal study guide and mastery reading surfaces

Scope authorized by the September 5 journal coordinator: reading presentation only.
Based on b96cbc3, which already contains ef19afb. Entry setup, Overview,
generation helpers, persistence schema, and shared page CSS remain outside this change.

## Reading changes

- The guide has a native, labeled section picker on narrow surfaces. It contains
  every section and uses the existing reading-pane scroll/focus helper. Desktop
  bookmarks remain independently scrollable and mark the selected section.
- Existing saved concept maps are available under “How the ideas connect.” Every
  node detail and every directed edge is represented, including branching and
  evidence connections. No relationships are inferred from array order. The
  disclosure starts closed; source passages remain inside a nested Sources
  disclosure. Guides without a saved map do not acquire a fabricated one.
- Generated applications receive internal padding; instructor emphasis, all
  explanatory blocks, and worked answers remain intact.
- Mastery mode controls use the shared Button, compact text, and unboxed outline
  icons. The full outline remains expanded by default. Recall still hides the
  checklist, answers, source passages, and self-assessment until revealed.
- Objective titles wrap, navigation has a quiet divider, and caution and success
  treatments use theme tokens. Objective navigation respects reduced motion.

Design: keep the established Baloo display/Nunito reading pair and theme tokens.
Dark palette: background #211e1a, card #2b2722, text #ece3d4, blue #4b9cd3,
mint #6fc0a8, amber #e7b06a. The distinctive reading aid is the explicit
concept-to-relationship-to-concept line, with definitions available immediately
above it. It preserves branching instead of implying a generic linear process.

## Verification

- 13 tests pass across LectureGuideView.test.tsx, LectureStudyViews.test.tsx,
  and MasteryLearningModes.test.tsx. New tests check complete picker options,
  focus/selected navigation, all map nodes/edges, and deduplicated folded sources.
- Changed-file ESLint and git diff --check pass.
- npm run build passes using this checkout's npm ci installation. Existing
  bundle-size warnings remain; no dependency manifests changed.
- Local browser fixture rendered the actual components with production styles
  and representative gene-expression content. Inspected dark guide, light
  desktop mastery, phone-width guide/connections and mastery, long objective
  titles, section jump focus, and recall reveal. Measured document width equals
  viewport width at 390 CSS px; no overflowing heading, paragraph, list item,
  button, or select was detected. Desktop measured 1422 CSS px with no overflow.
  Browser viewport override was reset and temporary QA files removed.

This is component-level local evidence, not a signed-in production-route check.
No matching raw coursework Markdown artifact was found in this checkout or the
focused Downloads search; no full-corpus comparison or generation-quality claim
is made. No provider requests or saved coursework mutations were performed.
The coordinator owns integration and publishing.
