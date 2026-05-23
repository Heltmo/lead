# Next Milestone

The system now has taxonomy-backed discovery, Brave live provider support, and deterministic discovery target filtering. Directory/social/registry results remain visible in discovery reports but are excluded from audit handoff by default.

## Priority 1: Re-run Provider Discovery With Target Filtering

Run the live provider workflow again for:

```text
tannleger i Halden
```

Success target:

- Brave may return directory/social/listing pages
- `discovery-summary.json` shows `candidatesBySourceType`, `auditEligibleCandidates`, `excludedCandidates`, and `excludedTargets`
- default handoff contains only reachable audit-eligible direct/unknown business domains
- orchestrator audits direct clinic/business websites only by default
- review workspace lets the operator shortlist 3 to 5 real businesses
- CRM export contains usable suggestedAngleDetail for those shortlisted businesses

## Priority 2: Fix Only Filtering Workflow Blockers

Only fix issues discovered in real provider runs.

Examples:

- missing directory/social domains in the known-domain list
- legitimate clinic domains incorrectly excluded
- provider titles too generic for businessName
- direct business pages landing on pricing/subpages instead of homepages
- reachability checks too strict for good business domains
- sourceType/provenance not clear enough in reports

Do not add dashboards, databases, AI outreach, historical comparison, Lighthouse, parallel workers, or multi-agent orchestration yet.

## Paused Work

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

The current question is whether Webconsult can go from a natural query through provider-backed discovery, target filtering, audit, review, and CRM export without wasting audits on directories or social profiles.
