#!/usr/bin/env node
const fs = require('fs')
const { runAuditQueue } = require('../pipelines/auditQueue')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const urls = collectUrls(args)
  const result = await runAuditQueue({ urls, runId: args['run-id'], rootDir: args.runs || 'runs', maxRetries: args.retries ? Number(args.retries) : 1 })
  console.log(JSON.stringify({ runId: result.run.runId, status: result.run.status, statePath: result.statePath, summaryPath: result.summaryPath, reportSurfaces: result.reportSurfaces, reviewWorkspace: result.reviewWorkspace, totalItems: result.summary.totalItems, completedItems: result.summary.completedItems, failedItems: result.summary.failedItems }, null, 2))
  if (result.summary.failedItems > 0) process.exitCode = 1
}

function collectUrls(args) {
  const values = []
  if (args.urls) values.push(...String(args.urls).split(',').map((url) => url.trim()).filter(Boolean))
  if (args.file) values.push(...fs.readFileSync(args.file, 'utf8').split(/\r?\n/).map((url) => url.trim()).filter(Boolean))
  values.push(...args._)
  return [...new Set(values)]
}

function parseArgs(args) {
  const parsed = { _: [] }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--')) { parsed[arg.slice(2)] = args[i + 1] ?? true; i += 1 } else { parsed._.push(arg) }
  }
  return parsed
}

main().catch((error) => { console.error(error); process.exit(1) })
