const fs = require('fs')
const path = require('path')
const { discoverLocalBusinesses, writeDiscoveryOutputs, shouldIncludeInFastLeadPack } = require('../lead-discovery-agent/discoverLocalBusinesses')
const { enrichCompanyProfile } = require('../company-profile/companyProfile')
const { normalizeSearchScope } = require('../lead-discovery-agent/normalizers/locationQuality')

async function runLeadMachine(options = {}) {
  if (!options.query) throw new Error('query is required')
  const query = String(options.query).trim()
  const provider = options.provider || 'balanced'
  const maxResults = normalizePositiveInteger(options.maxResults, 5)
  const searchScope = normalizeSearchScope(options.searchScope)
  const enrichCompanyProfileEnabled = parseBoolean(options.enrichCompanyProfile)
  const runMode = normalizeRunMode(options.mode || options.runMode)
  const runId = options.runId || createLeadMachineRunId(query)
  const outputDir = path.resolve(options.outputDir || path.join(__dirname, 'runs', runId))
  const discoveryDir = path.join(outputDir, 'discovery')
  const leadPackOutputDir = path.join(outputDir, 'lead-packs')
  fs.mkdirSync(discoveryDir, { recursive: true })
  fs.mkdirSync(leadPackOutputDir, { recursive: true })

  const discovery = await discoverLocalBusinesses({
    query,
    provider,
    maxResults,
    searchScope,
    mockResultsPath: options.mockResultsPath,
    mockResults: options.mockResults,
    validate: options.validate === undefined ? false : parseBoolean(options.validate),
    env: options.env,
    fetchImpl: options.fetchImpl,
    googlePlacesEndpoint: options.googlePlacesEndpoint,
    brregEndpoint: options.brregEndpoint,
    braveEndpoint: options.braveEndpoint,
    marketSweep: options.marketSweep,
    marketSweepCities: options.marketSweepCities,
    maxProviderQueries: options.maxProviderQueries,
    perProviderQueryMaxResults: options.perProviderQueryMaxResults,
  })
  const discoveryOutputs = writeDiscoveryOutputs(discovery, {
    outPath: path.join(discoveryDir, 'lead-candidates.json'),
    summaryPath: path.join(discoveryDir, 'discovery-summary.json'),
    handoffPath: path.join(discoveryDir, 'handoff.jsonl'),
  })

  const leadPackResult = await writeFastLeadPackOutputs({
    outputDir: leadPackOutputDir,
    query,
    runId,
    discovery,
    candidates: discovery.candidates.filter((candidate) => shouldIncludeInFastLeadPack(candidate)),
    enrichCompanyProfile: enrichCompanyProfileEnabled,
  })
  const leadPackSummary = readJson(leadPackResult.summaryPath)
  const leadPacks = readJson(leadPackResult.leadPacksPath)

  const summary = buildLeadMachineSummary({
    runId,
    query,
    provider,
    maxResults,
    searchScope,
    enrichCompanyProfile: enrichCompanyProfileEnabled,
    outputDir,
    runMode,
    discovery,
    discoveryOutputs,
    leadPackResult,
    leadPackSummary,
    leadPacks,
  })
  const summaryPath = path.join(outputDir, 'lead-machine-summary.json')
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`)
  return { outputDir, summaryPath, leadPackOutputPath: leadPackOutputDir, sourceRunPath: summary.sourceRunPath, totalLeads: summary.totalIncluded, summary }
}

function buildLeadMachineSummary({ runId, query, provider, maxResults, searchScope, enrichCompanyProfile, outputDir, runMode = 'fast', discovery, discoveryOutputs, leadPackResult, leadPackSummary, leadPacks }) {
  const locationQualityCounts = leadPackSummary.locationQualityCounts || discovery.locationQuality?.counts || {}
  const callPriorityCounts = leadPackSummary.priorityCounts || {}
  const includedLeadCount = leadPackSummary.totalLeads || 0
  const totalExcludedByLocation = countLocationExcluded(discovery)
  const lowSupply = Boolean(discovery.searchSupply?.lowSupply || leadPackSummary.lowSupply)
  const fallbackAvailable = Boolean(discovery.searchSupply?.fallbackAvailable || leadPackSummary.fallbackAvailable)
  const fallbackUsed = Boolean(discovery.searchSupply?.fallbackUsed || leadPackSummary.fallbackUsed)
  const recommendedExpansion = discovery.searchSupply?.recommendedExpansion || leadPackSummary.recommendedExpansion || null
  const nextRecommendedAction = buildNextRecommendedAction({
    searchScope,
    includedLeadCount,
    lowSupply,
    fallbackAvailable,
    fallbackUsed,
    recommendedExpansion,
    callPriorityCounts,
  })

  return {
    runId,
    query,
    provider,
    searchScope,
    mode: runMode,
    maxResults,
    outputDir,
    createdAt: new Date().toISOString(),
    discoveryOutputs,
    sourceRunPath: discoveryOutputs.candidatesPath || discoveryOutputs.handoffPath || null,
    leadPackOutputPath: leadPackResult.outputDir,
    totalDiscovered: discovery.totalCandidates,
    totalIncluded: includedLeadCount,
    includedLeadCount,
    totalExcludedByLocation,
    locationQualityCounts,
    discoveryCoverage: leadPackSummary.discoveryCoverage || discovery.discoveryCoverage || {},
    callPriorityCounts,
    lowSupply,
    fallbackAvailable,
    fallbackUsed,
    recommendedExpansion,
    companyProfileEnabled: Boolean(enrichCompanyProfile),
    companyProfileCounts: countCompanyProfileStatuses(leadPacks),
    economyStatus: 'not_enabled',
    auditStatus: 'skipped_fast_mode',
    marketSweep: Boolean(discovery.provider?.sweep?.enabled),
    marketSweepCities: discovery.provider?.sweep?.cities || [],
    marketSweepPerCityLimit: discovery.provider?.sweep?.perCity || null,
    marketSweepCityCounts: countLeadPackCities(leadPacks),
    nextRecommendedAction,
    productBoundary: 'machine_generates_ranked_lead_packs_seller_owns_angle_wording_outreach_timing_relationship_close',
  }
}

async function writeFastLeadPackOutputs({ outputDir, query, runId, discovery, candidates, enrichCompanyProfile }) {
  fs.mkdirSync(outputDir, { recursive: true })
  const lastCheckedAt = new Date().toISOString()
  const orderedCandidates = orderCandidatesForLeadPacks(candidates, discovery)
  const leadPacks = []
  for (const candidate of orderedCandidates) {
    const companyProfile = enrichCompanyProfile ? await safeFastCompanyProfile(candidate) : null
    leadPacks.push(buildFastLeadPack({ candidate, discovery, query, runId, companyProfile, lastCheckedAt }))
  }
  if (discovery.provider?.sweep?.enabled) leadPacks.sort(compareLeadPacksByCity)
  leadPacks.forEach((pack, index) => { pack.rank = index + 1 })
  const summary = buildFastLeadPackSummary({ outputDir, query, runId, discovery, leadPacks, enrichCompanyProfile, lastCheckedAt })
  const leadPacksPath = path.join(outputDir, 'lead-packs.json')
  const csvPath = path.join(outputDir, 'lead-packs.csv')
  const summaryPath = path.join(outputDir, 'summary.json')
  fs.writeFileSync(leadPacksPath, `${JSON.stringify(leadPacks, null, 2)}\n`)
  fs.writeFileSync(csvPath, buildFastLeadPacksCsv(leadPacks))
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`)
  return { outputDir, leadPacksPath, csvPath, summaryPath, totalLeads: leadPacks.length }
}

