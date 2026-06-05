#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_dir="$repo_root/apps/lead-machine-demo"
module_dir="$repo_root/core/opportunity-command-center"

test -f "$repo_root/goals/opportunity-command-center-v1.goal.md"
test -f "$module_dir/opportunityCommandCenter.js"
test -f "$module_dir/tests/smoke.test.js"

node --check "$module_dir/opportunityCommandCenter.js"
node --check "$module_dir/tests/smoke.test.js"
node --check "$app_dir/server.js"
node --check "$app_dir/public/app.js"
node --check "$repo_root/netlify/functions/api.js"
node "$module_dir/tests/smoke.test.js"
node "$app_dir/tests/smoke.test.js"

node - "$repo_root" <<'NODECHECK'
const fs = require('fs')
const path = require('path')
const root = process.argv[2]
const files = [
  'goals/opportunity-command-center-v1.goal.md',
  'core/opportunity-command-center/opportunityCommandCenter.js',
  'apps/lead-machine-demo/server.js',
  'apps/lead-machine-demo/public/app.js',
  'apps/lead-machine-demo/public/index.html',
  'netlify/functions/api.js',
]
const text = files.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n')
const implementationFiles = files.filter((file) => !file.startsWith('goals/'))
const implementationText = implementationFiles.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n').toLowerCase()
const lower = text.toLowerCase()
for (const required of [
  '/api/opportunity-command-center',
  'buildopportunitycommandcenter',
  'topactions',
  'callthesefirst',
  'verifybeforecalling',
  'overduefollowups',
  'bestmarketsnow',
  'wastedtimewarnings',
  'sourcewarnings',
  'opportunity-command-center',
  'today / command center',
  'data-command-queue',
  'data-command-lead-id',
]) {
  if (!lower.includes(required)) throw new Error('missing command center requirement: ' + required)
}
for (const banned of ['sales script', 'ready-to-send', 'auto email', 'auto call', 'call opener']) {
  if (implementationText.includes(banned)) throw new Error('banned command center behavior/text found: ' + banned)
}
NODECHECK

echo "opportunity command center v1: ok"
