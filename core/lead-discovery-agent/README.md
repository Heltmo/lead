# Lead Discovery Agent

Deterministic local business discovery for Webconsult.

This module is the front door before the existing audit pipeline:

```text
search phrase + deterministic source files
-> lead-candidates.json
-> orchestrator URL handoff
-> website audits
-> reports
-> lead review workspace
-> CRM export
```

It does not scrape Google, use paid APIs, or parse protected/private sources. Discovery reads operator-provided source files, normalizes candidates, deduplicates by domain, optionally validates reachability, and writes handoff artifacts for the orchestrator.

## Industry Taxonomy And Query Expansion

Discovery uses `taxonomy/industries.json` to map English and Norwegian industry terms to canonical industries. Examples:

- `dentists in Halden` -> `dentist`
- `tannlege Halden` -> `dentist`
- `advokater i Oslo` -> `lawyer`
- `regnskapsfører Sarpsborg` -> `accountant`

The discovery summary includes `canonicalIndustry`, `industryTerm`, and `expandedQueries`. Expansion is deterministic and uses patterns like:

```text
{term} {location}
{term} i {location}
{location} {term}
```

The taxonomy is used for source filtering when candidates include an `industry` field. Source importers remain generic.

## Supported Source Formats

The discovery CLI accepts one or more `--source` files:

- JSON candidate files using the `results` shape shown below
- CSV candidate files with columns such as `businessName,website,source,location,industry,confidence`
- TXT URL lists with either one URL per line or `Business Name | https://example.no`
- saved/static HTML files with deterministic external `<a href="https://...">Business Name</a>` links

Static HTML parsing is intentionally conservative. It is for saved public search/directory result pages that the operator provides manually, not live browser automation.

## Discover From Multiple Sources

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

Outputs:

- `reports/lead-candidates.json`
- `reports/discovery-summary.json`
- `reports/orchestrator-urls.txt`

The summary includes raw candidate count, invalid candidates, duplicates removed, reachable/unreachable websites, handoff-ready candidates, and candidates grouped by source. The handoff file is newline-delimited JSON so businessName, source, location, industry, confidence, and source provenance survive into the orchestrator.

## Handoff To Orchestrator

```bash
cd ~/webconsult/core/orchestrator
node cli/run-audit-queue.js --file ../lead-discovery-agent/reports/orchestrator-urls.txt --runs runs --run-id dentists-halden-sample --retries 1
```

## JSON Source Shape

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

## CSV Source Shape

```csv
businessName,website,source,location,industry,confidence
Example Tannklinikk,https://example.no,directory,Halden,dentists,high
```

## TXT Source Shape

```text
# comments are ignored
Example Tannklinikk | https://example.no
https://another-example.no
```

## Static HTML Source Shape

```html
<a href="https://example.no">Example Tannklinikk</a>
```

Discovery stays separate from website auditing. It only produces candidate businesses, source provenance, and orchestrator handoff files. The orchestrator remains backward-compatible with URL-only files and `Business Name | URL` lines.