function buildFastLeadPack({ candidate, discovery, query, runId, companyProfile, lastCheckedAt }) {
  const company = companyFromFastProfile(candidate, companyProfile)
  const contactability = candidate.phone || candidate.website ? 'basic_contact_available' : 'limited_contact_data'
  const whyRanked = [
    'Discovery scan lead: local source and contact data only.',
    candidate.phone ? 'Phone available from discovery source.' : null,
    candidate.website ? 'Website URL is unverified until enrichment confirms it.' : null,
    candidate.rating ? `Google rating ${candidate.rating}${candidate.reviewCount ? ` from ${candidate.reviewCount} reviews` : ''}.` : null,
    candidate.discoveryQuality?.level ? `Discovery confidence: ${candidate.discoveryQuality.level}.` : null,
    companyProfile?.matchStatus ? `companyProfile:${companyProfile.matchStatus}` : null,
  ].filter(Boolean)
  const caution = [
    'Scan mode has not verified digital presence or deep company context.',
    'Use selected-lead enrichment when you need more context before calling.',
    candidate.website ? 'Website is unverified in Fast mode and may be parked, stale, or unrelated.' : null,
    companyProfile?.matchStatus && !['exact_match', 'strong_match'].includes(companyProfile.matchStatus) ? 'Company identity requires manual verification before using org.nr.' : null,
    ...(companyProfile?.warnings || []).map((warning) => `Company profile warning: ${warning}`),
  ].filter(Boolean)

  return {
    rank: 0,
    callPriority: 'verify',
    leadClass: 'fast_discovery',
    opportunityType: 'seller_review',
    company,
    contact: {
      website: candidate.website || null,
      phone: candidate.phone || null,
      email: null,
      address: candidate.address || candidate.location || null,
      city: candidate.candidateCity || extractCity(candidate.address || candidate.location || ''),
    },
    places: {
      provider: candidate.provenance?.provider || candidate.sources?.[0]?.provider || candidate.source || null,
      placeId: candidate.placeId || null,
      rating: numberOrNull(candidate.rating),
      reviewCount: numberOrNull(candidate.reviewCount),
    },
    website: {
      auditStatus: 'skipped_fast_mode',
      topEvidence: [
        candidate.website ? 'Website URL from discovery; not verified and may be parked/wrong until enrichment runs.' : 'No website URL found in discovery.',
        candidate.phone ? 'Phone found in discovery source.' : 'Phone not found in discovery source.',
      ],
      contactability,
      ctaProfile: null,
    },
    ranking: {
      whyRanked,
      caution,
      painScore: null,
      buyingLikelihood: null,
      salesEase: candidate.phone || candidate.website ? 'medium' : 'unknown',
    },
    economy: { status: 'not_enabled', source: null, revenue: null, profit: null, employees: null },
    sourceQuality: {
      searchScope: candidate.searchScope || discovery.searchScope || 'strict',
      marketSweep: Boolean(discovery.provider?.sweep?.enabled),
      marketSweepCity: candidate.candidateCity || extractCity(candidate.address || candidate.location || ''),
      requestedMaxResults: discovery.searchSupply?.requestedMaxResults ?? null,
      includedLeadCount: discovery.searchSupply?.includedLeadCount ?? null,
      lowSupply: Boolean(discovery.searchSupply?.lowSupply),
      fallbackAvailable: Boolean(discovery.searchSupply?.fallbackAvailable),
      recommendedExpansion: discovery.searchSupply?.recommendedExpansion || null,
      requestedLocation: candidate.requestedLocation || discovery.location || discovery.locationIntent?.requestedLocation || null,
      candidateLocation: candidate.candidateLocation || candidate.address || candidate.location || null,
      locationMatchStatus: candidate.locationMatchStatus || 'unknown',
      locationConfidence: numberOrNull(candidate.locationConfidence),
      distanceKm: numberOrNull(candidate.distanceKm),
      locationWarnings: Array.isArray(candidate.locationWarnings) ? candidate.locationWarnings : [],
      fallbackUsed: Boolean(candidate.fallbackUsed),
      discoveryQuality: candidate.discoveryQuality || null,
      discoveryConfidence: candidate.discoveryConfidence || null,
      identitySource: candidate.identitySource || null,
      presenceSource: candidate.presenceSource || candidate.provenance?.provider || null,
    },
    meta: {
      sourceQuery: query,
      sourceRun: runId,
      lastCheckedAt,
      mode: 'fast',
      marketSweep: Boolean(discovery.provider?.sweep?.enabled),
    },
  }
}

