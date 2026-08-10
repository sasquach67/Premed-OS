# Implementation Governance

## Instruction hierarchy

Coding agents should read:

1. Product vision
2. Global framework files
3. Relevant tab specification
4. Existing code and design system
5. Current issue or implementation prompt

## Requirement treatment

- Preserve accepted requirements unless explicitly replaced.
- Do not silently reinterpret domain-specific rules.
- Do not duplicate global infrastructure inside individual tabs.
- Do not copy metrics into unrelated tabs.
- Prefer reusable components and shared data models.
- Keep recommendations explainable.

## Every implementation prompt should specify

- Scope
- User outcome
- UI behavior
- Data model impact
- Global dependencies
- Tab-specific logic
- Edge cases
- Accessibility
- Mobile behavior
- Acceptance criteria
- Explicit exclusions

## Documentation updates

When implementation changes behavior, update the corresponding Markdown specification in the same commit.
