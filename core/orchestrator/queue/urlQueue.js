function createQueue(urls, options = {}) {
  const maxRetries = Number(options.maxRetries ?? 1)
  return urls.map((input, index) => {
    const item = normalizeQueueInput(input)
    return {
      id: `url-${String(index + 1).padStart(4, '0')}`,
      url: item.url,
      businessName: item.businessName,
      source: item.source,
      location: item.location,
      industry: item.industry,
      confidence: item.confidence,
      sources: item.sources,
      sourceType: item.sourceType,
      auditEligible: item.auditEligible,
      auditExclusionReason: item.auditExclusionReason,
      provenance: item.provenance,
      phone: item.phone,
      address: item.address,
      placeId: item.placeId,
      rating: item.rating,
      reviewCount: item.reviewCount,
      businessStatus: item.businessStatus,
      providerTypes: item.providerTypes,
      sourceMetadata: item.sourceMetadata,
      status: 'pending',
      attempts: 0,
      maxRetries,
      startedAt: '',
      finishedAt: '',
      reportPath: '',
      errors: [],
    }
  })
}

function nextRunnableItem(queue) {
  return queue.find((item) => item.status === 'pending' || (item.status === 'failed' && item.attempts <= item.maxRetries))
}

function parseQueueInputLine(line) {
  const value = String(line || '').trim()
  if (!value || value.startsWith('#')) return null
  if (value.startsWith('{')) return JSON.parse(value)
  const parts = value.split(/\s*\|\s*/)
  if (parts.length >= 2) return { businessName: parts[0], url: parts.slice(1).join('|') }
  return value
}

function normalizeQueueInput(input) {
  const raw = typeof input === 'string' ? { url: input } : { ...(input || {}) }
  const url = String(raw.url || raw.website || raw.link || '').trim()
  if (!url) throw new Error('Queue input is missing url')
  const businessName = clean(raw.businessName || raw.name || raw.company)
  const source = clean(raw.source)
  const location = clean(raw.location)
  const industry = clean(raw.industry)
  const confidence = clean(raw.confidence)
  const sources = Array.isArray(raw.sources) ? raw.sources : []
  const sourceType = clean(raw.sourceType)
  const auditEligible = normalizeOptionalBoolean(raw.auditEligible)
  const auditExclusionReason = clean(raw.auditExclusionReason)
  const provenance = raw.provenance && typeof raw.provenance === 'object' && !Array.isArray(raw.provenance) ? raw.provenance : {}
  const phone = clean(raw.phone || raw.nationalPhoneNumber || raw.internationalPhoneNumber)
  const address = clean(raw.address || raw.formattedAddress || raw.formatted_address)
  const placeId = clean(raw.placeId || raw.place_id)
  const rating = clean(raw.rating)
  const reviewCount = clean(raw.reviewCount || raw.userRatingCount || raw.user_ratings_total)
  const businessStatus = clean(raw.businessStatus || raw.business_status)
  const providerTypes = Array.isArray(raw.providerTypes) ? raw.providerTypes : []
  const sourceMetadata = {
    businessName,
    source,
    location,
    industry,
    confidence,
    sources,
    sourceType,
    auditEligible,
    auditExclusionReason,
    provenance,
    phone,
    address,
    placeId,
    rating,
    reviewCount,
    businessStatus,
    providerTypes,
  }
  return { url, businessName, source, location, industry, confidence, sources, sourceType, auditEligible, auditExclusionReason, provenance, phone, address, placeId, rating, reviewCount, businessStatus, providerTypes, sourceMetadata }
}

function clean(value) {
  return String(value || '').trim()
}

function normalizeOptionalBoolean(value) {
  if (value == null || value === '') return undefined
  if (typeof value === 'boolean') return value
  const normalized = clean(value).toLowerCase()
  if (['true', '1', 'yes'].includes(normalized)) return true
  if (['false', '0', 'no'].includes(normalized)) return false
  return undefined
}

module.exports = { createQueue, nextRunnableItem, parseQueueInputLine, normalizeQueueInput }