function orderCandidatesForLeadPacks(candidates = [], discovery = {}) {
  const list = Array.isArray(candidates) ? candidates.slice() : []
  if (!discovery.provider?.sweep?.enabled) return list
  return list.sort((a, b) => cityKey(a).localeCompare(cityKey(b)) || String(a.businessName || '').localeCompare(String(b.businessName || '')))
}

function compareLeadPacksByCity(a = {}, b = {}) {
  const cityDiff = cityKey(a).localeCompare(cityKey(b))
  if (cityDiff) return cityDiff
  const phoneDiff = Number(Boolean(b.contact?.phone || b.phone)) - Number(Boolean(a.contact?.phone || a.phone))
  if (phoneDiff) return phoneDiff
  return String(a.company?.displayName || a.companyName || '').localeCompare(String(b.company?.displayName || b.companyName || ''))
}

function countLeadPackCities(leadPacks = []) {
  const counts = {}
  for (const lead of Array.isArray(leadPacks) ? leadPacks : []) {
    const city = lead.contact?.city || lead.city || lead.sourceQuality?.marketSweepCity || 'unknown'
    counts[city] = (counts[city] || 0) + 1
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)))
}

function cityKey(value = {}) {
  return String(value.contact?.city || value.city || value.candidateCity || value.location || value.address || 'unknown')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
}

