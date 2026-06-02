#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_dir="$repo_root/apps/lead-machine-demo"

node --check "$app_dir/server.js"
node --check "$app_dir/public/app.js"
node --check "$app_dir/tests/smoke.test.js"
node "$app_dir/tests/smoke.test.js"

node - "$repo_root" <<'CHECK'
const fs = require('fs')
const path = require('path')
const root = process.argv[2]
const server = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/server.js'), 'utf8')
const app = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/public/app.js'), 'utf8')
const css = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/public/styles.css'), 'utf8')
const goal = fs.readFileSync(path.join(root, 'goals/workspace-visibility-v1.goal.md'), 'utf8')
const lower = [server, app, css, goal].join('\n').toLowerCase()
const implementationText = [server, app, css].join('\n').toLowerCase()

for (const required of [
  'buildworkspacesummary',
  'workflowleadcount',
  'savedsearchcount',
  'activitycount',
  'saved markets',
  'saved-market-panel',
  'leads with notes',
  'data-workspace-export',
  'exportworkspacesnapshot',
  '/api/workspace-export',
  'download test data',
]) {
  if (!lower.includes(required.toLowerCase())) throw new Error('Workspace visibility requirement missing: ' + required)
}

for (const banned of ['clear local workspace', 'delete workspace', 'data-workspace-clear', 'drop table']) {
  if (implementationText.includes(banned)) throw new Error('Destructive workspace UI found too early: ' + banned)
}
CHECK
