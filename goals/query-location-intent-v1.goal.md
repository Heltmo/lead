# Query Location Intent V1

## Objective

Stop known city searches with unsupported/free-text verticals from becoming broad Norway sweeps.

Examples:

```text
hotell Oslo -> hotell i Oslo
hotell i Oslo -> hotell i Oslo
Oslo hotell -> hotell i Oslo
```

These should remain focused 25-lead searches because the seller supplied a place.

## Why

Norway Sweep is useful for broad searches like `frisør`, `rørlegger`, or `escape room`.

It is wasteful when the seller typed a city that the parser failed to recognize because the vertical is not in the controlled list.

## Scope

- Add a known Norwegian location matcher to `apps/lead-machine-demo/queryParser.js`.
- Keep supported vertical parsing unchanged.
- Treat known-city + free-text vertical as a location-specific query.
- Keep location-only queries out of scope.
- Add smoke coverage for unknown vertical + known city.

## Boundaries

Do not add broad fuzzy NLP, external geocoding, paid APIs, or new provider dependencies.

## Success Criteria

- `hotell Oslo` parses with `location: "Oslo"`.
- `hotell i Oslo` parses with `location: "Oslo"`.
- `Oslo hotell` parses with `location: "Oslo"`.
- These searches do not enable Norway Sweep.
- Existing supported vertical searches still pass.
