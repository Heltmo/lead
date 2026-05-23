#!/usr/bin/env node
const { generateReviewWorkspace } = require('../generateReviewWorkspace')

function main() {
  const args = parseArgs(process.argv.slice(2))
  const summaryPath = args.summary || args._[0]
  if (!summaryPath) throw new Error('Usage: node cli/generate-review-workspace.js <summary.json> [--leads report-surfaces/leads.csv] [--out review-workspace]')
  const result = generateReviewWorkspace({ summaryPath, leadsCsvPath: args.leads, outDir: args.out })
  console.log(JSON.stringify(result, null, 2))
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
