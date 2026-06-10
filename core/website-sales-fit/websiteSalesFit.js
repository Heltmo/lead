const WEBSITE_SALES_FIT = new Set(['strong', 'review', 'weak'])
const WEBSITE_LEAD_TYPES = new Set(['no_website', 'site_unverified', 'weak_site'])

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
  const denyReason = publicOrChainReason(lead)
  const weakSiteEvidence = hasWebsite ? firstWeakSiteEvidence(lead) : ''

  const websiteLeadType = !hasWebsite ? 'no_website' : weakSiteEvidence ? 'weak_site' : 'site_unverified'

  const whyWebsiteLead = []
  const caution = []

  if (websiteLeadType === 'no_website') whyWebsiteLead.push('No website found - this is the website-sales opening.')
  if (websiteLeadType === 'weak_site') whyWebsiteLead.push('Website shows weakness: ' + weakSiteEvidence)
  if (websiteLeadType === 'site_unverified') whyWebsiteLead.push('Website exists but is unverified - run Deep before judging quality.')
  if (hasPhone) whyWebsiteLead.push('Direct phone available.')
  if (googleActivity) whyWebsiteLead.push(googleActivityReason(places))
  else if (exactLocation) whyWebsiteLead.push('Local business with exact location match.')

  if (denyReason) caution.push(denyReason)
  if (!hasPhone) caution.push('No phone found - find a contact path before prioritizing.')
  if (outOfArea) caution.push('Location does not match the searched market.')
  else if (!exactLocation) caution.push('Location is not confirmed exact - check before calling.')
  if (!confirmedOrg && candidateOrg) caution.push('Org.nr is candidate only - verify identity.')
  else if (!confirmedOrg && !candidateOrg) caution.push('Company identity is not confirmed.')
  if (employees >= 50) caution.push('Large company - likely has an agency or internal IT.')
  if (!activeCompany) caution.push('Company activity is unclear in Brreg.')

  const websiteSalesFit = verdictFor({
    denyReason, hasPhone, outOfArea, exactLocation, websiteLeadType, employees, activeCompany, googleActivity, confirmedOrg, candidateOrg,
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
  const { denyReason, hasPhone, outOfArea, exactLocation, websiteLeadType, employees, activeCompany, googleActivity, confirmedOrg, candidateOrg } = context
  if (denyReason) return 'weak'
  if (!hasPhone) return 'weak'
  if (outOfArea) return 'weak'
  if (websiteLeadType === 'site_unverified') return 'review'
  // no_website or weak_site from here: the core website-sales opening.
  if (employees >= 50) return 'review'
  if (!activeCompany) return 'review'
  if (!exactLocation) return 'review'
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
  if (PUBLIC_ORG_FORMS.has(orgForm)) return 'Public-sector organization form (' + orgForm + ') - not a website-sales target.'
  const name = ' ' + String(company.displayName || company.legalName || lead.companyName || '').toLowerCase() + ' '
  const publicToken = PUBLIC_NAME_TOKENS.find((token) => nameHasToken(name, token))
  if (publicToken) return 'Looks public-sector ("' + publicToken + '") - not a website-sales target.'
  const chainToken = CHAIN_NAME_TOKENS.find((token) => nameHasToken(name, token))
  if (chainToken) return 'Looks like a chain/franchise ("' + chainToken + '") - website is handled centrally.'
  return ''
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
  if (rating > 0 && reviews > 0) return 'Active Google profile (' + rating + ' rating, ' + reviews + ' reviews).'
  return 'Active Google Places presence.'
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
