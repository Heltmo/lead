const fs = require('fs')
const path = require('path')
const { loadDiscoverySources } = require('./providers/searchProvider')
const { loadLiveSearchResults } = require('./providers/liveSearchProvider')
const { createDiscoveryReport } = require('./reports/discoveryReport')
const { deduplicateCandidates, normalizeLeadCandidate, parseDiscoveryQuery } = require('./normalizers/leadCandidate')
const { validateWebsiteReachability } = require('./normalizers/websiteReachability')

async function discoverLocalBusinesses(options) {
  if (!options || (!options.sourceFile && !options.sourceFiles && !options.provider)) throw new Error('sourceFile, sourceFiles, or provider is required for discovery')
  const parsed = parseDiscoveryQuery(options.query || [options.industry, options.location].filter(Boolean).join(' in '))
  const industry = options.industry ? parseDiscoveryQuery(options.industry).industry : parsed.industry
  const canonicalIndustry = options.canonicalIndustry || parsed.canonicalIndustry || industry
  const industryTerm = options.industry || parsed.industryTerm || industry
  const location = options.location || parsed.location
  const query = options.query || [industryTerm, location].filter(Boolean).join(' in ')
  const expandedQueries = parsed.expandedQueries || []
  const industryTerms = parsed.industryTerms || [industryTerm, canonicalIndustry].filter(Boolean)
  const startedAt = new Date().toISOString()
  const sourceFiles = normalizeSourceFiles(options.sourceFiles || options.sourceFile)
  const resolvedSourceFiles = sourceFiles.map((sourceFile) => path.resolve(sourceFile))
  const sourceResults = resolvedSourceFiles.length ? loadDiscoverySources(resolvedSourceFiles, { industry, canonicalIndustry, industryTerms, location }) : []
  const providerResult = await loadLiveSearchResults({
    provider: options.provider,
    query,
    industry,
    canonicalIndustry,
    location,
    expandedQueries,
    maxResults: options.maxResults,
    maxProviderQueries: options.maxProviderQueries,
    dryRun: options.dryRun,
    env: options.env,
    fetchImpl: options.fetchImpl,
    mockResults: options.mockResults,
    mockResultsPath: options.mockResultsPath,
    braveEndpoint: options.braveEndpoint,
    googlePlacesEndpoint: options.googlePlacesEndpoint,
    languageCode: options.languageCode,
    regionCode: options.regionCode,
  })
  const rawResults = [...sourceResults, ...providerResult.rows]
  const normalized = rawResults
    .map((row) => normalizeLeadCandidate(row, { industry, canonicalIndustry, location, source: row.source || options.sourceName || 'fixed-sample', sourceFile: row.sourceFile, sourceFormat: row.sourceFormat }))
    .filter(Boolean)
  const candidates = deduplicateCandidates(normalized)
  if (options.validate !== false && !options.dryRun) {
    for (const candidate of candidates) {
      candidate.reachability = await validateWebsiteReachability(candidate.website, { timeoutMs: options.timeoutMs })
      candidate.websiteReachable = candidate.reachability.reachable
    }
  }
  const report = createDiscoveryReport({
    query,
    industry,
    canonicalIndustry,
    industryTerm,
    expandedQueries,
    location,
    sourceFiles: resolvedSourceFiles,
    provider: providerResult.plan,
    startedAt,
    rawResults,
    normalizedCandidates: normalized,
    candidates,
  })
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
  fs.writeFileSync(handoffPath, `${report.candidates.filter((candidate) => shouldIncludeInHandoff(candidate, options)).map(formatHandoffCandidate).join('\n')}\n`)
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
  })
}

function shouldIncludeInHandoff(candidate, options = {}) {
  if (candidate.websiteReachable === false) return false
  if (options.includeNonAuditTargets) return true
  return candidate.auditEligible !== false
}

function toSummary(report) {
  return {
    query: report.query,
    industry: report.industry,
    canonicalIndustry: report.canonicalIndustry,
    industryTerm: report.industryTerm,
    expandedQueries: report.expandedQueries,
    location: report.location,
    sourceFile: report.sourceFile,
    sourceFiles: report.sourceFiles,
    provider: report.provider,
    processedAt: report.processedAt,
    totalRawCandidates: report.totalRawCandidates,
    invalidCandidates: report.invalidCandidates,
    duplicatesRemoved: report.duplicatesRemoved,
    totalCandidates: report.totalCandidates,
    reachableCandidates: report.reachableCandidates,
    unreachableCandidates: report.unreachableCandidates,
    candidatesBySource: report.candidatesBySource,
    candidatesBySourceType: report.candidatesBySourceType,
    auditEligibleCandidates: report.auditEligibleCandidates,
    excludedCandidates: report.excludedCandidates,
    excludedTargets: report.excludedTargets,
    handoffReadyCandidates: report.candidates.filter((candidate) => shouldIncludeInHandoff(candidate)).length,
  }
}

function normalizeSourceFiles(value) {
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item || '').split(','))
    .map((item) => item.trim())
    .filter(Boolean)
}

module.exports = { discoverLocalBusinesses, writeDiscoveryOutputs, toSummary, normalizeSourceFiles, formatHandoffCandidate, shouldIncludeInHandoff }
