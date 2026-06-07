# Contact Provider Live Gate V1

## Objective

Decide whether and how Lead Machine can use a licensed contact-data provider before any live provider lookup is added.

The current provider-ready architecture should remain mock/testable until legal, pricing, caching, and export rules are clear.

## V1 Build

- Evaluate provider terms for SaaS, B2B contact verification, caching, display, export, and rate limits.
- Choose one of: no live provider yet, selected-lead lookup only, or capped market lookup later.
- Document the provider decision and environment-variable boundary.
- Keep Brreg as legal identity truth and Source Fusion as the decision layer.

## Boundaries

Do not scrape directory pages. Do not add private-person enrichment, employee dossiers, auto outreach, email sending, telephony, CRM sync, or raw provider payloads in the UI.

## Success Criteria

- Provider/legal decision is documented before implementation.
- If live lookup is allowed, selected-lead lookup is the first implementation path.
- Existing mock provider and Source Fusion tests continue to pass.
