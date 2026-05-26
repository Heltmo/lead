# Cross-Industry Calibration Summary

This document captures the current human calibration direction for Webconsult. The system is technically strong enough for small-batch lead discovery, audit, opportunity compression, commercial pressure scoring, review, and CRM export. The current bottleneck is calibration realism, not more orchestration or AI complexity.

## Calibration Batch

Manual calibration was started across five vertical batches:

- dentists
- lawyers
- electricians
- plumbers
- restaurants

Initial aggregate from 23 reviewed candidates before pressure tuning:

```text
High:   15
Medium: 6
Low:    1
Verify: 1
```

This was too high-priority biased. The system treated too many theoretical opportunities as call-worthy leads.

Target distribution should be closer to:

```text
High:   10-25%
Medium: 30-50%
Low/Verify: remainder
```

## First Pressure Tuning Result

After adding vertical-aware pressure modifiers and resistance penalties, the same 23-lead calibration set produced:

```text
High:   7
Medium: 9
Low:    6
Verify: 1
```

This is materially healthier than the original distribution. It is still slightly high for a final production target, but HIGH is now much more reserved for obvious technical trust pain, strong local-service fit, or clearly call-worthy high-value service friction.

## What Works Best

The system currently performs strongest on high-intent local service businesses:

- dentists
- electricians
- plumbers
- HVAC
- clinics

These verticals fit the current commercial ontology because they are inbound-driven, trust-sensitive, contact/booking dependent, and have visible local-service pain.

The strongest opportunity patterns are:

- `technical_trust_risk`
- `high_value_service_conversion`
- `campaign_optimization` for modern or mature sites

The most believable leads usually combine:

- visible technical trust issues
- broken requests or reliability problems
- obvious conversion friction
- high-value services
- clear phone/contactability
- a simple offer fit

## Strongest Lead Class

`technical_trust_risk` is currently the strongest lead class.

Why it works:

- pain is obvious
- pitch is easy
- urgency feels believable
- outreach can be direct
- operator confidence is high

Examples from calibration:

- Glomma Tannklinikk
- Sentrum Ror
- Advokatfirmaet Bjornebekk og Martinsen AS

## What Is Over-Scored

The system is still too aggressive with:

- `high_value_service_conversion`
- `trust_to_conversion_gap`
- generic conversion friction

especially when:

- the site is already modern
- the business has strong trust signals
- pain is not obvious
- the business looks marketing-aware
- the sales motion would likely be slower or consultative

This caused score inflation in lawyers and restaurants. Polished law firms, mature restaurants, and already conversion-ready businesses often become `high` when they should be `medium`, `low`, or `verify`.

## Critical Doctrine

```text
opportunity != call priority
```

A business can have a real opportunity but still be a weak immediate call target because urgency, buying pressure, pain visibility, or sales ease is low.

The system must optimize for:

```text
Would a human operator spend time calling this lead today?
```

not:

```text
Could this business theoretically improve?
```

## Vertical Fit

Tier 1: strong fit

- dentists
- electricians
- plumbers
- HVAC
- clinics

Tier 2: medium fit

- lawyers
- accountants
- physiotherapists

Tier 3: weak fit currently

- restaurants
- cafes
- bars

Restaurants and lawyers need stricter pressure calibration because website optimization often has lower visible urgency, buying behavior may be more relationship-driven, and good businesses can still be hard sales.

## Calibration Problems Remaining

### Score Inflation

Too many leads become `high`. Commercial pressure should model scarce operator attention, not just possible opportunity.

### Vertical Pressure Calibration

The same signal should not create the same pressure in every vertical.

Example:

- no clear CTA is severe for dentists, plumbers, electricians, and clinics
- no clear CTA is moderate for lawyers
- no clear CTA is weaker for restaurants

### Modern Site Penalties

The system should reduce `painScore`, `buyingLikelihood`, `salesEase`, and `callPriority` when detecting:

- polished modern sites
- strong conversion structure
- mature branding
- likely vendor-built sites
- enterprise or chain patterns
- weak Webconsult offer fit

These are not bad businesses. They are simply harder or lower-urgency sales targets.

### Language Contamination

Some outreach wording still leaks healthcare language into other industries. Terminology should be vertical-aware:

- dentist/clinic: patient
- lawyer/accountant: client
- plumber/electrician/HVAC: customer or homeowner
- restaurant/cafe/bar: guest

## Strategic Direction

Do not expand architecture right now.

Focus on:

- calibration refinement
- pressure realism
- operator prioritization quality
- false positive reduction
- vertical-aware pressure weighting
- sales feedback loops

Pause:

- more AI agents
- more orchestration layers
- more ontology expansion
- dashboard/server work
- outreach automation

## Lead Machine Direction

Webconsult is no longer primarily a website audit system. Website audits are an input layer.

The product direction is:

```text
discovery
-> commercial intelligence
-> pressure modeling
-> prioritization
-> offer matching
-> outreach execution
-> feedback learning
```

The real moat is not AI summaries. It is accurate commercial prioritization plus feedback learning from real sales outcomes.

## CTA/Contact Recognition Calibration

Manual review showed that many Norwegian sites had real contact paths even when the audit said `No clear CTA detected`. The system now builds a deterministic contact/CTA profile from phone, email, forms, links, and vertical CTA terms such as `Ring oss`, `Bestill time`, `Be om tilbud`, `Bestill bord`, and `Kontakt oss`.

When a strong contact path exists, no-CTA language is suppressed in review reasoning, suggested angles, opportunity bullets, lead insights, and visible top evidence. This improves operator trust without adding new architecture.
