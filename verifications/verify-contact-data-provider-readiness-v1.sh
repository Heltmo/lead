#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

test -f core/contact-data/contactData.js
test -f core/contact-data/tests/smoke.test.js
test -f CONTACT_DATA_PROVIDERS_V1.md

node --check core/contact-data/contactData.js
node --check core/source-fusion/sourceFusion.js
node core/contact-data/tests/smoke.test.js
node core/source-fusion/tests/smoke.test.js

node <<'ASSERTIONS'
const fs = require('fs')
const contactData = fs.readFileSync('core/contact-data/contactData.js', 'utf8')
const sourceFusion = fs.readFileSync('core/source-fusion/sourceFusion.js', 'utf8')
const docs = fs.readFileSync('CONTACT_DATA_PROVIDERS_V1.md', 'utf8').toLowerCase()
const app = fs.readFileSync('apps/lead-machine-demo/public/app.js', 'utf8').toLowerCase()

for (const required of [
  'searchContactData',
  'lookupContactData',
  'normalizeContactProviderResult',
  'contactProviderEvidenceForSourceFusion',
  'rawAvailable: false',
  'Private-person enrichment is not supported',
  'Contact provider conflicts with existing contact evidence.',
]) {
  if (!contactData.includes(required)) throw new Error('missing contact provider readiness string: ' + required)
}

for (const required of [
  'contactProviderEvidenceForSourceFusion',
  'contact_provider',
]) {
  if (!sourceFusion.includes(required)) throw new Error('source fusion missing contact provider integration: ' + required)
}

for (const required of [
  'provider data is evidence, not truth',
  'proff is separate commercial and economy context',
  'no scraping is included',
  'legal/api terms review',
]) {
  if (!docs.includes(required)) throw new Error('docs missing required provider boundary: ' + required)
}

for (const banned of ['call opener', 'ready-to-send', 'suggested wording']) {
  if (app.includes(banned)) throw new Error('banned outreach/script text found in UI: ' + banned)
}

for (const banned of ['fetch(', 'axios', '1881.no', 'gulesider.no', 'eniro.no']) {
  if (contactData.toLowerCase().includes(banned)) throw new Error('contact provider boundary must not make live calls or scrape: ' + banned)
}
ASSERTIONS

echo "contact data provider readiness v1: ok"
