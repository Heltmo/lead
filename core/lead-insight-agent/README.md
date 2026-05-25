# Lead Insight Agent

The lead insight agent is a downstream interpretation layer for reviewed leads. It does not replace deterministic audits and does not mutate raw audit artifacts.

Inputs are generated audit/review fields such as business name, website, Google Places metadata, issues, technologies, contactability, and artifact links. Output is stable JSON for operator review and CRM export.

Current behavior uses a deterministic evidence-grounded fallback so the system remains verifiable without an LLM key. The module also exposes a prompt contract and mocked LLM path for future provider integration.

Output fields:

- `leadSummary`
- `whyThisLeadIsInteresting`
- `mainProblem`
- `evidenceBasedAngle`
- `callOpeningLine`
- `recommendedOffer`
- `disqualifiers`
- `confidence`

Generated review workspaces cache insight JSON under `review-workspace/lead-insights/`.
