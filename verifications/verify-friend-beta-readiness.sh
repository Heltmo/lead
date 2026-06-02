#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_dir="$repo_root/apps/lead-machine-demo"

required=(
  "$repo_root/FRIEND_BETA_READINESS.md"
  "$app_dir/README.md"
  "$app_dir/package.json"
  "$app_dir/server.js"
  "$app_dir/localStore.js"
  "$app_dir/public/index.html"
  "$app_dir/public/app.js"
  "$app_dir/public/styles.css"
  "$app_dir/tests/smoke.test.js"
)
for file in "${required[@]}"; do
  test -f "$file"
done

node --check "$app_dir/server.js"
node --check "$app_dir/localStore.js"
node --check "$app_dir/public/app.js"
node --check "$app_dir/tests/smoke.test.js"
node "$app_dir/tests/smoke.test.js"

"$repo_root/verifications/verify-lead-machine-live-demo.sh"
"$repo_root/verifications/verify-product-readiness-v1.sh"
"$repo_root/verifications/verify-call-desk-polish-v1.sh"
"$repo_root/verifications/verify-saved-search-management-v1.sh"
"$repo_root/verifications/verify-osint-enrichment.sh"

node - "$repo_root" <<CHECK
const fs = require("fs")
const path = require("path")
const root = process.argv[2]
const guide = fs.readFileSync(path.join(root, "FRIEND_BETA_READINESS.md"), "utf8")
const readme = fs.readFileSync(path.join(root, "apps/lead-machine-demo/README.md"), "utf8")
const server = fs.readFileSync(path.join(root, "apps/lead-machine-demo/server.js"), "utf8")
const index = fs.readFileSync(path.join(root, "apps/lead-machine-demo/public/index.html"), "utf8")
const app = fs.readFileSync(path.join(root, "apps/lead-machine-demo/public/app.js"), "utf8")
const text = [guide, readme, server, index, app].join("\n")
const lower = text.toLowerCase()
for (const required of [
  "Friend Beta Readiness",
  "Lead Machine Local Seller Desk",
  "Lead Machine Seller Desk",
  "/api/health",
  "friend-beta-v1",
  "Do not expose the local server on the open internet",
  "No auth or hosted workspace yet",
  "No email connection yet",
  "workspace snapshot",
  "data-workspace-export",
]) {
  if (!text.includes(required)) throw new Error("Friend beta readiness missing: " + required)
}
for (const banned of ["ready-to-send", "call opener", "auto-email", "mass sending"]) {
  if (lower.includes(banned)) throw new Error("Friend beta includes banned product behavior: " + banned)
}
CHECK

echo "friend beta readiness: ok"
