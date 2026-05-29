const path = require('path')
const { auditWebsite } = require('../../website-audit-agent/audits/auditWebsite')
const { writeJson } = require('../state/store')

async function runWebsiteAuditTask(item, runDir) {
  const itemDir = path.join(runDir, 'items', item.id)
  const reportPath = path.join(itemDir, 'report.json')
  const screenshotDir = path.join(itemDir, 'screenshots')
  const report = await auditWebsite(item.url, { screenshotDir })
  const sourceMetadata = sourceMetadataFromItem(item)
  const enrichedReport = Object.keys(sourceMetadata).length ? { ...report, sourceMetadata } : report
  writeJson(reportPath, enrichedReport)
  return { report: enrichedReport, reportPath }
}

function sourceMetadataFromItem(item) {
  const metadata = {
    businessName: item.businessName || item.sourceMetadata?.businessName || '',
    source: item.source || item.sourceMetadata?.source || '',
    location: item.location || item.sourceMetadata?.location || '',
    industry: item.industry || item.sourceMetadata?.industry || '',
    confidence: item.confidence || item.sourceMetadata?.confidence || '',
    sources: item.sources || item.sourceMetadata?.sources || [],
    sourceType: item.sourceType || item.sourceMetadata?.sourceType || '',
    auditEligible: item.auditEligible ?? item.sourceMetadata?.auditEligible,
    auditExclusionReason: item.auditExclusionReason || item.sourceMetadata?.auditExclusionReason || '',
    provenance: item.provenance || item.sourceMetadata?.provenance || {},
    phone: item.phone || item.sourceMetadata?.phone || '',
    address: item.address || item.sourceMetadata?.address || '',
    placeId: item.placeId || item.sourceMetadata?.placeId || '',
    rating: item.rating || item.sourceMetadata?.rating || '',
    reviewCount: item.reviewCount || item.sourceMetadata?.reviewCount || '',
    businessStatus: item.businessStatus || item.sourceMetadata?.businessStatus || '',
    providerTypes: item.providerTypes || item.sourceMetadata?.providerTypes || [],
    searchScope: item.searchScope || item.sourceMetadata?.searchScope || '',
    requestedMaxResults: item.requestedMaxResults || item.sourceMetadata?.requestedMaxResults || '',
    includedLeadCount: item.includedLeadCount || item.sourceMetadata?.includedLeadCount || '',
    lowSupply: item.lowSupply ?? item.sourceMetadata?.lowSupply,
    fallbackAvailable: item.fallbackAvailable ?? item.sourceMetadata?.fallbackAvailable,
    recommendedExpansion: item.recommendedExpansion || item.sourceMetadata?.recommendedExpansion || '',
    requestedLocation: item.requestedLocation || item.sourceMetadata?.requestedLocation || '',
    candidateLocation: item.candidateLocation || item.sourceMetadata?.candidateLocation || '',
    candidateCity: item.candidateCity || item.sourceMetadata?.candidateCity || '',
    locationMatchStatus: item.locationMatchStatus || item.sourceMetadata?.locationMatchStatus || '',
    locationConfidence: item.locationConfidence || item.sourceMetadata?.locationConfidence || '',
    distanceKm: item.distanceKm || item.sourceMetadata?.distanceKm || '',
    locationWarnings: item.locationWarnings || item.sourceMetadata?.locationWarnings || [],
    fallbackUsed: item.fallbackUsed ?? item.sourceMetadata?.fallbackUsed,
    locationQuality: item.locationQuality || item.sourceMetadata?.locationQuality || null,
    discoveryQuality: item.discoveryQuality || item.sourceMetadata?.discoveryQuality || null,
    discoveryConfidence: item.discoveryConfidence || item.sourceMetadata?.discoveryConfidence || '',
    identitySource: item.identitySource || item.sourceMetadata?.identitySource || '',
    presenceSource: item.presenceSource || item.sourceMetadata?.presenceSource || '',
    organizationNumber: item.organizationNumber || item.sourceMetadata?.organizationNumber || '',
    candidateOrganizationNumber: item.candidateOrganizationNumber || item.sourceMetadata?.candidateOrganizationNumber || '',
    legalName: item.legalName || item.sourceMetadata?.legalName || '',
    candidateLegalName: item.candidateLegalName || item.sourceMetadata?.candidateLegalName || '',
    organizationForm: item.organizationForm || item.sourceMetadata?.organizationForm || '',
    registeredAddress: item.registeredAddress || item.sourceMetadata?.registeredAddress || '',
    municipality: item.municipality || item.sourceMetadata?.municipality || '',
    unitType: item.unitType || item.sourceMetadata?.unitType || '',
    naceCode: item.naceCode || item.sourceMetadata?.naceCode || '',
    naceDescription: item.naceDescription || item.sourceMetadata?.naceDescription || '',
    employees: item.employees || item.sourceMetadata?.employees || '',
    registrationDate: item.registrationDate || item.sourceMetadata?.registrationDate || '',
    activeStatus: item.activeStatus || item.sourceMetadata?.activeStatus || '',
    sourceUrl: item.sourceUrl || item.sourceMetadata?.sourceUrl || '',
  }
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => hasMetadataValue(value)))
}

function hasMetadataValue(value) {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return value === false || Boolean(value)
}

module.exports = { runWebsiteAuditTask, sourceMetadataFromItem }
