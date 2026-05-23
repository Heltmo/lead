# Next Milestone

The system now has a deterministic discovery front door that can merge multiple source files, plus the existing audit/review/export pipeline. The next phase is operational validation with broader deterministic source coverage, not new architecture by default.

## Priority 1: Run A 10-Lead Discovery-To-Export Workflow

Run the existing discovery-to-export workflow on about 10 realistic leads and judge whether the CRM output is useful for manual outreach.

Targets:

- collect multiple deterministic source files for one query, such as `dentists in Halden`
- include at least two source types, for example CSV plus TXT or JSON plus saved HTML
- run `core/lead-discovery-agent` to merge, normalize, deduplicate, validate, and produce `lead-candidates.json`
- hand off discovered URLs to the orchestrator
- audit the discovered candidates
- open the review workspace
- shortlist/export leads
- inspect whether the CRM export has enough context for manual outreach

Reason: the MVP is only useful if the reviewed CRM export supports real manual sales work without excessive cleanup.

## Priority 2: Fix Only Discovery Workflow Blockers

Only fix issues that block deterministic discovery and handoff.

Examples:

- poor field mapping from real CSV/source files
- saved HTML source parsing too narrow for manually saved public directory pages
- bad URL normalization
- duplicate domains not collapsing correctly
- source provenance not clear enough for review
- discovered business names not available in real source files
- reachability checks too slow or too strict
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

The current question is whether Webconsult can go from a query like `dentists in Halden` through manually expanded deterministic source files to a usable reviewed lead export.
