const assert = require('assert')
const { evaluateWebsiteSalesFit } = require('../websiteSalesFit')

const ALLOWED_FITS = new Set(['strong', 'review', 'weak'])
const ALLOWED_TYPES = new Set(['no_website', 'site_unverified', 'weak_site', 'modern_site'])
const ALLOWED_ACTIONS = new Set(['call', 'review', 'verify', 'skip'])

function lead(overrides = {}) {
  return {
    leadClass: 'fast_discovery',
    company: {
      displayName: 'Rørlegger Hansen AS',
      organizationNumber: '123456789',
      organizationForm: 'AS',
      matchStatus: 'exact_match',
      employees: 4,
      activeStatus: 'active',
    },
    contact: { phone: '22 22 22 22', website: null, city: 'Kristiansand' },
    places: { placeId: 'abc123', rating: 4.6, reviewCount: 18 },
    sourceQuality: { locationMatchStatus: 'exact_location' },
    website: { auditStatus: 'skipped_no_website', topEvidence: [] },
    ranking: { whyRanked: [], caution: [] },
    ...overrides,
  }
}

{
  const result = evaluateWebsiteSalesFit(lead())
  assert(ALLOWED_FITS.has(result.websiteSalesFit) && ALLOWED_TYPES.has(result.websiteLeadType) && ALLOWED_ACTIONS.has(result.recommendedAction), 'enums must be valid')
  assert(result.websiteSalesFit === 'strong', 'local SMB + phone + no website + exact location should be strong')
  assert(result.websiteLeadType === 'no_website', 'missing website should be classified no_website')
  assert(result.recommendedAction === 'call', 'strong website lead should recommend call')
  assert(result.whyWebsiteLead[0].includes('Ingen nettside funnet'), 'no website must lead the why-bullets as a positive signal')
  assert(result.whyWebsiteLead.length <= 3 && result.caution.length <= 2, 'bullets must stay within limits')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    contact: { phone: '22 22 22 22', website: 'https://example.no', city: 'Kristiansand' },
    website: { auditStatus: 'not_run', topEvidence: [] },
  }))
  assert(result.websiteSalesFit === 'review', 'unverified website cannot be judged without Deep')
  assert(result.websiteLeadType === 'site_unverified', 'existing unaudited website should be site_unverified')
  assert(result.recommendedAction === 'verify', 'unverified website should recommend verify')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    contact: { phone: '22 22 22 22', website: 'https://example.no', city: 'Kristiansand' },
    opportunityType: 'technical_trust_risk',
    website: { auditStatus: 'completed', topEvidence: ['Serious accessibility issues detected on the website'] },
  }))
  assert(result.websiteSalesFit === 'strong', 'weak-site evidence with phone and exact location should be strong')
  assert(result.websiteLeadType === 'weak_site', 'audited weakness should be weak_site')
}

{
  const generic = evaluateWebsiteSalesFit(lead({
    contact: { phone: '22 22 22 22', website: 'https://example.no', city: 'Kristiansand' },
    website: { auditStatus: 'not_run', topEvidence: ['Website URL from discovery; not verified and may be parked/wrong until enrichment runs.'] },
  }))
  assert(generic.websiteLeadType === 'site_unverified', 'fast-mode boilerplate must not count as weak-site evidence')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    company: { displayName: 'Halden kommune', organizationForm: 'KOMM', activeStatus: 'active' },
  }))
  assert(result.websiteSalesFit === 'weak' && result.recommendedAction === 'skip', 'public sector should be weak/skip')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    company: { displayName: 'Cutters Oslo', organizationForm: 'AS', activeStatus: 'active' },
  }))
  assert(result.websiteSalesFit === 'weak' && result.recommendedAction === 'skip', 'known chain should be weak/skip')
  assert(result.caution.some((item) => item.includes('kjede')), 'chain caution should explain the verdict')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    company: { displayName: 'Navnesen Bygg AS', organizationForm: 'AS', activeStatus: 'active' },
  }))
  assert(result.websiteSalesFit === 'strong', 'token matching must respect word boundaries (Navnesen is not NAV)')
}

