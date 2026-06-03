const fs = require('fs')
const path = require('path')
const { loadDiscoverySources } = require('./providers/searchProvider')
const { loadLiveSearchResults } = require('./providers/liveSearchProvider')
const { createDiscoveryReport } = require('./reports/discoveryReport')
const { deduplicateCandidates, normalizeLeadCandidate, parseDiscoveryQuery } = require('./normalizers/leadCandidate')
const { findNaceForIndustry } = require('./normalizers/naceMapping')
const { validateWebsiteReachability } = require('./normalizers/websiteReachability')
const { parseLocationIntent, applyLocationQuality, normalizeSearchScope } = require('./normalizers/locationQuality')
const { isNorwayFirstCandidate } = require('./normalizers/countryGuard')

async function discoverLocalBusinesses(options) {
  if (!options || (!options.sourceFile && !options.sourceFiles && !options.provider)) throw new Error('sourceFile, sourceFiles, or provider is required for discovery')
  const locationIntent = parseLocationIntent(options.query || [options.industry, options.location].filter(Boolean).join(' in '))
  const searchScope = normalizeSearchScope(options.searchScope || options['search-scope'])
  const requestedMaxResults = options.maxResults ? Number(options.maxResults) : null
  const parsed = parseDiscoveryQuery(options.query || [options.industry, options.location].filter(Boolean).join(' in '))
  const industry = options.industry ? parseDiscoveryQuery(options.industry).industry : parsed.industry
  const canonicalIndustry = options.canonicalIndustry || parsed.canonicalIndustry || industry
  const industryTerm = options.industry || parsed.industryTerm || industry
  const location = options.location || parsed.location || locationIntent.requestedLocation
  const query = options.query || [industryTerm, location].filter(Boolean).join(' in ')
  const expandedQueries = parsed.expandedQueries || []
  const industryTerms = parsed.industryTerms || [industryTerm, canonicalIndustry].filter(Boolean)
  const startedAt = new Date().toISOString()
  const sourceFiles = normalizeSourceFiles(options.sourceFiles || options.sourceFile)
  const resolvedSourceFiles = sourceFiles.map((sourceFile) => path.resolve(sourceFile))
  const sourceResults = resolvedSourceFiles.length ? loadDiscoverySources(resolvedSourceFiles, { industry, canonicalIndustry, industryTerms, location, searchScope }) : []
  const providerResult = await loadLiveSearchResults({
    provider: options.provider,
    query,
    industry,
    canonicalIndustry,
    location,
    expandedQueries,
    maxResults: options.maxResults,
    maxProviderQueries: options.maxProviderQueries,
    dryRun: options.dryRun,
    env: options.env,
    fetchImpl: options.fetchImpl,
    mockResults: options.mockResults,
    mockResultsPath: options.mockResultsPath,
    braveEndpoint: options.braveEndpoint,
    googlePlacesEndpoint: options.googlePlacesEndpoint,
    brregEndpoint: options.brregEndpoint,
    languageCode: options.languageCode,
    regionCode: options.regionCode,
  })
  const rawResults = [...sourceResults, ...providerResult.rows]
  const normalized = rawResults
    .map((row) => normalizeLeadCandidate(row, { industry, canonicalIndustry, location, searchScope, source: row.source || options.sourceName || 'fixed-sample', sourceFile: row.sourceFile, sourceFormat: row.sourceFormat }))
    .filter(Boolean)
    .filter((candidate) => isNorwayFirstCandidate(candidate, { country: locationIntent.country, requestedLocation: location || locationIntent.requestedLocation }))
  const candidates = deduplicateCandidates(normalized)
    .map((candidate) => applyLocationQuality(candidate, { searchScope, includeOutOfArea: options.includeOutOfArea === true || options.includeOutOfArea === 'true' }))
    .map((candidate) => applyIndustryQuality(candidate, { canonicalIndustry, industry, industryTerms, query }))
    .map(enrichDiscoveryQuality)
  if (options.validate !== false && !options.dryRun) {
    for (const candidate of candidates) {
      candidate.reachability = await validateWebsiteReachability(candidate.website, { timeoutMs: options.timeoutMs })
      candidate.websiteReachable = candidate.reachability.reachable
    }
  }
  const report = createDiscoveryReport({
    query,
    industry,
    canonicalIndustry,
    industryTerm,
    expandedQueries,
    location,
    locationIntent: { ...locationIntent, requestedLocation: location || locationIntent.requestedLocation },
    searchScope,
    requestedMaxResults,
    sourceFiles: resolvedSourceFiles,
    provider: providerResult.plan,
    startedAt,
    rawResults,
    normalizedCandidates: normalized,
    candidates,
  })
  return report
}

