# Background Market Refresh V1

## Objective

Refresh saved markets quietly after login/workspace boundaries are stable.

The system should detect changed lead/contact/source context without surprising the seller or creating outreach automation.

## V1 Build

- Add a scheduled refresh concept for saved searches/markets.
- Start with explicit user/admin-triggered refresh before autonomous schedules.
- Store changed-since-last-run summaries in workspace history.
- Feed changes into command center and verifier surfaces.

## Boundaries

Do not run broad scraping, historical surveillance, auto email, auto calls, CRM sync, or background workflow mutation without seller approval.

## Success Criteria

- Refresh jobs are scoped to saved markets.
- Changed evidence is summarized and source-backed.
- Seller can see what changed before acting.
- Cost/rate limits and provider boundaries are respected.
