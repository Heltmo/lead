# Lead Operations Orchestrator V1

## Purpose

Lead Operations Orchestrator V1 is a control-plane workflow for Lead Machine. It coordinates lead discovery, verification, scoring, and seller-ready queue preparation without turning the product into an autonomous outreach system.

Lead Machine is a website-sales seller desk: every search runs as website sales (web_it), and the core verdict on every lead is `websiteSalesFit` (strong/review/weak) from `core/website-sales-fit`. Seller setup is geography, good-customer hints, and disqualifiers - there is no category picker. The orchestrator must reason in those terms, not in the older multi-intent vocabulary.

The goal is to make agent work reliable enough that a seller can trust the lead desk:

```text
seller intent
-> search/import
-> verified and ranked leads
-> seller work queues
-> notes and follow-ups
-> activity history
-> export
```

This guide adapts the useful parts of a maintainer-orchestrator pattern to Lead Machine: one root coordinator, narrow workers, explicit permission boundaries, evidence before completion, and compact ledger reporting.

## Product Boundary

Lead Machine owns:

- discovery
- company identity and contact evidence
- source quality checks
- seller-fit scoring
- lead readiness suggestions
- queue context
- exportable call lists

The seller owns:

- whether to call
- what to say
- relationship judgment
- follow-up timing
- accepting or rejecting workflow changes

## Guardrails

Do not add:

- generated pitch scripts
- automatic calls
- automatic email sending
- CRM sync
- private-person profiling
- login-gated scraping
- broad scraping or historical monitoring
- queue/status/note/follow-up mutation without explicit seller approval

The orchestrator may suggest a next action. It must not silently change seller workflow state.

## Recommended First Version

Build this as a read-only operating layer before adding in-product automation.

V1 should produce structured findings and a compact ledger. It should not spawn background jobs that change data.

```text
Discover or import candidates
-> classify source/contact/identity quality
-> verify one selected lead when asked
-> score seller readiness
-> suggest queue/action
-> wait for seller approval before mutation
```

## Workers Map To Existing Modules

Four of the five workers below already exist as deterministic code that runs in the pipeline on every search. The orchestrator's new value is coordination, evidence demands, and (later) the suggestion layer - it must not re-implement these modules as LLM prose, which would be slower, costlier, and less consistent.

| Worker | Existing implementation |
| --- | --- |
| Discovery Worker | `core/lead-discovery-agent` |
| Identity And Source Worker | `core/company-profile` + `core/source-fusion` |
| Website Signal Worker | `websiteReachability` normalizer + `core/website-audit` (AI check, manual per selected lead via `/api/website-audit`) |
| Seller Fit Worker | `core/seller-fit` + `core/website-sales-fit` |
| Verification Worker | queue gate in `apps/lead-machine-demo/workQueues.js` (`buildQueueQuality`) + Verifiser firma (deep-qualify) |

When the orchestrator "delegates" one of these checks, that normally means reading the module's already-attached output on the lead (sellerFit, websiteSalesFit, sourceFusion, queueQuality) or triggering the existing endpoint - not prompting a model to redo the analysis.

## Agent Roles

### Root Orchestrator

Coordinates the workflow. It decides what should happen next, delegates narrow tasks, checks returned evidence, updates the ledger, and asks the seller only when a real decision is needed.

The root orchestrator should not perform deep website analysis itself. It should keep the session lightweight and demand proof from workers.

### Discovery Worker

Finds candidate businesses for a target niche and location using approved project sources.

Returns:

- candidate company name
- website URL, if found
- phone, if found
- source URL or source type
- location evidence
- duplicates suspected
- confidence
- blockers

### Identity And Source Worker

Checks whether a candidate is a real business and whether sources point to the same entity.

Returns:

- Brreg/company identity status
- candidate org number, if any
- source agreement or conflict
- location confidence
- contact confidence
- risk flags
- evidence URLs
- recommended trust action

### Website Signal Worker

Checks public website signals only. It may report observations about the business website, but must not invent a sales pitch.

Returns:

- website reachable yes/no
- contact page or form found yes/no
- visible phone/email yes/no
- basic website signals
- business relevance to seller intent
- evidence URLs
- confidence
- blockers

### Seller Fit Worker

Scores whether the business is worth seller attention for the current seller setup.

Returns:

- seller intent used
- positive fit reasons
- risk/disqualifier reasons
- recommended action: call, verify, review, skip
- confidence
- evidence used

### Verification Worker

Runs the readiness gate for one selected lead. This is the first product-agent shape that should be implemented.

Returns:

- readiness: call_ready, verify_first, needs_contact, needs_owner, rejected
- missing fields
- risk flags
- evidence summary
- suggested next action
- exact reason no mutation was made

### Suggestion Worker, Later

After Lead Verifier V1 is trusted, a worker may prepare pending suggestions such as move queue or set follow-up. The seller must explicitly accept before the normal workflow API saves anything.

## Worker Rules

Workers must not create subworkers.

Each worker must return:

- what they checked
- evidence found
- confidence level
- blockers
- recommended next action
- whether seller approval is required

Workers must not:

- call
- email
- generate ready-to-send outreach
- scrape private profiles
- mutate workflow state
- override seller judgment

## Lead Readiness Gate

A lead can be marked seller-ready only when all required facts are present for the intended queue.

### Call Ready

Required:

