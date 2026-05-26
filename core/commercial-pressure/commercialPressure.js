function buildCommercialPressure(item = {}) {
  const compressed = item.compressedOpportunity || {}
  const meta = item.sourceMetadata || {}
  const issueCategories = item.issueCategories || {}
  const performance = item.performance || {}
  const status = String(item.status || '').toLowerCase()
  const leadClass = clean(compressed.leadClass || '')
  const type = clean(compressed.type || '')
  const industry = inferIndustry(item)
  const vertical = verticalTier(industry)
  const resistance = resistanceProfile(item, compressed, industry)
  const hasPhone = Boolean(meta.phone || (item.phones || [])[0])
  const hasEmail = Boolean((item.emails || [])[0])
  const directBusiness = String(meta.sourceType || '') === 'directBusiness'
  const operational = String(meta.businessStatus || '') === 'OPERATIONAL'
  let painScore = 0.32
  let buyingLikelihood = 0.32
  const reasons = []

  if (status === 'failed') {
    painScore += 0.12
    buyingLikelihood -= 0.18
    reasons.push('audit_failed_verify_manually')
  }

  if (leadClass === 'technical_redesign' || type === 'technical_trust_risk') {
    painScore += 0.36
    buyingLikelihood += 0.22
    reasons.push('visible_technical_trust_pain')
  }
  if (leadClass === 'brand_identity' || type === 'brand_identity_confusion') {
    painScore += 0.32
    buyingLikelihood += 0.18
    reasons.push('brand_or_search_identity_confusion')
  }
  if (leadClass === 'high_value_service_conversion' || type === 'high_value_service_conversion_gap') {
    painScore += vertical.highValuePain
    buyingLikelihood += vertical.highValueBuying
    reasons.push('high_value_service_conversion_leak')
  }
  if (leadClass === 'conversion_optimization') {
    painScore += vertical.conversionPain
    buyingLikelihood += vertical.conversionBuying
    reasons.push('conversion_path_friction')
  }
  if (leadClass === 'campaign_optimization' || type === 'modern_site_campaign_optimization') {
    painScore -= 0.16
    buyingLikelihood -= 0.08
    reasons.push('modern_site_lower_immediate_pain')
  }

  const failedRequests = Number(performance.failedRequestCount || 0)
  const consoleErrors = Number(performance.consoleErrorCount || 0)
  if (failedRequests >= 5) { painScore += 0.18; buyingLikelihood += 0.08; reasons.push('many_failed_requests') }
  else if (failedRequests >= 2) { painScore += 0.1; reasons.push('failed_requests') }
  if (consoleErrors > 0) { painScore += 0.08; reasons.push('console_errors') }
  if (Number(issueCategories.accessibility || 0) > 0) { painScore += 0.06; reasons.push('accessibility_usability_pain') }
  if (Number(issueCategories.conversion || 0) > 0) { painScore += vertical.issueConversionPain; buyingLikelihood += vertical.issueConversionBuying; reasons.push('conversion_issue_detected') }
  if (Number(issueCategories.seo || 0) > 0) { painScore += 0.03; reasons.push('search_clarity_issue') }

  if (hasPhone) { buyingLikelihood += 0.16; reasons.push('callable_phone_available') }
  else { buyingLikelihood -= 0.22; reasons.push('phone_missing') }
  if (hasEmail) { buyingLikelihood += 0.04; reasons.push('email_available') }
  if (directBusiness) { buyingLikelihood += 0.08; reasons.push('direct_business_site') }
  if (operational) { buyingLikelihood += 0.05; reasons.push('operational_business') }

  const reviewCount = Number(meta.reviewCount || 0)
  const rating = Number(meta.rating || 0)
  if (reviewCount >= 100 && rating >= 4.6) {
    buyingLikelihood += leadClass === 'campaign_optimization' ? 0.03 : 0.06
    reasons.push('strong_local_proof')
  }
  if (leadClass === 'campaign_optimization' && reviewCount >= 100) reasons.push('growth_conversation_not_fix_pitch')

  painScore += vertical.basePain
  buyingLikelihood += vertical.baseBuying

  for (const hit of [...resistance.reasons].reverse()) reasons.unshift(hit)
  painScore -= resistance.painPenalty
  buyingLikelihood -= resistance.buyingPenalty

  painScore = clamp(painScore)
  buyingLikelihood = clamp(buyingLikelihood)
  const context = {
    leadClass,
    type,
    status,
    vertical,
    resistance,
    hasPhone,
    directBusiness,
    industry,
    failedRequests,
    consoleErrors,
    hasStrongContactCta: resistance.hasStrongContactCta,
    hasVisibleContactPath: resistance.hasVisibleContactPath,
    hasContactability: resistance.hasContactability,
  }
  const callPriority = priority(painScore, buyingLikelihood, context)
  return normalizeCommercialPressure({
    painScore,
    buyingLikelihood,
    callPriority,
    salesEase: salesEase(painScore, buyingLikelihood, context),
    commercialPressureReasons: unique(reasons).slice(0, 8),
  })
}

