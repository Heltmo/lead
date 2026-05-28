#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_dir="$repo_root/apps/lead-machine-demo"

required=(
  "$app_dir/package.json"
  "$app_dir/server.js"
  "$app_dir/queryParser.js"
  "$app_dir/public/index.html"
  "$app_dir/public/styles.css"
  "$app_dir/public/app.js"
  "$app_dir/tests/smoke.test.js"
  "$app_dir/README.md"
)
for file in "${required[@]}"; do
  test -f "$file"
done

node --check "$app_dir/server.js"
node --check "$app_dir/queryParser.js"
node --check "$app_dir/public/app.js"

cd "$app_dir"
npm test

node - "$app_dir" <<'NODE'
const fs = require('fs')
const path = require('path')
const appDir = process.argv[2]
const text = ['public/index.html', 'public/app.js', 'README.md'].map((file) => fs.readFileSync(path.join(appDir, file), 'utf8')).join('\\n').toLowerCase()
if (!text.includes('machine provides')) throw new Error('product boundary missing Machine provides')
if (!text.includes('seller owns')) throw new Error('product boundary missing Seller owns')
for (const banned of ['call opener', 'ready-to-send', 'suggested wording']) {
  if (text.includes(banned)) throw new Error(`banned sales script text found: ${banned}`)
}
NODE
