#!/usr/bin/env node
const { generateDemoForLead } = require('../generateDemoForLead')

function main(argv) {
  const args = parseArgs(argv)
  if (args.help || !args.run || !args.lead) {
    printUsage()
    process.exit(args.help ? 0 : 1)
  }
  const result = generateDemoForLead({
    run: args.run,
    lead: args.lead,
    out: args.out,
    statusPath: args.status,
    leadsCsvPath: args.leads,
  })
  process.stdout.write(JSON.stringify({
    outDir: result.outDir,
    indexPath: result.indexPath,
    manifestPath: result.manifestPath,
    runId: result.runId,
    businessSlug: result.businessSlug,
    selectedLead: result.selectedLead,
  }, null, 2) + '\n')
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--run') args.run = argv[++index]
    else if (arg === '--lead') args.lead = argv[++index]
    else if (arg === '--out') args.out = argv[++index]
    else if (arg === '--status') args.status = argv[++index]
    else if (arg === '--leads') args.leads = argv[++index]
    else throw new Error('Unexpected argument: ' + arg)
  }
  return args
}

function printUsage() {
  process.stderr.write('Usage: node core/demo-generator/cli/generate-demo-for-lead.js --run <summary.json> --lead <domain|url|id|business name> [--out <dir>]\n')
}

if (require.main === module) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    process.stderr.write((error && error.stack ? error.stack : String(error)) + '\n')
    process.exit(1)
  }
}

module.exports = { parseArgs }
