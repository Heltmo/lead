const fs = require('fs')
const http = require('http')
const path = require('path')
const os = require('os')
const { runLeadMachine, createLeadMachineRunId, parseArgs, slugify, buildNextRecommendedAction, formatTerminalSummary } = require('../leadMachine')
const { loadEnvFiles, parseEnvLine } = require('../loadEnv')

async function main() {
  const args = parseArgs(['--query', 'advokater i Gol', '--max-results', '5', '--search-scope', 'strict'])
  assert(args.query === 'advokater i Gol', 'CLI args should parse query')
  assert(args['max-results'] === '5', 'CLI args should parse max-results')
  assert(args['search-scope'] === 'strict', 'CLI args should parse search-scope')
  assert(slugify('Advokater i Gol') === 'advokater-i-gol', 'slugify should normalize query')
  assert(createLeadMachineRunId('Advokater i Gol').startsWith('advokater-i-gol-'), 'run id should include query slug')
  assert(parseEnvLine('GOOGLE_PLACES_API_KEY=abc123').value === 'abc123', 'env parser should parse simple key values')
  assert(parseEnvLine('PROFF_API_KEY="token value"').value === 'token value', 'env parser should strip quotes')
  const envRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lead-machine-env-'))
  const envPath = path.join(envRoot, '.env')
  const fakeEnv = { GOOGLE_PLACES_API_KEY: 'existing' }
  fs.writeFileSync(envPath, 'GOOGLE_PLACES_API_KEY=from-file\nBRAVE_SEARCH_API_KEY=brave-test\n')
  const loadedKeys = loadEnvFiles([envPath], fakeEnv)
  assert(fakeEnv.GOOGLE_PLACES_API_KEY === 'existing', 'env loader should not override existing process values')
  assert(fakeEnv.BRAVE_SEARCH_API_KEY === 'brave-test', 'env loader should load missing provider keys')
  assert(loadedKeys.includes('BRAVE_SEARCH_API_KEY'), 'env loader should report loaded keys')
  fs.rmSync(envRoot, { recursive: true, force: true })

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
  assert(summary.includedLeadCount === 1, 'summary should expose includedLeadCount')
  assert(summary.totalExcludedByLocation === 1, 'summary should count location-excluded candidates')
  assert(summary.lowSupply === true, 'strict low local supply should be preserved')
  assert(summary.fallbackAvailable === true, 'fallback availability should be preserved')
  assert(summary.fallbackUsed === false, 'strict mode should not use fallback')
  assert(summary.nextRecommendedAction === 'Review exact leads, or expand to nearby if more volume is needed.', 'strict low supply action should be clear')
  assert(summary.companyProfileEnabled === false, 'company profile should stay disabled')
  assert(summary.economyStatus === 'not_enabled', 'economy should remain not_enabled')
  assert(leadPackSummary.searchScope === 'strict', 'lead-pack summary should preserve search scope')
  assert(leadPackSummary.lowSupply === true, 'lead-pack summary should preserve lowSupply')
  assert(leadPacks.length === 1, 'strict mode should package only exact-location lead')
  assert(leadPacks[0].sourceQuality.searchScope === 'strict', 'lead pack should include sourceQuality search scope')
  assert(leadPacks[0].sourceQuality.locationMatchStatus === 'exact_location', 'lead pack should include location status')
  assert(csv.includes('searchScope'), 'CSV should include searchScope column')
  assert(!JSON.stringify(leadPacks).toLowerCase().includes('call opener'), 'lead-machine should not generate outreach scripts')

  const fastOutputDir = path.join(root, 'fast-run')
  const fastResult = await runLeadMachine({
    query: 'advokater i Gol',
    provider: 'mock',
    mockResultsPath,
    maxResults: 5,
    searchScope: 'strict',
    mode: 'fast',
    enrichCompanyProfile: false,
    outputDir: fastOutputDir,
    runId: 'fixture-fast-lead-machine',
    validate: false,
  })
  const fastSummary = JSON.parse(fs.readFileSync(fastResult.summaryPath, 'utf8'))
  const fastPacks = JSON.parse(fs.readFileSync(path.join(fastResult.leadPackOutputPath, 'lead-packs.json'), 'utf8'))
  const fastCsv = fs.readFileSync(path.join(fastResult.leadPackOutputPath, 'lead-packs.csv'), 'utf8')
  assert(fastSummary.mode === 'fast', 'fast mode summary should preserve mode')
  assert(fastSummary.auditStatus === 'skipped_fast_mode', 'fast scan should keep browser audit out of the main product')
  assert(fastPacks.length === 1, 'fast strict mode should package exact-location discovery candidates')
  assert(fastPacks[0].website.auditStatus === 'skipped_fast_mode', 'fast lead pack should mark audit skipped')
  assert(fastPacks[0].callPriority === 'verify', 'fast lead pack should require verification instead of call-first priority')
  assert(fastPacks[0].leadClass === 'fast_discovery', 'fast lead pack should use fast discovery lead class')
  assert(fastPacks[0].contact.phone === '41 00 00 00', 'fast lead pack should preserve phone from discovery')
  assert(fastCsv.includes('skipped_fast_mode'), 'fast CSV should expose skipped audit status')

  const sweepFixturePath = path.join(root, 'sweep-places.json')
  fs.writeFileSync(sweepFixturePath, JSON.stringify({
    places: [
      {
        id: 'places/oslo-advokat',
        displayName: { text: 'Oslo Advokat AS' },
        websiteUri: 'https://oslo-advokat.example',
        nationalPhoneNumber: '+47 22 00 00 00',
        formattedAddress: 'Storgata 1, 0184 Oslo, Norway',
        businessStatus: 'OPERATIONAL',
        types: ['lawyer'],
      },
      {
        id: 'places/bergen-advokat',
        displayName: { text: 'Bergen Advokat AS' },
        websiteUri: 'https://bergen-advokat.example',
        nationalPhoneNumber: '+47 55 00 00 00',
        formattedAddress: 'Bryggen 1, 5003 Bergen, Norway',
        businessStatus: 'OPERATIONAL',
        types: ['lawyer'],
      },
    ],
  }, null, 2))
  const sweepOutputDir = path.join(root, 'sweep-run')
  const sweepResult = await runLeadMachine({
    query: 'advokat',
    provider: 'mock',
    mockResultsPath: sweepFixturePath,
    maxResults: 60,
    searchScope: 'regional',
    marketSweep: true,
    maxProviderQueries: 2,
    perProviderQueryMaxResults: 5,
    mode: 'fast',
    enrichCompanyProfile: false,
    outputDir: sweepOutputDir,
    runId: 'fixture-sweep-lead-machine',
    validate: false,
  })
  const sweepSummary = JSON.parse(fs.readFileSync(sweepResult.summaryPath, 'utf8'))
  const sweepPacks = JSON.parse(fs.readFileSync(path.join(sweepResult.leadPackOutputPath, 'lead-packs.json'), 'utf8'))
  const sweepCsv = fs.readFileSync(path.join(sweepResult.leadPackOutputPath, 'lead-packs.csv'), 'utf8')
  assert(sweepSummary.marketSweep === true, 'market sweep summary should be marked')
  assert(sweepSummary.marketSweepCities.length === 2, 'market sweep summary should preserve searched cities')
  assert(sweepSummary.marketSweepCityCounts.Bergen === 1 && sweepSummary.marketSweepCityCounts.Oslo === 1, 'market sweep should count leads by city')
  assert(sweepPacks[0].contact.city === 'Bergen', 'market sweep lead packs should sort by city')
  assert(sweepCsv.includes('marketSweepCity'), 'market sweep CSV should include city grouping column')

  assert(buildNextRecommendedAction({ searchScope: 'strict', includedLeadCount: 0, lowSupply: true, fallbackAvailable: true, fallbackUsed: false, recommendedExpansion: 'nearby', callPriorityCounts: {} }) === 'Run again with --search-scope nearby or regional.', 'zero strict supply should recommend expansion')
  assert(buildNextRecommendedAction({ searchScope: 'regional', includedLeadCount: 4, lowSupply: false, fallbackAvailable: false, fallbackUsed: true, recommendedExpansion: null, callPriorityCounts: { medium: 4 } }) === 'Review fallback location warnings before treating these as local leads.', 'regional fallback should warn')
  assert(buildNextRecommendedAction({ searchScope: 'strict', includedLeadCount: 2, lowSupply: false, fallbackAvailable: false, fallbackUsed: false, recommendedExpansion: null, callPriorityCounts: { high: 1, medium: 1 } }) === 'Review HIGH leads first.', 'HIGH leads should be reviewed first')
  assert(buildNextRecommendedAction({ searchScope: 'strict', includedLeadCount: 2, lowSupply: false, fallbackAvailable: false, fallbackUsed: false, recommendedExpansion: null, callPriorityCounts: { medium: 2 } }) === 'Review top MEDIUM leads as shortlist.', 'MEDIUM-only results should recommend shortlist review')
  const fastTerminalSummary = formatTerminalSummary(fastSummary)
  assert(fastTerminalSummary.includes('Mode: fast'), 'terminal summary should show fast mode')

  const terminalSummary = formatTerminalSummary(summary)
  assert(terminalSummary.includes('Lead Machine Run Complete'), 'terminal summary should have clear title')
  assert(terminalSummary.includes('Query: advokater i Gol'), 'terminal summary should show query')
  assert(terminalSummary.includes('Included leads: 1'), 'terminal summary should show included count')
  assert(terminalSummary.includes('Next action:'), 'terminal summary should show next action')
  assert(!terminalSummary.toLowerCase().includes('call opener'), 'terminal summary should not include outreach scripts')

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
