#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_dir="$repo_root/apps/lead-machine-demo"

test -f "$repo_root/SOURCE_FUSION_V1.md"
test -f "$repo_root/core/source-fusion/sourceFusion.js"
test -f "$repo_root/core/source-fusion/tests/smoke.test.js"

node --check "$repo_root/core/source-fusion/sourceFusion.js"
node --check "$app_dir/server.js"
node --check "$app_dir/public/app.js"
node --check "$repo_root/netlify/functions/api.js"
node "$repo_root/core/source-fusion/tests/smoke.test.js"
node "$app_dir/tests/smoke.test.js"

node - "$repo_root" <<'NODECHECK'
const fs = require('fs')
const path = require('path')
const root = process.argv[2]
const files = [
  'SOURCE_FUSION_V1.md',
  'core/source-fusion/sourceFusion.js',
  'apps/lead-machine-demo/server.js',
  'apps/lead-machine-demo/public/app.js',
  'netlify/functions/api.js',
]
const text = files.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n').toLowerCase()
const required = [
  'leadconfidence',
  'identityconfidence',
  'contactconfidence',
  'locationconfidence',
  'recommendedtrustaction',
  'sourcecoverage',
  'verifiedfields',
  'proof & confidence',
  'trygg å ringe',
  'verifiser først',
  'svak/usikker',
  '1881 can later improve',
  'proff can later improve',
]
for (const item of required) {
  if (!text.includes(item)) throw new Error('missing source fusion text: ' + item)
}
for (const banned of ['call opener', 'ready-to-send', 'suggested wording']) {
  if (text.includes(banned)) throw new Error('banned outreach/script text found: ' + banned)
}
NODECHECK

echo "source fusion: ok"
