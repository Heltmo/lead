# Known Limitations

This file distinguishes operational capabilities from work that is not reliable yet.

## Website Audit Agent

- no crawling beyond the submitted URL
- no authenticated/session-based auditing
- no form submission workflows
- no Lighthouse audit yet
- no Core Web Vitals measurement beyond lightweight browser-observed timing signals
- no visual regression diffing
- screenshots are captured but not automatically compared
- mobile quality is represented by screenshot capture and basic browser observation, not full layout scoring
- technology detection is heuristic and limited to deterministic DOM/script/meta/link signals
- technology detection can miss server-side platforms that leave few client-side traces
- CSV parser is intentionally simple and may not cover every quoted CSV edge case
- batch audits are sequential by design
- Markdown, HTML, and CSV report surfaces exist, but they are still first-pass operational views

## Lead Intelligence

- scoring is deterministic and still early
- issue weights will need calibration against real lead outcomes
- no historical comparison layer yet
- no recurring monitoring yet
- no CRM integration yet
- no CRM-native export package yet beyond deterministic CSV report surfaces
- no third-party enrichment APIs
- no business-category classification beyond extracted spreadsheet/source data
- no outreach automation
- no LLM reasoning layer or narrative recommendation engine yet

## Orchestrator

- orchestrator is sequential by design
- no parallel workers yet
- no distributed execution
- no external database; state is file-based JSON
- no web dashboard
- no queue UI
- no scheduling layer
- no cross-machine locking
- retry handling is basic
- observability is limited to state files, reports, and console output

## Frontend Verification

- Playwright checks verify key visibility and screenshots, not full visual regression
- accessibility checks use Axe but do not replace manual accessibility review
- no Lighthouse CI yet
- no performance budgets for frontend projects yet
- no automated browser console failure gate across every future app route yet

## Platform Architecture

- no centralized dashboard across infrastructure and project repos
- no multi-agent coordination layer yet
- no reviewer-agent automation yet
- no deployment pipeline yet
- no production secrets management model yet
- no formal plugin/package boundary between core tools yet

## Strategic Constraint

The platform should stay deterministic-first until the extraction, reporting, history, and export layers are stronger. LLM reasoning should augment structured signals later, not replace them now.
