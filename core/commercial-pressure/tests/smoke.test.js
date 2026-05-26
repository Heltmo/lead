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

const restaurant = buildCommercialPressure({
  status: 'completed',
  compressedOpportunity: { type: 'trust_to_conversion_gap', leadClass: 'conversion_optimization' },
  sourceMetadata: { industry: 'restaurant', phone: '32 00 00 00', sourceType: 'directBusiness', businessStatus: 'OPERATIONAL', rating: 4.7, reviewCount: 180 },
  issueCategories: { conversion: 1 },
  performance: { failedRequestCount: 0, consoleErrorCount: 0 },
})
assert(restaurant.callPriority !== 'high', 'restaurant generic conversion should not become high priority')
assert(restaurant.salesEase === 'low', 'restaurant generic conversion should have low sales ease')
assert(restaurant.commercialPressureReasons.includes('restaurant_generic_web_issue_lower_pressure'), 'restaurant pressure should include lower-pressure reason')

const lawyer = buildCommercialPressure({
  status: 'completed',
  compressedOpportunity: { type: 'high_value_service_conversion_gap', leadClass: 'high_value_service_conversion' },
  sourceMetadata: { industry: 'lawyer', phone: '69 00 00 00', sourceType: 'directBusiness', businessStatus: 'OPERATIONAL', rating: 4.8, reviewCount: 50 },
  issueCategories: { conversion: 1 },
  performance: { failedRequestCount: 0, consoleErrorCount: 0 },
})
assert(lawyer.callPriority !== 'high', 'lawyer service-line opportunity alone should not become high priority')
assert(lawyer.commercialPressureReasons.includes('law_firm_service_line_lower_immediate_pressure'), 'lawyer pressure should include stricter law-firm reason')

const plumber = buildCommercialPressure({
  status: 'completed',
  compressedOpportunity: { type: 'high_value_service_conversion_gap', leadClass: 'high_value_service_conversion' },
  sourceMetadata: { industry: 'plumber', phone: '69 00 00 00', sourceType: 'directBusiness', businessStatus: 'OPERATIONAL', rating: 4.9, reviewCount: 60 },
  issueCategories: { conversion: 1, accessibility: 1 },
  performance: { failedRequestCount: 3, consoleErrorCount: 0 },
})
assert(plumber.callPriority === 'medium', 'plumber high-value service alone should be medium without stronger pain')

const strongContactPathSignals = [
  { id: 'contactability' },
  { id: 'visible_contact_cta_path', observation: { hasStrongPrimaryCta: true, hasVisibleContactPath: true } },
]

const electricianWithMatureContact = buildCommercialPressure({
  status: 'completed',
  compressedOpportunity: { type: 'technical_trust_risk', leadClass: 'technical_redesign' },
  sourceMetadata: { industry: 'electrician', phone: '69 23 34 00', sourceType: 'directBusiness', businessStatus: 'OPERATIONAL', rating: 4.8, reviewCount: 40 },
  businessSignalProfile: { signals: strongContactPathSignals },
  issueCategories: { accessibility: 1, conversion: 1, technical: 2 },
  performance: { failedRequestCount: 3, consoleErrorCount: 1 },
})
assert(electricianWithMatureContact.callPriority === 'medium', 'electrician technical issues with mature contact paths should not be automatic high')
assert(electricianWithMatureContact.salesEase === 'medium', 'mature contact path technical trade lead should be medium sales ease')
assert(electricianWithMatureContact.commercialPressureReasons.includes('contact_maturity_requires_stronger_technical_pain'), 'technical contact maturity should be recorded as pressure resistance')

const plumberWithEmergencyCta = buildCommercialPressure({
  status: 'completed',
  compressedOpportunity: { type: 'high_value_service_conversion_gap', leadClass: 'high_value_service_conversion' },
  sourceMetadata: { industry: 'plumber', phone: '69 26 80 00', sourceType: 'directBusiness', businessStatus: 'OPERATIONAL', rating: 4.2, reviewCount: 46 },
  businessSignalProfile: { signals: strongContactPathSignals },
  issueCategories: { conversion: 1, accessibility: 1 },
  performance: { failedRequestCount: 3, consoleErrorCount: 0 },
})
assert(plumberWithEmergencyCta.callPriority === 'medium', 'plumber high-value service with strong emergency/contact CTA should be medium, not high')
assert(plumberWithEmergencyCta.commercialPressureReasons.includes('clear_contact_path_reduces_cta_pain'), 'clear plumber CTA should reduce CTA pain')

const restaurantWithBooking = buildCommercialPressure({
  status: 'completed',
  compressedOpportunity: { type: 'technical_trust_risk', leadClass: 'technical_redesign' },
  sourceMetadata: { industry: 'restaurant', phone: '32 83 33 30', sourceType: 'directBusiness', businessStatus: 'OPERATIONAL', rating: 4.2, reviewCount: 1078 },
  businessSignalProfile: { signals: strongContactPathSignals },
  issueCategories: { conversion: 1, seo: 1, technical: 2 },
  performance: { failedRequestCount: 4, consoleErrorCount: 2 },
})
assert(restaurantWithBooking.callPriority !== 'high', 'restaurant with booking/contact maturity should not become high from moderate technical issues')
assert(restaurantWithBooking.commercialPressureReasons.includes('restaurant_contact_maturity_lowers_fix_urgency'), 'restaurant contact maturity should lower fix urgency')

const lawyerTechnicalTrust = buildCommercialPressure({
  status: 'completed',
  compressedOpportunity: { type: 'technical_trust_risk', leadClass: 'technical_redesign' },
  sourceMetadata: { industry: 'lawyer', phone: '69 36 74 40', sourceType: 'directBusiness', businessStatus: 'OPERATIONAL', rating: 4.2, reviewCount: 20 },
  businessSignalProfile: { signals: strongContactPathSignals },
  issueCategories: { accessibility: 1, conversion: 1, seo: 1, technical: 2 },
  performance: { failedRequestCount: 2, consoleErrorCount: 1 },
})
assert(lawyerTechnicalTrust.callPriority === 'high', 'lawyer with clear technical trust pain should remain high')

const normalized = normalizeCommercialPressure({ painScore: 2, buyingLikelihood: -1, commercialPressureReasons: 'a|b|c' })
assert(normalized.painScore === 1, 'pain should clamp high')
assert(normalized.buyingLikelihood === 0, 'buying likelihood should clamp low')
assert(normalized.commercialPressureReasons.length === 3, 'reasons should normalize pipe strings')

function assert(condition, message) { if (!condition) throw new Error(message) }
