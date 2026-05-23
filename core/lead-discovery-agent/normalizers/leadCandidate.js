function parseDiscoveryQuery(query = '') {
  const cleaned = String(query).trim()
  const match = cleaned.match(/(.+?)\s+in\s+(.+)/i)
  if (match) return { industry: match[1].trim(), location: match[2].trim(), query: cleaned }
  return { industry: cleaned, location: '', query: cleaned }
}

function normalizeLeadCandidate(raw, defaults = {}) {
  const website = normalizeWebsiteUrl(raw.website || raw.url || raw.link)
  if (!website) return null
  return {
    businessName: String(raw.businessName || raw.name || raw.title || '').trim(),
    website,
    source: String(raw.source || defaults.source || 'sample').trim(),
    location: String(raw.location || defaults.location || '').trim(),
    industry: String(raw.industry || defaults.industry || '').trim(),
    confidence: normalizeConfidence(raw.confidence),
    normalizedDomain: normalizeDomain(website),
    websiteReachable: null,
    reachability: null,
  }
}

function deduplicateCandidates(candidates) {
  const seen = new Set()
  const deduped = []
  for (const candidate of candidates) {
    if (!candidate || !candidate.normalizedDomain || seen.has(candidate.normalizedDomain)) continue
    seen.add(candidate.normalizedDomain)
    deduped.push(candidate)
  }
  return deduped
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

module.exports = { parseDiscoveryQuery, normalizeLeadCandidate, deduplicateCandidates, normalizeWebsiteUrl, normalizeDomain }
