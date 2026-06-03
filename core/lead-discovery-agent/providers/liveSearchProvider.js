const fs = require('fs')
const { normalizeBusinessName, normalizeLocation } = require('../normalizers/leadCandidate')
const { findNaceForIndustry, municipalityCodeFor } = require('../normalizers/naceMapping')

const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search'
const GOOGLE_PLACES_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'
const BRREG_ENDPOINT = 'https://data.brreg.no/enhetsregisteret/api/enheter'

async function loadLiveSearchResults(options = {}) {
  const provider = normalizeProvider(options.provider)
  if (!provider) return createEmptyProviderResult(options)
  const plan = createProviderPlan(options)
  if (options.dryRun) return { plan, rows: [] }
  if ((options.mockResults || options.mockResultsPath) && !['brreg', 'balanced'].includes(provider)) return { plan, rows: loadMockRows(options, plan) }
  if (provider === 'mock') return { plan, rows: loadMockRows(options, plan) }
  if (provider === 'brave') return fetchBraveRows(options, plan)
  if (provider === 'google-places') return fetchGooglePlacesRows(options, plan)
  if (provider === 'brreg') return fetchBrregRows(options, plan)
  if (provider === 'balanced') return fetchBalancedRows(options, plan)
  throw new Error('Unsupported discovery provider: ' + provider)
}

function createProviderPlan(options = {}) {
  const provider = normalizeProvider(options.provider)
  const maxResults = normalizeMaxResults(options.maxResults)
  const queries = createSearchQueries(options).slice(0, normalizeMaxProviderQueries(options.maxProviderQueries))
  const nace = findNaceForIndustry({ canonicalIndustry: options.canonicalIndustry, industry: options.industry, query: options.query })
  return {
    provider,
    dryRun: Boolean(options.dryRun),
    maxResults,
    queries,
    brreg: {
      naceCodes: nace.map((item) => item.code),
      municipalityCode: municipalityCodeFor(options.location),
      location: options.location || '',
    },
  }
}

function createSearchQueries(options = {}) {
  const seen = new Set()
  const values = [options.query, ...(options.expandedQueries || [])]
    .map((query) => String(query || '').trim())
    .filter(Boolean)
  const result = []
  for (const query of values) {
    if (shouldAddNorwayContext(options)) addUniqueQuery(result, seen, withNorwayContext(query))
    addUniqueQuery(result, seen, query)
  }
  return result
}

function addUniqueQuery(result, seen, query) {
  const value = String(query || '').trim()
  const key = value.toLowerCase()
  if (!value || seen.has(key)) return
  seen.add(key)
  result.push(value)
}

function shouldAddNorwayContext(options = {}) {
  if (options.location) return false
  const region = String(options.regionCode || 'NO').toUpperCase()
  return region === 'NO'
}

function withNorwayContext(query = '') {
  const text = String(query || '').trim()
  return /\b(norge|norway)\b/i.test(text) ? text : text + ' Norge'
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

async function fetchBalancedRows(options, plan) {
  const rows = []
  const providerPlan = { ...plan, provider: 'balanced', providers: ['brreg', 'google-places'] }
  const brregPlan = { ...plan, provider: 'brreg', maxResults: plan.maxResults }
  const googlePlan = { ...plan, provider: 'google-places', maxResults: plan.maxResults }
  const errors = []

  try {
    const brregResult = await fetchBrregRows({ ...options, provider: 'brreg' }, brregPlan)
    rows.push(...brregResult.rows)
  } catch (error) {
    errors.push('brreg:' + (error?.message || 'failed'))
  }

  try {
    const googleResult = await fetchGooglePlacesRows({ ...options, provider: 'google-places' }, googlePlan)
    rows.push(...googleResult.rows)
  } catch (error) {
    if (options.mockResults || options.mockResultsPath) throw error
    errors.push('google-places:' + (error?.message || 'failed'))
  }

  return { plan: { ...providerPlan, errors }, rows: rows.slice(0, plan.maxResults * 2) }
}

async function fetchGooglePlacesRows(options, plan) {
  if (options.mockResults || options.mockResultsPath) {
    return { plan, rows: loadMockRows(options, { ...plan, provider: 'google-places' }) }
  }
  const apiKey = (options.env || process.env).GOOGLE_PLACES_API_KEY
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is required for --provider google-places. Use --dry-run true to inspect queries without calling Google Places.')
  const fetchImpl = options.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required for the Google Places provider.')
  const rows = []
  for (const query of plan.queries) {
    if (rows.length >= plan.maxResults) break
    const response = await fetchImpl(options.googlePlacesEndpoint || GOOGLE_PLACES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': googlePlacesFieldMask(),
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: Math.min(20, plan.maxResults - rows.length),
        languageCode: options.languageCode || 'no',
        regionCode: options.regionCode || 'NO',
        locationRestriction: norwayLocationRestriction(options),
      }),
    })
    if (!response.ok) throw new Error('Google Places provider failed with HTTP ' + response.status)
    const payload = await response.json()
    const results = extractProviderResults(payload)
    for (const result of results) {
      if (rows.length >= plan.maxResults) break
      rows.push(normalizeProviderResult(result, {
        provider: 'google-places',
        query,
        location: options.location,
        industry: options.canonicalIndustry || options.industry,
        confidence: 'high',
        rank: rows.length + 1,
      }))
    }
  }
  return { plan, rows }
}

