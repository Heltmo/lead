# LOCATION_QUALITY_V1

## Purpose

Product Smoke Test 001 proved that the lead-pack runner can package orchestrator outputs into seller-ready JSON/CSV summaries.

It also exposed a SaaS trust problem:

```text
advokater i Gol
```

produced only two final lead packs, and one candidate was located in Halden.

For a lead intelligence SaaS, wrong geography is worse than low volume. If a user asks for a niche in a city, location intent must be respected, and any fallback or uncertainty must be visible.

## Product Rule

Requested location is a first-class constraint.

The system must not silently package out-of-area businesses as normal leads.

Allowed behavior:

- exact local candidates are included normally
- unknown-location candidates are flagged
- out-of-area candidates are excluded from handoff by default
- fallback candidates may be included only when fallback is explicit and visible

Not allowed:

- silently filling a local batch with wrong-city leads
- treating a distant candidate as a normal result because it has a good website/opportunity signal
- hiding location uncertainty from the seller

## Location Scopes

V1 uses deterministic string-based matching.

Location match statuses:

- `exact_location`: candidate address/city contains the requested location
- `nearby`: reserved for future radius/coordinate logic
- `regional_fallback`: reserved for explicit fallback mode
- `out_of_area`: candidate address/city conflicts with requested location
- `unknown`: requested or candidate location is missing/unclear

V1 does not attempt full geocoding. Coordinates/distance can be added later.

## Query Intent

Simple Norwegian and English patterns are parsed:

```text
<vertical> i <location>
<vertical> in <location>
```

Example:

```json
{
  "vertical": "advokater",
  "requestedLocation": "Gol",
  "country": "NO"
}
```

If parsing fails, `requestedLocation` is `null`, and location quality becomes `unknown`.

## Candidate Location Quality

Each discovered candidate gets:

```json
{
  "requestedLocation": "Gol",
  "candidateLocation": "Tollbugata 5, 1767 Halden, Norway",
  "candidateCity": "Halden",
  "locationMatchStatus": "out_of_area",
  "locationConfidence": 0.1,
  "distanceKm": null,
  "locationWarnings": [
    "candidate_appears_outside_requested_location",
    "excluded_from_handoff_out_of_area"
  ],
  "fallbackUsed": false
}
```

## Discovery Behavior

Default behavior:

- `exact_location`: eligible for handoff
- `nearby`: eligible when implemented
- `unknown`: eligible but visibly flagged
- `out_of_area`: not audit-eligible by default

This means out-of-area candidates can remain in discovery reports for debugging, but they should not flow silently into the orchestrator or lead packs unless an explicit fallback mode is used.

## Lead Pack Behavior

Lead packs expose location quality under `sourceQuality`:

```json
{
  "sourceQuality": {
    "requestedLocation": "Gol",
    "candidateLocation": "Sentrumsvegen 130, 3550 Gol",
    "locationMatchStatus": "exact_location",
    "locationConfidence": 0.95,
    "distanceKm": null,
    "locationWarnings": [],
    "fallbackUsed": false
  }
}
```

CSV exports include the same high-level fields so a seller can filter or inspect location quality.

## Google Places Notes

Google Places is still the preferred local discovery provider for V1.

The provider requests location-relevant fields:

- display name
- formatted address
- location
- national phone number
- website
- rating
- review count
- business status
- place id

V1 still relies primarily on post-filtering. Future versions can add stronger location bias/radius behavior and coordinate distance checks.

## SaaS Trust Impact

Low volume is acceptable.

Wrong geography without warning is not acceptable.

For example, this is acceptable:

```text
Only 1 exact Gol candidate found.
No fallback used.
```

This is not acceptable:

```text
Halden candidate appears as normal lead for Gol query.
```

## Product Smoke Test Follow-Up

After this V1 location quality pass, Product Smoke Test 002 should answer:

- how many exact-location candidates were found
- how many out-of-area candidates were excluded
- whether any out-of-area candidate reached lead packs silently
- whether the output is more trustworthy even if volume is lower

The expected product posture is:

```text
Correct local leads first.
Explicit fallback later.
No silent location drift.
```

## Search Scope

See `SEARCH_SCOPE_V1.md` for strict/nearby/regional fallback behavior and low-supply metadata.
