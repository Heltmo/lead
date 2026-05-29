const fs = require('fs')
const path = require('path')
const { readRunArtifacts } = require('../lead-review-workspace/readers/runArtifacts')
const { renderCsv } = require('../lead-review-workspace/readers/csv')
const { buildBusinessSignalProfile } = require('../business-signal-engine/businessSignalEngine')
const { buildLeadInsight } = require('../lead-insight-agent/leadInsightAgent')
const { buildCompressedOpportunity } = require('../opportunity-compressor/opportunityCompressor')
const { buildCommercialPressure } = require('../commercial-pressure/commercialPressure')
const { enrichCompanyProfile } = require('../company-profile/companyProfile')

const LEAD_PACK_COLUMNS = [
  'rank', 'callPriority', 'leadClass', 'opportunityType',
  'companyDisplayName', 'legalName', 'candidateLegalName', 'organizationNumber', 'candidateOrganizationNumber', 'organizationForm', 'registeredAddress', 'municipality', 'unitType', 'naceCode', 'naceDescription', 'employees', 'registrationDate', 'activeStatus', 'sourceUrl', 'matchStatus', 'matchConfidence', 'matchWarnings',
  'website', 'phone', 'email', 'address', 'city',
  'placeId', 'rating', 'reviewCount',
  'auditStatus', 'topEvidence', 'contactability',
  'whyRanked', 'caution', 'painScore', 'buyingLikelihood', 'salesEase',
  'economyStatus', 'identitySource', 'presenceSource', 'searchScope', 'requestedMaxResults', 'includedLeadCount', 'lowSupply', 'fallbackAvailable', 'recommendedExpansion', 'requestedLocation', 'candidateLocation', 'locationMatchStatus', 'locationConfidence', 'distanceKm', 'locationWarnings', 'fallbackUsed', 'sourceQuery', 'sourceRun', 'lastCheckedAt',
]

async function runLeadPack(options = {}) {
  if (!options.runDir && !options.summaryPath) throw new Error('runDir or summaryPath is required')
  const runDir = path.resolve(options.runDir || path.dirname(options.summaryPath))
  const summaryPath = path.resolve(options.summaryPath || path.join(runDir, 'summary.json'))
  const outputDir = path.resolve(options.outputDir || path.join(process.cwd(), 'runs', path.basename(runDir)))
  const sourceQuery = options.query || null
  const enrich = parseBoolean(options.enrichCompanyProfile)
  const artifacts = readRunArtifacts({ summaryPath, leadsCsvPath: options.leadsCsvPath })
  fs.mkdirSync(outputDir, { recursive: true })
  const leadPacks = []
  const lastCheckedAt = new Date().toISOString()
  const insightCacheDir = path.join(outputDir, '.lead-insights')

  for (const item of artifacts.items) {
    const businessSignalProfile = buildBusinessSignalProfile(item)
    const enrichedItem = { ...item, businessSignalProfile }
    const leadInsight = buildLeadInsight(enrichedItem, { cacheDir: insightCacheDir })
    const compressedOpportunity = buildCompressedOpportunity({ ...enrichedItem, leadInsight })
    const commercialPressure = buildCommercialPressure({ ...enrichedItem, leadInsight, compressedOpportunity })
    const companyProfile = enrich ? await safeCompanyProfile(enrichedItem) : null
    leadPacks.push(buildLeadPack({
      item: enrichedItem,
      leadInsight,
      compressedOpportunity,
      commercialPressure,
      companyProfile,
      sourceRun: path.relative(process.cwd(), runDir) || runDir,
      sourceQuery: sourceQuery || inferSourceQuery(enrichedItem, artifacts.summary),
      lastCheckedAt,
    }))
  }

  leadPacks.sort(compareLeadPacks)
  leadPacks.forEach((pack, index) => { pack.rank = index + 1 })

  const jsonPath = path.join(outputDir, 'lead-packs.json')
  const csvPath = path.join(outputDir, 'lead-packs.csv')
  const summaryOutPath = path.join(outputDir, 'summary.json')
  const summary = buildSummary({ leadPacks, artifacts, outputDir, sourceQuery, lastCheckedAt, enrichCompanyProfile: enrich })
  fs.writeFileSync(jsonPath, JSON.stringify(leadPacks, null, 2))
  fs.writeFileSync(csvPath, buildLeadPacksCsv(leadPacks))
  fs.writeFileSync(summaryOutPath, JSON.stringify(summary, null, 2))
  return { outputDir, leadPacksPath: jsonPath, csvPath, summaryPath: summaryOutPath, totalLeads: leadPacks.length }
}

