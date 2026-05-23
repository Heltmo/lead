# Webconsult Orchestrator

Deterministic file-based harness for running Webconsult workers with persistent queue state.

## Current Pipeline

- `website-audit-queue`: sequential URL queue processed by the website audit worker. Inputs may be URL-only, `Business Name | URL`, or discovery-generated JSONL with source metadata.

## Usage

```bash
node cli/run-audit-queue.js --urls http://127.0.0.1:5173 --runs runs --retries 1
```

Resume a run by passing the same run id:

```bash
node cli/run-audit-queue.js --run-id run-YYYYMMDDHHMMSS --runs runs
```

## Outputs

- `runs/<run-id>/state.json`: full persistent queue state
- `runs/<run-id>/summary.json`: compact run summary
- `runs/<run-id>/items/<item-id>/report.json`: worker report
- `runs/<run-id>/items/<item-id>/screenshots/`: audit screenshots

Version 1 is intentionally sequential and deterministic. Parallelism and AI coordination come later.