function norwayLocationRestriction(options = {}) {
  const region = String(options.regionCode || 'NO').toUpperCase()
  if (region !== 'NO') return undefined
  return {
    rectangle: {
      low: { latitude: 57.8, longitude: 4.0 },
      high: { latitude: 71.5, longitude: 31.5 },
    },
  }
}

function googlePlacesFieldMask() {
  return [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.businessStatus',
    'places.rating',
    'places.userRatingCount',
    'places.types',
    'places.primaryType',
    'places.primaryTypeDisplayName',
    'places.location',
  ].join(',')
}

async function fetchBrregRows(options, plan) {
  if (options.mockResults || options.mockResultsPath) {
    const payload = options.mockResults || readJson(options.mockResultsPath)
    return { plan, rows: normalizeBrregRows(extractBrregResults(payload), options, plan) }
  }
  const fetchImpl = options.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required for the Brreg provider.')
  const rows = []
  const naceCodes = plan.brreg?.naceCodes?.length ? plan.brreg.naceCodes : ['']
  for (const naceCode of naceCodes) {
    if (rows.length >= plan.maxResults) break
    const url = new URL(options.brregEndpoint || BRREG_ENDPOINT)
    url.searchParams.set('size', String(Math.min(100, Math.max(20, plan.maxResults))))
    if (naceCode) url.searchParams.set('naeringskode', naceCode)
    if (plan.brreg?.municipalityCode) url.searchParams.set('kommunenummer', plan.brreg.municipalityCode)
    if (!naceCode) url.searchParams.set('navn', plan.queries[0] || options.query || '')
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('Brreg provider failed with HTTP ' + response.status)
    const payload = await response.json()
    const entities = extractBrregResults(payload)
    rows.push(...normalizeBrregRows(entities, options, plan, rows.length))
  }
  return { plan, rows: rows.slice(0, plan.maxResults) }
}

function normalizeBrregRows(entities, options = {}, plan = {}, offset = 0) {
  return entities.slice(0, Math.max(1, plan.maxResults || 10)).map((entity, index) => normalizeBrregEntity(entity, {
    provider: 'brreg',
    query: plan.queries?.[0] || options.query || '',
    location: options.location,
    industry: options.canonicalIndustry || options.industry,
    rank: offset + index + 1,
  }))
}

function normalizeBrregEntity(entity = {}, defaults = {}) {
  const address = normalizeBrregAddress(entity.forretningsadresse || entity.postadresse || {})
  const website = cleanText(entity.hjemmeside || entity.homepage || '')
  const orgNumber = cleanText(entity.organisasjonsnummer)
  const legalName = cleanText(entity.navn)
  const nace = entity.naeringskode1 || {}
  const sourceUrl = cleanText(entity._links?.self?.href || (orgNumber ? `${BRREG_ENDPOINT}/${orgNumber}` : ''))
  return {
    businessName: legalName,
    legalName,
    candidateLegalName: legalName,
    organizationNumber: orgNumber,
    candidateOrganizationNumber: orgNumber,
    organizationForm: cleanText(entity.organisasjonsform?.beskrivelse || entity.organisasjonsform?.kode),
    registeredAddress: address.full,
    municipality: cleanText(address.municipality || entity.forretningsadresse?.kommune || entity.postadresse?.kommune),
    unitType: 'enhet',
    naceCode: cleanText(nace.kode),
    naceDescription: cleanText(nace.beskrivelse),
    employees: normalizeNumber(entity.antallAnsatte),
    registrationDate: cleanText(entity.registreringsdatoEnhetsregisteret),
    activeStatus: entity.konkurs ? 'bankrupt' : (entity.underAvvikling ? 'winding_down' : 'active'),
    sourceUrl,
    website,
    source: 'brreg:' + (defaults.query || defaults.industry || 'official-registry'),
    sourceFormat: 'provider',
    provider: 'brreg',
    searchQuery: defaults.query,
    rank: defaults.rank,
    location: address.full || defaults.location || '',
    industry: defaults.industry || '',
    confidence: 'high',
    description: [nace.kode, nace.beskrivelse].filter(Boolean).join(' - '),
    phone: cleanText(entity.telefon || entity.mobil),
    address: address.full,
    sourceType: 'officialRegistry',
    auditEligible: Boolean(website),
    auditExclusionReason: website ? '' : 'missing_website_for_audit',
    identitySource: 'brreg',
    presenceSource: website ? 'brreg_homepage' : '',
  }
}

