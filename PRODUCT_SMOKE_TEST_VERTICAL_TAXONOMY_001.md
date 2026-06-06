# Product Smoke Test: Vertical Taxonomy 001

Purpose: verify that normal Norwegian service searches do not collapse to empty or unknown searches when the category needs synonyms.

## Manual Searches

Run these in the beta with Google Places when an API key is available:

- `personlig trener i Kristiansand`
- `hudpleie i Halden`
- `frisør i Halden`

## Expected Behavior

For `personlig trener i Kristiansand`, expanded terms should include:

- `PT Kristiansand`
- `personal trainer Kristiansand`
- `treningssenter personlig trener Kristiansand`

For `hudpleie i Halden`, expanded terms should include:

- `hudklinikk Halden`
- `hudterapeut Halden`
- `skjønnhetsklinikk Halden`
- `beauty salon Halden`
- `spa Halden`

Candidate cards may show exact, related, broad, or weak category badges. Broad/weak matches should stay reviewable, not overclaimed.

## Known Limitations

- No 1881.
- No Proff.
- No SSB.
- No scraping.
- No private-person enrichment.
- No automatic outreach.
- Google Places category coverage can still be uneven by city.
