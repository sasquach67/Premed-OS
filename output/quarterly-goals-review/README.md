# Quarterly goals overflow fix — September 28, 2026

The panel filtered out every active goal after the fourth with `slice(0, 4)`. Removing that truncation and adding a keyboard-focusable, 320px-high maximum scroll region keeps every active goal reachable without making the card grow indefinitely. The header stays outside the scroll area. Saving a new goal in the panel scrolls that list to its end; archived goals remain excluded.

The regression test first failed with `Could not find button containing: New fifth goal`, then all eight OverviewSupport tests passed after the fix. Targeted ESLint and the production TypeScript/build passed.

Browser verification used the actual QuarterlyGoalsPanel and goal editor on the synthetic-only local fixture at port 5294. Four initial goals, including a wrapped title, were followed by a fifth created through Add goal / Save goal. The fifth appeared automatically. Observed list metrics: clientHeight 320, scrollHeight 451, scrollTop 131 after save; scrolling upward returned it to 0, and keyboard End moved it downward. The header and Add goal stayed visible. No real-account data was inspected or edited.

Reproduce: `npm run dev -- --host 127.0.0.1 --port 5294 --strictPort`, then open `/output/quarterly-goals-review/index.html`. This fixture intentionally resets only synthetic data on that local origin and is not part of the production entry point.
