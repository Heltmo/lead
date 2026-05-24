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
  }
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => hasMetadataValue(value)))
}

function hasMetadataValue(value) {
  if (Array.isArray(value)) return value.length > 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return value === false || Boolean(value)
}

module.exports = { runWebsiteAuditTask, sourceMetadataFromItem }
