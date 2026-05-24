#!/usr/bin/env node
const { generateLeadDemo } = require('../generateLeadDemo')

function main(argv) {
  const args = parseArgs(argv)
  if (!args.shortlistPath || args.help) {
    printUsage()
    process.exit(args.help ? 0 : 1)
  }
  const result = generateLeadDemo(args)
  process.stdout.write(JSON.stringify({
    outDir: result.outDir,
    indexPath: result.indexPath,
    manifestPath: result.manifestPath,
    runId: result.runId,
    businessSlug: result.businessSlug,
  }, null, 2) + '\n')
}

function parseArgs(argv) {
  const args = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') args.help = true
    else if (arg === '--run-id') args.runId = argv[++index]
    else if (arg === '--out-root') args.outRoot = argv[++index]
    else if (arg === '--index') args.index = argv[++index]
    else if (arg === '--lead') args.lead = argv[++index]
    else if (!args.shortlistPath) args.shortlistPath = arg
    else throw new Error('Unexpected argument: ' + arg)
  }
  return args
}

function printUsage() {
  process.stderr.write('Usage: node core/demo-generator/cli/generate-demo.js <crm-shortlisted-leads.csv> [--run-id <id>] [--index <n>] [--lead <name>] [--out-root <dir>]\n')
}

if (require.main === module) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(error.message + '\n')
    process.exit(1)
  }
}

module.exports = { parseArgs }
