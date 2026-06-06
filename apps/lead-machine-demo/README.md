# Lead Machine Local Seller Desk

Local interactive seller-desk prototype for the Webconsult Lead Machine.

## Purpose

This app lets a seller type a query like:

```text
Kristiansand rørlegger
```

and run the existing Lead Machine flow from a browser.

It is not a full SaaS app yet. It has no auth, hosted database, CRM integration, billing, email connection, or telephony backend. It keeps recent searches, workflow state, notes, and activity history in a local SQLite workspace so the seller can continue work after reloads.

## Beta Preflight

Before giving the product to friends, run:

```bash
cd /home/xman/webconsult
./verifications/verify-beta-preflight.sh
```

Use [BETA_PREFLIGHT_CHECKLIST.md](../../BETA_PREFLIGHT_CHECKLIST.md) before sessions and [BETA_TEST_SCRIPT_INTERNAL.md](../../BETA_TEST_SCRIPT_INTERNAL.md) for the internal test path. The local app has no auth, so do not expose it on the open internet.
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

Proff is not required for beta testing. Leave `PROFF_API_KEY` unset unless you are explicitly testing optional economy context.


Open:

```text
http://127.0.0.1:8787
```

## Search UX

The seller desk supports structured search:

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

## Fast Scan vs Verify & Enrich

- `Fast scan` is the default for daily use. It runs broad discovery, location quality, Brreg identity enrichment, Google Places presence, and basic contact context without a full digital presence check.
- `Verify & Enrich` upgrades one selected lead with enrichment modules. V1 refreshes Brreg/company identity, contactability, seller fit summary, digital presence status when a website exists, optional Proff/economy when a confirmed org.nr exists, and OSINT-lite public evidence from already collected business data. It does not run browser audits or contact-page scraping.
- Use Fast scan for 10-25 candidate scans, then enrich only the leads where extra context is worth the wait.

Recommended workflow:

1. Run `Fast scan` to scan a market quickly.
2. Review phone, location, Brreg identity, website presence, rating/reviews, and source warnings.
3. Use `Verify & Enrich` on one promising candidate. This enriches only the selected lead and replaces that card while the rest of the list stays as Fast candidates.
4. Export the lead pack once the lead has enough context for seller review.

Fast results are candidates, not final verdicts. Verify & Enrich is per lead: it upgrades one selected candidate with extra modules without rerunning the full search. Digital presence check is only one enrichment module and is skipped cleanly when no website exists. A contactable, active, correctly located company can still be a useful B2B lead even when digital presence is not the main opportunity.

## What It Does

By default, the app uses Balanced discovery: Brreg official identity first, plus Google Places public presence when available. Brreg company identity is enabled automatically. A hidden fixture provider exists only for deterministic tests; it is not exposed as the seller workflow.

The browser sends the query to a local Node server. For live providers, the server calls the existing `core/lead-machine` module directly and returns:

- run summary
- lead packs
- CSV download path
- JSON download path
- output folder path

On startup, the app attempts to restore the latest local run from `apps/lead-machine-demo/runs/`, so the desk opens with the last visible lead list instead of an empty screen when previous run data exists.

The frontend displays:

- query/run status
- summary counts
- lead cards with filters for phone, org.nr, website, exact location, enrichment need, and Brreg issues
- lead sorting by best first, phone, confirmed org.nr, Google reviews, employees, and discovery confidence
- a neutral Call Brief card with best first contact, company fit, verification status, main risk, next action, and source confidence
- a compact Seller Desk V2 layer with company identity, contactability, market proof, and action/risk
- secondary qualification, verification, source intelligence, and raw source data collapsed below the decision layer
- per-lead Verify & Enrich that updates only the selected company card
- evidence and caution
- export links

## OSINT Public Evidence V1

Selected-lead Verify & Enrich now attaches an OSINT public evidence snapshot. V1 does not run broad scraping across every search result; it normalizes public business evidence already available from Brreg/company identity, Google Places, digital presence checks, ranking evidence, and source-quality fields for the one lead the seller chose to enrich.

The lead detail shows OSINT as evidence groups: company identity, contactability, digital presence, market proof, recent activity, and risk / verify. Each signal carries source context, timestamp, confidence, and either a source URL or a reason the source URL is unavailable. CSV exports include summary counts and top signal/risk fields, while JSON keeps the structured OSINT object.

