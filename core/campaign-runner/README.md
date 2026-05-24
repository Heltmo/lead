# Campaign Runner

Single-command orchestration glue for a deterministic Webconsult campaign.

The runner composes existing modules instead of replacing their individual CLIs:

```text
lead discovery
-> orchestrator audit queue
-> report surfaces and review workspace
-> CRM export
-> demo generation
-> campaign summary
```

## Usage

```bash
node core/campaign-runner/cli/run-campaign.js \
  --query "tannleger i Halden" \
  --provider brave \
  --max-leads 10 \
  --demo-count 1 \
  --run-id tannleger-halden-campaign-001
```

Deterministic source-file campaign:

```bash
node core/campaign-runner/cli/run-campaign.js \
  --query "dentists in Halden" \
  --source core/lead-discovery-agent/tests/fixtures/dentists-halden.sample.json \
  --max-leads 3 \
  --demo-count 1 \
  --validate false
```

## Outputs

Campaign outputs are written to:

```text
generated/campaigns/<campaign-id>/
  discovery/
  run/
  review/
  crm/
  demos/
  campaign.json
  campaign-summary.md
```

The canonical audit run remains under:

```text
core/orchestrator/runs/<campaign-id>/
```

The campaign folder stores stable copies of operator-facing outputs and paths
back to canonical run artifacts. It does not mutate raw audit artifacts.
