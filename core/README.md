# Webconsult Core

Reusable production assets for Webconsult autonomous software workflows.

This folder is intentionally lightweight. It is a place for reusable patterns to accumulate as projects reveal what should be shared.

## Current Scope

- components: reusable UI primitives and component notes
- sections: reusable page section patterns
- patterns: architecture, workflow, and design-system notes

## Rule

Only promote something into core after it has proven useful in a real project.

## Browser Intelligence

- website-audit-agent: deterministic URL audit primitive for screenshots, structured signal extraction, accessibility checks, and lead-quality reporting.

## Lead Intelligence

- company-profile: conservative Brreg/Enhetsregisteret enrichment for legal company identity, org.nr, official metadata, and match confidence.

## Lead Pack Packaging

- lead-pack-runner: V1 packaging layer that converts existing orchestrator run outputs into seller-ready lead-packs JSON/CSV/summary without running new discovery, outreach automation, or sales scripts.

## Location Quality

Location quality is now part of lead discovery and lead-pack output. User query location is treated as a first-class constraint, out-of-area candidates are excluded from handoff by default, and lead packs expose `sourceQuality` fields for seller trust.
