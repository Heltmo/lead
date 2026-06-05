const NORWAY_SWEEP_CITIES = [
  'Oslo',
  'Bergen',
  'Trondheim',
  'Stavanger',
  'Kristiansand',
  'Drammen',
  'Fredrikstad',
  'Tromsø',
  'Bodø',
  'Ålesund',
  'Sandefjord',
  'Skien',
]

const NORWAY_SWEEP_MAX_RESULTS = 60
const NORWAY_SWEEP_DEFAULT_RESULTS = 60
const NORWAY_SWEEP_PER_CITY_RESULTS = 5

function buildNorwaySweepRunOptions({ parsedQuery = {}, searchScope = 'strict', requestedMaxResults } = {}) {
  const enabled = shouldUseNorwaySweep({ parsedQuery, searchScope })
  if (!enabled) return {
    marketSweep: false,
    searchScope: normalizeSearchScope(searchScope),
    maxResults: normalizeMaxResults(requestedMaxResults, 25, 25),
    maxResultsCap: 25,
    maxProviderQueries: 4,
    perProviderQueryMaxResults: null,
    cities: [],
  }

  const requested = Number(requestedMaxResults)
  const maxResults = Number.isFinite(requested) && requested > 25
    ? normalizeMaxResults(requested, NORWAY_SWEEP_DEFAULT_RESULTS, NORWAY_SWEEP_MAX_RESULTS)
    : NORWAY_SWEEP_DEFAULT_RESULTS
  const maxProviderQueries = Math.min(NORWAY_SWEEP_CITIES.length, Math.ceil(maxResults / NORWAY_SWEEP_PER_CITY_RESULTS))
  return {
    marketSweep: true,
    searchScope: 'regional',
    reason: 'no_location_norway_sweep',
    maxResults,
    maxResultsCap: NORWAY_SWEEP_MAX_RESULTS,
    maxProviderQueries,
    perProviderQueryMaxResults: NORWAY_SWEEP_PER_CITY_RESULTS,
    cities: NORWAY_SWEEP_CITIES.slice(0, maxProviderQueries),
  }
}

function shouldUseNorwaySweep({ parsedQuery = {} } = {}) {
  if (parsedQuery.location) return false
  return Boolean(parsedQuery.normalizedQuery || parsedQuery.originalQuery || parsedQuery.rawQuery)
}

function createNorwaySweepQueries(baseQuery = '', cities = NORWAY_SWEEP_CITIES) {
  const term = String(baseQuery || '').trim()
  if (!term) return []
  return cities.map((city) => termIncludesLocation(term, city) ? term : term + ' i ' + city)
}

function normalizeProviderSweepOptions(options = {}) {
  const enabled = options.marketSweep === true || options.marketSweep === 'true'
  const maxResults = normalizeMaxResults(options.maxResults, NORWAY_SWEEP_DEFAULT_RESULTS, NORWAY_SWEEP_MAX_RESULTS)
  const perCity = normalizeMaxResults(options.perProviderQueryMaxResults, NORWAY_SWEEP_PER_CITY_RESULTS, 10)
  const maxCities = Math.min(NORWAY_SWEEP_CITIES.length, normalizeMaxResults(options.maxProviderQueries, Math.ceil(maxResults / perCity), NORWAY_SWEEP_CITIES.length))
  const cities = Array.isArray(options.marketSweepCities) && options.marketSweepCities.length
    ? options.marketSweepCities.map((city) => String(city || '').trim()).filter(Boolean).slice(0, maxCities)
    : NORWAY_SWEEP_CITIES.slice(0, maxCities)
  return {
    enabled,
    maxResults,
    perCity,
    maxCities,
    cities,
  }
}

function termIncludesLocation(term, city) {
  return normalizeText(term).includes(normalizeText(city))
}

function normalizeSearchScope(value) {
  const scope = String(value || '').toLowerCase()
  return ['strict', 'nearby', 'regional'].includes(scope) ? scope : 'strict'
}

function normalizeMaxResults(value, fallback, cap) {
  const number = Number(value)
  const maximum = Number(cap || fallback || 25)
  if (!Number.isFinite(number) || number <= 0) return fallback
  return Math.min(Math.floor(number), maximum)
}

function normalizeText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

module.exports = {
  NORWAY_SWEEP_CITIES,
  NORWAY_SWEEP_MAX_RESULTS,
  NORWAY_SWEEP_DEFAULT_RESULTS,
  NORWAY_SWEEP_PER_CITY_RESULTS,
  buildNorwaySweepRunOptions,
  shouldUseNorwaySweep,
  createNorwaySweepQueries,
  normalizeProviderSweepOptions,
  normalizeSearchScope,
}
