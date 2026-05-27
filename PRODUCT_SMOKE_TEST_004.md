# Product Smoke Test 004

## Purpose

Validate the first single-command Lead Machine runner.

This test checks whether one command can run:

```text
discovery -> orchestrator audit -> lead-pack-runner -> lead-machine-summary.json
```

It does not validate Proff, frontend, saved searches, outreach automation, or new scoring.

## Commands

Strict:

```bash
cd core/lead-machine
npm run lead-machine -- \
  --query "advokater i Gol" \
  --provider google-places \
  --max-results 5 \
  --search-scope strict \
  --enrich-company-profile false \
  --run-id product-smoke-004-advokater-gol-strict
```

Regional:

```bash
cd core/lead-machine
npm run lead-machine -- \
  --query "advokater i Gol" \
  --provider google-places \
  --max-results 5 \
  --search-scope regional \
  --enrich-company-profile false \
  --run-id product-smoke-004-advokater-gol-regional
```

## Strict Result

Output folder:

```text
core/lead-machine/runs/product-smoke-004-advokater-gol-strict
```

Generated:

- `discovery/lead-candidates.json`
- `discovery/discovery-summary.json`
- `discovery/handoff.jsonl`
- `lead-packs/lead-packs.json`
- `lead-packs/lead-packs.csv`
- `lead-packs/summary.json`
- `lead-machine-summary.json`

Summary:

- totalDiscovered: 4
- totalIncluded: 0
- searchScope: strict
- locationQualityCounts:
  - out_of_area: 4
- lowSupply: true
- fallbackAvailable: true
- fallbackUsed: false
- recommendedExpansion: nearby
- sourceRunPath: null
- economyStatus: not_enabled

Interpretation:

Strict mode worked correctly. It did not audit or package wrong-location candidates as normal leads. The output says supply is low and fallback is available.

## Regional Result

Output folder:

```text
core/lead-machine/runs/product-smoke-004-advokater-gol-regional
```

Generated:

- `discovery/lead-candidates.json`
- `discovery/discovery-summary.json`
- `discovery/handoff.jsonl`
- `lead-packs/lead-packs.json`
- `lead-packs/lead-packs.csv`
- `lead-packs/summary.json`
- `lead-machine-summary.json`

Summary:

- totalDiscovered: 4
- totalIncluded: 4
- searchScope: regional
- locationQualityCounts:
  - regional_fallback: 4
- callPriorityCounts:
  - medium: 1
  - low: 3
- lowSupply: false
- fallbackAvailable: false
- fallbackUsed: true
- economyStatus: not_enabled

Regional fallback leads:

- Advokatfirmaet SGB Storløkken
- Elden Advokatfirma AS
- Advokatguiden.no
- Advokat Asle Hesla

All regional leads were marked:

```text
locationMatchStatus: regional_fallback
fallbackUsed: true
locationWarnings:
  - candidate_appears_outside_requested_location
  - included_as_explicit_location_fallback
```

Interpretation:

Regional mode worked correctly as an explicit fallback mode. It did not pretend broader-area results were exact Gol leads.

## Validation Questions

1. Did one command run the product flow?

Yes. The new `core/lead-machine` command produced discovery artifacts, orchestrator output when there were handoff candidates, lead-pack output, and `lead-machine-summary.json`.

2. Did strict mode preserve location trust?

Yes. It returned zero lead packs rather than silently packaging wrong-location candidates.

3. Did strict mode expose low supply?

Yes. It set `lowSupply=true`, `fallbackAvailable=true`, and `recommendedExpansion=nearby`.

4. Did regional mode make fallback explicit?

Yes. All broader-area leads were `regional_fallback` with warnings and `fallbackUsed=true`.

5. Did company-profile stay disabled?

Yes. `enrich-company-profile=false`, and economy remained `not_enabled`.

6. Did this change scoring?

No. This is a CLI/control-flow layer around existing discovery, orchestrator, and lead-pack-runner modules.

7. Is the output folder usable?

Yes. The output folders contain the expected discovery artifacts, lead-pack files, and lead-machine summary.

## Product Verdict

PASS for single-command runner.

PARTIAL for live Google Places supply quality on this query.

The product flow now works as:

```text
one command -> discovery -> audit -> lead packs -> summary
```

But the live provider result for:

```text
advokater i Gol
```

had no exact Gol leads in this run. That is not a lead-machine CLI bug; it is a provider/source-quality and local-supply issue.

## Next Recommended Step

Do not add Proff yet.

Recommended next step:

```text
Improve provider location bias and nearby expansion quality
```

Rationale:

The command runner works. The remaining product risk is that Google Places can return broad out-of-area candidates for low-supply local queries. Before Proff or UI, the product should improve:

- Google Places location bias / query strategy
- nearby vs regional distinction
- fallback quality
- source classification for directory-like results
