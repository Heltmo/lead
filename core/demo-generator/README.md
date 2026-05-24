# Demo Generator

Deterministic static demo generator for one shortlisted lead from a lead review workspace export.

## Usage

```bash
node core/demo-generator/cli/generate-demo.js core/orchestrator/runs/<run-id>/review-workspace/crm-shortlisted-leads.csv
```

The command reads the first shortlisted row by default and writes:

```text
generated/demos/<run-id>/<business-slug>/
```

Select a specific row or business:

```bash
node core/demo-generator/cli/generate-demo.js <csv> --index 2
node core/demo-generator/cli/generate-demo.js <csv> --lead "Example Clinic"
```

Outputs are static and local only:

- `index.html`: the generated demo page
- `manifest.json`: source lead fields and deterministic generation metadata

The generator does not deploy, host, or produce outreach content.
