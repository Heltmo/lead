const { buildCommercialPressure, normalizeCommercialPressure } = require('../commercialPressure')

const technical = buildCommercialPressure({
  status: 'completed',
  compressedOpportunity: { type: 'technical_trust_risk', leadClass: 'technical_redesign' },
  sourceMetadata: { phone: '69 36 74 40', sourceType: 'directBusiness', businessStatus: 'OPERATIONAL', rating: 4.2, reviewCount: 20 },
  issueCategories: { accessibility: 1, conversion: 1, technical: 2 },
  performance: { failedRequestCount: 8, consoleErrorCount: 1 },
})
assert(technical.callPriority === 'high', 'technical trust risk with phone should be high call priority')
assert(technical.painScore >= 0.75, 'technical trust risk should have high pain')
assert(technical.buyingLikelihood >= 0.65, 'callable technical lead should have strong buying likelihood')
assert(technical.salesEase === 'high', 'direct fix technical lead should be easy to sell')
assert(technical.commercialPressureReasons.includes('visible_technical_trust_pain'), 'pressure reasons should include technical pain')

const campaign = buildCommercialPressure({
  status: 'completed',
  compressedOpportunity: { type: 'modern_site_campaign_optimization', leadClass: 'campaign_optimization' },
  sourceMetadata: { phone: '69 10 90 19', sourceType: 'directBusiness', businessStatus: 'OPERATIONAL', rating: 5, reviewCount: 223 },
  issueCategories: { conversion: 1 },
  performance: { failedRequestCount: 0, consoleErrorCount: 0 },
})
assert(campaign.painScore < technical.painScore, 'modern campaign opportunity should have lower pain than technical trust risk')
assert(campaign.salesEase === 'low', 'campaign optimization should be a consultative/low-ease motion')
assert(campaign.commercialPressureReasons.includes('modern_site_lower_immediate_pain'), 'campaign pressure should explain lower immediate pain')

const failed = buildCommercialPressure({
  status: 'failed',
  compressedOpportunity: { type: 'trust_to_conversion_gap', leadClass: 'conversion_optimization' },
  sourceMetadata: { phone: '69 30 19 00', sourceType: 'directBusiness', businessStatus: 'OPERATIONAL' },
})
assert(failed.callPriority === 'verify', 'failed audits should require verification before calling')

const normalized = normalizeCommercialPressure({ painScore: 2, buyingLikelihood: -1, commercialPressureReasons: 'a|b|c' })
assert(normalized.painScore === 1, 'pain should clamp high')
assert(normalized.buyingLikelihood === 0, 'buying likelihood should clamp low')
assert(normalized.commercialPressureReasons.length === 3, 'reasons should normalize pipe strings')

function assert(condition, message) { if (!condition) throw new Error(message) }
