# Accessibility Verification Prompt

Add browser-executed accessibility verification to the current frontend project.

Goals:

- use Playwright with Axe
- run checks in configured desktop and mobile projects
- fail verification on automated WCAG violations
- report useful violation details
- keep lint, build, and browser smoke tests passing
- update reusable verification docs or templates where useful

Constraints:

- keep accessibility helpers reusable
- do not suppress violations without explaining why
- avoid brittle assertions against decorative content

When complete:

1. run full verification
2. summarize modified files
3. explain verifier architecture
4. identify remaining accessibility gaps honestly
