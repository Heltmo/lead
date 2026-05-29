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

## Fast vs Deep Mode

- `Fast` mode is the default for daily scanning. It runs discovery/location quality and creates basic lead packs without full website audit.
- `Deep` mode runs the full website audit and commercial scoring flow for slower, richer lead packs.
- Use Fast for 10-25 lead scans, then Deep for the strongest leads.

Recommended workflow:

1. Run `Fast` to scan a market quickly.
2. Review phone, website, location, rating/reviews, and source warnings.
3. Use `Run Deep qualification` on promising candidates. In V1 this reruns the current query in Deep mode; selected-lead-only qualification comes later.
4. Export the lead pack once the lead is qualified enough for seller review.

Fast results are candidates, not fully qualified leads. Deep results include website audit/scoring signals.

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
- a Seller Command card with call readiness, best first contact, company fit, verification status, main risk, next action, and source confidence
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

No prepared pitch text, email templates, or automated outreach are included. The Seller Command card is a decision brief, not a script.

## Limitations

- Uses local server only.
- `Demo fixture` works without credentials.
- Live Google Places runs require `GOOGLE_PLACES_API_KEY`.
- `Brreg firmaprofil` uses `core/company-profile` to enrich org.nr/legal identity conservatively. It defaults off because it adds API lookups per lead.
- The Brreg panel shows confirmed org.nr only for strong matches. Uncertain results stay as candidate org.nr/manual verify with legal name, organization form, address, municipality, NACE, employees, status, match confidence, warnings, and candidate records when available.
- Economy/Proff status remains `not_enabled`.
- Run folders are local and ignored by git.

## Speed Notes

Live runs are slower than the fixture because each included lead can trigger:

1. Google Places discovery
2. optional website audit in Deep mode
3. lead-pack generation
4. optional Brreg company-profile lookup

Use `Fast` + `Max 10-25` for quick scans. Use `Deep` when you want full website audit/scoring. Turn on `Brreg firmaprofil` when identity/org.nr matters more than speed. Keep it off for the fastest market scan, then enable it when the seller needs company identity and verification context.