function companyFromFastProfile(candidate, profile) {
  const profileConfirmed = isConfirmedFastProfile(profile)
  const metadataConfirmed = Boolean(candidate.organizationNumber)
  const metadataCandidate = Boolean(candidate.candidateOrganizationNumber)
  return {
    displayName: candidate.businessName || candidate.name || null,
    legalName: profile?.legalName || candidate.legalName || null,
    candidateLegalName: profile?.candidateLegalName || candidate.candidateLegalName || candidate.legalName || null,
    organizationNumber: profileConfirmed ? profile.organizationNumber : (metadataConfirmed ? candidate.organizationNumber : null),
    candidateOrganizationNumber: profile?.candidateOrganizationNumber || candidate.candidateOrganizationNumber || candidate.organizationNumber || null,
    organizationForm: profile?.organizationForm || candidate.organizationForm || null,
    registeredAddress: profile?.registeredAddress || candidate.registeredAddress || null,
    municipality: profile?.municipality || candidate.municipality || null,
    unitType: profile?.unitType || candidate.unitType || null,
    naceCode: profile?.naceCode || candidate.naceCode || null,
    naceDescription: profile?.naceDescription || candidate.naceDescription || null,
    employees: profile?.employees ?? numberOrNull(candidate.employees),
    registrationDate: profile?.registrationDate || candidate.registrationDate || null,
    activeStatus: profile?.activeStatus || candidate.activeStatus || null,
    source: profile?.source || candidate.identitySource || null,
    sourceUrl: profile?.sourceUrl || candidate.sourceUrl || null,
    errorType: profile?.errorType || null,
    matchStatus: profile?.matchStatus || (metadataConfirmed ? 'exact_match' : (metadataCandidate ? 'manual_verify' : null)),
    matchConfidence: profile?.matchConfidence ?? (metadataConfirmed ? 1 : (metadataCandidate ? 0.7 : null)),
    matchReasons: Array.isArray(profile?.matchReasons) ? profile.matchReasons : (metadataConfirmed ? ['official_registry_identity'] : []),
    warnings: Array.isArray(profile?.warnings) ? profile.warnings : [],
    candidates: Array.isArray(profile?.candidates) && profile.candidates.length ? profile.candidates : fastMetadataCandidates(candidate),
  }
}

function fastMetadataCandidates(candidate = {}) {
  if (!candidate.candidateOrganizationNumber && !candidate.organizationNumber) return []
  return [{
    candidateOrganizationNumber: candidate.candidateOrganizationNumber || candidate.organizationNumber,
    candidateLegalName: candidate.candidateLegalName || candidate.legalName || null,
    organizationForm: candidate.organizationForm || null,
    municipality: candidate.municipality || null,
    address: candidate.registeredAddress || candidate.address || null,
    unitType: candidate.unitType || null,
    score: candidate.organizationNumber ? 1 : 0.7,
    matchReasons: candidate.organizationNumber ? ['official_registry_identity'] : ['candidate_registry_identity'],
    warnings: [],
  }]
}

function isConfirmedFastProfile(profile) {
  return Boolean(profile && ['exact_match', 'strong_match'].includes(profile.matchStatus) && profile.organizationNumber)
}

