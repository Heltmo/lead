# Next Milestone

The system now has a deterministic discovery front door plus the existing audit, review, and CRM export pipeline. The next phase is validating discovery-to-audit operation on realistic source data, not adding more architecture by default.

## Priority 1: Use Discovery With Realistic Source Data

Run the new lead discovery agent with a real or manually curated source file for one query such as `dentists in Halden`.

Targets:

- create or collect a small fixed source file with 5 to 10 businesses
- run `core/lead-discovery-agent` to produce `lead-candidates.json`
- hand off discovered URLs to the orchestrator
- audit the discovered candidates
- open the review workspace
- shortlist/export leads

Reason: the discovery agent is only useful if it feeds the existing operating workflow with usable candidate websites.

## Priority 2: Fix Only Discovery Workflow Blockers

Only fix issues that block deterministic discovery and handoff.

Examples:

- bad URL normalization
- duplicate domains not collapsing correctly
- reachability checks too slow or too strict
- source data fields not mapping cleanly
- handoff file not accepted by orchestrator

Do not add live search APIs, scraping, dashboards, AI outreach, or databases yet.

## Paused Work

Do not prioritize these yet:

- live Google scraping
- paid search APIs
- historical comparison
- dashboard UI
- database
- AI outreach
- Lighthouse
- parallel workers
- monitoring
- multi-agent orchestration

These can come later, after deterministic discovery plus the manual lead review workflow proves useful.

## Operating Principle

The current question is whether Webconsult can go from a query like `dentists in Halden` to a usable reviewed lead export through deterministic source data and the existing audit pipeline.
