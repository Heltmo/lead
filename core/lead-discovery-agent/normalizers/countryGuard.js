function isNorwayFirstCandidate(candidate = {}, context = {}) {
  if (context.country && String(context.country).toUpperCase() !== 'NO') return true
  if (candidate.identitySource === 'brreg' || candidate.provider === 'brreg') return true
  if (candidate.organizationNumber || candidate.candidateOrganizationNumber) return true

  const text = normalizeCountryText([
    candidate.address,
    candidate.location,
    candidate.candidateLocation,
    candidate.registeredAddress,
    candidate.municipality,
    candidate.website,
    candidate.businessName,
    candidate.legalName,
  ].filter(Boolean).join(' '))
  const phone = normalizePhone(candidate.phone)

  if (hasForeignCountrySignal(text, phone)) return false
  if (hasNorwayCountrySignal(text, phone)) return true

  const requestedLocation = normalizeCountryText(context.requestedLocation || '')
  if (requestedLocation && (!text || text.includes(requestedLocation))) return true
  if (requestedLocation) return true

  return false
}

function hasNorwayCountrySignal(text = '', phone = '') {
  if (/\b(norway|norge)\b/.test(text)) return true
  if (/^\+47/.test(phone)) return true
  if (/^47\d{8}$/.test(phone)) return true
  if (/^\d{8}$/.test(phone)) return true
  return false
}

function hasForeignCountrySignal(text = '', phone = '') {
  if (/\b(usa|united states|canada|united kingdom|england|scotland|wales|ireland|australia)\b/.test(text)) return true
  if (/^\+1/.test(phone)) return true
  return false
}

function normalizePhone(value = '') {
  return String(value || '').replace(/[^0-9+]+/g, '')
}

function normalizeCountryText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

module.exports = {
  isNorwayFirstCandidate,
  hasNorwayCountrySignal,
  hasForeignCountrySignal,
}
