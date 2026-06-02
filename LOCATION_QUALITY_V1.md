# Location Quality V1

Location quality is core seller trust data.

Lead Machine treats the requested place as a constraint, not a decoration. Exact-location leads should be separated from fallback/regional leads, and every lead pack should expose whether the candidate matched the requested location.

## Current Fields

- requestedLocation
- candidateLocation
- locationMatchStatus
- locationConfidence
- locationWarnings
- fallbackUsed
- searchScope

## Product Rule

Fallback leads can be useful, but they must be visibly marked so a seller does not treat them as local exact matches by accident.
