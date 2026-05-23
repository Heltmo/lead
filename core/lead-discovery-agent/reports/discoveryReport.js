function createDiscoveryReport({ query, industry, canonicalIndustry, industryTerm, expandedQueries = [], location, sourceFile, sourceFiles, provider, startedAt, rawResults = [], normalizedCandidates = [], candidates }) {
  const sources = sourceFiles || (sourceFile ? [sourceFile] : [])
  return {
    query,
    industry,
    canonicalIndustry: canonicalIndustry || industry || '',
    industryTerm: industryTerm || industry || '',
    expandedQueries,
    location,
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
    candidates,
  }
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

module.exports = { createDiscoveryReport, countBySource }
