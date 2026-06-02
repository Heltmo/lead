# Discovery V2 Goals

## Purpose

Make discovery good enough to beat manual Google Places + Proff/1881 research for a seller.

The product must find the right local businesses, preserve useful contact/source data, explain confidence, and avoid silently mixing wrong-location leads into a search.

## Product Rule

Fast mode finds candidates. Deep mode qualifies leads.

Discovery must therefore support two valid outputs:

- audit-ready website leads for Deep mode
- contactable local business candidates for Fast mode, even when no website is available

A business without a website can still be valuable in Fast mode if it has Google Places identity, phone, address, rating/reviews, or placeId.

## Current V2 Priorities

1. Keep Google Places as the primary local discovery source.
2. Preserve phone-only / no-website Google Places businesses for Fast mode.
3. Keep Deep audit handoff website-only and safe.
4. Add discovery quality score and warnings per candidate.
5. Add discovery coverage counts to summaries.
6. Improve dedupe beyond domain: placeId, phone+city, name+address.
7. Keep location quality strict: no silent wrong-city leads.

## Discovery Quality Signals

Per candidate:

- website available
- phone available
- address available
- placeId available
- rating/reviews available
- businessStatus operational
- exact location match
- fallback or out-of-area warnings
- audit eligibility

Summaries should expose:

- total candidates
- withWebsite
- withoutWebsite
- withPhone
- withAddress
- withPlaceId
- withRating
- withReviews
- exactLocation
- regionalFallback
- outOfArea
- auditEligible
- fastEligible

## Source Of Truth

Lead Machine owns discovery truth:

- Google Places data
- location quality
- lead-machine inclusion readiness
- Brreg/company profile later
- lead pack schema

Hermes or any future agent may refine notes later, but must not replace discovery truth.

## Next Steps

After this pass:

1. Add richer Brreg visibility in lead cards.
2. Add Google Place Details enrichment if fields from Text Search are insufficient.
3. Add source/social links as evidence, not outreach automation.
4. Add Proff only after org.nr is confirmed.
