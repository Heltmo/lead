# Login Workspaces V1

## Objective

Move from local/shared beta continuity toward real user and team workspaces.

A seller should be able to log in and return to the same workspace with leads, notes, statuses, owners, follow-ups, and activity history intact.

## V1 Build

- Design the minimum user/team workspace model before implementation.
- Define how existing local SQLite and Netlify Blob workspace data maps to future workspace records.
- Implement the first narrow auth/workspace slice only after the data boundary is clear.
- Preserve the current beta path while login work is introduced.

## Boundaries

Do not add billing, CRM sync, automatic email sending, telephony, sales scripts, private-person profiling, or broad scraping.

## Success Criteria

- Workspace identity and ownership are explicit in the design.
- Existing local and hosted beta workflows are not broken.
- Notes, queues, outcomes, and follow-ups have a clear migration path.
- Relevant workspace persistence, hosted beta, and Netlify checks pass.
