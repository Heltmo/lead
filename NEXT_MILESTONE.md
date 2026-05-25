# Next Milestone

The system now has taxonomy-backed discovery, Brave live provider support, Google Places provider support, and deterministic discovery target filtering. The next phase is operational validation of Google Places for call-ready Norwegian leads, not Brreg or multi-provider merge yet.

## Priority 1: Run A Google Places Call-Ready Lead Test

Run:

```text
tannleger i Halden
```

Success target:

- Google Places returns businesses with real businessName values
- candidates include phone and address when available
- direct business websites enter the audit handoff
- review workspace shows provider phone/address/rating/status metadata
- CRM export contains call-ready phone/address fields for shortlisted leads
- at least 1 to 3 leads are realistic enough to call manually

## Priority 2: Add callReadyScore

Only after Google Places output is operationally useful, add a deterministic `callReadyScore` separate from website/audit score.

Suggested inputs:

- phone exists
- direct website exists
- Google businessStatus is operational
- correct industry/category
- audit-worthy website issues exist
- not directory/social

## Priority 3: Brreg Enrichment

Add Brreg only after Google Places has proven it can produce call-ready local leads. Brreg should validate/enrich existing candidates, not replace discovery.

## Paused Work

- Brreg enrichment until Google Places is validated
- Brave fallback merge until Google Places gaps are clear
- live Google scraping
- protected/private source scraping
- dashboard UI
- database
- AI outreach
- historical comparison
- Lighthouse
- parallel workers
- monitoring
- multi-agent orchestration

## Operating Principle

The current question is whether Google Places can produce leads that are directly callable, then whether the existing audit/review/export pipeline can turn them into 1 to 3 manual outreach candidates.
