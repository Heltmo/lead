function buildBusinessSignalProfile(item = {}) {
  const evidence = collectEvidence(item)
  const signals = [
    onlineBookingSignal(evidence),
    highValueServiceSignal(evidence),
    specialistServiceSignal(evidence),
    teamAuthoritySignal(evidence),
    pricingTransparencySignal(evidence),
    socialPresenceSignal(evidence),
    newPatientSignal(evidence),
    missingPrimaryCtaSignal(evidence),
    localTrustSignal(evidence),
    contactabilitySignal(evidence),
  ].filter(Boolean)
  const contradictions = detectContradictions(signals, evidence)
  return {
    version: 1,
    signals: signals.sort((a, b) => b.strength - a.strength || b.confidence - a.confidence),
    contradictions,
    topOpportunities: rankOpportunities(signals, contradictions),
  }
}

function collectEvidence(item = {}) {
  const meta = item.sourceMetadata || {}
  const pageSignals = item.pageSignals || {}
  const headings = normalizeSignalTexts(pageSignals.headings)
  const pageLinks = normalizeLinks(pageSignals.links)
  const linkTexts = pageLinks.map((link) => link.text).filter(Boolean)
  const issues = normalizeArray(item.issues)
  const issueText = issues.join(' ').toLowerCase()
  const categories = item.issueCategories || {}
  const performance = item.performance || {}
  const phones = normalizeArray(item.phones)
  const emails = normalizeArray(item.emails)
  const technologies = normalizeArray(item.technologies)
  const searchText = [item.pageTitle, item.title, pageSignals.metaDescription, ...headings, ...linkTexts, ...pageLinks.map((link) => link.href)].join(' ').toLowerCase()
  return {
    businessName: clean(item.name || meta.businessName || item.title || item.pageTitle || ''),
    pageTitle: clean(item.pageTitle || item.title),
    industry: clean(item.industry || meta.industry),
    location: clean(item.location || meta.location || meta.address),
    phone: clean(meta.phone || phones[0]),
    rating: numeric(meta.rating, 0),
    reviewCount: numeric(meta.reviewCount, 0),
    businessStatus: clean(meta.businessStatus),
    sourceType: clean(meta.sourceType),
    technologies,
    primaryTechnology: technologies[0] || '',
    headings,
    pageLinks,
    searchText,
    issues,
    issueText,
    categories,
    performance: {
      responseStatus: numeric(performance.responseStatus, 0),
      failedRequestCount: numeric(performance.failedRequestCount, 0),
      consoleErrorCount: numeric(performance.consoleErrorCount, 0),
    },
    emails,
    phones,
    missingCta: hasCategory(categories, 'conversion') || includesAny(issueText, ['no clear cta', 'missing cta']),
  }
}

function highValueServiceSignal(e) {
  const matches = highValueServiceMatches(e)
  if (!matches.length) return null
  return signal({
    id: 'high_value_service',
    category: 'positioning',
    strength: matches.length > 1 ? 0.88 : 0.72,
    confidence: 0.84,
    observation: {
      exists: true,
      industry: e.industry,
      verticalSignals: matches.map((item) => item.id),
      evidence: matches.map((item) => item.evidence).filter(Boolean).slice(0, 3).join(' | '),
    },
    interpretation: {
      businessImpact: 'positioning',
      opportunity: 'high_value_service_conversion',
    },
  })
}

function onlineBookingSignal(e) {
  const bookingLinks = e.pageLinks.filter((link) => isBookingLink(link))
  if (!bookingLinks.length) return null
  const visibleTextLinks = bookingLinks.filter((link) => link.text).length
  const ctaProminence = visibleTextLinks ? 0.58 : 0.22
  return signal({
    id: 'online_booking',
    category: 'conversion',
    strength: bookingLinks.some((link) => link.href.includes('opusdentalonline')) ? 0.86 : 0.72,
    confidence: 0.92,
    observation: {
      exists: true,
      linkCount: bookingLinks.length,
      ctaProminence,
      evidence: summarizeLinks(bookingLinks),
    },
    interpretation: {
      businessImpact: 'conversion',
      opportunity: ctaProminence < 0.45 ? 'booking_visibility' : 'booking_flow_optimization',
    },
  })
}

