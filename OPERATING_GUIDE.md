# Webconsult Operating Guide

This guide documents the minimum real-lead workflow. The goal is to produce usable leads from a spreadsheet, not to add more platform architecture.

## Current MVP Workflow

```text
search query or Advokat-Leads.xlsx
-> discover candidates or extract first batch URLs
-> orchestrator audit run
-> report surfaces
-> review workspace
-> shortlist leads in review-status.json
-> crm-shortlisted-leads.csv
```

## 1. Run A Single Campaign

Use the campaign runner when you want the product workflow instead of running each tool manually.

~~~bash
cd ~/webconsult
node core/campaign-runner/cli/run-campaign.js \
  --query "tannleger i Halden" \
  --provider brave \
  --max-leads 10 \
  --demo-count 1 \
  --run-id tannleger-halden-campaign-001
~~~

Deterministic source-file example:

~~~bash
cd ~/webconsult
node core/campaign-runner/cli/run-campaign.js \
  --query "dentists in Halden" \
  --source core/lead-discovery-agent/tests/fixtures/dentists-halden.sample.json \
  --max-leads 3 \
  --demo-count 1 \
  --run-id dentists-halden-source-campaign-001 \
  --validate false
~~~

Campaign outputs are written under:

~~~text
generated/campaigns/<campaign-id>/
  discovery/
  run/
  review/
  crm/
  demos/
  campaign.json
  campaign-summary.md
~~~

The canonical orchestrator run remains under `core/orchestrator/runs/<campaign-id>/`.

## 2. Verify The System

Run from anywhere:

```bash
~/webconsult/verifications/verify-lead-discovery-agent.sh
~/webconsult/verifications/verify-campaign-runner.sh
~/webconsult/verifications/verify-lead-review-workspace.sh
~/webconsult/verifications/verify-orchestrator.sh
~/webconsult/verifications/verify-website-audit-agent.sh
```

## 3. Optional: Discover Local Business Candidates

Use this when starting from a query and deterministic source files instead of an existing spreadsheet. Discovery can combine operator-provided JSON, CSV, TXT, and saved/static HTML files, then normalize, deduplicate, validate, and hand off URLs to the orchestrator. Industry parsing uses a general Norwegian/English taxonomy, so queries such as `dentists in Halden`, `tannlege Halden`, `advokater i Oslo`, and `regnskapsfører Sarpsborg` resolve to canonical industries and expanded query lists.

Example multi-source discovery run:

```bash
cd ~/webconsult/core/lead-discovery-agent
npm run discover -- \
  --query "dentists in Halden" \
  --source tests/fixtures/dentists-halden.sample.json \
  --source tests/fixtures/dentists-halden.directory.csv \
  --source tests/fixtures/dentists-halden.extra-urls.txt \
  --source tests/fixtures/dentists-halden.search-results.html \
  --out reports/lead-candidates.json \
  --summary reports/discovery-summary.json \
  --handoff reports/orchestrator-urls.txt \
  --validate false
```

Supported deterministic discovery sources:

- manual JSON candidate files
- CSV candidate files
- plain text URL lists, including `Business Name | https://example.no`
- saved/static HTML files with public external links

Then audit discovered candidates. Discovery-generated handoff files preserve business names and source metadata as JSONL, while the orchestrator still accepts older URL-only handoff files:

```bash
cd ~/webconsult/core/orchestrator
node cli/run-audit-queue.js --file ../lead-discovery-agent/reports/orchestrator-urls.txt --runs runs --run-id dentists-halden-sample --retries 1
```

Discovery remains deterministic when source-file based. Do not use protected/private scraping sources or live Google scraping. To add a new industry, extend `core/lead-discovery-agent/taxonomy/industries.json` with English terms, Norwegian terms, and search patterns.

## 4. Optional: Run Live Search Provider Discovery

Use this when you want the system to discover candidates from a configured search API instead of manually collected source files. Supported providers are `brave` through `BRAVE_SEARCH_API_KEY` and `google-places` through `GOOGLE_PLACES_API_KEY`. Prefer Google Places when you need call-ready local leads with phone/address metadata.

