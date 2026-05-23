#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { readRunArtifacts } = require('../readers/runArtifacts')
const { mergeReviewStatus } = require('../state/reviewStatus')
const { buildCrmShortlistedCsv } = require('../exports/crmShortlistedCsv')

function main() {
  const args = parseArgs(process.argv.slice(2))
  const summaryPath = args.summary || args._[0]
  if (!summaryPath) throw new Error('Usage: node cli/export-crm-shortlist.js <summary.json> [--status review-workspace/review-status.json] [--leads report-surfaces/leads.csv] [--out review-workspace/crm-shortlisted-leads.csv]')
  const artifacts = readRunArtifacts({ summaryPath, leadsCsvPath: args.leads })
  const statusPath = path.resolve(args.status || path.join(artifacts.runDir, 'review-workspace', 'review-status.json'))
  const outPath = path.resolve(args.out || path.join(artifacts.runDir, 'review-workspace', 'crm-shortlisted-leads.csv'))
  const reviewStatus = mergeReviewStatus(JSON.parse(fs.readFileSync(statusPath, 'utf8')), artifacts.items)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, buildCrmShortlistedCsv(artifacts.items, reviewStatus))
  console.log(JSON.stringify({ crmShortlistedPath: outPath, shortlistedItems: Object.values(reviewStatus.items).filter((item) => item.status === 'shortlisted').length }, null, 2))
}

function parseArgs(args) {
  const parsed = { _: [] }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--')) { parsed[arg.slice(2)] = args[i + 1] ?? true; i += 1 } else { parsed._.push(arg) }
  }
  return parsed
}

try { main() } catch (error) { console.error(error); process.exit(1) }
