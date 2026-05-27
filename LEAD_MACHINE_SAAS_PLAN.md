# LEAD_MACHINE_SAAS_PLAN

## Product Vision

Webconsult should become a lead intelligence SaaS engine, not an outreach script tool.

A user should eventually be able to search:

```text
advokater i Gol
```

and receive ranked seller-ready lead packs containing discovered businesses, contact info, Google Places data, website intelligence, Brreg/company identity data, later Proff/economy data, ranking, evidence, and caution notes.

The product should answer:

- Which businesses exist in this niche and city?
- Which leads are most interesting?
- What do we know about each company?
- How can the seller contact them?
- What evidence supports the ranking?
- What official identity data is known or uncertain?
- What should the seller verify before acting?

## Product Boundary

The machine owns:

- discovery
- enrichment
- ranking
- evidence
- caution
- export

The seller owns:

- angle
- wording
- outreach
- timing
- relationship
- qualification
- closing

Default product behavior must not generate sales scripts, email copy, call openers, or automated outreach.

## User Flow

```text
User query
  -> discovery/audit run
  -> lead intelligence
  -> company identity enrichment
  -> ranked lead packs
  -> JSON/CSV/UI export
```

V1 starts one level lower:

```text
existing orchestrator run output
  -> lead-pack-runner
  -> lead-packs.json
  -> lead-packs.csv
  -> summary.json
```

This proves the seller-ready lead pack format before building a new end-to-end runner.

## Data Sources

### Google Places

Role: local discovery and business metadata.

Use for:

- business name
- placeId
- address
- phone
- website
- rating
- review count
- business status
- location

### Brave

Role: fallback / web discovery.

Use for:

- websites missing from Google Places
- organic web presence
- alternative sources
- directory/source discovery

### Brreg / Enhetsregisteret

Role: official identity layer.

Use for:

- org.nr
- legal name
- organization form
- registered address
- municipality
- NACE code / description
- employees if available
- active status
- enhet / underenhet context
- match confidence and warnings

### Proff Later

Role: optional premium economy/commercial enrichment.

Use only after confirmed Brreg identity.

Use for later:

- revenue
- result/profit
- equity
- roles
- owners
- credit/compliance fields if licensed

Proff data should not affect scoring in V1.

### Website Audit

Role: web intelligence.

Use for:

- audit status
- top evidence
- contactability
- CTA/contact profile
- technical trust findings
- accessibility/SEO/performance evidence

## Module Architecture

```text
core/lead-pack-runner/
  leadPackRunner.js
  cli/lead-pack.js
  tests/smoke.test.js
```

V1 wraps existing outputs. It does not replace discovery, orchestrator, review workspace, opportunity-compressor, or commercial-pressure.

Future architecture:

```text
User Query
  -> Lead Run Controller
  -> Discovery Providers
  -> Orchestrator / Website Audit
  -> Business Signals
  -> Opportunity Compression
  -> Commercial Pressure
  -> Company Profile / Brreg
  -> Lead Pack Runner
  -> UI / CSV / API
```

## Lead Pack Object Shape

```json
{
  "rank": 1,
  "callPriority": "high",
  "leadClass": "technical_redesign",
  "opportunityType": "technical_trust_risk",
  "company": {
    "displayName": "Example AS",
    "legalName": null,
    "organizationNumber": null,
    "candidateOrganizationNumber": null,
    "organizationForm": null,
    "matchStatus": null,
    "matchConfidence": null,
    "warnings": []
  },
  "contact": {
    "website": "https://example.no",
    "phone": "69 00 00 00",
    "email": "post@example.no",
    "address": "Examplegata 1, 0000 Oslo",
    "city": "Oslo"
  },
  "places": {
    "provider": "google-places",
    "placeId": "...",
    "rating": 4.5,
    "reviewCount": 50
  },
  "website": {
    "auditStatus": "completed",
    "topEvidence": [],
    "contactability": "strong",
    "ctaProfile": null
  },
  "ranking": {
    "whyRanked": [],
    "caution": [],
    "painScore": 0.84,
    "buyingLikelihood": 0.72,
    "salesEase": "medium"
  },
  "economy": {
    "status": "not_enabled",
    "source": null,
    "revenue": null,
    "profit": null,
    "employees": null
  },
  "meta": {
    "sourceQuery": "advokater i Gol",
    "sourceRun": "core/orchestrator/runs/example",
    "lastCheckedAt": "2026-05-27T00:00:00.000Z"
  }
}
```

## Self-Running Agent Concept

A self-running agent should mean controlled operational automation, not free-form autonomous selling.

Future capabilities:

- saved searches
- scheduled runs
- refresh cadence
- retries
- logs
- run history
- stale lead detection
- new top lead alerts

Example:

```text
Every Monday 08:00:
  run saved searches
  refresh company profile data
  package new top leads
  notify user that lead packs are ready
```

## Phased Roadmap

1. Lead pack runner from existing run outputs.
2. Conservative Brreg/company-profile attachment.
3. Saved searches / scheduled runs.
4. Proff enrichment only after confirmed org.nr.
5. Economy-aware lead packs.
6. SaaS UI / API.

## Current V1 Decision

Build `core/lead-pack-runner/` as a packaging layer first.

Do not build:

- Proff integration
- outreach automation
- email sending
- sales scripts
- dashboard
- saved searches
- new scoring

## Lead Machine Runner V1 Status

`core/lead-machine/` is now the internal single-command runner for the product flow:

```text
discovery -> orchestrator audit -> lead-pack-runner
```

It wraps existing modules and writes one run folder with discovery artifacts, lead-pack outputs, and `lead-machine-summary.json`. The summary now includes operator-facing counts, location exclusion counts, fallback status, and `nextRecommendedAction` so low-supply and fallback runs are easier to interpret. It does not add Proff, frontend, saved searches, outreach automation, sales scripts, or new scoring logic.
