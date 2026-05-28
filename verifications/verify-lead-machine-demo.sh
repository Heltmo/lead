#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
demo_dir="$repo_root/demo/lead-machine-showcase"

required=(
  "$demo_dir/index.html"
  "$demo_dir/styles.css"
  "$demo_dir/app.js"
  "$demo_dir/README.md"
  "$demo_dir/demo-data/showcase.json"
  "$demo_dir/demo-data/advokater-gol-strict.json"
  "$demo_dir/demo-data/advokater-gol-regional.json"
  "$demo_dir/demo-data/pilot-leads.json"
)

for file in "${required[@]}"; do
  test -f "$file"
done

node - "$demo_dir" <<'NODE'
const fs = require('fs')
const path = require('path')
const demoDir = process.argv[2]
const read = (file) => fs.readFileSync(path.join(demoDir, file), 'utf8')

for (const file of ['demo-data/showcase.json', 'demo-data/advokater-gol-strict.json', 'demo-data/advokater-gol-regional.json', 'demo-data/pilot-leads.json']) {
  JSON.parse(read(file))
}

const index = read('index.html')
const styles = read('styles.css')
const app = read('app.js')
const readme = read('README.md')
const data = JSON.parse(read('demo-data/showcase.json'))
const allText = [index, styles, app, readme, JSON.stringify(data)].join('\\n').toLowerCase()

if (!index.includes('styles.css')) throw new Error('index.html must reference styles.css')
if (!index.includes('app.js')) throw new Error('index.html must reference app.js')
if (!allText.includes('machine provides')) throw new Error('product boundary must include Machine provides')
if (!allText.includes('seller owns')) throw new Error('product boundary must include Seller owns')
if (allText.includes('call opener')) throw new Error('demo must not include call openers')
if (allText.includes('ready-to-send')) throw new Error('demo must not include ready-to-send outreach copy')
if (allText.includes('suggested wording')) throw new Error('demo must not include suggested wording')
if (!Array.isArray(data.scenarios) || data.scenarios.length !== 3) throw new Error('showcase data must include three scenarios')
if (data.scenarios[0].id !== 'pilot-leads') throw new Error('default scenario should be seller-ready lead packs')
if (!data.scenarios.some((scenario) => scenario.searchScope === 'strict' && scenario.lowSupply === true)) throw new Error('strict low-supply scenario missing')
if (!data.scenarios.some((scenario) => scenario.searchScope === 'regional' && scenario.fallbackUsed === true)) throw new Error('regional fallback scenario missing')
const pilot = data.scenarios.find((scenario) => scenario.id === 'pilot-leads')
if (!pilot || pilot.leads.length < 5) throw new Error('pilot lead scenario must include five leads')
const firstLead = pilot.leads[0]
for (const field of ['companyName', 'phone', 'website', 'leadClass', 'opportunityType', 'companyProfile', 'workflow']) {
  if (!(field in firstLead)) throw new Error(`lead desk field missing: ${field}`)
}
if (!allText.includes('confirmed org.nr')) throw new Error('company profile card must expose confirmed org.nr')
if (!allText.includes('candidate org.nr')) throw new Error('company profile card must expose candidate org.nr')
if (!allText.includes('sales export preview')) throw new Error('CSV/export preview must be visible')
if (!app.includes('fallbackData')) throw new Error('app.js should include fallback data for direct file opening')
NODE
