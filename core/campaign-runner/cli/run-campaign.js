#!/usr/bin/env node
const { runCampaign } = require('../runCampaign')

async function main(argv) {
  const args = parseArgs(argv)
  if (args.help || !args.query) {
    printUsage()
    process.exit(args.help ? 0 : 1)
  }
  const result = await runCampaign({
    query: args.query,
    maxLeads: args['max-leads'] ? Number(args['max-leads']) : undefined,
    demoCount: args['demo-count'] ? Number(args['demo-count']) : undefined,
    runId: args['run-id'],
    provider: args.provider,
    sourceFiles: args.source,
    validate: args.validate === 'false' ? false : undefined,
    timeoutMs: args.timeout ? Number(args.timeout) : undefined,
    maxProviderQueries: args['max-provider-queries'] ? Number(args['max-provider-queries']) : undefined,
    mockResultsPath: args['mock-results'],
  })
  process.stdout.write(JSON.stringify({
    campaignId: result.campaignId,
    campaignDir: result.paths.campaignDir,
    campaignJsonPath: result.paths.campaignJsonPath,
    campaignSummaryPath: result.paths.campaignSummaryPath,
    reviewWorkspacePath: result.paths.reviewWorkspaceIndexPath,
    crmExportPath: result.paths.crmShortlistedPath,
    demoPaths: result.demoResults.map((demo) => demo.indexPath),
    discoveredCount: result.counts.discoveredCount,
    auditEligibleCount: result.counts.auditEligibleCount,
    auditedCount: result.counts.auditedCount,
    failedCount: result.counts.failedCount,
  }, null, 2) + '\n')
}

function parseArgs(argv) {
  const parsed = { _: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') parsed.help = true
    else if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[index + 1]
      const value = next == null || next.startsWith('--') ? true : next
      if (parsed[key] == null) parsed[key] = value
      else parsed[key] = Array.isArray(parsed[key]) ? parsed[key].concat(value) : [parsed[key], value]
      if (value !== true) index += 1
    } else {
      parsed._.push(arg)
    }
  }
  return parsed
}

function printUsage() {
  process.stderr.write([
    'Usage: node core/campaign-runner/cli/run-campaign.js --query "tannleger i Halden" [options]',
    '',
    'Options:',
    '  --source <path>             Source file. Repeatable.',
    '  --provider <brave|mock>     Optional live/search provider.',
    '  --max-leads <n>             Max candidates to audit.',
    '  --demo-count <n>            Number of demos to generate.',
    '  --run-id <id>               Optional campaign/run id.',
    '  --validate false            Disable reachability validation.',
    '  --mock-results <path>       Mock provider results for tests.',
  ].join('\n') + '\n')
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write((error && error.stack ? error.stack : String(error)) + '\n')
    process.exit(1)
  })
}

module.exports = { parseArgs }
