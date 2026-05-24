#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
runner_dir="$repo_root/core/campaign-runner"

cd "$runner_dir"
npm test
