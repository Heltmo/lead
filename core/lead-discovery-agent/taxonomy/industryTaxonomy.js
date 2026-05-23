const industries = require('./industries.json')

function parseIndustryQuery(query = '') {
  const originalQuery = String(query || '').trim().replace(/\s+/g, ' ')
  const cleaned = stripFindPrefix(originalQuery)
  const explicit = parseExplicitLocation(cleaned)
  const parsed = explicit || parseAdjacentIndustryLocation(cleaned) || { industryTerm: cleaned, location: '' }
  const match = findIndustryByTerm(parsed.industryTerm)
  const canonicalIndustry = match?.entry?.canonical || singularize(parsed.industryTerm)
  const industryTerms = match ? allIndustryTerms(match.entry) : unique([parsed.industryTerm, canonicalIndustry].filter(Boolean))
  const expandedQueries = expandQueries({ originalQuery, canonicalIndustry, location: parsed.location, industryTerms, entry: match?.entry })
  return {
    query: originalQuery,
    industry: canonicalIndustry,
    industryTerm: parsed.industryTerm,
    canonicalIndustry,
    location: parsed.location,
    industryTerms,
    expandedQueries,
  }
}

function parseExplicitLocation(query) {
  const match = query.match(/^(.+?)\s+(?:in|i)\s+(.+)$/i)
  if (!match) return null
  return { industryTerm: match[1].trim(), location: match[2].trim() }
}

function parseAdjacentIndustryLocation(query) {
  const normalized = normalize(query)
  if (!normalized) return null
  const terms = taxonomyTerms().sort((a, b) => b.normalized.length - a.normalized.length)
  for (const term of terms) {
    if (normalized === term.normalized) return { industryTerm: term.term, location: '' }
    if (normalized.startsWith(term.normalized + ' ')) {
      return { industryTerm: term.term, location: query.slice(term.term.length).trim() }
    }
    if (normalized.endsWith(' ' + term.normalized)) {
      return { industryTerm: term.term, location: query.slice(0, query.length - term.term.length).trim() }
    }
  }
  return null
}

function expandQueries({ originalQuery, location, industryTerms, entry }) {
  const patterns = entry?.searchPatterns || ['{term} {location}', '{term} i {location}', '{location} {term}']
  const terms = industryTerms || []
  const queries = [originalQuery]
  for (const term of terms) {
    if (!term) continue
    if (!location) queries.push(term)
    for (const pattern of patterns) {
      if (!location && pattern.includes('{location}')) continue
      queries.push(pattern.replace('{term}', term).replace('{location}', location || '').replace(/\s+/g, ' ').trim())
    }
  }
  return unique(queries.filter(Boolean))
}

function findIndustryByTerm(term) {
  const normalized = normalize(term)
  if (!normalized) return null
  for (const [key, entry] of Object.entries(industries)) {
    if (allIndustryTerms(entry).some((candidate) => normalize(candidate) === normalized)) return { key, entry }
  }
  return null
}

function industryMatches(value, filters = {}) {
  const normalizedValue = normalize(value)
  if (!normalizedValue) return true
  const requestedTerms = filters.industryTerms && filters.industryTerms.length
    ? filters.industryTerms
    : [filters.industry, filters.canonicalIndustry].filter(Boolean)
  if (requestedTerms.length === 0) return true
  const expanded = unique(requestedTerms.flatMap((term) => {
    const match = findIndustryByTerm(term)
    return match ? allIndustryTerms(match.entry) : [term]
  }))
  return expanded.some((term) => looseTermMatch(normalizedValue, normalize(term)))
}

function looseTermMatch(value, term) {
  if (!value || !term) return false
  if (value === term) return true
  if (value.includes(term) || term.includes(value)) return true
  return singularize(value) === singularize(term)
}

function allIndustryTerms(entry) {
  return unique([entry.canonical, ...(entry.english || []), ...(entry.norwegian || [])].filter(Boolean))
}

function taxonomyTerms() {
  return Object.values(industries).flatMap((entry) => allIndustryTerms(entry).map((term) => ({ term, normalized: normalize(term) })))
}

function stripFindPrefix(query) {
  return String(query || '').replace(/^find\s+/i, '').trim()
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function singularize(value) {
  return normalize(value).replace(/s$/, '')
}

function unique(values) {
  const seen = new Set()
  const result = []
  for (const value of values) {
    const text = String(value || '').trim()
    const key = normalize(text)
    if (!text || seen.has(key)) continue
    seen.add(key)
    result.push(text)
  }
  return result
}

module.exports = {
  industries,
  parseIndustryQuery,
  expandQueries,
  findIndustryByTerm,
  industryMatches,
  allIndustryTerms,
  normalize,
}
