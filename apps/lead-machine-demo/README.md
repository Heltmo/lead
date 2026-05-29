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

## Fast Scan vs Deep Enrich

- `Fast scan` is the default for daily use. It runs broad discovery, location quality, Brreg identity enrichment, Google Places presence, and basic contact context without a full website audit.
- `Deep enrich` upgrades one selected lead with enrichment modules. V1 refreshes Brreg/company identity, contactability, seller leverage summary, and website audit status when a website exists. Proff/economy, social/source signals, decision-maker hints, and recent activity remain planned modules.
- Use Fast scan for 10-25 candidate scans, then enrich only the leads where extra context is worth the wait.

Recommended workflow:

1. Run `Fast scan` to scan a market quickly.
2. Review phone, location, Brreg identity, website presence, rating/reviews, and source warnings.
3. Use `Enrich selected lead` on one promising candidate. This enriches only the selected lead and replaces that card while the rest of the list stays as Fast candidates.
4. Export the lead pack once the lead has enough context for seller review.

Fast results are candidates, not final verdicts. Deep enrichment is per lead: it upgrades one selected candidate with extra modules without rerunning the full search. Website audit is only one enrichment module and is skipped cleanly when no website exists. A contactable, active, correctly located company can still be a useful B2B lead even when website opportunity is low.

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
- lead cards with filters for phone, org.nr, website, exact location, enrichment need, and Brreg issues
- lead sorting by best first, phone, confirmed org.nr, Google reviews, employees, and discovery confidence
- a Seller Command card with call readiness, best first contact, company fit, verification status, main risk, next action, and source confidence
- a compact Seller Desk V2 layer with company identity, contactability, market proof, and action/risk
- secondary qualification, verification, source intelligence, and raw source data collapsed below the decision layer
- per-lead Deep enrichment that updates only the selected company card
- evidence and caution
- export links

## Call-Ready Workflow V1

The demo now includes local seller workflow state for each lead. This is the first step toward a call-ready sales desk without adding telephony, email automation, auth, or a database.

For each lead, a seller can save:

- status
- contacted yes/no
- channel
- person reached
- response
- notes
- follow-up date
- next action
- outcome

Workflow state is stored locally in `.cache/lead-machine-demo/lead-workflow.json` and is appended to JSON/CSV downloads. It is manual tracking only: the app does not call, send email, schedule calendar events, or generate outreach wording.

Workflow queue controls now show a Today call queue, not-contacted leads, due follow-ups, interested leads, and contacted/not-contacted filters. The Today call queue prioritizes due follow-ups first, then new phone-ready leads, then interested leads. Phone numbers render as `tel:` links so a seller can click from the browser when their device supports it, but no call is placed by the app itself. Each workflow save appends a small local activity timeline, and exports include full call-list CSV views for all leads, today call queue, not-contacted leads, due follow-ups, and interested leads.

The lead detail and Today call queue also include one-click workflow actions for common manual outcomes: `Mark called`, `No answer`, `Interested`, `Not relevant`, `Follow up tomorrow`, and `Follow up next week`. These buttons only update local workflow state and the activity timeline. They do not call, send email, create calendar events, or automate outreach. This keeps the demo close to a call-ready sales desk while still avoiding CRM/telephony/email integration.

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
- Fast mode treats website URLs as unverified until Deep confirms they are real and relevant. If no website exists, Deep still refreshes identity/contactability and marks website audit as skipped.
- The Brreg panel shows confirmed org.nr only for strong matches. Uncertain results stay as candidate org.nr/manual verify with legal name, organization form, address, municipality, NACE, employees, status, match confidence, warnings, and candidate records when available.
- Economy/Proff status remains `not_enabled`.
- Run folders are local and ignored by git.

## Speed Notes

Live runs are slower than the fixture because each included lead can trigger:

1. Brreg official identity discovery
2. Google Places presence enrichment when an API key is available
3. selected-lead enrichment modules when requested
4. lead-pack generation
5. automatic Brreg company-profile lookup for non-Brreg-first candidates

Use `Fast scan` for broad automatic scans. The local demo uses an internal cap of 25 leads so the seller does not need to choose a technical max-results value. Use selected-lead `Deep enrich` when one candidate needs more context. Brreg runs by default for seller-ready identity context.

Repeated Brreg/company-profile lookups use the local `.cache/company-profile/` file cache. Successful non-error matches are reused across runs for speed; failed Brreg lookups are not cached, so a later run can retry.

## Deep Enrichment Roadmap

Deep is now the selected-lead intelligence layer, not just a website audit button. V1 attaches module statuses for identity, contactability, website audit, seller summary, and disabled future modules. The intended module stack is:

- website audit and technical/source evidence
- deeper Brreg verification and candidate handling
- Proff/economy enrichment after confirmed org.nr
- social/source signals such as Facebook, LinkedIn, news, and public links
- decision-maker hints from public firm/source data
- company size/fit and recent activity
- seller leverage summary based on evidence and caution

Lead Machine remains the source of truth. Planned modules should append context and warnings, not replace confirmed data or generate outreach scripts.
