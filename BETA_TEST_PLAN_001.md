# Beta Test Plan 001

## Purpose

Test whether Lead Machine works as a daily seller desk for two non-technical beta testers.

The test should answer whether a seller can:

- find leads
- understand lead quality
- decide whether to call, verify, follow up, or skip
- log outcomes
- set follow-ups
- use queues without help

This is not a test of architecture, new data providers, or automatic outreach.

## Test Setup

- Netlify beta URL: `https://YOUR-SITE.netlify.app/?beta=YOUR_TOKEN`
- `BETA_ACCESS_TOKEN` is required before sharing the hosted beta.
- `GOOGLE_PLACES_API_KEY` is required for live Google Places discovery.
- Hosted beta uses a shared beta workspace unless a separate workspace setup is explicitly provided.
- Treat all notes, queues, and follow-ups as beta test state.
- No 1881, Proff, or SSB provider is connected yet.
- No email automation is enabled.
- No real CRM sync is enabled.
- Hosted Verify & Enrich is a lightweight company/contact/source refresh, not full local deep enrichment.

## Scenario A: Local Trades

Search:

```text
rørlegger i Sarpsborg
```

Seller intent:

```text
general_b2b or telecom
```

Tasks:

1. Find 3 contactable leads.
2. Move one lead to `Ring nå`.
3. Move one lead to `Må verifiseres`.
4. Mark one lead as `Ikke relevant`.
5. Write down which lead you would call first and why.

## Scenario B: Vehicle Service

Search:

```text
bilverksted Kristiansand
```

Seller intent:

```text
ads_marketing or general_b2b
```

Tasks:

1. Inspect Proof & Confidence on at least 3 leads.
2. Identify one lead worth contacting.
3. Log one contact attempt.
4. Check whether the next action is clear.

## Scenario C: Personal Care

Search:

```text
frisør Halden
```

Seller intent:

```text
web_it or ads_marketing
```

Tasks:

1. Check whether the category and location feel right.
2. Move at least 2 leads into queues.
3. Note any irrelevant, duplicate, or uncertain result.
4. Explain what information was missing before calling.

## Scenario D: Follow-Up Workflow

Tasks:

1. Pick one lead with a phone number.
2. Log `No answer`.
3. Set next follow-up for tomorrow.
4. Verify it appears in the follow-up queue.
5. Confirm the queue behavior still makes sense the next time you inspect the lead.

## Success Criteria

- Tester understands lead cards within 2 minutes.
- Tester understands `Ring nå`, `Må verifiseres`, and `Oppfølging`.
- Tester can log an outcome without help.
- Tester can set a follow-up without help.
- Tester understands Proof & Confidence.
- Tester can explain why a lead is recommended.
- Tester can tell what data is missing or uncertain.
- Tester can identify one lead they would actually call.

## Failure Signals

- Tester does not understand what to do next.
- Tester cannot tell whether a lead is trustworthy.
- Tester ignores queues because they do not feel useful.
- Tester does not trust contact or company data.
- Tester thinks the product is trying to automate seller wording.
- Tester gets confused by shared beta state or storage.
- Tester cannot find the follow-up after setting it.

## Session Notes

Run each test session for 30 to 45 minutes. Do not explain every feature first. Give the tester the beta URL, the access token, and these scenarios, then observe where they stop or ask questions.

After the session, group feedback into:

- Did not understand
- Did not trust data
- Missing workflow
