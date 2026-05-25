# Business Signal Engine

The business signal engine is the structured intelligence layer between website audits and lead insight generation.

It converts deterministic page evidence into normalized business signals:

- observations
- weighted strengths
- confidence
- business impact
- opportunities
- contradictions

This module is the source-of-truth layer for semantic lead reasoning. Lead insights, CRM exports, campaign selection, and future scoring should consume these signals instead of re-parsing raw text.

## Vertical-to-Commercial Signals

The signal engine keeps vertical language out of downstream commercial logic. Vertical terms such as `tannregulering`, `forretningsjus`, `badrenovering`, or `elbillader` are normalized into shared commercial primitives such as `high_value_service`.

This protects the platform from becoming dentist-specific. Industry-specific terms are evidence; commercial signals are the reusable source of truth consumed by opportunity compression and sales routing.
