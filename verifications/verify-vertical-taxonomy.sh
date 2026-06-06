#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required=(
  "$repo_root/core/vertical-taxonomy/verticalTaxonomy.js"
  "$repo_root/core/vertical-taxonomy/tests/smoke.test.js"
  "$repo_root/core/vertical-taxonomy/README.md"
  "$repo_root/PRODUCT_SMOKE_TEST_VERTICAL_TAXONOMY_001.md"
)
for file in "${required[@]}"; do
  test -f "$file"
done

node --check "$repo_root/core/vertical-taxonomy/verticalTaxonomy.js"
node --check "$repo_root/core/vertical-taxonomy/tests/smoke.test.js"
node --check "$repo_root/core/lead-discovery-agent/taxonomy/industryTaxonomy.js"
node --check "$repo_root/core/lead-discovery-agent/discoverLocalBusinesses.js"
node --check "$repo_root/apps/lead-machine-demo/queryParser.js"
node --check "$repo_root/apps/lead-machine-demo/public/app.js"

node "$repo_root/core/vertical-taxonomy/tests/smoke.test.js"
node "$repo_root/core/lead-discovery-agent/tests/smoke.test.js"
node "$repo_root/apps/lead-machine-demo/tests/smoke.test.js"

combined_text="$(cat "$repo_root/core/vertical-taxonomy/README.md" "$repo_root/PRODUCT_SMOKE_TEST_VERTICAL_TAXONOMY_001.md" "$repo_root/apps/lead-machine-demo/public/app.js")"
for required_text in "personlig trener" "hudpleie" "verticalMatchStatus" "No 1881" "No Proff"; do
  grep -q "$required_text" <<<"$combined_text"
done
for banned in "call opener" "ready-to-send" "suggested wording"; do
  if grep -qi "$banned" <<<"$combined_text"; then
    echo "banned sales script text found: $banned" >&2
    exit 1
  fi
done
