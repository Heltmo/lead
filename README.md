# Webconsult Lead Machine

Lead Machine is the seller desk product: sellers search for a market, review ranked leads, call from the browser, save notes, and manage follow-ups.

## Current Product

- `apps/lead-machine-demo`: browser seller desk for search, explicit seller work queues, lead list, notes, follow-ups, and exports.
- `core/lead-machine`: product runner that turns discovery into seller-ready lead packs.
- `core/lead-discovery-agent`: Brreg, Google Places, mock, and manual-source discovery.
- `core/company-profile`: conservative Brreg/company identity enrichment.
- `core/seller-fit`: interprets each lead based on what the seller sells.
- `core/website-audit`: manual per-lead AI check of the lead's website (OpenAI GPT-5.5) - short Norwegian verdict on age, weaknesses and gaps that feeds the sales verdict.
- `core/website-sales-fit`: the MVP wedge verdict — is this company a good lead for selling websites, and why? No website found counts as a positive signal.
- `core/source-fusion`: combines Brreg, Google/contact data, seller fit, and workflow context into Proof & Confidence.
- `core/osint`: narrow public-evidence summary for one selected lead.
- `netlify/functions/api.js`: hosted beta API for shared notes/follow-ups.

Removed from the main repo path: browser-audit tooling, old orchestration queues, static demo generation, campaign/demo runners, website-redesign opportunity modules, and landing-page test scaffolding.

## Local Run

```bash
cd /home/xman/webconsult/apps/lead-machine-demo
npm run dev
```

Open `http://127.0.0.1:8787`.

## Agent Development

Use `HERMES_CODEX_LOOP.md` for Hermes-led development loops with Codex. Product agents inside Lead Machine are deferred to narrow, read-only lead verification until the seller desk foundation is stronger.

For manual control-plane discipline when an agent session coordinates lead-quality work (ledger, narrow checks, readiness gate, no mutation without approval), use `LEAD_OPERATIONS_ORCHESTRATOR_V1.md` and `prompts/lead-operations-orchestrator.prompt.md`.

## Goal Chain

Use `HERMES_START_HERE.md` and `goals/README.md` to run the Hermes/Codex path from current beta to the daily seller desk end state.

## Beta

Before sharing with testers:

```bash
cd /home/xman/webconsult
npm run netlify:check
./verifications/verify-beta-preflight.sh
./verifications/verify-netlify-hosted-beta.sh
```

Use `BETA_PREFLIGHT_CHECKLIST.md` before sessions, `BETA_TEST_PLAN_001.md` and `BETA_TEST_SCRIPT_INTERNAL.md` for tester tasks, `BETA_FEEDBACK_FORM.md` for notes, `BETA_KNOWN_LIMITATIONS.md` for boundaries, and `NETLIFY_BETA.md` for deployment.

## Boundary

The product does not send email, place calls, generate pitch scripts, sync CRM, bill users, or scrape private/login-gated sources. Sellers own the conversation and relationship; Lead Machine owns discovery, evidence, workflow state, and exports.
