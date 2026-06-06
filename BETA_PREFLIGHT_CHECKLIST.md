# Beta Preflight Checklist

Use this before every controlled beta session.

## Environment

- Netlify beta URL is ready: https://YOUR-SITE.netlify.app/?beta=YOUR_TOKEN
- BETA_ACCESS_TOKEN is set before sharing the URL.
- GOOGLE_PLACES_API_KEY is set for live Google Places discovery.
- Proff is not required.
- 1881 is not required.
- SSB is not required.
- Hosted beta uses one shared beta workspace.
- Testers have read BETA_KNOWN_LIMITATIONS.md.
- Testers have access to BETA_FEEDBACK_FORM.md.

## Product Boundaries

- No email automation.
- No phone backend.
- No CRM sync.
- No sales scripts.
- No scraping.
- Hosted Verify & Enrich is a lightweight company/contact/source refresh.

## Smoke Tests

Run these before sharing the beta:

    cd /home/xman/webconsult
    ./verifications/verify-beta-preflight.sh
    npm run netlify:check
    ./verifications/verify-seller-work-queues.sh
    ./verifications/verify-source-fusion.sh
    ./verifications/verify-lead-machine-live-demo.sh
    ./verifications/verify-netlify-hosted-beta.sh

If any check fails, do not run the beta session until the failure is understood.

## Dogfood Path

Run this yourself before testers arrive:

1. Open the beta URL.
2. Search rørlegger i Sarpsborg.
3. Select what you sell in Hva selger du?.
4. Find 3 leads.
5. Move one lead to Ring nå.
6. Move one lead to Må verifiseres.
7. Log No answer.
8. Set follow-up tomorrow.
9. Mark one lead Ikke relevant.
10. Refresh the page.
11. Confirm notes, queue, outcome, and follow-up are still correct.
12. Export or copy test data.

## Reset And Recovery

There is no dangerous reset button in the seller UI.

Before testing:

- Export the workspace snapshot.
- Write down the beta URL, token, tester names, and search terms.

If local test data becomes messy:

1. Stop the local server.
2. Export any useful snapshot first if possible.
3. Move or remove .cache/lead-machine-demo/workspace.sqlite.
4. Restart the local server and rerun smoke tests.

If hosted beta state becomes messy:

1. Export the workspace snapshot from the app.
2. Treat the shared workspace as test data only.
3. Use a fresh Netlify deploy/site or clear the Netlify Blob store from Netlify tooling only after saving the snapshot.

## Breakage Contact

If the beta breaks, capture:

- browser/device
- beta URL without the token
- search term
- seller intent
- exact action before the break
- screenshot or error text
- workspace export if available

Then stop the test instead of explaining around the bug.
