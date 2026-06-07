# Email Connection Plan V1

## Objective

Design email-connected activity before implementation.

Lead Machine should eventually attach email events to leads and workspaces, but it must not become an automated outreach sender.

## V1 Build

- Define Gmail and Outlook OAuth scope boundaries.
- Choose manual email logging first, then later reply/activity sync.
- Define how email events attach to workspace, lead, and contact records.
- Document privacy, consent, retention, and tester limitations.

## Boundaries

Do not add mass sending, ready-to-send outreach, generated email copy, automatic email sending, CRM sync, private-person profiling, or broad mailbox mining.

## Success Criteria

- OAuth scopes are minimal and justified.
- Email event shape is documented before code.
- Manual logging is clearly separated from sync and sending.
- Product copy remains honest about what the system does and does not do.
