# Operating Guide

## Product Direction

Lead Machine is a seller desk. The main loop is:

1. Seller chooses what they sell.
2. Seller searches a market.
3. Lead Machine finds local businesses and verifies identity/contact context.
4. Seller calls from the browser using normal `tel:` links.
5. Seller logs notes, outcomes, and follow-up dates.
6. Seller exports call lists or backup data.

## Local App

```bash
cd /home/xman/webconsult/apps/lead-machine-demo
npm run dev
```

Open `http://127.0.0.1:8787`.

## Hosted Friend Beta

```bash
cd /home/xman/webconsult
npm run netlify:check
./verifications/verify-friend-beta-readiness.sh
./verifications/verify-netlify-hosted-beta.sh
```

Netlify environment variables:

- `BETA_ACCESS_TOKEN`: required for invited testers.
- `GOOGLE_PLACES_API_KEY`: required for live Google Places discovery.
- `PROFF_API_KEY`: optional economy context only.

## Product Guardrails

- No generated pitch scripts.
- No email sending.
- No automatic calls.
- No CRM sync yet.
- No private-person profiling or login-gated scraping.
- No old browser-audit/demo/campaign tooling in the main path.

## Useful Checks

```bash
node --check apps/lead-machine-demo/server.js
node --check apps/lead-machine-demo/public/app.js
node --check netlify/functions/api.js
node core/lead-machine/tests/smoke.test.js
node apps/lead-machine-demo/tests/smoke.test.js
npm run netlify:check
```
