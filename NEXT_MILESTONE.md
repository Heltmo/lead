# Next Milestone

Lead Machine is now aimed at becoming the daily seller desk for all seller types.

The next phase is product focus: make the seller workflow real, persistent, and ready for email-connected work.

## Priority 1: Seller Desk Foundation

Build the durable product loop:

```text
login
-> saved searches / imports
-> verified and ranked leads
-> call queue
-> notes
-> follow-up date
-> activity history
-> export / email-connected activity
```

Success target:

- a seller can log in and return to the same workspace
- leads, notes, statuses, owners, and follow-ups persist in a real database
- the call queue clearly shows who to call now, who to verify, and who to follow up
- the product does not depend on website redesign pain, Proff, SSB, generated demos, or AI outreach scripts

## Priority 2: General Seller Fit Calibration

Continue manual YES/MAYBE/NO/VERIFY calibration, but judge leads by seller intent, not website weakness alone.

Target distribution:

```text
High:   10-25%
Medium: 30-50%
Low/Verify: remainder
```

Success target:

- top 20% of leads feel clearly stronger than the rest for the selected seller type
- polished companies are not over-prioritized unless seller fit is strong
- contactability, identity confidence, company size, geography, source confidence, and seller intent carry more weight than generic website issues
- vertical-specific wording does not leak across seller types

## Priority 3: Email Connection Plan

Design before implementation:

- Gmail/Outlook OAuth scope boundary
- manual email logging first
- later email sync for replies and activity history
- no mass sending or ready-to-send outreach in the default product
- every email event attaches to a lead/contact/workspace record

## Priority 4: Background Agent Boundary

Hermes/OpenClaw or any background agent should work quietly behind the seller desk. Its job should be narrow:

- enrich one selected lead
- detect missing contact data
- summarize changed evidence
- flag identity/contact/source risk
- suggest workflow state changes such as verify first or follow up due
- update lead context from email replies only after the email connection exists

It should not sell, scrape private profiles, generate ready-to-send outreach, call, email, or override seller judgment.

## Archived / Paused From Main Path

- demo generator
- landing-page test project beyond frontend sandbox use
- website redesign-specific product framing
- AI outreach/call scripts
- Proff dependency
- SSB market context
- broad OSINT scraping
- complex multi-agent orchestration
- historical monitoring
- Lighthouse
- parallel workers

## Operating Principle

The current question is not whether Webconsult can find opportunities. It can.

The current question is:

```text
Can Lead Machine become the seller desk a salesperson opens every morning to know who to call, what happened last, and what to do next?
```
