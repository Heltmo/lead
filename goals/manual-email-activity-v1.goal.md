# Manual Email Activity V1

## Objective

Let sellers manually log email-related activity against a lead before any mailbox sync or sending is implemented.

This extends activity history while preserving seller control.

## V1 Build

- Add manual activity type for email sent, email received, and email follow-up needed.
- Attach each event to lead, workspace, timestamp, and optional note.
- Show email activity in the lead history and export.
- Keep the action manual and seller-entered.

## Boundaries

Do not connect Gmail/Outlook yet. Do not send email, generate outreach copy, scrape inboxes, sync CRM, or infer private-person profiles.

## Success Criteria

- Email activity can be logged manually.
- Email activity appears in activity history and export.
- Follow-up queue behavior remains explicit and seller-controlled.
- Existing workflow, export, and Netlify checks pass.