- business appears active
- direct business phone exists
- identity/source confidence is acceptable
- location fits seller scope or fallback is clearly disclosed
- seller fit is strong enough
- duplicate check passed
- no severe source conflict

Current product rule (see `CALL_READY_QUEUE_QA.md`, rule change 2026-06-10): a lead with `websiteSalesFit: strong` routes to Ring nå even when Brreg identity is unconfirmed, because strong already requires phone, exact location match, an active company, and not chain/public sector. Hard blockers still send to verify_first: missing or foreign-looking phone, and severe location conflict. The orchestrator must not re-tighten this gate.

Allowed output:

- recommend call_now
- show evidence
- ask seller to approve a queue move, if needed

### Verify First

Use when any of these are true:

- identity is unconfirmed
- location conflicts or is too broad
- phone format is suspicious
- website/source mismatch exists
- category match is weak
- contact route exists but source confidence is not strong

Allowed output:

- recommend verify_first
- list concrete checks
- do not call it ready

### Needs Contact

Use when no usable phone/contact route exists.

Allowed output:

- recommend needs_contact
- list missing contact fields
- suggest public source types to check next

### Needs Owner

Use when the agent cannot decide safely because it requires seller strategy or business judgment.

Examples:

- unclear ideal-customer fit
- disqualifier ambiguity
- budget/value assumption
- seller territory ambiguity
- whether a polished company should still be pursued

Allowed output:

- ask one exact decision question
- preserve all evidence

### Rejected

Use when the candidate is duplicate, inactive, outside scope, no real business fit, or has no meaningful contact path.

Allowed output:

- rejection reason
- evidence
- no further action

## Lead Ledger

The ledger is a session reporting format, not a new datastore. It maps 1:1 onto the app's seller work queues and workflow board, which remain the source of truth for lead state.

Maintain a compact ledger with these sections:

- Active: currently being researched or verified
- Verified: call-ready or seller-ready leads with evidence
- Needs seller: exact decision needed
- Rejected: reason and evidence
- Exported: included in a seller export or call list

Recommended row format:

```text
status | lead | location | queue suggestion | confidence | blocker | evidence
```

## Required Lead Fields

Use existing Lead Machine data where possible. Do not invent fields that imply outreach automation.

Required for readiness:

- business_name
- lead_id
- website_url, if available
- phone, if available
- contact_form_url or public contact path, if available
- niche_or_query
- location
- seller_intent
- identity_status
- source_confidence
- contact_confidence
- location_confidence
- seller_fit
- readiness
- recommended_next_action
- evidence_urls
- blockers
- status

Optional:

- organization_number
- candidate_organization_number
- website_signal_summary
- latest_activity
- follow_up_due

Avoid:

- private personal profiles
- inferred owner identity unless already present in approved business records
- generated outreach scripts
- auto-send fields

## Suggested State Machine

For documentation and later implementation:

```ts
type LeadOpsStatus =
  | 'candidate'
  | 'identity_checked'
  | 'website_checked'
  | 'seller_fit_checked'
  | 'verified'
  | 'needs_seller'
  | 'rejected'
  | 'exported';
```

For workflow queues, continue using the app's seller queues:

```ts
type SellerQueue =
  | 'call_now'
  | 'verify_first'
  | 'needs_contact'
  | 'no_answer'
  | 'follow_up_today'
  | 'interested'
  | 'not_relevant'
  | 'archived';
```

## Implementation Path

### Phase 1: Documentation And Prompt

Create the orchestrator guide and prompt. Use them manually with Hermes/Codex or a single assistant thread.

No app changes required.

### Phase 2: Read-Only Lead Verifier

Do not start Phase 2 until real call sessions have validated the `websiteSalesFit` verdict. The operating principle from the website-sales pivot applies: rules are calibrated from what actual calls teach us, not from guessed taxonomies - the same applies to agent layers built on top of those rules.

Implement the existing `lead-verifier-agent-v1.goal.md`:

- one selected lead only
- structured findings
- no mutation
- source-backed output
- deterministic rules first
- optional LLM only summarizes structured facts

### Phase 3: Pending Suggestions

Implement `approval-based-agent-suggestions-v1.goal.md`:

- proposed queue/status/follow-up changes are separate from saved workflow state
- seller accepts or rejects
- accepted suggestions go through the normal workflow API
- activity history records the source

### Phase 4: Background Refresh, Later

Only after login/workspace boundaries are stable, allow background market refresh to suggest changes. It still must not mutate seller workflow without approval.

## Practical Operating Loop

Use this when running the orchestrator manually:

1. Read current project state and seller setup.
2. Identify the active target: search/import, selected lead, or queue.
3. Build or refresh the ledger.
4. Classify each candidate: active, verified, needs seller, rejected, exported.
5. Delegate only narrow checks.
6. Require evidence and confidence from each worker.
7. Apply the readiness gate.
8. Ask seller only for exact decisions.
9. Do not mutate workflow state unless the seller approves.
10. Report concise outcome, evidence, risks, and next action.

## Verification Defaults

For docs-only changes:

```bash
git diff -- LEAD_OPERATIONS_ORCHESTRATOR_V1.md prompts/lead-operations-orchestrator.prompt.md
```

For later app changes:

```bash
node --check apps/lead-machine-demo/server.js
node --check apps/lead-machine-demo/public/app.js
node apps/lead-machine-demo/tests/smoke.test.js
node core/lead-machine/tests/smoke.test.js
```
