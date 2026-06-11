# Lead Machine Goal Chain

This is the ordered path from current beta to the end goal: a daily seller desk a salesperson opens every morning to know who to call, what happened last, and what to do next.

## Operating Rule

Hermes owns orchestration. Codex owns scoped implementation and verification. Work one goal at a time, with small tickets and explicit checks.

When an agent session coordinates lead-quality work (not code), follow `LEAD_OPERATIONS_ORCHESTRATOR_V1.md` - it maps the worker roles to existing modules and gates Phase 2 on validated call sessions.

## Goal Order

1. `agent-development-loop-v1.goal.md` - make Hermes/Codex development repeatable.
2. `beta-workspace-admin-v1.goal.md` - make beta/local data reset and inspection safe.
3. `seller-intent-onboarding-v1.goal.md` - make seller setup clearer: what they sell, where, good customer, disqualifiers.
4. `login-workspaces-v1.goal.md` - add real user/team workspace planning and first implementation slice.
5. `contact-provider-live-gate-v1.goal.md` - choose a compliant contact-data provider path before live lookup.
6. `email-connection-plan-v1.goal.md` - design Gmail/Outlook OAuth and email activity boundaries before code.
7. `manual-email-activity-v1.goal.md` - log email activity manually before syncing or sending.
8. `lead-verifier-agent-v1.goal.md` - add the first read-only product agent for one selected lead.
9. `approval-based-agent-suggestions-v1.goal.md` - let the seller approve suggested queue/status updates.
10. `background-market-refresh-v1.goal.md` - refresh saved markets in the background after workspace/auth boundaries are stable.
11. `daily-seller-desk-end-state.goal.md` - converge on the full daily seller desk experience.

## Always In Scope

- seller desk workflow quality
- verified company identity and contactability
- seller work queues
- notes, outcomes, follow-ups, and activity history
- export and beta support
- source-backed recommendations

## Always Out Of Scope Until Explicitly Reopened

- generated pitch scripts
- automatic calls
- automatic email sending
- CRM sync
- private-person profiling
- login-gated scraping
- broad scraping
- agents mutating seller workflow without explicit approval
