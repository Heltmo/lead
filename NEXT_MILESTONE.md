# Next Milestone

The system now has taxonomy-backed deterministic discovery plus a live search provider abstraction. The next phase is operational validation of provider-backed discovery, not new architecture by default.

## Priority 1: Run A Live Provider 10-Lead Workflow

Run the existing discovery-to-export workflow from a real query using the configured Brave provider.

Target example:

```text
tannleger i Halden
or
advokater i Oslo
```

Procedure:

- run `--provider brave --dry-run true` first and inspect `provider.queries` in the summary
- set `BRAVE_SEARCH_API_KEY` only in the shell environment
- run `--provider brave --max-results 10`
- inspect discovered business names, websites, source provenance, and reachability
- hand off provider candidates to the orchestrator
- audit candidates
- open the review workspace
- shortlist/export 3 to 5 leads
- inspect whether CRM export fields and suggestedAngleDetail are good enough for manual outreach

Reason: the MVP becomes more useful only if provider-backed discovery produces businesses worth contacting, not merely more URLs.

## Priority 2: Fix Only Provider Workflow Blockers

Only fix issues that block live/semi-live discovery and handoff.

Examples:

- provider result titles are too noisy for businessName
- wrong pages/domains are returned for a local business query
- query expansion is too broad or too narrow
- max result/query limits need adjustment
- source provenance is unclear in review/export
- reachability checks reject good provider results too aggressively
- orchestrator handoff does not carry enough provider metadata

Do not add dashboards, databases, AI outreach, historical comparison, Lighthouse, parallel workers, or multi-agent orchestration yet.

## Paused Work

Do not prioritize these yet:

- live Google scraping
- protected/private source scraping
- dashboard UI
- database
- AI outreach
- historical comparison
- Lighthouse
- parallel workers
- monitoring
- multi-agent orchestration

## Operating Principle

The current question is whether Webconsult can go from a natural query such as `tannleger i Halden` through provider-backed discovery to a usable reviewed CRM export.
