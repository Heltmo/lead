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
  legalName: string | null,
  organizationForm: string | null,
  registeredAddress: string | null,
  municipality: string | null,
  naceCode: string | null,
  naceDescription: string | null,
  employees: number | null,
  registrationDate: string | null,
  activeStatus: string | null,
  source: 'brreg',
  sourceUrl: string | null,
  matchConfidence: number,
  matchStatus: 'exact_match' | 'strong_match' | 'weak_match' | 'manual_verify' | 'no_match' | 'error',
  matchReasons: string[],
  warnings: string[],
}
```

## Match Policy

- `exact_match`: confidence `0.95+`; organization number is included.
- `strong_match`: confidence `0.80+`; organization number is included.
- `weak_match`: confidence `0.55+`; organization number is not included.
- `manual_verify`: plausible but ambiguous; organization number is not included.
- `no_match`: no plausible candidate.
- `error`: API/network failure or unavailable fetch implementation.

Chain, franchise, branch, and multi-location ambiguity should push matches toward `manual_verify` unless evidence is very strong.

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
