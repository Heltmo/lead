#!/usr/bin/env node
const { runLeadMachine, parseArgs } = require('../leadMachine')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.query) {
    console.error('Usage: npm run lead-machine -- --query "advokater i Gol" --provider google-places --max-results 5 --search-scope strict')
    process.exitCode = 1
    return
  }
  const result = await runLeadMachine({
    query: args.query,
    provider: args.provider,
    maxResults: args.maxResults || args['max-results'],
    searchScope: args.searchScope || args['search-scope'],
    enrichCompanyProfile: args.enrichCompanyProfile || args['enrich-company-profile'],
    outputDir: args.outputDir || args['output-dir'],
    runId: args.runId || args['run-id'],
    mockResultsPath: args.mockResultsPath || args['mock-results'],
    validate: args.validate,
  })
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error)
  process.exitCode = 1
})
