# lead-pack-runner

Seller-ready lead pack packaging layer for Webconsult run outputs.

## Purpose

`core/lead-pack-runner/` converts existing orchestrator run outputs into ranked lead packs.

V1 does not run discovery or website audits. It reads generated run artifacts and packages them into:

- `lead-packs.json`
- `lead-packs.csv`
- `summary.json`

This proves the lead-pack product format before a full live lead-machine runner exists.

## Product Boundary

The machine owns discovery, enrichment, ranking, evidence, caution, and export.

The seller owns angle, wording, outreach, timing, relationship, qualification, and closing.

Lead packs must not generate sales scripts, call openers, email copy, or outreach automation.

## CLI

```bash
cd core/lead-pack-runner
npm run lead-pack -- \
  --run-dir ../orchestrator/runs/tannleger-fredrikstad-places-5 \
  --output-dir ./runs/tannleger-fredrikstad \
  --enrich-company-profile false
```

Optional company profile enrichment:

```bash
npm run lead-pack -- \
  --run-dir ../orchestrator/runs/tannleger-fredrikstad-places-5 \
  --output-dir ./runs/tannleger-fredrikstad \
  --enrich-company-profile true
```

Company profile enrichment is conservative. Confirmed `organizationNumber` is only set when `core/company-profile` returns an exact/strong match. Candidate organization numbers and warnings are preserved for manual verification.

## V1 Lead Pack Shape

Each lead pack includes:

- rank
- callPriority
- leadClass
- opportunityType
- company identity and match status
- contact info
- Google Places metadata if available
- website audit status and evidence
- ranking reasons and caution notes
- economy block with `status: not_enabled`
- source run metadata

## Current Limitations

- Reads existing run outputs only.
- Does not run live discovery.
- Does not run website audit queues.
- Does not integrate Proff.
- Does not create saved searches or schedules.
- Does not generate outreach scripts.

## Tests

```bash
npm test
```

## Location Quality

Lead packs include a `sourceQuality` object copied from discovery/orchestrator source metadata when available. This records requested location, candidate location, match status, confidence, warnings, distance placeholder, and fallback state. Out-of-area candidates should not appear as ordinary leads unless explicit fallback is used upstream.