function buildLeadPack({ item, leadInsight, compressedOpportunity, commercialPressure, companyProfile, sourceRun, sourceQuery, lastCheckedAt }) {
  const meta = item.sourceMetadata || {}
  const ctaProfile = item.pageSignals?.contactCtaProfile || null
  const emails = item.emails || []
  const phones = item.phones || []
  const company = companyFromProfile(item, companyProfile)
  return {
    rank: Number(item.rank || 0),
    callPriority: commercialPressure.callPriority || 'medium',
    leadClass: compressedOpportunity.leadClass || null,
    opportunityType: compressedOpportunity.type || null,
    company,
    contact: {
      website: item.url || null,
      phone: meta.phone || phones[0] || null,
      email: emails[0] || null,
      address: meta.address || item.location || null,
      city: extractCity(meta.address || item.location || ''),
    },
    places: {
      provider: meta.provenance?.provider || meta.sources?.[0]?.provider || meta.provider || null,
      placeId: meta.placeId || null,
      rating: numberOrNull(meta.rating),
      reviewCount: numberOrNull(meta.reviewCount),
    },
    website: {
      auditStatus: item.status || null,
      topEvidence: topEvidence(item),
      contactability: contactabilitySummary(item, ctaProfile),
      ctaProfile,
    },
    ranking: {
      whyRanked: whyRanked({ item, leadInsight, compressedOpportunity, commercialPressure, companyProfile }),
      caution: cautionNotes({ item, compressedOpportunity, commercialPressure, companyProfile }),
      painScore: numberOrNull(commercialPressure.painScore),
      buyingLikelihood: numberOrNull(commercialPressure.buyingLikelihood),
      salesEase: commercialPressure.salesEase || null,
    },
    economy: {
      status: 'not_enabled',
      source: null,
      revenue: null,
      profit: null,
      employees: null,
    },
    sourceQuality: sourceQuality(item),
    meta: {
      sourceQuery: sourceQuery || null,
      sourceRun,
      lastCheckedAt,
    },
  }
}

function companyFromProfile(item, profile) {
  const meta = item.sourceMetadata || {}
  const metadataConfirmed = Boolean(meta.organizationNumber)
  const metadataCandidate = Boolean(meta.candidateOrganizationNumber)
  const profileConfirmed = isConfirmedProfile(profile)
  return {
    displayName: item.name || meta.businessName || null,
    legalName: profile?.legalName || meta.legalName || null,
    candidateLegalName: profile?.candidateLegalName || meta.candidateLegalName || meta.legalName || null,
    organizationNumber: profileConfirmed ? profile.organizationNumber : (metadataConfirmed ? meta.organizationNumber : null),
    candidateOrganizationNumber: profile?.candidateOrganizationNumber || meta.candidateOrganizationNumber || meta.organizationNumber || null,
    organizationForm: profile?.organizationForm || meta.organizationForm || null,
    registeredAddress: profile?.registeredAddress || meta.registeredAddress || null,
    municipality: profile?.municipality || meta.municipality || null,
    unitType: profile?.unitType || meta.unitType || null,
    naceCode: profile?.naceCode || meta.naceCode || null,
    naceDescription: profile?.naceDescription || meta.naceDescription || null,
    employees: profile?.employees ?? numberOrNull(meta.employees),
    registrationDate: profile?.registrationDate || meta.registrationDate || null,
    activeStatus: profile?.activeStatus || meta.activeStatus || null,
    source: profile?.source || meta.identitySource || null,
    sourceUrl: profile?.sourceUrl || meta.sourceUrl || null,
    errorType: profile?.errorType || null,
    matchStatus: profile?.matchStatus || (metadataConfirmed ? 'exact_match' : (metadataCandidate ? 'manual_verify' : null)),
    matchConfidence: profile?.matchConfidence ?? (metadataConfirmed ? 1 : (metadataCandidate ? 0.7 : null)),
    matchReasons: normalizeArray(profile?.matchReasons || (metadataConfirmed ? 'official_registry_identity' : '')),
    warnings: normalizeArray(profile?.warnings),
    candidates: Array.isArray(profile?.candidates) ? profile.candidates : metadataCandidates(meta),
  }
}

