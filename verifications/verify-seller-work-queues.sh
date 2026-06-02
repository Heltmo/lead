#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_dir="$repo_root/apps/lead-machine-demo"

test -f "$repo_root/SELLER_WORK_QUEUES_V1.md"
test -f "$app_dir/workQueues.js"

node --check "$app_dir/workQueues.js"
node --check "$app_dir/server.js"
node --check "$app_dir/public/app.js"
node --check "$repo_root/netlify/functions/api.js"
node "$app_dir/tests/smoke.test.js"

node - "$repo_root" <<'NODECHECK'
const fs = require("fs")
const path = require("path")
const root = process.argv[2]
const files = [
  "SELLER_WORK_QUEUES_V1.md",
  "apps/lead-machine-demo/workQueues.js",
  "apps/lead-machine-demo/public/index.html",
  "apps/lead-machine-demo/public/app.js",
  "netlify/functions/api.js",
]
const text = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n").toLowerCase()
const required = [
  "call_now",
  "no_answer",
  "follow_up_today",
  "interested",
  "verify_first",
  "not_relevant",
  "archived",
  "ring nå",
  "ingen svar",
  "oppfølging i dag",
  "må verifiseres",
  "workflowqueue",
  "nextfollowupat",
  "lastcontactedat",
  "data-archive-lead",
]
for (const item of required) {
  if (!text.includes(item)) throw new Error(`missing seller work queue text: ${item}`)
}
for (const banned of ["call opener", "ready-to-send", "suggested wording"]) {
  if (text.includes(banned)) throw new Error(`banned outreach/script text found: ${banned}`)
}
NODECHECK

echo "seller work queues: ok"
