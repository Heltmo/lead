#!/usr/bin/env node
const { discoverLocalBusinesses, writeDiscoveryOutputs } = require('../discoverLocalBusinesses')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const query = args.query || args._.join(' ')
  if (!query && (!args.industry || !args.location)) throw new Error('Usage: node cli/discover-local-businesses.js --query "dentists in Halden" [--source sample.json] [--provider brave] [--max-results 10] [--out reports/lead-candidates.json]')
  if (!args.source && !args.provider) throw new Error('Discovery requires at least one --source <json|csv|txt|html> or --provider <brave|mock>')
  const report = await discoverLocalBusinesses({
    query,
    industry: args.industry,
    location: args.location,
    sourceFiles: args.source,
    sourceName: args['source-name'],
    provider: args.provider,
    maxResults: args['max-results'] ? Number(args['max-results']) : undefined,
    maxProviderQueries: args['max-provider-queries'] ? Number(args['max-provider-queries']) : undefined,
    dryRun: args['dry-run'] === 'true' || args['dry-run'] === true,
    mockResultsPath: args['mock-results'],
    validate: args.validate !== 'false',
    timeoutMs: args.timeout ? Number(args.timeout) : 5000,
  })
  const outputs = writeDiscoveryOutputs(report, { outPath: args.out, summaryPath: args.summary, handoffPath: args.handoff, includeNonAuditTargets: args['include-non-audit-targets'] === 'true' })
  console.log(JSON.stringify({
    ...outputs,
    provider: report.provider,
    totalCandidates: report.totalCandidates,
    reachableCandidates: report.reachableCandidates,
    unreachableCandidates: report.unreachableCandidates,
  }, null, 2))
}

function parseArgs(args) {
  const parsed = { _: [] }
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = args[i + 1]
      const value = next == null || next.startsWith('--') ? true : next
      if (parsed[key] == null) parsed[key] = value
      else parsed[key] = Array.isArray(parsed[key]) ? parsed[key].concat(value) : [parsed[key], value]
      if (value !== true) i += 1
    } else {
      parsed._.push(arg)
    }
  }
  return parsed
}

main().catch((error) => { console.error(error); process.exit(1) })
