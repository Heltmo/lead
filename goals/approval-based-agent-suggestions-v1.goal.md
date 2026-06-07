# Approval-Based Agent Suggestions V1

## Objective

Allow product agents to propose workflow changes that the seller explicitly approves.

This comes after Lead Verifier V1 proves useful and trustworthy.

## V1 Build

- Let the verifier or command center propose queue/status/follow-up changes as pending suggestions.
- Require an explicit seller action before any mutation.
- Record accepted suggestions in activity history with source and timestamp.
- Make rejection/no-action harmless.

## Boundaries

Do not auto-mutate workflow state. Do not send email, place calls, sync CRM, generate outreach, or override seller judgment.

## Success Criteria

- Suggested changes are visually distinct from saved workflow state.
- Accepting a suggestion creates a normal workflow update and activity entry.
- Ignoring or rejecting a suggestion leaves the lead unchanged.
- Existing queue, activity, export, and verification checks pass.
