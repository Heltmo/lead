# Contact Data Provider Readiness V1

## Objective

Prepare Lead Machine for a licensed contact-data provider such as 1881 without making the current product depend on that provider.

The goal is to improve contact confidence later while keeping Brreg as legal identity truth, Google Places as local presence proof, and Source Fusion as the decision layer.

## Product Position

Provider roles should stay separate:

```text
Brreg = legal identity
Google Places = local presence, address, rating, reviews
Contact data provider = phone/address/contact verification
Proff = economy/commercial context later, only after confirmed org.nr
Source Fusion = combines proof and confidence for seller decisions
```

1881 or a similar provider should improve `contactConfidence`. It should not replace Lead Machine ranking, Brreg identity matching, seller workflow, or Source Fusion.

## V1 Build

Add a provider-ready module without live paid-provider dependency:

```text
core/contact-data/
```

V1 should include:

- provider interface
- mock provider for deterministic tests
- normalizer for contact matches
- contact confidence summary
- Source Fusion integration point
- clear eligibility rules for when provider lookup is allowed

Suggested normalized output shape:

```json
{
  "provider": "mock_directory",
  "providerRecordId": "mock-matched-example-as",
  "status": "matched",
  "contactEvidence": {
    "phone": { "value": "40000000", "confidence": "good", "source": "mock_directory" },
    "email": null,
    "website": null,
    "address": { "value": "Example gate 1, Bergen", "confidence": "good", "source": "mock_directory" }
  },
  "confidence": "good",
  "conflicts": [],
  "warnings": [],
  "rawAvailable": false
}
```

## Source Fusion Integration

Contact provider data should affect Source Fusion only through explicit fields:

- `contactConfidence`
- `sourceCoverage`
- `verifiedFields`
- `proofReasons`
- `riskReasons`
- `warnings`

Examples:

- provider confirms phone and city -> raise contact confidence
- provider finds phone missing from Google -> mark phone as provider-sourced
- provider address conflicts with Brreg/Google -> add source conflict, do not silently overwrite
- provider match is weak -> keep lead in `verify_first`

Raw provider data should not be dumped into the UI. The seller should see proof, confidence, and warnings.

## 1881 Readiness Questions

Before live 1881 integration, confirm:

- SaaS use is allowed.
- B2B lead discovery/contact verification is allowed.
- Usage can be limited to companies, not private-person leads.
- Data can be shown to invited workspace users.
- Cached data rules are clear.
- Export rules are clear.
- Rate limits and pricing are acceptable.
- Terms allow using provider data inside a source-confidence workflow.

Do not scrape directory web pages. Use only a licensed API or a different compliant provider after terms review.

## V1 Boundaries

Do not add:

- live 1881 dependency
- scraping
- private-person enrichment
- employee/person dossiers
- auto-outreach
- email sending
- telephony
- CRM sync
- Proff dependency
- broad background workers
- provider data as the sole source of truth

V1 should make the architecture ready and testable with mock data only.

## UI Goals

If mock contact-provider data is attached, the seller desk may show it under existing proof surfaces:

- Contact
- Proof & confidence
- Proof & checks
- Risk / verify

Avoid a new raw provider panel unless there is a seller-facing decision need. The user should see:

- phone confirmed by contact provider
- address confirmed or conflicting
- contact path added
- match confidence
- verification warning when provider data conflicts with Brreg or Google

## Success Criteria

- `core/contact-data/` exposes a provider interface and mock provider.
- Mock provider can confirm phone/address for a lead.
- Mock provider can return weak/no-match/conflict cases.
- Source Fusion can consume provider output.
- Strong provider contact match improves contact confidence.
- Provider conflict adds warning/risk instead of overwriting truth.
- No live paid API key is required.
- Existing Lead Machine, Source Fusion, and Netlify beta verifiers still pass.

## Verification

Add:

```bash
./verifications/verify-contact-data-provider-readiness-v1.sh
```

The verifier should check:

- contact-data module syntax and smoke tests pass
- mock provider returns matched, weak, conflict, and no-match cases
- Source Fusion incorporates provider confidence and warnings
- UI/export does not expose noisy raw provider payloads
- banned behavior text is absent: scrape 1881, private person, personal dossier, auto email, auto call

## Later Phases

1. Get provider/legal approval for 1881 or another contact-data source.
2. Add live provider adapter behind an environment variable.
3. Add selected-lead lookup first, not broad market lookup.
4. Add capped market lookup only after pricing, rate limits, and caching rules are clear.
5. Use provider-confirmed contact data in Opportunity Command Center market scoring.
