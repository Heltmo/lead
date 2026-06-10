const assert = require('assert')
const { enrichOsint, GROUPS } = require('../osint')

function lead(overrides = {}) {
  return {
    company: {
      displayName: 'Test Tannlege AS',
      organizationNumber: '999111222',
      legalName: 'TEST TANNLEGE AS',
      matchStatus: 'exact_match',
      matchConfidence: 0.93,
      activeStatus: 'active',
      employees: 6,
      naceCode: '86.230',
      naceDescription: 'Tannlegetjenester',
      source: 'brreg',
      sourceUrl: 'https://data.brreg.no/enhetsregisteret/api/enheter/999111222',
    },
    contact: {
      phone: '69 00 00 00',
      email: 'post@example.no',
      website: 'https://example.no',
      city: 'Halden',
    },
    places: {
      provider: 'google_places',
      rating: 4.5,
      reviewCount: 18,
    },
    sourceQuality: {
      locationMatchStatus: 'exact_location',
      locationConfidence: 0.91,
      discoveryConfidence: 'high',
      identitySource: 'brreg',
      presenceSource: 'google_places',
    },
    website: {
      auditStatus: 'completed',
      topEvidence: ['Contact page found', 'No social links detected'],
      contactability: 'strong',
    },
    ranking: {
      whyRanked: ['Direct phone exists for seller qualification.'],
      caution: [],
    },
    sellerFit: { sellerIntent: 'general_b2b' },
    ...overrides,
  }
}

{
  const { osint } = enrichOsint(lead(), { observedAt: '2026-05-31T00:00:00.000Z' })
  for (const group of GROUPS) assert(Array.isArray(osint[group]), `${group} should be an array`)
  assert(osint.companyIdentity.some((signal) => signal.label === 'Bekreftet org.nr'), 'confirmed org.nr should be identity evidence')
  assert(osint.contactability.some((signal) => signal.label === 'Direkte telefon'), 'phone should be contactability evidence')
  assert(osint.digitalPresence.some((signal) => signal.label === 'Digital synlighetsstatus'), 'digital status should be captured')
  assert(osint.marketProof.some((signal) => signal.label === 'Google-omtaler'), 'reviews should be market proof')
  assert(osint.sources.length >= 3, 'sources should be tracked')
  assert(osint.sources.every((source) => source.name && source.observedAt && source.confidence), 'sources need audit context')
  assert(osint.summary.evidenceCount > 0, 'summary should count evidence')
}

{
  const { osint } = enrichOsint(lead({
    company: { displayName: 'Weak AS', matchStatus: 'no_match', warnings: ['name_mismatch'] },
    contact: {},
    places: {},
    sourceQuality: { locationMatchStatus: 'regional_fallback' },
    website: {},
    ranking: { caution: ['Location is not confirmed exact'] },
  }))
  assert(osint.riskVerify.some((signal) => signal.label === 'Firmaidentitet ikke bekreftet'), 'missing identity should be risk')
  assert(osint.riskVerify.some((signal) => signal.label === 'Ingen direkte telefon funnet'), 'missing phone should be risk')
  assert(osint.riskVerify.some((signal) => signal.label === 'Sted må verifiseres'), 'fallback location should be risk')
  assert(osint.summary.riskCount >= 3, 'summary should count risks')
}

const serialized = JSON.stringify(enrichOsint(lead())).toLowerCase()
for (const banned of ['personal dossier', 'private profile scrape', 'captcha bypass', 'ready-to-send', 'call opener', 'auto-email']) {
  assert(!serialized.includes(banned), `banned OSINT behavior text found: ${banned}`)
}
