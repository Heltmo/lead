const assert = require('assert')
const {
  searchContactData,
  lookupContactData,
  normalizeContactProviderResult,
  contactProviderEvidenceForSourceFusion,
} = require('../contactData')
const { evaluateSourceFusion } = require('../../source-fusion/sourceFusion')

function lead(overrides = {}) {
  return {
    company: {
      displayName: 'Test Kontakt AS',
      organizationNumber: '123456789',
      matchStatus: 'exact_match',
      source: 'brreg',
    },
    contact: { address: 'Testgata 1, Oslo', city: 'Oslo' },
    places: { provider: 'google_places', placeId: 'abc' },
    sourceQuality: { locationMatchStatus: 'exact_location', identitySource: 'brreg', presenceSource: 'google_places' },
    sellerFit: { sellerFit: 'good' },
    website: {},
    ...overrides,
  }
}

{
  const providerResult = searchContactData({ companyName: 'Test Kontakt AS', city: 'Oslo' }, { scenario: 'matched' })
  assert(providerResult.status === 'matched', 'mock provider should return matched status')
  assert(providerResult.rawAvailable === false, 'normalized provider result must not expose raw data')
  assert(providerResult.contactEvidence.phone.value, 'matched provider should include phone evidence')
  const fusion = evaluateSourceFusion(lead({ contactData: providerResult }))
  assert(['good', 'strong'].includes(fusion.contactConfidence), 'matched provider phone should improve contact confidence')
  assert(fusion.sourceCoverage.includes('contact_provider'), 'source coverage should include contact provider evidence')
  assert(fusion.verifiedFields.phone === true, 'provider phone evidence should mark phone as verified for confidence')
}

{
  const weak = searchContactData({ companyName: 'Test Kontakt AS', city: 'Oslo' }, { scenario: 'weak_match' })
  const fusion = evaluateSourceFusion(lead({ contactData: weak }))
  assert(fusion.contactConfidence === 'review', 'weak provider match should create review contact confidence')
  assert(fusion.warnings.some((item) => item.toLowerCase().includes('weak')), 'weak provider match should create a warning')
  assert(fusion.recommendedTrustAction === 'verify_first', 'weak provider match should trigger verify_first')
}

{
  const conflict = lookupContactData({ companyName: 'Test Kontakt AS', city: 'Oslo', phone: '22 22 22 22' }, { scenario: 'conflict' })
  const fusion = evaluateSourceFusion(lead({ contact: { phone: '22 22 22 22', city: 'Oslo' }, contactData: conflict }))
  assert(fusion.contactConfidence === 'review', 'provider conflict should require contact review')
  assert(fusion.conflicts.some((item) => item.toLowerCase().includes('contact provider')), 'provider conflict should become source fusion conflict')
  assert(fusion.recommendedTrustAction === 'verify_first', 'provider conflict should trigger verify_first')
}

{
  const baseLead = lead({ contact: { phone: '22 22 22 22', city: 'Oslo' }, website: { url: 'https://example.no' } })
  const withoutProvider = evaluateSourceFusion(baseLead)
  const noMatch = searchContactData({ companyName: 'Test Kontakt AS', city: 'Oslo' }, { scenario: 'no_match' })
  const withProvider = evaluateSourceFusion({ ...baseLead, contactData: noMatch })
  assert(withProvider.contactConfidence === withoutProvider.contactConfidence, 'no provider match should not harm contact confidence')
  assert(withProvider.warnings.join(' ').toLowerCase().includes('mock directory returned no company match') === false, 'no provider match should not add source-fusion warnings')
}

{
  const normalized = normalizeContactProviderResult({
    provider: 'mock_directory',
    status: 'matched',
    raw: { shouldNotLeak: true },
    contactEvidence: { phone: { value: '22 00 00 00', confidence: 'good', source: 'mock_directory' } },
  })
  assert(!Object.prototype.hasOwnProperty.call(normalized, 'raw'), 'normalizer should strip raw provider payload')
  assert(normalized.rawAvailable === false, 'normalizer should explicitly mark raw data unavailable')
}

{
  const privateResult = searchContactData({ personName: 'Ola Nordmann' })
  const evidence = contactProviderEvidenceForSourceFusion(privateResult)
  assert(privateResult.status === 'error', 'private-person enrichment should not be supported')
  assert(evidence.warnings.some((item) => item.toLowerCase().includes('private-person')), 'private-person lookup should warn')
}

console.log('contact data provider readiness: ok')
