const { parseIndustryQuery } = require('../taxonomy/industryTaxonomy')

function parseDiscoveryQuery(query = '') {
  return parseIndustryQuery(query)
}

function normalizeLeadCandidate(raw, defaults = {}) {
  const website = normalizeWebsiteUrl(raw.website || raw.url || raw.link)
  if (!website) return null
  const source = String(raw.source || defaults.source || 'sample').trim()
  const sourceFile = String(raw.sourceFile || defaults.sourceFile || '').trim()
  const sourceFormat = String(raw.sourceFormat || defaults.sourceFormat || '').trim()
  return {
    businessName: String(raw.businessName || raw.name || raw.title || '').trim(),
    website,
    source,
    sources: uniqueSources([{ source, sourceFile, sourceFormat }]),
    location: String(raw.location || defaults.location || '').trim(),
    industry: String(raw.industry || defaults.canonicalIndustry || defaults.industry || '').trim(),
    confidence: normalizeConfidence(raw.confidence),
    normalizedDomain: normalizeDomain(website),
    websiteReachable: null,
    reachability: null,
  }
}

function deduplicateCandidates(candidates) {
  const byDomain = new Map()
  for (const candidate of candidates) {
    if (!candidate || !candidate.normalizedDomain) continue
    const existing = byDomain.get(candidate.normalizedDomain)
    if (!existing) {
      byDomain.set(candidate.normalizedDomain, { ...candidate, sources: uniqueSources(candidate.sources || []) })
      continue
    }
    existing.sources = uniqueSources([...(existing.sources || []), ...(candidate.sources || [])])
    existing.source = existing.sources.map((item) => item.source).filter(Boolean).join('|') || existing.source
    existing.businessName = existing.businessName || candidate.businessName
    existing.location = existing.location || candidate.location
    existing.industry = existing.industry || candidate.industry
    existing.confidence = bestConfidence(existing.confidence, candidate.confidence)
  }
  return [...byDomain.values()]
}

function normalizeWebsiteUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withScheme)
    url.hash = ''
    return url.href.replace(/\/$/, '')
  } catch {
    return ''
  }
}

function normalizeDomain(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function normalizeConfidence(value) {
  return ['high', 'medium', 'low'].includes(value) ? value : 'medium'
}

function bestConfidence(left, right) {
  const order = { high: 3, medium: 2, low: 1 }
  return (order[normalizeConfidence(right)] > order[normalizeConfidence(left)]) ? normalizeConfidence(right) : normalizeConfidence(left)
}


function uniqueSources(sources) {
  const seen = new Set()
  const result = []
  for (const item of sources) {
    const source = String(item.source || '').trim()
    const sourceFile = String(item.sourceFile || '').trim()
    const sourceFormat = String(item.sourceFormat || '').trim()
    const key = [source, sourceFile, sourceFormat].join('|')
    if (!source || seen.has(key)) continue
    seen.add(key)
    result.push({ source, sourceFile, sourceFormat })
  }
  return result
}

module.exports = { parseDiscoveryQuery, normalizeLeadCandidate, deduplicateCandidates, normalizeWebsiteUrl, normalizeDomain, uniqueSources }
