#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { extractLeadsFromSpreadsheet } = require('../extractors/spreadsheet')
const { auditWebsite } = require('../audits/auditWebsite')
const { createBatchReport } = require('../reports/batchReport')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const sourceFile = args.file || args._[0]
  if (!sourceFile) throw new Error('Usage: node cli/audit-batch.js <leads.xlsx|leads.csv> [--out reports/batch.json] [--limit 10] [--dry-run true]')
  const outPath = path.resolve(args.out || 'reports/batch-report.json')
  const screenshotRoot = path.resolve(args.screenshots || 'screenshots/batch')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.mkdirSync(screenshotRoot, { recursive: true })
  const limit = args.limit ? Number(args.limit) : Infinity
  const dryRun = args['dry-run'] === 'true' || args['dry-run'] === true
  const leads = (await extractLeadsFromSpreadsheet(path.resolve(sourceFile), { sheet: args.sheet })).slice(0, limit)
  const startedAt = new Date().toISOString()
  const results = []

  for (const lead of leads) {
    if (dryRun) {
      results.push({ name: lead.name, url: lead.url, sourceRow: lead.sourceRow, sheetName: lead.sheetName, status: 'pending', title: '', emails: [], phones: [], accessibilityIssues: [], technologies: [], issueCategories: {}, issueSeverities: {}, performance: null, leadScore: null, screenshots: {}, issues: ['Dry run only'] })
      continue
    }
    const slug = slugify(`${lead.name || 'lead'}-${lead.sourceRow}`)
    const report = await auditWebsite(lead.url, { screenshotDir: path.join(screenshotRoot, slug) })
    results.push(toBatchResult(lead, report))
  }

  const batchReport = createBatchReport({ sourceFile: path.resolve(sourceFile), startedAt, results })
  fs.writeFileSync(outPath, `${JSON.stringify(batchReport, null, 2)}\n`)
  console.log(JSON.stringify({ report: outPath, totalSites: batchReport.totalSites, successfulAudits: batchReport.successfulAudits, failedAudits: batchReport.failedAudits, pendingAudits: batchReport.pendingAudits }, null, 2))
}

function toBatchResult(lead, report) {
  return {
    name: lead.name,
    url: report.url,
    sourceRow: lead.sourceRow,
    sheetName: lead.sheetName,
    status: report.status,
    title: report.signals?.title ?? '',
    metaDescription: report.signals?.metaDescription ?? '',
    emails: report.signals?.emails ?? [],
    phones: report.signals?.phones ?? [],
    ctas: report.signals?.ctas ?? [],
    accessibilityIssues: report.accessibility?.violations ?? [],
    technologies: report.technology?.technologies ?? [],
    issueCategories: report.issueClassification?.counts ?? {},
    issueSeverities: report.issueClassification?.severityCounts ?? {},
    performance: summarizePerformance(report.performance),
    leadScore: report.leadQuality?.score ?? 0,
    screenshots: report.screenshots ?? {},
    issues: report.leadQuality?.issues ?? report.errors.map((error) => error.message),
    errors: report.errors,
  }
}

function summarizePerformance(performance) {
  if (!performance) return null
  return {
    responseStatus: performance.responseStatus,
    domContentLoadedMs: performance.domContentLoadedMs,
    loadMs: performance.loadMs,
    transferSizeBytes: performance.transferSizeBytes,
    imageCount: performance.imageCount,
    failedRequestCount: performance.failedRequests.length,
    consoleErrorCount: performance.consoleErrors.length,
  }
}

function slugify(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'lead' }

function parseArgs(args) {
  const parsed = { _: [] }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--')) { parsed[arg.slice(2)] = args[i + 1] ?? true; i += 1 } else { parsed._.push(arg) }
  }
  return parsed
}

main().catch((error) => { console.error(error); process.exit(1) })
