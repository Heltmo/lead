# Product Smoke Test 002

## Purpose

Validate the location-quality fix from `LOCATION_QUALITY_V1.md`.

Product Smoke Test 001 proved lead-pack packaging worked, but revealed silent location drift:

```text
advokater i Gol
```

returned a Halden candidate as a normal lead.

Smoke Test 002 checks whether requested location is now respected before candidates enter orchestrator/lead-pack output.

## Query

- query: advokater i Gol
- provider: Google Places
- max results: 5
- discovery time: 2026-05-27

## Run Outputs

- discovery candidates: `core/lead-discovery-agent/reports/product-smoke-002-advokater-gol-candidates.json`
- discovery summary: `core/lead-discovery-agent/reports/product-smoke-002-advokater-gol-summary.json`
- discovery handoff: `core/lead-discovery-agent/reports/product-smoke-002-advokater-gol-handoff.jsonl`
- orchestrator run path: `core/orchestrator/runs/product-smoke-002-advokater-gol-location-places-5`
- lead-pack output path: `core/lead-pack-runner/runs/product-smoke-002-advokater-gol-location-company-profile`

## Discovery Result

- raw Google Places candidates: 5
- invalid candidates: 3
- duplicates removed: 0
- final candidates in discovery report: 2
- exact_location: 1
- out_of_area: 1
- fallbackUsed: false
- audit-eligible candidates: 1
- excluded candidates: 1
- handoff-ready candidates: 1

## Location Filtering Result

### Included

#### Scheibler Advokatfirma avd. Gol

- address: Sentrumsvegen 130, 3550 Gol
- requestedLocation: Gol
- candidateLocation: Sentrumsvegen 130, 3550 Gol
- locationMatchStatus: exact_location
- locationConfidence: 0.95
- auditEligible: true
- handoff: included

### Excluded

#### Advokatfirma Wang & Holm-Olsen AS

- address: Besøksadresse:, Tollbugata 5, 1767 Halden
- requestedLocation: Gol
- candidateLocation: Besøksadresse:, Tollbugata 5, 1767 Halden
- locationMatchStatus: out_of_area
- locationConfidence: 0.1
- auditEligible: false
- exclusion reason: out_of_area:Besøksadresse:, Tollbugata 5, 1767 Halden != Gol
- locationWarnings:
  - candidate_appears_outside_requested_location
  - excluded_from_handoff_out_of_area

## Lead Pack Result

Generated files:

- `lead-packs.json`
- `lead-packs.csv`
- `summary.json`

Lead-pack summary:

- total leads: 1
- Medium: 1
- Low: 0
- High: 0
- Verify: 0
- economy.status: not_enabled
- locationQualityCounts:
  - exact_location: 1

## Lead Pack

### 1. Scheibler Advokatfirma avd. Gol

- rank: 1
- callPriority: medium
- leadClass: technical_redesign
- opportunityType: technical_trust_risk
- website: https://www.scheibler.as
- phone: 41 45 34 14
- address/city: Sentrumsvegen 130, 3550 Gol / Gol
- sourceQuality:
  - requestedLocation: Gol
  - candidateLocation: Sentrumsvegen 130, 3550 Gol
  - locationMatchStatus: exact_location
  - locationConfidence: 0.95
  - distanceKm: unknown
  - locationWarnings: none
  - fallbackUsed: false
- companyProfile:
  - matchStatus: error
  - organizationNumber: unknown
  - candidateOrganizationNumber: unknown
  - warnings: fetch failed
- economy.status: not_enabled

## Validation Questions

1. Did out-of-area candidates get excluded or flagged?

Yes. The Halden candidate was marked `out_of_area`, made non-audit-eligible, and excluded from handoff.

2. Did the lead-pack output avoid silent location drift?

Yes. Only the exact Gol candidate reached the lead-pack output.

3. Did lead packs expose location quality?

Yes. `sourceQuality` includes requested location, candidate location, match status, confidence, warnings, and fallback state.

4. Did summary output include location counts?

Yes. Lead-pack `summary.json` reports `locationQualityCounts.exact_location = 1`.

5. Did company-profile uncertainty avoid confirmed org.nr?

Yes. Company-profile returned an error for the remaining lead, and no confirmed organization number was attached.

6. Did `economy.status` remain `not_enabled`?

Yes.

7. Is the output more trustworthy than Product Smoke Test 001?

Yes. Volume is lower, but geography is correct. For SaaS trust, that is the right tradeoff.

## Product Verdict

PASS for V1 location quality.

The system now behaves better for:

```text
advokater i Gol
```

It no longer silently fills the lead pack with a Halden candidate. It keeps the exact Gol lead and exposes source/location quality in the lead-pack output.

## Remaining Product Gaps

- Google Places returned low volume for this query.
- No nearby/regional fallback mode exists yet.
- Distance/radius logic is not implemented.
- Company-profile can still fail on network/API lookup and needs stronger retry/error handling.
- A single internal command should eventually run discovery -> orchestrator -> lead-pack packaging.

## Next Recommended Step

Do not add Proff yet.

The next best build is either:

1. single-command lead machine runner, or
2. company-profile retry/error safety, or
3. explicit nearby/regional fallback mode.

Recommended next product step:

```text
Add single command lead machine runner
```

Rationale:

The SaaS core now has:

```text
query -> location-safe discovery -> orchestrator -> lead packs
```

but the operator still has to run the steps manually. A thin command wrapper would make the product flow real without adding new scoring, Proff, frontend, or outreach automation.
