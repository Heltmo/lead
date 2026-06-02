# Workspace Persistence V1

## Objective

Make Lead Machine usable across working sessions with durable local storage for seller workflow, recent searches, and activity history.

The product should keep local continuity without adding SaaS auth, shared teams, CRM sync, email sending, telephony, billing, Proff dependency, or SSB.

## Storage Model

Use a local SQLite workspace database:

```txt
.cache/lead-machine-demo/workspace.sqlite
```

The SQLite workspace stores:

- lead workflow state
- saved/recent searches
- activity log entries
- schema metadata

Existing JSON files remain import/fallback inputs:

- `.cache/lead-machine-demo/lead-workflow.json`
- `.cache/lead-machine-demo/saved-searches.json`

## V1 Build

- `apps/lead-machine-demo/localStore.js`
- SQLite tables for workflow leads, saved searches, activity log, and schema metadata
- automatic one-time import from existing JSON state
- JSON fallback if SQLite is unavailable
- `/api/workspace-export` snapshot endpoint
- readiness payload reports `sqlite_local`
- smoke tests prove workflow/search persistence and export state

## Boundaries

Do not add external database hosting, Supabase/Postgres, auth, billing, CRM sync, email sending, telephony, outreach automation, Proff dependency, SSB, or sales scripts.

## Success Criteria

- Runs create/update the local SQLite workspace.
- Saved searches survive latest-run reloads.
- Workflow saves persist and attach back to later lead payloads.
- Activity log entries are visible in workspace export.
- Old JSON workflow/search files can be imported.
- Existing seller-fit, OSINT, product-readiness, live-demo, and lead-pack verifiers still pass.
