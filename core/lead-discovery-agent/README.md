# Lead Discovery Agent

Deterministic local business discovery for Lead Machine.

```text
search phrase + provider/source files
-> lead-candidates.json
-> discovery-summary.json
-> lead-machine-handoff.jsonl
```

Discovery does not scrape protected/private sources. It normalizes candidates, deduplicates by business/site identity, applies location quality, and preserves source provenance for Lead Machine.

## Query Examples

- `tannlege Halden`
- `advokater i Oslo`
- `regnskapsfører Sarpsborg`
- `fysioterapeut i Trondheim`

## Source Files

The CLI accepts JSON candidate files, CSV candidate files, TXT URL/business lists, and saved/static HTML pages supplied manually by the operator.

## CLI

```bash
cd /home/xman/webconsult/core/lead-discovery-agent
npm run discover -- \
  --query "tannleger i Halden" \
  --provider google-places \
  --max-results 10 \
  --out reports/lead-candidates.json \
  --summary reports/discovery-summary.json \
  --handoff reports/lead-machine-handoff.jsonl \
  --validate false
```

## Live Providers

- `google-places` uses `GOOGLE_PLACES_API_KEY` and can return names, phone, website, address, place ID, rating, review count, and business status.
- `brreg` uses open Brreg/Enhetsregisteret data for company identity.
- `balanced` combines Brreg identity with Google Places presence when keys are available.
- `mock` is used for deterministic tests.

Google Places businesses without websites are preserved when they have useful local identity such as name, phone, address, or place ID. A phone-ready, correctly located company can still be useful even without a website.
