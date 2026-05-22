#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { auditWebsite } = require('../audits/auditWebsite')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const url = args.url || args._[0]
  if (!url) throw new Error('Usage: node cli/audit-url.js <url> [--out reports/report.json]')
  const outPath = path.resolve(args.out || 'reports/latest-report.json')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  const report = await auditWebsite(url, { screenshotDir: args.screenshots || 'screenshots/latest' })
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ status: report.status, report: outPath, score: report.leadQuality?.score ?? null }, null, 2))
  if (report.status !== 'passed') process.exitCode = 1
}

function parseArgs(args) {
  const parsed = { _: [] }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--')) { parsed[arg.slice(2)] = args[i + 1]; i += 1 } else { parsed._.push(arg) }
  }
  return parsed
}

main().catch((error) => { console.error(error); process.exit(1) })
