# Agent Development Loop V1

## Objective

Make Hermes/Codex collaboration repeatable for Lead Machine development without adding broad in-product agent automation.

Hermes should act as the lead orchestrator. Codex should act as the focused implementation, testing, and review worker.

## V1 Build

- Add repo-level agent instructions for future Codex runs.
- Add a Hermes/Codex loop guide with ticket, worker, fix, and review templates.
- Link the workflow from the operating docs so future work starts from the same loop.
- Document the later product-agent path, with Lead Verifier V1 as the first narrow read-only capability.

## Boundaries

Do not add an in-product LLM agent runtime in V1.

Do not add auto-email, auto-calling, CRM sync, sales scripts, private-person profiling, broad scraping, or workflow mutation by background agents without explicit seller approval.

## Success Criteria

- A future Hermes run can convert a broad request into a scoped Codex ticket.
- A future Codex run has clear repo instructions, guardrails, and verification defaults.
- Product-agent work is explicitly deferred to a read-only Lead Verifier.
- The plan does not conflict with the existing command center, work queues, persistence, or beta guardrails.