function specialistServiceSignal(e) {
  const matches = highValueServiceMatches(e).filter((item) => ['orthodontics', 'specialist_positioning'].includes(item.id))
  if (!matches.length) return null
  return signal({
    id: 'specialist_service',
    category: 'positioning',
    strength: matches.length > 1 ? 0.88 : 0.72,
    confidence: 0.86,
    observation: {
      exists: true,
      services: matches.map((item) => item.id),
      evidence: matches.map((item) => item.evidence).filter(Boolean).slice(0, 3).join(' | '),
      legacyAliasFor: 'high_value_service',
    },
    interpretation: {
      businessImpact: 'positioning',
      opportunity: 'high_value_service_conversion',
    },
  })
}

function teamAuthoritySignal(e) {
  if (!includesAny(e.searchText, ['møt våre ansatte', 'ansatte', 'team', 'tannleger og spesialister'])) return null
  return signal({
    id: 'team_authority',
    category: 'trust',
    strength: 0.66,
    confidence: 0.82,
    observation: { exists: true, evidence: matchedHeadings(e, ['ansatte', 'team', 'tannleger og spesialister']) },
    interpretation: { businessImpact: 'trust', opportunity: 'authority_positioning' },
  })
}

function pricingTransparencySignal(e) {
  if (!includesAny(e.searchText, ['prisliste', 'pris', 'prices'])) return null
  return signal({
    id: 'pricing_transparency',
    category: 'trust',
    strength: 0.52,
    confidence: 0.78,
    observation: { exists: true, evidence: matchedLinks(e, ['prisliste', 'pris', 'prices']) },
    interpretation: { businessImpact: 'trust', opportunity: 'pricing_trust_path' },
  })
}

function socialPresenceSignal(e) {
  if (!includesAny(e.searchText, ['facebook.com', 'instagram.com'])) return null
  return signal({
    id: 'social_presence',
    category: 'retention',
    strength: 0.45,
    confidence: 0.78,
    observation: { exists: true, evidence: matchedLinks(e, ['facebook.com', 'instagram.com']) },
    interpretation: { businessImpact: 'retention', opportunity: 'social_trust_reuse' },
  })
}

function newPatientSignal(e) {
  if (!includesAny(e.searchText, ['nye pasienter', 'aremark-pasienter', 'velkommen til nye'])) return null
  return signal({
    id: 'new_patient_signal',
    category: 'conversion',
    strength: 0.74,
    confidence: 0.82,
    observation: { exists: true, evidence: matchedHeadings(e, ['nye pasienter', 'aremark-pasienter', 'velkommen til nye']) },
    interpretation: { businessImpact: 'conversion', opportunity: 'new_patient_acquisition' },
  })
}

function missingPrimaryCtaSignal(e) {
  if (!e.missingCta) return null
  return signal({
    id: 'missing_primary_cta',
    category: 'conversion',
    strength: 0.82,
    confidence: 0.8,
    observation: { exists: true, evidence: 'Audit classified a conversion issue: no clear primary CTA detected.' },
    interpretation: { businessImpact: 'conversion', opportunity: 'cta_clarity' },
  })
}

function localTrustSignal(e) {
  if (!e.rating && !e.reviewCount) return null
  const strength = e.reviewCount >= 100 ? 0.9 : e.reviewCount >= 20 ? 0.74 : 0.52
  return signal({
    id: 'local_review_proof',
    category: 'trust',
    strength,
    confidence: 0.9,
    observation: { exists: true, rating: e.rating, reviewCount: e.reviewCount, evidence: `Google rating ${e.rating || 'unknown'} from ${e.reviewCount || 0} reviews.` },
    interpretation: { businessImpact: 'trust', opportunity: 'trust_to_conversion' },
  })
}

function contactabilitySignal(e) {
  if (!e.phone && !e.emails.length) return null
  return signal({
    id: 'contactability',
    category: 'conversion',
    strength: e.phone && e.emails.length ? 0.7 : 0.48,
    confidence: 0.84,
    observation: { exists: true, hasPhone: Boolean(e.phone), hasEmail: e.emails.length > 0, evidence: `Phone ${e.phone ? 'found' : 'missing'}, email ${e.emails.length ? 'found' : 'missing'}.` },
    interpretation: { businessImpact: 'conversion', opportunity: 'contact_path_optimization' },
  })
}

