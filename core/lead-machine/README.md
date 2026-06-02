# Lead Machine

Single-command product runner for seller-ready lead scans.

```text
seller query + seller intent
-> discovery candidates
-> lead packs
-> selected-lead enrichment when requested from the desk
```

It does not generate scripts, send email, place calls, sync CRM, or run old browser-audit tooling.

## Usage

```bash
cd /home/xman/webconsult/core/lead-machine
npm run lead-machine -- \
  --query "advokater i Gol" \
  --provider balanced \
  --max-results 25 \
  --search-scope strict \
  --enrich-company-profile true
```

## Providers

- `balanced`: Brreg-first identity plus Google Places presence when configured.
- `brreg`: official company identity discovery.
- `google-places`: public local business presence.
- `mock`: deterministic tests/fixtures.

## Outputs

```text
core/lead-machine/runs/<run-id>/
  discovery/
    lead-candidates.json
    discovery-summary.json
    handoff.jsonl
  lead-packs/
    lead-packs.json
    lead-packs.csv
    summary.json
  lead-machine-summary.json
```

## Product Boundary

Lead Machine owns discovery, company identity, contact data, source quality, ranking context, caution notes, seller-fit interpretation, and export.

The seller owns wording, timing, relationship, qualification, and close.

## Selected-Lead Enrichment

The app can enrich one selected lead after a fast scan. Enrichment refreshes company identity, contactability, seller summary, digital-presence status, optional Proff economy data, and OSINT-lite public evidence. It does not rerun the whole market and does not make website pain the product definition.
