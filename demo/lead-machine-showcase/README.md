# Lead Machine Showcase

Static lead intelligence desk for the Webconsult Lead Machine concept.

## What It Is

This is a non-technical product demo for seller-ready lead packs. It is intentionally designed like a lead desk rather than a product presentation.

It shows:

- ranked lead list
- company-first profile card
- org.nr / candidate org.nr / match status
- phone, email, website, address and city
- employees, status and firm metadata when available
- source badges for Google Places, Website audit, Brreg/company-profile and Proff later
- lead priority, lead class and opportunity type
- why ranked, evidence and caution
- workflow strip: status, owner, next action and notes placeholder
- sales export preview

The demo is static and deterministic. It does not call Google Places, Brreg, Proff, or any backend service.

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

## How To Present It

Start with `Pilot lead packs`.

Show that the product is a lead desk:

1. Lead list on the left.
2. Company profile in the main panel.
3. Evidence, caution and workflow on the right.
4. Export preview at the bottom.

Then show `Advokater i Gol - strict` to explain location trust: the system prefers few/no exact leads over silent wrong-city filler.

Then show `Advokater i Gol - regional` to explain controlled fallback: broader leads can be included, but they are clearly marked.

Do not start with a zero-lead strict result when presenting to non-technical colleagues.

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

The demo makes the backend work visible: Webconsult can turn a search into location-aware, ranked lead packs with company context, evidence, warnings and export-ready data.

## What It Does Not Prove

This is not a production SaaS UI. It does not include auth, database, saved searches, Proff enrichment, live provider calls, CRM integration, or automatic outreach.

## Next Product Steps

- show this to non-technical colleagues
- verify that the lead desk concept is understood quickly
- collect feedback on company profile fields, evidence/caution, workflow state and export columns
- then decide whether the next build should be safer Brreg integration, saved searches, or a local interactive demo app
