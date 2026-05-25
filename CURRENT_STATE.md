# Current State

Webconsult is now a deterministic browser-intelligence and autonomous execution platform. The system state is stored in Git, filesystem structure, verification scripts, and these operational memory docs.

## Repository Architecture

There are two intentionally separate Git histories:

- Infrastructure repo: `~/webconsult`
- Application repo: `~/webconsult/projects/landing-page-test`

The infrastructure repo ignores `/projects/` so reusable platform code and individual project code do not contaminate each other.

## Infrastructure Repo

Location: `~/webconsult`

Current major commits:

- `0dc0f42` Add deterministic audit report surfaces
- `16df415` Finalize operational memory docs
- `3307066` Add deterministic audit orchestration harness
- `c22c613` Add lightweight performance signal scoring
- `f45bcf7` Add technology detection and issue classification
- `3e5f5f7` Add batch spreadsheet website auditing
- `ae1ea77` Add deterministic website audit agent
- `634c3dc` Baseline Webconsult autonomous infrastructure

Important directories:

- `OPERATING_GUIDE.md`: real-lead operating workflow and commands
- `core/lead-discovery-agent`: deterministic local business discovery and metadata-preserving handoff
- `core/website-audit-agent`: deterministic browser intelligence agent
- `core/orchestrator`: persistent queue and worker harness
- `core/lead-review-workspace`: static lead review and selection workspace
- `core/campaign-runner`: single-command campaign orchestration workflow
- `prompts/`: reusable execution prompts
- `templates/`: reusable project and goal templates
- `verifications/`: reusable quality gates
- `goals/`: structured task definitions

## Project Repo

Location: `~/webconsult/projects/landing-page-test`

Current major commits:

- `99beabe` Refine CTA interaction state
- `8a2d30d` Add accessibility verification infrastructure
- `cf32132` Add Playwright visual verification infrastructure
- `c0efcfb` Baseline autonomous Webconsult frontend pipeline

The project is a modular React/Vite/Tailwind landing page used to prove autonomous frontend generation, browser QA, accessibility checks, and scoped refinement.

## System Flow

```text
search phrase or spreadsheet
-> lead discovery or URL extraction
-> queue
-> orchestrator
-> worker
-> Playwright audit
-> extraction
-> classification
-> scoring
-> report generation
-> lead review workspace
-> persistent run state
-> campaign summary and generated demo paths
```

## Verified Capabilities

- deterministic local business discovery from JSON, CSV, TXT, and saved/static HTML source files
- Norwegian/English industry taxonomy with canonicalIndustry and expandedQueries
- live search provider abstraction with Brave Search and Google Places support, env-var API key configuration, and dry-run query inspection
- candidate URL normalization, source provenance, Google Places phone/address/place metadata, deduplication by domain, reachability checks, and sourceType/auditEligible target filtering
- metadata-preserving orchestrator handoff from audit-eligible discovered candidates by default
- deterministic single-site website audits
- CSV/XLSX spreadsheet ingestion
- browser execution with Playwright
- desktop/mobile screenshot capture
- Axe accessibility audits
- title/meta/heading/contact/CTA extraction
- technology-stack detection from deterministic DOM/script/meta/link signals
- classified issues across SEO, UX, conversion, accessibility, contactability, trust, performance, and technical categories
- lightweight browser-observed performance signals
- severity-weighted deterministic lead scoring
- structured JSON reports
- downstream Markdown, HTML, and CSV report surfaces that prefer discovered business names and retain page titles
- static lead review workspace generation
- normalized review-status state for operator decisions
- richer operator fields: priority, nextAction, owner, lastReviewedAt, tags
- shortlisted lead CSV exports
- CRM-ready shortlisted lead exports with discovered business names, page titles, deterministic suggestedAngle labels, and suggestedAngleDetail outreach sentences
- persistent orchestration runs
- resumable queue processing
- retry handling
- failure logging
- run summaries
- single-command deterministic campaign runner
- campaign folders with campaign.json and campaign-summary.md
- generated demo paths for shortlisted or top opportunity leads
- on-demand selected-lead demo generation from existing runs
- Git-tracked capability evolution

## Lead Discovery Agent

Location: `~/webconsult/core/lead-discovery-agent`

Core files:

- `cli/discover-local-businesses.js`
- `cli/handoff-candidates.js`
- `discoverLocalBusinesses.js`
- `providers/searchProvider.js`
- `providers/sourceImporters.js`
- `taxonomy/industries.json`
- `taxonomy/industryTaxonomy.js`
- `normalizers/leadCandidate.js`
- `normalizers/websiteReachability.js`
- `normalizers/sourceType.js`
- `reports/discoveryReport.js`

