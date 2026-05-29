# company-profile

Deterministic Norwegian company enrichment for Webconsult lead packs.

## Purpose

`core/company-profile/` matches discovered leads to official company records from Brønnøysundregistrene / Enhetsregisteret and returns firm metadata with an explicit match confidence.

This module is intentionally conservative. It is better to return `manual_verify` than attach the wrong organization number to a lead.

## Source

V1 uses the open Enhetsregisteret REST API:

- `GET https://data.brreg.no/enhetsregisteret/api/enheter`
- `GET https://data.brreg.no/enhetsregisteret/api/underenheter`

The client searches with `navn`, `navnMetodeForSoek=FORTLOEPENDE`, `size`, and `page`.

## Output

```js
{
  organizationNumber: string | null,
  candidateOrganizationNumber: string | null,
  legalName: string | null,
  candidateLegalName: string | null,
  organizationForm: string | null,
  registeredAddress: string | null,
  municipality: string | null,
  unitType: 'enhet' | 'underenhet' | 'unknown' | null,
  naceCode: string | null,
  naceDescription: string | null,
  employees: number | null,
  registrationDate: string | null,
  activeStatus: string | null,
  source: 'brreg',
  sourceUrl: string | null,
  errorType: 'api_error' | 'network_error' | 'parse_error' | 'timeout' | 'unknown_error' | null,
  matchConfidence: number,
  matchStatus: 'exact_match' | 'strong_match' | 'weak_match' | 'manual_verify' | 'no_match' | 'error',
  matchReasons: string[],
  warnings: string[],
  candidates: Array<{
    candidateOrganizationNumber: string | null,
    candidateLegalName: string | null,
    organizationForm: string | null,
    municipality: string | null,
    address: string | null,
    unitType: 'enhet' | 'underenhet' | 'unknown',
    score: number,
    matchReasons: string[],
    warnings: string[],
  }>,
}
```

## Match Policy

- `exact_match`: confidence `0.95+`; organization number is included.
- `strong_match`: confidence `0.80+` with supporting evidence beyond name; organization number is included.
- `weak_match`: confidence `0.55+`; organization number is not included, but candidate organization number may be shown separately.
- `manual_verify`: plausible but ambiguous; organization number is not included.
- `no_match`: no plausible candidate.
- `error`: API/network/parse/timeout failure or unavailable fetch implementation.

Chain, franchise, branch, and multi-location ambiguity should push matches toward `manual_verify` unless evidence is very strong. Name-only exact matches and municipality/address mismatches also require `manual_verify`; the module can expose `candidateOrganizationNumber` while keeping confirmed `organizationNumber` null.

## V2 Branch/Chain Safety

The module now exposes ambiguous Brreg results instead of hiding them:

- `candidates[]` lists plausible alternatives for `manual_verify` and weak matches.
- `unitType` identifies `enhet`, `underenhet`, or `unknown`.
- Multiple plausible candidates add `multiple_plausible_candidates` and keep `organizationNumber: null`.
- Enhet/underenhet ambiguity adds `unit_subunit_ambiguity` and `branch_location_uncertain` unless one candidate clearly dominates with location/branch evidence.
- Chain, brand, franchise, clinic group, and network cases add warnings such as `chain_ambiguity`, `branch_ambiguity`, and `brand_legal_name_mismatch`.
- Timeout, network, API, and parse errors return `matchStatus: error` without confirming org.nr.
- Repeated identical lookup calls can use an in-memory cache for the current process/run.
- Lead Machine integrations can enable a local file cache for repeated Brreg/company-profile lookups across runs.

## Local File Cache

`enrichCompanyProfile(input, { fileCache: true })` stores successful non-error profiles under `.cache/company-profile/brreg-company-profile-v1/` by default. The cache key uses normalized company name, website domain, phone digits, email, address, city, industry, Brreg base URL, and search size.

Defaults:

- TTL: 30 days
- errors are not cached
- no SQL database
- no persistent cache outside the local workspace
- `.cache/` is ignored by git

This is meant to keep Fast scans quick when the same company appears in repeated searches, while preserving the conservative matching policy. If Brreg returns `error`, the next run can retry instead of reusing a stale failure.

Confirmed `organizationNumber` remains reserved for exact/strong matches with enough support. Uncertain matches should use `candidateOrganizationNumber` and `candidates[]` for manual verification.

Proff enrichment must wait until `organizationNumber` is confirmed. Running Proff on weak/manual candidates risks attaching financial data to the wrong legal entity.

## CLI

```bash
cd core/company-profile
npm run company-profile -- --name "Glomma Tannklinikk" --city "Fredrikstad"
```

Optional fields:

```bash
--website "https://example.no" --phone "69 00 00 00" --address "Gate 1" --industry dentist
```

## Tests

Tests use mocked API responses and do not call Brreg.

```bash
npm test
```

## Integration Status

V1 is standalone. It is ready to be consumed by future lead-pack generation, review workspace export, or CRM export work, but it does not change lead scoring or ranking.
