# Lead Review Workspace

Static, file-based review surface for Webconsult audit runs.

The workspace reads existing orchestrator artifacts:

- `summary.json`
- `report-surfaces/leads.csv`
- per-site audit JSON reports
- screenshots and HTML reports

It writes downstream operator artifacts only:

- `review-workspace/index.html`
- `review-workspace/review-status.json`
- `review-workspace/selected-leads.csv`
- `review-workspace/crm-shortlisted-leads.csv`

Raw audit artifacts are not mutated.

## Usage

```bash
node core/lead-review-workspace/cli/generate-review-workspace.js core/orchestrator/runs/<run-id>/summary.json
```

The generated `index.html` is static and can be opened directly in a browser.

Review decisions are stored in `review-status.json`. Regenerate the workspace to refresh `selected-leads.csv` and `crm-shortlisted-leads.csv` after marking leads as `shortlisted`.

Refresh only the CRM export:

```bash
node core/lead-review-workspace/cli/export-crm-shortlist.js core/orchestrator/runs/<run-id>/summary.json
```

CRM export is deterministic and rule-based. It exports only shortlisted leads and includes score, technologies, issue categories, contact fields, artifact paths, notes, review status, and suggested angle.
