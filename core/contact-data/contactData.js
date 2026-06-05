const PROVIDER_STATUSES = new Set(['matched', 'weak_match', 'conflict', 'no_match', 'error'])
const PROVIDER_CONFIDENCE = new Set(['high', 'good', 'review', 'weak', 'unknown'])
const DEFAULT_PROVIDER = 'mock_directory'

function searchContactData(input = {}, options = {}) {
  return normalizeContactProviderResult(mockDirectoryResult(input, options))
}

function lookupContactData(input = {}, options = {}) {
  return normalizeContactProviderResult(mockDirectoryResult(input, options))
}

function normalizeContactProviderResult(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const provider = clean(source.provider) || DEFAULT_PROVIDER
  const status = normalizeStatus(source.status)
  const contactEvidenceInput = source.contactEvidence && typeof source.contactEvidence === 'object' ? source.contactEvidence : {}
  const contactEvidence = {
    phone: normalizeEvidence(contactEvidenceInput.phone || source.phone, provider),
    email: normalizeEvidence(contactEvidenceInput.email || source.email, provider),
    website: normalizeEvidence(contactEvidenceInput.website || source.website, provider),
    address: normalizeEvidence(contactEvidenceInput.address || source.address, provider),
  }

  return {
    provider,
    providerRecordId: clean(source.providerRecordId || source.recordId || source.id),
    status,
    contactEvidence,
    confidence: normalizeConfidence(source.confidence, status),
    conflicts: normalizeList(source.conflicts),
    warnings: normalizeList(source.warnings),
    rawAvailable: false,
  }
}

function contactProviderEvidenceForSourceFusion(raw = {}) {
  const normalized = normalizeContactProviderResult(raw)
  const phone = evidenceValue(normalized.contactEvidence.phone)
  const email = evidenceValue(normalized.contactEvidence.email)
  const website = evidenceValue(normalized.contactEvidence.website)
  const address = evidenceValue(normalized.contactEvidence.address)
  const proofReasons = []
  const riskReasons = []
  const warnings = normalizeList(normalized.warnings)
  const conflicts = normalizeList(normalized.conflicts)

  if (normalized.status === 'matched') {
    if (phone) proofReasons.push('Contact provider matched a phone number.')
    if (address) proofReasons.push('Contact provider matched an address.')
    if (email || website) proofReasons.push('Contact provider matched an additional contact path.')
  }

  if (normalized.status === 'weak_match') {
    riskReasons.push('Contact provider match is weak; verify contact data before calling.')
    warnings.push('Directory match is weak and should not be treated as truth.')
  }

  if (normalized.status === 'conflict') {
    conflicts.push('Contact provider conflicts with existing contact evidence.')
    warnings.push('Verify directory contact data before using this lead.')
  }

  if (normalized.status === 'error') {
    warnings.push('Contact provider lookup failed or is unavailable.')
  }

  return {
    provider: normalized.provider,
    providerRecordId: normalized.providerRecordId,
    status: normalized.status,
    contactEvidence: normalized.contactEvidence,
    confidence: normalized.confidence,
    conflicts: unique(conflicts),
    warnings: unique(warnings),
    rawAvailable: false,
    phone,
    email,
    website,
    address,
    hasPhone: Boolean(phone),
    hasEmail: Boolean(email),
    hasWebsite: Boolean(website),
    hasAddress: Boolean(address),
    proofReasons: unique(proofReasons),
    riskReasons: unique(riskReasons),
  }
}

function hasContactProviderResult(raw) {
  if (!raw || typeof raw !== 'object') return false
  return Boolean(raw.provider || raw.providerRecordId || raw.recordId || raw.id || raw.status || raw.contactEvidence || raw.phone || raw.email || raw.website || raw.address)
}

