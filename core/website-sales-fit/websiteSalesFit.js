const WEBSITE_SALES_FIT = new Set(['strong', 'review', 'weak'])
const WEBSITE_LEAD_TYPES = new Set(['no_website', 'site_unverified', 'weak_site', 'modern_site'])

// Brreg organization forms that mark public-sector entities.
const PUBLIC_ORG_FORMS = new Set(['STAT', 'FYLK', 'KOMM', 'ORGL', 'KF', 'FKF', 'SF', 'IKS', 'KIRK'])

const PUBLIC_NAME_TOKENS = [
  'kommune', 'fylkeskommune', 'statsforvalteren', 'nav', 'helseforetak', 'sykehus',
  'universitet', 'høgskole', 'videregående skole', 'bibliotek', 'direktorat',
  'departement', 'politi', 'brannvesen', 'kirkelig fellesråd', 'tingrett', 'fengsel',
]

// Coarse starter list, extended as real calls reveal misses. Matched on word boundaries.
const CHAIN_NAME_TOKENS = [
  'nikita', 'cutters', 'sats', 'evo fitness', 'fresh fitness', 'family sports club',
  'apotek 1', 'vitusapotek', 'boots apotek', 'specsavers', 'synsam', 'brilleland', 'interoptik',
  'mekonomen', 'vianor', 'dekkmann', 'snap drive',
  'rema 1000', 'kiwi', 'coop', 'joker', 'meny', 'bunnpris', 'europris',
  'jysk', 'ikea', 'biltema', 'jula', 'clas ohlson', 'plantasjen', 'elkjøp',
  'mcdonald', 'burger king', 'subway', 'starbucks', 'espresso house',
  'peppes pizza', 'dominos', "domino's", 'pizzabakeren', 'egon', 'olivia',
  'narvesen', '7-eleven', 'deli de luca', 'circle k', 'shell', 'esso', 'uno-x',
  'dnb', 'nordea', 'handelsbanken', 'sparebank 1', 'storebrand', 'gjensidige', 'tryg',
  'eiendomsmegler 1', 'privatmegleren', 'krogsveen', 'aktiv eiendomsmegling', 'notar',
  'byggmakker', 'maxbo', 'montér', 'xl-bygg', 'comfort', 'bademiljø', 'rørkjøp',
  'posten', 'bring', 'postnord', 'foodora', 'wolt',
]

const WEAK_SITE_EVIDENCE = /technical (issue|risk|trust)|trust risk|accessib|usability|conversion path|broken|failed request|outdated|stale|parked/i