function normalizeCommercialPressure(value = {}) {
  return {
    painScore: clamp(Number(value.painScore || 0.35)),
    buyingLikelihood: clamp(Number(value.buyingLikelihood || 0.35)),
    callPriority: clean(value.callPriority) || 'medium',
    salesEase: clean(value.salesEase) || 'medium',
    commercialPressureReasons: normalizeArray(value.commercialPressureReasons).slice(0, 8),
  }
}

function priority(pain, buying, context = {}) {
  if (context.status === 'failed') return 'verify'
  if (!context.hasPhone && buying < 0.72) return pain >= 0.75 ? 'verify' : 'low'

  const resistance = context.resistance || { level: 0 }
  const strongResistance = Number(resistance.level || 0) >= 2
  const tier = context.vertical?.name || 'tier2'
  const technical = context.leadClass === 'technical_redesign' || context.type === 'technical_trust_risk'
  const brand = context.leadClass === 'brand_identity' || context.type === 'brand_identity_confusion'
  const highValue = context.leadClass === 'high_value_service_conversion'
  const conversion = context.leadClass === 'conversion_optimization'
  const campaign = context.leadClass === 'campaign_optimization'
  const contactMature = Boolean(context.hasStrongContactCta || context.hasVisibleContactPath)
  const severeTechnical = hasSevereTechnicalPain(context)

  if (technical && context.directBusiness) {
    if (tier === 'tier1' && ['dentist', 'clinic'].includes(context.industry) && severeTechnical && pain >= 0.82 && buying >= 0.68 && !veryStrongResistance(resistance)) return 'high'
    if (tier === 'tier2' && context.industry === 'lawyer' && severeTechnical && pain >= 0.84 && buying >= 0.7 && !veryStrongResistance(resistance)) return 'high'
    if (['electrician', 'plumber', 'hvac'].includes(context.industry)) {
      if (!contactMature && severeTechnical && pain >= 0.84 && buying >= 0.7 && !veryStrongResistance(resistance)) return 'high'
      if (contactMature && context.failedRequests >= 5 && context.consoleErrors > 0 && pain >= 0.9 && buying >= 0.78 && !strongResistance) return 'high'
    }
    if (tier === 'tier3') {
      if (!contactMature && context.failedRequests >= 5 && context.consoleErrors > 0 && pain >= 0.9 && buying >= 0.78 && !strongResistance) return 'high'
    }
    if (!contactMature && severeTechnical && pain >= 0.88 && buying >= 0.76 && !strongResistance) return 'high'
  }
  if (brand && context.directBusiness && pain >= 0.78 && buying >= 0.66 && !strongResistance) return 'high'
  if (highValue && tier === 'tier1' && !contactMature && pain >= 0.82 && buying >= 0.76 && !strongResistance) return 'high'
  if (conversion && tier === 'tier1' && !contactMature && pain >= 0.86 && buying >= 0.78 && !strongResistance) return 'high'
  if (!campaign && !contactMature && !strongResistance && pain >= 0.9 && buying >= 0.82) return 'high'

  if (campaign && pain < 0.72) return buying >= 0.68 ? 'medium' : 'low'
  if (context.industry === 'lawyer' && highValue && strongResistance && pain < 0.4) return 'low'
  if (strongResistance && pain < 0.9) return buying >= 0.58 ? 'medium' : 'low'
  if (tier === 'tier3' && !brand && pain < 0.9) return buying >= 0.56 ? 'medium' : 'low'
  if (tier === 'tier2' && highValue && pain < 0.86) return buying >= 0.58 ? 'medium' : 'low'
  if (contactMature && ['high_value_service_conversion', 'conversion_optimization'].includes(context.leadClass) && pain < 0.86) return buying >= 0.58 ? 'medium' : 'low'
  if (tier !== 'tier3' && pain >= 0.5 && buying >= 0.6) return 'medium'
  if (pain >= 0.58 && buying >= 0.48) return 'medium'
  return 'low'
}

function hasSevereTechnicalPain(context = {}) {
  const failed = Number(context.failedRequests || 0)
  const consoleErrors = Number(context.consoleErrors || 0)
  if (failed >= 5) return true
  if (failed >= 2 && consoleErrors > 0) return true
  if (consoleErrors >= 3) return true
  return false
}

function veryStrongResistance(resistance = {}) {
  return Number(resistance.level || 0) >= 3
}

