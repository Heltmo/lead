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
const index = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/public/index.html'), 'utf8')
const goal = fs.readFileSync(path.join(root, 'goals/product-readiness-v1.goal.md'), 'utf8')
const haystack = [server, app, index, goal].join('\n').toLowerCase()

for (const required of [
  'workspace.sqlite',
  'buildproductreadiness',
  'proff_free_ready',
  'disabled_optional',
  'google usage stays capped: 25 for normal searches, 60 for norway-sweep beta runs',
  'selectedleaddeeponly',
  'readinesspanel',
  'data-workspace-export',
  'sqlite_local',
]) {
  if (!haystack.includes(required.toLowerCase())) throw new Error('Product readiness requirement missing: ' + required)
}
for (const banned of ['proff is required', 'must buy proff', 'auto-email', 'ready-to-send', 'call opener']) {
  if (haystack.includes(banned)) throw new Error('Banned readiness behavior/text found: ' + banned)
}
CHECK