The discovery agent accepts industry/location queries such as `dentists in Halden`, `tannlege Halden`, `advokater i Oslo`, and `regnskapsfører Sarpsborg`. It maps English/Norwegian terms through a deterministic taxonomy, emits `canonicalIndustry` and `expandedQueries`, reads one or more deterministic source files, can call configured live providers such as Brave Search and Google Places, normalizes source provenance, deduplicates candidates by domain, validates reachability, and writes `lead-candidates.json`, `discovery-summary.json`, and a metadata-preserving orchestrator handoff file. Supported source formats are manual JSON candidates, CSV candidates, TXT URL lists, saved/static HTML pages with public links, and provider results. Google Places candidates can preserve phone, address, placeId, rating, reviewCount, businessStatus, and provider types through orchestrator handoff, review workspace, and CRM exports. Live provider tests use mock fixtures; `--dry-run true` exposes planned provider queries without network calls. Discovery classifies targets as `directBusiness`, `directory`, `social`, `governmentRegistry`, or `unknown`; directory/social/registry targets remain in discovery reports but are excluded from orchestrator handoff by default unless `--include-non-audit-targets true` is used.

## Website Audit Agent

Location: `~/webconsult/core/website-audit-agent`

Core files:

- `cli/audit-url.js`
- `cli/audit-batch.js`
- `audits/auditWebsite.js`
- `audits/accessibility.js`
- `audits/performance.js`
- `audits/technology.js`
- `audits/issueClassification.js`
- `audits/leadScore.js`
- `extractors/pageSignals.js`
- `extractors/spreadsheet.js`
- `reports/batchReport.js`
- `reports/reportSurfaces.js`
- `cli/generate-reports.js`

The agent has been tested against a real spreadsheet: `/home/xman/Downloads/Advokat-Leads.xlsx`. Real dataset validation found actionable issues including HTTP 404, missing meta description, missing H1, weak CTA/contactability, and runtime/browser failures.

## Orchestrator

Location: `~/webconsult/core/orchestrator`

Core files:

- `cli/run-audit-queue.js`
- `pipelines/auditQueue.js`
- `queue/urlQueue.js`
- `workers/websiteAuditWorker.js`
- `state/store.js`
- `reports/runSummary.js`

The first harness is intentionally sequential and deterministic. It creates persistent run IDs, stores queue state, writes per-item reports, tracks failures, supports retries, can resume interrupted runs by run ID, emits downstream Markdown/HTML/CSV report surfaces, and generates a static lead review workspace without mutating raw audit JSON artifacts.

## Lead Review Workspace

Location: `~/webconsult/core/lead-review-workspace`

Core files:

- `cli/generate-review-workspace.js`
- `generateReviewWorkspace.js`
- `readers/runArtifacts.js`
- `exports/selectedLeadsCsv.js`
- `exports/crmShortlistedCsv.js`
- `cli/export-crm-shortlist.js`
- `state/reviewStatus.js`
- `templates/indexHtml.js`

The workspace reads orchestrator `summary.json` and `report-surfaces/leads.csv`, then writes `review-workspace/index.html`, `review-workspace/review-status.json`, `review-workspace/selected-leads.csv`, and `review-workspace/crm-shortlisted-leads.csv`. Review state is normalized in a dedicated module and remains separate from raw audit artifacts. Lead cards and exports prefer discovered business names, while audit page titles remain available as pageTitle/title evidence.

## Campaign Runner

Location: `~/webconsult/core/campaign-runner`

Core files:

- `cli/run-campaign.js`
- `runCampaign.js`
- `tests/smoke.test.js`

The demo generator can also create a deterministic static demo on demand for a selected lead from an existing run using `core/demo-generator/cli/generate-demo-for-lead.js`.

The campaign runner is the first single-command product workflow. It accepts a query plus optional provider/source inputs, runs discovery, filters handoff candidates, executes the existing orchestrator audit queue, copies stable report/review/CRM paths into `generated/campaigns/<campaign-id>/`, generates demos for shortlisted leads or top opportunity leads, and writes `campaign.json` plus `campaign-summary.md`. The canonical raw audit artifacts remain under `core/orchestrator/runs/<campaign-id>/`.

## Verification Commands

Run from anywhere unless otherwise noted:

