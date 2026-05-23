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

- `3307066` Add deterministic audit orchestration harness
- `c22c613` Add lightweight performance signal scoring
- `f45bcf7` Add technology detection and issue classification
- `3e5f5f7` Add batch spreadsheet website auditing
- `ae1ea77` Add deterministic website audit agent
- `634c3dc` Baseline Webconsult autonomous infrastructure

Important directories:

- `core/website-audit-agent`: deterministic browser intelligence agent
- `core/orchestrator`: persistent queue and worker harness
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
spreadsheet
-> queue
-> orchestrator
-> worker
-> Playwright audit
-> extraction
-> classification
-> scoring
-> report generation
-> persistent run state
```

## Verified Capabilities

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
- downstream Markdown, HTML, and CSV report surfaces
- persistent orchestration runs
- resumable queue processing
- retry handling
- failure logging
- run summaries
- Git-tracked capability evolution

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

The first harness is intentionally sequential and deterministic. It creates persistent run IDs, stores queue state, writes per-item reports, tracks failures, supports retries, can resume interrupted runs by run ID, and emits downstream Markdown, HTML, and CSV report surfaces without mutating raw audit JSON artifacts.

## Verification Commands

Run from anywhere unless otherwise noted:

```bash
~/webconsult/verifications/verify-frontend.sh ~/webconsult/projects/landing-page-test
~/webconsult/verifications/verify-website-audit-agent.sh
~/webconsult/verifications/verify-orchestrator.sh
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

## Architecture Principles

- deterministic-first
- verification-first
- browser-observed signals before AI interpretation
- sequential execution before parallel execution
- reusable infrastructure separate from project repos
- structured JSON before narrative reports
- Git-tracked capability evolution
- add LLM reasoning only after deterministic primitives are reliable
