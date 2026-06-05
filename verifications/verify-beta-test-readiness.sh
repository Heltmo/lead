#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

test -f BETA_TEST_PLAN_001.md
test -f BETA_FEEDBACK_FORM.md
test -f BETA_KNOWN_LIMITATIONS.md

node <<'NODE'
const fs = require('fs')

const plan = fs.readFileSync('BETA_TEST_PLAN_001.md', 'utf8')
const feedback = fs.readFileSync('BETA_FEEDBACK_FORM.md', 'utf8')
const limitations = fs.readFileSync('BETA_KNOWN_LIMITATIONS.md', 'utf8')
const combined = [plan, feedback, limitations].join('\n')
const lower = combined.toLowerCase()

for (const required of [
  'Test whether Lead Machine works as a daily seller desk',
  'Netlify beta URL',
  'BETA_ACCESS_TOKEN',
  'GOOGLE_PLACES_API_KEY',
  'shared beta workspace',
  'rørlegger i Sarpsborg',
  'bilverksted Kristiansand',
  'frisør Halden',
  'Follow-Up Workflow',
  'Proof & Confidence',
  'Ring nå',
  'Må verifiseres',
  'Oppfølging',
  'Success Criteria',
  'Failure Signals',
]) {
  if (!combined.includes(required)) throw new Error('beta test readiness missing: ' + required)
}

for (const required of [
  'What did you search?',
  'Did the results match the location?',
  'Did you understand the lead card?',
  'Did Proof & Confidence help?',
  'Did `Ring nå` make sense?',
  'Could you log an outcome without help?',
  'Would you use this tomorrow?',
  'What would make this 10x more useful?',
  'Which lead would you call first, and why?',
]) {
  if (!feedback.includes(required)) throw new Error('feedback form missing: ' + required)
}

for (const required of [
  '1881 is not connected',
  'Proff is not connected',
  'SSB is not connected',
  'No email sending is enabled',
  'No private CRM sync is enabled',
  'No phone backend is enabled',
  'Hosted Verify & Enrich is lightweight',
  'No automatic outreach is enabled',
]) {
  if (!limitations.includes(required)) throw new Error('known limitations missing: ' + required)
}

for (const banned of [
  'ready-to-send',
  'call opener',
  'email template',
  'auto email',
  'automatic crm sync',
]) {
  if (lower.includes(banned)) throw new Error('beta readiness includes banned behavior: ' + banned)
}

console.log('beta test readiness: ok')
NODE
