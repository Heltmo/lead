#!/usr/bin/env node
const { runLeadPack } = require('../leadPackRunner')

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.runDir && !args['run-dir']) {
    console.error('Usage: npm run lead-pack -- --run-dir ../orchestrator/runs/example --output-dir ./runs/example --enrich-company-profile false')
    process.exitCode = 1
    return
  }
  const result = await runLeadPack({
    query: args.query,
    runDir: args.runDir || args['run-dir'],
    outputDir: args.outputDir || args['output-dir'],
    enrichCompanyProfile: args.enrichCompanyProfile || args['enrich-company-profile'],
  })
  console.log(JSON.stringify(result, null, 2))
}

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) out[key] = true
    else { out[key] = next; i += 1 }
  }
  return out
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error)
  process.exitCode = 1
})
