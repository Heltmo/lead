#!/usr/bin/env bash
set -euo pipefail

project_dir="${1:-$(pwd)}"

cd "$project_dir"
npm run lint
npm run build

if npm run | grep -q "test:visual"; then
  npm run test:visual
fi