```bash
~/webconsult/verifications/verify-campaign-runner.sh
~/webconsult/verifications/verify-lead-discovery-agent.sh
~/webconsult/verifications/verify-frontend.sh ~/webconsult/projects/landing-page-test
~/webconsult/verifications/verify-website-audit-agent.sh
~/webconsult/verifications/verify-orchestrator.sh
~/webconsult/verifications/verify-lead-review-workspace.sh
```

Example deterministic discovery run from `~/webconsult/core/lead-discovery-agent`:

```bash
npm run discover -- --query "dentists in Halden" --source tests/fixtures/dentists-halden.sample.json --source tests/fixtures/dentists-halden.directory.csv --source tests/fixtures/dentists-halden.extra-urls.txt --source tests/fixtures/dentists-halden.search-results.html --out reports/lead-candidates.json --summary reports/discovery-summary.json --handoff reports/orchestrator-urls.txt --validate false
```

Example live provider dry run from `~/webconsult/core/lead-discovery-agent`:

```bash
npm run discover -- --query "tannleger i Halden" --provider brave --dry-run true --max-results 10 --summary reports/tannleger-halden-live-dry-run-summary.json
```

Example Google Places provider run requires `GOOGLE_PLACES_API_KEY`:

```bash
GOOGLE_PLACES_API_KEY=<key> npm run discover -- --query "tannleger i Halden" --provider google-places --max-results 10 --out reports/tannleger-halden-places-candidates.json --summary reports/tannleger-halden-places-summary.json --handoff reports/tannleger-halden-places-handoff.jsonl
```
Example Brave provider run requires `BRAVE_SEARCH_API_KEY`; handoff excludes non-audit targets by default:

```bash
BRAVE_SEARCH_API_KEY=<key> npm run discover -- --query "tannleger i Halden" --provider brave --max-results 10 --out reports/tannleger-halden-live-candidates.json --summary reports/tannleger-halden-live-summary.json --handoff reports/tannleger-halden-live-handoff.jsonl
```

Example orchestrator run from `~/webconsult`:

```bash
node core/orchestrator/cli/run-audit-queue.js --urls http://127.0.0.1:5173 --runs core/orchestrator/runs --retries 1
```

Example real spreadsheet dry run from `~/webconsult/core/website-audit-agent`:

```bash
npm run audit:batch -- /home/xman/Downloads/Advokat-Leads.xlsx --dry-run true --out reports/advokat-dry-run.json --limit 5
```

Example deterministic report generation from an existing artifact:

```bash
npm run reports -- reports/batch-smoke.json --out reports/surfaces
```

Example static review workspace generation from an orchestrator run:

```bash
node core/lead-review-workspace/cli/generate-review-workspace.js core/orchestrator/runs/<run-id>/summary.json
```

Example CRM shortlisted export refresh:

```bash
node core/lead-review-workspace/cli/export-crm-shortlist.js core/orchestrator/runs/<run-id>/summary.json
```

## First Real Operating Run

A controlled real-data run was completed against `/home/xman/Downloads/Advokat-Leads.xlsx` with 5 leads.

- Run ID: `advokat-first-5-20260523`
- Completed: 5
- Failed: 0
- Review workspace generated
- One sample lead shortlisted
- CRM-ready CSV generated successfully

Use `OPERATING_GUIDE.md` as the source of truth for repeating this workflow.

## Architecture Principles

- deterministic-first
- verification-first
- browser-observed signals before AI interpretation
- sequential execution before parallel execution
- reusable infrastructure separate from project repos
- structured JSON before narrative reports
- Git-tracked capability evolution
- add LLM reasoning only after deterministic primitives are reliable


## Lead Insight Agent

The review workspace now includes downstream, evidence-grounded lead insight fields for operator triage and CRM export. These insights use audit facts and provider metadata, cache under generated review-workspace output, and do not mutate raw audit artifacts. LLM-backed generation is not enabled by default; deterministic fallback remains the verified path.


## Business Signal Engine

A structured `core/business-signal-engine` layer now extracts deterministic business signals, numeric strengths, confidence values, contradictions, and ranked opportunities from audit/page evidence. Lead insights consume this source-of-truth layer instead of re-parsing raw page text directly.


## Opportunity Compressor

A downstream `core/opportunity-compressor` layer now converts signal profiles, contradictions, and lead insights into one operator-facing opportunity with primaryOpportunity, whyThisMatters, outreachAngle, callOpener, businessImpact, urgency, and type. Review cards lead with this compressed opportunity while raw signals remain supporting evidence.
