# Product Smoke Test 003

## Purpose

Validate Search Scope V1 for the Lead Machine.

Product Smoke Test 002 proved that location quality prevents silent location drift. Product Smoke Test 003 checks the next product behavior:

```text
What happens when exact-location supply is low?
```

The test compares:

- `strict`: exact location only, no silent fallback
- `regional`: explicit fallback allowed and visibly marked

## Query

- query: advokater i Gol
- provider: Google Places
- max results: 5
- date: 2026-05-27

## Strict Mode

Discovery output:

- searchScope: strict
- requestedMaxResults: 5
- includedLeadCount: 1
- lowSupply: true
- fallbackAvailable: true
- fallbackUsed: false
- recommendedExpansion: nearby
- total candidates: 2
- exact_location: 1
- out_of_area: 1
- handoff-ready candidates: 1

Included:

### Scheibler Advokatfirma avd. Gol

- locationMatchStatus: exact_location
- requestedLocation: Gol
- candidateLocation: Sentrumsvegen 130, 3550 Gol
- callPriority: medium
- handoff: included

Excluded:

### Advokatfirma Wang & Holm-Olsen AS

- locationMatchStatus: out_of_area
- candidateLocation: Besøksadresse:, Tollbugata 5, 1767 Halden
- auditEligible: false
- handoff: excluded
- warnings:
  - candidate_appears_outside_requested_location
  - excluded_from_handoff_out_of_area

Lead-pack output:

- totalLeads: 1
- priorityCounts:
  - medium: 1
- searchScope: strict
- lowSupply: true
- fallbackAvailable: true
- fallbackUsed: false
- locationQualityCounts:
  - exact_location: 1
- economy.status: not_enabled

## Regional Mode

Discovery output:

- searchScope: regional
- requestedMaxResults: 5
- includedLeadCount: 2
- lowSupply: false
- fallbackAvailable: false
- fallbackUsed: true
- total candidates: 2
- exact_location: 1
- regional_fallback: 1
- handoff-ready candidates: 2

Included:

### Scheibler Advokatfirma avd. Gol

- locationMatchStatus: exact_location
- requestedLocation: Gol
- candidateLocation: Sentrumsvegen 130, 3550 Gol
- callPriority: medium
- fallbackUsed: false

### Advokatfirma Wang & Holm-Olsen AS

- locationMatchStatus: regional_fallback
- requestedLocation: Gol
- candidateLocation: Besøksadresse:, Tollbugata 5, 1767 Halden
- callPriority: low
- fallbackUsed: true
- warnings:
  - candidate_appears_outside_requested_location
  - included_as_explicit_location_fallback

Lead-pack output:

- totalLeads: 2
- priorityCounts:
  - medium: 1
  - low: 1
- searchScope: regional
- fallbackUsed: true
- locationQualityCounts:
  - exact_location: 1
  - regional_fallback: 1
- economy.status: not_enabled

## Validation Questions

1. Does strict mode avoid silent fallback?

Yes. The Halden candidate remains visible in discovery reporting as `out_of_area`, but is excluded from handoff and does not appear as a normal lead pack.

2. Does strict mode report low supply?

Yes. It reports `lowSupply=true`, `includedLeadCount=1`, `requestedMaxResults=5`, `fallbackAvailable=true`, and `recommendedExpansion=nearby`.

3. Does regional mode make fallback explicit?

Yes. The non-Gol candidate appears as `regional_fallback` with `fallbackUsed=true` and clear warnings.

4. Do lead packs expose search scope?

Yes. Lead-pack summaries and `sourceQuality` include `searchScope`, low-supply fields, location match status, warnings, and fallback state.

5. Does economy remain disabled?

Yes. `economy.status` remains `not_enabled`.

6. Did this change scoring?

No. Search scope is source-quality/product metadata. It does not change commercial-pressure or opportunity-compressor scoring.

## Product Verdict

PASS.

Search Scope V1 gives the SaaS product the right behavior:

```text
strict = honest local supply
regional = explicit fallback, never silent
```

For `advokater i Gol`, the product can now say:

```text
1 exact lead found.
Regional fallback is available.
```

and only include broader-area leads when fallback is explicitly requested.

## Next Recommended Step

Do not add Proff yet.

The next product step should be:

```text
Add single command lead machine runner
```

Rationale:

The core pieces now work:

```text
query -> search scope -> location-safe discovery -> orchestrator -> lead packs
```

But the operator still has to run discovery, orchestrator, and lead-pack-runner manually. A thin command wrapper would make the SaaS flow usable without adding frontend, Proff, saved searches, or outreach automation.
