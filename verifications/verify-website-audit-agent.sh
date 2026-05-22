#!/usr/bin/env bash
set -euo pipefail

agent_dir="$HOME/webconsult/core/website-audit-agent"

cd "$agent_dir"
npm test
