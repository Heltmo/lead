# Agent Instructions

## Product Context

Lead Machine is a seller desk. Sellers choose what they sell, search a market, review ranked leads, call through normal `tel:` links, save notes, manage follow-ups, and export call lists.

The main product path is:

```text
seller intent
-> search/import
-> verified and ranked leads
-> seller work queues
-> notes and follow-ups
-> activity history
-> export / later email-connected activity
```

## Required Reading

Before planning or changing code, read:

- `OPERATING_GUIDE.md`
- `CURRENT_STATE.md`
- `NEXT_MILESTONE.md`
- the relevant `goals/*.goal.md` file when one exists
- `HERMES_CODEX_LOOP.md` when the work is delegated through Hermes/Codex

## Development Loop

Use small scoped tickets. Each ticket should define:

- objective
- likely files or subsystems
- acceptance criteria
- explicit out-of-scope items
- required verification commands

Default loop:

```text
plan
-> implement
-> run relevant checks
-> inspect diff
-> fix failures
-> summarize changes, verification, and risks
```

## Product Guardrails

Do not add:

- generated pitch scripts
- automatic calls
- automatic email sending
- CRM sync
- billing
- private-person profiling
- login-gated scraping
- broad scraping or historical monitoring
- queue/status mutations by background agents without explicit seller approval

Sellers own conversation and judgment. Lead Machine owns discovery, evidence, workflow state, follow-up context, and exports.

## Verification Defaults

Prefer the smallest checks that prove the change, then run broader checks when shared behavior changes.

Common checks:

```bash
node --check apps/lead-machine-demo/server.js
node --check apps/lead-machine-demo/public/app.js
node --check netlify/functions/api.js
node core/lead-machine/tests/smoke.test.js
node apps/lead-machine-demo/tests/smoke.test.js
npm run netlify:check
```

Use the relevant `./verifications/verify-*.sh` script when the change touches a named milestone or workflow.
