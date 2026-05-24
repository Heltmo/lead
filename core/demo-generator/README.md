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

## Generate From A Run

Use this when you want a demo for one selected lead from an existing campaign or orchestrator run, whether or not the lead has been shortlisted.

~~~bash
node core/demo-generator/cli/generate-demo-for-lead.js   --run core/orchestrator/runs/<run-id>/summary.json   --lead tannlegelarseng.no
~~~

The lead selector can be an item id, URL, domain, or business name. If multiple matches exist, shortlisted review state is preferred; otherwise ambiguous selectors fail instead of guessing.

The command reads the run summary, report surfaces, review status, and per-site audit report, then writes the same local output shape:

~~~text
generated/demos/<run-id>/<lead-slug>/
  index.html
  manifest.json
~~~

The manifest includes source run paths, review status, audit report paths, screenshot paths, and generated file paths.
