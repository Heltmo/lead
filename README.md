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
