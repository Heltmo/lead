const GROUPS = [
  'companyIdentity',
  'contactability',
  'digitalPresence',
  'marketProof',
  'recentActivity',
  'riskVerify',
]

function enrichOsint(lead = {}, options = {}) {
  const observedAt = options.observedAt || new Date().toISOString()
  const sellerIntent = normalizeIntent(options.sellerIntent || lead.sellerFit?.sellerIntent || lead.meta?.sellerIntent)
  const osint = emptyOsint({ observedAt, sellerIntent })
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const website = lead.website || {}
  const ranking = lead.ranking || {}
  const sourceQuality = lead.sourceQuality || {}
  const economy = lead.economy || {}

  addCompanyIdentity(osint, { company, sourceQuality, observedAt })
  addContactability(osint, { lead, contact, website, observedAt })
  addDigitalPresence(osint, { lead, contact, website, ranking, observedAt })
  addMarketProof(osint, { places, sourceQuality, observedAt })
  addRecentActivity(osint, { website, economy, observedAt })
  addRiskVerify(osint, { company, contact, website, ranking, sourceQuality, observedAt })

  osint.summary = summarizeOsint(osint)
  return { osint }
}

function emptyOsint({ observedAt, sellerIntent }) {
  return {
    status: 'completed',
    mode: 'selected_lead',
    observedAt,
    sellerIntent,
    summary: {
      evidenceCount: 0,
      riskCount: 0,
      sourceCount: 0,
      topSignals: [],
      topRisks: [],
    },
    companyIdentity: [],
    contactability: [],
    digitalPresence: [],
    marketProof: [],
    recentActivity: [],
    riskVerify: [],
    sources: [],
  }
}

