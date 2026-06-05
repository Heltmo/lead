# Beta Known Limitations

Share this with beta testers before the session.

## Workspace

- Hosted beta uses a shared beta workspace unless you are given a separate workspace.
- There are no real user accounts yet.
- Notes, outcomes, queues, and follow-ups are beta workflow state.
- Do not use the beta as the only record of important customer work.

## Data Providers

- Google Places and Brreg are the main live data foundations.
- 1881 is not connected.
- Proff is not connected.
- SSB is not connected.
- Contact provider readiness exists in code, but only with mock provider tests.
- Brreg matching is conservative and can produce candidate or manual-verify leads.
- Google Places and Brreg coverage can be incomplete or inconsistent.

## Enrichment

- Hosted Verify & Enrich is lightweight.
- Hosted Verify & Enrich refreshes company/contact/source context.
- Hosted Verify & Enrich does not run full local browser audit, local OSINT, Proff, or 1881.
- Website and digital signals are secondary proof, not the whole lead score.

## Workflow

- No private CRM sync is enabled.
- No email sending is enabled.
- No phone backend is enabled.
- `tel:` links depend on the tester device and browser.
- No automatic outreach is enabled.
- Sellers still own qualification, wording, and follow-up judgment.

## Expected Beta Issues

- Some leads may have missing phone numbers.
- Some leads may have uncertain organization numbers.
- Some leads may be outside the intended category.
- Some leads may need manual verification before calling.
- Shared workspace state can make it hard to separate two testers unless they write their tester name in notes.
