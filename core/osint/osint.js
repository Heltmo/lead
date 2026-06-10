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
      label: 'Bekreftet org.nr',
      value: company.organizationNumber,
      confidence: confidenceFromNumber(company.matchConfidence, 'high'),
      sourceName: sourceQuality.identitySource || company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  } else if (company.candidateOrganizationNumber) {
    addSignal(osint, 'companyIdentity', {
      label: 'Kandidat org.nr',
      value: company.candidateOrganizationNumber,
      confidence: confidenceFromNumber(company.matchConfidence, 'medium'),
      riskLevel: 'medium',
      sourceName: sourceQuality.identitySource || company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  } else {
    addSignal(osint, 'riskVerify', {
      label: 'Firmaidentitet ikke bekreftet',
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
      label: 'Juridisk navn',
      value: company.legalName || company.candidateLegalName,
      confidence: company.legalName ? 'high' : 'medium',
      sourceName: company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  }

  if (company.activeStatus) {
    addSignal(osint, company.activeStatus === 'active' ? 'companyIdentity' : 'riskVerify', {
      label: 'Firmastatus',
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
      label: 'Registrerte ansatte',
      value: String(company.employees),
      confidence: 'medium',
      sourceName: company.source || 'Brreg',
      sourceUrl: company.sourceUrl,
      observedAt,
    })
  }

  if (company.naceCode || company.naceDescription) {
    addSignal(osint, 'companyIdentity', {
      label: 'Bransjekategori',
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
      label: 'Direkte telefon',
      value: phone,
      confidence: 'high',
      sourceName: 'Offentlig kilde for lead',
      sourceUrl: null,
      observedAt,
    })
  } else {
    addSignal(osint, 'riskVerify', {
      label: 'Ingen direkte telefon funnet',
      value: 'missing',
      confidence: 'medium',
      riskLevel: 'medium',
      sourceName: 'Offentlig kilde for lead',
      sourceUrl: null,
      observedAt,
    })
  }

  if (email) {
    addSignal(osint, 'contactability', {
      label: 'E-postvei',
      value: email,
      confidence: 'medium',
      sourceName: 'Nettsidesjekk',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }

  if (websiteUrl) {
    addSignal(osint, 'contactability', {
      label: 'Kontaktvei på nettsiden',
      value: websiteUrl,
      confidence: 'medium',
      sourceName: 'Website',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }

  if (website.contactability) {
    addSignal(osint, 'contactability', {
      label: 'Nettside-kontaktbarhet',
      value: website.contactability,
      confidence: 'medium',
      sourceName: 'Nettsidesjekk',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }
}

function addDigitalPresence(osint, { lead, contact, website, ranking, observedAt }) {
  const websiteUrl = websiteValue(contact.website || lead.website)
  if (websiteUrl) {
    addSignal(osint, 'digitalPresence', {
      label: 'Nettside funnet',
      value: websiteUrl,
      confidence: 'medium',
      sourceName: 'Website',
      sourceUrl: websiteUrl,
      observedAt,
    })
  } else {
    addSignal(osint, 'riskVerify', {
      label: 'Ingen nettside funnet',
      value: 'missing',
      confidence: 'medium',
      riskLevel: 'low',
      sourceName: 'Offentlig kilde for lead',
      sourceUrl: null,
      observedAt,
    })
  }

  if (website.auditStatus) {
    addSignal(osint, 'digitalPresence', {
      label: 'Digital synlighetsstatus',
      value: website.auditStatus,
      confidence: website.auditStatus === 'completed' ? 'high' : 'medium',
      sourceName: 'Nettsidesjekk',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }

  for (const item of normalizeList(website.topEvidence).slice(0, 4)) {
    addSignal(osint, 'digitalPresence', {
      label: 'Digitale bevis',
      value: item,
      confidence: 'medium',
      sourceName: 'Nettsidesjekk',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }

  for (const item of normalizeList(ranking.whyRanked).filter(isDigitalSignal).slice(0, 3)) {
    addSignal(osint, 'digitalPresence', {
      label: 'Digitalt salgssignal',
      value: item,
      confidence: 'medium',
      sourceName: 'Lead-rangeringsbevis',
      sourceUrl: websiteUrl,
      observedAt,
    })
  }
}

function addMarketProof(osint, { places, sourceQuality, observedAt }) {
  if (places.rating) {
    addSignal(osint, 'marketProof', {
      label: 'Google-vurdering',
      value: `${places.rating}/5`,
      confidence: 'medium',
      sourceName: places.provider || 'Google Places',
      sourceUrl: places.url || null,
      observedAt,
    })
  }

  if (places.reviewCount !== undefined && places.reviewCount !== null && places.reviewCount !== '') {
    addSignal(osint, 'marketProof', {
      label: 'Google-omtaler',
      value: String(places.reviewCount),
      confidence: 'medium',
      sourceName: places.provider || 'Google Places',
      sourceUrl: places.url || null,
      observedAt,
    })
  }

  if (sourceQuality.locationMatchStatus) {
    addSignal(osint, sourceQuality.locationMatchStatus === 'exact_location' ? 'marketProof' : 'riskVerify', {
      label: 'Stedstreff',
      value: sourceQuality.locationMatchStatus,
      confidence: confidenceFromNumber(sourceQuality.locationConfidence, 'medium'),
      riskLevel: sourceQuality.locationMatchStatus === 'exact_location' ? 'low' : 'medium',
      sourceName: sourceQuality.presenceSource || places.provider || 'Offentlig kilde for lead',
      sourceUrl: places.url || null,
      observedAt,
    })
  }

  if (sourceQuality.discoveryQuality?.level || sourceQuality.discoveryConfidence) {
    addSignal(osint, 'marketProof', {
      label: 'Treffsikkerhet',
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
      label: 'Nylig offentlig aktivitet',
      value: item,
      confidence: 'low',
      sourceName: 'Offentlig nettsignal',
      sourceUrl: websiteValue(website),
      observedAt,
    })
  }

  if (economy.status === 'success') {
    addSignal(osint, 'recentActivity', {
      label: 'Økonomidata vedlagt',
      value: 'available',
      confidence: 'medium',
      sourceName: economy.source || 'Økonomikilde',
      sourceUrl: economy.sourceUrl || null,
      observedAt,
    })
  }
}

function addRiskVerify(osint, { company, contact, website, ranking, sourceQuality, observedAt }) {
  for (const item of normalizeList(company.warnings).slice(0, 4)) {
    addSignal(osint, 'riskVerify', {
      label: 'Firmavarsel',
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
      label: 'Obs',
      value: item,
      confidence: 'medium',
      riskLevel: 'medium',
      sourceName: 'Lead-rangeringsbevis',
      sourceUrl: websiteValue(contact.website || website),
      observedAt,
    })
  }

  if (sourceQuality.locationMatchStatus && sourceQuality.locationMatchStatus !== 'exact_location') {
    addSignal(osint, 'riskVerify', {
      label: 'Sted må verifiseres',
      value: sourceQuality.locationMatchStatus,
      confidence: confidenceFromNumber(sourceQuality.locationConfidence, 'medium'),
      riskLevel: 'medium',
      sourceName: sourceQuality.presenceSource || 'Offentlig kilde for lead',
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
      name: clean(signal.sourceName || 'Offentlig kilde'),
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
