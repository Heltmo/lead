# Seller Intent Onboarding V1

## Objective

Make the seller setup sharper before each search: what the seller sells, where they sell, what makes a good customer, and what should be disqualified.

This should improve lead ranking and seller confidence without adding scripts or outreach automation.

## V1 Build

- Turn seller intent into a clearer setup step before or beside search.
- Capture geography, ideal customer hints, and disqualifiers in structured fields where possible.
- Feed the structured intent into existing seller-fit and lead ranking behavior.
- Keep wording seller-facing and practical, not technical.

## Boundaries

Do not add pitch generation, email templates, automatic outreach, CRM sync, auth, billing, Proff dependency, SSB, or broad scraping.

## Success Criteria

- A seller can understand and adjust intent before running a search.
- Lead cards and queue guidance reflect the selected seller intent.
- Vertical-specific wording does not leak across seller types.
- Existing seller-fit, lead-machine, frontend, and Netlify checks pass.

## Status 2026-06-10

The category picker (Hva selger du?) is removed from the UI: the MVP is website sales only, and every search runs as web_it. Geography, good-customer hints and disqualifiers remain in the collapsed seller setup. Core seller-fit keeps multi-intent support; reintroduce categories only when each category gets a real interpretive advantage, not just a label.
