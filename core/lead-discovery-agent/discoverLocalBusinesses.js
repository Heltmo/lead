const fs = require('fs')
const path = require('path')
const { loadDiscoverySources } = require('./providers/searchProvider')
const { createDiscoveryReport } = require('./reports/discoveryReport')
const { deduplicateCandidates, normalizeLeadCandidate, parseDiscoveryQuery } = require('./normalizers/leadCandidate')
const { validateWebsiteReachability } = require('./normalizers/websiteReachability')

async function discoverLocalBusinesses(options) {
  if (!options || (!options.sourceFile && !options.sourceFiles)) throw new Error('sourceFile or sourceFiles is required for deterministic discovery')
  const parsed = parseDiscoveryQuery(options.query || '')
  const industry = options.industry || parsed.industry
  const location = options.location || parsed.location
  const query = options.query || [industry, location].filter(Boolean).join(' in ')
  const startedAt = new Date().toISOString()
  const sourceFiles = normalizeSourceFiles(options.sourceFiles || options.sourceFile)
  const resolvedSourceFiles = sourceFiles.map((sourceFile) => path.resolve(sourceFile))
  const rawResults = loadDiscoverySources(resolvedSourceFiles, { industry, location })
  const normalized = rawResults
    .map((row) => normalizeLeadCandidate(row, { industry, location, source: options.sourceName || row.source || 'fixed-sample', sourceFile: row.sourceFile, sourceFormat: row.sourceFormat }))
    .filter(Boolean)
  const candidates = deduplicateCandidates(normalized)
  if (options.validate !== false) {
    for (const candidate of candidates) {
      candidate.reachability = await validateWebsiteReachability(candidate.website, { timeoutMs: options.timeoutMs })
      candidate.websiteReachable = candidate.reachability.reachable
    }
  }
  const report = createDiscoveryReport({ query, industry, location, sourceFiles: resolvedSourceFiles, startedAt, rawResults, normalizedCandidates: normalized, candidates })
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
  fs.writeFileSync(handoffPath, `${report.candidates.filter((candidate) => candidate.websiteReachable !== false).map(formatHandoffCandidate).join('\n')}\n`)
  return { candidatesPath: outPath, summaryPath, handoffPath }
}

function formatHandoffCandidate(candidate) {
  return JSON.stringify({
    url: candidate.website,
    businessName: candidate.businessName || '',
    source: candidate.source || '',
    location: candidate.location || '',
    industry: candidate.industry || '',
    confidence: candidate.confidence || '',
    sources: candidate.sources || [],
  })
}

function toSummary(report) {
  return {
    query: report.query,
    industry: report.industry,
    location: report.location,
    sourceFile: report.sourceFile,
    sourceFiles: report.sourceFiles,
    processedAt: report.processedAt,
    totalRawCandidates: report.totalRawCandidates,
    invalidCandidates: report.invalidCandidates,
    duplicatesRemoved: report.duplicatesRemoved,
    totalCandidates: report.totalCandidates,
    reachableCandidates: report.reachableCandidates,
    unreachableCandidates: report.unreachableCandidates,
    candidatesBySource: report.candidatesBySource,
    handoffReadyCandidates: report.candidates.filter((candidate) => candidate.websiteReachable !== false).length,
  }
}

function normalizeSourceFiles(value) {
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item || '').split(','))
    .map((item) => item.trim())
    .filter(Boolean)
}

module.exports = { discoverLocalBusinesses, writeDiscoveryOutputs, toSummary, normalizeSourceFiles, formatHandoffCandidate }
