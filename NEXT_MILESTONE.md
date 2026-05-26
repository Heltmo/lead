# Next Milestone

The system now has working discovery, Google Places/Brave/manual source support, auditing, opportunity compression, commercial pressure scoring, review workspaces, and CRM export. The next phase is calibration realism, not more architecture.

## Priority 1: Human-Aligned Commercial Pressure Calibration

The current cross-industry calibration batch produced:

```text
Total:  23
High:   15
Medium: 6
Low:    1
Verify: 1
```

This is too high-priority biased. The system is still more opportunity-biased than operator-time-biased.

Target distribution:

```text
High:   10-25%
Medium: 30-50%
Low/Verify: remainder
```

Success target:

- top 20% of leads feel clearly stronger than the rest
- `technical_trust_risk` leads remain high when pain is obvious
- polished or already mature sites are penalized unless pain is strong
- lawyers and restaurants receive stricter pressure thresholds
- no clear CTA does not create equal pressure across every vertical
- outreach wording uses correct vertical language

## Priority 2: Add Pressure Penalty Rules

Tune `core/commercial-pressure` with deterministic penalties for:

- polished modern site
- strong conversion structure
- mature branding
- likely vendor-built site
- enterprise, chain, or public-sector patterns
- weak Webconsult offer fit
- indirect or weak contact path

These should reduce:

- `painScore`
- `buyingLikelihood`
- `salesEase`
- `callPriority`

## Priority 3: Vertical-Aware Pressure Weighting

The same issue should not have the same commercial pressure in every industry.

Example:

- no clear CTA is high pressure for dentists, plumbers, electricians, HVAC, and clinics
- no clear CTA is medium pressure for lawyers and accountants
- no clear CTA is lower pressure for restaurants, cafes, and bars unless combined with stronger pain

## Priority 4: Manual Ranking Loop

For each calibration batch, manually label leads:

```text
YES = would call today
MAYBE = possible later
NO = not worth operator time now
VERIFY = needs manual validation
```

Then compare human ranking against system ranking and tune false positives first.

## Paused Work

- Brreg enrichment
- multi-provider merge
- more ontology expansion
- more AI agents
- dashboard UI
- database
- AI outreach
- historical comparison
- Lighthouse
- parallel workers
- monitoring
- multi-agent orchestration

## Operating Principle

The current question is not whether Webconsult can find opportunities. It can.

The current question is:

```text
Can Webconsult reliably identify the few leads worth operator attention today?
```