function addCompanyIdentity(osint, { company, sourceQuality, observedAt }) {
  if (company.organizationNumber) {
    addSignal(osint, 'companyIdentity', {
      label: 'Confirmed org.nr',
      value: company.organizationNumber,
      confidence: confidenceFromNumber(company.matchConfidence, 'high'),
      sourceName: sourceQuality.identitySource || company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  } else if (company.candidateOrganizationNumber) {
    addSignal(osint, 'companyIdentity', {
      label: 'Candidate org.nr',
      value: company.candidateOrganizationNumber,
      confidence: confidenceFromNumber(company.matchConfidence, 'medium'),
      riskLevel: 'medium',
      sourceName: sourceQuality.identitySource || company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  } else {
    addSignal(osint, 'riskVerify', {
      label: 'Company identity not confirmed',
      value: company.matchStatus || 'not_confirmed',
      confidence: 'medium',
      riskLevel: 'medium',
      sourceName: sourceQuality.identitySource || company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  }

  if (company.legalName || company.candidateLegalName) {
    addSignal(osint, 'companyIdentity', {
      label: 'Legal name',
      value: company.legalName || company.candidateLegalName,
      confidence: company.legalName ? 'high' : 'medium',
      sourceName: company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  }

  if (company.activeStatus) {
    addSignal(osint, company.activeStatus === 'active' ? 'companyIdentity' : 'riskVerify', {
      label: 'Company status',
      value: company.activeStatus,
      confidence: 'high',
      riskLevel: company.activeStatus === 'active' ? 'low' : 'high',
      sourceName: company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  }

  if (company.employees !== undefined && company.employees !== null && company.employees !== '') {
    addSignal(osint, 'companyIdentity', {
      label: 'Registered employees',
      value: String(company.employees),
      confidence: 'medium',
      sourceName: company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  }

  if (company.naceCode || company.naceDescription) {
    addSignal(osint, 'companyIdentity', {
      label: 'Industry category',
      value: [company.naceCode, company.naceDescription].filter(Boolean).join(' - '),
      confidence: 'medium',
      sourceName: company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  }
}

function addContactability(osint, { lead, contact, website, observedAt }) {
  const phone = contact.phone || lead.phone
  const email = contact.email || lead.email
  const websiteUrl = websiteValue(contact.website || lead.website)

  if (phone) {
    addSignal(osint, 'contactability', {
      label: 'Direct phone',
      value: phone,
      confidence: 'high',
      sourceName: 'Lead public source',
      sourceUrl: null,
      observedAt,
    })
  } else {
    addSignal(osint, 'riskVerify', {
      label: 'No direct phone found',
      value: 'missing',
      confidence: 'medium',
      riskLevel: 'medium',
      sourceName: 'Lead public source',
      sourceUrl: null,
      observedAt,
    })
  }

  if (email) {
    addSignal(osint, 'contactability', {
      label: 'Email contact path',
      value: email,
      confidence: 'medium',
      sourceName: 'Digital presence check',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }

  if (websiteUrl) {
    addSignal(osint, 'contactability', {
      label: 'Website contact path',
      value: websiteUrl,
      confidence: 'medium',
      sourceName: 'Website',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }

  if (website.contactability) {
    addSignal(osint, 'contactability', {
      label: 'Website contactability',
      value: website.contactability,
      confidence: 'medium',
      sourceName: 'Digital presence check',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }
}

function addDigitalPresence(osint, { lead, contact, website, ranking, observedAt }) {
  const websiteUrl = websiteValue(contact.website || lead.website)
  if (websiteUrl) {
    addSignal(osint, 'digitalPresence', {
      label: 'Website found',
      value: websiteUrl,
      confidence: 'medium',
      sourceName: 'Website',
      sourceUrl: websiteUrl,
      observedAt,
    })
  } else {
    addSignal(osint, 'riskVerify', {
      label: 'No website found',
      value: 'missing',
      confidence: 'medium',
      riskLevel: 'low',
      sourceName: 'Lead public source',
      sourceUrl: null,
      observedAt,
    })
  }

  if (website.auditStatus) {
    addSignal(osint, 'digitalPresence', {
      label: 'Digital presence status',
      value: website.auditStatus,
      confidence: website.auditStatus === 'completed' ? 'high' : 'medium',
      sourceName: 'Digital presence check',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }

  for (const item of normalizeList(website.topEvidence).slice(0, 4)) {
    addSignal(osint, 'digitalPresence', {
      label: 'Digital evidence',
      value: item,
      confidence: 'medium',
      sourceName: 'Digital presence check',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }

  for (const item of normalizeList(ranking.whyRanked).filter(isDigitalSignal).slice(0, 3)) {
    addSignal(osint, 'digitalPresence', {
      label: 'Digital sales signal',
      value: item,
      confidence: 'medium',
      sourceName: 'Lead ranking evidence',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }
}

function addMarketProof(osint, { places, sourceQuality, observedAt }) {
  if (places.rating) {
    addSignal(osint, 'marketProof', {
      label: 'Google rating',
      value: `${places.rating}/5`,
      confidence: 'medium',
      sourceName: places.provider || 'Google Places',
      sourceUrl: places.url || null,
      observedAt,
    })
  }

  if (places.reviewCount !== undefined && places.reviewCount !== null && places.reviewCount !== '') {
    addSignal(osint, 'marketProof', {
      label: 'Google reviews',
      value: String(places.reviewCount),
      confidence: 'medium',
      sourceName: places.provider || 'Google Places',
      sourceUrl: places.url || null,
      observedAt,
    })
  }

  if (sourceQuality.locationMatchStatus) {
    addSignal(osint, sourceQuality.locationMatchStatus === 'exact_location' ? 'marketProof' : 'riskVerify', {
      label: 'Location match',
      value: sourceQuality.locationMatchStatus,
      confidence: confidenceFromNumber(sourceQuality.locationConfidence, 'medium'),
      riskLevel: sourceQuality.locationMatchStatus === 'exact_location' ? 'low' : 'medium',
      sourceName: sourceQuality.presenceSource || places.provider || 'Lead public source',
      sourceUrl: places.url || null,
      observedAt,
    })
  }

  if (sourceQuality.discoveryQuality?.level || sourceQuality.discoveryConfidence) {
    addSignal(osint, 'marketProof', {
      label: 'Discovery confidence',
      value: sourceQuality.discoveryQuality?.level || sourceQuality.discoveryConfidence,
      confidence: 'medium',
      sourceName: 'Discovery quality',
      sourceUrl: null,
      observedAt,
    })
  }
}

function addRecentActivity(osint, { website, economy, observedAt }) {
  const activitySignals = [
    ...normalizeList(website.recentActivity),
    ...normalizeList(website.topEvidence).filter((item) => /news|hiring|job|ledig|stilling|updated|recent|activity/i.test(item)),
  ].slice(0, 4)

  for (const item of activitySignals) {
    addSignal(osint, 'recentActivity', {
      label: 'Recent public activity',
      value: item,
      confidence: 'low',
      sourceName: 'Public web signal',
      sourceUrl: websiteValue(website),
      observedAt,
    })
  }

  if (economy.status === 'success') {
    addSignal(osint, 'recentActivity', {
      label: 'Economy data attached',
      value: 'available',
      confidence: 'medium',
      sourceName: economy.source || 'Economy source',
      sourceUrl: economy.sourceUrl || null,
      observedAt,
    })
  }
}

function addRiskVerify(osint, { company, contact, website, ranking, sourceQuality, observedAt }) {
  for (const item of normalizeList(company.warnings).slice(0, 4)) {
    addSignal(osint, 'riskVerify', {
      label: 'Company warning',
      value: item,
      confidence: 'medium',
      riskLevel: 'medium',
      sourceName: company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  }

  for (const item of normalizeList(ranking.caution).slice(0, 4)) {
    addSignal(osint, 'riskVerify', {
      label: 'Caution',
      value: item,
      confidence: 'medium',
      riskLevel: 'medium',
      sourceName: 'Lead ranking evidence',
      sourceUrl: websiteValue(contact.website || website),
      observedAt,
    })
  }

  if (sourceQuality.locationMatchStatus && sourceQuality.locationMatchStatus !== 'exact_location') {
    addSignal(osint, 'riskVerify', {
      label: 'Location needs verification',
      value: sourceQuality.locationMatchStatus,
      confidence: confidenceFromNumber(sourceQuality.locationConfidence, 'medium'),
      riskLevel: 'medium',
      sourceName: sourceQuality.presenceSource || 'Lead public source',
      sourceUrl: null,
      observedAt,
    })
  }
}

function addSignal(osint, group, signal) {
  if (!GROUPS.includes(group)) throw new Error(`Unknown OSINT group: ${group}`)
  const normalized = {
    label: clean(signal.label),
    value: clean(signal.value),
    confidence: normalizeConfidence(signal.confidence),
    riskLevel: normalizeRisk(signal.riskLevel),
    source: {
      name: clean(signal.sourceName || 'Public source'),
      url: clean(signal.sourceUrl),
      unavailableReason: signal.sourceUrl ? '' : 'source_url_unavailable',
    },
    observedAt: clean(signal.observedAt),
  }
  if (!normalized.label || !normalized.value) return
  osint[group].push(normalized)
  addSource(osint, normalized.source, normalized.observedAt, normalized.confidence)
}

function addSource(osint, source, observedAt, confidence) {
  const key = `${source.name}::${source.url || source.unavailableReason}`
  if (osint.sources.some((item) => item.key === key)) return
  osint.sources.push({
    key,
    name: source.name,
    url: source.url || '',
    unavailableReason: source.url ? '' : source.unavailableReason || 'source_url_unavailable',
    observedAt,
    confidence,
  })
}

function summarizeOsint(osint) {
  const evidence = [
    ...osint.companyIdentity,
    ...osint.contactability,
    ...osint.digitalPresence,
    ...osint.marketProof,
    ...osint.recentActivity,
  ]
  return {
    evidenceCount: evidence.length,
    riskCount: osint.riskVerify.length,
    sourceCount: osint.sources.length,
    topSignals: evidence.slice(0, 5).map(signalSummary),
    topRisks: osint.riskVerify.slice(0, 5).map(signalSummary),
  }
}

function signalSummary(signal) {
  return `${signal.label}: ${signal.value}`
}

function confidenceFromNumber(value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  if (number >= 0.8 || number >= 80) return 'high'
  if (number >= 0.45 || number >= 45) return 'medium'
  return 'low'
}

function normalizeConfidence(value) {
  const normalized = clean(value).toLowerCase()
  return ['high', 'medium', 'low'].includes(normalized) ? normalized : 'medium'
}

function normalizeRisk(value) {
  const normalized = clean(value).toLowerCase()
  return ['high', 'medium', 'low'].includes(normalized) ? normalized : 'low'
}

function normalizeIntent(value) {
  return String(value || 'general_b2b').trim().toLowerCase().replace(/[\s-]+/g, '_') || 'general_b2b'
}

function normalizeList(values) {
  if (!values) return []
  if (Array.isArray(values)) return values.map(clean).filter(Boolean)
  return [clean(values)].filter(Boolean)
}

function isDigitalSignal(value) {
  return /website|digital|technical|trust|accessibility|contact|social|cta|conversion/i.test(String(value || ''))
}

function websiteValue(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object') return String(value.url || value.href || value.website || value.uri || value.sourceUrl || '').trim()
  return ''
}

function clean(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

module.exports = { enrichOsint, GROUPS }
