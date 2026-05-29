const { parseIndustryQuery } = require('../taxonomy/industryTaxonomy')
const { classifyDiscoveryTarget } = require('./sourceType')
const { buildLocationQuality, normalizeSearchScope } = require('./locationQuality')

function parseDiscoveryQuery(query = '') {
  return parseIndustryQuery(query)
}

function normalizeLeadCandidate(raw, defaults = {}) {
  const website = normalizeWebsiteUrl(raw.website || raw.url || raw.link)
  const hasProviderIdentity = hasLocalBusinessIdentity(raw, defaults)
  if (!website && !hasProviderIdentity) return null
  const source = firstClean(raw.source, defaults.source, 'sample')
  const sourceFile = firstClean(raw.sourceFile, defaults.sourceFile)
  const sourceFormat = firstClean(raw.sourceFormat, defaults.sourceFormat)
  const sources = uniqueSources([
    ...(Array.isArray(raw.sources) ? raw.sources : []),
    {
      source,
      sourceFile,
      sourceFormat,
      provider: raw.provider || defaults.provider,
      searchQuery: raw.searchQuery || defaults.searchQuery,
      rank: raw.rank || defaults.rank,
    },
  ])
  const target = website
    ? classifyDiscoveryTarget(website)
    : { sourceType: 'directBusiness', auditEligible: false, auditExclusionReason: 'missing_website_for_audit' }
  const sourceType = firstClean(raw.sourceType) || target.sourceType
  const auditEligible = normalizeBoolean(raw.auditEligible, target.auditEligible)
  const organizationNumber = firstClean(raw.organizationNumber, raw.organisasjonsnummer)
  const candidateOrganizationNumber = firstClean(raw.candidateOrganizationNumber, organizationNumber)
  const address = firstClean(raw.address, raw.formattedAddress, raw.formatted_address)
  const hasExplicitLocation = Boolean(firstClean(raw.location) || address)
  const location = normalizeLocation(raw.location || address, raw.provider && !hasExplicitLocation ? '' : defaults.location)
  const searchScope = normalizeSearchScope(defaults.searchScope)
  const locationQuality = { ...buildLocationQuality({ ...raw, address, location }, defaults.location), searchScope }
  return {
    businessName: normalizeBusinessName(raw.businessName || raw.name || raw.title || '', website),
    website,
    source,
    sources,
    provenance: createProvenance({ source, sourceFile, sourceFormat, provider: raw.provider || defaults.provider, searchQuery: raw.searchQuery || defaults.searchQuery, rank: raw.rank || defaults.rank }, sources),
    location,
    industry: firstClean(raw.industry, defaults.canonicalIndustry, defaults.industry),
    confidence: normalizeConfidence(raw.confidence),
    phone: firstClean(raw.phone, raw.nationalPhoneNumber, raw.internationalPhoneNumber),
    address,
    placeId: firstClean(raw.placeId, raw.place_id),
    rating: normalizeNumber(raw.rating),
    reviewCount: normalizeNumber(raw.reviewCount, raw.userRatingCount, raw.user_ratings_total),
    businessStatus: firstClean(raw.businessStatus, raw.business_status),
    providerTypes: Array.isArray(raw.providerTypes) ? raw.providerTypes.map(cleanString).filter(Boolean) : (Array.isArray(raw.types) ? raw.types.map(cleanString).filter(Boolean) : []),
    normalizedDomain: normalizeDomain(website),
    sourceType,
    identitySource: firstClean(raw.identitySource),
    presenceSource: firstClean(raw.presenceSource),
    organizationNumber,
    candidateOrganizationNumber,
    legalName: firstClean(raw.legalName, raw.navn),
    candidateLegalName: firstClean(raw.candidateLegalName, raw.legalName, raw.navn),
    organizationForm: firstClean(raw.organizationForm, raw.organisasjonsform?.beskrivelse, raw.organisasjonsform?.kode),
    registeredAddress: firstClean(raw.registeredAddress),
    municipality: firstClean(raw.municipality, raw.kommune),
    unitType: firstClean(raw.unitType),
    naceCode: firstClean(raw.naceCode, raw.naeringskode1?.kode),
    naceDescription: firstClean(raw.naceDescription, raw.naeringskode1?.beskrivelse),
    employees: normalizeNumber(raw.employees, raw.antallAnsatte),
    registrationDate: firstClean(raw.registrationDate, raw.registreringsdatoEnhetsregisteret),
    activeStatus: firstClean(raw.activeStatus),
    sourceUrl: firstClean(raw.sourceUrl),
    auditEligible,
    auditExclusionReason: auditEligible ? '' : cleanString(raw.auditExclusionReason || target.auditExclusionReason),
    searchScope,
    requestedLocation: locationQuality.requestedLocation,
    candidateLocation: locationQuality.candidateLocation,
    candidateCity: locationQuality.candidateCity,
    locationMatchStatus: locationQuality.locationMatchStatus,
    locationConfidence: locationQuality.locationConfidence,
    distanceKm: locationQuality.distanceKm,
    locationWarnings: locationQuality.locationWarnings,
    fallbackUsed: locationQuality.fallbackUsed,
    locationQuality,
    websiteReachable: null,
    reachability: null,
  }
}