function evaluateWebsiteSalesFit(lead = {}) {
  const company = lead.company || {}
  const contact = lead.contact || {}
  const places = lead.places || {}
  const sourceQuality = lead.sourceQuality || {}

  const hasPhone = Boolean(contact.phone || lead.phone)
  const websiteUrl = websiteValue(contact.website || lead.website)
  const hasWebsite = Boolean(websiteUrl)
  const confirmedOrg = Boolean(company.organizationNumber)
  const candidateOrg = Boolean(company.candidateOrganizationNumber || ['manual_verify', 'weak_match'].includes(String(company.matchStatus || '').toLowerCase()))
  const activeCompany = !company.activeStatus || String(company.activeStatus).toLowerCase() === 'active'
  const googleActivity = Boolean(places.placeId || toNumber(places.rating) > 0 || toNumber(places.reviewCount) > 0)
  const employees = toNumber(company.employees)
  const locationStatus = String(sourceQuality.locationMatchStatus || 'unknown')
  const exactLocation = locationStatus === 'exact_location'
  const outOfArea = ['out_of_area', 'candidate_appears_outside_requested_location'].includes(locationStatus)
  // Norway-sweep runs lose the per-city comparison, so locationMatchStatus is
  // 'unknown' even though the lead has a real city - treat that as usable with
  // a caution instead of making strong unreachable in sweep mode.
  const cityKnown = Boolean(String(contact.city || lead.city || '').trim())
  const usableLocation = exactLocation || (locationStatus === 'unknown' && cityKnown)
  const denyReason = publicOrChainReason(lead)
  const aiAudit = lead.website?.aiAudit && typeof lead.website.aiAudit === 'object' ? lead.website.aiAudit : null
  // Drive off the AI's own sales-candidate verdict, not the presence of topIssues:
  // the audit schema always asks for "maks 3 problemer", so even a modern, professional
  // site comes back with 1-3 nitpicks (missing meta description, long price list). Reading
  // topIssues.length as weakness flipped nearly every audited site to a strong lead.
  const aiWeakSite = Boolean(aiAudit && (aiAudit.outdated === 'ja' || aiAudit.candidate === 'sterk_kandidat'))
  const aiModernSite = Boolean(aiAudit && aiAudit.candidate === 'ikke_kandidat' && aiAudit.outdated !== 'ja')
  const weakSiteEvidence = hasWebsite ? (aiWeakSite ? String(aiAudit.summary || 'AI-sjekken fant svakheter på siden.') : firstWeakSiteEvidence(lead)) : ''
  const centralLocationPage = hasWebsite && looksLikeCentralLocationPage(websiteUrl, contact.city || lead.city)

  const websiteLeadType = !hasWebsite ? 'no_website' : weakSiteEvidence ? 'weak_site' : aiModernSite ? 'modern_site' : 'site_unverified'

  const whyWebsiteLead = []
  const caution = []
  if (centralLocationPage) caution.push('Nettsiden er en avdelingsside på et sentralt domene - kan være kjede med flere avdelinger.')

  if (websiteLeadType === 'no_website') whyWebsiteLead.push('Ingen nettside funnet - dette er salgsåpningen.')
  if (websiteLeadType === 'weak_site') whyWebsiteLead.push('Nettsiden viser svakhet: ' + weakSiteEvidence)
  if (websiteLeadType === 'modern_site') whyWebsiteLead.push('AI-sjekken fant ingen tydelige svakheter - siden ser moderne ut.')
  if (websiteLeadType === 'site_unverified') whyWebsiteLead.push('Nettside finnes, men er ikke vurdert - åpne den og se selv.')
  if (hasPhone) whyWebsiteLead.push('Direkte telefon tilgjengelig.')
  if (googleActivity) whyWebsiteLead.push(googleActivityReason(places))
  else if (exactLocation) whyWebsiteLead.push('Lokal bedrift med eksakt stedstreff.')

  if (denyReason) caution.push(denyReason)
  if (!hasPhone) caution.push('Ingen telefon funnet - finn kontaktvei før du prioriterer.')
  if (outOfArea) caution.push('Stedet matcher ikke markedet du søkte i.')
  else if (!exactLocation) caution.push('Stedet er ikke bekreftet eksakt - sjekk før du ringer.')
  if (!confirmedOrg && candidateOrg) caution.push('Org.nr er bare kandidat - verifiser identiteten.')
  else if (!confirmedOrg && !candidateOrg) caution.push('Firmaidentiteten er ikke bekreftet.')
  if (employees >= 50) caution.push('Stort selskap - har trolig byrå eller egen IT.')
  if (!activeCompany) caution.push('Firmaaktiviteten er uklar i Brreg.')

  const websiteSalesFit = verdictFor({
    denyReason, hasPhone, outOfArea, usableLocation, websiteLeadType, employees, activeCompany, googleActivity, confirmedOrg, candidateOrg, centralLocationPage,
  })
  const recommendedAction = recommendedActionFor({ websiteSalesFit, websiteLeadType, denyReason, hasPhone })

  return {
    websiteSalesFit,
    websiteLeadType,
    whyWebsiteLead: unique(whyWebsiteLead).slice(0, 3),
    caution: unique(caution).slice(0, 2),
    recommendedAction,
  }
}

