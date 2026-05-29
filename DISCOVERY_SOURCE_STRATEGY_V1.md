# DISCOVERY_SOURCE_STRATEGY_V1

## Purpose

Lead Machine must beat manual Google Places + Proff/1881 research by separating official identity from public presence.

The product should not only ask Google for businesses. It should build a local company universe, attach public presence, then package seller-ready lead packs.

## Source Roles

- Brreg / Enhetsregisteret: official identity source. Provides organization number, legal name, organization form, registered address, municipality, NACE, employees, registration date, active status and source URL.
- Google Places: public presence source. Provides place ID, phone, address, website, rating, reviews, business status and local market proof.
- Website audit: qualification source. Verifies website relevance, contactability, technical trust and evidence.
- Proff: later commercial/economy enrichment. It should only run when org.nr is confirmed.

## Discovery Modes

### Google Places

Presence-first. Good for visible local businesses, phone numbers, ratings and websites. Weakness: may miss legal identity or return brands/branches that do not map cleanly to official entities.

### Brreg

Identity-first. Good for official local company lists by NACE and municipality. Weakness: may include companies without websites, inactive-looking market presence, or entities that are not sales-reachable.

### Balanced

Default product direction. Runs Brreg and Google Places, merges candidates, and preserves provenance:

- `identitySource = brreg`
- `presenceSource = google-places` when a Google presence is attached
- `organizationNumber` is a confirmed identity key when the row comes from Brreg
- `placeId`, rating and reviews remain presence signals

## Dedupe Rules

Use multiple identity keys instead of one loose name match:

1. confirmed org.nr
2. candidate org.nr
3. website domain
4. Google place ID
5. phone + city
6. business name + address

Wrong org.nr is worse than no org.nr. If Brreg and Google cannot be safely merged, keep candidates separate or mark verification clearly in the lead pack.

## Seller Value

A seller should see:

- who the legal company is
- whether org.nr is confirmed or candidate-only
- whether there is a real public presence
- how contactable the business is
- what source each fact came from
- what needs verification before export or outreach

## Current V1 Status

- `brreg` provider exists for official registry discovery.
- `balanced` provider exists for Brreg + Google Places discovery.
- Lead candidates preserve Brreg identity fields.
- Lead packs expose source strategy through company profile and source quality.
- Proff remains disabled until org.nr is confirmed and product rules are ready.

## Next Improvements

- Broader municipality code coverage.
- Better NACE maps per vertical.
- Stronger Brreg/Google merge scoring for branch and franchise cases.
- Optional Proff enrichment only for confirmed org.nr.
- UI controls for source mode if needed, while keeping Balanced as default.
