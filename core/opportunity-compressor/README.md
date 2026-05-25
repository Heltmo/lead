# Opportunity Compressor

The opportunity compressor turns internal lead intelligence into one operator-facing sales opportunity.

It consumes:

- `businessSignalProfile`
- `leadInsight`
- audit/review facts

It outputs:

- `primaryOpportunity`
- `whyThisMatters`
- `outreachAngle`
- `callOpener`
- `businessImpact`
- `urgency`
- `type`

The compressor synthesizes, not summarizes. It should hide the reasoning chain by default and produce a decisive lead-review surface.

## Selection Doctrine

The compressor chooses the strongest commercially actionable narrative for this specific business. It should not repeat a generic booking-gap angle when stronger differentiators exist.

Opportunity candidates are ranked before output. Current high-priority differentiators include:

- brand identity or rebrand confusion
- modern/conversion-ready sites that fit campaign optimization better than redesign outreach
- specialist or high-value services that need clearer treatment-to-booking paths
- trust-to-conversion gaps
- local SEO/page-structure consistency gaps
- generic booking visibility only as a fallback
- technical trust risks when reliability issues are the clearest commercial angle

The output should synthesize one dominant opportunity, not summarize every audit finding.

## Commercial Playbooks

Each compressed opportunity maps deterministically to sales operation fields:

- `leadClass`: stable commercial bucket for filtering and prioritization
- `recommendedOffer`: the offer family to lead with
- `outreachMotion`: the sales motion style to use

This keeps sales behavior rule-based and repeatable. LLMs should not invent the sales motion for each run; they may only improve wording later after the deterministic class is selected.

`high_value_service_conversion_gap` is the generic service-line growth pattern. Vertical examples like orthodontics, business law, EV charger installation, or advisory services should enter through `high_value_service` signals rather than creating vertical-specific opportunity types.
