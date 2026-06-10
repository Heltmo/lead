#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_dir="$repo_root/apps/lead-machine-demo"

node --check "$app_dir/server.js"
node --check "$app_dir/localStore.js"
node --check "$app_dir/public/app.js"
node --check "$app_dir/tests/smoke.test.js"
node "$app_dir/tests/smoke.test.js"

node - "$repo_root" <<'CHECK'
const fs = require('fs')
const path = require('path')
const root = process.argv[2]
const server = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/server.js'), 'utf8')
const store = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/localStore.js'), 'utf8')
const app = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/public/app.js'), 'utf8')
const css = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/public/styles.css'), 'utf8')
const goal = fs.readFileSync(path.join(root, 'goals/saved-search-management-v1.goal.md'), 'utf8')
const lower = [server, store, app, css, goal].join('\n').toLowerCase()
const implementation = [server, store, app, css].join('\n').toLowerCase()

// Saved-search persistence stays server-side (it feeds the command center and
// workspace export); the management UI was removed when the seller desk was
// refocused on website sales, so UI controls are banned below.
for (const required of [
  '/api/saved-searches',
  'handlesavedsearchpatch',
  'sortsavedsearches',
  'pinned',
  'label',
  'limit 30',
]) {
  if (!lower.includes(required.toLowerCase())) throw new Error('Saved search management requirement missing: ' + required)
}

for (const banned of ['data-saved-search', 'saved-search-management', 'delete saved search', 'clear local workspace', 'drop table']) {
  if (implementation.includes(banned)) throw new Error('Saved-search behavior that should stay removed/never exist found: ' + banned)
}
CHECK
