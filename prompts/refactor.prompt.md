# Refactor Prompt

Refactor the project for maintainability without changing the intended user-facing experience.

Goals:

- separate orchestration, sections, components, and data
- reduce monolithic files
- create bounded edit surfaces for future agents
- preserve existing behavior and visual output

Constraints:

- do not introduce unnecessary dependencies
- avoid unrelated visual redesign
- preserve lint/build success

When complete:

1. run the project verification script
2. summarize moved/modified files
3. explain architecture decisions
4. identify remaining weaknesses honestly
