# Beta Workspace Admin And Recovery

Use this guide when a local or hosted beta workspace gets messy before, during, or after a controlled test session. This is an operator/admin procedure only. Do not add a seller-facing reset/delete button or any one-click destructive control to the normal Lead Machine seller desk.

## Recovery Principle

`/api/workspace-export` is the source-of-truth snapshot before any reset.

Before moving, deleting, clearing, redeploying, or replacing workspace state:

1. Open the beta app while the current workspace still loads.
2. Use the visible `Download test data` / workspace export action, or request `/api/workspace-export` with the same beta token/session context.
3. Save the exported JSON somewhere outside the app cache or Netlify runtime.
4. Note the beta URL without exposing the token, tester names, search terms, and what action caused the problem.

If the app cannot export because the server/runtime is broken, preserve the raw workspace files or hosted state before trying a reset.

## Local Workspace Files

Local seller-desk state is stored under the repository cache:

- SQLite workspace: `.cache/lead-machine-demo/workspace.sqlite`
- Legacy/import workflow JSON: `.cache/lead-machine-demo/lead-workflow.json`

The SQLite workspace is the active local store when `node:sqlite` is available. The legacy JSON file may still matter because a fresh SQLite workspace imports it once when the workspace is created.

## Safe Local Reset

Use move/rename first. Do not immediately delete the only copy of the workspace.

```bash
cd /home/xman/webconsult
```

1. Stop the local server in `apps/lead-machine-demo`.
2. Export a snapshot first when possible:
   - use the app's `Download test data` button, or
   - request `http://127.0.0.1:8787/api/workspace-export` while the server still runs.
3. Create an archive directory outside the active cache:

   ```bash
   mkdir -p .cache/lead-machine-demo/recovery
   stamp="$(date +%Y%m%d-%H%M%S)"
   ```

4. Move/rename the active SQLite files instead of deleting them:

   ```bash
   mv .cache/lead-machine-demo/workspace.sqlite ".cache/lead-machine-demo/recovery/workspace.$stamp.sqlite" 2>/dev/null || true
   mv .cache/lead-machine-demo/workspace.sqlite-shm ".cache/lead-machine-demo/recovery/workspace.$stamp.sqlite-shm" 2>/dev/null || true
   mv .cache/lead-machine-demo/workspace.sqlite-wal ".cache/lead-machine-demo/recovery/workspace.$stamp.sqlite-wal" 2>/dev/null || true
   ```

5. If you need to prevent legacy JSON from re-importing old workflow state, move/rename it too, after saving a snapshot or copy:

   ```bash
   mv .cache/lead-machine-demo/lead-workflow.json ".cache/lead-machine-demo/recovery/lead-workflow.$stamp.json" 2>/dev/null || true
   ```

6. Restart the local server:

   ```bash
   cd apps/lead-machine-demo
   npm run dev
   ```

7. Rerun focused beta checks before another test session:

   ```bash
   cd /home/xman/webconsult
   ./verifications/verify-beta-preflight.sh
   npm run netlify:check
   ```

## Hosted Netlify Beta Recovery

Hosted beta currently uses one shared beta workspace for invited testers. Treat hosted state as shared test data, not per-user data.

1. Export a snapshot first from the hosted app or `/api/workspace-export` before clearing or replacing state.
2. Save the exported JSON outside Netlify and record the beta URL without the token, tester names, and search terms.
3. Netlify deploys use the `lead-machine-beta` Netlify Blobs store when available.
4. Local Netlify Function tests without Netlify Blobs fall back to `/tmp/lead-machine-netlify-beta/hosted-state.json`. That `/tmp` JSON is runtime-local and can disappear between environments or restarts.
5. Clear Netlify Blobs or use a fresh Netlify deploy/site only after the snapshot is saved and the operator accepts that the shared beta workspace will reset for all testers.
6. Do not expose a seller-facing reset button. There is no seller-facing reset button in V1; hosted reset/clear actions belong in operator tooling or Netlify administration, not in the normal seller workflow.

## After Recovery

Before returning to testers:

```bash
cd /home/xman/webconsult
./verifications/verify-beta-preflight.sh
npm run netlify:check
./verifications/verify-netlify-hosted-beta.sh
```

Then run the beta dogfood path from `BETA_PREFLIGHT_CHECKLIST.md` and confirm notes, queues, follow-ups, activity history, and export still work.
