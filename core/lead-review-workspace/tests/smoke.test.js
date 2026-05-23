const fs = require('fs')
const path = require('path')
const { generateReviewWorkspace } = require('../generateReviewWorkspace')
const { generateReportSurfaces } = require('../../website-audit-agent/reports/reportSurfaces')

const root = path.join(__dirname, 'workspace-smoke')
fs.rmSync(root, { recursive: true, force: true })
fs.mkdirSync(path.join(root, 'items', 'url-0001', 'screenshots'), { recursive: true })
const reportPath = path.join(root, 'items', 'url-0001', 'report.json')
fs.writeFileSync(reportPath, JSON.stringify({
  url: 'https://example.com',
  status: 'passed',
  signals: { title: 'Example' },
  technology: { technologies: ['WordPress'] },
  issueClassification: { counts: { seo: 1, conversion: 1 }, severityCounts: { high: 1 } },
  performance: { responseStatus: 200, domContentLoadedMs: 100, loadMs: 200, failedRequests: [], consoleErrors: [] },
  screenshots: { desktop: path.join(root, 'items', 'url-0001', 'screenshots', 'desktop.png'), mobile: path.join(root, 'items', 'url-0001', 'screenshots', 'mobile.png') },
  leadQuality: { score: 64, issues: ['Missing meta description'] },
  errors: [],
}, null, 2))
const summaryPath = path.join(root, 'summary.json')
fs.writeFileSync(summaryPath, JSON.stringify({
  runId: 'run-smoke',
  pipeline: 'website-audit-queue',
  status: 'completed',
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:00:00.000Z',
  totalItems: 1,
  completedItems: 1,
  failedItems: 0,
  pendingItems: 0,
  results: [{ id: 'url-0001', url: 'https://example.com', status: 'completed', attempts: 1, reportPath, errors: [] }],
}, null, 2))
generateReportSurfaces(summaryPath, { outDir: path.join(root, 'report-surfaces') })
const result = generateReviewWorkspace({ summaryPath })
assert(fs.existsSync(result.indexPath), 'index.html should exist')
assert(fs.existsSync(result.reviewStatusPath), 'review-status.json should exist')
assert(fs.existsSync(result.selectedLeadsPath), 'selected-leads.csv should exist')
const html = fs.readFileSync(result.indexPath, 'utf8')
const status = JSON.parse(fs.readFileSync(result.reviewStatusPath, 'utf8'))
const selected = fs.readFileSync(result.selectedLeadsPath, 'utf8')
assert(html.includes('Lead Review Workspace'), 'workspace title should exist')
assert(status.items['url-0001'].status === 'unreviewed', 'default status should be unreviewed')
assert(selected.startsWith('id,reviewStatus,notes'), 'selected CSV should have stable header')
assert(!selected.includes('https://example.com'), 'unreviewed leads should not export as selected')
status.items['url-0001'] = { status: 'shortlisted', notes: 'Strong redesign opportunity' }
fs.writeFileSync(result.reviewStatusPath, `${JSON.stringify(status, null, 2)}\n`)
const regenerated = generateReviewWorkspace({ summaryPath })
const selectedAfter = fs.readFileSync(regenerated.selectedLeadsPath, 'utf8')
assert(selectedAfter.includes('https://example.com'), 'shortlisted lead should export')
assert(selectedAfter.includes('Strong redesign opportunity'), 'shortlist notes should export')

function assert(condition, message) { if (!condition) throw new Error(message) }
