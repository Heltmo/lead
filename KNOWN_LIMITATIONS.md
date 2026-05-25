# Known Limitations

This file distinguishes operational capabilities from work that is not reliable yet.

## Lead Discovery Agent

- discovery supports deterministic source files and a first live provider abstraction, but live provider quality depends on the configured API
- supported source files are JSON, CSV, TXT URL lists, and conservative saved/static HTML link extraction
- industry taxonomy is an initial finite map and will need more terms as real source data exposes gaps
- query expansion generates deterministic search phrases and can feed a configured provider, but provider ranking/noise is external
- static HTML parsing is intentionally simple and may miss complex search-result markup
- no Google scraping or protected-source scraping
- Brave Search requires `BRAVE_SEARCH_API_KEY`; Google Places requires `GOOGLE_PLACES_API_KEY`; neither provider is used by tests
- no multi-provider fallback/ranking strategy yet; Google Places and Brave are selected explicitly per run
- reachability checks are simple HTTP/HTTPS checks and may be affected by timeouts or bot protections
- deduplication is domain-based and may merge distinct branches on the same domain
- candidate quality depends on the quality of the source data or provider result quality
- Google Places results without websites are not handed to audit yet, even if they have phone numbers
- target filtering uses a deterministic known-domain list and can miss new directories/social platforms until the list is expanded
- unknown domains are audit-eligible by default to avoid dropping real business sites
- discovered business names are preserved when source data provides them, but URL-only inputs still depend on audited page titles

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
- Markdown, HTML, CSV report surfaces, and static review workspace exist, but they are still first-pass operational views

## Lead Intelligence

- scoring is deterministic and still early
- issue weights will need calibration against real lead outcomes
- no historical comparison layer yet
- no recurring monitoring yet
- no CRM integration yet
- CRM-ready shortlisted CSV export and richer review state exist, but field mapping still needs calibration against real CRM/outreach workflows
- no third-party enrichment APIs
- no business-category classification beyond extracted spreadsheet/source data
- no outreach automation
- no LLM reasoning layer or narrative recommendation engine yet

## Demo Generator

- on-demand demo generation is file-based and local only
- selected lead resolution is deterministic and fails on ambiguous selectors
- generated demos are static HTML and are not deployed or hosted
- manifests record source artifacts, but campaign summaries are not automatically rewritten for every later on-demand demo yet
- no outreach sending or follow-up automation is included

## Campaign Runner

- campaign runner is orchestration glue over existing modules, not a new execution engine
- canonical audit artifacts still live under `core/orchestrator/runs/<campaign-id>/`
- campaign folders copy stable operator-facing outputs but do not replace raw run artifacts
- demo generation uses shortlisted CRM rows when available and top opportunity rows as a deterministic fallback
- campaign reruns should use unique run IDs until stale/resume semantics are hardened
- no dashboard, database, scheduling, parallel execution, or outreach automation yet

## Orchestrator

- orchestrator is sequential by design
- no parallel workers yet
- no distributed execution
- no external database; state is file-based JSON
- no web dashboard
- no queue UI
- review workspace is static and does not write review-status.json from the browser
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
