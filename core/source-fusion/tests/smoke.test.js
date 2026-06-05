const assert = require('assert')
const { evaluateSourceFusion, sourceFusionSummary } = require('../sourceFusion')

function lead(overrides = {}) {
  return {
    company: {
      displayName: 'Test AS',
      organizationNumber: '123456789',
      matchStatus: 'exact_match',
      source: 'brreg',
      employees: 8,
      activeStatus: 'active',
    },
    contact: { phone: '22 22 22 22', email: 'hei@test.no', website: 'https://example.no', address: 'Testgata 1, Oslo', city: 'Oslo' },
    places: { provider: 'google_places', placeId: 'abc', rating: 4.5, reviewCount: 12 },
    website: { auditStatus: 'skipped_fast_mode', contactability: 'basic_contact_available' },
    sourceQuality: { locationMatchStatus: 'exact_location', identitySource: 'brreg', presenceSource: 'google_places' },
    sellerFit: { sellerFit: 'good', recommendedAction: 'contact' },
    ...overrides,
  }
}

{
  const fusion = evaluateSourceFusion(lead())
  assert(['strong', 'good'].includes(fusion.leadConfidence), 'confirmed Brreg + phone + exact location + good seller fit should be strong/good')
  assert(fusion.identityConfidence === 'confirmed', 'confirmed org.nr should confirm identity')
  assert(fusion.contactConfidence === 'strong', 'phone + email/website should be strong contact confidence')
  assert(fusion.locationConfidence === 'exact', 'exact_location should map to exact')
  assert(fusion.recommendedTrustAction === 'call', 'trusted contactable lead should recommend call')
}

{
  const fusion = evaluateSourceFusion(lead({
    company: { displayName: 'Candidate AS', candidateOrganizationNumber: '999111222', matchStatus: 'manual_verify', source: 'brreg' },
  }))
  assert(fusion.identityConfidence === 'manual_verify', 'candidate org.nr should require manual identity verification')
  assert(['review', 'verify_first'].includes(fusion.recommendedTrustAction), 'candidate identity should not recommend blind call')
}

{
  const fusion = evaluateSourceFusion(lead({ sourceQuality: { locationMatchStatus: 'regional_fallback' } }))
  assert(fusion.locationConfidence === 'fallback', 'regional_fallback should map to fallback')
  assert(fusion.warnings.some((item) => item.toLowerCase().includes('regional fallback')), 'regional fallback should create a warning')
}

{
  const fusion = evaluateSourceFusion(lead({ contact: {}, website: {}, phone: null, email: null }))
  assert(fusion.contactConfidence === 'weak', 'missing all contact paths should be weak')
  assert(['verify_first', 'skip'].includes(fusion.recommendedTrustAction), 'missing contact should verify first or skip')
}

{
  const fusion = evaluateSourceFusion(lead({ sourceQuality: { locationMatchStatus: 'out_of_area' } }))
  assert(fusion.locationConfidence === 'conflict', 'out_of_area should map to location conflict')
  assert(['verify_first', 'skip'].includes(fusion.recommendedTrustAction), 'location conflict should verify or skip')
}

{
  const fusion = evaluateSourceFusion(lead({
    company: { displayName: 'Unknown AS', matchStatus: 'no_match' },
    contact: {},
    website: {},
    phone: null,
    email: null,
  }))
  assert(fusion.leadConfidence === 'weak', 'no identity + no contact should be weak')
}

{
  const fusion = evaluateSourceFusion(lead({ sellerFit: { sellerFit: 'weak', recommendedAction: 'skip' } }))
  assert(fusion.leadConfidence !== 'strong', 'weak seller fit should prevent strong lead confidence')
}

{
  const fusion = evaluateSourceFusion(lead({
    contact: { phone: '22 22 22 22', warnings: ['phone_conflict'] },
  }))
  assert(fusion.contactConfidence === 'review', 'contact conflict should require review')
  assert(fusion.conflicts.length >= 1, 'contact conflict should be explicit')
}

{
  const fusion = evaluateSourceFusion(lead())
  const summary = sourceFusionSummary(fusion)
  assert(summary.sourceCoverage.includes('google_places'), 'summary should include source coverage')
  assert(summary.verifiedFields.includes('phone'), 'summary should include verified fields')
}

console.log('source fusion: ok')
