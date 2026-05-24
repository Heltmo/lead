# Next Milestone

The system now supports the intended V1 product boundary: lead intelligence, review, CRM export, campaign summaries, and deterministic demo generation for leads the operator chooses. It does not send outreach or automate follow-up.

## Priority 1: Validate Demo-On-Demand Quality

Use the real campaign run to generate demos for selected leads and judge whether the generated pages help manual review.

Success target:

- operator can choose a lead by domain, URL, business name, or item id
- selected lead resolves deterministically
- generated demo includes business context, issue evidence, opportunity bullets, contactability signals, and audit paths
- manifest records source run, review state, audit report, screenshots, and generated files
- no outreach automation is introduced

## Priority 2: Fix Only Review/Demo Workflow Blockers

Examples:

- ambiguous lead selectors need clearer errors
- demo content missing important audit evidence
- generated demo path not easy to find from campaign output
- selected lead names still too generic
- screenshot/audit links missing from manifests

## Paused Work

- outreach sending
- automated follow-up
- CRM integration
- database
- dashboard server
- parallel workers
- AI sales automation

## Operating Principle

Webconsult should first be a reliable lead intelligence and demo generation machine. Sales messages and follow-up remain manual until the review/demo workflow is consistently useful.
