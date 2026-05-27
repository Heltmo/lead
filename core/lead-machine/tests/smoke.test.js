const fs = require('fs')
const http = require('http')
const path = require('path')
const os = require('os')
const { runLeadMachine, createLeadMachineRunId, parseArgs, slugify } = require('../leadMachine')

async function main() {
  const args = parseArgs(['--query', 'advokater i Gol', '--max-results', '5', '--search-scope', 'strict'])
  assert(args.query === 'advokater i Gol', 'CLI args should parse query')
  assert(args['max-results'] === '5', 'CLI args should parse max-results')
  assert(args['search-scope'] === 'strict', 'CLI args should parse search-scope')
  assert(slugify('Advokater i Gol') === 'advokater-i-gol', 'slugify should normalize query')
  assert(createLeadMachineRunId('Advokater i Gol').startsWith('advokater-i-gol-'), 'run id should include query slug')

  const server = http.createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/html' })
    response.end('<title>Gol Advokat</title><h1>Gol Advokat</h1><a href="/kontakt">Kontakt oss</a><p>post@gol-advokat.test</p><p>41 00 00 00</p>')
  })
  await listen(server)
  const port = server.address().port
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'lead-machine-'))
  const mockResultsPath = path.join(root, 'places.json')
  fs.writeFileSync(mockResultsPath, JSON.stringify({
    places: [
      {
        id: 'places/gol-advokat',
        displayName: { text: 'Gol Advokat AS' },
        websiteUri: `http://127.0.0.1:${port}`,
        nationalPhoneNumber: '41 00 00 00',
        formattedAddress: 'Sentrumsvegen 1, 3550 Gol, Norway',
        businessStatus: 'OPERATIONAL',
        types: ['lawyer'],
      },
      {
        id: 'places/halden-advokat',
        displayName: { text: 'Halden Advokat AS' },
        websiteUri: 'https://halden-advokat.example',
        formattedAddress: 'Tollbugata 5, 1767 Halden, Norway',
        businessStatus: 'OPERATIONAL',
        types: ['lawyer'],
      },
    ],
  }, null, 2))

  const outputDir = path.join(root, 'run')
  const result = await runLeadMachine({
    query: 'advokater i Gol',
    provider: 'mock',
    mockResultsPath,
    maxResults: 5,
    searchScope: 'strict',
    enrichCompanyProfile: false,
    outputDir,
    runId: 'fixture-lead-machine',
    orchestratorRootDir: path.join(root, 'orchestrator-runs'),
    validate: false,
  })
  const summary = JSON.parse(fs.readFileSync(result.summaryPath, 'utf8'))
  const leadPackSummary = JSON.parse(fs.readFileSync(path.join(result.leadPackOutputPath, 'summary.json'), 'utf8'))
  const leadPacks = JSON.parse(fs.readFileSync(path.join(result.leadPackOutputPath, 'lead-packs.json'), 'utf8'))
  const csv = fs.readFileSync(path.join(result.leadPackOutputPath, 'lead-packs.csv'), 'utf8')

  assert(fs.existsSync(path.join(result.leadPackOutputPath, 'lead-packs.json')), 'lead-packs.json should be written')
  assert(fs.existsSync(path.join(result.leadPackOutputPath, 'lead-packs.csv')), 'lead-packs.csv should be written')
  assert(fs.existsSync(path.join(result.leadPackOutputPath, 'summary.json')), 'summary.json should be written')
  assert(summary.query === 'advokater i Gol', 'lead-machine summary should preserve query')
  assert(summary.provider === 'mock', 'lead-machine summary should preserve provider')
  assert(summary.searchScope === 'strict', 'lead-machine summary should preserve search scope')
  assert(summary.totalDiscovered === 2, 'lead-machine summary should count discovered candidates')
  assert(summary.totalIncluded === 1, 'lead-machine summary should count included lead packs')
  assert(summary.lowSupply === true, 'strict low local supply should be preserved')
  assert(summary.fallbackAvailable === true, 'fallback availability should be preserved')
  assert(summary.fallbackUsed === false, 'strict mode should not use fallback')
  assert(summary.companyProfileEnabled === false, 'company profile should stay disabled')
  assert(summary.economyStatus === 'not_enabled', 'economy should remain not_enabled')
  assert(leadPackSummary.searchScope === 'strict', 'lead-pack summary should preserve search scope')
  assert(leadPackSummary.lowSupply === true, 'lead-pack summary should preserve lowSupply')
  assert(leadPacks.length === 1, 'strict mode should package only exact-location lead')
  assert(leadPacks[0].sourceQuality.searchScope === 'strict', 'lead pack should include sourceQuality search scope')
  assert(leadPacks[0].sourceQuality.locationMatchStatus === 'exact_location', 'lead pack should include location status')
  assert(csv.includes('searchScope'), 'CSV should include searchScope column')
  assert(!JSON.stringify(leadPacks).toLowerCase().includes('call opener'), 'lead-machine should not generate outreach scripts')

  server.close()
  fs.rmSync(root, { recursive: true, force: true })
}

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error)
  process.exitCode = 1
})