function deduplicateCandidates(candidates) {
  const byIdentity = new Map()
  const result = []
  for (const candidate of candidates) {
    if (!candidate) continue
    const keys = candidateDedupeKeys(candidate)
    if (!keys.length) continue
    const existing = keys.map((key) => byIdentity.get(key)).find(Boolean)
    if (!existing) {
      const sources = uniqueSources(candidate.sources || [])
      const primaryKey = keys[0]
      const stored = { ...candidate, dedupeKey: primaryKey, dedupeKeys: keys, sources, provenance: createProvenance(candidate.provenance || { source: candidate.source }, sources) }
      result.push(stored)
      for (const key of keys) byIdentity.set(key, stored)
      continue
    }
    mergeCandidate(existing, candidate)
    existing.dedupeKeys = uniqueValues([...(existing.dedupeKeys || []), ...keys])
    for (const key of existing.dedupeKeys) byIdentity.set(key, existing)
  }
  return result
}

function mergeCandidate(existing, candidate) {
  existing.sources = uniqueSources([...(existing.sources || []), ...(candidate.sources || [])])
  existing.source = existing.sources.map((item) => item.source).filter(Boolean).join('|') || existing.source
  existing.provenance = mergeProvenance(existing, candidate)
  existing.businessName = bestBusinessName(existing.businessName, candidate.businessName, existing.website || candidate.website)
  existing.website = existing.website || candidate.website || ''
  existing.normalizedDomain = existing.normalizedDomain || candidate.normalizedDomain || ''
  existing.location = existing.location || candidate.location
  existing.industry = existing.industry || candidate.industry
  existing.confidence = bestConfidence(existing.confidence, candidate.confidence)
  existing.phone = existing.phone || candidate.phone || ''
  existing.address = existing.address || candidate.address || ''
  existing.candidateLocation = existing.candidateLocation || candidate.candidateLocation || ''
  existing.candidateCity = existing.candidateCity || candidate.candidateCity || ''
  if (betterLocationQuality(candidate.locationQuality, existing.locationQuality)) {
    existing.searchScope = candidate.searchScope
    existing.requestedLocation = candidate.requestedLocation
    existing.locationMatchStatus = candidate.locationMatchStatus
    existing.locationConfidence = candidate.locationConfidence
    existing.distanceKm = candidate.distanceKm
    existing.locationWarnings = candidate.locationWarnings || []
    existing.fallbackUsed = candidate.fallbackUsed
    existing.locationQuality = candidate.locationQuality
  }
  existing.placeId = existing.placeId || candidate.placeId || ''
  if (candidate.placeId && candidate.presenceSource) existing.presenceSource = candidate.presenceSource
  existing.rating = existing.rating || candidate.rating || ''
  existing.reviewCount = existing.reviewCount || candidate.reviewCount || ''
  existing.businessStatus = existing.businessStatus || candidate.businessStatus || ''
  existing.providerTypes = uniqueValues([...(existing.providerTypes || []), ...(candidate.providerTypes || [])])
  existing.sourceType = strongestSourceType(existing.sourceType, candidate.sourceType)
  existing.auditEligible = Boolean(existing.auditEligible || candidate.auditEligible)
  existing.auditExclusionReason = existing.auditEligible ? '' : (existing.auditExclusionReason || candidate.auditExclusionReason || '')
  mergeIdentityFields(existing, candidate)
}

