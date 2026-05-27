# Lead Machine Showcase

Static demo for the Webconsult Lead Machine concept.

## What It Is

This is a non-technical product showcase for ranked seller-ready lead packs. It shows:

- query and search scope
- strict location behavior
- explicit regional fallback
- ranked lead cards
- evidence and caution notes
- company profile match status
- export preview

The demo is intentionally static and deterministic. It does not call Google Places, Brreg, Proff, or any backend service.

## How To Open

Open directly:

```bash
xdg-open demo/lead-machine-showcase/index.html
```

Or serve it locally:

```bash
cd demo/lead-machine-showcase
python3 -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080
```

The app reads `demo-data/showcase.json` when served locally and also includes the same fallback data in `app.js` so the HTML can be opened directly.

## Demo Scenarios

1. `Advokater i Gol - strict`
   - proves that strict mode does not silently include wrong-location leads
   - shows low supply and recommended expansion

2. `Advokater i Gol - regional`
   - proves controlled fallback
   - marks regional fallback leads with warnings

3. `Pilot lead packs`
   - shows seller-ready lead cards for calibrated HIGH and MEDIUM examples
   - includes contact, evidence, caution, source quality, company-profile state, and export fields

## Product Boundary

Machine provides:

- discovery
- enrichment
- ranking
- evidence
- caution
- export

Seller owns:

- angle
- wording
- outreach
- timing
- relationship
- close

## What It Proves

The demo makes the backend work visible: Webconsult can turn a search into location-aware, ranked lead packs with context and warnings.

## What It Does Not Prove

This is not a production SaaS UI. It does not include auth, database, saved searches, Proff enrichment, live provider calls, CRM integration, or automatic outreach.

## Next Product Steps

- show this to non-technical colleagues
- verify that the product concept is understood quickly
- collect feedback on lead-card fields and export needs
- then decide whether the next build should be safer Brreg integration, saved searches, or a real SaaS UI shell
