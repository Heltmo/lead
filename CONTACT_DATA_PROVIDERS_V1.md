# Contact Data Providers V1

Lead Machine now has a contact data provider boundary, but no live contact provider is enabled.

## Purpose

Contact providers such as 1881, Eniro, Gule Sider, or another licensed directory can later improve contact confidence. They should provide evidence about phone, email, website, or address. They are not the legal source of truth.

Brreg remains the legal identity source. Proff is separate commercial and economy context, not a contact data provider.

## Contract

Provider results are normalized before Source Fusion sees them:

~~~json
{
  "provider": "mock_directory",
  "providerRecordId": "mock-matched-test-as",
  "status": "matched",
  "contactEvidence": {
    "phone": { "value": "22 00 00 00", "confidence": "good", "source": "mock_directory" },
    "email": null,
    "website": null,
    "address": { "value": "Osloveien 1, Oslo", "confidence": "good", "source": "mock_directory" }
  },
  "confidence": "good",
  "conflicts": [],
  "warnings": [],
  "rawAvailable": false
}
~~~

Supported statuses:

- matched: evidence can strengthen contactConfidence.
- weak_match: evidence is visible to Source Fusion as review risk.
- conflict: evidence creates a warning/conflict and can trigger verify_first.
- no_match: does not harm the lead.
- error: creates a provider warning only.

## Product Rules

Provider data is evidence, not truth.

It can strengthen or weaken contactConfidence, but it must not replace Brreg legal identity and must not silently overwrite Google, website, or manually captured contact data. Conflicts become warnings and queue guidance can move toward verify_first.

Raw provider payloads are not dumped into the UI. The normalized result marks rawAvailable: false.

No private-person enrichment is supported.

No scraping is included. A live provider requires legal/API terms review before implementation.

## Source Fusion

Source Fusion consumes normalized provider results when present. A matched phone or address can improve contact confidence. A weak match creates a review signal. A conflict creates warnings/conflicts. A no-match result does not reduce confidence.

This keeps future 1881/contact provider work pluggable without creating provider-specific logic throughout the seller desk.
