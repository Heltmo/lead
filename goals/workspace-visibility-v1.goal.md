# Workspace Visibility V1

## Objective

Make local storage visible and understandable in the Lead Machine UI without turning the product into an admin/settings tool.

The seller should know that workflow, notes, activity, and recent searches are saved locally, and should be able to export a snapshot when needed.

## V1 Build

- Keep workspace storage mode, path, workflow count, activity count, and recent-search count in the readiness payload.
- Show a simple saved-markets panel with saved searches and leads-with-notes count.
- Add a seller-facing `Download test data` action wired to `/api/workspace-export`.
- Avoid internal storage/path diagnostics on the main seller screen.

## Boundary

Do not add clear/delete workspace yet. Do not add auth, hosted database, CRM sync, email sending, telephony, or outreach automation.

Clear/delete can come later behind a confirmation flow after the workspace model is more mature.

## Success Criteria

- Readiness payload includes workspace visibility data.
- Seller UI shows saved markets and noted-lead counts without internal workspace diagnostics.
- Download test data exports the local workspace JSON snapshot.
- Existing workflow and persistence tests still pass.
