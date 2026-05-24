#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
orchestrator_dir="$repo_root/core/orchestrator"

cd "$orchestrator_dir"
node tests/smoke.test.js