OSINT is decision support only. It does not generate prepared phone pitches, outreach copy, email sending, calling, private-person dossiers, login-gated scraping, or CAPTCHA/paywall bypassing.

## Product Readiness Without Proff

The demo is designed to be useful before buying Proff. Brreg remains the free identity base, Google/public presence is capped by the 25-lead run limit, OSINT runs on selected-lead enrichment, and Proff stays an optional economy provider rather than a core dependency.

The main seller screen no longer shows a technical readiness panel. Readiness details stay in the run payload and `/api/health` for verification, while the UI shows only seller-facing continuity: saved markets, notes/follow-ups, and a `Download test data` backup button.

This is local continuity, not SaaS saved searches. It stores data in `.cache/lead-machine-demo/workspace.sqlite`, imports older JSON state when present, and does not add auth, shared workspaces, CRM sync, email sending, telephony, or outreach automation. V1 intentionally does not include a clear/delete action.

## Saved Search Management V1

Saved searches now behave like a small local market list. The `Saved markets` panel shows saved searches from the workspace, with lead count, phone-ready count, seller intent, geography scope, and actions to `Pin`, `Rename`, or `Rerun`. Pinned searches sort first, then newest searches. Labels and pinned state are stored in the local SQLite workspace. There is still no delete/clear action in V1.

## Call-Ready Workflow V1

The demo now includes local seller workflow state for each lead. This is the first step toward a call-ready sales desk without adding telephony, email automation, auth, or an external database.

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

Workflow state is stored locally in `.cache/lead-machine-demo/workspace.sqlite` and is appended to JSON/CSV downloads. Existing `.cache/lead-machine-demo/lead-workflow.json` state is imported when a workspace is created. It is manual tracking only: the app does not call, send email, schedule calendar events, or generate outreach wording.

The left rail now shows one `Current call` at a time instead of a dense board of many action rows. Sort/filter controls and queue presets live behind a collapsed `Filter / sort lead list` control so the seller can focus on the active call first. Queue presets for Call now, Needs verification, Follow-ups, and Interested leads still work with not-contacted, due follow-up, interested, and contacted/not-contacted filters. The default list sort is Call queue first. It prioritizes due follow-ups, interested leads, new phone-ready leads, seller fit, recommended action, exact-location leads, and useful org.nr context before lower-action items. A separate Seller fit first sort is available when the seller wants to inspect pure fit ranking. Phone numbers render as `tel:` links so a seller can click from the browser when their device supports it, but no call is placed by the app itself. Each lead card also shows a short `Next:` queue action so the seller can scan the list without opening every card. Each workflow save appends a small local activity timeline, and exports include full call-list CSV views for all leads, today call queue, not-contacted leads, due follow-ups, and interested leads.

The lead detail and Current call panel include workflow actions for common manual outcomes: `Mark called`, `No answer`, `Interested`, `Not relevant`, `Follow up tomorrow`, and `Follow up next week`. In the lead detail form, these buttons only prepare a draft; the seller must click `Save note` before an activity log entry is created. In the Current call panel, follow-up shortcuts appear as compact `Tomorrow` and `Next week` actions and act as one-click queue actions for the active call. Follow-up rows are labelled as overdue, due today, or future follow-up so the seller knows what must be handled first. These buttons update local workflow state and the activity timeline without writing system-generated text into the seller note field. They do not call, send email, create calendar events, or automate outreach. Current-call actions advance the selected lead toward the next call-ready item after saving, and `Inspect`/lead-card selection scrolls the lead detail into view. This keeps the demo close to a call-ready sales desk while still avoiding CRM/telephony/email integration.

## Call Desk Polish V1

The call desk now makes call readiness the primary daily signal. Lead cards, the current-call panel, and the selected lead detail use the same readiness model: Ready to call, Verify first, Needs contact, Follow-up due, Later, or Skip.

The selected lead view includes a compact call focus strip for call readiness, best contact, next action, and last logged activity. Activity history shows up to eight recent entries so the seller can understand what happened without opening raw data. Recent searches show lead counts and phone-ready counts, and each saved search can be rerun directly.

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

No prepared pitch text, email templates, or automated outreach are included. The Call Brief card is a decision brief, not a script.

## Limitations

