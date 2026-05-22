# Visual Verification Prompt

Add browser-level frontend verification for the current project.

Goals:

- verify the app loads in a real browser
- verify primary heading and CTA are visible
- verify key sections render
- test desktop and mobile viewports
- capture screenshots for human review
- keep lint and production build passing

Constraints:

- make the verifier reusable where practical
- do not make fragile assertions against purely decorative content
- store screenshots in a predictable ignored output folder

When complete:

1. run full verification
2. summarize modified files
3. explain verifier architecture
4. identify remaining visual QA gaps honestly

## Related Layer

For semantic usability checks, pair this with `accessibility-verification.prompt.md`.
