# Saved Search Management V1

## Objective

Turn recent searches into a small seller workspace tool instead of a short history strip.

Saved searches should help a seller return to useful markets such as `Tannleger Halden`, `Rørleggere Kristiansand`, or `Advokater Oslo` without reremembering exact query/seller-intent/geography settings.

## V1 Build

- Show the full local saved-search list from the workspace store.
- Keep rerun from saved search.
- Add stable saved-search keys.
- Add editable display label.
- Add pinned/favorite state.
- Sort pinned searches first, then newest searches.
- Persist metadata in the existing SQLite workspace.

## Boundary

Do not add delete/clear workspace yet.
Do not add CRM sync, outreach automation, email sending, telephony, auth, billing, Proff, or SSB.

## Success Criteria

- Saved search metadata survives latest-run reloads.
- Pinned searches sort before unpinned searches.
- UI supports Pin, Rename, and Rerun.
- Existing workspace persistence and live demo verifiers pass.

## Status 2026-06-10

The management UI (list with pin/rename/rerun) was removed from the seller desk when the product refocused on website-sales leads: it crowded out the search-and-call flow without helping the seller decide who to call. Saved searches still persist server-side with pin/label metadata (`/api/saved-searches`), feeding the command center and workspace export. Revisit a minimal saved-markets surface only if real seller usage asks for it.
