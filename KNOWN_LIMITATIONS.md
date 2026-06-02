# Known Limitations

## Product

- No real login yet.
- Hosted beta is one shared tester workspace.
- Netlify beta currently serves bundled/latest lead data for safe calling tests; live hosted search still needs a backend path before broader use.
- No CRM sync, calendar sync, email sending, or telephony backend.
- `tel:` links rely on the tester device/browser.
- Saved markets and notes are beta workflow state, not a full multi-user database.

## Data

- Google Places requires `GOOGLE_PLACES_API_KEY`.
- Brreg identity matching is conservative; uncertain matches stay manual-verify.
- Proff is optional and never required for core lead quality.
- OSINT-lite uses already collected public business evidence for one selected lead; it is not broad scraping.

## Workflow

- Sellers still own wording, qualification, relationship, and close.
- The app does not generate pitch scripts or ready-to-send messages.
- Follow-up workflow is manual tracking until email/calendar integrations are intentionally added.