function mergeIdentityFields(existing, candidate) {
  const preferIncoming = candidate.identitySource === 'brreg'
  const fields = [
    'identitySource', 'presenceSource', 'organizationNumber', 'candidateOrganizationNumber', 'legalName', 'candidateLegalName',
    'organizationForm', 'registeredAddress', 'municipality', 'unitType', 'naceCode', 'naceDescription', 'employees',
    'registrationDate', 'activeStatus', 'sourceUrl',
  ]
  for (const field of fields) {
    if (preferIncoming && candidate[field] !== '' && candidate[field] != null) existing[field] = candidate[field]
    else if ((existing[field] === '' || existing[field] == null) && candidate[field] !== '' && candidate[field] != null) existing[field] = candidate[field]
  }
}

function candidateDedupeKey(candidate = {}) {
  return candidateDedupeKeys(candidate)[0] || ''
}

function candidateDedupeKeys(candidate = {}) {
  const keys = []
  if (candidate.organizationNumber) keys.push('org:' + normalizeKey(candidate.organizationNumber))
  if (candidate.candidateOrganizationNumber) keys.push('org-candidate:' + normalizeKey(candidate.candidateOrganizationNumber))
  if (candidate.normalizedDomain) keys.push('domain:' + candidate.normalizedDomain)
  if (candidate.placeId) keys.push('place:' + normalizeKey(candidate.placeId))
  const phone = normalizePhone(candidate.phone)
  const city = normalizeKey(candidate.candidateCity || candidate.location || '')
  if (phone && city) keys.push('phone-city:' + phone + ':' + city)
  const name = normalizeKey(candidate.businessName)
  const address = normalizeKey(candidate.address || candidate.location || '')
  if (name && address) keys.push('name-address:' + name + ':' + address)
  return uniqueValues(keys)
}

function hasLocalBusinessIdentity(raw = {}, defaults = {}) {
  const provider = firstClean(raw.provider, defaults.provider)
  if (!provider) return false
  const name = firstClean(raw.businessName, raw.name, raw.title, raw.displayName?.text, raw.displayName)
  const phone = firstClean(raw.phone, raw.nationalPhoneNumber, raw.internationalPhoneNumber)
  const address = firstClean(raw.address, raw.formattedAddress, raw.formatted_address, raw.location)
  const placeId = firstClean(raw.placeId, raw.place_id, raw.id)
  const organizationNumber = firstClean(raw.organizationNumber, raw.organisasjonsnummer, raw.candidateOrganizationNumber)
  return Boolean((name && (phone || address || placeId)) || (name && organizationNumber))
}

function normalizePhone(value = '') {
  return String(value || '').replace(/[^0-9+]+/g, '')
}