function isBookingLink(link) {
  const text = String(link.text || '').toLowerCase()
  const href = String(link.href || '').toLowerCase()
  if (href.includes('opusdentalonline')) return true
  if (/(^|\b)(bestill|booking|book|timebestilling|appointment)(\b|$)/i.test(text)) return true
  if (/(^|[\/?#&=._-])(booking|timebestilling|appointment)([\/?#&=._-]|$)/i.test(href)) return true
  return false
}

function detectContradictions(signals, e) {
  const ids = new Set(signals.map((item) => item.id))
  const result = []
  if (ids.has('online_booking') && ids.has('missing_primary_cta')) {
    result.push(contradiction({
      id: 'booking_exists_but_cta_weak',
      positiveSignal: 'online_booking',
      negativeSignal: 'missing_primary_cta',
      opportunity: 'booking_visibility',
      evidence: 'Booking exists, but the audit still classified the page as missing a clear primary CTA.',
      strength: 0.9,
    }))
  }
  if (ids.has('local_review_proof') && ids.has('missing_primary_cta')) {
    result.push(contradiction({
      id: 'strong_reviews_but_weak_conversion',
      positiveSignal: 'local_review_proof',
      negativeSignal: 'missing_primary_cta',
      opportunity: 'trust_to_conversion',
      evidence: `The business has ${e.reviewCount || 0} reviews, but the website does not make the next action clear.`,
      strength: e.reviewCount >= 100 ? 0.86 : 0.68,
    }))
  }
  if (ids.has('high_value_service') && ids.has('missing_primary_cta')) {
    result.push(contradiction({
      id: 'high_value_service_but_weak_action_path',
      positiveSignal: 'high_value_service',
      negativeSignal: 'missing_primary_cta',
      opportunity: 'high_value_service_conversion',
      evidence: 'High-value service positioning exists, but the booking/enquiry action is not prominent.',
      strength: 0.8,
    }))
  }
  if (ids.has('specialist_service') && ids.has('missing_primary_cta')) {
    result.push(contradiction({
      id: 'specialist_service_but_weak_action_path',
      positiveSignal: 'specialist_service',
      negativeSignal: 'missing_primary_cta',
      opportunity: 'high_value_service_conversion',
      evidence: 'Specialist/service positioning exists, but the booking/enquiry action is not prominent.',
      strength: 0.72,
    }))
  }
  return result.sort((a, b) => b.strength - a.strength)
}

function rankOpportunities(signals, contradictions) {
  const scores = new Map()
  for (const item of signals) addScore(scores, item.interpretation.opportunity, item.strength * item.confidence)
  for (const item of contradictions) addScore(scores, item.opportunity, item.strength + 0.25)
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id, score]) => ({ id, score: round(score) })).slice(0, 5)
}

function signal(input) {
  return {
    id: input.id,
    category: input.category,
    strength: round(input.strength),
    confidence: round(input.confidence),
    observation: input.observation || {},
    interpretation: input.interpretation || {},
  }
}

function contradiction(input) {
  return {
    id: input.id,
    positiveSignal: input.positiveSignal,
    negativeSignal: input.negativeSignal,
    opportunity: input.opportunity,
    evidence: input.evidence,
    strength: round(input.strength),
  }
}

function addScore(scores, id, value) {
  if (!id) return
  scores.set(id, round((scores.get(id) || 0) + value))
}

function summarizeLinks(links) {
  return links.slice(0, 3).map((link) => link.text ? `${link.text} -> ${link.href}` : link.href).join(' | ')
}

