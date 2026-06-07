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

## Development Agent Loop

Use `HERMES_CODEX_LOOP.md` when delegating development work through Hermes and Codex.

The default development loop is:

```text
Hermes shapes a small ticket
-> Codex implements the ticket
-> checks run
-> Hermes reviews the diff and evidence
-> Codex fixes targeted failures
```

Keep this as a development workflow. Do not turn it into broad in-product automation before the seller desk foundation is stable.

## Goal Chain

The ordered implementation path lives in `goals/README.md`. Start Hermes from `/home/xman/webconsult` with `HERMES_START_HERE.md` so `AGENTS.md` and project context are loaded automatically.

## Hosted Beta

```bash
cd /home/xman/webconsult
npm run netlify:check
./verifications/verify-beta-preflight.sh
./verifications/verify-netlify-hosted-beta.sh
```

Read `BETA_PREFLIGHT_CHECKLIST.md` before every controlled session and `BETA_WORKSPACE_ADMIN.md` before any local or hosted workspace reset. `/api/workspace-export` is the source-of-truth snapshot before reset/recovery work.

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
