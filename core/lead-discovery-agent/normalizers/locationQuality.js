function parseLocationIntent(query = '') {
  const text = clean(query)
  if (!text) return { vertical: '', requestedLocation: null, country: 'NO' }
  const explicit = text.match(/^(.+?)\s+(?:i|in)\s+(.+)$/i)
  if (explicit) {
    return {
      vertical: explicit[1].trim(),
      requestedLocation: explicit[2].trim() || null,
      country: 'NO',
    }
  }
  return { vertical: text, requestedLocation: null, country: 'NO' }
}

function buildLocationQuality(candidate = {}, requestedLocation = '') {
  const requested = clean(requestedLocation)
  const candidateAddress = clean(candidate.address || candidate.formattedAddress || candidate.formatted_address || candidate.location)
  const candidateCity = extractCity(candidateAddress || clean(candidate.location))
  if (!requested) {
    return {
      requestedLocation: null,
      candidateLocation: candidateAddress || null,
      candidateCity: candidateCity || null,
      locationMatchStatus: 'unknown',
      locationConfidence: 0,
      distanceKm: null,
      locationWarnings: ['requested_location_missing'],
      fallbackUsed: false,
    }
  }
  if (!candidateAddress && !candidateCity) {
    return {
      requestedLocation: requested,
      candidateLocation: null,
      candidateCity: null,
      locationMatchStatus: 'unknown',
      locationConfidence: 0.35,
      distanceKm: null,
      locationWarnings: ['candidate_location_unknown'],
      fallbackUsed: false,
    }
  }
  const requestedKey = normalizeLocationKey(requested)
  const addressKey = normalizeLocationKey(candidateAddress)
  const cityKey = normalizeLocationKey(candidateCity)
  const exact = Boolean(requestedKey && (cityKey === requestedKey || addressKey.includes(requestedKey)))
  if (exact) {
    return {
      requestedLocation: requested,
      candidateLocation: candidateAddress || candidateCity || null,
      candidateCity: candidateCity || requested,
      locationMatchStatus: 'exact_location',
      locationConfidence: 0.95,
      distanceKm: null,
      locationWarnings: [],
      fallbackUsed: false,
    }
  }
  return {
    requestedLocation: requested,
    candidateLocation: candidateAddress || candidateCity || null,
    candidateCity: candidateCity || null,
    locationMatchStatus: 'out_of_area',
    locationConfidence: 0.1,
    distanceKm: null,
    locationWarnings: ['candidate_appears_outside_requested_location'],
    fallbackUsed: false,
  }
}

function normalizeSearchScope(value = 'strict') {
  const scope = clean(value).toLowerCase().replace(/_/g, '-')
  if (scope === 'regional') return 'regional'
  if (scope === 'nearby') return 'nearby'
  return 'strict'
}

function shouldExcludeForLocation(candidate = {}, options = {}) {
  const quality = candidate.locationQuality || {}
  const searchScope = normalizeSearchScope(options.searchScope)
  if (!quality.requestedLocation) return false
  if (quality.locationMatchStatus !== 'out_of_area') return false
  return searchScope !== 'regional' && options.includeOutOfArea !== true
}

function applyLocationQuality(candidate = {}, options = {}) {
  const searchScope = normalizeSearchScope(options.searchScope)
  if (candidate.locationQuality?.locationMatchStatus === 'out_of_area' && (searchScope === 'regional' || options.includeOutOfArea)) {
    return {
      ...candidate,
      searchScope,
      fallbackUsed: true,
      locationMatchStatus: 'regional_fallback',
      locationWarnings: unique([...(candidate.locationWarnings || []), 'included_as_explicit_location_fallback']),
      locationQuality: {
        ...candidate.locationQuality,
        searchScope,
        locationMatchStatus: 'regional_fallback',
        locationWarnings: unique([...(candidate.locationQuality.locationWarnings || []), 'included_as_explicit_location_fallback']),
        fallbackUsed: true,
      },
    }
  }
  if (!shouldExcludeForLocation(candidate, options)) return candidate
  const reason = 'out_of_area:' + [candidate.locationQuality?.candidateLocation, candidate.locationQuality?.requestedLocation].filter(Boolean).join(' != ')
  return {
    ...candidate,
    searchScope,
    auditEligible: false,
    auditExclusionReason: candidate.auditExclusionReason || reason,
    locationWarnings: unique([...(candidate.locationWarnings || []), 'excluded_from_handoff_out_of_area']),
    locationQuality: {
      ...candidate.locationQuality,
      searchScope,
      locationWarnings: unique([...(candidate.locationQuality?.locationWarnings || []), 'excluded_from_handoff_out_of_area']),
    },
  }
}

function extractCity(value = '') {
  const text = clean(value)
  if (!text) return ''
  const withoutCountry = text.replace(/,\s*(Norway|Norge)$/i, '')
  const parts = withoutCountry.split(',').map((part) => part.trim()).filter(Boolean)
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const part = parts[index].replace(/^\d{4}\s+/, '').trim()
    if (part && !/^\d{4}$/.test(part)) return part
  }
  return withoutCountry.replace(/^\d{4}\s+/, '').trim()
}

function normalizeLocationKey(value = '') {
  return clean(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bnorway\b|\bnorge\b/g, '')
    .replace(/\bkommune\b/g, '')
    .replace(/[^a-z0-9æøå]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function clean(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

module.exports = {
  parseLocationIntent,
  buildLocationQuality,
  normalizeSearchScope,
  shouldExcludeForLocation,
  applyLocationQuality,
  extractCity,
  normalizeLocationKey,
}