async function safeFastCompanyProfile(candidate) {
  if (candidate.organizationNumber) return companyProfileFromCandidate(candidate)
  try {
    return await enrichCompanyProfile({
      companyName: candidate.businessName || candidate.name,
      website: candidate.website,
      phone: candidate.phone,
      email: null,
      address: candidate.address || candidate.location,
      city: candidate.candidateCity || extractCity(candidate.address || candidate.location || ''),
      industry: candidate.industry || candidate.canonicalIndustry,
    }, {
      fileCache: true,
    })
  } catch (error) {
    return {
      organizationNumber: null,
      candidateOrganizationNumber: null,
      legalName: null,
      candidateLegalName: null,
      organizationForm: null,
      registeredAddress: null,
      municipality: null,
      unitType: null,
      naceCode: null,
      naceDescription: null,
      employees: null,
      registrationDate: null,
      activeStatus: null,
      source: 'brreg',
      sourceUrl: null,
      errorType: 'unknown_error',
      matchStatus: 'error',
      matchConfidence: 0,
      matchReasons: [],
      warnings: [error && error.message ? error.message : 'company_profile_error'],
      candidates: [],
    }
  }
}


function companyProfileFromCandidate(candidate = {}) {
  return {
    organizationNumber: candidate.organizationNumber || null,
    candidateOrganizationNumber: candidate.candidateOrganizationNumber || candidate.organizationNumber || null,
    legalName: candidate.legalName || null,
    candidateLegalName: candidate.candidateLegalName || candidate.legalName || null,
    organizationForm: candidate.organizationForm || null,
    registeredAddress: candidate.registeredAddress || null,
    municipality: candidate.municipality || null,
    unitType: candidate.unitType || null,
    naceCode: candidate.naceCode || null,
    naceDescription: candidate.naceDescription || null,
    employees: candidate.employees === '' ? null : candidate.employees,
    registrationDate: candidate.registrationDate || null,
    activeStatus: candidate.activeStatus || null,
    source: candidate.identitySource || 'brreg',
    sourceUrl: candidate.sourceUrl || null,
    matchStatus: candidate.organizationNumber ? 'exact_match' : 'manual_verify',
    matchConfidence: candidate.organizationNumber ? 1 : 0.7,
    matchReasons: candidate.organizationNumber ? ['official_registry_identity'] : ['candidate_registry_identity'],
    warnings: [],
    candidates: fastMetadataCandidates(candidate),
  }
}

function buildFastLeadPackSummary({ outputDir, query, runId, discovery, leadPacks, enrichCompanyProfile, lastCheckedAt }) {
  return {
    runId,
    sourceRun: runId,
    outputDir,
    sourceQuery: query,
    generatedAt: lastCheckedAt,
    mode: 'fast',
    totalLeads: leadPacks.length,
    priorityCounts: countPriority(leadPacks),
    enrichCompanyProfile: Boolean(enrichCompanyProfile),
    economyStatus: 'not_enabled',
    searchScope: discovery.searchScope || 'strict',
    requestedMaxResults: discovery.searchSupply?.requestedMaxResults ?? null,
    includedLeadCount: leadPacks.length,
    lowSupply: Boolean(discovery.searchSupply?.lowSupply),
    fallbackAvailable: Boolean(discovery.searchSupply?.fallbackAvailable),
    fallbackUsed: Boolean(discovery.searchSupply?.fallbackUsed),
    recommendedExpansion: discovery.searchSupply?.recommendedExpansion || null,
    locationQualityCounts: discovery.locationQuality?.counts || {},
    discoveryCoverage: discovery.discoveryCoverage || {},
    marketSweep: Boolean(discovery.provider?.sweep?.enabled),
    marketSweepCities: discovery.provider?.sweep?.cities || [],
    marketSweepPerCityLimit: discovery.provider?.sweep?.perCity || null,
    marketSweepCityCounts: countLeadPackCities(leadPacks),
  }
}

