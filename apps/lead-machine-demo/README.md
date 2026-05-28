# Lead Machine Live Demo

Local interactive demo app for the Webconsult Lead Machine.

## Purpose

This app lets a user type a query like:

```text
Kristiansand rørlegger
```

and run the existing Lead Machine flow from a browser.

It is not a full SaaS app. It has no auth, database, Proff integration, saved searches, CRM integration, or outreach automation.

## Run Locally

```bash
cd apps/lead-machine-demo
npm run dev
```

The server automatically reads API keys from:

- `/home/xman/webconsult/.env`
- `apps/lead-machine-demo/.env`

For live Google Places runs, add this to `.env`:

```bash
GOOGLE_PLACES_API_KEY=your-google-places-key
```

Keep `Demo fixture` selected when you want to test the UI without external API calls.

Open:

```text
http://127.0.0.1:8787
```

## Search UX

The demo supports structured search:

```text
Bransje: Fysioterapeut
Sted: Ålesund
```

This generates the same internal query as free text:

```text
fysioterapeut i Ålesund
```

The profession selector is a controlled list of supported verticals. The location field is an autocomplete list of common Norwegian cities/municipalities, while still allowing manual text entry.

## Example Queries

- `Kristiansand rørlegger`
- `rørlegger Kristiansand`
- `rørleggere i Kristiansand`
- `advokater i Gol`
- `Gol advokat`
- `Ålesund fysioterapeuter`
- `bilverksted i Bergen`
- `frisør Tromsø`
- `eiendomsmeglere i Oslo`

## What It Does

By default, the app uses `Demo fixture`, which works without external API keys and returns deterministic local lead-pack data. Select `Google Places` for a live run after setting `GOOGLE_PLACES_API_KEY`.

The browser sends the query to a local Node server. For live providers, the server calls the existing `core/lead-machine` module directly and returns:

- run summary
- lead packs
- CSV download path
- JSON download path
- output folder path

The frontend displays:

- query/run status
- summary counts
- lead cards
- selected lead detail
- evidence and caution
- export links

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

No prepared pitch text, email templates, or automated outreach are included.

## Limitations

- Uses local server only.
- `Demo fixture` works without credentials.
- Live Google Places runs require `GOOGLE_PLACES_API_KEY`.
- Company profile enrichment defaults off.
- Economy/Proff status remains `not_enabled`.
- Run folders are local and ignored by git.
