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
  }
  return Object.fromEntries(Object.entries(metadata).filter(([, value]) => Array.isArray(value) ? value.length > 0 : Boolean(value)))
}

module.exports = { runWebsiteAuditTask, sourceMetadataFromItem }