Dry-run first. This shows the taxonomy-expanded provider queries without calling the API:

```bash
cd ~/webconsult/core/lead-discovery-agent
npm run discover -- \
  --query "tannleger i Halden" \
  --provider brave \
  --dry-run true \
  --max-results 10 \
  --summary reports/tannleger-halden-live-dry-run-summary.json
```

Google Places live run with an API key:

```bash
export GOOGLE_PLACES_API_KEY="your-key-here"
cd ~/webconsult/core/lead-discovery-agent
npm run discover -- \
  --query "tannleger i Halden" \
  --provider google-places \
  --max-results 10 \
  --out reports/tannleger-halden-places-candidates.json \
  --summary reports/tannleger-halden-places-summary.json \
  --handoff reports/tannleger-halden-places-handoff.jsonl
```
Brave live run with an API key:

```bash
export BRAVE_SEARCH_API_KEY="your-key-here"
cd ~/webconsult/core/lead-discovery-agent
npm run discover -- \
  --query "tannleger i Halden" \
  --provider brave \
  --max-results 10 \
  --out reports/tannleger-halden-live-candidates.json \
  --summary reports/tannleger-halden-live-summary.json \
  --handoff reports/tannleger-halden-live-handoff.jsonl
```

Provider results can be combined with manual `--source` files in the same command. The discovery agent merges, deduplicates, validates reachability, classifies targets by `sourceType`, and writes the same orchestrator handoff format as deterministic source mode. Google Places metadata such as phone, address, placeId, rating, reviewCount, and businessStatus flows through review workspace and CRM exports when available. Directory/social/registry pages are kept in discovery reports but excluded from audit handoff by default because direct business websites are preferred audit targets. Use `--include-non-audit-targets true` only when you intentionally want directories or social profiles audited.

## 5. Inspect Discovery Target Quality

After provider discovery, inspect the summary before running audits:

```bash
cat ~/webconsult/core/lead-discovery-agent/reports/tannleger-halden-live-summary.json
```

Check:

- `candidatesBySourceType`
- `auditEligibleCandidates`
- `excludedCandidates`
- `excludedTargets`

Directory/social pages such as `legelisten.no`, `1881.no`, `gulesider.no`, `facebook.com`, and `tannlegerinorge.no` should remain visible as discovery evidence but should not enter the audit queue by default.

## 6. Create A Small Real Lead Batch

Start with 5 to 10 leads. Do not process the whole spreadsheet until the review/export workflow has been checked manually.

```bash
cd ~/webconsult/core/website-audit-agent
npm run audit:batch -- /home/xman/Downloads/Advokat-Leads.xlsx --dry-run true --out reports/advokat-operating-dry-run.json --limit 5
```

Create the URL file for the orchestrator:

```bash
cd ~/webconsult
node -e "const fs=require('fs'); const report=JSON.parse(fs.readFileSync('core/website-audit-agent/reports/advokat-operating-dry-run.json','utf8')); fs.mkdirSync('core/orchestrator/runs',{recursive:true}); fs.writeFileSync('core/orchestrator/runs/advokat-first-5-urls.txt', report.results.map((lead)=>lead.url).filter(Boolean).slice(0,5).join('\n') + '\n');"
```

## 7. Run The Orchestrator

Use a unique run ID. Example:

```bash
cd ~/webconsult/core/orchestrator
node cli/run-audit-queue.js --file runs/advokat-first-5-urls.txt --runs runs --run-id advokat-first-5-20260523 --retries 1
```

The run writes artifacts under:

```text
~/webconsult/core/orchestrator/runs/<run-id>/
```

Important outputs:

```text
summary.json
report-surfaces/report.html
report-surfaces/report.md
report-surfaces/leads.csv
review-workspace/index.html
review-workspace/review-status.json
review-workspace/selected-leads.csv
review-workspace/crm-shortlisted-leads.csv
```

Generated run artifacts are ignored by Git.

## 8. Open The Review Workspace

```bash
xdg-open ~/webconsult/core/orchestrator/runs/<run-id>/review-workspace/index.html
```

If GUI opening is unavailable, paste the full path into a browser.

