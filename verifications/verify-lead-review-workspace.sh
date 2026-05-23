#!/usr/bin/env bash
set -euo pipefail

workspace_dir="$HOME/webconsult/core/lead-review-workspace"

cd "$workspace_dir"
npm test
