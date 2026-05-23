const fs = require('fs')
const path = require('path')
const { loadFixedSearchResults } = require('./providers/searchProvider')
const { createDiscoveryReport } = require('./reports/discoveryReport')
const { deduplicateCandidates, normalizeLeadCandidate, parseDiscoveryQuery } = require('./normalizers/leadCandidate')
const { validateWebsiteReachability } = require('./normalizers/websiteReachability')

async function discoverLocalBusinesses(options) {
  if (!options || !options.sourceFile) throw new Error('sourceFile is required for deterministic discovery')
  const parsed = parseDiscoveryQuery(options.query || '')
  const industry = options.industry || parsed.industry
  const location = options.location || parsed.location
  const query = options.query || [industry, location].filter(Boolean).join(' in ')
  const startedAt = new Date().toISOString()
  const sourceFile = path.resolve(options.sourceFile)
  const rawResults = loadFixedSearchResults(sourceFile, { industry, location })
  const normalized = rawResults
    .map((row) => normalizeLeadCandidate(row, { industry, location, source: options.sourceName || 'fixed-sample' }))
    .filter(Boolean)
  const candidates = deduplicateCandidates(normalized)
  if (options.validate !== false) {
    for (const candidate of candidates) {
      candidate.reachability = await validateWebsiteReachability(candidate.website, { timeoutMs: options.timeoutMs })
      candidate.websiteReachable = candidate.reachability.reachable
    }
  }
  const report = createDiscoveryReport({ query, industry, location, sourceFile, startedAt, candidates })
  return report
}

function writeDiscoveryOutputs(report, options = {}) {
  const outPath = path.resolve(options.outPath || 'reports/lead-candidates.json')
  const summaryPath = path.resolve(options.summaryPath || 'reports/discovery-summary.json')
  const handoffPath = path.resolve(options.handoffPath || 'reports/orchestrator-urls.txt')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true })
  fs.mkdirSync(path.dirname(handoffPath), { recursive: true })
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(summaryPath, `${JSON.stringify(toSummary(report), null, 2)}\n`)
  fs.writeFileSync(handoffPath, `${report.candidates.filter((candidate) => candidate.websiteReachable !== false).map((candidate) => candidate.website).join('\n')}\n`)
  return { candidatesPath: outPath, summaryPath, handoffPath }
}

function toSummary(report) {
  return {
    query: report.query,
    industry: report.industry,
    location: report.location,
    sourceFile: report.sourceFile,
    processedAt: report.processedAt,
    totalCandidates: report.totalCandidates,
    reachableCandidates: report.reachableCandidates,
    unreachableCandidates: report.unreachableCandidates,
    handoffReadyCandidates: report.candidates.filter((candidate) => candidate.websiteReachable !== false).length,
  }
}

module.exports = { discoverLocalBusinesses, writeDiscoveryOutputs, toSummary }