{
  const result = evaluateWebsiteSalesFit(lead({ contact: { phone: null, website: null, city: 'Halden' } }))
  assert(result.websiteSalesFit === 'weak', 'no phone should be weak even when website is missing')
  assert(result.recommendedAction === 'review', 'no phone should recommend review, not skip')
}

{
  const result = evaluateWebsiteSalesFit(lead({ sourceQuality: { locationMatchStatus: 'out_of_area' } }))
  assert(result.websiteSalesFit === 'weak', 'wrong location should be weak')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    company: { displayName: 'Frisør Lillevik', matchStatus: 'no_match', employees: 0 },
  }))
  assert(result.websiteSalesFit === 'strong', 'phone + exact location can be strong without Brreg identity')
  assert(result.caution.some((item) => item.toLowerCase().includes('identitet')), 'missing identity must surface as caution')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    company: { displayName: 'Stor Entreprenør AS', organizationNumber: '999999999', employees: 120, activeStatus: 'active' },
  }))
  assert(result.websiteSalesFit === 'review', 'large company should not be a strong website lead')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    company: { displayName: 'Truls og Trine Hårsenter', organizationNumber: '974450054', activeStatus: 'active' },
    contact: { phone: '94 00 71 21', website: 'https://haargrossisten.no/pages/skien', city: 'Skien' },
    website: { auditStatus: 'not_run', topEvidence: [] },
  }))
  assert(result.websiteSalesFit === 'review', 'a location page on a central domain should never be strong')
  assert(result.caution.some((item) => item.includes('avdelingsside')), 'central-domain location page should warn about chains')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    contact: { phone: '94 00 71 21', website: 'https://parkenfrisor.no/', city: 'Skien' },
    website: { auditStatus: 'not_run', topEvidence: [] },
  }))
  assert(!result.caution.some((item) => item.includes('avdelingsside')), 'own-domain site must not trigger the chain location-page warning')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    contact: { phone: '94 00 71 21', website: 'https://gammelside.no', city: 'Skien' },
    website: { auditStatus: 'not_run', topEvidence: [], aiAudit: { outdated: 'ja', summary: 'Gammel side uten mobiltilpasning.', topIssues: ['Ikke mobiltilpasset'], missing: [], candidate: 'sterk_kandidat', estimatedEra: 'ca. 2013' } },
  }))
  assert(result.websiteSalesFit === 'strong', 'AI-confirmed weak site should make a strong lead')
  assert(result.websiteLeadType === 'weak_site', 'AI-confirmed weakness should classify weak_site')
  assert(result.whyWebsiteLead.some((item) => item.includes('Gammel side')), 'AI summary should become the weak-site evidence')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    contact: { phone: '94 00 71 21', website: 'https://nyside.no', city: 'Skien' },
    website: { auditStatus: 'not_run', topEvidence: [], aiAudit: { outdated: 'nei', summary: 'Moderne og ryddig side.', topIssues: [], missing: [], candidate: 'ikke_kandidat', estimatedEra: 'ca. 2024' } },
  }))
  assert(result.websiteSalesFit === 'review', 'AI-confirmed modern site should never be strong')
  assert(result.websiteLeadType === 'modern_site', 'modern site should be classified modern_site')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    contact: { phone: '94 00 71 21', website: null, city: 'Oslo' },
    sourceQuality: { locationMatchStatus: 'unknown' },
  }))
  assert(result.websiteSalesFit === 'strong', 'sweep leads with unknown-but-present city must still be able to go strong')
  assert(result.caution.some((item) => item.includes('ikke bekreftet eksakt')), 'unknown location should keep the check-before-calling caution')
}

{
  const result = evaluateWebsiteSalesFit(lead({
    contact: { phone: '94 00 71 21', website: null, city: '' },
    sourceQuality: { locationMatchStatus: 'unknown' },
  }))
  assert(result.websiteSalesFit === 'review', 'unknown location without any city stays review')
}

console.log('website-sales-fit smoke test passed')