- Uses local server only.
- Balanced runs can return Brreg identity rows without a Google key, but Google Places presence enrichment requires `GOOGLE_PLACES_API_KEY`.
- Brreg firmaprofil uses `core/company-profile` automatically to enrich org.nr/legal identity conservatively because company identity is core seller context.
- Fast mode treats website URLs as unverified until Verify & Enrich confirms they are real and relevant. If no website exists, Deep still refreshes identity/contactability and marks digital presence check as skipped.
- The Brreg panel shows confirmed org.nr only for strong matches. Uncertain results stay as candidate org.nr/manual verify with legal name, organization form, address, municipality, NACE, employees, status, match confidence, warnings, and candidate records when available.
- Economy/Proff is optional. It remains `disabled` until `PROFF_API_KEY` exists, runs only for confirmed org.nr, and does not affect lead scoring.
- Run folders are local and ignored by git.

## Speed Notes

Live runs are slower than the fixture because each included lead can trigger:

1. Brreg official identity discovery
2. Google Places presence enrichment when an API key is available
3. selected-lead enrichment modules when requested
4. lead-pack generation
5. automatic Brreg company-profile lookup for non-Brreg-first candidates

Searches now run as Fast scan by default from the top search bar. The seller should not choose a global Fast/Deep mode before searching; selected-lead enrichment is available on the lead card when one company needs more context. Focused searches use an internal cap of 25 leads so the seller does not need to choose a technical max-results value. Searches without a parsed place automatically use Norway Sweep V1: capped at 60 leads across prioritized Norwegian city queries, grouped by city. Brreg runs by default for seller-ready identity context.

Repeated Brreg/company-profile lookups use the local `.cache/company-profile/` file cache. Successful non-error matches are reused across runs for speed; failed Brreg lookups are not cached, so a later run can retry.

## Verify & Enrich Roadmap

Verify & Enrich is now the selected-lead intelligence layer, not just a digital check button. V1 attaches module statuses for identity, contactability, digital presence, seller summary, and disabled future modules. The intended module stack is:

- digital presence status and source evidence
- deeper Brreg verification and candidate handling
- Proff/economy enrichment after confirmed org.nr
- optional source links after the workflow is stable
- company size/fit and recent activity after the workflow is stable
- seller fit summary based on evidence and caution

Lead Machine remains the source of truth. Planned modules should append context and warnings, not replace confirmed data or generate outreach scripts.


## Seller Intent / Seller Fit

The demo includes a `Hva selger du?` selector. It lets the seller choose a context such as General B2B, Web/IT, Ads/marketing, Telecom, Accounting, Insurance, Finance, Recruiting, or Other.

The selector does not change source truth from Google Places, Brreg, Proff, or website data. It changes how the lead is interpreted: phone, org.nr, employees, location, Google proof, digital presence, and risk are weighted differently depending on what the seller sells.

Seller-fit fields are added to the lead JSON/CSV exports.


## Source Fusion V1 / Proof & Confidence

The demo now attaches `sourceFusion` to each returned lead after seller-fit and workflow state. Source Fusion separates identity confidence, contact confidence, location confidence, and seller fit, then returns a seller-facing trust action: `call`, `review`, `verify_first`, or `skip`. The UI shows this as `Proof & confidence` with human labels such as Trygg å ringe, Bør vurderes, Verifiser først, and Svak/usikker.

CSV exports include lead confidence, identity confidence, contact confidence, location confidence, recommended trust action, source coverage, verified fields, proof reasons, risk reasons, and source-fusion warnings. V1 uses existing Google Places, Brreg, contact/profile, seller-fit, and workflow context only. It does not add 1881, Proff, Gule Sider/Eniro, SSB, scraping, call scripts, email sending, or outreach automation.

See ../../SOURCE_FUSION_V1.md for Source Fusion rules and future provider boundaries.

## Seller Work Queues V1

The seller desk now separates saved markets from daily work queues. Queue tabs show Ring nå, Ingen svar, Oppfølging i dag, Interessert, Må verifiseres, Ikke relevant, and Arkiv.

Workflow outcomes move leads automatically: no answer goes to Ingen svar, due follow-ups go to Oppfølging i dag, interested leads go to Interessert, rejected leads go to Ikke relevant, and archive hides leads from active queues. The note form also has a manual queue selector for seller override.

See ../../SELLER_WORK_QUEUES_V1.md for queue definitions, workflow rules, and export fields.
