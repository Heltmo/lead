# Product Smoke Test 001

## Purpose

Validate the first SaaS-style flow:

```text
user query -> ranked seller-ready lead packs
```

This test checks whether a live discovery/orchestrator run can be packaged into product-oriented lead packs with JSON, CSV, summary metadata, ranking, evidence, caution notes, and optional company-profile enrichment.

This test does not validate outreach, sales scripts, Proff enrichment, saved searches, or frontend UX.

## Query

- query: advokater i Gol
- provider: Google Places
- max results: 5
- discovery time: 2026-05-27

## Run Outputs

- discovery candidates: `core/lead-discovery-agent/reports/product-smoke-001-advokater-gol-candidates.json`
- discovery summary: `core/lead-discovery-agent/reports/product-smoke-001-advokater-gol-summary.json`
- discovery handoff: `core/lead-discovery-agent/reports/product-smoke-001-advokater-gol-handoff.jsonl`
- orchestrator run path: `core/orchestrator/runs/product-smoke-001-advokater-gol-places-5`
- lead-pack output without company enrichment: `core/lead-pack-runner/runs/product-smoke-001-advokater-gol-no-enrichment`
- lead-pack output with company enrichment: `core/lead-pack-runner/runs/product-smoke-001-advokater-gol-company-profile`

Files generated in each lead-pack output:

- `lead-packs.json`
- `lead-packs.csv`
- `summary.json`

## Discovery / Run Summary

- raw Google Places candidates: 5
- invalid candidates: 2
- duplicates removed: 1
- final candidates: 2
- reachable candidates: 2
- audit-eligible candidates: 2
- orchestrator completed items: 2
- orchestrator failed items: 0

Lead-pack summary without company enrichment:

- total leads: 2
- Medium: 1
- Low: 1
- economy status: not_enabled

Lead-pack summary with company enrichment:

- total leads: 2
- Medium: 1
- Low: 1
- economy status: not_enabled

## Lead Pack Summary

### 1. Scheibler Advokatfirma avd. Gol

- rank: 1
- company display name: Scheibler Advokatfirma avd. Gol
- website: https://www.scheibler.as
- phone: 41 45 34 14
- address/city: Sentrumsvegen 130, 3550 Gol / Gol
- callPriority: medium
- leadClass: technical_redesign
- opportunityType: technical_trust_risk
- rating/review count: unknown / unknown
- whyRanked:
  - callPriority:medium
  - leadClass:technical_redesign
  - opportunityType:technical_trust_risk
  - strong_existing_conversion_flow
  - visible_technical_trust_pain
  - failed_requests
  - console_errors
  - accessibility_usability_pain
- caution:
  - Seller owns angle and wording; do not use generated scripts.
  - Company identity requires manual verification before using org.nr.
  - Verify technical findings before overstating them.
  - Shortlist lead; validate pain before treating as call-first.
- topEvidence:
  - Serious accessibility issues detected
  - No social links detected
  - Failed network requests detected
- companyProfile:
  - legalName: unknown
  - organizationNumber: unknown
  - candidateOrganizationNumber: unknown
  - matchStatus: no_match
  - matchConfidence: 0
  - warnings: none
- economy.status: not_enabled

### 2. Advokatfirma Wang & Holm-Olsen AS

- rank: 2
- company display name: Advokatfirma Wang & Holm-Olsen AS
- website: http://www.advokatwang.no
- phone: 69 18 46 93
- address/city: Besøksadresse:, Tollbugata 5, 1767 Halden / Halden
- callPriority: low
- leadClass: high_value_service_conversion
- opportunityType: high_value_service_conversion_gap
- rating/review count: 4.2 / 5
- whyRanked:
  - callPriority:low
  - leadClass:high_value_service_conversion
  - opportunityType:high_value_service_conversion_gap
  - polished_or_vendor_built_site
  - strong_existing_conversion_flow
  - clear_contact_path_reduces_cta_pain
  - law_firm_service_line_lower_immediate_pressure
  - high_value_service_conversion_leak
- caution:
  - Seller owns angle and wording; do not use generated scripts.
  - Company identity requires manual verification before using org.nr.
  - Company profile warnings: fetch failed
  - Verify technical findings before overstating them.
- topEvidence:
  - Serious accessibility issues detected
  - No social links detected
  - Failed network requests detected
- companyProfile:
  - legalName: unknown
  - organizationNumber: unknown
  - candidateOrganizationNumber: unknown
  - matchStatus: error
  - matchConfidence: 0
  - warnings: fetch failed
- economy.status: not_enabled

## Validation Questions

1. Did the runner successfully produce `lead-packs.json`?

Yes.

2. Did the runner successfully produce `lead-packs.csv`?

Yes.

3. Did `summary.json` contain useful counts?

Yes. It reports total leads, priority counts, source run, source query, enrichment mode, and economy status.

4. Did missing fields become null/unknown instead of guessed?

Yes. Missing rating/review data and company identity fields were left null/unknown instead of guessed.

5. Did company-profile `manual_verify` avoid confirmed org.nr?

No `manual_verify` case appeared in this smoke test. The observed cases were `no_match` and `error`. Both avoided confirmed org.nr.

6. Did company-profile errors/no_match avoid crashing the run?

Yes. One lead returned `no_match`, one returned `error`, and the lead-pack run still completed.

7. Did `economy.status` remain `not_enabled`?

Yes.

8. Does this output look like something a SaaS user could use?

Partially. The lead-pack format is useful: it includes ranking, contact info, evidence, cautions, website intelligence, and company-profile status. But the query result quality needs improvement before this feels product-ready, because only 2 leads were found and one returned lead was located in Halden despite the Gol query.

9. Is the lead pack too verbose, too thin, or about right?

About right for a V1 data pack. The JSON is detailed enough for product/UI use, and the CSV is compact enough for export. The biggest content gap is not verbosity; it is source quality and enrichment reliability.

10. What is missing before this becomes product-ready?

- stronger location filtering for Google Places results
- clearer handling of out-of-location candidates
- more robust company-profile network/error handling
- a single product command that runs discovery/orchestrator/packaging in one flow
- UI/API surface later
- Proff only after confirmed org.nr is reliably available

## Product Verdict

PARTIAL: packaging works, but query/source quality needs improvement before the full SaaS flow is product-ready.

The core packaging layer is usable for V1. The smoke test proves:

- discovery can produce candidates
- orchestrator can audit them
- lead-pack-runner can package them
- JSON/CSV/summary outputs are generated
- company-profile does not crash the run
- economy remains disabled
- no outreach scripts are generated

The main weakness is upstream product quality:

```text
advokater i Gol
```

produced only two final lead packs, and one was a Halden business. That means the next improvement should focus on discovery/location quality or a single command wrapper, not Proff or frontend.

## Next Recommended Step

Do not add Proff yet.

The next best step is one of:

1. improve lead pack field quality and location filtering
2. integrate runner into a single internal command
3. improve company-profile retry/error handling

Recommended next commit:

```text
Tighten lead pack location quality
```

Rationale:

The lead-pack runner itself passed the smoke test. The product gap is that the SaaS query should not quietly package out-of-location results without a warning, penalty, or manual-verify flag.
