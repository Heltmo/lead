# Next Milestone

The system now has the core single-command product workflow: campaign runner, discovery, target filtering, orchestrated audits, opportunity bullets, review workspace, CRM export, and deterministic demo generation.

## Priority 1: Validate Full Campaign Quality

Run small deterministic and provider-backed campaigns end to end. The goal is not more architecture; the goal is checking whether one command creates a usable sales package.

Success target:

- campaign folder exists under `generated/campaigns/<campaign-id>/`
- `campaign.json` and `campaign-summary.md` are complete
- discovery excludes directory/social junk from audit handoff
- 5 to 10 business websites audit cleanly enough for review
- top opportunities contain useful sales bullets
- at least one generated demo is good enough for manual review
- CRM export is usable for a human outreach workflow

## Priority 2: Fix Only Campaign Workflow Blockers

Examples:

- stale run-id behavior that points a campaign at the wrong canonical run
- weak provider business names
- missing or misleading campaign summary fields
- demo fallback choosing the wrong lead
- missing stable paths from campaign folders
- CRM exports missing fields needed for manual outreach

## Paused Work

- dashboard UI
- database
- AI outreach
- historical comparison
- Lighthouse
- parallel workers
- monitoring
- multi-agent orchestration
- protected/private scraping

## Operating Principle

The current question is whether Webconsult can produce a complete manual sales package from one command before adding servers, databases, dashboards, or autonomous outreach.
