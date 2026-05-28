# Webconsult Autonomous Infrastructure

Reusable infrastructure for Webconsult autonomous software production workflows.

This repository tracks the platform layer, not individual application projects.

## Tracked Layers

- core: reusable architecture notes, components, sections, and patterns
- prompts: reusable execution, refinement, review, and verification prompts
- templates: reusable project, goal, and test templates
- verifications: reusable quality gates and verification scripts
- goals: reusable or active goal contracts that are not private project code

## Boundary

The `projects/` directory is intentionally ignored. Each project should keep its own Git history.

## Current Verification Primitive

```bash
~/webconsult/verifications/verify-frontend.sh /path/to/project
```

The frontend verifier runs lint, production build, and project-provided visual/accessibility tests when available.

## Campaign Runner

The single-command product workflow is:

~~~bash
node ~/webconsult/core/campaign-runner/cli/run-campaign.js --query "tannleger i Halden" --provider brave --max-leads 10 --demo-count 1
~~~

Campaign outputs are written under `~/webconsult/generated/campaigns/<campaign-id>/`.


## Lead Machine Demo

A static showcase lives in `demo/lead-machine-showcase/`. It can be opened directly or served locally and demonstrates location-aware lead discovery, controlled fallback, ranked seller-ready lead packs, caution notes, and export preview without live API calls.


## Lead Machine Live Demo

A local interactive demo app lives in `apps/lead-machine-demo/`. It lets a user enter queries like `Kristiansand rørlegger`, runs the existing Lead Machine backend locally, and displays ranked lead packs with summary, evidence, caution, CSV and JSON links.