function normalizeKey(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9æøå+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function betterLocationQuality(incoming, current) {
  const order = { exact_location: 5, nearby: 4, regional_fallback: 3, unknown: 2, out_of_area: 1 }
  return (order[incoming?.locationMatchStatus] || 0) > (order[current?.locationMatchStatus] || 0)
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
  const confidence = cleanString(value).toLowerCase()
  return ['high', 'medium', 'low'].includes(confidence) ? confidence : 'medium'
}

function strongestSourceType(left, right) {
  const order = { directBusiness: 7, officialRegistry: 6, unknown: 5, directory: 4, publicSector: 3, governmentRegistry: 2, social: 1 }
  return (order[right] || 0) > (order[left] || 0) ? right : left
}

function bestConfidence(left, right) {
  const order = { high: 3, medium: 2, low: 1 }
  return (order[normalizeConfidence(right)] > order[normalizeConfidence(left)]) ? normalizeConfidence(right) : normalizeConfidence(left)
}

function uniqueSources(sources) {
  const seen = new Set()
  const result = []
  for (const item of sources) {
    const source = cleanString(item.source || '')
    const sourceFile = cleanString(item.sourceFile || '')
    const sourceFormat = cleanString(item.sourceFormat || '')
    const provider = cleanString(item.provider || '')
    const searchQuery = cleanString(item.searchQuery || '')
    const rank = normalizeRank(item.rank)
    const key = [source, sourceFile, sourceFormat, provider, searchQuery].join('|')
    if (!source || seen.has(key)) continue
    seen.add(key)
    const sourceItem = { source, sourceFile, sourceFormat }
    if (provider) sourceItem.provider = provider
    if (searchQuery) sourceItem.searchQuery = searchQuery
    if (rank) sourceItem.rank = rank
    result.push(sourceItem)
  }
  return result
}

function createProvenance(primary, sources) {
  const provenance = {
    source: cleanString(primary.source || ''),
    sourceFile: cleanString(primary.sourceFile || ''),
    sourceFormat: cleanString(primary.sourceFormat || ''),
    sources: uniqueSources(sources || []),
  }
  const provider = cleanString(primary.provider || '')
  const searchQuery = cleanString(primary.searchQuery || '')
  const rank = normalizeRank(primary.rank)
  if (provider) provenance.provider = provider
  if (searchQuery) provenance.searchQuery = searchQuery
  if (rank) provenance.rank = rank
  return provenance
}

function mergeProvenance(existing, candidate) {
  const primary = {
    source: existing.source,
    sourceFile: existing.provenance?.sourceFile || candidate.provenance?.sourceFile || '',
    sourceFormat: existing.provenance?.sourceFormat || candidate.provenance?.sourceFormat || '',
    provider: existing.provenance?.provider || candidate.provenance?.provider || '',
    searchQuery: existing.provenance?.searchQuery || candidate.provenance?.searchQuery || '',
    rank: existing.provenance?.rank || candidate.provenance?.rank || '',
  }
  return createProvenance(primary, existing.sources || [])
}

function normalizeLocation(value, fallback = '') {
  const direct = cleanString(value)
  if (direct) return direct
  if (Array.isArray(value)) {
    const parts = value.map((item) => normalizeLocation(item)).filter(Boolean)
    if (parts.length) return uniqueValues(parts).join(', ')
  }
  if (value && typeof value === 'object') {
    const address = normalizeLocation(value.address || value.formattedAddress || value.formatted_address || value.displayName || value.display_name || value.label || value.name)
    if (address) return address
    const parts = [
      value.city,
      value.locality,
      value.town,
      value.municipality,
      value.region,
      value.state,
      value.country,
    ].map((item) => cleanString(item)).filter(Boolean)
    if (parts.length) return uniqueValues(parts).join(', ')
  }
  return cleanString(fallback)
}

function normalizeBusinessName(value, website = '') {
  return cleanBusinessName(value, website)
}

function bestBusinessName(left, right, website = '') {
  const current = normalizeBusinessName(left, website)
  const incoming = normalizeBusinessName(right, website)
  if (!current) return incoming
  if (!incoming) return current
  if (isWeakBusinessName(current, website) && !isWeakBusinessName(incoming, website)) return incoming
  return current
}

function cleanBusinessName(value, website = '') {
  const cleaned = cleanString(value).replace(/\s+/g, ' ')
  if (!cleaned) return ''
  const candidates = titleCandidates(cleaned)
  return candidates.find((candidate) => !isWeakBusinessName(candidate, website)) || cleaned
}

function titleCandidates(value) {
  const cleaned = cleanString(value)
  if (!cleaned) return []
  const parts = cleaned.split(/\s+(?:-|\u2013|\|)\s+/).map((part) => part.trim()).filter(Boolean)
  if (parts.length <= 1) return [cleaned]
  return [...parts, cleaned]
}

function isWeakBusinessName(value, website = '') {
  const normalized = cleanString(value).toLowerCase()
  if (!normalized) return true
  if (/^https?:\/\//.test(normalized) || /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/.test(normalized)) return true
  const weakNames = new Set(['forside', 'home', 'homepage', 'hjem', 'hjemmeside', 'startside', 'velkommen', 'welcome', 'index', 'front page', 'kontakt', 'contact', 'bestilling'])
  if (weakNames.has(normalized)) return true
  const domain = normalizeDomain(website)
  return Boolean(domain && normalized === domain)
}

function firstClean(...values) {
  for (const value of values) {
    const cleaned = cleanString(value)
    if (cleaned) return cleaned
  }
  return ''
}

function cleanString(value) {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return ''
}

function normalizeNumber(...values) {
  for (const value of values) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return ''
}

function normalizeBoolean(value, fallback) {
  if (value == null || value === '') return Boolean(fallback)
  if (typeof value === 'boolean') return value
  const normalized = cleanString(value).toLowerCase()
  if (['true', '1', 'yes'].includes(normalized)) return true
  if (['false', '0', 'no'].includes(normalized)) return false
  return Boolean(value)
}

function normalizeRank(value) {
  const rank = Number(value)
  return Number.isFinite(rank) && rank > 0 ? Math.floor(rank) : ''
}

function uniqueValues(values) {
  return [...new Set(values)]
}

module.exports = {
  parseDiscoveryQuery,
  normalizeLeadCandidate,
  deduplicateCandidates,
  candidateDedupeKey,
  candidateDedupeKeys,
  normalizeWebsiteUrl,
  normalizeDomain,
  uniqueSources,
  normalizeLocation,
  normalizeBusinessName,
  bestBusinessName,
}
