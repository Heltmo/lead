#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

node --check "$repo_root/core/osint/osint.js"
node "$repo_root/core/osint/tests/smoke.test.js"
node --check "$repo_root/apps/lead-machine-demo/server.js"
node --check "$repo_root/apps/lead-machine-demo/public/app.js"
(cd "$repo_root/apps/lead-machine-demo" && npm test)

node - "$repo_root" <<'CHECK'
const fs = require('fs')
const path = require('path')
const root = process.argv[2]
const { enrichOsint, GROUPS } = require(path.join(root, 'core/osint/osint'))

const lead = {
  company: {
    displayName: 'Verifier AS',
    legalName: 'VERIFIER AS',
    organizationNumber: '999111222',
    matchStatus: 'exact_match',
    matchConfidence: 0.95,
    activeStatus: 'active',
    employees: 8,
    naceCode: '62.010',
    naceDescription: 'Computer programming',
    source: 'brreg',
    sourceUrl: 'https://data.brreg.no/enhetsregisteret/api/enheter/999111222',
  },
  contact: { phone: '40000000', website: 'https://verifier.example', city: 'Oslo' },
  places: { rating: 4.7, reviewCount: 12, provider: 'google_places', url: 'https://maps.example/verifier' },
  sourceQuality: { locationMatchStatus: 'exact_location', discoveryQuality: { level: 'high', score: 91 } },
  website: { auditStatus: 'completed', contactability: 'strong', topEvidence: ['Contact page found'] },
  ranking: { whyRanked: ['Digital presence supports qualification'], caution: ['Verify final company identity before export'] },
}
const { osint } = enrichOsint(lead, { sellerIntent: 'general_b2b', observedAt: '2026-05-31T00:00:00.000Z' })
for (const group of GROUPS) {
  if (!Array.isArray(osint[group])) throw new Error('OSINT group missing: ' + group)
}
if (!osint.sources.length) throw new Error('OSINT sources are missing')
for (const source of osint.sources) {
  if (!source.name) throw new Error('OSINT source missing name')
  if (!source.url && !source.unavailableReason) throw new Error('OSINT source missing url/unavailable reason')
  if (!source.observedAt) throw new Error('OSINT source missing timestamp')
  if (!source.confidence) throw new Error('OSINT source missing confidence')
}
if (!osint.summary || osint.summary.evidenceCount < 4) throw new Error('OSINT summary evidence count is too low')

const server = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/server.js'), 'utf8')
const app = fs.readFileSync(path.join(root, 'apps/lead-machine-demo/public/app.js'), 'utf8')
if (!server.includes('attachOsintToLead')) throw new Error('selected-lead enrichment does not attach OSINT')
if (!server.includes('osintEvidenceCount')) throw new Error('CSV export is missing OSINT evidence column')
if (!app.includes('OSINT public evidence')) throw new Error('UI is missing OSINT public evidence panel/module')
if (!app.includes('osintExportCell')) throw new Error('export preview is missing OSINT cell helper')

const banned = ['personal dossier', 'private profile scrape', 'CAPTCHA bypass', 'ready-to-send', 'call opener', 'auto-email']
const haystack = [server, app, fs.readFileSync(path.join(root, 'core/osint/osint.js'), 'utf8')].join('\n').toLowerCase()
for (const phrase of banned) {
  if (haystack.includes(phrase.toLowerCase())) throw new Error('Banned OSINT behavior text found: ' + phrase)
}
CHECK