Review each lead card in this order. The card title prefers the discovered business name; the audit page title remains visible separately as evidence:

- business opportunity summary
- suggestedAngle: a short deterministic category label for filtering
- suggestedAngleDetail: a deterministic outreach context sentence derived from audit signals
- score and urgency label
- top 3 issues
- contactability signals
- review metadata: status, priority, next action, owner, tags
- technical evidence only when needed: issue categories, technologies, HTML report, JSON, screenshots

## 9. Shortlist Leads

Edit:

```text
~/webconsult/core/orchestrator/runs/<run-id>/review-workspace/review-status.json
```

Example record:

```json
{
  "status": "shortlisted",
  "priority": "high",
  "notes": "Strong redesign opportunity. Missing CTA and contact info.",
  "nextAction": "contact",
  "owner": "GG",
  "lastReviewedAt": "2026-05-23T00:00:00.000Z",
  "tags": ["first-run", "manual-review"]
}
```

Allowed statuses:

```text
unreviewed, reviewed, shortlisted, rejected
```

## 10. Generate Demo For A Selected Lead

Use this after reviewing a run when you want a demo for one specific lead. The lead can be selected by item id, domain, URL, or business name.

~~~bash
cd ~/webconsult
node core/demo-generator/cli/generate-demo-for-lead.js \
  --run core/orchestrator/runs/tannleger-halden-campaign-001/summary.json \
  --lead tannlegelarseng.no
~~~

Output:

~~~text
generated/demos/<run-id>/<lead-slug>/index.html
generated/demos/<run-id>/<lead-slug>/manifest.json
~~~

The command does not send outreach, update CRM systems, deploy, or mutate raw audit artifacts.

## 11. Export CRM-Ready Shortlisted Leads

After editing `review-status.json`, run:

```bash
cd ~/webconsult
node core/lead-review-workspace/cli/export-crm-shortlist.js core/orchestrator/runs/<run-id>/summary.json
```

Output:

```text
~/webconsult/core/orchestrator/runs/<run-id>/review-workspace/crm-shortlisted-leads.csv
```

This CSV is the sales handoff file. It exports only `shortlisted` leads and prefers the discovered business name for the company field while retaining the audited page title separately.

## First Real Operating Run

The first controlled run used:

```text
Input: /home/xman/Downloads/Advokat-Leads.xlsx
Limit: 5 leads
Run ID: advokat-first-5-20260523
Completed: 5
Failed: 0
```

Confirmed outputs:

```text
~/webconsult/core/orchestrator/runs/advokat-first-5-20260523/report-surfaces/leads.csv
~/webconsult/core/orchestrator/runs/advokat-first-5-20260523/review-workspace/index.html
~/webconsult/core/orchestrator/runs/advokat-first-5-20260523/review-workspace/crm-shortlisted-leads.csv
```

One sample lead was shortlisted and exported successfully:

```text
https://www.advokat-bm.no
```

## Current Operating Rule

Do not add historical comparison, dashboards, databases, AI outreach, Lighthouse, parallelism, or monitoring until the 5 to 10 lead manual workflow has been used successfully on real leads.

Next practical step: generate demos on demand for 1 to 3 reviewed leads, inspect the demo pages and manifests, then decide which lead evidence is still missing.


## Lead Insight Agent

The review workspace now includes downstream, evidence-grounded lead insight fields for operator triage and CRM export. These insights use audit facts and provider metadata, cache under generated review-workspace output, and do not mutate raw audit artifacts. LLM-backed generation is not enabled by default; deterministic fallback remains the verified path.


## Business Signal Engine

A structured `core/business-signal-engine` layer now extracts deterministic business signals, numeric strengths, confidence values, contradictions, and ranked opportunities from audit/page evidence. Lead insights consume this source-of-truth layer instead of re-parsing raw page text directly.


## Opportunity Compressor

A downstream `core/opportunity-compressor` layer now converts signal profiles, contradictions, and lead insights into one operator-facing opportunity with primaryOpportunity, whyThisMatters, outreachAngle, callOpener, businessImpact, urgency, and type. Review cards lead with this compressed opportunity while raw signals remain supporting evidence.
