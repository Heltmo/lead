#!/usr/bin/env node
const { discoverLocalBusinesses, writeDiscoveryOutputs } = require('../discoverLocalBusinesses')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const query = args.query || args._.join(' ')
  if (!query && (!args.industry || !args.location)) throw new Error('Usage: node cli/discover-local-businesses.js --query "dentists in Halden" --source sample.json [--source extra.csv] [--out reports/lead-candidates.json]')
  if (!args.source) throw new Error('Deterministic discovery requires at least one --source <json|csv|txt|html>')
  const report = await discoverLocalBusinesses({
    query,
    industry: args.industry,
    location: args.location,
    sourceFiles: args.source,
    sourceName: args['source-name'],
    validate: args.validate !== 'false',
    timeoutMs: args.timeout ? Number(args.timeout) : 5000,
  })
  const outputs = writeDiscoveryOutputs(report, { outPath: args.out, summaryPath: args.summary, handoffPath: args.handoff })
  console.log(JSON.stringify({ ...outputs, totalCandidates: report.totalCandidates, reachableCandidates: report.reachableCandidates, unreachableCandidates: report.unreachableCandidates }, null, 2))
}

function parseArgs(args) {
  const parsed = { _: [] }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const value = args[i + 1] ?? true
      if (parsed[key] == null) parsed[key] = value
      else parsed[key] = Array.isArray(parsed[key]) ? parsed[key].concat(value) : [parsed[key], value]
      i += 1
    } else {
      parsed._.push(arg)
    }
  }
  return parsed
}

main().catch((error) => { console.error(error); process.exit(1) })
