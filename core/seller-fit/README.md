# Seller Fit

`core/seller-fit/` interprets existing lead data through the seller's context.

It does not discover companies, change Brreg truth, call Proff, send outreach, or create scripts. It only turns existing signals into a seller-facing fit summary:

- `sellerFit`: `strong`, `good`, `review`, or `weak`
- `fitReasons`
- `riskReasons`
- `importantSignals`
- `recommendedAction`

## Seller intents

V1 supports:

- `general_b2b`
- `web_it`
- `ads_marketing`
- `telecom`
- `accounting`
- `insurance`
- `finance`
- `recruiting`
- `other`

The intent changes which signals are most important. Raw lead data remains unchanged.

## Boundary

The machine provides discovery, company/contact data, enrichment, ranking, evidence, caution, workflow structure, and fit interpretation.

The seller owns angle, wording, outreach, timing, relationship, and close.