function mockDirectoryResult(input = {}, options = {}) {
  const query = input && typeof input === 'object' ? input : {}
  if (isPrivatePersonLookup(query)) {
    return {
      provider: DEFAULT_PROVIDER,
      status: 'error',
      confidence: 'weak',
      warnings: ['Private-person enrichment is not supported.'],
    }
  }

  const scenario = normalizeScenario(options.scenario || query.mockContactScenario || query.mockCase || query.status || 'matched')
  const providerRecordId = clean(options.providerRecordId || query.providerRecordId) || mockRecordId(query, scenario)
  const companyName = clean(query.companyName || query.name || query.displayName) || 'Mock Company AS'
  const city = clean(query.city || query.location || query.requestedLocation) || 'Oslo'
  const phone = clean(options.phone || query.phone) || '22 00 00 00'
  const address = clean(options.address || query.address) || city + 'veien 1, ' + city

  if (scenario === 'no_match') {
    return {
      provider: DEFAULT_PROVIDER,
      providerRecordId,
      status: 'no_match',
      confidence: 'unknown',
      contactEvidence: {},
      warnings: ['Mock directory returned no company match.'],
    }
  }

  if (scenario === 'weak_match') {
    return {
      provider: DEFAULT_PROVIDER,
      providerRecordId,
      status: 'weak_match',
      confidence: 'review',
      contactEvidence: {
        address: { value: address, confidence: 'review', source: DEFAULT_PROVIDER },
      },
      warnings: ['Mock directory weakly matched ' + companyName + '.'],
    }
  }

  if (scenario === 'conflict') {
    return {
      provider: DEFAULT_PROVIDER,
      providerRecordId,
      status: 'conflict',
      confidence: 'review',
      contactEvidence: {
        phone: { value: clean(options.conflictingPhone || query.conflictingPhone) || '99 99 99 99', confidence: 'review', source: DEFAULT_PROVIDER },
        address: { value: address, confidence: 'review', source: DEFAULT_PROVIDER },
      },
      conflicts: ['Mock directory phone differs from existing lead contact data.'],
    }
  }

  if (scenario === 'error') {
    return {
      provider: DEFAULT_PROVIDER,
      providerRecordId,
      status: 'error',
      confidence: 'weak',
      warnings: ['Mock directory lookup failed.'],
    }
  }

  return {
    provider: DEFAULT_PROVIDER,
    providerRecordId,
    status: 'matched',
    confidence: 'good',
    contactEvidence: {
      phone: { value: phone, confidence: 'good', source: DEFAULT_PROVIDER },
      address: { value: address, confidence: 'good', source: DEFAULT_PROVIDER },
    },
  }
}

function normalizeEvidence(value, provider) {
  if (!value) return null
  if (typeof value === 'object') {
    const normalizedValue = clean(value.value || value.phone || value.email || value.website || value.address || value.url)
    if (!normalizedValue) return null
    return {
      value: normalizedValue,
      confidence: normalizeConfidence(value.confidence, 'matched'),
      source: clean(value.source || value.provider) || provider,
    }
  }
  const normalizedValue = clean(value)
  if (!normalizedValue) return null
  return { value: normalizedValue, confidence: 'good', source: provider }
}

function evidenceValue(evidence) {
  return evidence && typeof evidence === 'object' ? clean(evidence.value) : clean(evidence)
}

function normalizeStatus(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return PROVIDER_STATUSES.has(normalized) ? normalized : 'no_match'
}

function normalizeConfidence(value, status) {
  const normalized = String(value || '').trim().toLowerCase()
  if (PROVIDER_CONFIDENCE.has(normalized)) return normalized
  if (status === 'matched') return 'good'
  if (status === 'weak_match' || status === 'conflict') return 'review'
  if (status === 'error') return 'weak'
  return 'unknown'
}

function normalizeScenario(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/-/g, '_')
  return PROVIDER_STATUSES.has(normalized) ? normalized : 'matched'
}

function isPrivatePersonLookup(input = {}) {
  return Boolean(input.privatePerson || input.personName && !input.companyName && !input.organizationNumber && !input.orgNumber)
}

function mockRecordId(input = {}, scenario = 'matched') {
  const seed = clean(input.organizationNumber || input.orgNumber || input.companyName || input.name || input.city || scenario) || scenario
  return ('mock-' + scenario + '-' + seed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40))
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (!value) return []
  return [String(value).trim()].filter(Boolean)
}

function clean(value) {
  if (value && typeof value === 'object') return clean(value.value || value.url || value.href || value.name || value.text)
  const text = String(value || '').trim()
  return text && !['unknown', 'none', 'null', 'undefined'].includes(text.toLowerCase()) ? text : ''
}

function unique(values) {
  return Array.from(new Set(normalizeList(values)))
}

module.exports = {
  searchContactData,
  lookupContactData,
  normalizeContactProviderResult,
  contactProviderEvidenceForSourceFusion,
  hasContactProviderResult,
}
