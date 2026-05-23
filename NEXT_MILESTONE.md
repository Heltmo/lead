# Next Milestone

The system now has a deterministic discovery front door, audit/review/export pipeline, and deterministic suggestedAngle plus suggestedAngleDetail fields. The next phase is validating the workflow on a larger 10-lead operating run, not adding more architecture by default.

## Priority 1: Run 10 Leads Through The Operating Workflow

Run the existing discovery-to-export workflow on 10 realistic leads and judge whether the CRM output is useful for manual outreach.

Targets:

- create or collect a fixed source file with about 10 businesses
- run `core/lead-discovery-agent` to produce `lead-candidates.json`
- hand off discovered URLs to the orchestrator
- audit the discovered candidates
- open the review workspace
- shortlist/export leads
- inspect whether the CRM export has enough context for manual outreach

Reason: the MVP is only useful if the reviewed CRM export supports real manual sales work without excessive cleanup.

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
