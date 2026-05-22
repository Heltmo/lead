const path = require('path')
const { auditWebsite } = require('../../website-audit-agent/audits/auditWebsite')
const { writeJson } = require('../state/store')

async function runWebsiteAuditTask(item, runDir) {
  const itemDir = path.join(runDir, 'items', item.id)
  const reportPath = path.join(itemDir, 'report.json')
  const screenshotDir = path.join(itemDir, 'screenshots')
  const report = await auditWebsite(item.url, { screenshotDir })
  writeJson(reportPath, report)
  return { report, reportPath }
}

module.exports = { runWebsiteAuditTask }
