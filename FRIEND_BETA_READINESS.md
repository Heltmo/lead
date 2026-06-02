# Friend Beta Readiness

Use this checklist before giving Lead Machine to two friends for hands-on testing.

## Best Beta Setup

Run it as a local seller desk on your machine first:

```bash
cd /home/xman/webconsult
./verifications/verify-friend-beta-readiness.sh
cd apps/lead-machine-demo
npm run dev
```

Open:

```text
http://127.0.0.1:8787
```

Health check:

```text
http://127.0.0.1:8787/api/health
```

## Access Boundary

- The local app has no auth yet.
- Do not expose the local server on the open internet.
- Hosted Netlify beta requires `BETA_ACCESS_TOKEN` and a shared URL with `?beta=TOKEN`.
- Treat all workspace data as beta test data.
- Export a workspace snapshot before and after friend testing.

## Hosted Netlify Setup

Use [NETLIFY_BETA.md](NETLIFY_BETA.md) when colleagues need browser access without your local machine. Before sharing, set these Netlify environment variables:

- `BETA_ACCESS_TOKEN`
- `GOOGLE_PLACES_API_KEY`

Share only this style of URL:

`https://YOUR-SITE.netlify.app/?beta=YOUR_TOKEN`

## API Keys

Google Places is useful for live local leads. Locally, put the key in `/home/xman/webconsult/.env` or `apps/lead-machine-demo/.env`:

```bash
GOOGLE_PLACES_API_KEY=your-key-here
```

Proff is not required for this beta. Keep it disabled unless you are specifically testing economy enrichment.

## What To Ask Friends To Test

Give each friend 20 to 30 minutes and ask them to do this:

1. Choose what they sell in `Hva selger du?`.
2. Run two searches, for example `rørlegger i Kristiansand`, `advokat i Oslo`, `frisør Tromsø`, or their own market.
3. Pick the first lead they would actually call.
4. Log one outcome: no answer, interested, not relevant, or follow up tomorrow.
5. Rename or pin one saved search.
6. Export the workspace snapshot.
7. Tell you what was confusing, what felt useful, and what would stop them from using it daily.

## What Not To Promise

- No login yet.
- No shared teams yet.
- No email connection yet.
- No CRM sync yet.
- No auto-calling or email sending.
- No generated sales scripts.
- Lead rankings are beta and need seller feedback.

## Feedback Questions

Ask these after the session:

- Did the top lead look like someone worth calling?
- Was the call queue clear?
- Were notes and follow-ups easy enough?
- Did the company/contact verification make sense?
- What information was missing before calling?
- Would this help you tomorrow morning? If not, why?

## Final Preflight

Run this immediately before a friend session:

```bash
cd /home/xman/webconsult
./verifications/verify-friend-beta-readiness.sh
```

If it fails, do not use the beta until the failure is understood.
