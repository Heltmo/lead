# Lead Discovery Agent

Deterministic local business discovery for Webconsult.

This module is the front door before the existing audit pipeline:

```text
search phrase + deterministic source files or configured live provider
-> lead-candidates.json
-> orchestrator URL handoff
-> website audits
-> reports
-> lead review workspace
-> CRM export
```

It does not scrape Google or parse protected/private sources. Discovery reads operator-provided source files and can also call a configured search API provider. Both modes normalize candidates, deduplicate by domain, optionally validate reachability, and write handoff artifacts for the orchestrator.

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

The summary includes raw candidate count, invalid candidates, duplicates removed, reachable/unreachable websites, sourceType counts, audit-eligible counts, excluded targets, handoff-ready candidates, and candidates grouped by source. The handoff file is newline-delimited JSON so businessName, source, location, industry, confidence, sourceType, auditEligible, and source provenance survive into the orchestrator.

## Live Search Provider Mode

Discovery also supports a provider abstraction for API-based search. Supported live providers are Brave Search and Google Places. API keys are read from environment variables; no key is stored in this repo.

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

Provider candidates can be merged with deterministic sources in the same run:

```bash
npm run discover -- \
  --query "advokater i Oslo" \
  --provider brave \
  --source ~/webconsult/data/discovery-sources/advokater-oslo/manual-urls.txt \
  --max-results 10 \
  --out reports/advokater-oslo-candidates.json \
  --summary reports/advokater-oslo-summary.json \
  --handoff reports/advokater-oslo-handoff.jsonl
```

Use dry-run mode to inspect deterministic taxonomy expansion and provider queries without making a network call:

```bash
npm run discover -- \
  --query "tannleger i Halden" \
  --provider brave \
  --dry-run true \
  --max-results 10 \
  --summary reports/tannleger-halden-dry-run-summary.json
```

The summary includes a `provider` block with provider name, dry-run status, max result target, and planned queries. Provider tests use mocked fixtures, so verification does not require live network access or API credentials.

## Google Places Provider Mode

Use Google Places when the goal is call-ready local business discovery. It can return business names, websites, phone numbers, addresses, ratings, review counts, business status, and place IDs.

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

Dry-run works without calling Google:

```bash
npm run discover -- --query "tannleger i Halden" --provider google-places --dry-run true --max-results 10
```

Google Places tests use mocked fixtures. Verification never calls Google APIs and never requires `GOOGLE_PLACES_API_KEY`.

### Fast Mode Candidate Preservation

Google Places businesses without websites are preserved when they still have local business identity such as business name plus phone, address, or placeId. These candidates are marked `auditEligible: false` with `auditExclusionReason: missing_website_for_audit`, so they do not enter Deep website audit handoff.

They can still appear in Fast mode lead packs because a seller can use phone, address, rating/reviews, and placeId to qualify the business manually.

Discovery now also exposes `discoveryQuality`, `discoveryConfidence`, and `discoveryCoverage` so operators can see whether a run produced strong contact/source coverage or thin candidate data.
## Discovery Target Filtering

Discovery classifies candidate domains before handoff:

- `directBusiness`
- `directory`
- `social`
- `governmentRegistry`
- `publicSector`
- `unknown`

Known directory/social/registry/public-sector domains such as `legelisten.no`, `1881.no`, `gulesider.no`, `proff.no`, `ofk.no`, `*.kommune.no`, `helsenorge.no`, `facebook.com`, `instagram.com`, `linkedin.com`, and `tannlegerinorge.no` are retained in discovery reports but marked `auditEligible: false`. They can be useful discovery sources, but direct private business websites are preferred audit targets.

Automatic handoff excludes non-audit targets by default. Include them only when explicitly needed:

```bash
npm run discover -- \
  --query "tannleger i Halden" \
  --provider brave \
  --include-non-audit-targets true \
  --handoff reports/tannleger-halden-all-targets.jsonl
```

The explicit handoff command supports the same override:

```bash
npm run handoff -- reports/lead-candidates.json --include-non-audit-targets true --out reports/all-targets.jsonl
```
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