function highValueServiceMatches(e) {
  const termsByIndustry = {
    dentist: { orthodontics: ['tannregulering', 'kjeveortopedi', 'reguleringstannlege', 'orthodontic'], specialist_positioning: ['spesialist', 'spesialister', 'specialist'], implant: ['implantat', 'implant'] },
    lawyer: { business_law: ['forretningsjus', 'selskapsrett', 'kontrakt', 'næringseiendom'], litigation: ['prosedyre', 'tvisteløsning', 'rettssak'], inheritance: ['arv', 'skifte', 'testament'] },
    accountant: { advisory: ['rådgivning', 'økonomisk rådgivning', 'controller', 'cfo'], payroll: ['lønn', 'lønnskjøring'], annual_accounts: ['årsoppgjør', 'skattemelding'] },
    plumber: { renovation: ['badrenovering', 'rehabilitering av bad', 'totalrenovering'], heat_pump: ['varmepumpe', 'varmeanlegg'], service_agreement: ['serviceavtale'] },
    electrician: { ev_charger: ['elbillader', 'ladeanlegg'], smart_home: ['smarthus', 'smart home'], solar: ['solcelle', 'solceller'] },
    'hair salon': { color: ['fargebehandling', 'balayage', 'striper'], extensions: ['extensions', 'hair extensions'], bridal: ['brud', 'bryllup'] },
    physiotherapist: { sports_injury: ['idrettsskade', 'idrettsskader', 'sports injury'], first_consultation: ['førstegangskonsultasjon'], rehabilitation: ['rehabilitering'] },
    'real estate agent': { valuation: ['verdivurdering', 'boligverdi'], premium_sale: ['premium', 'eksklusiv', 'boligsalg'], new_build: ['nybygg'] },
    restaurant: { catering: ['catering', 'selskap', 'event'], tasting_menu: ['smaksmeny', 'tasting menu'], private_room: ['selskapslokale', 'private dining'] },
  }
  const generic = { specialist_positioning: ['spesialist', 'specialist'], premium_service: ['premium', 'skreddersydd'] }
  const industry = normalizeIndustry(e.industry)
  const termGroups = { ...generic, ...(termsByIndustry[industry] || {}) }
  const matches = []
  for (const [id, terms] of Object.entries(termGroups)) {
    if (!includesAny(e.searchText, terms)) continue
    matches.push({ id, evidence: matchedTextEvidence(e, terms) })
  }
  return matches
}

function matchedTextEvidence(e, terms) {
  return matchedHeadings(e, terms) || matchedLinks(e, terms) || terms.find((term) => e.searchText.includes(term)) || ''
}

function normalizeIndustry(value) {
  const v = clean(value).toLowerCase()
  if (['dentists', 'dental clinic', 'tannlege', 'tannleger', 'tannklinikk', 'tannhelse'].includes(v)) return 'dentist'
  if (['law firm', 'lawyer', 'lawyers', 'advokat', 'advokater', 'advokatfirma'].includes(v)) return 'lawyer'
  if (['accountants', 'accounting firm', 'regnskapsfører', 'regnskapsførere', 'regnskapsbyrå'].includes(v)) return 'accountant'
  if (['plumbers', 'plumbing company', 'rørlegger', 'rørleggere', 'rørleggerfirma'].includes(v)) return 'plumber'
  if (['electricians', 'electrical contractor', 'elektriker', 'elektrikere', 'elektroinstallatør', 'elektrofirma'].includes(v)) return 'electrician'
  if (['hair salon', 'hairdresser', 'hairdressers', 'frisør', 'frisører', 'frisørsalong'].includes(v)) return 'hair salon'
  if (['physiotherapist', 'physiotherapists', 'fysioterapeut', 'fysioterapeuter', 'fysioterapiklinikk'].includes(v)) return 'physiotherapist'
  if (['real estate agent', 'real estate agents', 'realtor', 'eiendomsmegler', 'eiendomsmeglere', 'meglerkontor'].includes(v)) return 'real estate agent'
  return v
}

function matchedHeadings(e, terms) {
  const lowerTerms = terms.map((term) => term.toLowerCase())
  return e.headings.filter((heading) => lowerTerms.some((term) => heading.toLowerCase().includes(term))).slice(0, 3).join(' | ')
}

function matchedLinks(e, terms) {
  const lowerTerms = terms.map((term) => term.toLowerCase())
  return e.pageLinks.filter((link) => lowerTerms.some((term) => (link.text + ' ' + link.href).toLowerCase().includes(term))).slice(0, 3).map((link) => link.text || link.href).join(' | ')
}

function normalizeSignalTexts(values) {
  return (Array.isArray(values) ? values : []).map((item) => clean(typeof item === 'string' ? item : item?.text)).filter(Boolean)
}

function normalizeLinks(values) {
  return (Array.isArray(values) ? values : []).map((item) => ({ text: clean(item?.text), href: clean(item?.href) })).filter((item) => item.text || item.href)
}

function hasCategory(categories, key) { return Number(categories?.[key] || 0) > 0 }
function includesAny(value, needles) { return needles.some((needle) => value.includes(needle)) }
function normalizeArray(value) { return Array.isArray(value) ? value.map(clean).filter(Boolean) : String(value || '').split('|').map(clean).filter(Boolean) }
function numeric(value, fallback) { const n = Number(value); return Number.isFinite(n) ? n : fallback }
function clean(value) { return String(value == null ? '' : value).replace(/\s+/g, ' ').trim() }
function round(value) { return Math.round(Number(value || 0) * 100) / 100 }

module.exports = { buildBusinessSignalProfile, collectEvidence }
