# SEARCH_SCOPE_V1

## Purpose

`LOCATION_QUALITY_V1` prevents silent location drift.

`SEARCH_SCOPE_V1` defines what happens when exact-location supply is low.

Example:

```text
advokater i Gol
```

If only one exact Gol lead exists, the system should not silently fill the batch with Halden, Oslo, or other wrong-city leads. It should report low supply and make expansion explicit.

## Product Rule

Silent fallback destroys SaaS trust.

The machine must say whether results are:

- exact local leads
- nearby leads
- regional fallback leads
- unknown-location leads
- excluded out-of-area leads

Out-of-area candidates must never appear as normal leads.

## Search Scopes

### strict

Default mode.

Behavior:

- include `exact_location`
- include `unknown` only when location evidence is missing, with visible warnings
- exclude `out_of_area`
- do not use fallback

Use when the user expects a precise local result set.

### nearby

Reserved for future coordinate/radius behavior.

Behavior in V1:

- include `exact_location`
- include future `nearby` candidates when distance/radius exists
- exclude far `out_of_area`
- mark non-exact candidates with fallback warnings

V1 does not calculate radius yet, so this mode mostly documents the next product behavior.

### regional

Explicit fallback mode.

Behavior:

- include `exact_location`
- include out-of-area candidates as `regional_fallback`
- set `fallbackUsed=true`
- add location warnings
- never let fallback candidates look like normal exact leads

Use only when the operator/user explicitly wants broader supply.

## Low Supply

When strict mode returns fewer leads than requested, summaries should expose:

```json
{
  "requestedLocation": "Gol",
  "searchScope": "strict",
  "requestedMaxResults": 5,
  "includedLeadCount": 1,
  "lowSupply": true,
  "fallbackAvailable": true,
  "fallbackUsed": false,
  "recommendedExpansion": "nearby"
}
```

This lets the UI eventually say:

```text
Only 1 exact lead found. Expand to nearby?
```

## Lead Pack Behavior

Lead packs expose search scope under `sourceQuality`:

```json
{
  "sourceQuality": {
    "searchScope": "strict",
    "requestedMaxResults": 5,
    "includedLeadCount": 1,
    "lowSupply": true,
    "fallbackAvailable": true,
    "recommendedExpansion": "nearby",
    "requestedLocation": "Gol",
    "candidateLocation": "Sentrumsvegen 130, 3550 Gol",
    "locationMatchStatus": "exact_location",
    "locationWarnings": [],
    "fallbackUsed": false
  }
}
```

For regional fallback:

```json
{
  "sourceQuality": {
    "searchScope": "regional",
    "locationMatchStatus": "regional_fallback",
    "fallbackUsed": true,
    "locationWarnings": [
      "candidate_appears_outside_requested_location",
      "included_as_explicit_location_fallback"
    ]
  }
}
```

## SaaS UX Direction

V1 CLI/output:

```text
strict:
  1 exact lead
  lowSupply=true
  fallbackAvailable=true

regional:
  exact lead + regional fallback leads
  fallbackUsed=true
```

Future UI:

```text
Search: advokater i Gol

1 exact lead found.
4 broader-area candidates available.
[Expand to nearby]
[Expand regionally]
```

## What Not To Do

Do not solve low supply by making discovery loose by default.

Do not add Proff to compensate for wrong geography.

Do not let fallback silently affect seller ranking without visible location warnings.

Search scope is a source-quality/product-control layer, not a sales scoring layer.
