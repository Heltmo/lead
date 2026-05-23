const fs = require('fs')
const path = require('path')
const { readRunArtifacts } = require('./readers/runArtifacts')
const { buildFilterConfig } = require('./filters/filterConfig')
const { buildSelectedLeadsCsv } = require('./exports/selectedLeadsCsv')
const { buildCrmShortlistedCsv } = require('./exports/crmShortlistedCsv')
const { loadOrCreateReviewStatus } = require('./state/reviewStatus')
const { renderIndexHtml } = require('./templates/indexHtml')

function generateReviewWorkspace(options) {
  if (!options || !options.summaryPath) throw new Error('summaryPath is required')
  const artifacts = readRunArtifacts({ summaryPath: options.summaryPath, leadsCsvPath: options.leadsCsvPath })
  const outDir = path.resolve(options.outDir || path.join(artifacts.runDir, 'review-workspace'))
  fs.mkdirSync(outDir, { recursive: true })
  const items = artifacts.items.map((item) => ({ ...item, relativeLinks: relativizeLinks(item.links, outDir) }))
  const statusPath = path.join(outDir, 'review-status.json')
  const reviewStatus = loadOrCreateReviewStatus(statusPath, items)
  const model = { runId: artifacts.summary.runId, items, reviewStatus, filters: buildFilterConfig(items, reviewStatus) }
  const indexPath = path.join(outDir, 'index.html')
  const selectedLeadsPath = path.join(outDir, 'selected-leads.csv')
  const crmShortlistedPath = path.join(outDir, 'crm-shortlisted-leads.csv')
  fs.writeFileSync(indexPath, renderIndexHtml(model))
  fs.writeFileSync(selectedLeadsPath, buildSelectedLeadsCsv(items, reviewStatus))
  fs.writeFileSync(crmShortlistedPath, buildCrmShortlistedCsv(items, reviewStatus))
  return { indexPath, reviewStatusPath: statusPath, selectedLeadsPath, crmShortlistedPath, totalItems: items.length }
}

function relativizeLinks(links, outDir) {
  return Object.fromEntries(Object.entries(links).map(([key, value]) => [key, value ? path.relative(outDir, value).replace(/\\/g, '/') : '']))
}

module.exports = { generateReviewWorkspace }
