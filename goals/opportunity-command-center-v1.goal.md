# Opportunity Command Center V1

## Objective

Add a read-only command center to Lead Machine that tells a seller what to work now.

The command center should feel like an operational agent, but V1 should be deterministic and source-backed. It should prioritize leads, markets, follow-ups, and verification work from existing Lead Machine data without generating sales scripts or mutating workflow state.

## Product Position

Lead Machine is becoming a seller operating desk:

```text
find leads
-> verify source confidence
-> decide what to call
-> log outcome
-> follow up
-> learn which markets are worth time
```

Command Center V1 is the first top-level surface for that operating loop. It should answer:

```text
What should I do right now?
```

## V1 Inputs

Use only data already available in the seller desk:

- latest run lead packs
- saved searches
- workflow queues
- follow-up dates
- activity history
- seller fit
- source fusion
- market sweep city counts
- contact, Brreg, location, Google Places, and source-quality fields

No LLM is required in V1. If a later LLM summary is added, it must only summarize the structured findings produced by deterministic code.

## V1 Build

Add a shared module:

```text
core/opportunity-command-center/
```

Add local and hosted endpoints:

```text
GET /api/opportunity-command-center
```

The endpoint should return structured JSON:

```json
{
  "generatedAt": "2026-06-04T00:00:00.000Z",
  "topActions": [],
  "callTheseFirst": [],
  "verifyBeforeCalling": [],
  "overdueFollowUps": [],
  "bestMarketsNow": [],
  "wastedTimeWarnings": [],
  "sourceWarnings": []
}
```

Add a compact top panel in the seller desk:

- Today / Command Center summary
- Call these first
- Verify before calling
- Overdue follow-ups
- Best markets now
- Wasted-time warnings

The panel should use buttons/links that take the seller to the relevant queue, lead, city, or filter. It should not be a chatbot and should not expose technical internals.

## Scoring Rules

`callTheseFirst` should favor leads with:

- direct phone
- not contacted
- confirmed org.nr
- exact or strong location
- strong/good seller fit
- strong/good source fusion
- useful Google proof
- no severe source conflicts

`verifyBeforeCalling` should explain concrete checks:

- candidate org.nr only
- no confirmed identity
- missing phone
- regional fallback
- source conflict
- weak contact confidence
- weak or unknown location confidence

`overdueFollowUps` should include:

- overdue follow-up dates
- due today follow-ups
- interested leads without a concrete next action

`bestMarketsNow` should work especially for Norway sweep:

- lead count per city
- phone-ready ratio
- confirmed org.nr ratio
- verify-first ratio
- interested / no-answer / not-relevant counts when workflow history exists

`wastedTimeWarnings` should call out:

- many leads without phone
- many weak/skip leads
- high verify-first ratio
- many candidate/manual Brreg matches
- broad search with low useful coverage

## Boundaries

Do not add:

- auto-email
- auto-calling
- CRM sync
- sales scripts
- ready-to-send outreach
- LLM-based freeform decision making
- broad scraping
- queue mutations without explicit seller approval
- new paid provider dependency
- auth, billing, or team workspaces

V1 is read-only. It may recommend what to work, but it must not move leads between queues.

## Success Criteria

- A broad Norway sweep shows best city/market candidates by contactability and source confidence.
- A local or hosted run exposes `GET /api/opportunity-command-center`.
- The UI shows a compact command center before the lead list.
- The command center identifies call-first leads with traceable reasons.
- The command center identifies verify-first leads with concrete reasons.
- Overdue and due-today follow-ups are clearly surfaced.
- Wasted-time warnings appear when the current run has weak coverage or high verification burden.
- Existing saved searches, work queues, workflow notes, CSV exports, and selected-lead enrichment continue to work.
- Existing Lead Machine and Netlify beta verifiers still pass.

## Verification

Add:

```bash
./verifications/verify-opportunity-command-center-v1.sh
```

The verifier should check:

- module syntax and smoke tests pass
- endpoint returns the expected JSON sections
- fixture data produces at least one call-first recommendation
- fixture data produces verify-first reasons for candidate/manual leads
- follow-up fixture data produces overdue or due-today recommendations
- UI includes the command center surface
- banned behavior text is absent: sales script, ready-to-send, auto email, auto call

## Later Phases

1. Suggested queue changes with explicit approval.
2. Saved-market snapshots and changed-since-last-run deltas.
3. Market refresh scheduling after durable workspace storage exists.
4. LLM summary layer that only rewrites deterministic findings.
5. Outcome learning from interested/no-answer/not-relevant patterns.
