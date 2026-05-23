const fs = require('fs')

const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search'

async function loadLiveSearchResults(options = {}) {
  const provider = normalizeProvider(options.provider)
  if (!provider) return createEmptyProviderResult(options)
  const plan = createProviderPlan(options)
  if (options.dryRun) return { plan, rows: [] }
  if (provider === 'mock') return { plan, rows: loadMockRows(options, plan) }
  if (provider === 'brave') return fetchBraveRows(options, plan)
  throw new Error('Unsupported discovery provider: ' + provider)
}

function createProviderPlan(options = {}) {
  const provider = normalizeProvider(options.provider)
  const maxResults = normalizeMaxResults(options.maxResults)
  const queries = createSearchQueries(options).slice(0, normalizeMaxProviderQueries(options.maxProviderQueries))
  return {
    provider,
    dryRun: Boolean(options.dryRun),
    maxResults,
    queries,
  }
}

function createSearchQueries(options = {}) {
  const seen = new Set()
  const values = [options.query, ...(options.expandedQueries || [])]
    .map((query) => String(query || '').trim())
    .filter(Boolean)
  const result = []
  for (const query of values) {
    const key = query.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(query)
  }
  return result
}

function loadMockRows(options, plan) {
  const payload = options.mockResults || readJson(options.mockResultsPath)
  const results = extractProviderResults(payload)
  return results.slice(0, plan.maxResults).map((result, index) => normalizeProviderResult(result, {
    provider: plan.provider,
    query: result.query || plan.queries[0] || options.query || '',
    location: options.location,
    industry: options.canonicalIndustry || options.industry,
    confidence: result.confidence || 'medium',
    rank: index + 1,
  }))
}

async function fetchBraveRows(options, plan) {
  const apiKey = (options.env || process.env).BRAVE_SEARCH_API_KEY
  if (!apiKey) throw new Error('BRAVE_SEARCH_API_KEY is required for --provider brave. Use --dry-run true to inspect queries without calling Brave.')
  const fetchImpl = options.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required for the Brave search provider.')
  const rows = []
  const perQueryCount = Math.max(1, Math.min(20, plan.maxResults))
  for (const query of plan.queries) {
    if (rows.length >= plan.maxResults) break
    const url = new URL(options.braveEndpoint || BRAVE_ENDPOINT)
    url.searchParams.set('q', query)
    url.searchParams.set('count', String(Math.min(perQueryCount, plan.maxResults - rows.length)))
    const response = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': apiKey,
      },
    })
    if (!response.ok) throw new Error('Brave search provider failed with HTTP ' + response.status)
    const payload = await response.json()
    const results = extractProviderResults(payload)
    for (const result of results) {
      if (rows.length >= plan.maxResults) break
      rows.push(normalizeProviderResult(result, {
        provider: plan.provider,
        query,
        location: options.location,
        industry: options.canonicalIndustry || options.industry,
        confidence: 'medium',
        rank: rows.length + 1,
      }))
    }
  }
  return { plan, rows }
}

function normalizeProviderResult(result, defaults) {
  return {
    businessName: stripSearchTitle(result.businessName || result.name || result.title || ''),
    website: result.website || result.url || result.link || '',
    source: defaults.provider + ':' + defaults.query,
    sourceFormat: 'provider',
    location: result.location || defaults.location || '',
    industry: result.industry || defaults.industry || '',
    confidence: result.confidence || defaults.confidence || 'medium',
    searchQuery: defaults.query,
    provider: defaults.provider,
    rank: defaults.rank,
    description: result.description || result.snippet || '',
  }
}

function extractProviderResults(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  if (payload.web && Array.isArray(payload.web.results)) return payload.web.results
  if (payload.response && Array.isArray(payload.response.results)) return payload.response.results
  return []
}

function stripSearchTitle(value) {
  return String(value || '')
    .replace(/\s+\|\s+.*$/g, '')
    .replace(/\s+-\s+.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function createEmptyProviderResult() {
  return { plan: null, rows: [] }
}

function normalizeProvider(value) {
  const provider = String(value || '').trim().toLowerCase()
  return provider === 'none' ? '' : provider
}

function normalizeMaxResults(value) {
  const number = Number(value || 10)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 10
}

function normalizeMaxProviderQueries(value) {
  const number = Number(value || 4)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 4
}

function readJson(filePath) {
  if (!filePath) return {}
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

module.exports = {
  BRAVE_ENDPOINT,
  loadLiveSearchResults,
  createProviderPlan,
  createSearchQueries,
  extractProviderResults,
  normalizeProviderResult,
}
