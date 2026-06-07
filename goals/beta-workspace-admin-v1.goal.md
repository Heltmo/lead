# Beta Workspace Admin V1

## Objective

Make local and hosted beta data easier to inspect, export, and reset without adding dangerous seller-facing controls.

The beta should be recoverable when test data gets messy, and testers should not need technical knowledge to provide useful workspace snapshots.

## V1 Build

- Keep `/api/workspace-export` as the source of truth for snapshots.
- Add a clear beta/admin path for local reset documentation and hosted reset procedure.
- Add UI or internal affordance for downloading test data if it is not already visible enough.
- Keep destructive reset out of the normal seller flow unless protected by an explicit admin-only confirmation.

## Boundaries

Do not add auth, billing, CRM sync, email sending, telephony, sales scripts, broad scraping, or a one-click destructive reset in the seller workflow.

## Success Criteria

- A beta operator can export current workspace data before any reset.
- Local reset steps are documented and match the actual SQLite/JSON workspace paths.
- Hosted beta reset guidance is clear and does not risk deleting useful evidence before export.
- Existing beta preflight, seller work queue, and workspace export checks pass.
