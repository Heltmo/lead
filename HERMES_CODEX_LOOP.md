# Hermes/Codex Agent Loop

## Purpose

Use Hermes as the lead orchestrator and Codex as the implementation, test, and review worker for Lead Machine development.

This is a development workflow. It is not a broad in-product agent system. Product agents inside Lead Machine should remain narrow, source-backed, and seller-approved.

## Starting Hermes

Start Hermes from the repo root so it auto-loads `AGENTS.md`:

```bash
cd /home/xman/webconsult
hermes
```

Use `HERMES_START_HERE.md` as the first prompt. The ordered roadmap is `goals/README.md`.

## Roles

- Hermes owns orchestration: intake, ticket shaping, delegation, review, retry loops, and final status.
- Codex owns execution: repo inspection, implementation, focused tests, diff review, and concise reporting.
- The human owner approves product direction changes, broad architecture changes, and any move toward workflow mutation or outreach automation.

## Hermes Operating Loop

For every request:

1. Read current context:
   - `OPERATING_GUIDE.md`
   - `CURRENT_STATE.md`
   - `NEXT_MILESTONE.md`
   - relevant `goals/*.goal.md`
   - recent git status
2. Convert the request into a small ticket.
3. Delegate the ticket to Codex with the worker prompt template below.
4. Inspect the result:
   - diff matches the ticket
   - acceptance criteria are met
   - product guardrails are respected
   - required checks passed or failures are explained
5. If incomplete, send Codex a targeted fix prompt with the failing evidence.
6. Repeat until the ticket is complete or blocked by a real missing decision.
7. Summarize outcome, changed files, verification, residual risks, and next ticket.

## Ticket Template

```text
Title:

Objective:

Context files to read:
- OPERATING_GUIDE.md
- CURRENT_STATE.md
- NEXT_MILESTONE.md
- relevant goals/*.goal.md

Likely files/subsystems:

Acceptance criteria:
-

Out of scope:
- sales scripts
- auto email
- auto calls
- CRM sync
- private-person profiling
- broad scraping
- workflow mutation by background agents without seller approval

Required verification:
-
```

## Codex Worker Prompt

```text
You are the Codex worker for /home/xman/webconsult.

Implement only this ticket:

[paste ticket]

Before editing:
- read OPERATING_GUIDE.md
- read CURRENT_STATE.md
- read NEXT_MILESTONE.md
- read any listed goal file
- inspect the relevant files before deciding the approach

Implementation rules:
- keep the change tightly scoped to the ticket
- follow existing repo patterns
- do not add product behavior outside the acceptance criteria
- do not add generated pitch scripts, auto email, auto calls, CRM sync, private-person profiling, login-gated scraping, or broad scraping
- do not allow background agents to mutate queue/status/note/follow-up state without explicit seller approval
- add or update focused tests when behavior changes

Verification:
- run the required commands from the ticket
- if a command fails, fix the issue and rerun it when feasible
- if a command cannot be run, explain why

Return:
- summary of changes
- changed files
- verification commands and results
- remaining risks or follow-up tickets
```

## Fix Prompt Template

```text
The previous Codex result did not satisfy the ticket.

Ticket:
[paste ticket]

Problem evidence:
[paste failing test, diff concern, missing acceptance criterion, or guardrail violation]

Fix only this issue. Keep the original scope and rerun the relevant verification.
```

## Review Checklist

Hermes should check:

- Does the diff solve the stated objective without extra product scope?
- Are Lead Machine boundaries still true?
- Are deterministic workflows preferred before LLM/agent behavior?
- Did tests or verifiers cover the touched behavior?
- Did Codex report any unresolved risk that needs a new ticket?

## Product-Agent Roadmap

Do not start with a broad in-product multi-agent system. Build product agents only after the seller desk foundation is stable.

Recommended phases:

1. Development loop only: Hermes orchestrates Codex for repo work.
2. Lead Verifier V1: read-only analysis for one selected lead.
3. Approval-based suggestions: seller explicitly accepts queue/status changes.
4. Background refresh jobs: saved-market refresh after workspace/auth boundaries are stronger.

Lead Verifier V1 should:

- analyze one selected lead only
- use existing company, contact, source fusion, OSINT, location, and workflow data
- return structured findings, missing fields, risk flags, evidence, and a suggested next action
- stay read-only

Lead Verifier V1 must not:

- call
- email
- generate ready-to-send outreach
- scrape private profiles
- mutate queues, notes, statuses, owners, or follow-up dates
- override seller judgment
