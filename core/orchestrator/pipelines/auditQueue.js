const path = require('path')
const { createQueue, nextRunnableItem } = require('../queue/urlQueue')
const { buildRunSummary } = require('../reports/runSummary')
const { ensureDir, exists, readJson, writeJson } = require('../state/store')
const { runWebsiteAuditTask } = require('../workers/websiteAuditWorker')
const { generateReportSurfaces } = require('../../website-audit-agent/reports/reportSurfaces')
const { generateReviewWorkspace } = require('../../lead-review-workspace/generateReviewWorkspace')

function createRun({ runId, urls, rootDir, maxRetries = 1 }) {
  const now = new Date().toISOString()
  return { runId, pipeline: 'website-audit-queue', status: 'pending', createdAt: now, updatedAt: now, rootDir, queue: createQueue(urls, { maxRetries }) }
}

async function runAuditQueue(options) {
  const rootDir = path.resolve(options.rootDir || 'runs')
  const runId = options.runId || createRunId()
  const runDir = path.join(rootDir, runId)
  const statePath = path.join(runDir, 'state.json')
  ensureDir(runDir)

  let run
  if (exists(statePath)) {
    run = readJson(statePath)
  } else {
    if (!options.urls || options.urls.length === 0) throw new Error('New runs require at least one URL')
    run = createRun({ runId, urls: options.urls, rootDir, maxRetries: options.maxRetries })
    persist(run, statePath, runDir)
  }

  run.status = 'running'
  persist(run, statePath, runDir)

  let item = nextRunnableItem(run.queue)
  while (item) {
    item.status = 'running'
    item.attempts += 1
    item.startedAt = new Date().toISOString()
    item.finishedAt = ''
    persist(run, statePath, runDir)

    try {
      const { report, reportPath } = await runWebsiteAuditTask(item, runDir)
      item.reportPath = reportPath
      item.status = report.status === 'passed' ? 'completed' : 'failed'
      if (report.status !== 'passed') item.errors.push(...report.errors.map((error) => error.message))
    } catch (error) {
      item.status = 'failed'
      item.errors.push(error.message)
    } finally {
      item.finishedAt = new Date().toISOString()
      run.updatedAt = item.finishedAt
      persist(run, statePath, runDir)
    }

    item = nextRunnableItem(run.queue)
  }

  run.status = run.queue.some((queueItem) => queueItem.status === 'failed') ? 'completed_with_failures' : 'completed'
  run.updatedAt = new Date().toISOString()
  persist(run, statePath, runDir)
  const summaryPath = path.join(runDir, 'summary.json')
  const reportSurfaces = generateReportSurfaces(summaryPath, { outDir: path.join(runDir, 'report-surfaces'), title: 'Website Audit Run Report' })
  const reviewWorkspace = generateReviewWorkspace({ summaryPath, leadsCsvPath: reportSurfaces.csvPath, outDir: path.join(runDir, 'review-workspace') })
  return { run, summary: buildRunSummary(run), statePath, summaryPath, reportSurfaces, reviewWorkspace }
}

function persist(run, statePath, runDir) {
  writeJson(statePath, run)
  writeJson(path.join(runDir, 'summary.json'), buildRunSummary(run))
}

function createRunId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  return `run-${stamp}`
}

module.exports = { createRun, runAuditQueue }
