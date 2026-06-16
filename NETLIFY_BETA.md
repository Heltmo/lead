# Netlify Hosted Beta

This is the hosted path for two invited colleagues to try the Lead Machine seller desk from a browser.

## What Works

- Netlify serves the app from `apps/lead-machine-demo/public`.
- `/api/*` routes go through `netlify/functions/api.js`.
- `Call now` uses normal `tel:` links on the tester device. The app does not place calls itself.
- Notes, follow-ups, saved-search labels, and beta workspace export persist through Netlify Blobs when deployed on Netlify.
- Hosted beta runs live capped Google/Brreg searches from the Netlify Function when `GOOGLE_PLACES_API_KEY` is set. Focused searches are capped at 25 leads. Searches without a parsed place use Norway Sweep V1 automatically, capped at 60 leads across prioritized city queries. It stores the latest run in the shared beta workspace for calling, notes, follow-ups and export. Selected-lead enrichment is available on Netlify for a focused Brreg retry and context refresh. It does not run old browser-audit tooling.
- If Netlify Blobs is not available in local function tests, the function falls back to `/tmp` JSON.

## Required Netlify Environment Variables

Set these in Netlify before sharing the URL:

- `BETA_ACCESS_TOKEN`: required API gate for invited testers.
- `GOOGLE_PLACES_API_KEY`: required for live Google Places searches.
- `PROFF_API_KEY`: optional only; not required for beta calling workflow.
- `LEAD_MACHINE_OPENAI_API_KEY`: optional for manual AI nettsidesjekk and salgsvinkler. It uses GPT-5.5 through the OpenAI Responses API, with web search only when the seller explicitly asks for angles, and never runs in bulk.

Netlify Functions read runtime environment variables from the Netlify environment, not from `netlify.toml`.

## Share URL

Send colleagues a URL like:

`https://YOUR-SITE.netlify.app/?beta=YOUR_TOKEN`

The app stores that token in browser localStorage and sends it with API requests. If the token is missing or wrong, API calls return `401`.

## Limits

- One shared beta workspace, not per-user login.
- Do not put this behind a public sales site yet.
- No email sending, CRM sync, telephony backend, outreach automation, or unbounded market scraping.
- Exports are for beta backup/debugging only.

## Workspace Export And Recovery

Read [BETA_WORKSPACE_ADMIN.md](BETA_WORKSPACE_ADMIN.md) before clearing or replacing hosted beta state.

- `/api/workspace-export` is the source-of-truth snapshot before any reset.
- Hosted beta uses one shared beta workspace for invited testers, so clearing state affects everyone in the beta session.
- Netlify deploys persist through the `lead-machine-beta` Netlify Blobs store when available.
- Local Netlify Function tests without Netlify Blobs fall back to `/tmp/lead-machine-netlify-beta/hosted-state.json`.
- Clear Netlify Blobs or use a fresh Netlify deploy/site only after the workspace export has been saved outside Netlify.
- There is no seller-facing reset button; do not add a one-click destructive reset/delete control to the normal seller workflow.

## Deploy Check

Run locally before deploy:

```bash
npm run netlify:check
./verifications/verify-netlify-hosted-beta.sh
```
