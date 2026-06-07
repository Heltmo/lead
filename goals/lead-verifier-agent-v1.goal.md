# Lead Verifier Agent V1

## Objective

Add the first narrow in-product agent: a read-only verifier for one selected lead.

The agent should help the seller decide whether to call, verify first, or fill missing contact/context. It should not mutate workflow state.

## V1 Build

- Add a selected-lead verification endpoint or module that returns structured findings.
- Use existing company, contact, Source Fusion, OSINT, location, seller-fit, and workflow data.
- Return readiness, missing fields, risk flags, evidence, and suggested next action.
- Keep output source-backed and deterministic where possible; any LLM layer may only summarize structured findings.

## Boundaries

Do not call, email, generate ready-to-send outreach, scrape private profiles, mutate queues/statuses/notes/owners/follow-ups, or override seller judgment.

## Success Criteria

- Strong lead returns call-ready guidance with evidence.
- Weak identity/contact/source lead returns verify-first guidance with concrete reasons.
- Missing phone returns missing-contact guidance.
- No workflow state is changed by the verifier.
- Banned behavior text is absent from UI and tests.
