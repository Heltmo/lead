const fs = require('fs')
const path = require('path')
const { parseCsv } = require('./csv')

function readRunArtifacts({ summaryPath, leadsCsvPath }) {
  const resolvedSummary = path.resolve(summaryPath)
  const resolvedLeads = path.resolve(leadsCsvPath || path.join(path.dirname(resolvedSummary), 'report-surfaces', 'leads.csv'))
  const runDir = path.dirname(resolvedSummary)
  const summary = JSON.parse(fs.readFileSync(resolvedSummary, 'utf8'))
  const leads = parseCsv(fs.readFileSync(resolvedLeads, 'utf8'))
  const summaryByUrl = new Map((summary.results || []).map((item) => [item.url, item]))
  const items = leads.map((lead, index) => normalizeLead(lead, summaryByUrl.get(lead.url), { index, runDir, leadsDir: path.dirname(resolvedLeads) }))
  return { runDir, summaryPath: resolvedSummary, leadsCsvPath: resolvedLeads, summary, items }
}

function normalizeLead(lead, summaryItem, context) {
  const id = summaryItem?.id || `lead-${String(context.index + 1).padStart(4, '0')}`
  const jsonArtifact = resolveArtifact(lead.jsonArtifact || summaryItem?.reportPath, context.leadsDir)
  const report = jsonArtifact && fs.existsSync(jsonArtifact) ? JSON.parse(fs.readFileSync(jsonArtifact, 'utf8')) : null
  return {
    id,
    rank: Number(lead.rank || context.index + 1),
    name: lead.name || summaryItem?.businessName || summaryItem?.sourceMetadata?.businessName || report?.sourceMetadata?.businessName || '',
    url: lead.url || summaryItem?.url || report?.url || '',
    status: lead.status || summaryItem?.status || report?.status || '',
    leadScore: Number(lead.leadScore || report?.leadQuality?.score || 0),
    title: lead.title || lead.pageTitle || report?.signals?.title || '',
    pageTitle: lead.pageTitle || lead.title || report?.signals?.title || '',
    sourceMetadata: summaryItem?.sourceMetadata || report?.sourceMetadata || {},
    technologies: splitList(lead.technologies),
    issueCategories: parseCounts(lead.issueCategories),
    issues: splitList(lead.issues),
    opportunityBullets: {
      painPointBullets: splitList(lead.painPointBullets),
      suggestedOffer: lead.suggestedOffer || '',
      outreachOpener: lead.outreachOpener || '',
      whyThisLeadMatters: lead.whyThisLeadMatters || '',
    },
    emails: splitList((report?.signals?.emails || []).join('|')),
    phones: splitList((report?.signals?.phones || []).join('|')),
    performance: {
      responseStatus: Number(lead.responseStatus || report?.performance?.responseStatus || 0),
      failedRequestCount: Number(lead.failedRequestCount || report?.performance?.failedRequests?.length || 0),
      consoleErrorCount: Number(lead.consoleErrorCount || report?.performance?.consoleErrors?.length || 0),
    },
    links: {
      htmlReport: path.join(context.runDir, 'report-surfaces', 'report.html'),
      jsonArtifact,
      desktopScreenshot: resolveArtifact(lead.desktopScreenshot || report?.screenshots?.desktop, context.leadsDir),
      mobileScreenshot: resolveArtifact(lead.mobileScreenshot || report?.screenshots?.mobile, context.leadsDir),
    },
  }
}

function resolveArtifact(value, baseDir) {
  if (!value) return ''
  return path.isAbsolute(value) ? value : path.resolve(baseDir, value)
}

function splitList(value) {
  return String(value || '').split('|').map((item) => item.trim()).filter(Boolean)
}

function parseCounts(value) {
  const counts = {}
  for (const part of String(value || '').split('|').join(',').split(',')) {
    const [key, count] = part.split(':').map((item) => item.trim())
    if (key) counts[key] = Number(count || 0)
  }
  return counts
}

module.exports = { readRunArtifacts }
