#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
node --check "$repo_root/core/seller-fit/sellerFit.js"
node "$repo_root/core/seller-fit/tests/smoke.test.js"
node - "$repo_root" <<'NODE'
const fs = require('fs')
const path = require('path')
const root = process.argv[2]
const text = [
  'core/seller-fit/README.md',
  'apps/lead-machine-demo/public/index.html',
  'apps/lead-machine-demo/public/app.js',
].map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n').toLowerCase()
for (const required of ['sellerfit', 'sellerintent', 'general_b2b', 'web_it', 'telecom', 'seller owns']) {
  if (!text.includes(required)) throw new Error(`missing seller-fit text: ${required}`)
}
for (const banned of ['call opener', 'ready-to-send', 'suggested wording']) {
  if (text.includes(banned)) throw new Error(`banned sales script text found: ${banned}`)
}
NODE
