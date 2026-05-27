#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root/core/lead-pack-runner"
npm test
fixture_run="$repo_root/core/orchestrator/runs/tannleger-fredrikstad-places-5"
if [[ -f "$fixture_run/summary.json" ]]; then
  out_dir="$repo_root/core/lead-pack-runner/runs/verify-tannleger-fredrikstad"
  rm -rf "$out_dir"
  npm run lead-pack -- --run-dir "$fixture_run" --output-dir "$out_dir" --enrich-company-profile false >/tmp/lead-pack-runner-verify.json
  test -f "$out_dir/lead-packs.json"
  test -f "$out_dir/lead-packs.csv"
  test -f "$out_dir/summary.json"
  node -e "const fs=require('fs'); const p='$out_dir/lead-packs.json'; const leads=JSON.parse(fs.readFileSync(p,'utf8')); if(!leads.length) throw new Error('expected lead packs'); if(leads.some(l=>l.economy.status!=='not_enabled')) throw new Error('economy must be not_enabled'); if(JSON.stringify(leads).toLowerCase().includes('call opener')) throw new Error('lead packs must not contain sales scripts');"
fi
