function createDiscoveryReport({ query, industry, canonicalIndustry, industryTerm, expandedQueries = [], location, locationIntent, sourceFile, sourceFiles, provider, startedAt, rawResults = [], normalizedCandidates = [], candidates }) {
  const sources = sourceFiles || (sourceFile ? [sourceFile] : [])
  return {
    query,
    industry,
    canonicalIndustry: canonicalIndustry || industry || '',
    industryTerm: industryTerm || industry || '',
    expandedQueries,
    location,
    locationIntent: locationIntent || null,
    locationQuality: summarizeLocationQuality(candidates),
    sourceFile: sourceFile || sources[0] || '',
    sourceFiles: sources,
    provider: provider || null,
    startedAt,
    processedAt: new Date().toISOString(),
    totalRawCandidates: rawResults.length,
    invalidCandidates: Math.max(0, rawResults.length - normalizedCandidates.length),
    duplicatesRemoved: Math.max(0, normalizedCandidates.length - candidates.length),
    totalCandidates: candidates.length,
    reachableCandidates: candidates.filter((candidate) => candidate.websiteReachable === true).length,
    unreachableCandidates: candidates.filter((candidate) => candidate.websiteReachable === false).length,
    candidatesBySource: countBySource(candidates),
    candidatesBySourceType: countBySourceType(candidates),
    auditEligibleCandidates: candidates.filter((candidate) => candidate.auditEligible !== false).length,
    excludedCandidates: candidates.filter((candidate) => candidate.auditEligible === false).length,
    excludedTargets: excludedTargets(candidates),
    candidates,
  }
}

function summarizeLocationQuality(candidates) {
  const counts = {}
  let fallbackUsed = false
  for (const candidate of candidates) {
    const key = candidate.locationMatchStatus || candidate.locationQuality?.locationMatchStatus || 'unknown'
    counts[key] = (counts[key] || 0) + 1
    if (candidate.fallbackUsed || candidate.locationQuality?.fallbackUsed) fallbackUsed = true
  }
  return { counts, fallbackUsed }
}

function countBySourceType(candidates) {
  const counts = {}
  for (const candidate of candidates) {
    const key = candidate.sourceType || 'unknown'
    counts[key] = (counts[key] || 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)))
}

function excludedTargets(candidates) {
  return candidates
    .filter((candidate) => candidate.auditEligible === false)
    .map((candidate) => ({
      businessName: candidate.businessName || '',
      website: candidate.website,
      domain: candidate.normalizedDomain || '',
      sourceType: candidate.sourceType || 'unknown',
      reason: candidate.auditExclusionReason || '',
    }))
}

function countBySource(candidates) {
  const counts = {}
  for (const candidate of candidates) {
    const sources = candidate.sources && candidate.sources.length ? candidate.sources : [{ source: candidate.source || 'unknown' }]
    for (const item of sources) {
      const key = item.source || 'unknown'
      counts[key] = (counts[key] || 0) + 1
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)))
}

module.exports = { createDiscoveryReport, summarizeLocationQuality, countBySource, countBySourceType, excludedTargets }
