#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app_dir="$repo_root/apps/lead-machine-demo"

node --check "$app_dir/localStore.js"
node --check "$app_dir/server.js"
node --check "$app_dir/tests/smoke.test.js"
node "$app_dir/tests/smoke.test.js"

node - "$repo_root" <<'CHECK'
const fs = require('fs')
const path = require('path')
const root = process.argv[2]
const localStore = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/localStore.js'), 'utf8')
const server = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/server.js'), 'utf8')
const smoke = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/tests/smoke.test.js'), 'utf8')
const goal = fs.readFileSync(path.join(root, 'goals/workspace-persistence-v1.goal.md'), 'utf8')
const haystack = [localStore, server, smoke, goal].join('\n')
const implementationText = [localStore, server].join('\n').toLowerCase()
const lower = haystack.toLowerCase()

for (const required of [
  'node:sqlite',
  'workspace.sqlite',
  'create table if not exists workflow_leads',
  'create table if not exists saved_searches',
  'create table if not exists activity_log',
  'schema_meta',
  'importlegacyjson',
  'exportsnapshot',
  '/api/workspace-export',
  'sqlite_local',
  'workspace should persist to a local sqlite database',
]) {
  if (!lower.includes(required.toLowerCase())) throw new Error('Workspace persistence requirement missing: ' + required)
}

for (const banned of ['supabase', 'postgres', 'auto-email', 'ready-to-send', 'call opener', 'telephony provider']) {
  if (implementationText.includes(banned)) throw new Error('Banned persistence behavior/text found: ' + banned)
}
CHECK