function buildFastLeadPacksCsv(leadPacks) {
  const rows = leadPacks.map((pack) => ({
    rank: pack.rank,
    callPriority: pack.callPriority,
    leadClass: pack.leadClass,
    opportunityType: pack.opportunityType,
    companyDisplayName: pack.company.displayName,
    legalName: pack.company.legalName,
    candidateLegalName: pack.company.candidateLegalName,
    organizationNumber: pack.company.organizationNumber,
    candidateOrganizationNumber: pack.company.candidateOrganizationNumber,
    organizationForm: pack.company.organizationForm,
    registeredAddress: pack.company.registeredAddress,
    municipality: pack.company.municipality,
    unitType: pack.company.unitType,
    naceCode: pack.company.naceCode,
    naceDescription: pack.company.naceDescription,
    employees: pack.company.employees,
    registrationDate: pack.company.registrationDate,
    activeStatus: pack.company.activeStatus,
    sourceUrl: pack.company.sourceUrl,
    matchStatus: pack.company.matchStatus,
    matchConfidence: pack.company.matchConfidence,
    website: pack.contact.website,
    phone: pack.contact.phone,
    email: pack.contact.email,
    address: pack.contact.address,
    city: pack.contact.city,
    placeId: pack.places.placeId,
    rating: pack.places.rating,
    reviewCount: pack.places.reviewCount,
    auditStatus: pack.website.auditStatus,
    contactability: pack.website.contactability,
    whyRanked: pack.ranking.whyRanked.join('|'),
    caution: pack.ranking.caution.join('|'),
    economyStatus: pack.economy.status,
    identitySource: pack.sourceQuality.identitySource,
    presenceSource: pack.sourceQuality.presenceSource,
    searchScope: pack.sourceQuality.searchScope,
    marketSweep: pack.sourceQuality.marketSweep ? 'yes' : 'no',
    marketSweepCity: pack.sourceQuality.marketSweepCity,
    locationMatchStatus: pack.sourceQuality.locationMatchStatus,
    sourceQuery: pack.meta.sourceQuery,
    mode: pack.meta.mode,
  }))
  return renderCsv(rows, ['rank', 'callPriority', 'leadClass', 'opportunityType', 'companyDisplayName', 'legalName', 'candidateLegalName', 'organizationNumber', 'candidateOrganizationNumber', 'organizationForm', 'registeredAddress', 'municipality', 'unitType', 'naceCode', 'naceDescription', 'employees', 'registrationDate', 'activeStatus', 'sourceUrl', 'matchStatus', 'matchConfidence', 'website', 'phone', 'email', 'address', 'city', 'placeId', 'rating', 'reviewCount', 'auditStatus', 'contactability', 'whyRanked', 'caution', 'economyStatus', 'identitySource', 'presenceSource', 'searchScope', 'marketSweep', 'marketSweepCity', 'locationMatchStatus', 'sourceQuery', 'mode'])
}

function renderCsv(rows, columns) {
  return [columns, ...rows.map((row) => columns.map((column) => row[column]))]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n') + '\n'
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
}

