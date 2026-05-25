function buildCommercialPressure(item = {}) {
  const compressed = item.compressedOpportunity || {}
  const meta = item.sourceMetadata || {}
  const issueCategories = item.issueCategories || {}
  const performance = item.performance || {}
  const status = String(item.status || '').toLowerCase()
  const leadClass = clean(compressed.leadClass || '')
  const type = clean(compressed.type || '')
  let painScore = 0.35
  let buyingLikelihood = 0.35
  const reasons = []

  if (status === 'failed') {
    painScore += 0.15
    buyingLikelihood -= 0.15
    reasons.push('audit_failed_verify_manually')
  }

  if (leadClass === 'technical_redesign' || type === 'technical_trust_risk') {
    painScore += 0.34
    buyingLikelihood += 0.22
    reasons.push('visible_technical_trust_pain')
  }
  if (leadClass === 'brand_identity' || type === 'brand_identity_confusion') {
    painScore += 0.3
    buyingLikelihood += 0.18
    reasons.push('brand_or_search_identity_confusion')
  }
  if (leadClass === 'high_value_service_conversion' || type === 'high_value_service_conversion_gap') {
    painScore += 0.2
    buyingLikelihood += 0.12
    reasons.push('high_value_service_conversion_leak')
  }
  if (leadClass === 'conversion_optimization') {
    painScore += 0.18
    buyingLikelihood += 0.1
    reasons.push('conversion_path_friction')
  }
  if (leadClass === 'campaign_optimization' || type === 'modern_site_campaign_optimization') {
    painScore -= 0.12
    buyingLikelihood -= 0.06
    reasons.push('modern_site_lower_immediate_pain')
  }

  const failedRequests = Number(performance.failedRequestCount || 0)
  const consoleErrors = Number(performance.consoleErrorCount || 0)
  if (failedRequests >= 5) { painScore += 0.18; buyingLikelihood += 0.08; reasons.push('many_failed_requests') }
  else if (failedRequests >= 2) { painScore += 0.1; reasons.push('failed_requests') }
  if (consoleErrors > 0) { painScore += 0.08; reasons.push('console_errors') }
  if (Number(issueCategories.accessibility || 0) > 0) { painScore += 0.07; reasons.push('accessibility_usability_pain') }
  if (Number(issueCategories.conversion || 0) > 0) { painScore += 0.07; buyingLikelihood += 0.04; reasons.push('conversion_issue_detected') }
  if (Number(issueCategories.seo || 0) > 0) { painScore += 0.04; reasons.push('search_clarity_issue') }

  const hasPhone = Boolean(meta.phone || (item.phones || [])[0])
  const hasEmail = Boolean((item.emails || [])[0])
  if (hasPhone) { buyingLikelihood += 0.16; reasons.push('callable_phone_available') }
  else { buyingLikelihood -= 0.18; reasons.push('phone_missing') }
  if (hasEmail) { buyingLikelihood += 0.05; reasons.push('email_available') }
  if (String(meta.sourceType || '') === 'directBusiness') { buyingLikelihood += 0.08; reasons.push('direct_business_site') }
  if (String(meta.businessStatus || '') === 'OPERATIONAL') { buyingLikelihood += 0.05; reasons.push('operational_business') }

  const reviewCount = Number(meta.reviewCount || 0)
  const rating = Number(meta.rating || 0)
  if (reviewCount >= 100 && rating >= 4.6) {
    buyingLikelihood += leadClass === 'campaign_optimization' ? 0.05 : 0.08
    reasons.push('strong_local_proof')
  }
  if (leadClass === 'campaign_optimization' && reviewCount >= 100) reasons.push('growth_conversation_not_fix_pitch')

  painScore = clamp(painScore)
  buyingLikelihood = clamp(buyingLikelihood)
  const callPriority = priority(painScore, buyingLikelihood, leadClass, status)
  return normalizeCommercialPressure({
    painScore,
    buyingLikelihood,
    callPriority,
    salesEase: salesEase(painScore, buyingLikelihood, leadClass, hasPhone),
    commercialPressureReasons: unique(reasons).slice(0, 5),
  })
}

function normalizeCommercialPressure(value = {}) {
  return {
    painScore: clamp(Number(value.painScore || 0.35)),
    buyingLikelihood: clamp(Number(value.buyingLikelihood || 0.35)),
    callPriority: clean(value.callPriority) || 'medium',
    salesEase: clean(value.salesEase) || 'medium',
    commercialPressureReasons: normalizeArray(value.commercialPressureReasons).slice(0, 5),
  }
}

function priority(pain, buying, leadClass, status) {
  if (status === 'failed') return 'verify'
  if (pain >= 0.72 && buying >= 0.62) return 'high'
  if (leadClass === 'technical_redesign' && pain >= 0.65 && buying >= 0.55) return 'high'
  if (pain >= 0.55 && buying >= 0.48) return 'medium'
  return 'low'
}

function salesEase(pain, buying, leadClass, hasPhone) {
  if (!hasPhone) return 'low'
  if (leadClass === 'technical_redesign' && pain >= 0.65) return 'high'
  if (leadClass === 'campaign_optimization') return 'low'
  if (pain >= 0.6 && buying >= 0.55) return 'medium'
  return 'medium'
}

function normalizeArray(value) { return Array.isArray(value) ? value.map(clean).filter(Boolean) : String(value || '').split('|').map(clean).filter(Boolean) }
function unique(values) { return [...new Set(values.filter(Boolean))] }
function clean(value) { return String(value == null ? '' : value).replace(/\s+/g, ' ').trim() }
function clamp(value) { return Math.max(0, Math.min(1, Math.round(Number(value || 0) * 100) / 100)) }

module.exports = { buildCommercialPressure, normalizeCommercialPressure }
