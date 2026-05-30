const assert = require('assert')
const { evaluateSellerFit, normalizeSellerIntent } = require('../sellerFit')

const ALLOWED_ACTIONS = new Set(['contact', 'review', 'verify', 'skip'])

function lead(overrides = {}) {
  return {
    leadClass: 'fast_discovery',
    company: {
      displayName: 'Test AS',
      organizationNumber: '123456789',
      matchStatus: 'exact_match',
      employees: 8,
      activeStatus: 'active',
    },
    contact: { phone: '22 22 22 22', website: 'https://example.no', city: 'Oslo' },
    places: { rating: 4.6, reviewCount: 18 },
    sourceQuality: { locationMatchStatus: 'exact_location' },
    website: { auditStatus: 'skipped_fast_mode', topEvidence: [] },
    ranking: { whyRanked: [], caution: [] },
    ...overrides,
  }
}

{
  const result = evaluateSellerFit(lead(), 'general_b2b')
  assert(['strong', 'good'].includes(result.sellerFit), 'phone + org identity should be good/strong for general B2B')
  assert(result.fitReasons.includes('direct phone available'), 'phone should be a fit reason')
  assert(result.recommendedAction === 'contact', 'usable fast lead should recommend contact')
}

{
  const result = evaluateSellerFit(lead({
    company: { displayName: 'Weak AS', matchStatus: 'no_match', employees: 0 },
    contact: { website: 'https://example.no' },
    sourceQuality: { locationMatchStatus: 'regional_fallback' },
  }), 'general_b2b')
  assert(['weak', 'review'].includes(result.sellerFit), 'no phone + wrong location should not be strong')
  assert(result.riskReasons.includes('no direct phone found'), 'missing phone should be a risk')
  assert(result.recommendedAction === 'review', 'missing phone should recommend manual review')
}

{
  const result = evaluateSellerFit(lead({
    opportunityType: 'technical_trust_risk',
    website: { auditStatus: 'completed', topEvidence: ['Serious accessibility issues detected'] },
  }), 'web_it')
  assert(result.importantSignals.some((item) => item.includes('digital presence')), 'web_it should prioritize digital presence')
  assert(result.fitReasons.includes('digital presence issue may be relevant'), 'web_it should treat digital issues as relevant')
}

{
  const result = evaluateSellerFit(lead(), 'telecom')
  assert(result.importantSignals.some((item) => item.includes('phone availability')), 'telecom should prioritize phone/company structure')
}

{
  const result = evaluateSellerFit(lead(), 'accounting')
  assert(result.importantSignals.some((item) => item.includes('verified legal identity')), 'accounting should prioritize legal identity')
}

for (const sellerIntent of ['general_b2b', 'web_it', 'ads_marketing', 'telecom', 'accounting', 'insurance', 'finance', 'recruiting', 'other']) {
  const result = evaluateSellerFit(lead(), sellerIntent)
  assert(ALLOWED_ACTIONS.has(result.recommendedAction), `unexpected recommendedAction: ${result.recommendedAction}`)
}

assert.strictEqual(normalizeSellerIntent('Ads Marketing'), 'ads_marketing')
assert.strictEqual(normalizeSellerIntent('unknown thing'), 'general_b2b')