function normalizeBrregAddress(address = {}) {
  const lines = Array.isArray(address.adresse) ? address.adresse : [address.adresse].filter(Boolean)
  const postnummer = cleanText(address.postnummer)
  const poststed = cleanText(address.poststed)
  const municipality = cleanText(address.kommune)
  const full = [...lines.map(cleanText).filter(Boolean), [postnummer, poststed].filter(Boolean).join(' '), municipality].filter(Boolean).join(', ')
  return { full, municipality }
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

function normalizeProviderResult(result, defaults = {}) {
  const website = result.website || result.websiteUri || result.url || result.link || ''
  const businessName = selectProviderBusinessName(result, website)
  const provider = cleanText(defaults.provider) || 'provider'
  const query = cleanText(defaults.query)
  const source = query ? provider + ':' + query : provider
  const location = normalizeLocation(result.location || result.formattedAddress || result.formatted_address, '')
  return {
    businessName,
    website,
    source,
    sourceFormat: 'provider',
    provider,
    searchQuery: query,
    rank: defaults.rank,
    location,
    industry: cleanText(result.industry) || defaults.industry || '',
    confidence: result.confidence || defaults.confidence || 'medium',
    description: cleanText(result.description || result.snippet || ''),
    phone: cleanText(result.phone || result.nationalPhoneNumber || result.internationalPhoneNumber || ''),
    address: cleanText(result.address || result.formattedAddress || result.formatted_address || ''),
    placeId: cleanText(result.placeId || result.place_id || result.id || ''),
    rating: normalizeNumber(result.rating),
    reviewCount: normalizeNumber(result.reviewCount || result.userRatingCount || result.user_ratings_total),
    businessStatus: cleanText(result.businessStatus || result.business_status || ''),
    providerTypes: Array.isArray(result.types) ? result.types.filter(Boolean).map(cleanText).filter(Boolean) : [],
    providerTitle: cleanText(result.title || result.name || ''),
    providerDisplayUrl: cleanText(result.displayUrl || result.display_url || result.meta_url?.netloc || result.meta_url?.hostname || ''),
    presenceSource: provider,
  }
}

function selectProviderBusinessName(result, website) {
  const explicit = [
    result.businessName,
    result.business_name,
    result.displayName?.text,
    result.displayName,
    result.organization?.name,
    result.place?.name,
    result.profile?.long_name,
    result.profile?.name,
  ].map((value) => normalizeBusinessName(value, website)).find(Boolean)
  const title = stripSearchTitle(result.title || result.name || '', website)
  const fallback = domainBusinessName(website)
  return [explicit, title, fallback].find(Boolean) || ''
}

function extractProviderResults(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.results)) return payload.results
  if (Array.isArray(payload.places)) return payload.places
  if (payload.web && Array.isArray(payload.web.results)) return payload.web.results
  if (payload.response && Array.isArray(payload.response.results)) return payload.response.results
  return []
}

function extractBrregResults(payload) {
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.enheter)) return payload.enheter
  if (payload._embedded && Array.isArray(payload._embedded.enheter)) return payload._embedded.enheter
  if (Array.isArray(payload.results)) return payload.results
  return []
}

function stripSearchTitle(value, website = '') {
  return normalizeBusinessName(cleanText(value), website)
}

function domainBusinessName(website) {
  try {
    const hostname = new URL(/^https?:\/\//i.test(website) ? website : 'https://' + website).hostname.replace(/^www\./, '')
    const label = hostname.split('.')[0].replace(/[-_]+/g, ' ')
    return label.replace(/\b\w/g, (char) => char.toUpperCase())
  } catch {
    return ''
  }
}

function normalizeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : ''
}

function cleanText(value) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value).replace(/\s+/g, ' ').trim()
    : ''
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
  GOOGLE_PLACES_ENDPOINT,
  BRREG_ENDPOINT,
  loadLiveSearchResults,
  createProviderPlan,
  createSearchQueries,
  extractProviderResults,
  extractBrregResults,
  normalizeProviderResult,
  normalizeBrregEntity,
  googlePlacesFieldMask,
  stripSearchTitle,
}
