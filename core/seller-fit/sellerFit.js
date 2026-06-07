const SELLER_INTENTS = new Set([
  'general_b2b',
  'web_it',
  'ads_marketing',
  'telecom',
  'accounting',
  'insurance',
  'finance',
  'recruiting',
  'other',
])

function evaluateSellerFit(lead = {}, sellerIntent = 'general_b2b', sellerProfile = {}) {
  const intent = normalizeSellerIntent(sellerIntent)
  const profile = normalizeSellerProfile(sellerProfile)
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const website = lead.website || {}
  const sourceQuality = lead.sourceQuality || {}
  const economy = lead.economy || {}
  const ranking = lead.ranking || {}

  const hasPhone = Boolean(contact.phone || lead.phone)
  const hasEmail = Boolean(contact.email || lead.email)
  const hasWebsite = Boolean(websiteValue(contact.website || lead.website))
  const exactLocation = sourceQuality.locationMatchStatus === 'exact_location'
  const confirmedOrg = Boolean(company.organizationNumber)
  const candidateOrg = Boolean(company.candidateOrganizationNumber || ['manual_verify', 'weak_match'].includes(String(company.matchStatus || '').toLowerCase()))
  const active = !company.activeStatus || String(company.activeStatus).toLowerCase() === 'active'
  const employees = toNumber(company.employees)
  const rating = toNumber(places.rating)
  const reviews = toNumber(places.reviewCount)
  const fast = isFastLead(lead)
  const digitalRisk = hasDigitalRisk(lead)
  const economyAvailable = economy.status === 'success' || economy.revenue != null || economy.profit != null
  const leadText = searchableLeadText(lead)

  let score = 0
  const fitReasons = []
  const riskReasons = []
  const importantSignals = []

  add(scoreDelta(active, 2, 'active company', fitReasons, 'company activity is unclear', riskReasons))
  add(scoreDelta(hasPhone, 4, 'direct phone available', fitReasons, 'no direct phone found', riskReasons, -4))
  add(scoreDelta(hasEmail, 1, 'email path available', fitReasons))
  add(scoreDelta(confirmedOrg, 4, 'confirmed org.nr', fitReasons))
  if (!confirmedOrg && candidateOrg) {
    score += 2
    fitReasons.push('candidate org.nr available')
    riskReasons.push('candidate org.nr must be verified')
  } else if (!confirmedOrg && !candidateOrg) {
    score -= 2
    riskReasons.push('company identity not confirmed')
  }
  add(scoreDelta(exactLocation, 2, 'location matches search', fitReasons, 'location needs review', riskReasons, -2))
  if (rating >= 4) {
    score += 1
    fitReasons.push('positive Google rating')
  }
  if (reviews >= 5) {
    score += 1
    fitReasons.push('public review activity')
  }
  if (employees > 0) {
    score += 1
    fitReasons.push('registered employees')
  }
  if (employees >= 10) {
    score += 1
    fitReasons.push('meaningful company size')
  }

  if (profile.territory) {
    importantSignals.push('seller geography is part of this search setup')
    const geographyMatch = firstMatchingKeyword(leadText, profile.territoryKeywords)
    if (geographyMatch) {
      score += 1
      fitReasons.push('matches seller geography: ' + geographyMatch)
    }
  }

  if (profile.goodCustomer) {
    importantSignals.push('good-customer hints are part of this seller setup')
    const goodCustomerMatch = firstMatchingKeyword(leadText, profile.goodCustomerKeywords)
    if (goodCustomerMatch) {
      score += 2
      fitReasons.push('matches good-customer hint: ' + goodCustomerMatch)
    }
  }

  if (profile.disqualifiers) {
    importantSignals.push('disqualifiers are part of this seller setup')
    const disqualifierMatch = firstMatchingKeyword(leadText, profile.disqualifierKeywords)
    if (disqualifierMatch) {
      score -= 5
      riskReasons.push('matches disqualifier: ' + disqualifierMatch)
    }
  }

  if (intent === 'web_it') {
    importantSignals.push('digital presence and website quality matter more for this seller intent')
    if (digitalRisk) {
      score += 3
      fitReasons.push('digital presence issue may be relevant')
    } else if (fast && hasWebsite) {
      importantSignals.push('website is unverified until enrichment runs')
    }
  }

  if (intent === 'ads_marketing') {
    importantSignals.push('Google presence, reviews, website and local visibility matter more')
    if (reviews >= 10) score += 2
    if (hasWebsite) score += 1
    if (!hasWebsite) riskReasons.push('website/social presence should be checked before ad-sales prioritization')
  }

  if (intent === 'telecom') {
    importantSignals.push('phone availability, locations, size and active company status matter more')
    if (hasPhone) score += 2
    if (employees >= 5) score += 1
    if (!hasPhone) riskReasons.push('telecom seller needs a better contact path')
  }

  if (['accounting', 'finance', 'insurance'].includes(intent)) {
    importantSignals.push('verified legal identity, company form, employees and economy readiness matter more')
    if (confirmedOrg) score += 2
    if (company.organizationForm) score += 1
    if (economyAvailable) score += 2
    if (!confirmedOrg) riskReasons.push('legal identity should be verified before financial-service prioritization')
  }

  if (intent === 'recruiting') {
    importantSignals.push('employee count, growth/activity and public company context matter more')
    if (employees >= 5) score += 2
    if (employees >= 20) score += 2
    if (employees === 0) riskReasons.push('no employees registered; recruiting fit may be weak')
  }

  if (fast) {
    importantSignals.push('fast scan candidate; enrichment is optional when more context is needed')
  }

  if (sourceQuality.locationMatchStatus && sourceQuality.locationMatchStatus !== 'exact_location') {
    riskReasons.push('location is not confirmed exact')
  }

  const sellerFit = score >= 12 ? 'strong' : score >= 8 ? 'good' : score >= 4 ? 'review' : 'weak'
  const recommendedAction = recommendedActionFor({ sellerFit, hasPhone, confirmedOrg, candidateOrg, fast, intent, digitalRisk, ranking })

  return {
    sellerIntent: intent,
    sellerProfile: publicSellerProfile(profile),
    sellerFit,
    score,
    fitReasons: unique(fitReasons).slice(0, 8),
    riskReasons: unique(riskReasons).slice(0, 8),
    importantSignals: unique(importantSignals).slice(0, 6),
    recommendedAction,
  }

  function add(delta) {
    score += delta
  }
}

