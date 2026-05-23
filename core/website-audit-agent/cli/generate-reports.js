#!/usr/bin/env node
const { generateReportSurfaces } = require('../reports/reportSurfaces')

function main() {
  const args = parseArgs(process.argv.slice(2))
  const input = args.input || args._[0]
  if (!input) throw new Error('Usage: node cli/generate-reports.js <report.json|summary.json> [--out reports/surfaces] [--title "Audit Report"]')
  const result = generateReportSurfaces(input, { outDir: args.out, title: args.title })
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
