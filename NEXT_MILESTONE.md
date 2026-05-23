# Next Milestone

Stop adding new platform layers by default. The next phase is operational validation on real lead batches.

## Priority 1: Use The Operating Workflow

Run the workflow in `OPERATING_GUIDE.md` on real leads and manually inspect the output.

Targets:

- review the existing 5-lead run
- shortlist/reject/review leads manually
- regenerate `crm-shortlisted-leads.csv`
- repeat with a 10-lead batch
- confirm the CRM CSV is useful for manual outreach or sales review

Reason: the platform is only useful if it produces leads a human can act on.

## Priority 2: Fix Only Workflow Blockers

Only fix issues that block real operation.

Examples:

- bad CSV values
- missing contact fields
- broken artifact links
- unclear operating instructions
- review state not exporting correctly

Do not add new intelligence layers unless they are required to make the current workflow usable.

## Paused Work

Do not prioritize these yet:

- historical comparison
- dashboard UI
- database
- AI outreach
- Lighthouse
- parallel workers
- monitoring
- multi-agent orchestration

These can come later, after the manual real-lead workflow proves useful.

## Operating Principle

The current question is not whether the system can be more sophisticated. The current question is whether it can produce 10 real usable leads from `Advokat-Leads.xlsx`.
