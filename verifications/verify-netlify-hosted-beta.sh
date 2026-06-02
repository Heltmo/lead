#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required=(
  "$repo_root/netlify.toml"
  "$repo_root/package.json"
  "$repo_root/netlify/functions/api.js"
  "$repo_root/NETLIFY_BETA.md"
)
for file in "${required[@]}"; do
  test -f "$file"
done

node --check "$repo_root/netlify/functions/api.js"
node --check "$repo_root/apps/lead-machine-demo/public/app.js"
node --check "$repo_root/apps/lead-machine-demo/tests/smoke.test.js"
node "$repo_root/apps/lead-machine-demo/tests/smoke.test.js"

node - "$repo_root" <<'CHECK'
const fs = require("fs")
const path = require("path")
const root = process.argv[2]
const text = [
  fs.readFileSync(path.join(root, "netlify.toml"), "utf8"),
  fs.readFileSync(path.join(root, "package.json"), "utf8"),
  fs.readFileSync(path.join(root, "netlify/functions/api.js"), "utf8"),
  fs.readFileSync(path.join(root, "apps/lead-machine-demo/public/app.js"), "utf8"),
  fs.readFileSync(path.join(root, "NETLIFY_BETA.md"), "utf8"),
].join("\n")
const lower = text.toLowerCase()
for (const required of [
  'publish = "apps/lead-machine-demo/public"',
  'from = "/api/*"',
  '@netlify/blobs',
  'beta_access_token',
  'x-beta-token',
  'apifetch',
  'withbetatoken',
  'lead-machine-hosted-seller-desk',
  'netlify/functions/api.js',
  'google_places_api_key',
]) {
  if (!lower.includes(required.toLowerCase())) throw new Error("Netlify hosted beta requirement missing: " + required)
}
for (const banned of ["ready-to-send", "auto-email", "send email", "call opener"]) {
  if (lower.includes(banned)) throw new Error("Banned hosted beta behavior found: " + banned)
}
CHECK

echo "netlify hosted beta: ok"