function metadataCandidates(meta = {}) {
  if (!meta.candidateOrganizationNumber && !meta.organizationNumber) return []
  return [{
    candidateOrganizationNumber: meta.candidateOrganizationNumber || meta.organizationNumber,
    candidateLegalName: meta.candidateLegalName || meta.legalName || null,
    organizationForm: meta.organizationForm || null,
    municipality: meta.municipality || null,
    address: meta.registeredAddress || meta.address || null,
    unitType: meta.unitType || null,
    score: meta.organizationNumber ? 1 : 0.7,
    matchReasons: meta.organizationNumber ? ['official_registry_identity'] : ['candidate_registry_identity'],
    warnings: [],
  }]
}

function isConfirmedProfile(profile) {
  return Boolean(profile && ['exact_match', 'strong_match'].includes(profile.matchStatus) && profile.organizationNumber)
}

async function safeCompanyProfile(item) {
  try {
    return await enrichCompanyProfile({
      companyName: item.name,
      website: item.url,
      phone: item.sourceMetadata?.phone || item.phones?.[0],
      email: item.emails?.[0],
      address: item.sourceMetadata?.address || item.location,
      city: extractCity(item.sourceMetadata?.address || item.location || ''),
      industry: item.sourceMetadata?.industry || item.industry,
    }, {
      fileCache: true,
    })
  } catch (error) {
    return {
      organizationNumber: null,
      candidateOrganizationNumber: null,
      legalName: null,
      organizationForm: null,
      matchStatus: 'error',
      matchConfidence: 0,
      warnings: [error && error.message ? error.message : 'company_profile_error'],
    }
  }
}

function buildLeadPacksCsv(leadPacks) {
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
    matchWarnings: pack.company.warnings.join('|'),
    website: pack.contact.website,
    phone: pack.contact.phone,
    email: pack.contact.email,
    address: pack.contact.address,
    city: pack.contact.city,
    placeId: pack.places.placeId,
    rating: pack.places.rating,
    reviewCount: pack.places.reviewCount,
    auditStatus: pack.website.auditStatus,
    topEvidence: pack.website.topEvidence.join('|'),
    contactability: pack.website.contactability,
    whyRanked: pack.ranking.whyRanked.join('|'),
    caution: pack.ranking.caution.join('|'),
    painScore: pack.ranking.painScore,
    buyingLikelihood: pack.ranking.buyingLikelihood,
    salesEase: pack.ranking.salesEase,
    economyStatus: pack.economy.status,
    identitySource: pack.sourceQuality.identitySource,
    presenceSource: pack.sourceQuality.presenceSource,
    searchScope: pack.sourceQuality.searchScope,
    requestedMaxResults: pack.sourceQuality.requestedMaxResults,
    includedLeadCount: pack.sourceQuality.includedLeadCount,
    lowSupply: pack.sourceQuality.lowSupply,
    fallbackAvailable: pack.sourceQuality.fallbackAvailable,
    recommendedExpansion: pack.sourceQuality.recommendedExpansion,
    requestedLocation: pack.sourceQuality.requestedLocation,
    candidateLocation: pack.sourceQuality.candidateLocation,
    locationMatchStatus: pack.sourceQuality.locationMatchStatus,
    locationConfidence: pack.sourceQuality.locationConfidence,
    distanceKm: pack.sourceQuality.distanceKm,
    locationWarnings: pack.sourceQuality.locationWarnings.join('|'),
    fallbackUsed: pack.sourceQuality.fallbackUsed,
    sourceQuery: pack.meta.sourceQuery,
    sourceRun: pack.meta.sourceRun,
    lastCheckedAt: pack.meta.lastCheckedAt,
  }))
  return renderCsv(rows, LEAD_PACK_COLUMNS)
}