function verdictFor(context) {
  const { denyReason, hasPhone, outOfArea, usableLocation, websiteLeadType, employees, activeCompany, googleActivity, confirmedOrg, candidateOrg, centralLocationPage } = context
  if (denyReason) return 'weak'
  if (!hasPhone) return 'weak'
  if (outOfArea) return 'weak'
  if (centralLocationPage) return 'review'
  if (websiteLeadType === 'modern_site') return 'review'
  if (websiteLeadType === 'site_unverified') return 'review'
  // no_website or weak_site from here: the core website-sales opening.
  if (employees >= 50) return 'review'
  if (!activeCompany) return 'review'
  if (!usableLocation) return 'review'
  if (googleActivity || confirmedOrg || candidateOrg) return 'strong'
  return 'review'
}

function recommendedActionFor({ websiteSalesFit, websiteLeadType, denyReason, hasPhone }) {
  if (denyReason) return 'skip'
  if (!hasPhone) return 'review'
  if (websiteSalesFit === 'strong') return 'call'
  if (websiteLeadType === 'site_unverified') return 'verify'
  return 'review'
}

function publicOrChainReason(lead = {}) {
  const company = lead.company || {}
  const orgForm = String(company.organizationForm || '').toUpperCase()
  if (PUBLIC_ORG_FORMS.has(orgForm)) return 'Offentlig organisasjonsform (' + orgForm + ') - ikke et mål for nettsidesalg.'
  const name = ' ' + String(company.displayName || company.legalName || lead.companyName || '').toLowerCase() + ' '
  const publicToken = PUBLIC_NAME_TOKENS.find((token) => nameHasToken(name, token))
  if (publicToken) return 'Ser offentlig ut ("' + publicToken + '") - ikke et mål for nettsidesalg.'
  const chainToken = CHAIN_NAME_TOKENS.find((token) => nameHasToken(name, token))
  if (chainToken) return 'Ser ut som kjede/franchise ("' + chainToken + '") - nettsiden styres sentralt.'
  return ''
}

// A website URL whose path contains the lead's own city ("domain.no/pages/skien")
// is usually a location page on a central chain site, not the business's own site.
function looksLikeCentralLocationPage(url, city) {
  const cleanCity = String(city || '').toLowerCase().trim()
  if (cleanCity.length < 4) return false
  let path = ''
  try {
    path = decodeURIComponent(new URL(/^https?:/i.test(url) ? url : 'https://' + url).pathname || '').toLowerCase()
  } catch (_) {
    return false
  }
  if (path.length <= 1) return false
  const transliterated = cleanCity.replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
  return path.includes(cleanCity) || path.includes(transliterated)
}

function nameHasToken(paddedName, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp('(^|[^a-zæøå0-9])' + escaped + '([^a-zæøå0-9]|$)', 'i').test(paddedName)
}

function firstWeakSiteEvidence(lead = {}) {
  const candidates = [
    String(lead.opportunityType || ''),
    ...normalizeList(lead.website?.topEvidence),
    ...normalizeList(lead.ranking?.whyRanked),
  ].filter((item) => !/not verified|unverified|until enrichment/i.test(item))
  const match = candidates.find((item) => WEAK_SITE_EVIDENCE.test(item))
  return match ? String(match).trim() : ''
}

function googleActivityReason(places = {}) {
  const rating = toNumber(places.rating)
  const reviews = toNumber(places.reviewCount)
  if (rating > 0 && reviews > 0) return 'Aktiv Google-profil (' + rating + ' i vurdering, ' + reviews + ' omtaler).'
  return 'Aktiv Google-oppføring.'
}

function websiteValue(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object') return String(value.url || value.href || value.website || value.uri || '').trim()
  return ''
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter(Boolean).map(String) : []
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)))
}

module.exports = {
  evaluateWebsiteSalesFit,
  WEBSITE_SALES_FIT: Array.from(WEBSITE_SALES_FIT),
  WEBSITE_LEAD_TYPES: Array.from(WEBSITE_LEAD_TYPES),
}
