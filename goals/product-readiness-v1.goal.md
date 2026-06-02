# Product Readiness V1

## Objective

Make Lead Machine useful without Proff by strengthening the daily seller workflow, local continuity, and source/cost guardrails.

The product should be ready to use as a local seller desk before buying paid economy data.

## Product Position

Core value does not depend on Proff.

Lead Machine should help a seller:

- find relevant companies
- verify company identity with Brreg
- inspect contactability and public presence
- enrich one selected lead when needed
- log contact attempts
- track follow-ups
- export useful call lists

Proff is a later optional economy module that should only run after confirmed org.nr.

## V1 Build

- local SQLite recent-search/workflow persistence
- latest run restore keeps seller intent and geography scope
- internal readiness data plus a simple saved-markets panel
- source/cost guardrails for Google and selected-lead Deep enrichment
- explicit Proff optional/disabled state
- tests that prove the app is useful without Proff

## Boundaries

Do not add auth, billing, CRM sync, email sending, telephony, sales scripts, Proff dependency, SSB, or broad scraping.

## Success Criteria

- Recent searches are persisted in the local SQLite workspace.
- Run payload includes readiness/source guard data.
- Health/readiness data shows that Proff is optional and disabled when no key exists.
- Health/readiness data shows Google is metered/capped and Deep enrichment is selected-lead only.
- The main seller screen does not expose technical readiness labels to beta testers.
- Workflow, activity history, and searches survive reloads locally.
- Existing Lead Machine verifiers still pass.