function sourceQuality(item) {
  const quality = item.sourceMetadata?.locationQuality || {}
  const warnings = normalizeArray(item.sourceMetadata?.locationWarnings || quality.locationWarnings)
  return {
    searchScope: item.sourceMetadata?.searchScope || quality.searchScope || 'strict',
    requestedMaxResults: numberOrNull(item.sourceMetadata?.requestedMaxResults),
    includedLeadCount: numberOrNull(item.sourceMetadata?.includedLeadCount),
    lowSupply: Boolean(item.sourceMetadata?.lowSupply),
    fallbackAvailable: Boolean(item.sourceMetadata?.fallbackAvailable),
    recommendedExpansion: item.sourceMetadata?.recommendedExpansion || null,
    requestedLocation: item.sourceMetadata?.requestedLocation || quality.requestedLocation || null,
    candidateLocation: item.sourceMetadata?.candidateLocation || quality.candidateLocation || item.sourceMetadata?.address || item.location || null,
    locationMatchStatus: item.sourceMetadata?.locationMatchStatus || quality.locationMatchStatus || 'unknown',
    locationConfidence: numberOrNull(item.sourceMetadata?.locationConfidence ?? quality.locationConfidence),
    distanceKm: numberOrNull(item.sourceMetadata?.distanceKm ?? quality.distanceKm),
    locationWarnings: warnings,
    fallbackUsed: Boolean(item.sourceMetadata?.fallbackUsed || quality.fallbackUsed),
    discoveryQuality: item.sourceMetadata?.discoveryQuality || null,
    discoveryConfidence: item.sourceMetadata?.discoveryConfidence || item.sourceMetadata?.discoveryQuality?.level || null,
    identitySource: item.sourceMetadata?.identitySource || null,
    presenceSource: item.sourceMetadata?.presenceSource || item.sourceMetadata?.provenance?.provider || null,
  }
}

function buildSummary({ leadPacks, artifacts, outputDir, sourceQuery, lastCheckedAt, enrichCompanyProfile }) {
  const priorityCounts = leadPacks.reduce((acc, lead) => {
    acc[lead.callPriority] = (acc[lead.callPriority] || 0) + 1
    return acc
  }, {})
  return {
    runId: artifacts.summary.runId || path.basename(artifacts.runDir),
    sourceRun: artifacts.runDir,
    outputDir,
    sourceQuery: sourceQuery || null,
    generatedAt: lastCheckedAt,
    totalLeads: leadPacks.length,
    priorityCounts,
    enrichCompanyProfile: Boolean(enrichCompanyProfile),
    economyStatus: 'not_enabled',
    searchScope: leadPacks[0]?.sourceQuality.searchScope || 'strict',
    requestedMaxResults: leadPacks[0]?.sourceQuality.requestedMaxResults ?? null,
    includedLeadCount: leadPacks[0]?.sourceQuality.includedLeadCount ?? leadPacks.length,
    lowSupply: Boolean(leadPacks[0]?.sourceQuality.lowSupply),
    fallbackAvailable: Boolean(leadPacks[0]?.sourceQuality.fallbackAvailable),
    fallbackUsed: leadPacks.some((lead) => lead.sourceQuality.fallbackUsed),
    recommendedExpansion: leadPacks[0]?.sourceQuality.recommendedExpansion || null,
    locationQualityCounts: leadPacks.reduce((acc, lead) => { const key = lead.sourceQuality.locationMatchStatus || 'unknown'; acc[key] = (acc[key] || 0) + 1; return acc }, {}),
    discoveryConfidenceCounts: leadPacks.reduce((acc, lead) => { const key = lead.sourceQuality.discoveryConfidence || lead.sourceQuality.discoveryQuality?.level || 'unknown'; acc[key] = (acc[key] || 0) + 1; return acc }, {}),
    productBoundary: 'machine_generates_ranked_lead_packs_seller_owns_angle_wording_outreach_timing_relationship_close',
  }
}

