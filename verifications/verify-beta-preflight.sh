#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

test -f BETA_PREFLIGHT_CHECKLIST.md
test -f BETA_TEST_SCRIPT_INTERNAL.md
test -f BETA_TEST_PLAN_001.md
test -f BETA_FEEDBACK_FORM.md
test -f BETA_KNOWN_LIMITATIONS.md
test -f BETA_WORKSPACE_ADMIN.md
test ! -f FRIEND_BETA_READINESS.md
test ! -f BETA_TEST_CHECKLIST.md
test ! -f KNOWN_LIMITATIONS.md
test ! -f verifications/verify-friend-beta-readiness.sh

node <<'ASSERTIONS'
const fs = require('fs')

const files = {
  preflight: fs.readFileSync('BETA_PREFLIGHT_CHECKLIST.md', 'utf8'),
  script: fs.readFileSync('BETA_TEST_SCRIPT_INTERNAL.md', 'utf8'),
  plan: fs.readFileSync('BETA_TEST_PLAN_001.md', 'utf8'),
  feedback: fs.readFileSync('BETA_FEEDBACK_FORM.md', 'utf8'),
  limitations: fs.readFileSync('BETA_KNOWN_LIMITATIONS.md', 'utf8'),
  readme: fs.readFileSync('README.md', 'utf8'),
  appReadme: fs.readFileSync('apps/lead-machine-demo/README.md', 'utf8'),
  operating: fs.readFileSync('OPERATING_GUIDE.md', 'utf8'),
  netlify: fs.readFileSync('NETLIFY_BETA.md', 'utf8'),
  admin: fs.readFileSync('BETA_WORKSPACE_ADMIN.md', 'utf8'),
}
const combined = Object.values(files).join(String.fromCharCode(10))
const lower = combined.toLowerCase()

for (const required of [
  'BETA_ACCESS_TOKEN',
  'GOOGLE_PLACES_API_KEY',
  'Proff is not required',
  '1881 is not required',
  'Hosted beta uses one shared beta workspace',
  './verifications/verify-beta-preflight.sh',
  'Reset And Recovery',
  'There is no dangerous reset button',
  'Search rørlegger i Sarpsborg',
  'Move one lead to Ring nå',
  'Move one lead to Må verifiseres',
  'Log No answer',
  'Set follow-up for tomorrow',
  'Mark one lead Ikke relevant',
  'Refresh the page',
  'Export or copy data',
  'BETA_FEEDBACK_FORM.md',
  'BETA_KNOWN_LIMITATIONS.md',
  'BETA_WORKSPACE_ADMIN.md',
  '/api/workspace-export',
  'source-of-truth snapshot before any reset',
  '.cache/lead-machine-demo/workspace.sqlite',
  '.cache/lead-machine-demo/lead-workflow.json',
  '/tmp/lead-machine-netlify-beta/hosted-state.json',
  'Move or rename',
  'do not immediately delete the only copy',
  'one shared beta workspace',
  'Netlify Blobs',
  'no seller-facing reset button',
]) {
  if (!combined.includes(required)) throw new Error('beta preflight missing: ' + required)
}

for (const required of [
  '1881 is not connected',
  'Proff is not connected',
  'No email sending is enabled',
  'No automatic outreach is enabled',
  'Hosted Verify & Enrich is lightweight',
]) {
  if (!files.limitations.includes(required)) throw new Error('known limitations missing: ' + required)
}

for (const stale of [
  'FRIEND_BETA_READINESS.md',
  'BETA_TEST_CHECKLIST.md',
  'verify-friend-beta-readiness.sh',
  'Use [FRIEND_BETA_READINESS.md]',
]) {
  if (combined.includes(stale)) throw new Error('stale beta reference remains: ' + stale)
}

for (const banned of [
  'ready-to-send',
  'call opener',
  'auto email',
  'automatic crm sync',
]) {
  if (lower.includes(banned)) throw new Error('beta preflight includes banned behavior: ' + banned)
}

console.log('beta preflight: ok')
ASSERTIONS