function countPriority(leadPacks) {
  return (leadPacks || []).reduce((acc, lead) => {
    const key = lead.callPriority || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

function extractCity(value) {
  const parts = String(value || '').split(',').map((part) => part.trim()).filter(Boolean)
  if (!parts.length) return null
  const cityPart = parts.find((part) => /\b\d{4}\b/.test(part)) || parts[parts.length - 1]
  return cityPart.replace(/\b\d{4}\b/g, '').replace(/\bNorway\b/gi, '').trim() || null
}

function numberOrNull(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function writeEmptyLeadPackOutputs({ outputDir, query, runId, discovery }) {
  fs.mkdirSync(outputDir, { recursive: true })
  const summary = {
    runId,
    sourceRun: null,
    outputDir,
    sourceQuery: query,
    generatedAt: new Date().toISOString(),
    totalLeads: 0,
    priorityCounts: {},
    enrichCompanyProfile: false,
    economyStatus: 'not_enabled',
    auditStatus: 'not_run',
    searchScope: discovery.searchScope || 'strict',
    requestedMaxResults: discovery.searchSupply?.requestedMaxResults ?? null,
    includedLeadCount: 0,
    lowSupply: Boolean(discovery.searchSupply?.lowSupply),
    fallbackAvailable: Boolean(discovery.searchSupply?.fallbackAvailable),
    fallbackUsed: Boolean(discovery.searchSupply?.fallbackUsed),
    recommendedExpansion: discovery.searchSupply?.recommendedExpansion || null,
    locationQualityCounts: discovery.locationQuality?.counts || {},
    marketSweep: Boolean(discovery.provider?.sweep?.enabled),
    marketSweepCities: discovery.provider?.sweep?.cities || [],
    marketSweepPerCityLimit: discovery.provider?.sweep?.perCity || null,
    marketSweepCityCounts: {},
  }
  fs.writeFileSync(path.join(outputDir, 'lead-packs.json'), '[]\n')
  fs.writeFileSync(path.join(outputDir, 'lead-packs.csv'), '\n')
  fs.writeFileSync(path.join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
}

function countCompanyProfileStatuses(leadPacks) {
  return (leadPacks || []).reduce((acc, lead) => {
    const key = lead.company?.matchStatus || 'not_run'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
}

function countLocationExcluded(discovery) {
  return (discovery.candidates || []).filter((candidate) => {
    if (candidate.auditEligible !== false) return false
    const reason = String(candidate.auditExclusionReason || '')
    return candidate.locationMatchStatus === 'out_of_area' || reason.startsWith('out_of_area:')
  }).length
}

function buildNextRecommendedAction({ searchScope, includedLeadCount, lowSupply, fallbackAvailable, fallbackUsed, recommendedExpansion, callPriorityCounts }) {
  const highCount = Number(callPriorityCounts.high || callPriorityCounts.HIGH || 0)
  const mediumCount = Number(callPriorityCounts.medium || callPriorityCounts.MEDIUM || 0)

  if (searchScope === 'strict' && includedLeadCount === 0 && fallbackAvailable) {
    return `Run again with --search-scope ${recommendedExpansion || 'nearby'} or regional.`
  }
  if (searchScope === 'regional' && fallbackUsed) {
    return 'Review fallback location warnings before treating these as local leads.'
  }
  if (searchScope === 'strict' && lowSupply) {
    return 'Review exact leads, or expand to nearby if more volume is needed.'
  }
  if (includedLeadCount > 0 && highCount > 0) {
    return 'Review HIGH leads first.'
  }
  if (includedLeadCount > 0 && highCount === 0 && mediumCount > 0) {
    return 'Review top MEDIUM leads as shortlist.'
  }
  if (includedLeadCount > 0) {
    return 'Review generated lead packs.'
  }
  return 'No leads included; review discovery source quality or broaden the search.'
}

function formatTerminalSummary(summary) {
  const lines = [
    'Lead Machine Run Complete',
    `Query: ${summary.query}`,
    `Provider: ${summary.provider}`,
    `Scope: ${summary.searchScope}`,
    `Mode: ${summary.mode || 'deep'}`,
    `Max results: ${summary.maxResults}`,
    `Discovered candidates: ${summary.totalDiscovered}`,
    `Included leads: ${summary.includedLeadCount}`,
    `Excluded by location: ${summary.totalExcludedByLocation}`,
    `Low supply: ${summary.lowSupply}`,
    `Fallback available: ${summary.fallbackAvailable}`,
    `Fallback used: ${summary.fallbackUsed}`,
  ]
  if (summary.recommendedExpansion) lines.push(`Recommended expansion: ${summary.recommendedExpansion}`)
  if (summary.searchScope === 'regional' && summary.fallbackUsed) lines.push('Warning: regional fallback leads included; review location warnings.')
  lines.push(`Next action: ${summary.nextRecommendedAction}`)
  lines.push(`Output: ${summary.outputDir}`)
  return lines.join('\n')
}

function createLeadMachineRunId(query) {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  return `${slugify(query)}-${stamp}`
}

function slugify(value) {
  return String(value || 'lead-machine')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'lead-machine'
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback
}

function normalizeRunMode(value) {
  return String(value || 'fast').toLowerCase() === 'deep' ? 'deep' : 'fast'
}

function parseBoolean(value) {
  if (value === true) return true
  return ['1', 'true', 'yes'].includes(String(value || '').toLowerCase())
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) out[key] = true
    else { out[key] = next; i += 1 }
  }
  return out
}

module.exports = { runLeadMachine, buildLeadMachineSummary, buildNextRecommendedAction, formatTerminalSummary, createLeadMachineRunId, parseArgs, slugify, normalizeRunMode }