function salesEase(pain, buying, context = {}) {
  if (!context.hasPhone) return 'low'
  if (context.leadClass === 'technical_redesign' && ['electrician', 'plumber', 'hvac', 'restaurant'].includes(context.industry) && (context.hasStrongContactCta || context.hasVisibleContactPath)) return 'medium'
  if (context.leadClass === 'technical_redesign' && pain >= 0.72) return 'high'
  if (context.leadClass === 'brand_identity' && pain >= 0.76 && buying >= 0.62) return 'medium'
  if (context.leadClass === 'campaign_optimization') return 'low'
  if ((context.resistance?.level || 0) >= 2 && context.leadClass !== 'technical_redesign') return 'low'
  if (context.vertical?.name === 'tier3' && context.leadClass !== 'technical_redesign') return 'low'
  if (pain >= 0.64 && buying >= 0.58) return 'medium'
  return 'medium'
}

function inferIndustry(item = {}) {
  const meta = item.sourceMetadata || {}
  const text = [meta.industry, meta.canonicalIndustry, item.industry, item.canonicalIndustry, meta.source, ...(meta.providerTypes || [])].join(' ').toLowerCase()
  if (includesAny(text, ['dentist', 'tannlege', 'dental'])) return 'dentist'
  if (includesAny(text, ['electrician', 'elektriker'])) return 'electrician'
  if (includesAny(text, ['plumber', 'rørlegger', 'rorlegger', 'vvs'])) return 'plumber'
  if (includesAny(text, ['hvac', 'ventilation', 'varmepumpe'])) return 'hvac'
  if (includesAny(text, ['clinic', 'klinikk', 'doctor', 'lege'])) return 'clinic'
  if (includesAny(text, ['lawyer', 'advokat'])) return 'lawyer'
  if (includesAny(text, ['accountant', 'regnskap', 'regnskapsfører', 'regnskapsforer'])) return 'accountant'
  if (includesAny(text, ['physiotherapist', 'fysioterapeut'])) return 'physiotherapist'
  if (includesAny(text, ['restaurant', 'cafe', 'café', 'bar'])) return 'restaurant'
  return 'unknown'
}

function verticalTier(industry) {
  if (['dentist', 'electrician', 'plumber', 'hvac', 'clinic'].includes(industry)) {
    return { name: 'tier1', basePain: 0.03, baseBuying: 0.03, highValuePain: 0.2, highValueBuying: 0.12, conversionPain: 0.16, conversionBuying: 0.08, issueConversionPain: 0.07, issueConversionBuying: 0.04 }
  }
  if (['lawyer', 'accountant', 'physiotherapist'].includes(industry)) {
    return { name: 'tier2', basePain: -0.02, baseBuying: -0.03, highValuePain: 0.14, highValueBuying: 0.08, conversionPain: 0.11, conversionBuying: 0.05, issueConversionPain: 0.04, issueConversionBuying: 0.02 }
  }
  if (['restaurant'].includes(industry)) {
    return { name: 'tier3', basePain: -0.1, baseBuying: -0.08, highValuePain: 0.09, highValueBuying: 0.04, conversionPain: 0.07, conversionBuying: 0.02, issueConversionPain: 0.025, issueConversionBuying: 0.01 }
  }
  return { name: 'tier2', basePain: -0.01, baseBuying: -0.01, highValuePain: 0.14, highValueBuying: 0.08, conversionPain: 0.11, conversionBuying: 0.05, issueConversionPain: 0.04, issueConversionBuying: 0.02 }
}