function recommendedActionFor({ sellerFit, hasPhone, confirmedOrg, candidateOrg, fast, intent, digitalRisk }) {
  if (!hasPhone) return 'review'
  if (!confirmedOrg && candidateOrg) return 'verify'
  if (!confirmedOrg && !candidateOrg) return 'review'
  if (fast && intent === 'web_it' && digitalRisk) return 'review'
  if (fast && ['strong', 'good'].includes(sellerFit)) return 'contact'
  if (sellerFit === 'weak') return 'skip'
  return 'review'
}

function normalizeSellerIntent(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  return SELLER_INTENTS.has(normalized) ? normalized : 'general_b2b'
}

function normalizeSellerProfile(profile = {}) {
  const input = profile && typeof profile === 'object' ? profile : {}
  const territory = limitSetupText(input.territory, 120)
  const goodCustomer = limitSetupText(input.goodCustomer || input.idealCustomer, 260)
  const disqualifiers = limitSetupText(input.disqualifiers || input.disqualifier, 260)
  return {
    territory,
    goodCustomer,
    disqualifiers,
    territoryKeywords: setupKeywords(territory),
    goodCustomerKeywords: setupKeywords(goodCustomer),
    disqualifierKeywords: setupKeywords(disqualifiers),
  }
}

function publicSellerProfile(profile = {}) {
  return {
    territory: profile.territory || '',
    goodCustomer: profile.goodCustomer || '',
    disqualifiers: profile.disqualifiers || '',
  }
}

function setupKeywords(value) {
  return unique(String(value || '')
    .toLowerCase()
    .normalize('NFKC')
    .split(/[^\p{L}\p{N}]+/u)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && !STOPWORDS.has(item))
  ).slice(0, 10)
}

function firstMatchingKeyword(text, keywords = []) {
  const haystack = String(text || '').toLowerCase()
  return keywords.find((keyword) => haystack.includes(keyword)) || ''
}

function searchableLeadText(lead = {}) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const sourceQuality = lead.sourceQuality || {}
  return [
    company.displayName, company.legalName, company.candidateLegalName, company.organizationForm, company.registeredAddress,
    company.municipality, company.naceCode, company.naceDescription, contact.city, contact.address, lead.city, lead.address,
    sourceQuality.requestedLocation, sourceQuality.candidateLocation, sourceQuality.marketSweepCity, sourceQuality.verticalMatchedTerm,
    ...(lead.ranking?.whyRanked || []), ...(lead.ranking?.caution || []), ...(lead.website?.topEvidence || []),
  ].filter(Boolean).join(' ').toLowerCase()
}

function limitSetupText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)
}

const STOPWORDS = new Set(['eller', 'ikke', 'med', 'for', 'som', 'the', 'and', 'but', 'uten', 'har', 'til', 'fra'])

function websiteValue(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object') return String(value.url || value.href || value.website || value.uri || '').trim()
  return ''
}

function isFastLead(lead = {}) {
  return lead.meta?.mode === 'fast' || lead.website?.auditStatus === 'skipped_fast_mode' || lead.leadClass === 'fast_discovery'
}

function hasDigitalRisk(lead = {}) {
  const values = [
    lead.opportunityType,
    lead.leadClass,
    ...(lead.ranking?.whyRanked || []),
    ...(lead.website?.topEvidence || []),
  ].join(' ').toLowerCase()
  return /technical|trust|website|accessibility|failed|usability|digital|no social|conversion/.test(values)
}

function scoreDelta(condition, positive, positiveReason, fitReasons, negativeReason, riskReasons, negative = 0) {
  if (condition) {
    if (positiveReason) fitReasons.push(positiveReason)
    return positive
  }
  if (negativeReason && riskReasons) riskReasons.push(negativeReason)
  return negative
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)))
}

module.exports = { evaluateSellerFit, normalizeSellerIntent, normalizeSellerProfile, SELLER_INTENTS: Array.from(SELLER_INTENTS) }
