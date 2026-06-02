# Netlify Hosted Friend Beta

This is the hosted path for two invited colleagues to try the Lead Machine seller desk from a browser.

## What Works

- Netlify serves the app from `apps/lead-machine-demo/public`.
- `/api/*` routes go through `netlify/functions/api.js`.
- `Call now` uses normal `tel:` links on the tester device. The app does not place calls itself.
- Notes, follow-ups, saved-search labels, and beta workspace export persist through Netlify Blobs when deployed on Netlify.
- Hosted beta uses the bundled/latest lead run for calling and note testing. It does not run old browser-audit tooling or selected-lead enrichment on Netlify yet.
- If Netlify Blobs is not available in local function tests, the function falls back to `/tmp` JSON.

## Required Netlify Environment Variables

Set these in Netlify before sharing the URL:

- `BETA_ACCESS_TOKEN`: required API gate for invited testers.
- `GOOGLE_PLACES_API_KEY`: required for live Google Places searches.
- `PROFF_API_KEY`: optional only; not required for beta calling workflow.

Netlify Functions read runtime environment variables from the Netlify environment, not from `netlify.toml`.

## Share URL

Send colleagues a URL like:

`https://YOUR-SITE.netlify.app/?beta=YOUR_TOKEN`

The app stores that token in browser localStorage and sends it with API requests. If the token is missing or wrong, API calls return `401`.

## Limits

- One shared beta workspace, not per-user login.
- Do not put this behind a public sales site yet.
- No email sending, CRM sync, telephony backend, or outreach automation.
- Exports are for beta backup/debugging only.

## Deploy Check

Run locally before deploy:

```bash
npm run netlify:check
./verifications/verify-netlify-hosted-beta.sh
```
