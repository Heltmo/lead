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
const app = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/public/app.js'), 'utf8')
const css = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/public/styles.css'), 'utf8')
const server = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/server.js'), 'utf8')
const goal = fs.readFileSync(path.join(root, 'goals/call-desk-polish-v1.goal.md'), 'utf8')
const text = [app, css, server, goal].join('\n').toLowerCase()
for (const required of [
  'function callreadiness',
  'ready_to_call',
  'verify_first',
  'needs_contact',
  'follow_up_due',
  'call-focus-strip',
  'current-readiness',
  'phone-ready',
  'slice(0, 8)',
  'leadcount',
  'phonecount',
]) {
  if (!text.includes(required)) throw new Error('Call desk polish requirement missing: ' + required)
}
for (const banned of ['call opener', 'ready-to-send', 'auto-email', 'send email']) {
  if (text.includes(banned)) throw new Error('Banned call desk behavior/text found: ' + banned)
}
CHECK