function topEvidence(item) {
  return (item.issues || []).slice(0, 3)
}

function contactabilitySummary(item, ctaProfile) {
  if (ctaProfile?.hasStrongPrimaryCta || ctaProfile?.hasVisibleContactPath) return 'strong'
  if ((item.emails || []).length && (item.phones || []).length) return 'email_and_phone_found'
  if ((item.phones || []).length) return 'phone_found'
  if ((item.emails || []).length) return 'email_found'
  return 'unknown'
}

function whyRanked({ item, leadInsight, compressedOpportunity, commercialPressure, companyProfile }) {
  const reasons = []
  if (commercialPressure.callPriority) reasons.push(`callPriority:${commercialPressure.callPriority}`)
  if (compressedOpportunity.leadClass) reasons.push(`leadClass:${compressedOpportunity.leadClass}`)
  if (compressedOpportunity.type) reasons.push(`opportunityType:${compressedOpportunity.type}`)
  for (const reason of commercialPressure.commercialPressureReasons || []) reasons.push(reason)
  if (companyProfile?.matchStatus) reasons.push(`companyProfile:${companyProfile.matchStatus}`)
  if (leadInsight?.mainProblem) reasons.push(leadInsight.mainProblem)
  return unique(reasons).slice(0, 8)
}

function cautionNotes({ item, compressedOpportunity, commercialPressure, companyProfile }) {
  const caution = ['Seller owns angle and wording; do not use generated scripts.']
  if (companyProfile?.matchStatus && !['exact_match', 'strong_match'].includes(companyProfile.matchStatus)) caution.push('Company identity requires manual verification before using org.nr.')
  if (companyProfile?.warnings?.length) caution.push(`Company profile warnings: ${companyProfile.warnings.join('|')}`)
  if ((item.issueCategories?.technical || 0) > 0 || (item.performance?.failedRequestCount || 0) > 0) caution.push('Verify technical findings before overstating them.')
  if (compressedOpportunity.leadClass === 'campaign_optimization') caution.push('Optimization lead; do not frame as broken website without manual review.')
  if (commercialPressure.callPriority === 'medium') caution.push('Shortlist lead; validate pain before treating as call-first.')
  return unique(caution).slice(0, 6)
}

function compareLeadPacks(a, b) {
  const priority = { high: 0, medium: 1, verify: 2, low: 3 }
  const pa = priority[a.callPriority] ?? 9
  const pb = priority[b.callPriority] ?? 9
  if (pa !== pb) return pa - pb
  return (b.ranking.painScore || 0) - (a.ranking.painScore || 0)
}

function inferSourceQuery(item, summary) {
  return item.sourceMetadata?.provenance?.searchQuery || item.sourceMetadata?.sources?.[0]?.searchQuery || item.sourceMetadata?.source || summary?.runId || null
}

function extractCity(address) {
  const text = String(address || '').trim()
  if (!text) return null
  const parts = text.split(',').map((part) => part.trim()).filter(Boolean)
  const last = parts[parts.length - 1] || text
  return last.replace(/^\d{4}\s+/, '') || null
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  if (!value) return []
  return String(value).split('|').map((item) => item.trim()).filter(Boolean)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function parseBoolean(value) {
  if (value === true) return true
  return ['1', 'true', 'yes'].includes(String(value || '').toLowerCase())
}

module.exports = { runLeadPack, buildLeadPack, buildLeadPacksCsv, LEAD_PACK_COLUMNS }
