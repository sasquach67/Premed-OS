# Remove Topics from Academics

Requested: eliminate the standalone Topics feature across Academics and deploy.

## Completion criteria

- Class navigation is Overview, Materials, Assignments, Guide. Old Topics links safely open Materials.
- No topic creation, topic linking/pickers, coverage/readiness counters, topic recommendations, or topic scheduling controls remain in active Academics workflows.
- Syllabus imports preserve learning objectives in source/context without creating standalone Topics records.
- Study generation uses explicit materials, lesson/assessment context, and accepted Guide direction, without requiring topic links.
- Existing materials, notes, notebooks, cards, and review history remain intact. Legacy storage fields stay readable for backward compatibility; older material placement metadata remains usable without exposing a Topics feature.
- Full automated checks pass and the deployed UI is inspected separately.

## Milestones

1. Remove class/dashboard surfaces and old alternative topic screens.
2. Remove secondary workflow controls and active topic-driven generation/import behavior.
3. Audit global entry points; test data preservation, source scoping, and old links.
4. Review changes, build/test/lint, deploy, verify release and UI.

## Review and validation

- Removed the unused legacy class workspace and topic editing components, as well as active tab/dashboard/control entry points.
- Review caught syllabus provenance being reused as exam scope. Fixed with optional `examStudyFileIds`, explicitly selected by the student; no fallback and no shared-file assignment expansion.
- Existing source placement and historical study task labels are read-only compatibility uses of legacy metadata.
- Verified local demo: four class tabs, old Topics URL opens Materials, notebooks and material lists remain accessible, Guide still works.
- Full suite: 280 files / 2,095 tests passed with two workers. An earlier default-concurrency run hit an unrelated notebook-import test timeout; reduced-concurrency run passed without changing that test.
- Lint: zero errors, 55 existing warnings. Dependency audit: zero vulnerabilities. Retained-release-asset checks passed.