function writeDiscoveryOutputs(report, options = {}) {
  const outPath = path.resolve(options.outPath || 'reports/lead-candidates.json')
  const summaryPath = path.resolve(options.summaryPath || 'reports/discovery-summary.json')
  const handoffPath = path.resolve(options.handoffPath || 'reports/lead-machine-handoff.jsonl')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true })
  fs.mkdirSync(path.dirname(handoffPath), { recursive: true })
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`)
  fs.writeFileSync(summaryPath, `${JSON.stringify(toSummary(report), null, 2)}\n`)
  fs.writeFileSync(handoffPath, `${report.candidates.filter((candidate) => shouldIncludeInHandoff(candidate, options)).map((candidate) => formatHandoffCandidate(candidate, report)).join('\n')}\n`)
  return { candidatesPath: outPath, summaryPath, handoffPath }
}

function formatHandoffCandidate(candidate, report = {}) {
  return JSON.stringify({
    url: candidate.website,
    businessName: candidate.businessName || '',
    source: candidate.source || '',
    location: candidate.location || '',
    industry: candidate.industry || '',
    confidence: candidate.confidence || '',
    sources: candidate.sources || [],
    provenance: candidate.provenance || { sources: candidate.sources || [] },
    sourceType: candidate.sourceType || 'unknown',
    auditEligible: candidate.auditEligible !== false,
    auditExclusionReason: candidate.auditExclusionReason || '',
    phone: candidate.phone || '',
    address: candidate.address || '',
    placeId: candidate.placeId || '',
    rating: candidate.rating || '',
    reviewCount: candidate.reviewCount || '',
    businessStatus: candidate.businessStatus || '',
    providerTypes: candidate.providerTypes || [],
    searchScope: candidate.searchScope || report.searchScope || 'strict',
    requestedMaxResults: report.searchSupply?.requestedMaxResults ?? '',
    includedLeadCount: report.searchSupply?.includedLeadCount ?? '',
    lowSupply: Boolean(report.searchSupply?.lowSupply),
    fallbackAvailable: Boolean(report.searchSupply?.fallbackAvailable),
    recommendedExpansion: report.searchSupply?.recommendedExpansion || '',
    requestedLocation: candidate.requestedLocation || '',
    candidateLocation: candidate.candidateLocation || '',
    candidateCity: candidate.candidateCity || '',
    locationMatchStatus: candidate.locationMatchStatus || 'unknown',
    locationConfidence: candidate.locationConfidence ?? '',
    distanceKm: candidate.distanceKm ?? '',
    locationWarnings: candidate.locationWarnings || [],
    fallbackUsed: Boolean(candidate.fallbackUsed),
    locationQuality: candidate.locationQuality || null,
    discoveryQuality: candidate.discoveryQuality || null,
    discoveryConfidence: candidate.discoveryConfidence || '',
    identitySource: candidate.identitySource || '',
    presenceSource: candidate.presenceSource || '',
    organizationNumber: candidate.organizationNumber || '',
    candidateOrganizationNumber: candidate.candidateOrganizationNumber || '',
    legalName: candidate.legalName || '',
    candidateLegalName: candidate.candidateLegalName || '',
    organizationForm: candidate.organizationForm || '',
    registeredAddress: candidate.registeredAddress || '',
    municipality: candidate.municipality || '',
    unitType: candidate.unitType || '',
    naceCode: candidate.naceCode || '',
    naceDescription: candidate.naceDescription || '',
    employees: candidate.employees ?? '',
    registrationDate: candidate.registrationDate || '',
    activeStatus: candidate.activeStatus || '',
    sourceUrl: candidate.sourceUrl || '',
  })
}

function shouldIncludeInHandoff(candidate, options = {}) {
  if (candidate.websiteReachable === false) return false
  if (options.includeNonAuditTargets) return true
  return candidate.auditEligible !== false
}

function shouldIncludeInFastLeadPack(candidate = {}) {
  if (!candidate) return false
  if (candidate.websiteReachable === false) return false
  const reason = String(candidate.auditExclusionReason || '')
  if (candidate.locationMatchStatus === 'out_of_area' || reason.startsWith('out_of_area:')) return false
  if (['directory', 'social', 'governmentRegistry', 'publicSector'].includes(candidate.sourceType)) return false
  if (candidate.auditEligible !== false) return true
  return reason === 'missing_website_for_audit' && Boolean(candidate.phone || candidate.placeId || candidate.address || candidate.organizationNumber || candidate.candidateOrganizationNumber)
}


function applyIndustryQuality(candidate = {}, context = {}) {
  const relevance = buildIndustryRelevance(candidate, context)
  const next = { ...candidate, industryMatchStatus: relevance.status, industryMatchReasons: relevance.reasons }
  if (relevance.matches) return next
  return {
    ...next,
    auditEligible: false,
    auditExclusionReason: appendReason(candidate.auditExclusionReason, `industry_mismatch:${context.canonicalIndustry || context.industry || 'unknown'}`),
  }
}

function buildIndustryRelevance(candidate = {}, context = {}) {
  const canonicalIndustry = String(context.canonicalIndustry || context.industry || '').trim()
  if (!canonicalIndustry) return { matches: true, status: 'unknown', reasons: ['no_industry_constraint'] }
  const terms = industryTermsFor(canonicalIndustry, context.industryTerms)
  if (!terms.length) return { matches: true, status: 'unknown', reasons: ['no_industry_terms'] }
  const expectedNace = findNaceForIndustry({ canonicalIndustry, industry: context.industry, query: context.query }).map((item) => item.code)
  const naceCode = String(candidate.naceCode || '').trim()
  if (naceCode && expectedNace.some((code) => naceCode === code || naceCode.startsWith(code + '.'))) return { matches: true, status: 'relevant', reasons: ['nace_match'] }
  if (candidate.identitySource === 'brreg' && naceCode && expectedNace.length) return { matches: false, status: 'mismatch', reasons: ['nace_mismatch'] }

  const haystack = normalizeIndustryText([
    candidate.businessName,
    candidate.legalName,
    candidate.candidateLegalName,
    candidate.description,
    candidate.providerTypes?.join(' '),
    candidate.website,
  ].filter(Boolean).join(' '))
  if (terms.some((term) => termMatches(haystack, term))) return { matches: true, status: 'relevant', reasons: ['term_match'] }
  if (candidate.sourceType === 'officialRegistry' && !expectedNace.length) return { matches: false, status: 'mismatch', reasons: ['official_registry_requires_term_match_when_no_nace_constraint'] }
  return { matches: false, status: 'mismatch', reasons: ['no_industry_signal'] }
}

function industryTermsFor(canonicalIndustry, rawTerms = []) {
  const base = [canonicalIndustry, ...(rawTerms || [])]
  const extras = {
    lawyer: ['advokat', 'advokater', 'advokatfirma', 'juridisk', 'lawyer', 'law firm', 'attorney'],
    plumber: ['rørlegger', 'rorlegger', 'rørleggere', 'vvs', 'bad', 'varme', 'plumber'],
    electrician: ['elektriker', 'elektro', 'electrical', 'electrician'],
    accountant: ['regnskap', 'regnskapsfører', 'regnskapsforer', 'revisor', 'accounting', 'accountant'],
    dentist: ['tannlege', 'tannklinikk', 'tannhelse', 'dentist', 'dental'],
    physiotherapist: ['fysioterapeut', 'fysio', 'kiropraktor', 'physiotherapist'],
    restaurant: ['restaurant', 'spisested', 'kafe', 'cafe', 'dining'],
    paintball: ['paintball'],
    'escape room': ['escape room', 'escaperoom', 'escapreroom', 'rømningsrom', 'romningsrom', 'escape game'],
  }[canonicalIndustry] || []
  return uniqueText([...base, ...extras].map(normalizeIndustryText).filter(Boolean))
}

function termMatches(haystack, term) {
  if (!haystack || !term) return false
  if (haystack.includes(term)) return true
  return haystack.includes(term.replace(/\s+/g, ''))
}

function appendReason(existing, reason) {
  const current = String(existing || '').trim()
  return current ? `${current}|${reason}` : reason
}

function normalizeIndustryText(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function uniqueText(values) {
  return Array.from(new Set(values))
}

function enrichDiscoveryQuality(candidate = {}) {
  const quality = buildDiscoveryQuality(candidate)
  return { ...candidate, discoveryQuality: quality, discoveryConfidence: quality.level }
}

function buildDiscoveryQuality(candidate = {}) {
  let score = 0
  const reasons = []
  const warnings = []
  if (candidate.locationMatchStatus === 'exact_location') { score += 25; reasons.push('exact_location') }
  else if (candidate.locationMatchStatus === 'regional_fallback') { score += 12; warnings.push('regional_fallback') }
  else if (candidate.locationMatchStatus === 'unknown') warnings.push('location_unknown')
  else if (candidate.locationMatchStatus === 'out_of_area') warnings.push('out_of_area')

  if (candidate.website) { score += 18; reasons.push('website_available') }
  else warnings.push('missing_website')
  if (candidate.phone) { score += 18; reasons.push('phone_available') }
  else warnings.push('missing_phone')
  if (candidate.address || candidate.location) { score += 12; reasons.push('address_available') }
  else warnings.push('missing_address')
  if (candidate.placeId) { score += 12; reasons.push('place_id_available') }
  if (candidate.rating) { score += 8; reasons.push('rating_available') }
  if (candidate.reviewCount) { score += 7; reasons.push('reviews_available') }
  if (candidate.businessStatus === 'OPERATIONAL') { score += 5; reasons.push('operational') }
  if (candidate.sourceType === 'directBusiness') { score += 5; reasons.push('direct_business_target') }
  if (candidate.organizationNumber) { score += 18; reasons.push('confirmed_org') }
  else if (candidate.candidateOrganizationNumber) { score += 10; reasons.push('candidate_org') }
  if (candidate.identitySource === 'brreg' || candidate.sourceType === 'officialRegistry') { score += 8; reasons.push('official_registry') }
  if (candidate.naceCode) { score += 5; reasons.push('nace_available') }
  if (candidate.employees !== '' && candidate.employees != null) { score += 4; reasons.push('employees_available') }
  if (candidate.industryMatchStatus === 'relevant') { score += 8; reasons.push('industry_relevant') }
  if (candidate.industryMatchStatus === 'mismatch') warnings.push('industry_mismatch')
  if (candidate.auditEligible === false && candidate.auditExclusionReason !== 'missing_website_for_audit') warnings.push('not_audit_eligible')

  const capped = Math.max(0, Math.min(100, score))
  return {
    score: capped,
    level: capped >= 75 ? 'high' : capped >= 45 ? 'medium' : 'low',
    reasons,
    warnings,
  }
}

function toSummary(report) {
  return {
    query: report.query,
    industry: report.industry,
    canonicalIndustry: report.canonicalIndustry,
    industryTerm: report.industryTerm,
    expandedQueries: report.expandedQueries,
    location: report.location,
    locationIntent: report.locationIntent,
    locationQuality: report.locationQuality,
    searchScope: report.searchScope,
    searchSupply: report.searchSupply,
    requestedMaxResults: report.searchSupply?.requestedMaxResults ?? null,
    includedLeadCount: report.searchSupply?.includedLeadCount ?? 0,
    lowSupply: Boolean(report.searchSupply?.lowSupply),
    fallbackAvailable: Boolean(report.searchSupply?.fallbackAvailable),
    fallbackUsed: Boolean(report.searchSupply?.fallbackUsed),
    recommendedExpansion: report.searchSupply?.recommendedExpansion || null,
    sourceFile: report.sourceFile,
    sourceFiles: report.sourceFiles,
    provider: report.provider,
    processedAt: report.processedAt,
    totalRawCandidates: report.totalRawCandidates,
    invalidCandidates: report.invalidCandidates,
    duplicatesRemoved: report.duplicatesRemoved,
    totalCandidates: report.totalCandidates,
    reachableCandidates: report.reachableCandidates,
    unreachableCandidates: report.unreachableCandidates,
    candidatesBySource: report.candidatesBySource,
    candidatesBySourceType: report.candidatesBySourceType,
    auditEligibleCandidates: report.auditEligibleCandidates,
    excludedCandidates: report.excludedCandidates,
    excludedTargets: report.excludedTargets,
    handoffReadyCandidates: report.candidates.filter((candidate) => shouldIncludeInHandoff(candidate)).length,
    fastEligibleCandidates: report.candidates.filter((candidate) => shouldIncludeInFastLeadPack(candidate)).length,
    discoveryCoverage: report.discoveryCoverage,
  }
}

function normalizeSourceFiles(value) {
  return (Array.isArray(value) ? value : [value])
    .flatMap((item) => String(item || '').split(','))
    .map((item) => item.trim())
    .filter(Boolean)
}

module.exports = { discoverLocalBusinesses, writeDiscoveryOutputs, toSummary, normalizeSourceFiles, formatHandoffCandidate, shouldIncludeInHandoff, shouldIncludeInFastLeadPack, buildDiscoveryQuality, applyIndustryQuality }
