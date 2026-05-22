#!/usr/bin/env bash
set -euo pipefail

orchestrator_dir="$HOME/webconsult/core/orchestrator"

cd "$orchestrator_dir"
node tests/smoke.test.js
