#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.input || args._[0]
  if (!input) throw new Error('Usage: node cli/handoff-candidates.js <lead-candidates.json> [--out reports/orchestrator-urls.txt] [--include-unreachable true] [--include-non-audit-targets true]')
  const report = JSON.parse(fs.readFileSync(input, 'utf8'))
  const includeUnreachable = args['include-unreachable'] === 'true'
  const includeNonAuditTargets = args['include-non-audit-targets'] === 'true'
  const lines = report.candidates
    .filter((candidate) => includeUnreachable || candidate.websiteReachable !== false)
    .filter((candidate) => includeNonAuditTargets || candidate.auditEligible !== false)
    .map(formatHandoffCandidate)
    .filter(Boolean)
  const outPath = path.resolve(args.out || 'reports/orchestrator-urls.txt')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, `${lines.join('\n')}\n`)
  console.log(JSON.stringify({ handoffPath: outPath, totalUrls: lines.length }, null, 2))
}

function formatHandoffCandidate(candidate) {
  if (!candidate.website) return ''
  return JSON.stringify({
    url: candidate.website,
    businessName: candidate.businessName || '',
    source: candidate.source || '',
    location: candidate.location || '',
    industry: candidate.industry || '',
    confidence: candidate.confidence || '',
    sources: candidate.sources || [],
    provenance: candidate.provenance || { sources: candidate.sources || [] },
    sourceType: candidate.sourceType || 'unknown',
    auditEligible: candidate.auditEligible !== false,
    auditExclusionReason: candidate.auditExclusionReason || '',
    phone: candidate.phone || '',
    address: candidate.address || '',
    placeId: candidate.placeId || '',
    rating: candidate.rating || '',
    reviewCount: candidate.reviewCount || '',
    businessStatus: candidate.businessStatus || '',
    providerTypes: candidate.providerTypes || [],
    requestedLocation: candidate.requestedLocation || '',
    candidateLocation: candidate.candidateLocation || '',
    candidateCity: candidate.candidateCity || '',
    locationMatchStatus: candidate.locationMatchStatus || 'unknown',
    locationConfidence: candidate.locationConfidence ?? '',
    distanceKm: candidate.distanceKm ?? '',
    locationWarnings: candidate.locationWarnings || [],
    fallbackUsed: Boolean(candidate.fallbackUsed),
    locationQuality: candidate.locationQuality || null,
  })
}

function parseArgs(args) {
  const parsed = { _: [] }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--')) { parsed[arg.slice(2)] = args[i + 1] ?? true; i += 1 } else { parsed._.push(arg) }
  }
  return parsed
}

try { main() } catch (error) { console.error(error); process.exit(1) }
