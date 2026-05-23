# Lead Discovery Agent

Deterministic local business discovery for Webconsult.

This module is the front door before the existing audit pipeline:

```text
search phrase / fixed source data
-> lead-candidates.json
-> orchestrator URL handoff
-> website audits
-> reports
-> lead review workspace
-> CRM export
```

Version 1 does not scrape Google or protected/private sources. It reads fixed sample/source data and converts it into normalized lead candidates.

## Discover

```bash
cd ~/webconsult/core/lead-discovery-agent
npm run discover -- --query "dentists in Halden" --source tests/fixtures/dentists-halden.sample.json --out reports/lead-candidates.json --summary reports/discovery-summary.json --handoff reports/orchestrator-urls.txt
```

Outputs:

- `reports/lead-candidates.json`
- `reports/discovery-summary.json`
- `reports/orchestrator-urls.txt`

## Handoff To Orchestrator

```bash
cd ~/webconsult/core/orchestrator
node cli/run-audit-queue.js --file ../lead-discovery-agent/reports/orchestrator-urls.txt --runs runs --run-id dentists-halden-sample --retries 1
```

## Source Data Shape

```json
{
  "results": [
    {
      "businessName": "Example Tannklinikk",
      "website": "https://example.no",
      "source": "directory",
      "location": "Halden",
      "industry": "dentists",
      "confidence": "high"
    }
  ]
}
```

Discovery stays separate from website auditing. It only produces candidate businesses and URL handoff files.
