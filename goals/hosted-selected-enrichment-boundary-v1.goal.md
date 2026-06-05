# Hosted Selected Enrichment Boundary V1

## Objective

Make hosted selected-lead enrichment clear and honest: it is a focused Brreg/company-context retry, not the full local Deep/OSINT pipeline.

## Problem

Netlify hosted beta now supports `/api/deep-qualify`, but the hosted version does less than local selected-lead enrichment:

- focused Brreg/company profile retry
- contactability refresh
- seller/source confidence refresh
- no browser audit
- no full local OSINT-lite module unless explicitly added later

The product language should match that boundary.

## Scope

- Review hosted `/api/deep-qualify` response shape.
- Make UI labels distinguish hosted context refresh from local full enrichment if needed.
- Add hosted verifier assertions for the boundary.
- Keep selected-lead enrichment useful without overclaiming.

## Boundaries

Do not add broad scraping, browser audits in Netlify functions, private-person enrichment, auto outreach, email sending, calling, CRM sync, or new paid-provider dependency.

## Success Criteria

- Hosted enrichment clearly reports `selected_lead_enrichment` / hosted context refresh.
- Brreg retry result is visible when it improves company identity.
- Failed Brreg retry does not erase existing good identity data.
- UI copy does not imply full OSINT/browser audit on Netlify.
- Netlify hosted beta verifier passes.
