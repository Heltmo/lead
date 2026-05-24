#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
demo_generator_dir="$repo_root/core/demo-generator"

cd "$demo_generator_dir"
npm test
