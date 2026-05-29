const fs = require('fs')
const path = require('path')
const { discoverLocalBusinesses, writeDiscoveryOutputs, shouldIncludeInHandoff, shouldIncludeInFastLeadPack, formatHandoffCandidate } = require('../lead-discovery-agent/discoverLocalBusinesses')
const { runAuditQueue } = require('../orchestrator/pipelines/auditQueue')
const { runLeadPack } = require('../lead-pack-runner/leadPackRunner')
const { enrichCompanyProfile } = require('../company-profile/companyProfile')
const { renderCsv } = require('../lead-review-workspace/readers/csv')
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
  const orchestratorRootDir = path.resolve(options.orchestratorRootDir || path.join(__dirname, '..', 'orchestrator', 'runs'))
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
  })
  const discoveryOutputs = writeDiscoveryOutputs(discovery, {
    outPath: path.join(discoveryDir, 'lead-candidates.json'),
    summaryPath: path.join(discoveryDir, 'discovery-summary.json'),
    handoffPath: path.join(discoveryDir, 'handoff.jsonl'),
  })

  const handoffItems = discovery.candidates
    .filter((candidate) => shouldIncludeInHandoff(candidate))
    .map((candidate) => JSON.parse(formatHandoffCandidate(candidate, discovery)))

  let auditResult = null
  let leadPackResult = null
  let leadPackSummary = null
  let leadPacks = []
  if (runMode === 'fast') {
    leadPackResult = await writeFastLeadPackOutputs({
      outputDir: leadPackOutputDir,
      query,
      runId,
      discovery,
      candidates: discovery.candidates.filter((candidate) => shouldIncludeInFastLeadPack(candidate)),
      enrichCompanyProfile: enrichCompanyProfileEnabled,
    })
    leadPackSummary = readJson(leadPackResult.summaryPath)
    leadPacks = readJson(leadPackResult.leadPacksPath)
  } else if (handoffItems.length > 0) {
    auditResult = await runAuditQueue({
      urls: handoffItems,
      runId: `${runId}-orchestrator`,
      rootDir: orchestratorRootDir,
      maxRetries: 1,
    })
    leadPackResult = await runLeadPack({
      query,
      runDir: path.dirname(auditResult.summaryPath),
      outputDir: leadPackOutputDir,
      enrichCompanyProfile: enrichCompanyProfileEnabled,
    })
    leadPackSummary = readJson(leadPackResult.summaryPath)
    leadPacks = readJson(leadPackResult.leadPacksPath)
  } else {
    writeEmptyLeadPackOutputs({ outputDir: leadPackOutputDir, query, runId, discovery })
    leadPackResult = {
      outputDir: leadPackOutputDir,
      leadPacksPath: path.join(leadPackOutputDir, 'lead-packs.json'),
      csvPath: path.join(leadPackOutputDir, 'lead-packs.csv'),
      summaryPath: path.join(leadPackOutputDir, 'summary.json'),
      totalLeads: 0,
    }
    leadPackSummary = readJson(leadPackResult.summaryPath)
  }

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
    auditResult,
    leadPackResult,
    leadPackSummary,
    leadPacks,
  })
  const summaryPath = path.join(outputDir, 'lead-machine-summary.json')
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`)
  return { outputDir, summaryPath, leadPackOutputPath: leadPackOutputDir, sourceRunPath: summary.sourceRunPath, totalLeads: summary.totalIncluded, summary }
}

function buildLeadMachineSummary({ runId, query, provider, maxResults, searchScope, enrichCompanyProfile, outputDir, runMode = 'deep', discovery, discoveryOutputs, auditResult, leadPackResult, leadPackSummary, leadPacks }) {
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
    sourceRunPath: auditResult ? path.dirname(auditResult.summaryPath) : (runMode === 'fast' ? discoveryOutputs.handoffPath : null),
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
    auditStatus: runMode === 'fast' ? 'skipped_fast_mode' : (auditResult ? 'completed' : 'not_run'),
    nextRecommendedAction,
    productBoundary: 'machine_generates_ranked_lead_packs_seller_owns_angle_wording_outreach_timing_relationship_close',
  }
}

async function writeFastLeadPackOutputs({ outputDir, query, runId, discovery, candidates, enrichCompanyProfile }) {
  fs.mkdirSync(outputDir, { recursive: true })
  const lastCheckedAt = new Date().toISOString()
  const leadPacks = []
  for (const candidate of candidates) {
    const companyProfile = enrichCompanyProfile ? await safeFastCompanyProfile(candidate) : null
    leadPacks.push(buildFastLeadPack({ candidate, discovery, query, runId, companyProfile, lastCheckedAt }))
  }
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
    'Fast mode lead: local discovery and contact data only.',
    candidate.phone ? 'Phone available from discovery source.' : null,
    candidate.website ? 'Website URL is unverified until Deep audit confirms it.' : null,
    candidate.rating ? `Google rating ${candidate.rating}${candidate.reviewCount ? ` from ${candidate.reviewCount} reviews` : ''}.` : null,
    candidate.discoveryQuality?.level ? `Discovery confidence: ${candidate.discoveryQuality.level}.` : null,
    companyProfile?.matchStatus ? `companyProfile:${companyProfile.matchStatus}` : null,
  ].filter(Boolean)
  const caution = [
    'Fast mode skips full website audit and commercial scoring.',
    'Run Deep mode before treating this as call-first.',
    candidate.website ? 'Website is unverified in Fast mode and may be parked, stale, or unrelated.' : null,
    companyProfile?.matchStatus && !['exact_match', 'strong_match'].includes(companyProfile.matchStatus) ? 'Company identity requires manual verification before using org.nr.' : null,
    ...(companyProfile?.warnings || []).map((warning) => `Company profile warning: ${warning}`),
  ].filter(Boolean)

  return {
    rank: 0,
    callPriority: 'verify',
    leadClass: 'fast_discovery',
    opportunityType: 'needs_deep_review',
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
        candidate.website ? 'Website URL from discovery; not verified and may be parked/wrong until Deep audit runs.' : 'No website URL found in discovery.',
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
    },
  }
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
    locationMatchStatus: pack.sourceQuality.locationMatchStatus,
    sourceQuery: pack.meta.sourceQuery,
    mode: pack.meta.mode,
  }))
  return renderCsv(rows, ['rank', 'callPriority', 'leadClass', 'opportunityType', 'companyDisplayName', 'legalName', 'candidateLegalName', 'organizationNumber', 'candidateOrganizationNumber', 'organizationForm', 'registeredAddress', 'municipality', 'unitType', 'naceCode', 'naceDescription', 'employees', 'registrationDate', 'activeStatus', 'sourceUrl', 'matchStatus', 'matchConfidence', 'website', 'phone', 'email', 'address', 'city', 'placeId', 'rating', 'reviewCount', 'auditStatus', 'contactability', 'whyRanked', 'caution', 'economyStatus', 'identitySource', 'presenceSource', 'searchScope', 'locationMatchStatus', 'sourceQuery', 'mode'])
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
  return String(value || 'deep').toLowerCase() === 'fast' ? 'fast' : 'deep'
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