function resistanceProfile(item = {}, compressed = {}, industry = 'unknown') {
  const meta = item.sourceMetadata || {}
  const profile = item.businessSignalProfile || {}
  const signals = Array.isArray(profile.signals) ? profile.signals : []
  const technologies = normalizeArray(item.technologies).join(' ').toLowerCase()
  const text = [item.name, item.title, item.pageTitle, item.url, compressed.primaryOpportunity, compressed.outreachAngle, technologies].join(' ').toLowerCase()
  const reviewCount = Number(meta.reviewCount || 0)
  const rating = Number(meta.rating || 0)
  const hasOnlineBooking = signals.some((signal) => signal.id === 'online_booking')
  const contactCtaSignal = signals.find((signal) => signal.id === 'visible_contact_cta_path')
  const hasStrongContactCta = Boolean(contactCtaSignal?.observation?.hasStrongPrimaryCta)
  const hasVisibleContactPath = Boolean(contactCtaSignal || item.pageSignals?.contactCtaProfile?.hasVisibleContactPath)
  const hasContactability = signals.some((signal) => signal.id === 'contactability')
  const hasMissingCta = signals.some((signal) => signal.id === 'missing_primary_cta') || Number((item.issueCategories || {}).conversion || 0) > 0
  const reasons = []
  let painPenalty = 0
  let buyingPenalty = 0
  let level = 0

  const polished = compressed.leadClass === 'campaign_optimization' || includesAny(text, ['dental markedsføring', 'utviklet av', 'webdesign', 'wix', 'squarespace'])
  if (polished) { painPenalty += 0.12; buyingPenalty += 0.06; level += 1; reasons.push('polished_or_vendor_built_site') }

  const strongConversion = (hasOnlineBooking || hasStrongContactCta) && hasContactability && !hasMissingCta
  if (strongConversion) { painPenalty += 0.18; buyingPenalty += 0.1; level += 2; reasons.push('strong_existing_conversion_flow') }

  if (hasStrongContactCta && ['high_value_service_conversion', 'conversion_optimization'].includes(compressed.leadClass)) {
    painPenalty += industry === 'restaurant' ? 0.18 : 0.14
    buyingPenalty += industry === 'restaurant' ? 0.08 : 0.06
    level += 2
    reasons.push('clear_contact_path_reduces_cta_pain')
  }

  if (hasStrongContactCta && compressed.leadClass === 'technical_redesign' && ['electrician', 'plumber', 'hvac', 'restaurant'].includes(industry)) {
    painPenalty += industry === 'restaurant' ? 0.16 : 0.12
    buyingPenalty += 0.04
    level += 1
    reasons.push('contact_maturity_requires_stronger_technical_pain')
  }

  const matureBrand = reviewCount >= 120 && rating >= 4.6 && hasContactability
  if (matureBrand && compressed.leadClass !== 'technical_redesign') { painPenalty += 0.08; buyingPenalty += 0.05; level += 1; reasons.push('mature_local_brand') }

  const chainLike = includesAny(text, ['oris dental', 'europris', 'meny ', 'rema ', 'kiwi ', 'egon ', 'peppes', 'espresso house', 'baker hansen'])
  if (chainLike) { painPenalty += 0.18; buyingPenalty += 0.16; level += 2; reasons.push('chain_or_enterprise_like_business') }

  const publicSector = includesAny(String(item.url || meta.website || ''), ['.kommune.no', 'ofk.no', 'fylkeskommune'])
  if (publicSector) { painPenalty += 0.22; buyingPenalty += 0.2; level += 3; reasons.push('public_sector_low_fit') }

  if (String(item.status || '').toLowerCase() === 'failed' && (chainLike || publicSector) && hasVisibleContactPath) {
    painPenalty += 0.12
    buyingPenalty += 0.16
    level += 2
    reasons.push('audit_failed_chain_or_enterprise_verify')
  }

  if (industry === 'restaurant' && ['conversion_optimization', 'high_value_service_conversion'].includes(compressed.leadClass) && !highTicketRestaurantSignal(text)) {
    painPenalty += 0.16
    buyingPenalty += 0.1
    level += 2
    reasons.push('restaurant_generic_web_issue_lower_pressure')
  }

  if (industry === 'restaurant' && hasStrongContactCta && compressed.leadClass === 'technical_redesign') {
    painPenalty += 0.08
    buyingPenalty += 0.04
    level += 1
    reasons.push('restaurant_contact_maturity_lowers_fix_urgency')
  }

  if (industry === 'lawyer' && compressed.leadClass === 'high_value_service_conversion') {
    painPenalty += hasStrongContactCta ? 0.14 : 0.1
    buyingPenalty += hasStrongContactCta ? 0.08 : 0.06
    level += hasStrongContactCta ? 2 : 1
    reasons.push('law_firm_service_line_lower_immediate_pressure')
  }

  if (!hasMissingCta && Number((item.performance || {}).failedRequestCount || 0) === 0 && compressed.leadClass !== 'technical_redesign') {
    painPenalty += 0.05
    buyingPenalty += 0.03
    reasons.push('no_obvious_primary_pain')
  }

  return { painPenalty, buyingPenalty, reasons, level, hasStrongContactCta, hasVisibleContactPath, hasContactability }
}

function highTicketRestaurantSignal(text) {
  return includesAny(text, ['catering', 'selskap', 'private dining', 'event', 'konferanse', 'julebord', 'gruppe', 'reservasjon'])
}

function normalizeArray(value) { return Array.isArray(value) ? value.map(clean).filter(Boolean) : String(value || '').split('|').map(clean).filter(Boolean) }
function unique(values) { return [...new Set(values.filter(Boolean))] }
function clean(value) { return String(value == null ? '' : value).replace(/\s+/g, ' ').trim() }
function clamp(value) { return Math.max(0, Math.min(1, Math.round(Number(value || 0) * 100) / 100)) }
function includesAny(value, needles) { return needles.some((needle) => String(value || '').toLowerCase().includes(needle.toLowerCase())) }

module.exports = { buildCommercialPressure, normalizeCommercialPressure }
