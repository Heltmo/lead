# Call-Ready Lead Workflow V1

## Objective

Move Lead Machine from lead intelligence into a practical seller workflow tool where a salesperson can work leads directly from the system.

The system should help a seller answer:

- Who should I look at first?
- Can I contact this business?
- Is the company identity verified or uncertain?
- What has already happened with this lead?
- When should I follow up?
- What should be exported or reviewed next?

## Product Boundary

Machine provides:

- discovery
- enrichment
- ranking
- evidence
- caution
- workflow logging
- export

Seller owns:

- angle
- wording
- outreach
- timing
- relationship
- close

Do not add auto-outreach, generated scripts, automatic calling, automatic email sending, CRM sync, auth, database, or AI call listening in this slice.

## V1 Scope

Add local per-lead workflow state in the demo app:

- seller status
- contacted yes/no
- channel
- person reached
- response
- notes
- follow-up date
- next action
- outcome

Persist it locally and include it in JSON/CSV export. This creates the first bridge from lead intelligence to seller execution without pretending to be a full CRM.

## Later Phases

1. User accounts and saved workspaces.
2. Shared team lead ownership.
3. Telephony integration from a shared or connected number.
4. Call log and call outcome capture.
5. Email connection and sent-email logging.
6. Calendar follow-up and reminder queue.
7. Optional AI call notes/listening with explicit consent and legal review.
8. Automation rules only after manual workflow proves useful.

## Success Criteria

- A seller can mark a lead as new/reviewed/contacted/follow-up/interested/rejected.
- A seller can log contact channel, person reached, response, note, and follow-up date.
- Workflow state persists across local runs/server requests.
- CSV/JSON exports include workflow fields.
- No sales scripts, email templates, automatic calls, or automatic outreach are introduced.
