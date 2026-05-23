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

## 1. Verify The System

Run from anywhere:

```bash
~/webconsult/verifications/verify-lead-review-workspace.sh
~/webconsult/verifications/verify-orchestrator.sh
~/webconsult/verifications/verify-website-audit-agent.sh
```

## 2. Optional: Discover Local Business Candidates

Use this when starting from a query and a deterministic source file instead of an existing spreadsheet.

```bash
cd ~/webconsult/core/lead-discovery-agent
npm run discover -- --query "dentists in Halden" --source tests/fixtures/dentists-halden.sample.json --out reports/lead-candidates.json --summary reports/discovery-summary.json --handoff reports/orchestrator-urls.txt --validate false
```

Then audit discovered URLs:

```bash
cd ~/webconsult/core/orchestrator
node cli/run-audit-queue.js --file ../lead-discovery-agent/reports/orchestrator-urls.txt --runs runs --run-id dentists-halden-sample --retries 1
```

Discovery v1 is deterministic and source-file based. Do not use protected/private scraping sources.

## 3. Create A Small Real Lead Batch

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

## 4. Run The Orchestrator

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

## 5. Open The Review Workspace

```bash
xdg-open ~/webconsult/core/orchestrator/runs/<run-id>/review-workspace/index.html
```

If GUI opening is unavailable, paste the full path into a browser.

Review each lead card in this order:

- business opportunity summary
- suggestedAngle: a short deterministic category label for filtering
- suggestedAngleDetail: a deterministic outreach context sentence derived from audit signals
- score and urgency label
- top 3 issues
- contactability signals
- review metadata: status, priority, next action, owner, tags
- technical evidence only when needed: issue categories, technologies, HTML report, JSON, screenshots

## 6. Shortlist Leads

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

## 7. Export CRM-Ready Shortlisted Leads

After editing `review-status.json`, run:

```bash
cd ~/webconsult
node core/lead-review-workspace/cli/export-crm-shortlist.js core/orchestrator/runs/<run-id>/summary.json
```

Output:

```text
~/webconsult/core/orchestrator/runs/<run-id>/review-workspace/crm-shortlisted-leads.csv
```

This CSV is the sales handoff file. It exports only `shortlisted` leads.

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

Next practical step: manually review the first 5-lead run, then repeat with 10 leads.
