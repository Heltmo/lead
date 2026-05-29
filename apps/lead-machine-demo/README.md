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

- `Fast` mode is the default for daily scanning. It runs discovery/location quality and creates basic lead packs without full website audit, using the broadest safe demo search cap automatically.
- `Deep` mode runs the full website audit and commercial scoring flow for slower, richer lead packs.
- Use Fast for 10-25 lead scans, then Deep for the strongest leads.

Recommended workflow:

1. Run `Fast` to scan a market quickly.
2. Review phone, website, location, rating/reviews, and source warnings.
3. Use `Run Deep qualification for this lead` on one promising candidate. This audits only the selected lead and replaces that card while the rest of the list stays as Fast candidates.
4. Export the lead pack once the lead is qualified enough for seller review.

Fast results are candidates, not fully qualified leads. Deep qualification is per lead: it upgrades one selected candidate with website audit/scoring signals without rerunning the full search. Deep may raise or lower website opportunity, but seller readiness is separate: a contactable, active, correctly located company can still be a useful B2B lead even when website opportunity is low.

## What It Does

By default, the app uses Balanced discovery: Brreg official identity first, plus Google Places public presence when available. Brreg company identity is enabled automatically. A hidden fixture provider exists only for deterministic tests; it is not exposed as the seller workflow.

The browser sends the query to a local Node server. For live providers, the server calls the existing `core/lead-machine` module directly and returns:

- run summary
- lead packs
- CSV download path
- JSON download path
- output folder path

The frontend displays:

- query/run status
- summary counts
- lead cards with filters for phone, org.nr, website, exact location, Deep qualification need, and Brreg issues
- lead sorting by best first, phone, confirmed org.nr, Google reviews, employees, and discovery confidence
- a Seller Command card with call readiness, best first contact, company fit, verification status, main risk, next action, and source confidence
- a compact Seller Desk V2 layer with company identity, contactability, market proof, and action/risk
- secondary qualification, verification, source intelligence, and raw source data collapsed below the decision layer
- per-lead Deep qualification that updates only the selected company card
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
- Balanced runs can return Brreg identity rows without a Google key, but Google Places presence enrichment requires `GOOGLE_PLACES_API_KEY`.
- Brreg firmaprofil uses `core/company-profile` automatically to enrich org.nr/legal identity conservatively because company identity is core seller context.
- Fast mode treats website URLs as unverified until Deep confirms they are real and relevant.
- The Brreg panel shows confirmed org.nr only for strong matches. Uncertain results stay as candidate org.nr/manual verify with legal name, organization form, address, municipality, NACE, employees, status, match confidence, warnings, and candidate records when available.
- Economy/Proff status remains `not_enabled`.
- Run folders are local and ignored by git.

## Speed Notes

Live runs are slower than the fixture because each included lead can trigger:

1. Brreg official identity discovery
2. Google Places presence enrichment when an API key is available
3. optional website audit in Deep mode
4. lead-pack generation
5. automatic Brreg company-profile lookup for non-Brreg-first candidates

Use `Fast` for broad automatic scans. The local demo uses an internal cap of 25 leads so the seller does not need to choose a technical max-results value. Use selected-lead `Deep` when you want full website audit/scoring for one candidate. Brreg runs by default for seller-ready identity context.
